import { prisma } from "@/lib/db";

interface AuditLogParams {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog({
  userId,
  action,
  resource,
  resourceId,
  details,
  ipAddress,
  userAgent,
}: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        details: details ? JSON.stringify(details) : null,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // Don't throw - audit log failures shouldn't break the main operation
  }
}

/**
 * Common audit actions
 */
export const AuditAction = {
  // User management
  CREATE_USER: "CREATE_USER",
  UPDATE_USER: "UPDATE_USER",
  DELETE_USER: "DELETE_USER",
  DISABLE_USER: "DISABLE_USER",
  ENABLE_USER: "ENABLE_USER",

  // Permission management
  ASSIGN_PERMISSION: "ASSIGN_PERMISSION",
  REVOKE_PERMISSION: "REVOKE_PERMISSION",

  // Customer management
  UPDATE_CUSTOMER: "UPDATE_CUSTOMER",

  // Device management
  CREATE_DEVICE: "CREATE_DEVICE",
  UPDATE_DEVICE: "UPDATE_DEVICE",

  // Service case management
  CREATE_CASE: "CREATE_CASE",
  UPDATE_CASE: "UPDATE_CASE",
  DELETE_CASE: "DELETE_CASE",
  CLOSE_CASE: "CLOSE_CASE",

  // Status updates
  UPDATE_STATUS: "UPDATE_STATUS",

  // Shipment
  CREATE_SHIPMENT: "CREATE_SHIPMENT",
  UPDATE_SHIPMENT: "UPDATE_SHIPMENT",

  // Auth
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  LOGIN_FAILED: "LOGIN_FAILED",
} as const;
