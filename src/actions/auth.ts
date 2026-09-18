"use server";

import prisma from "@/lib/prisma";
import { comparePassword, setSessionCookie, clearSessionCookie, getCurrentUser } from "@/lib/auth";
import { Role } from "@/lib/types";

export async function loginAction(formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      return { success: false, error: "Please provide both email and password." };
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      return { success: false, error: "Invalid email or password." };
    }

    if (!user.isActive) {
      return { success: false, error: "This account has been deactivated. Contact an administrator." };
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return { success: false, error: "Invalid email or password." };
    }

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as Role,
      phone: user.phone,
    };

    await setSessionCookie(sessionUser);

    // Record Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "LOGIN",
          entity: "User",
          details: `User ${user.name} (${user.role}) logged in successfully.`,
        },
      });
    } catch (e) {
      console.error("Audit log error:", e);
    }

    // Determine redirect destination based on user role
    const redirectTo = (user.role === "ADMIN" || user.role === "PHARMACIST") 
      ? "/dashboard" 
      : "/pos";

    return { success: true, user: sessionUser, redirectTo };
  } catch (error: any) {
    console.error("Login action error:", error);
    return { success: false, error: error.message || "An unexpected error occurred during sign in." };
  }
}

export async function logoutAction() {
  try {
    const user = await getCurrentUser();
    if (user) {
      try {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "LOGOUT",
            entity: "User",
            details: `User ${user.name} signed out.`,
          },
        });
      } catch (e) {
        console.error("Logout audit error:", e);
      }
    }
    await clearSessionCookie();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getSessionUser() {
  return await getCurrentUser();
}