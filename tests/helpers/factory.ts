import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import type { User, Chirp } from "@prisma/client";

let seq = 0;
const next = () => ++seq;

export async function createUser(
  overrides: Partial<{
    email: string;
    handle: string;
    displayName: string;
    password: string;
    bio: string;
  }> = {}
): Promise<User> {
  const n = next();
  const password = overrides.password ?? "Password123!";
  return db.user.create({
    data: {
      email: overrides.email ?? `user${n}@example.com`,
      handle: overrides.handle ?? `user${n}`,
      displayName: overrides.displayName ?? `User ${n}`,
      bio: overrides.bio ?? null,
      passwordHash: await bcrypt.hash(password, 10),
    },
  });
}

export async function createChirp(
  authorId: string,
  overrides: Partial<{ text: string }> = {}
): Promise<Chirp> {
  return db.chirp.create({
    data: {
      authorId,
      text: overrides.text ?? `Chirp from ${authorId} #${next()}`,
    },
  });
}

export async function follow(followerId: string, followingId: string) {
  return db.follow.create({ data: { followerId, followingId } });
}

export async function like(userId: string, chirpId: string) {
  return db.like.create({ data: { userId, chirpId } });
}
