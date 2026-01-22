import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { apiSuccess, handleApiError, apiError } from "@/lib/api-response";
import { authorize } from "@/lib/auth/authorize";
import { createShipmentSchema } from "@/lib/validations";
import { createAuditLog, AuditAction } from "@/lib/audit";
import { Permission, ShipmentType, ShipmentStatus } from "@prisma/client";

/**
 * GET /api/staff/shipments
 * Staff: List shipments with filtering
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    await authorize(session.user, Permission.SHIPMENT_READ);

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as ShipmentType | null;
    const status = searchParams.get("status") as ShipmentStatus | null;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    const shipments = await prisma.shipment.findMany({
      where,
      include: {
        serviceRound: {
          include: {
            serviceCase: {
              select: {
                id: true,
                caseNumber: true,
                title: true,
              },
            },
          },
        },
        operator: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const total = await prisma.shipment.count({ where });

    return apiSuccess({
      shipments,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/staff/shipments
 * Staff: Create a new shipment record
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    await authorize(session.user, Permission.SHIPMENT_WRITE);

    const body = await req.json();
    const validated = createShipmentSchema.parse(body);

    // Check service round exists
    const serviceRound = await prisma.serviceRound.findUnique({
      where: { id: validated.serviceRoundId },
    });

    if (!serviceRound) {
      return apiError("Service round not found", 404);
    }

    // Create shipment
    const shipment = await prisma.shipment.create({
      data: {
        serviceRoundId: validated.serviceRoundId,
        type: validated.type,
        trackingNumber: validated.trackingNumber,
        carrier: validated.carrier,
        origin: validated.origin,
        destination: validated.destination,
        notes: validated.notes,
        estimatedArrival: validated.estimatedArrival,
        status: "PENDING",
        operatorId: session.user.id,
      },
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
      action: AuditAction.CREATE_SHIPMENT,
      resource: "Shipment",
      resourceId: shipment.id,
      details: {
        type: shipment.type,
        serviceRoundId: shipment.serviceRoundId,
      },
    });

    return apiSuccess(shipment, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
