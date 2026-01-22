import { z } from "zod";
import { Permission, Role, ServiceStatus, ShipmentStatus, ShipmentType } from "@prisma/client";

// Auth
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// User management
export const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  role: z.nativeEnum(Role),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  // Customer-specific fields
  customerName: z.string().optional(),
  customerAddress: z.string().optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Staff permissions
export const assignPermissionsSchema = z.object({
  permissions: z.array(z.nativeEnum(Permission)),
});

// Device
export const createDeviceSchema = z.object({
  customerId: z.string(),
  brand: z.string().min(1),
  model: z.string().min(1),
  imei: z.string().optional(),
  serial: z.string().optional(),
  color: z.string().optional(),
  storage: z.string().optional(),
  notes: z.string().optional(),
});

// Service case
export const createServiceCaseSchema = z.object({
  deviceId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  issue: z.string().min(1), // Initial issue for round 1
});

export const updateServiceRoundSchema = z.object({
  diagnosis: z.string().optional(),
  resolution: z.string().optional(),
  cost: z.number().positive().optional(),
  warrantyDays: z.number().int().positive().optional(),
});

// Status update
export const updateStatusSchema = z.object({
  toStatus: z.nativeEnum(ServiceStatus),
  notes: z.string().optional(),
  location: z.string().optional(),
});

// Shipment
export const createShipmentSchema = z.object({
  serviceRoundId: z.string(),
  type: z.nativeEnum(ShipmentType),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
  origin: z.string().optional(),
  destination: z.string().optional(),
  notes: z.string().optional(),
  estimatedArrival: z.string().datetime().optional(),
});

export const updateShipmentSchema = z.object({
  status: z.nativeEnum(ShipmentStatus).optional(),
  currentLocation: z.string().optional(),
  notes: z.string().optional(),
  actualArrival: z.string().datetime().optional(),
});

// Filters
export const serviceCaseFilterSchema = z.object({
  search: z.string().optional(), // Search by case number, device info
  status: z.nativeEnum(ServiceStatus).optional(),
  customerId: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const auditLogFilterSchema = z.object({
  userId: z.string().optional(),
  action: z.string().optional(),
  resource: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(50),
});
