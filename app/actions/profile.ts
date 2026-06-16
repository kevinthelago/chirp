"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const schema = z.object({
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(50, "Display name cannot exceed 50 characters"),
  bio: z
    .string()
    .max(160, "Bio cannot exceed 160 characters")
    .optional(),
});

export type UpdateProfileState = {
  error?: string;
  success?: boolean;
};

export async function updateProfile(
  _prev: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const session = await getSession();
  if (!session) return { error: "You must be signed in to update your profile." };

  const parsed = schema.safeParse({
    displayName: formData.get("displayName"),
    bio: (formData.get("bio") as string) || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await db.user.update({
    where: { id: session.userId },
    data: {
      displayName: parsed.data.displayName,
      bio: parsed.data.bio ?? null,
    },
  });

  revalidatePath(`/${session.handle}`);
  return { success: true };
}
