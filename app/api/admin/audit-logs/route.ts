import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { apiSuccess, handleApiError, apiError } from "@/lib/api-response";
import { requireRole, authorize } from "@/lib/auth/authorize";
import { Permission } from "@prisma/client";

/**
 * GET /api/admin/audit-logs
 * Admin: List audit logs with filtering and pagination
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    // BOSS always has access, or check AUDIT_READ permission
    if (session.user.role !== "BOSS") {
      await authorize(session.user, Permission.AUDIT_READ);
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || undefined;
    const action = searchParams.get("action") || undefined;
    const resource = searchParams.get("resource") || undefined;
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (resource) {
      where.resource = resource;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const total = await prisma.auditLog.count({ where });

    // Get unique actions and resources for filters
    const uniqueActions = await prisma.auditLog.findMany({
      where,
      select: { action: true },
      distinct: ["action"],
    });

    const uniqueResources = await prisma.auditLog.findMany({
      where,
      select: { resource: true },
      distinct: ["resource"],
    });

    return apiSuccess({
      logs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      filters: {
        actions: uniqueActions.map((a) => a.action),
        resources: uniqueResources.map((r) => r.resource),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
