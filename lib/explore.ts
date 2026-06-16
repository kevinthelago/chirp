import { db } from "@/lib/db"

const PAGE_SIZE = 20

export interface ExploreFeedItem {
  id: string
  text: string
  createdAt: Date
  likeCount: number
  isLikedByViewer: boolean
  author: {
    id: string
    handle: string
    displayName: string
    isFollowedByViewer: boolean
  }
}

export interface ExploreFeedResult {
  items: ExploreFeedItem[]
  nextPage: number | null
  prevPage: number | null
}

/**
 * Returns all chirps newest-first, paginated.
 *
 * @param page     1-based page number
 * @param viewerUserId  Signed-in user's ID; omit for signed-out visitors.
 *                      When provided, isLikedByViewer and isFollowedByViewer
 *                      are populated from the database. Without it both fields
 *                      are always false (no extra queries, just an empty subselect).
 */
export async function getExploreFeed(
  page: number = 1,
  viewerUserId?: string,
): Promise<ExploreFeedResult> {
  const skip = (page - 1) * PAGE_SIZE
  // A CUID can never equal this string, so the nested selects return empty
  // arrays for signed-out visitors without a separate code path.
  const vid = viewerUserId ?? "_no_viewer_"

  const rows = await db.chirp.findMany({
    skip,
    take: PAGE_SIZE + 1,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      text: true,
      createdAt: true,
      _count: { select: { likes: true } },
      likes: {
        where: { userId: vid },
        select: { userId: true },
      },
      author: {
        select: {
          id: true,
          handle: true,
          displayName: true,
          // followers is the relation "Following" — records where followingId = author.id
          followers: {
            where: { followerId: vid },
            select: { followerId: true },
          },
        },
      },
    },
  })

  const hasNext = rows.length > PAGE_SIZE
  const slice = hasNext ? rows.slice(0, PAGE_SIZE) : rows

  return {
    items: slice.map((r) => ({
      id: r.id,
      text: r.text,
      createdAt: r.createdAt,
      likeCount: r._count.likes,
      isLikedByViewer: r.likes.length > 0,
      author: {
        id: r.author.id,
        handle: r.author.handle,
        displayName: r.author.displayName,
        isFollowedByViewer: r.author.followers.length > 0,
      },
    })),
    nextPage: hasNext ? page + 1 : null,
    prevPage: page > 1 ? page - 1 : null,
  }
}
