import { hashPassword } from "better-auth/crypto";
import { prisma } from "../lib/prisma";

// Bootstraps the very first admin account directly via Prisma, bypassing the
// invite-gated /sign-up/email endpoint (there's no invite code that could
// have created this account, by definition — it's the root of the invite tree).
async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "Admin";

  if (!email || !password) {
    throw new Error(
      "Set ADMIN_EMAIL and ADMIN_PASSWORD env vars before running the seed script."
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin ${email} already exists, skipping.`);
    return;
  }

  const passwordHash = await hashPassword(password);

  const admin = await prisma.user.create({
    data: { name, email, emailVerified: true, role: "ADMIN" },
  });

  // accountId equals the user's own id, and issuer must be the synthetic
  // "local:<providerId>" string Better Auth's sign-in lookup matches on
  // (see node_modules/better-auth's sign-up route + @better-auth/core's
  // createLocalAccountIssuer).
  await prisma.account.create({
    data: {
      userId: admin.id,
      providerId: "credential",
      issuer: "local:credential",
      accountId: admin.id,
      password: passwordHash,
    },
  });

  console.log(`Created admin user: ${email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
