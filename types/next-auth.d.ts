import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Extend next-auth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      role: "ADMIN" | "VIEWER";
    };
  }

  interface User {
    id: string;
    email: string;
    name: string | null;
    role: "ADMIN" | "VIEWER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "VIEWER";
  }
}

export {};
