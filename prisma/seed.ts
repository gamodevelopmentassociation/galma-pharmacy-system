import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting production database initialization...");

  // 1. Initialize Default Pharmacy Settings
  const settings = await prisma.settings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      pharmacyName: "Galma Pharmacy & Healthcare",
      tagline: "Precision Care & Trusted Pharmaceuticals",
      address: "Bole Medhanialem Road, Addis Ababa, Ethiopia",
      phone: "+251 911 234 567",
      email: "care@galmapharmacy.com",
      taxRate: 5.0,
      currency: "ETB",
      currencySymbol: "ETB",
      receiptFooter: "Thank you for choosing Galma Pharmacy. Wishing you a speedy recovery!",
    },
  });
  console.log(`✓ Pharmacy settings initialized: ${settings.pharmacyName}`);

  // 2. Initialize Single Primary Administrator User
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123456";
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@galmapharmacy.com").trim().toLowerCase();
  const adminHash = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminHash,
      isActive: true,
      role: "ADMIN",
    },
    create: {
      name: "System Administrator",
      email: adminEmail,
      passwordHash: adminHash,
      role: "ADMIN",
      phone: "+251 911 234 567",
      isActive: true,
    },
  });
  console.log(`✓ Primary Admin initialized: ${adminUser.email} (Password configured in .env)`);

  // 3. Seed Starter Catalog of Essential Pharmaceuticals if empty
  const productCount = await prisma.product.count();
  if (productCount === 0) {
    console.log("Seeding starter medication catalog...");

    const starterProducts = [
      {
        sku: "MED-AMX-500",
        barcode: "8901083001234",
        brandName: "Amoxil 500mg",
        genericName: "Amoxicillin Trihydrate",
        category: "Capsule",
        dosageForm: "500mg",
        manufacturer: "GSK Pharmaceuticals",
        description: "Broad-spectrum beta-lactam antibiotic for bacterial infections",
        reorderLevel: 20,
        unit: "Box",
        batch: {
          batchNumber: "BN-AMX-2026A",
          quantity: 120,
          purchasePrice: 140.0,
          sellingPrice: 220.0,
          expiryDate: new Date("2027-11-30"),
          supplier: "Ethiopian Pharmaceuticals Supply Agency (EPSA)",
        },
      },
      {
        sku: "MED-PCM-500",
        barcode: "8901083005678",
        brandName: "Panadol Extra",
        genericName: "Paracetamol & Caffeine",
        category: "Tablet",
        dosageForm: "500mg/65mg",
        manufacturer: "Haleon Healthcare",
        description: "Fast, effective relief of strong pain, headache and fever",
        reorderLevel: 30,
        unit: "Box",
        batch: {
          batchNumber: "BN-PAN-9941",
          quantity: 250,
          purchasePrice: 45.0,
          sellingPrice: 85.0,
          expiryDate: new Date("2028-06-15"),
          supplier: "Cadila Pharmaceuticals Ethiopia",
        },
      },
      {
        sku: "MED-OMP-20",
        barcode: "8901083009911",
        brandName: "Losec 20mg",
        genericName: "Omeprazole Delayed-Release",
        category: "Capsule",
        dosageForm: "20mg",
        manufacturer: "AstraZeneca",
        description: "Proton-pump inhibitor for gastric reflux, GERD, and ulcers",
        reorderLevel: 15,
        unit: "Box",
        batch: {
          batchNumber: "BN-OMP-4011",
          quantity: 80,
          purchasePrice: 180.0,
          sellingPrice: 290.0,
          expiryDate: new Date("2027-08-20"),
          supplier: "Julphar Pharmaceuticals",
        },
      },
      {
        sku: "MED-AZI-500",
        barcode: "8901083007722",
        brandName: "Zithromax 500mg",
        genericName: "Azithromycin Monohydrate",
        category: "Tablet",
        dosageForm: "500mg",
        manufacturer: "Pfizer",
        description: "Macrolide antibiotic for respiratory tract infections",
        reorderLevel: 10,
        unit: "Box",
        batch: {
          batchNumber: "BN-ZTH-8102",
          quantity: 60,
          purchasePrice: 320.0,
          sellingPrice: 480.0,
          expiryDate: new Date("2027-12-10"),
          supplier: "Ethiopian Pharmaceuticals Supply Agency (EPSA)",
        },
      },
      {
        sku: "MED-MET-500",
        barcode: "8901083004455",
        brandName: "Glucophage 500mg",
        genericName: "Metformin Hydrochloride",
        category: "Tablet",
        dosageForm: "500mg",
        manufacturer: "Merck Group",
        description: "First-line medication for the treatment of type 2 diabetes",
        reorderLevel: 25,
        unit: "Box",
        batch: {
          batchNumber: "BN-MET-3310",
          quantity: 140,
          purchasePrice: 60.0,
          sellingPrice: 110.0,
          expiryDate: new Date("2028-02-28"),
          supplier: "EPHARM Ethiopia",
        },
      },
      {
        sku: "MED-SYR-COUGH",
        barcode: "8901083008899",
        brandName: "Benylin Herbal Cough Syrup",
        genericName: "Hedera Helix Leaf Extract Syrup",
        category: "Syrup",
        dosageForm: "100ml Bottle",
        manufacturer: "Johnson & Johnson",
        description: "Soothing expectorant syrup for chesty and dry coughs",
        reorderLevel: 15,
        unit: "Bottle",
        batch: {
          batchNumber: "BN-BNY-1109",
          quantity: 50,
          purchasePrice: 160.0,
          sellingPrice: 260.0,
          expiryDate: new Date("2027-04-18"),
          supplier: "Bafet Pharmaceuticals Distributor",
        },
      },
    ];

    for (const item of starterProducts) {
      const { batch, ...productData } = item;
      const createdProd = await prisma.product.create({
        data: productData,
      });

      await prisma.inventoryBatch.create({
        data: {
          productId: createdProd.id,
          batchNumber: batch.batchNumber,
          quantity: batch.quantity,
          initialQty: batch.quantity,
          purchasePrice: batch.purchasePrice,
          sellingPrice: batch.sellingPrice,
          expiryDate: batch.expiryDate,
          supplier: batch.supplier,
        },
      });
    }

    console.log(`✓ Seeded ${starterProducts.length} starter pharmaceutical products.`);
  }

  console.log("Database initialization completed successfully.");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });