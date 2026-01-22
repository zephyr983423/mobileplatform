import { Permission, Role } from "@prisma/client";
import { prisma } from "@/lib/db";

export interface AuthUser {
  id: string;
  username: string;
  role: Role;
  customerId?: string;
  permissions?: Permission[];
}

export class AuthorizationError extends Error {
  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Main authorization function
 * @param user - Current authenticated user
 * @param requiredPermission - Permission needed for this action
 * @param resource - Optional resource data for ownership checks
 */
export async function authorize(
  user: AuthUser | null,
  requiredPermission: Permission | Permission[],
  resource?: { customerId?: string; ownerId?: string }
): Promise<void> {
  if (!user) {
    throw new AuthorizationError("Authentication required");
  }

  // BOSS has all permissions
  if (user.role === "BOSS") {
    return;
  }

  // CUSTOMER role-specific logic
  if (user.role === "CUSTOMER") {
    // Customers can only access their own data
    if (resource?.customerId && resource.customerId !== user.customerId) {
      throw new AuthorizationError("Access denied: not your resource");
    }
    return;
  }

  // STAFF permission checks
  if (user.role === "STAFF") {
    const permissions = Array.isArray(requiredPermission)
      ? requiredPermission
      : [requiredPermission];

    // Load staff permissions if not already loaded
    if (!user.permissions) {
      const staffPerms = await prisma.staffPermission.findMany({
        where: { userId: user.id },
        select: { permission: true },
      });
      user.permissions = staffPerms.map((p) => p.permission);
    }

    // Check if staff has ANY of the required permissions
    const hasPermission = permissions.some((p) =>
      user.permissions?.includes(p)
    );

    if (!hasPermission) {
      throw new AuthorizationError(
        `Missing permission: ${permissions.join(" or ")}`
      );
    }

    return;
  }

  throw new AuthorizationError("Invalid role");
}

/**
 * Check if user has a specific permission (doesn't throw)
 */
export async function hasPermission(
  user: AuthUser,
  permission: Permission
): Promise<boolean> {
  if (user.role === "BOSS") return true;
  if (user.role === "CUSTOMER") return false;

  if (!user.permissions) {
    const staffPerms = await prisma.staffPermission.findMany({
      where: { userId: user.id },
      select: { permission: true },
    });
    user.permissions = staffPerms.map((p) => p.permission);
  }

  return user.permissions.includes(permission);
}

/**
 * Require specific role
 */
export function requireRole(user: AuthUser | null, roles: Role | Role[]): void {
  if (!user) {
    throw new AuthorizationError("Authentication required");
  }

  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  if (!allowedRoles.includes(user.role)) {
    throw new AuthorizationError(`Required role: ${allowedRoles.join(" or ")}`);
  }
}

/**
 * Get customer filter for data queries
 * Returns customerId filter if user is CUSTOMER, otherwise undefined (no filter)
 */
export function getCustomerFilter(user: AuthUser): { customerId: string } | {} {
  if (user.role === "CUSTOMER" && user.customerId) {
    return { customerId: user.customerId };
  }
  return {};
}
