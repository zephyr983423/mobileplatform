import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { apiSuccess, handleApiError, apiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth/authorize";
import { createUserSchema } from "@/lib/validations";
import { createAuditLog, AuditAction } from "@/lib/audit";
import { hash } from "bcryptjs";

/**
 * GET /api/admin/users
 * Boss: List all users
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    requireRole(session.user, "BOSS");

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const where: any = {};
    if (role) {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        customer: true,
        staffPermissions: {
          select: {
            permission: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const total = await prisma.user.count({ where });

    // Remove password from response
    const sanitizedUsers = users.map(({ password, ...user }) => ({
      ...user,
      permissions: user.staffPermissions.map((p) => p.permission),
    }));

    return apiSuccess({
      users: sanitizedUsers,
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
 * POST /api/admin/users
 * Boss: Create a new user (staff or customer)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    requireRole(session.user, "BOSS");

    const body = await req.json();
    const validated = createUserSchema.parse(body);

    // Check if username already exists
    const existing = await prisma.user.findUnique({
      where: { username: validated.username },
    });

    if (existing) {
      return apiError("Username already exists", 400, "USERNAME_EXISTS");
    }

    // Hash password
    const hashedPassword = await hash(validated.password, 10);

    // Create user (with customer profile if role is CUSTOMER)
    const user = await prisma.user.create({
      data: {
        username: validated.username,
        password: hashedPassword,
        role: validated.role,
        email: validated.email,
        phone: validated.phone,
        ...(validated.role === "CUSTOMER" && {
          customer: {
            create: {
              name: validated.customerName || validated.username,
              phone: validated.phone,
              email: validated.email,
              address: validated.customerAddress,
            },
          },
        }),
      },
      include: {
        customer: true,
      },
    });

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: AuditAction.CREATE_USER,
      resource: "User",
      resourceId: user.id,
      details: {
        username: user.username,
        role: user.role,
      },
    });

    // Remove password from response
    const { password, ...sanitizedUser } = user;

    return apiSuccess(sanitizedUser, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
