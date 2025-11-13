import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding admin user...");

  // Hash password for main admin
  const hashedPassword = await bcrypt.hash("tawhiD20123894", 10);

  // Create main admin user (Tawhidur Rahman)
  const admin = await prisma.user.upsert({
    where: { email: "tawhidur_rahman@hotel.com" },
    update: {},
    create: {
      email: "tawhidur_rahman@hotel.com",
      name: "Tawhidur_Rahman",
      password: hashedPassword,
      phone: "+880 1234-567890",
      role: UserRole.ADMIN,
      emailVerified: new Date(),
    },
  });

  console.log("✅ Main Admin user created:");
  console.log("   Email: tawhidur_rahman@hotel.com");
  console.log("   Name: Tawhidur_Rahman");
  console.log("   Password: tawhiD20123894");
  console.log("   Role: ADMIN");

  // Create hotel owner user
  const owner = await prisma.user.upsert({
    where: { email: "owner@hotel.com" },
    update: {},
    create: {
      email: "owner@hotel.com",
      name: "Hotel Owner",
      password: hashedPassword,
      phone: "+880 1234-567891",
      role: UserRole.HOTEL_OWNER,
      emailVerified: new Date(),
    },
  });

  console.log("\n✅ Hotel Owner user created:");
  console.log("   Email: owner@hotel.com");
  console.log("   Password: admin123");
  console.log("   Role: HOTEL_OWNER");

  // Create regular customer
  const customer = await prisma.user.upsert({
    where: { email: "customer@hotel.com" },
    update: {},
    create: {
      email: "customer@hotel.com",
      name: "John Customer",
      password: hashedPassword,
      phone: "+880 1234-567892",
      role: UserRole.CUSTOMER,
      emailVerified: new Date(),
    },
  });

  console.log("\n✅ Customer user created:");
  console.log("   Email: customer@hotel.com");
  console.log("   Password: admin123");
  console.log("   Role: CUSTOMER");

  console.log("\n🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
