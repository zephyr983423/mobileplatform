import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { apiSuccess, handleApiError, apiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/authorize";

/**
 * GET /api/me/devices/[id]
 * Customer: Get full device history with all service cases and rounds
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    requireRole(session.user, "CUSTOMER");

    if (!session.user.customerId) {
      return apiError("Customer profile not found", 404);
    }

    const deviceId = params.id;

    // Fetch device with ownership check
    const device = await prisma.device.findFirst({
      where: {
        id: deviceId,
        customerId: session.user.customerId, // CRITICAL: ownership check
      },
      include: {
        serviceCases: {
          orderBy: { createdAt: "desc" },
          include: {
            serviceRounds: {
              orderBy: { startedAt: "desc" },
              include: {
                statusEvents: {
                  orderBy: { createdAt: "desc" },
                  include: {
                    operator: {
                      select: {
                        id: true,
                        username: true,
                      },
                    },
                  },
                },
                shipments: {
                  orderBy: { createdAt: "desc" },
                },
              },
            },
          },
        },
      },
    });

    if (!device) {
      return apiError("Device not found", 404);
    }

    return apiSuccess({ device });
  } catch (error) {
    return handleApiError(error);
  }
}
