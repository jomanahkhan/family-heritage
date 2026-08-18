"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

const postSchema = z.object({
  type: z.enum(["ANNOUNCEMENT", "EVENT_INVITE", "ACHIEVEMENT"]).default("ANNOUNCEMENT"),
  title: z.string().trim().min(1, "Title is required"),
  body: z.string().trim().min(1, "Details are required"),
  eventDate: z.string().trim().optional(),
  eventLocation: z.string().trim().optional(),
});

export async function createPost(
  formData: FormData
): Promise<{ error: string | null }> {
  const session = await requireUser();

  const parsed = postSchema.safeParse({
    type: formData.get("type") || undefined,
    title: formData.get("title"),
    body: formData.get("body"),
    eventDate: formData.get("eventDate") || undefined,
    eventLocation: formData.get("eventLocation") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid post." };
  }
  const { type, title, body, eventDate, eventLocation } = parsed.data;

  const post = await prisma.post.create({
    data: {
      authorId: session.user.id,
      type,
      title,
      body,
      eventDate: eventDate ? new Date(eventDate) : null,
      eventLocation: eventLocation || null,
    },
  });

  revalidatePath("/");
  redirect(`/posts/${post.id}`);
}

export async function deletePost(postId: string) {
  const session = await requireUser();

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return;
  if (post.authorId !== session.user.id && session.user.role !== "ADMIN") return;

  await prisma.post.delete({ where: { id: postId } });
  revalidatePath("/");
  redirect("/");
}

const commentSchema = z.object({
  body: z.string().trim().min(1),
});

export async function createComment(postId: string, formData: FormData) {
  const session = await requireUser();

  const parsed = commentSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) return;

  await prisma.comment.create({
    data: { postId, authorId: session.user.id, body: parsed.data.body },
  });

  revalidatePath(`/posts/${postId}`);
}

export async function deleteComment(commentId: string, postId: string) {
  const session = await requireUser();

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) return;
  if (comment.authorId !== session.user.id && session.user.role !== "ADMIN") return;

  await prisma.comment.delete({ where: { id: commentId } });
  revalidatePath(`/posts/${postId}`);
}

export async function toggleLike(postId: string) {
  const session = await requireUser();

  const existing = await prisma.like.findUnique({
    where: { postId_userId: { postId, userId: session.user.id } },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    await prisma.like.create({ data: { postId, userId: session.user.id } });
  }

  revalidatePath("/");
  revalidatePath(`/posts/${postId}`);
}
