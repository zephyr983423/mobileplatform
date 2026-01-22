import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { apiSuccess, handleApiError, apiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/authorize";

/**
 * GET /api/me/overview
 * Customer: Get overview of all their devices with latest status
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    // Only customers can access this
    requireRole(session.user, "CUSTOMER");

    if (!session.user.customerId) {
      return apiError("Customer profile not found", 404);
    }

    // Fetch all devices with latest service case info
    const devices = await prisma.device.findMany({
      where: {
        customerId: session.user.customerId,
      },
      include: {
        serviceCases: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            serviceRounds: {
              orderBy: { startedAt: "desc" },
              take: 1,
              include: {
                statusEvents: {
                  orderBy: { createdAt: "desc" },
                  take: 1,
                },
                shipments: {
                  orderBy: { createdAt: "desc" },
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform to overview format
    const overview = devices.map((device) => {
      const latestCase = device.serviceCases[0];
      const latestRound = latestCase?.serviceRounds[0];
      const latestStatus = latestRound?.statusEvents[0];
      const latestShipment = latestRound?.shipments[0];

      return {
        id: device.id,
        brand: device.brand,
        model: device.model,
        color: device.color,
        storage: device.storage,
        latestCase: latestCase
          ? {
              id: latestCase.id,
              caseNumber: latestCase.caseNumber,
              title: latestCase.title,
              status: latestRound?.status,
              lastUpdated: latestStatus?.createdAt || latestRound?.updatedAt,
              location: latestStatus?.location,
              tracking: latestShipment
                ? {
                    carrier: latestShipment.carrier,
                    trackingNumber: latestShipment.trackingNumber,
                    status: latestShipment.status,
                    currentLocation: latestShipment.currentLocation,
                  }
                : null,
            }
          : null,
      };
    });

    return apiSuccess({ devices: overview });
  } catch (error) {
    return handleApiError(error);
  }
}
