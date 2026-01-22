import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { apiSuccess, handleApiError, apiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/authorize";
import { updateUserSchema } from "@/lib/validations";
import { createAuditLog, AuditAction } from "@/lib/audit";
import bcrypt from "bcryptjs";

/**
 * PATCH /api/admin/users/[id]
 * Admin: Update user information
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

    requireRole(session.user, "BOSS");

    const body = await req.json();

    // Allow username and password updates in addition to updateUserSchema
    const validated = updateUserSchema.extend({
      username: z.string().min(3).max(50).optional(),
      password: z.string().min(6).optional(),
    }).parse(body);

    // Check user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!existingUser) {
      return apiError("User not found", 404);
    }

    // Check username uniqueness if changing
    if (validated.username && validated.username !== existingUser.username) {
      const duplicateUser = await prisma.user.findUnique({
        where: { username: validated.username },
      });

      if (duplicateUser) {
        return apiError("Username already exists", 400, "USERNAME_EXISTS");
      }
    }

    // Prepare update data
    const updateData: any = {
      email: validated.email,
      phone: validated.phone,
      isActive: validated.isActive,
      username: validated.username,
    };

    // Hash password if provided
    if (validated.password) {
      updateData.password = await bcrypt.hash(validated.password, 10);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
    });

    // Remove password from response
    const { password: _, ...sanitizedUser } = user;

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: AuditAction.UPDATE_USER,
      resource: "User",
      resourceId: user.id,
      details: {
        updated: Object.keys(validated),
      },
    });

    return apiSuccess({ user: sanitizedUser });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Admin: Disable user (soft delete)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    requireRole(session.user, "BOSS");

    // Cannot delete yourself
    if (params.id === session.user.id) {
      return apiError("Cannot delete your own account", 400);
    }

    // Check user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!existingUser) {
      return apiError("User not found", 404);
    }

    // Soft delete: set isActive to false
    const user = await prisma.user.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: AuditAction.DELETE_USER,
      resource: "User",
      resourceId: user.id,
      details: {
        username: user.username,
        role: user.role,
      },
    });

    return apiSuccess({ message: "User disabled successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
