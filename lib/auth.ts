import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { prisma } from "@/lib/prisma";

// Membership is invite-only: the sign-up endpoint itself validates and
// consumes an `inviteCode` field passed in the request body. Validating here
// (inside the same endpoint the client SDK calls) is what makes this
// bypass-proof — a Server Action wrapper alone wouldn't stop someone from
// calling POST /api/auth/sign-up/email directly.
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "MEMBER",
        input: false,
      },
      personId: {
        type: "string",
        required: false,
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;

      const inviteCode = ctx.body?.inviteCode;
      if (!inviteCode || typeof inviteCode !== "string") {
        throw new APIError("BAD_REQUEST", {
          message: "An invite code is required to register.",
        });
      }

      const invite = await prisma.inviteCode.findUnique({
        where: { code: inviteCode },
      });

      const isValid =
        invite &&
        !invite.revoked &&
        invite.usedCount < invite.maxUses &&
        (!invite.expiresAt || invite.expiresAt > new Date());

      if (!isValid) {
        throw new APIError("BAD_REQUEST", {
          message: "This invite code is invalid, expired, or already used.",
        });
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;

      const inviteCode = ctx.body?.inviteCode;
      const newSession = ctx.context.newSession;
      if (!inviteCode || typeof inviteCode !== "string" || !newSession) return;

      await prisma.$transaction([
        prisma.inviteCode.update({
          where: { code: inviteCode },
          data: { usedCount: { increment: 1 } },
        }),
        prisma.inviteCodeRedemption.create({
          data: {
            inviteCode: { connect: { code: inviteCode } },
            userEmail: newSession.user.email,
          },
        }),
      ]);
    }),
  },
});
