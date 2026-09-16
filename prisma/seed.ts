import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function upsertUser(
  username: string,
  name: string,
  role: "ADMINISTRATOR" | "INVENTORY_OPERATOR" | "PRINTING_OPERATOR",
  password: string,
  extra: { canManagePricing?: boolean; canManageSettings?: boolean } = {}
) {
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { username },
    update: {},
    create: {
      username,
      name,
      role,
      passwordHash,
      canManagePricing: extra.canManagePricing ?? false,
      canManageSettings: extra.canManageSettings ?? false,
    },
  });
}

async function main() {
  console.log("Seeding users...");
  await upsertUser("admin", "System Administrator", "ADMINISTRATOR", "admin123", {
    canManagePricing: true,
    canManageSettings: true,
  });
  await upsertUser(
    "inventory.op",
    "Inventory Operator",
    "INVENTORY_OPERATOR",
    "inventory123"
  );
  await upsertUser(
    "printing.op",
    "Printing Operator",
    "PRINTING_OPERATOR",
    "printing123"
  );

  console.log("Seeding paper sizes, GSM, paper types...");
  await Promise.all(
    ["A4", "A3"].map((name) =>
      prisma.paperSize.upsert({ where: { name }, update: {}, create: { name } })
    )
  );
  await Promise.all(
    [80, 135, 140, 150, 200].map((value) =>
      prisma.gsmType.upsert({
        where: { value },
        update: {},
        create: { value },
      })
    )
  );
  await Promise.all(
    ["Plain", "Photo", "Cloth"].map((name) =>
      prisma.paperType.upsert({ where: { name }, update: {}, create: { name } })
    )
  );

  console.log("Seeding inventory categories...");
  await Promise.all(
    ["Paper", "Toner", "Ink", "Stationery", "Office Supplies", "Equipment", "Other"].map(
      (name) =>
        prisma.inventoryCategory.upsert({
          where: { name },
          update: {},
          create: { name },
        })
    )
  );

  console.log("Seeding sample lecturers...");
  const lecturers: { code: string; name: string; department: string }[] = [
    { code: "LEC-0001", name: "Mr. Silva", department: "Economics" },
    { code: "LEC-0002", name: "Ms. Perera", department: "Mathematics" },
    { code: "LEC-0003", name: "Dr. Fernando", department: "Computer Science" },
  ];
  for (const l of lecturers) {
    await prisma.lecturer.upsert({
      where: { lecturerCode: l.code },
      update: {},
      create: {
        lecturerCode: l.code,
        name: l.name,
        department: l.department,
      },
    });
  }

  console.log("Seed complete.");
  console.log("Login with: admin / admin123, inventory.op / inventory123, printing.op / printing123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
