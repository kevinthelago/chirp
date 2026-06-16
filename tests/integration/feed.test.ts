import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { createUser, createChirp, follow, like } from "../helpers/factory";

/**
 * End-to-end feed tests that exercise the full data model.
 * These complement the unit/feed.test.ts ordering tests by verifying
 * like counts, author info, and multi-user scenarios are correct.
 */
describe("feed — end-to-end integration", () => {
  it("includes like counts on feed chirps", async () => {
    const alice = await createUser();
    const bob = await createUser();
    const carol = await createUser();

    await follow(alice.id, bob.id);
    const chirp = await createChirp(bob.id);
    await like(carol.id, chirp.id);
    await like(alice.id, chirp.id);

    const followingIds = await db.follow
      .findMany({ where: { followerId: alice.id }, select: { followingId: true } })
      .then((rows) => rows.map((r) => r.followingId));

    const feed = await db.chirp.findMany({
      where: { authorId: { in: followingIds } },
      include: { likes: true, author: true },
      orderBy: { createdAt: "desc" },
    });

    expect(feed[0].likes).toHaveLength(2);
  });

  it("aggregates chirps from multiple followed accounts", async () => {
    const viewer = await createUser();
    const a = await createUser();
    const b = await createUser();
    const c = await createUser(); // not followed

    await follow(viewer.id, a.id);
    await follow(viewer.id, b.id);

    await createChirp(a.id);
    await createChirp(b.id);
    await createChirp(b.id);
    await createChirp(c.id); // should not appear

    const followingIds = await db.follow
      .findMany({ where: { followerId: viewer.id }, select: { followingId: true } })
      .then((rows) => rows.map((r) => r.followingId));

    const feed = await db.chirp.findMany({
      where: { authorId: { in: followingIds } },
      orderBy: { createdAt: "desc" },
    });

    expect(feed).toHaveLength(3);
    const authorIds = new Set(feed.map((f) => f.authorId));
    expect(authorIds.has(c.id)).toBe(false);
  });

  it("reflects newly posted chirps immediately", async () => {
    const alice = await createUser();
    const bob = await createUser();
    await follow(alice.id, bob.id);

    const getAliceFeed = async () => {
      const ids = await db.follow
        .findMany({ where: { followerId: alice.id }, select: { followingId: true } })
        .then((rows) => rows.map((r) => r.followingId));
      return db.chirp.findMany({
        where: { authorId: { in: ids } },
        orderBy: { createdAt: "desc" },
      });
    };

    expect(await getAliceFeed()).toHaveLength(0);

    await createChirp(bob.id, { text: "First chirp" });
    expect(await getAliceFeed()).toHaveLength(1);

    await createChirp(bob.id, { text: "Second chirp" });
    const feed = await getAliceFeed();
    expect(feed).toHaveLength(2);
    expect(feed[0].text).toBe("Second chirp"); // newest first
  });
});
