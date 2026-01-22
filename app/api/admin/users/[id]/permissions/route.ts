import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { apiSuccess, handleApiError, apiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/authorize";
import { assignPermissionsSchema } from "@/lib/validations";
import { createAuditLog, AuditAction } from "@/lib/audit";

/**
 * POST /api/admin/users/[id]/permissions
 * Boss: Assign permissions to a staff member
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

    requireRole(session.user, "BOSS");

    const userId = params.id;
    const body = await req.json();
    const validated = assignPermissionsSchema.parse(body);

    // Check if user exists and is a staff member
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return apiError("User not found", 404);
    }

    if (user.role !== "STAFF") {
      return apiError("Can only assign permissions to STAFF users", 400);
    }

    // Get current permissions
    const currentPermissions = await prisma.staffPermission.findMany({
      where: { userId },
      select: { permission: true },
    });

    const currentPerms = currentPermissions.map((p) => p.permission);

    // Replace all permissions (delete old, create new)
    await prisma.$transaction(async (tx) => {
      // Delete all existing permissions
      await tx.staffPermission.deleteMany({
        where: { userId },
      });

      // Create new permissions
      if (validated.permissions.length > 0) {
        await tx.staffPermission.createMany({
          data: validated.permissions.map((permission) => ({
            userId,
            permission,
            createdBy: session.user.id,
          })),
        });
      }
    });

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: AuditAction.ASSIGN_PERMISSION,
      resource: "StaffPermission",
      resourceId: userId,
      details: {
        before: currentPerms,
        after: validated.permissions,
      },
    });

    // Fetch updated permissions
    const updatedPermissions = await prisma.staffPermission.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });

    return apiSuccess({
      userId,
      permissions: updatedPermissions,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/admin/users/[id]/permissions
 * Boss: Get current permissions for a staff member
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

    requireRole(session.user, "BOSS");

    const userId = params.id;

    const permissions = await prisma.staffPermission.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });

    return apiSuccess({ permissions });
  } catch (error) {
    return handleApiError(error);
  }
}
