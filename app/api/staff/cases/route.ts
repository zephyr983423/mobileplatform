import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { apiSuccess, handleApiError, apiError } from "@/lib/api-response";
import { authorize } from "@/lib/auth/authorize";
import { createServiceCaseSchema } from "@/lib/validations";
import { createAuditLog, AuditAction } from "@/lib/audit";
import { Permission } from "@prisma/client";

/**
 * GET /api/staff/cases
 * Staff: List service cases (based on permissions)
 */
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const where: any = {};

    if (search) {
      where.OR = [
        { caseNumber: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
        {
          device: {
            OR: [
              { brand: { contains: search, mode: "insensitive" } },
              { model: { contains: search, mode: "insensitive" } },
              { imei: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const cases = await prisma.serviceCase.findMany({
      where,
      include: {
        device: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
        serviceRounds: {
          orderBy: { startedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const total = await prisma.serviceCase.count({ where });

    return apiSuccess({
      cases,
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
 * POST /api/staff/cases
 * Staff: Create a new service case
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    await authorize(session.user, Permission.CASE_WRITE);

    const body = await req.json();
    const validated = createServiceCaseSchema.parse(body);

    // Generate unique case number
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const count = await prisma.serviceCase.count({
      where: {
        caseNumber: {
          startsWith: `CS${dateStr}`,
        },
      },
    });
    const caseNumber = `CS${dateStr}${String(count + 1).padStart(3, "0")}`;

    // Create case with first round
    const serviceCase = await prisma.serviceCase.create({
      data: {
        deviceId: validated.deviceId,
        caseNumber,
        title: validated.title,
        description: validated.description,
        serviceRounds: {
          create: {
            roundNo: 1,
            issue: validated.issue,
            status: "PENDING",
          },
        },
      },
      include: {
        serviceRounds: true,
        device: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: AuditAction.CREATE_CASE,
      resource: "ServiceCase",
      resourceId: serviceCase.id,
      details: {
        caseNumber: serviceCase.caseNumber,
        deviceId: validated.deviceId,
      },
    });

    return apiSuccess(serviceCase, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
