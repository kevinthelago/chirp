import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { createUser, createChirp, like } from "../helpers/factory";

describe("likes — create and remove", () => {
  it("creates a like record linking the correct user and chirp", async () => {
    const user = await createUser();
    const author = await createUser();
    const chirp = await createChirp(author.id);

    await like(user.id, chirp.id);

    const record = await db.like.findUnique({
      where: { userId_chirpId: { userId: user.id, chirpId: chirp.id } },
    });
    expect(record).not.toBeNull();
    expect(record!.userId).toBe(user.id);
    expect(record!.chirpId).toBe(chirp.id);
  });

  it("prevents liking the same chirp twice (unique constraint)", async () => {
    const user = await createUser();
    const chirp = await createChirp((await createUser()).id);

    await like(user.id, chirp.id);
    await expect(like(user.id, chirp.id)).rejects.toThrow();
  });

  it("removes a like", async () => {
    const user = await createUser();
    const chirp = await createChirp((await createUser()).id);
    await like(user.id, chirp.id);

    await db.like.delete({
      where: { userId_chirpId: { userId: user.id, chirpId: chirp.id } },
    });

    const record = await db.like.findUnique({
      where: { userId_chirpId: { userId: user.id, chirpId: chirp.id } },
    });
    expect(record).toBeNull();
  });

  it("allows multiple users to like the same chirp", async () => {
    const alice = await createUser();
    const bob = await createUser();
    const chirp = await createChirp((await createUser()).id);

    await like(alice.id, chirp.id);
    await like(bob.id, chirp.id);

    const count = await db.like.count({ where: { chirpId: chirp.id } });
    expect(count).toBe(2);
  });

  it("cascades like deletion when the chirp is deleted", async () => {
    const user = await createUser();
    const chirp = await createChirp((await createUser()).id);
    await like(user.id, chirp.id);

    await db.chirp.delete({ where: { id: chirp.id } });

    const record = await db.like.findUnique({
      where: { userId_chirpId: { userId: user.id, chirpId: chirp.id } },
    });
    expect(record).toBeNull();
  });

  it("counts likes correctly on a chirp", async () => {
    const author = await createUser();
    const chirp = await createChirp(author.id);
    const likers = await Promise.all([createUser(), createUser(), createUser()]);

    for (const l of likers) {
      await like(l.id, chirp.id);
    }

    const likeCount = await db.like.count({ where: { chirpId: chirp.id } });
    expect(likeCount).toBe(3);
  });
});
