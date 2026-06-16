import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { createUser, createChirp } from "../helpers/factory";

describe("chirps — CRUD", () => {
  it("creates a chirp with the correct author and text", async () => {
    const author = await createUser();
    const chirp = await createChirp(author.id, { text: "Hello, Chirp!" });

    expect(chirp.authorId).toBe(author.id);
    expect(chirp.text).toBe("Hello, Chirp!");
    expect(chirp.id).toBeTruthy();
    expect(chirp.createdAt).toBeInstanceOf(Date);
  });

  it("lists all chirps by a given author", async () => {
    const alice = await createUser();
    const bob = await createUser();

    await createChirp(alice.id, { text: "alice 1" });
    await createChirp(alice.id, { text: "alice 2" });
    await createChirp(bob.id, { text: "bob 1" });

    const aliceChirps = await db.chirp.findMany({
      where: { authorId: alice.id },
      orderBy: { createdAt: "desc" },
    });

    expect(aliceChirps).toHaveLength(2);
    expect(aliceChirps.every((c) => c.authorId === alice.id)).toBe(true);
  });

  it("deletes a chirp and cascades its likes", async () => {
    const author = await createUser();
    const liker = await createUser();
    const chirp = await createChirp(author.id);
    await db.like.create({ data: { userId: liker.id, chirpId: chirp.id } });

    await db.chirp.delete({ where: { id: chirp.id } });

    const found = await db.chirp.findUnique({ where: { id: chirp.id } });
    const likeFound = await db.like.findUnique({
      where: { userId_chirpId: { userId: liker.id, chirpId: chirp.id } },
    });

    expect(found).toBeNull();
    expect(likeFound).toBeNull();
  });

  it("cascades chirp deletion when the author is deleted", async () => {
    const author = await createUser();
    const chirp = await createChirp(author.id);

    await db.user.delete({ where: { id: author.id } });

    const found = await db.chirp.findUnique({ where: { id: chirp.id } });
    expect(found).toBeNull();
  });

  it("indexes chirps by authorId + createdAt for efficient feed queries", async () => {
    // Smoke-test: if the compound index is absent Prisma would still work but
    // this query would be a full scan — we just verify it resolves correctly.
    const author = await createUser();
    for (let i = 0; i < 3; i++) {
      await createChirp(author.id);
    }
    const chirps = await db.chirp.findMany({
      where: { authorId: author.id },
      orderBy: { createdAt: "desc" },
    });
    expect(chirps).toHaveLength(3);
  });
});
