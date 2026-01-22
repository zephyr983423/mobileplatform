import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { apiSuccess, handleApiError, apiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/authorize";
import { ServiceStatus } from "@prisma/client";

/**
 * GET /api/admin/reports/stats
 * Admin: Get statistical data for dashboards and reports
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    requireRole(session.user, "BOSS");

    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Date range filter
    const dateFilter: any = {};
    if (dateFrom) {
      dateFilter.gte = new Date(dateFrom);
    }
    if (dateTo) {
      dateFilter.lte = new Date(dateTo);
    }

    const where: any = {};
    if (Object.keys(dateFilter).length > 0) {
      where.createdAt = dateFilter;
    }

    // 1. Total cases
    const totalCases = await prisma.serviceCase.count({ where });

    // 2. Status distribution (based on latest service round)
    const statusDistribution: Record<string, number> = {};
    const allRounds = await prisma.serviceRound.findMany({
      where: {
        serviceCase: where,
      },
      select: {
        id: true,
        status: true,
        serviceCaseId: true,
        startedAt: true,
      },
      orderBy: {
        startedAt: "desc",
      },
    });

    // Group by serviceCaseId and get latest status
    const latestStatusMap = new Map<string, ServiceStatus>();
    allRounds.forEach((round) => {
      if (!latestStatusMap.has(round.serviceCaseId)) {
        latestStatusMap.set(round.serviceCaseId, round.status);
      }
    });

    // Count statuses
    latestStatusMap.forEach((status) => {
      statusDistribution[status] = (statusDistribution[status] || 0) + 1;
    });

    // 3. Average resolution time (for completed cases)
    const completedRounds = await prisma.serviceRound.findMany({
      where: {
        completedAt: { not: null },
        serviceCase: where,
      },
      select: {
        startedAt: true,
        completedAt: true,
      },
    });

    let averageResolutionTime = 0;
    if (completedRounds.length > 0) {
      const totalTime = completedRounds.reduce((sum, round) => {
        const start = new Date(round.startedAt).getTime();
        const end = round.completedAt ? new Date(round.completedAt).getTime() : start;
        return sum + (end - start);
      }, 0);
      averageResolutionTime = totalTime / completedRounds.length / (1000 * 60 * 60 * 24); // Convert to days
    }

    // 4. Rework rate (percentage of cases with multiple rounds)
    const casesWithRounds = await prisma.serviceCase.findMany({
      where,
      select: {
        id: true,
        _count: {
          select: {
            serviceRounds: true,
          },
        },
      },
    });

    const reworkCases = casesWithRounds.filter((c) => c._count.serviceRounds > 1).length;
    const reworkRate = totalCases > 0 ? (reworkCases / totalCases) * 100 : 0;

    // 5. Staff performance (operations by staff)
    const staffPerformance = await prisma.user.findMany({
      where: {
        role: "STAFF",
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        _count: {
          select: {
            statusEvents: {
              where: {
                createdAt: dateFilter.gte || dateFilter.lte ? { ...dateFilter } : undefined,
              },
            },
          },
        },
      },
      orderBy: {
        statusEvents: {
          _count: "desc",
        },
      },
      take: 10,
    });

    // 6. Recent activity summary
    const recentCases = await prisma.serviceCase.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    });

    const activeCases = await prisma.serviceCase.count({
      where: {
        closedAt: null,
      },
    });

    // 7. User statistics
    const totalUsers = await prisma.user.count();
    const activeStaff = await prisma.user.count({
      where: {
        role: "STAFF",
        isActive: true,
      },
    });
    const totalCustomers = await prisma.customer.count();

    return apiSuccess({
      totalCases,
      statusDistribution,
      averageResolutionTime: Math.round(averageResolutionTime * 10) / 10, // Round to 1 decimal
      reworkRate: Math.round(reworkRate * 10) / 10,
      staffPerformance: staffPerformance.map((s) => ({
        id: s.id,
        username: s.username,
        operationsCount: s._count.statusEvents,
      })),
      summary: {
        recentCases, // Last 7 days
        activeCases,
        totalUsers,
        activeStaff,
        totalCustomers,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
