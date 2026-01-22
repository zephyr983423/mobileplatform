import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { apiSuccess, handleApiError, apiError } from "@/lib/api-response";
import { authorize } from "@/lib/auth/authorize";
import { createDeviceSchema } from "@/lib/validations";
import { createAuditLog, AuditAction } from "@/lib/audit";
import { Permission } from "@prisma/client";

/**
 * GET /api/staff/devices
 * Staff: List all devices with search and pagination
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    await authorize(session.user, Permission.DEVICE_READ);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const where: any = {};

    if (search) {
      where.OR = [
        { brand: { contains: search, mode: "insensitive" } },
        { model: { contains: search, mode: "insensitive" } },
        { imei: { contains: search, mode: "insensitive" } },
        { color: { contains: search, mode: "insensitive" } },
        {
          customer: {
            name: { contains: search, mode: "insensitive" },
          },
        },
      ];
    }

    const devices = await prisma.device.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        serviceCases: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            serviceRounds: {
              orderBy: { startedAt: "desc" },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const total = await prisma.device.count({ where });

    return apiSuccess({
      devices,
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
 * POST /api/staff/devices
 * Staff: Register a new device
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    await authorize(session.user, Permission.DEVICE_WRITE);

    const body = await req.json();
    const validated = createDeviceSchema.parse(body);

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: validated.customerId },
    });

    if (!customer) {
      return apiError("Customer not found", 404);
    }

    // Create device
    const device = await prisma.device.create({
      data: {
        customerId: validated.customerId,
        brand: validated.brand,
        model: validated.model,
        imei: validated.imei,
        color: validated.color,
        storage: validated.storage,
      },
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
      action: AuditAction.CREATE_DEVICE,
      resource: "Device",
      resourceId: device.id,
      details: {
        brand: device.brand,
        model: device.model,
        customerId: device.customerId,
      },
    });

    return apiSuccess(device, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
