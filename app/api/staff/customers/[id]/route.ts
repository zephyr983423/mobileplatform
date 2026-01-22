import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { apiSuccess, handleApiError, apiError } from "@/lib/api-response";
import { authorize } from "@/lib/auth/authorize";
import { createAuditLog, AuditAction } from "@/lib/audit";
import { Permission } from "@prisma/client";
import { z } from "zod";

const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
});

/**
 * GET /api/staff/customers/[id]
 * Staff: Get customer details with devices and service history
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

    await authorize(session.user, Permission.CUSTOMER_READ_ALL);

    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            phone: true,
            isActive: true,
          },
        },
        devices: {
          orderBy: { createdAt: "desc" },
          include: {
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
        },
      },
    });

    if (!customer) {
      return apiError("Customer not found", 404);
    }

    return apiSuccess({ customer });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/staff/customers/[id]
 * Staff: Update customer information
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

    await authorize(session.user, Permission.CUSTOMER_WRITE);

    const body = await req.json();
    const validated = updateCustomerSchema.parse(body);

    // Check customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: params.id },
    });

    if (!existingCustomer) {
      return apiError("Customer not found", 404);
    }

    // Update customer
    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: validated,
    });

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: AuditAction.UPDATE_CUSTOMER,
      resource: "Customer",
      resourceId: customer.id,
      details: validated,
    });

    return apiSuccess({ customer });
  } catch (error) {
    return handleApiError(error);
  }
}
