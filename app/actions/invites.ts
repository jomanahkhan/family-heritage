"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

function generateCode() {
  return randomBytes(5).toString("hex").toUpperCase();
}

const createInviteSchema = z.object({
  maxUses: z.coerce.number().int().min(1).max(50).default(1),
  expiresInDays: z.coerce.number().int().min(0).max(365).optional(),
});

export async function createInviteCode(formData: FormData) {
  const session = await requireAdmin();

  const parsed = createInviteSchema.safeParse({
    maxUses: formData.get("maxUses") || undefined,
    expiresInDays: formData.get("expiresInDays") || undefined,
  });
  if (!parsed.success) return;

  const { maxUses, expiresInDays } = parsed.data;

  await prisma.inviteCode.create({
    data: {
      code: generateCode(),
      createdById: session.user.id,
      maxUses,
      expiresAt: expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null,
    },
  });

  revalidatePath("/admin/invites");
}

export async function revokeInviteCode(inviteCodeId: string) {
  await requireAdmin();

  await prisma.inviteCode.update({
    where: { id: inviteCodeId },
    data: { revoked: true },
  });

  revalidatePath("/admin/invites");
}
