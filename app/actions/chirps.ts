"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const MAX_CHARS = 280;

const chirpSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Chirp cannot be empty")
    .max(MAX_CHARS, `Chirp exceeds ${MAX_CHARS} characters`),
});

export type CreateChirpState = { error: string } | { success: true } | null;

export async function createChirp(
  _prevState: CreateChirpState,
  formData: FormData,
): Promise<CreateChirpState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = chirpSchema.safeParse({ text: formData.get("text") });
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  await db.chirp.create({
    data: { authorId: user.id, text: parsed.data.text },
  });

  revalidatePath("/");
  revalidatePath(`/${user.handle}`);
  return { success: true };
}

export async function deleteChirp(chirpId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const chirp = await db.chirp.findUnique({
    where: { id: chirpId },
    select: { authorId: true, author: { select: { handle: true } } },
  });

  if (!chirp || chirp.authorId !== user.id) return;

  await db.chirp.delete({ where: { id: chirpId } });

  revalidatePath("/");
  revalidatePath(`/${user.handle}`);
  revalidatePath(`/${chirp.author.handle}`);
}
