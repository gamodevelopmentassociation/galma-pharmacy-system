"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getPharmacySettings() {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: "default",
          pharmacyName: "Galma Pharmacy & Healthcare",
          tagline: "Precision Care & Trusted Pharmaceuticals",
          address: "Bole Medhanialem Road, Addis Ababa, Ethiopia",
          phone: "+251 911 234 567",
          email: "care@galmapharmacy.com",
          taxRate: 5.0,
          currency: "ETB",
          currencySymbol: "ETB",
          receiptFooter: "Thank you for choosing Galma Pharmacy. Wishing you speedy recovery!",
        },
      });
    }

    return settings;
  } catch (error) {
    console.error("getPharmacySettings error:", error);
    return null;
  }
}

export interface UpdateSettingsInput {
  pharmacyName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  taxRate: number;
  currency: string;
  currencySymbol: string;
  receiptFooter: string;
}

export async function updatePharmacySettingsAction(data: UpdateSettingsInput) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return { success: false, error: "Only administrators can modify pharmacy settings." };
    }

    const updated = await prisma.settings.upsert({
      where: { id: "default" },
      update: {
        pharmacyName: data.pharmacyName.trim(),
        tagline: data.tagline?.trim(),
        address: data.address.trim(),
        phone: data.phone.trim(),
        email: data.email.trim(),
        taxRate: Number(data.taxRate) || 0,
        currency: data.currency.trim(),
        currencySymbol: data.currencySymbol?.trim() || data.currency.trim(),
        receiptFooter: data.receiptFooter.trim(),
      },
      create: {
        id: "default",
        pharmacyName: data.pharmacyName.trim(),
        tagline: data.tagline?.trim(),
        address: data.address.trim(),
        phone: data.phone.trim(),
        email: data.email.trim(),
        taxRate: Number(data.taxRate) || 0,
        currency: data.currency.trim(),
        currencySymbol: data.currencySymbol?.trim() || data.currency.trim(),
        receiptFooter: data.receiptFooter.trim(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "UPDATE_SETTINGS",
        entity: "Settings",
        details: `Updated pharmacy settings (${updated.pharmacyName}, Tax: ${updated.taxRate}%, Currency: ${updated.currency}).`,
      },
    });

    revalidatePath("/settings");
    return { success: true, settings: updated };
  } catch (error: any) {
    console.error("updatePharmacySettingsAction error:", error);
    return { success: false, error: error.message || "Failed to update settings." };
  }
}
