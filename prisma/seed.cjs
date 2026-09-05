// Seed a default admin from ADMIN_USERNAME / ADMIN_PASSWORD env vars.
// Plain CommonJS so it runs with bare `node` (no ts-node/tsx needed).
// Run with: npm run db:seed
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "changeme";

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.admin.upsert({
    where: { username },
    update: { passwordHash },
    create: { username, passwordHash },
  });

  console.log(`✓ Admin ready: username="${username}"`);
  if (password === "changeme") {
    console.warn("⚠  Using default password 'changeme' — set ADMIN_PASSWORD in .env.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
