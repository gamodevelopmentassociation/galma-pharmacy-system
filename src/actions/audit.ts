"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function getAuditLogs(entity?: string, action?: string, limit = 50) {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const where: any = {};
    if (entity && entity !== "ALL") where.entity = entity;
    if (action && action !== "ALL") where.action = action;

    return await prisma.auditLog.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { name: true, email: true, role: true },
        },
      },
    });
  } catch (error) {
    console.error("getAuditLogs error:", error);
    return [];
  }
}
