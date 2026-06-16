import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { createUser, follow } from "../helpers/factory";

describe("follow — create and remove", () => {
  it("creates a follow relationship", async () => {
    const alice = await createUser();
    const bob = await createUser();

    await follow(alice.id, bob.id);

    const record = await db.follow.findUnique({
      where: { followerId_followingId: { followerId: alice.id, followingId: bob.id } },
    });
    expect(record).not.toBeNull();
    expect(record!.followerId).toBe(alice.id);
    expect(record!.followingId).toBe(bob.id);
  });

  it("prevents following the same user twice (unique constraint)", async () => {
    const alice = await createUser();
    const bob = await createUser();

    await follow(alice.id, bob.id);
    await expect(follow(alice.id, bob.id)).rejects.toThrow();
  });

  it("removes a follow relationship", async () => {
    const alice = await createUser();
    const bob = await createUser();
    await follow(alice.id, bob.id);

    await db.follow.delete({
      where: { followerId_followingId: { followerId: alice.id, followingId: bob.id } },
    });

    const record = await db.follow.findUnique({
      where: { followerId_followingId: { followerId: alice.id, followingId: bob.id } },
    });
    expect(record).toBeNull();
  });

  it("allows bidirectional following", async () => {
    const alice = await createUser();
    const bob = await createUser();

    await follow(alice.id, bob.id);
    await follow(bob.id, alice.id);

    const [a2b, b2a] = await Promise.all([
      db.follow.findUnique({
        where: { followerId_followingId: { followerId: alice.id, followingId: bob.id } },
      }),
      db.follow.findUnique({
        where: { followerId_followingId: { followerId: bob.id, followingId: alice.id } },
      }),
    ]);

    expect(a2b).not.toBeNull();
    expect(b2a).not.toBeNull();
  });

  it("cascades follow deletion when a user is deleted", async () => {
    const alice = await createUser();
    const bob = await createUser();
    await follow(alice.id, bob.id);

    // Delete alice — her follows should disappear too
    await db.user.delete({ where: { id: alice.id } });

    const record = await db.follow.findMany({ where: { followerId: alice.id } });
    expect(record).toHaveLength(0);
  });

  it("lists all accounts a user is following", async () => {
    const alice = await createUser();
    const bob = await createUser();
    const carol = await createUser();

    await follow(alice.id, bob.id);
    await follow(alice.id, carol.id);

    const following = await db.follow.findMany({
      where: { followerId: alice.id },
      include: { following: true },
    });

    expect(following).toHaveLength(2);
    const handles = following.map((f) => f.following.handle);
    expect(handles).toContain(bob.handle);
    expect(handles).toContain(carol.handle);
  });
});
