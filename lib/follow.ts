import { db } from "@/lib/db"

export async function followUser(followerId: string, followingId: string): Promise<void> {
  await db.follow.create({
    data: { followerId, followingId },
  })
}

export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  await db.follow.deleteMany({
    where: { followerId, followingId },
  })
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const follow = await db.follow.findFirst({
    where: { followerId, followingId },
  })
  return follow !== null
}

/**
 * Returns the IDs of all users that `userId` follows.
 * Consumed by the home-feed stream for the feed query.
 */
export async function getFollowingIds(userId: string): Promise<string[]> {
  const follows = await db.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  })
  return follows.map((f) => f.followingId)
}
