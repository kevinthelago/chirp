"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/session"
import { hasLiked, likeChirp, unlikeChirp } from "@/lib/like"

export async function toggleLike(chirpId: string): Promise<{ liked: boolean }> {
  const user = await getCurrentUser()

  if (!user?.id) {
    throw new Error("Not authenticated")
  }

  const already = await hasLiked(user.id, chirpId)

  if (already) {
    await unlikeChirp(user.id, chirpId)
  } else {
    await likeChirp(user.id, chirpId)
  }

  revalidatePath("/")

  return { liked: !already }
}
