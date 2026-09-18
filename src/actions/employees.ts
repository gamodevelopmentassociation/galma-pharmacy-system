"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getEmployees() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return [];
    }

    return await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { sales: true, adjustments: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("getEmployees error:", error);
    return [];
  }
}

export interface CreateEmployeeInput {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "PHARMACIST" | "CASHIER";
  phone?: string;
}

export async function createEmployeeAction(data: CreateEmployeeInput) {
  try {
    const adminUser = await getCurrentUser();
    if (!adminUser || adminUser.role !== "ADMIN") {
      return { success: false, error: "Only administrators can create staff accounts." };
    }

    if (!data.name || !data.email || !data.password || !data.role) {
      return { success: false, error: "All required fields must be provided." };
    }

    const existing = await prisma.user.findUnique({
      where: { email: data.email.trim().toLowerCase() },
    });

    if (existing) {
      return { success: false, error: "A user with this email address already exists." };
    }

    const passwordHash = await hashPassword(data.password);

    const newUser = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        passwordHash,
        role: data.role,
        phone: data.phone?.trim() || null,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: "CREATE_USER",
        entity: "User",
        entityId: newUser.id,
        details: `Created new ${newUser.role} account for ${newUser.name} (${newUser.email}).`,
      },
    });

    revalidatePath("/employees");
    return { success: true, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } };
  } catch (error: any) {
    console.error("createEmployeeAction error:", error);
    return { success: false, error: error.message || "Failed to create employee." };
  }
}

export async function toggleEmployeeStatusAction(userId: string, newStatus: boolean) {
  try {
    const adminUser = await getCurrentUser();
    if (!adminUser || adminUser.role !== "ADMIN") {
      return { success: false, error: "Forbidden: Admin access required." };
    }

    if (adminUser.id === userId) {
      return { success: false, error: "You cannot deactivate your own administrative account." };
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive: newStatus },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: "UPDATE_USER",
        entity: "User",
        entityId: updated.id,
        details: `${newStatus ? "Activated" : "Deactivated"} staff account: ${updated.name} (${updated.email}).`,
      },
    });

    revalidatePath("/employees");
    return { success: true };
  } catch (error: any) {
    console.error("toggleEmployeeStatusAction error:", error);
    return { success: false, error: error.message || "Failed to update employee status." };
  }
}

export async function resetEmployeePasswordAction(userId: string, newPassword: string) {
  try {
    const adminUser = await getCurrentUser();
    if (!adminUser || adminUser.role !== "ADMIN") {
      return { success: false, error: "Forbidden: Admin access required." };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "Password must be at least 6 characters long." };
    }

    const passwordHash = await hashPassword(newPassword);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: "RESET_PASSWORD",
        entity: "User",
        entityId: updated.id,
        details: `Reset password for employee ${updated.name}.`,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("resetEmployeePasswordAction error:", error);
    return { success: false, error: error.message || "Failed to reset password." };
  }
}
