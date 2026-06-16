import type { Metadata } from "next"
import { getExploreFeed } from "@/lib/explore"
import { getCurrentUser } from "@/lib/auth"
import { ChirpCard } from "@/components/ChirpCard"
import { FollowButton } from "@/components/FollowButton"
import { LikeButton } from "@/components/LikeButton"

export const metadata: Metadata = {
  title: "Explore — Chirp",
  description: "Discover recent chirps from everyone on Chirp",
}

interface ExplorePageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)

  const currentUser = await getCurrentUser()
  const { items, nextPage, prevPage } = await getExploreFeed(page, currentUser?.id)

  return (
    <main className="mx-auto max-w-xl py-6">
      <h1 className="mb-4 text-xl font-bold">Explore</h1>

      {items.length === 0 ? (
        <p className="py-12 text-center text-gray-500">No chirps yet.</p>
      ) : (
        <ol className="divide-y divide-gray-100">
          {items.map((chirp) => (
            <li key={chirp.id}>
              <ChirpCard
                chirp={chirp}
                actions={
                  <>
                    {currentUser && currentUser.id !== chirp.author.id && (
                      <FollowButton
                        targetUserId={chirp.author.id}
                        targetHandle={chirp.author.handle}
                        initialIsFollowing={chirp.author.isFollowedByViewer}
                      />
                    )}
                    {currentUser ? (
                      <LikeButton
                        chirpId={chirp.id}
                        initialLikeCount={chirp.likeCount}
                        initialLiked={chirp.isLikedByViewer}
                      />
                    ) : (
                      <span className="text-sm text-gray-500">
                        {chirp.likeCount}{" "}
                        {chirp.likeCount === 1 ? "like" : "likes"}
                      </span>
                    )}
                  </>
                }
              />
            </li>
          ))}
        </ol>
      )}

      <nav className="mt-6 flex justify-between text-sm">
        {prevPage ? (
          <a
            href={`/explore?page=${prevPage}`}
            className="text-blue-600 hover:underline"
          >
            ← Newer
          </a>
        ) : (
          <span />
        )}
        {nextPage && (
          <a
            href={`/explore?page=${nextPage}`}
            className="text-blue-600 hover:underline"
          >
            Older →
          </a>
        )}
      </nav>
    </main>
  )
}
