import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { createUser, createChirp, follow } from "../helpers/factory";

/**
 * Pure feed-ordering tests.  These exercise the data model directly so they
 * pass as soon as the Prisma schema + test DB are in place.  When lib/feed.ts
 * lands (home-feed stream), add a parallel describe block that calls getFeed()
 * and asserts the same invariants through the public API.
 */
describe("feed — ordering and filtering (data layer)", () => {
  it("returns chirps from followed users, newest first", async () => {
    const alice = await createUser();
    const bob = await createUser();
    const carol = await createUser();

    await follow(alice.id, bob.id); // alice follows bob (but not carol)

    // Stagger timestamps via sequential inserts — Postgres preserves insert order
    // when createdAt has millisecond precision.
    const old = await createChirp(bob.id, { text: "older chirp" });
    const fresh = await createChirp(bob.id, { text: "newer chirp" });
    await createChirp(carol.id, { text: "carol chirp — should be excluded" });

    const followingIds = await db.follow
      .findMany({ where: { followerId: alice.id }, select: { followingId: true } })
      .then((rows) => rows.map((r) => r.followingId));

    const feed = await db.chirp.findMany({
      where: { authorId: { in: followingIds } },
      orderBy: { createdAt: "desc" },
    });

    expect(feed).toHaveLength(2);
    expect(feed[0].id).toBe(fresh.id);
    expect(feed[1].id).toBe(old.id);
    expect(feed.every((c) => c.authorId === bob.id)).toBe(true);
  });

  it("returns an empty feed when the user follows nobody", async () => {
    const alice = await createUser();
    await createChirp((await createUser()).id);

    const followingIds = await db.follow
      .findMany({ where: { followerId: alice.id }, select: { followingId: true } })
      .then((rows) => rows.map((r) => r.followingId));

    const feed = await db.chirp.findMany({
      where: { authorId: { in: followingIds } },
      orderBy: { createdAt: "desc" },
    });

    expect(feed).toHaveLength(0);
  });

  it("excludes chirps from unfollowed users after unfollow", async () => {
    const alice = await createUser();
    const bob = await createUser();

    await db.follow.create({ data: { followerId: alice.id, followingId: bob.id } });
    await createChirp(bob.id);

    // Unfollow
    await db.follow.delete({
      where: { followerId_followingId: { followerId: alice.id, followingId: bob.id } },
    });

    const followingIds = await db.follow
      .findMany({ where: { followerId: alice.id }, select: { followingId: true } })
      .then((rows) => rows.map((r) => r.followingId));

    const feed = await db.chirp.findMany({
      where: { authorId: { in: followingIds } },
    });

    expect(feed).toHaveLength(0);
  });
});
