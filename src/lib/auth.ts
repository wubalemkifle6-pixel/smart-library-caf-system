import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import type { Role, UserStatus } from "@/types";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "smart-library-cafe-secret-key-change-in-production"
);

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: Role;
  status: UserStatus;
  phone?: string | null;
}

export interface JWTPayload {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: Role;
  status: UserStatus;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePasswords(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function signToken(user: AuthUser): Promise<string> {
  const token = await new SignJWT({
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
  return token;
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string) {
  (await cookies()).set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearAuthCookie() {
  (await cookies()).delete("auth_token");
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get("auth_token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  // Refresh from DB to get latest role/status
  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      status: users.status,
      phone: users.phone,
    })
    .from(users)
    .where(eq(users.id, payload.id))
    .limit(1);
  if (!user) return null;
  return user as AuthUser;
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireRole(roles: Role[]): Promise<AuthUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }
  if (user.status !== "active") {
    throw new Error("ACCOUNT_NOT_ACTIVE");
  }
  return user;
}

export function getDashboardPathByRole(role: Role): string {
  switch (role) {
    case "admin":
      return "/dashboard/admin";
    case "librarian":
      return "/dashboard/librarian";
    case "member":
      return "/dashboard/member";
    case "cafe_staff":
      return "/dashboard/cafe-staff";
    case "cashier":
      return "/dashboard/cashier";
    default:
      return "/";
  }
}
