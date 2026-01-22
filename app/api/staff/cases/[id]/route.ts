import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { apiSuccess, handleApiError, apiError } from "@/lib/api-response";
import { authorize } from "@/lib/auth/authorize";
import { Permission } from "@prisma/client";

/**
 * GET /api/staff/cases/[id]
 * Staff: Get detailed service case with all rounds, events, and shipments
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

    // Check permission
    await authorize(session.user, [
      Permission.CASE_READ_ALL,
      Permission.CASE_READ_ASSIGNED,
    ]);

    const caseId = params.id;

    // Fetch complete service case with all details (倒序排列)
    const serviceCase = await prisma.serviceCase.findUnique({
      where: {
        id: caseId,
      },
      include: {
        device: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                address: true,
              },
            },
          },
        },
        serviceRounds: {
          orderBy: { startedAt: "desc" }, // 最新轮次在前
          include: {
            statusEvents: {
              orderBy: { createdAt: "desc" }, // 最新状态在前
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
              orderBy: { createdAt: "desc" }, // 最新物流在前
            },
          },
        },
      },
    });

    if (!serviceCase) {
      return apiError("Service case not found", 404);
    }

    return apiSuccess({ serviceCase });
  } catch (error) {
    return handleApiError(error);
  }
}
