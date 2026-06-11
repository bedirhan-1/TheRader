import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@therader.app";
  const password = process.env.SEED_ADMIN_PASSWORD || "changeme123";

  // 1. Create admin user
  const passwordHash = await hash(password, 12);
  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      name: "Admin",
      role: "ADMIN",
    },
  });
  console.log(`✓ Admin user created: ${admin.email}`);

  // 2. Create settings singleton
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      cronExpression: "*/5 * * * *",
      tradeOutsideHours: false,
    },
  });
  console.log("✓ Settings singleton created");

  // 3. Create sample stocks
  const stocks = [
    { symbol: "AAPL", name: "Apple Inc." },
    { symbol: "TSLA", name: "Tesla, Inc." },
    { symbol: "NVDA", name: "NVIDIA Corporation" },
    { symbol: "MSFT", name: "Microsoft Corporation" },
    { symbol: "GOOGL", name: "Alphabet Inc." },
  ];

  for (const stock of stocks) {
    await prisma.stock.upsert({
      where: { symbol: stock.symbol },
      update: {},
      create: stock,
    });
  }
  console.log(`✓ ${stocks.length} sample stocks created`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
