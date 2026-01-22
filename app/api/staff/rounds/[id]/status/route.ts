import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { apiSuccess, handleApiError, apiError } from "@/lib/api-response";
import { authorize } from "@/lib/auth/authorize";
import { updateStatusSchema } from "@/lib/validations";
import { createAuditLog, AuditAction } from "@/lib/audit";
import { Permission } from "@prisma/client";

/**
 * POST /api/staff/rounds/[id]/status
 * Staff: Update service round status (creates status event)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    await authorize(session.user, Permission.CASE_WRITE);

    const roundId = params.id;
    const body = await req.json();
    const validated = updateStatusSchema.parse(body);

    // Get current round
    const round = await prisma.serviceRound.findUnique({
      where: { id: roundId },
    });

    if (!round) {
      return apiError("Service round not found", 404);
    }

    // Update round status and create status event in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create status event
      const statusEvent = await tx.statusEvent.create({
        data: {
          serviceRoundId: roundId,
          fromStatus: round.status,
          toStatus: validated.toStatus,
          notes: validated.notes,
          location: validated.location,
          operatorId: session.user.id,
        },
      });

      // Update round status
      const updatedRound = await tx.serviceRound.update({
        where: { id: roundId },
        data: {
          status: validated.toStatus,
          // Auto-set completedAt when status reaches CLOSED or DELIVERED
          completedAt:
            validated.toStatus === "CLOSED" ||
            validated.toStatus === "DELIVERED"
              ? new Date()
              : undefined,
        },
        include: {
          statusEvents: {
            orderBy: { createdAt: "desc" },
            take: 5,
            include: {
              operator: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
        },
      });

      return { statusEvent, round: updatedRound };
    });

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: AuditAction.UPDATE_STATUS,
      resource: "ServiceRound",
      resourceId: roundId,
      details: {
        from: round.status,
        to: validated.toStatus,
        location: validated.location,
      },
    });

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
