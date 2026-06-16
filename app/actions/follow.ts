"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { followUser, unfollowUser, isFollowing } from "@/lib/follow"

export async function toggleFollow(
  targetUserId: string,
  targetHandle: string,
): Promise<{ isFollowing: boolean }> {
  const user = await getCurrentUser()

  if (!user?.id) {
    throw new Error("Not authenticated")
  }

  if (user.id === targetUserId) {
    throw new Error("Cannot follow yourself")
  }

  const already = await isFollowing(user.id, targetUserId)

  if (already) {
    await unfollowUser(user.id, targetUserId)
  } else {
    await followUser(user.id, targetUserId)
  }

  revalidatePath(`/${targetHandle}`)
  revalidatePath("/")

  return { isFollowing: !already }
}
