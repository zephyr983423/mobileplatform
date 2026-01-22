import { Role, Permission } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    username: string;
    role: Role;
    email?: string | null;
    customerId?: string;
    permissions?: Permission[];
  }

  interface Session {
    user: {
      id: string;
      username: string;
      role: Role;
      email?: string;
      customerId?: string;
      permissions?: Permission[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    customerId?: string;
    permissions?: Permission[];
  }
}
