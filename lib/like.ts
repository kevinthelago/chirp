import { db } from "@/lib/db"

export async function likeChirp(userId: string, chirpId: string): Promise<void> {
  await db.like.upsert({
    where: { userId_chirpId: { userId, chirpId } },
    update: {},
    create: { userId, chirpId },
  })
}

export async function unlikeChirp(userId: string, chirpId: string): Promise<void> {
  await db.like.deleteMany({
    where: { userId, chirpId },
  })
}

export async function hasLiked(userId: string, chirpId: string): Promise<boolean> {
  const like = await db.like.findFirst({
    where: { userId, chirpId },
  })
  return like !== null
}

export async function getLikeCount(chirpId: string): Promise<number> {
  return db.like.count({ where: { chirpId } })
}

/**
 * Returns a map of chirpId → whether userId has liked it.
 * Consumed by feed/explore to annotate chirp lists in bulk.
 */
export async function likedByMe(
  chirpIds: string[],
  userId: string,
): Promise<Record<string, boolean>> {
  if (chirpIds.length === 0) return {}
  const likes = await db.like.findMany({
    where: { chirpId: { in: chirpIds }, userId },
    select: { chirpId: true },
  })
  const liked = new Set(likes.map((l: { chirpId: string }) => l.chirpId))
  return Object.fromEntries(chirpIds.map((id) => [id, liked.has(id)]))
}
