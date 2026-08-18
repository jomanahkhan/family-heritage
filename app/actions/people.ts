"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

const personSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  gender: z.enum(["MALE", "FEMALE", "UNKNOWN"]).default("UNKNOWN"),
  dob: z.string().trim().optional(),
  dateOfDeath: z.string().trim().optional(),
  city: z.string().trim().optional(),
  bio: z.string().trim().optional(),
});

function toDate(value: string | undefined) {
  return value ? new Date(value) : null;
}

type PersonFormResult =
  | { success: true; data: z.infer<typeof personSchema> }
  | { success: false; error: string };

function parsePersonForm(formData: FormData): PersonFormResult {
  const parsed = personSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    gender: formData.get("gender") || undefined,
    dob: formData.get("dob") || undefined,
    dateOfDeath: formData.get("dateOfDeath") || undefined,
    city: formData.get("city") || undefined,
    bio: formData.get("bio") || undefined,
  });
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid person details.";
    return { success: false, error: message };
  }
  return { success: true, data: parsed.data };
}

export async function createPerson(
  formData: FormData
): Promise<{ error: string | null }> {
  await requireAdmin();

  const parsed = parsePersonForm(formData);
  if (!parsed.success) return { error: parsed.error };
  const { firstName, lastName, gender, dob, dateOfDeath, city, bio } = parsed.data;

  const person = await prisma.person.create({
    data: {
      firstName,
      lastName,
      gender,
      dob: toDate(dob),
      dateOfDeath: toDate(dateOfDeath),
      city: city || null,
      bio: bio || null,
    },
  });

  revalidatePath("/admin/people");
  redirect(`/admin/people/${person.id}`);
}

export async function updatePerson(
  personId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  await requireAdmin();

  const parsed = parsePersonForm(formData);
  if (!parsed.success) return { error: parsed.error };
  const { firstName, lastName, gender, dob, dateOfDeath, city, bio } = parsed.data;

  await prisma.person.update({
    where: { id: personId },
    data: {
      firstName,
      lastName,
      gender,
      dob: toDate(dob),
      dateOfDeath: toDate(dateOfDeath),
      city: city || null,
      bio: bio || null,
    },
  });

  revalidatePath("/admin/people");
  revalidatePath(`/admin/people/${personId}`);
  return { error: null };
}

export async function deletePerson(personId: string) {
  await requireAdmin();
  await prisma.person.delete({ where: { id: personId } });
  revalidatePath("/admin/people");
  redirect("/admin/people");
}

const parentChildSchema = z.object({
  parentId: z.string().min(1),
  childId: z.string().min(1),
});

export async function addParentChild(formData: FormData) {
  await requireAdmin();

  const parsed = parentChildSchema.safeParse({
    parentId: formData.get("parentId"),
    childId: formData.get("childId"),
  });
  if (!parsed.success) return;
  const { parentId, childId } = parsed.data;
  if (parentId === childId) return;

  await prisma.parentChild.create({ data: { parentId, childId } }).catch(() => {
    // unique constraint (parentId, childId) — edge already exists, ignore
  });

  revalidatePath(`/admin/people/${parentId}`);
  revalidatePath(`/admin/people/${childId}`);
}

export async function removeParentChild(edgeId: string, personId: string) {
  await requireAdmin();
  await prisma.parentChild.delete({ where: { id: edgeId } });
  revalidatePath(`/admin/people/${personId}`);
}

const partnershipSchema = z.object({
  personAId: z.string().min(1),
  personBId: z.string().min(1),
  status: z.enum(["MARRIED", "PARTNERED", "DIVORCED"]).default("MARRIED"),
  startDate: z.string().trim().optional(),
});

export async function addPartnership(formData: FormData) {
  await requireAdmin();

  const parsed = partnershipSchema.safeParse({
    personAId: formData.get("personAId"),
    personBId: formData.get("personBId"),
    status: formData.get("status") || undefined,
    startDate: formData.get("startDate") || undefined,
  });
  if (!parsed.success) return;
  const { personAId, personBId, status, startDate } = parsed.data;
  if (personAId === personBId) return;

  const [a, b] = [personAId, personBId].sort();
  await prisma.partnership
    .create({
      data: { personAId: a, personBId: b, status, startDate: toDate(startDate) },
    })
    .catch(() => {
      // unique constraint (personAId, personBId) — edge already exists, ignore
    });

  revalidatePath(`/admin/people/${personAId}`);
  revalidatePath(`/admin/people/${personBId}`);
}

export async function removePartnership(partnershipId: string, personId: string) {
  await requireAdmin();
  await prisma.partnership.delete({ where: { id: partnershipId } });
  revalidatePath(`/admin/people/${personId}`);
}
