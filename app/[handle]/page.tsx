import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import ChirpCard from "@/components/ChirpCard";
import { FollowButton } from "@/components/FollowButton";
import { LikeButton } from "@/components/LikeButton";

interface Props {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const user = await db.user.findUnique({
    where: { handle },
    select: { displayName: true },
  });
  if (!user) return { title: "Profile not found" };
  return { title: `${user.displayName} (@${handle})` };
}

export default async function ProfilePage({ params }: Props) {
  const { handle } = await params;
  const session = await getCurrentUser();

  const user = await db.user.findUnique({
    where: { handle },
    select: {
      id: true,
      handle: true,
      displayName: true,
      bio: true,
      _count: {
        select: {
          followers: true,
          following: true,
        },
      },
      chirps: {
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, handle: true, displayName: true } },
          _count: { select: { likes: true } },
        },
      },
    },
  });

  if (!user) notFound();

  const isOwner = session?.id === user.id;

  const [followRow, likedIds] = await Promise.all([
    !isOwner && session
      ? db.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: session.id,
              followingId: user.id,
            },
          },
          select: { followerId: true },
        })
      : null,
    session
      ? db.like
          .findMany({
            where: {
              userId: session.id,
              chirpId: { in: user.chirps.map((c) => c.id) },
            },
            select: { chirpId: true },
          })
          .then((rows) => new Set(rows.map((r) => r.chirpId)))
      : Promise.resolve(new Set<string>()),
  ]);

  const isFollowing = followRow !== null;

  return (
    <main className="max-w-xl mx-auto border-x border-gray-200 min-h-screen">
      <header className="px-4 py-3 border-b border-gray-200 font-bold text-xl sticky top-0 bg-white/80 backdrop-blur">
        {user.displayName}
      </header>

      <section className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold">{user.displayName}</h1>
            <p className="text-gray-500 text-sm">@{user.handle}</p>
            {user.bio && <p className="mt-3 text-sm">{user.bio}</p>}
            <div className="flex gap-4 mt-3 text-sm text-gray-600">
              <span>
                <strong className="text-black">{user._count.following}</strong>{" "}
                Following
              </span>
              <span>
                <strong className="text-black">{user._count.followers}</strong>{" "}
                Followers
              </span>
            </div>
          </div>

          {isOwner ? (
            <Link
              href="/settings"
              className="shrink-0 rounded-full border border-gray-300 px-4 py-1.5 text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              Edit profile
            </Link>
          ) : session && !isOwner ? (
            <FollowButton
              targetUserId={user.id}
              targetHandle={user.handle}
              initialIsFollowing={isFollowing}
            />
          ) : null}
        </div>
      </section>

      <section>
        {user.chirps.length === 0 ? (
          <p className="p-8 text-center text-gray-500 text-sm">No chirps yet.</p>
        ) : (
          user.chirps.map((chirp) => (
            <ChirpCard
              key={chirp.id}
              chirp={chirp}
              currentUserId={session?.id}
              likeSlot={
                <LikeButton
                  chirpId={chirp.id}
                  initialCount={chirp._count.likes}
                  initialLiked={likedIds.has(chirp.id)}
                />
              }
            />
          ))
        )}
      </section>
    </main>
  );
}
