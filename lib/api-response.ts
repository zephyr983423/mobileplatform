import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthorizationError } from "./auth/authorize";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

export function apiSuccess<T>(data: T, status: number = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

export function apiError(
  message: string,
  status: number = 400,
  code?: string,
  details?: any
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code,
        details,
      },
    },
    { status }
  );
}

export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  console.error("API Error:", error);

  if (error instanceof AuthorizationError) {
    return apiError(error.message, 403, "FORBIDDEN");
  }

  if (error instanceof ZodError) {
    return apiError(
      "Validation failed",
      400,
      "VALIDATION_ERROR",
      error.errors
    );
  }

  if (error instanceof Error) {
    return apiError(
      error.message,
      500,
      "INTERNAL_ERROR"
    );
  }

  return apiError("An unexpected error occurred", 500, "UNKNOWN_ERROR");
}
