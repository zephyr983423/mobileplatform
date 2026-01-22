import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { apiSuccess, handleApiError, apiError } from "@/lib/api-response";
import { authorize } from "@/lib/auth/authorize";
import { updateShipmentSchema } from "@/lib/validations";
import { createAuditLog, AuditAction } from "@/lib/audit";
import { Permission } from "@prisma/client";

/**
 * PATCH /api/staff/shipments/[id]
 * Staff: Update shipment status and details
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    await authorize(session.user, Permission.SHIPMENT_WRITE);

    const body = await req.json();
    const validated = updateShipmentSchema.parse(body);

    // Check shipment exists
    const existingShipment = await prisma.shipment.findUnique({
      where: { id: params.id },
    });

    if (!existingShipment) {
      return apiError("Shipment not found", 404);
    }

    // Prepare update data
    const updateData: any = {
      ...validated,
    };

    // Auto-set timestamps based on status
    if (validated.status) {
      if (validated.status === "IN_TRANSIT" && !existingShipment.shippedAt) {
        updateData.shippedAt = new Date();
      }
      if (
        (validated.status === "SIGNED" || validated.status === "ARRIVED") &&
        !existingShipment.actualArrival
      ) {
        updateData.actualArrival = new Date();
      }
    }

    // Update shipment
    const shipment = await prisma.shipment.update({
      where: { id: params.id },
      data: updateData,
      include: {
        serviceRound: {
          include: {
            serviceCase: {
              select: {
                caseNumber: true,
              },
            },
          },
        },
      },
    });

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: AuditAction.UPDATE_SHIPMENT,
      resource: "Shipment",
      resourceId: shipment.id,
      details: validated,
    });

    return apiSuccess({ shipment });
  } catch (error) {
    return handleApiError(error);
  }
}
