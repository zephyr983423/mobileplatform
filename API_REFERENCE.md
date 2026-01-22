# API Reference

Complete API documentation for the Mobile After-Sales Service Platform.

## Base URL
```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Authentication

All API routes (except `/api/auth/*`) require authentication via NextAuth session.

**Login:**
```bash
POST /api/auth/signin
Content-Type: application/json

{
  "username": "customer1",
  "password": "password123"
}
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}  // Optional validation errors
  }
}
```

### HTTP Status Codes
- `200 OK` - Successful GET/PATCH
- `201 Created` - Successful POST
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized (permission denied)
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Customer APIs

### Get Device Overview

Get all devices owned by the authenticated customer with latest status.

**Endpoint:** `GET /api/me/overview`

**Auth:** CUSTOMER only

**Response:**
```json
{
  "success": true,
  "data": {
    "devices": [
      {
        "id": "clxxx",
        "brand": "Apple",
        "model": "iPhone 14 Pro",
        "color": "Space Black",
        "storage": "256GB",
        "latestCase": {
          "id": "clyyy",
          "caseNumber": "CS20240101001",
          "title": "Battery Replacement",
          "status": "DELIVERED",
          "lastUpdated": "2024-01-15T18:00:00Z",
          "location": "Completed",
          "tracking": {
            "carrier": "FedEx",
            "trackingNumber": "FDX987654321",
            "status": "SIGNED",
            "currentLocation": "Delivered"
          }
        }
      }
    ]
  }
}
```

---

### Get Device Detail

Get full service history for a specific device.

**Endpoint:** `GET /api/me/devices/{deviceId}`

**Auth:** CUSTOMER only (ownership validated)

**Response:**
```json
{
  "success": true,
  "data": {
    "device": {
      "id": "clxxx",
      "brand": "Apple",
      "model": "iPhone 14 Pro",
      "imei": "123456789012345",
      "color": "Space Black",
      "storage": "256GB",
      "serviceCases": [
        {
          "id": "clyyy",
          "caseNumber": "CS20240101001",
          "title": "Battery Replacement",
          "description": "Customer reports battery draining quickly",
          "createdAt": "2024-01-10T09:00:00Z",
          "serviceRounds": [
            {
              "id": "clzzz",
              "roundNo": 1,
              "issue": "Battery health at 75%, rapid discharge",
              "diagnosis": "Battery degradation confirmed. Needs replacement.",
              "resolution": "Replaced battery with new OEM battery",
              "cost": 89.99,
              "warrantyDays": 90,
              "status": "CLOSED",
              "startedAt": "2024-01-10T09:00:00Z",
              "completedAt": "2024-01-15T18:00:00Z",
              "statusEvents": [
                {
                  "id": "cleee",
                  "fromStatus": null,
                  "toStatus": "PENDING",
                  "notes": "Case created",
                  "location": "Customer Portal",
                  "createdAt": "2024-01-10T09:00:00Z",
                  "operator": {
                    "username": "staff1"
                  }
                },
                // More status events...
              ],
              "shipments": [
                {
                  "id": "clfff",
                  "type": "INBOUND",
                  "trackingNumber": "FDX123456789",
                  "carrier": "FedEx",
                  "status": "SIGNED",
                  "origin": "Customer Address",
                  "destination": "Main Warehouse",
                  "currentLocation": "Delivered",
                  "shippedAt": "2024-01-10T14:00:00Z",
                  "actualArrival": "2024-01-11T10:00:00Z"
                }
              ]
            }
          ]
        }
      ]
    }
  }
}
```

---

## Staff APIs

### List Service Cases

Get list of service cases (filtered by permissions).

**Endpoint:** `GET /api/staff/cases`

**Auth:** STAFF or BOSS

**Permissions:** `CASE_READ_ALL` or `CASE_READ_ASSIGNED`

**Query Parameters:**
- `search` (optional) - Search by case number, device info
- `status` (optional) - Filter by status
- `page` (default: 1) - Page number
- `pageSize` (default: 20, max: 100) - Items per page

**Example Request:**
```
GET /api/staff/cases?search=iPhone&status=REPAIRING&page=1&pageSize=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cases": [
      {
        "id": "clxxx",
        "caseNumber": "CS20240115001",
        "title": "Screen Replacement",
        "createdAt": "2024-01-15T10:00:00Z",
        "device": {
          "id": "clyyy",
          "brand": "Samsung",
          "model": "Galaxy S23 Ultra",
          "customer": {
            "id": "clzzz",
            "name": "John Doe",
            "phone": "+1234567893"
          }
        },
        "serviceRounds": [
          {
            "id": "claaa",
            "roundNo": 1,
            "status": "REPAIRING",
            "startedAt": "2024-01-15T10:00:00Z"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

---

### Create Service Case

Create a new service case for a device.

**Endpoint:** `POST /api/staff/cases`

**Auth:** STAFF or BOSS

**Permissions:** `CASE_WRITE`

**Request Body:**
```json
{
  "deviceId": "clxxx",
  "title": "Battery Replacement",
  "description": "Customer reports fast battery drain",
  "issue": "Battery health at 70%, rapid discharge"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clyyy",
    "caseNumber": "CS20240118001",
    "title": "Battery Replacement",
    "description": "Customer reports fast battery drain",
    "deviceId": "clxxx",
    "createdAt": "2024-01-18T10:00:00Z",
    "serviceRounds": [
      {
        "id": "clzzz",
        "roundNo": 1,
        "issue": "Battery health at 70%, rapid discharge",
        "status": "PENDING"
      }
    ],
    "device": {
      "id": "clxxx",
      "brand": "Apple",
      "model": "iPhone 13",
      "customer": {
        "id": "claaa",
        "name": "Jane Smith"
      }
    }
  }
}
```

---

### Update Service Round Status

Update the status of a service round (creates a status event).

**Endpoint:** `POST /api/staff/rounds/{roundId}/status`

**Auth:** STAFF or BOSS

**Permissions:** `CASE_WRITE`

**Request Body:**
```json
{
  "toStatus": "REPAIRING",
  "notes": "Started repair work on battery replacement",
  "location": "Repair Desk 2"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "statusEvent": {
      "id": "clnew",
      "serviceRoundId": "clzzz",
      "fromStatus": "DIAGNOSING",
      "toStatus": "REPAIRING",
      "notes": "Started repair work on battery replacement",
      "location": "Repair Desk 2",
      "operatorId": "clusr",
      "createdAt": "2024-01-18T14:30:00Z"
    },
    "round": {
      "id": "clzzz",
      "status": "REPAIRING",
      "statusEvents": [
        // Recent status events...
      ]
    }
  }
}
```

---

### Update Service Round Details

Update diagnosis, resolution, cost, warranty for a service round.

**Endpoint:** `PATCH /api/staff/rounds/{roundId}`

**Auth:** STAFF or BOSS

**Permissions:** `CASE_WRITE`

**Request Body:**
```json
{
  "diagnosis": "Battery capacity degraded to 68%. No physical damage.",
  "resolution": "Replaced battery with OEM part. Tested full charge cycle.",
  "cost": 89.99,
  "warrantyDays": 90
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clzzz",
    "roundNo": 1,
    "diagnosis": "Battery capacity degraded to 68%. No physical damage.",
    "resolution": "Replaced battery with OEM part. Tested full charge cycle.",
    "cost": 89.99,
    "warrantyDays": 90,
    "status": "REPAIRING",
    "updatedAt": "2024-01-18T15:00:00Z"
  }
}
```

---

### Create Shipment

Create a shipment record (inbound or outbound).

**Endpoint:** `POST /api/staff/shipments`

**Auth:** STAFF or BOSS

**Permissions:** `SHIPMENT_WRITE`

**Request Body:**
```json
{
  "serviceRoundId": "clzzz",
  "type": "OUTBOUND",
  "trackingNumber": "UPS123456789",
  "carrier": "UPS",
  "origin": "Main Warehouse",
  "destination": "123 Main St, New York, NY 10001",
  "notes": "Expedited shipping requested",
  "estimatedArrival": "2024-01-20T17:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clship",
    "serviceRoundId": "clzzz",
    "type": "OUTBOUND",
    "trackingNumber": "UPS123456789",
    "carrier": "UPS",
    "status": "PENDING",
    "origin": "Main Warehouse",
    "destination": "123 Main St, New York, NY 10001",
    "currentLocation": null,
    "notes": "Expedited shipping requested",
    "estimatedArrival": "2024-01-20T17:00:00Z",
    "shippedAt": null,
    "createdAt": "2024-01-18T16:00:00Z"
  }
}
```

---

### Update Shipment

Update shipment status and location.

**Endpoint:** `PATCH /api/staff/shipments/{shipmentId}`

**Auth:** STAFF or BOSS

**Permissions:** `SHIPMENT_WRITE`

**Request Body:**
```json
{
  "status": "IN_TRANSIT",
  "currentLocation": "Distribution Center - NJ",
  "notes": "Package in transit, on schedule"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clship",
    "status": "IN_TRANSIT",
    "currentLocation": "Distribution Center - NJ",
    "notes": "Package in transit, on schedule",
    "updatedAt": "2024-01-19T10:00:00Z"
  }
}
```

---

## Boss/Admin APIs

### List Users

Get all users in the system.

**Endpoint:** `GET /api/admin/users`

**Auth:** BOSS only

**Query Parameters:**
- `role` (optional) - Filter by role (BOSS/STAFF/CUSTOMER)
- `page` (default: 1)
- `pageSize` (default: 20, max: 100)

**Example Request:**
```
GET /api/admin/users?role=STAFF&page=1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "clusr1",
        "username": "staff1",
        "role": "STAFF",
        "email": "staff1@example.com",
        "phone": "+1234567891",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00Z",
        "customer": null,
        "permissions": [
          "CASE_READ_ALL",
          "CASE_WRITE",
          "DEVICE_READ",
          "SHIPMENT_WRITE"
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

---

### Create User

Create a new user (STAFF or CUSTOMER).

**Endpoint:** `POST /api/admin/users`

**Auth:** BOSS only

**Request Body (Staff):**
```json
{
  "username": "newstaff",
  "password": "SecurePass123!",
  "role": "STAFF",
  "email": "newstaff@example.com",
  "phone": "+1234567899"
}
```

**Request Body (Customer):**
```json
{
  "username": "newcustomer",
  "password": "SecurePass123!",
  "role": "CUSTOMER",
  "email": "customer@example.com",
  "phone": "+1234567898",
  "customerName": "Alice Johnson",
  "customerAddress": "789 Oak St, Boston, MA 02101"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clnew",
    "username": "newstaff",
    "role": "STAFF",
    "email": "newstaff@example.com",
    "phone": "+1234567899",
    "isActive": true,
    "createdAt": "2024-01-18T12:00:00Z",
    "customer": null
  }
}
```

---

### Assign Permissions to Staff

Assign or update permissions for a STAFF user.

**Endpoint:** `POST /api/admin/users/{userId}/permissions`

**Auth:** BOSS only

**Request Body:**
```json
{
  "permissions": [
    "CASE_READ_ALL",
    "CASE_WRITE",
    "DEVICE_READ",
    "DEVICE_WRITE",
    "SHIPMENT_READ",
    "SHIPMENT_WRITE"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "clusr1",
    "permissions": [
      {
        "id": "clperm1",
        "userId": "clusr1",
        "permission": "CASE_READ_ALL",
        "createdAt": "2024-01-18T13:00:00Z",
        "user": {
          "id": "clusr1",
          "username": "staff1",
          "role": "STAFF"
        }
      }
      // More permissions...
    ]
  }
}
```

---

### Get Staff Permissions

Get current permissions for a staff member.

**Endpoint:** `GET /api/admin/users/{userId}/permissions`

**Auth:** BOSS only

**Response:**
```json
{
  "success": true,
  "data": {
    "permissions": [
      {
        "id": "clperm1",
        "userId": "clusr1",
        "permission": "CASE_READ_ALL",
        "createdAt": "2024-01-01T00:00:00Z",
        "user": {
          "id": "clusr1",
          "username": "staff1",
          "role": "STAFF"
        }
      }
    ]
  }
}
```

---

### Get Audit Logs

View system audit logs.

**Endpoint:** `GET /api/admin/audit`

**Auth:** BOSS only

**Query Parameters:**
- `userId` (optional) - Filter by user
- `action` (optional) - Filter by action type
- `resource` (optional) - Filter by resource type
- `dateFrom` (optional) - ISO date string
- `dateTo` (optional) - ISO date string
- `page` (default: 1)
- `pageSize` (default: 50, max: 100)

**Example Request:**
```
GET /api/admin/audit?action=UPDATE_STATUS&page=1&pageSize=50
```

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "cllog1",
        "userId": "clusr1",
        "action": "UPDATE_STATUS",
        "resource": "ServiceRound",
        "resourceId": "clround1",
        "details": "{\"from\":\"DIAGNOSING\",\"to\":\"REPAIRING\"}",
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "createdAt": "2024-01-18T14:30:00Z",
        "user": {
          "id": "clusr1",
          "username": "staff1",
          "role": "STAFF"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 50,
      "total": 250,
      "totalPages": 5
    }
  }
}
```

---

## Service Status Values

Available status values for `ServiceStatus` enum:

- `PENDING` - Case created, not started
- `RECEIVED` - Device received at warehouse
- `DIAGNOSING` - Under diagnosis
- `AWAITING_PARTS` - Waiting for replacement parts
- `REPAIRING` - Under repair
- `QA` - Quality assurance testing
- `READY_TO_SHIP` - Fixed, ready to ship
- `SHIPPING` - In transit to customer
- `DELIVERED` - Delivered to customer
- `CLOSED` - Case closed successfully
- `RETURNED` - Customer returned (unhappy with repair)
- `CANCELLED` - Case cancelled

## Shipment Status Values

Available status values for `ShipmentStatus` enum:

- `PENDING` - Shipment created, not yet shipped
- `IN_TRANSIT` - Package in transit
- `ARRIVED` - Arrived at destination
- `SIGNED` - Signed for by recipient
- `FAILED` - Delivery failed

## Permission Values

Available permissions for STAFF users:

**Case Permissions:**
- `CASE_READ_ALL` - View all service cases
- `CASE_READ_ASSIGNED` - View only assigned cases
- `CASE_WRITE` - Create/update service cases
- `CASE_DELETE` - Delete service cases

**Device Permissions:**
- `DEVICE_READ` - View device information
- `DEVICE_WRITE` - Create/update devices
- `DEVICE_DELETE` - Delete devices

**Shipment Permissions:**
- `SHIPMENT_READ` - View shipment info
- `SHIPMENT_WRITE` - Create/update shipments

**Admin Permissions:**
- `USER_MANAGE` - Create/manage users
- `USER_READ_ALL` - View all users
- `AUDIT_READ` - View audit logs
- `CUSTOMER_READ_ALL` - View all customer info
- `CUSTOMER_WRITE` - Create/update customer info

---

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Input validation failed (see `details` field) |
| `FORBIDDEN` | User lacks required permission |
| `USERNAME_EXISTS` | Username already taken |
| `NOT_FOUND` | Resource not found |
| `INTERNAL_ERROR` | Server error |
| `UNKNOWN_ERROR` | Unexpected error |

---

## Rate Limiting

Currently not implemented. Recommended for production:
- 100 requests per minute per IP for authenticated routes
- 20 requests per minute per IP for login endpoint

---

## Pagination

All list endpoints support pagination:

**Query Parameters:**
- `page` - Page number (starts at 1)
- `pageSize` - Items per page (max varies by endpoint)

**Response Structure:**
```json
{
  "pagination": {
    "page": 2,
    "pageSize": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

---

## Date/Time Format

All timestamps use ISO 8601 format:
```
2024-01-18T14:30:00Z
```

When sending dates in requests, use the same format.

---

This API reference covers all implemented endpoints. Use these patterns to build additional endpoints as needed.
