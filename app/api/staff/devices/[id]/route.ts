import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { apiSuccess, handleApiError, apiError } from "@/lib/api-response";
import { authorize } from "@/lib/auth/authorize";
import { createAuditLog, AuditAction } from "@/lib/audit";
import { Permission } from "@prisma/client";
import { z } from "zod";

const updateDeviceSchema = z.object({
  brand: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  imei: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  storage: z.string().optional().nullable(),
});

/**
 * GET /api/staff/devices/[id]
 * Staff: Get device details with full service history
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

    await authorize(session.user, Permission.DEVICE_READ);

    const device = await prisma.device.findUnique({
      where: { id: params.id },
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
        serviceCases: {
          orderBy: { createdAt: "desc" },
          include: {
            serviceRounds: {
              orderBy: { startedAt: "desc" },
              include: {
                statusEvents: {
                  orderBy: { createdAt: "desc" },
                  take: 1,
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

/**
 * PATCH /api/staff/devices/[id]
 * Staff: Update device information
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

    await authorize(session.user, Permission.DEVICE_WRITE);

    const body = await req.json();
    const validated = updateDeviceSchema.parse(body);

    // Check device exists
    const existingDevice = await prisma.device.findUnique({
      where: { id: params.id },
    });

    if (!existingDevice) {
      return apiError("Device not found", 404);
    }

    // Update device
    const device = await prisma.device.update({
      where: { id: params.id },
      data: validated,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: AuditAction.UPDATE_DEVICE,
      resource: "Device",
      resourceId: device.id,
      details: validated,
    });

    return apiSuccess({ device });
  } catch (error) {
    return handleApiError(error);
  }
}
