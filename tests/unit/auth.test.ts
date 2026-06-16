import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createUser } from "../helpers/factory";

describe("auth — password hashing", () => {
  it("stores a bcrypt hash, not the plaintext password", async () => {
    const user = await createUser({ password: "secret123" });
    expect(user.passwordHash).not.toBe("secret123");
    expect(user.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it("verifies the correct password", async () => {
    const user = await createUser({ password: "correcthorse" });
    expect(await bcrypt.compare("correcthorse", user.passwordHash)).toBe(true);
  });

  it("rejects the wrong password", async () => {
    const user = await createUser({ password: "correcthorse" });
    expect(await bcrypt.compare("wrongpassword", user.passwordHash)).toBe(false);
  });
});

describe("auth — user uniqueness", () => {
  it("rejects a duplicate email", async () => {
    await createUser({ email: "dup@example.com", handle: "handleA" });
    await expect(
      createUser({ email: "dup@example.com", handle: "handleB" })
    ).rejects.toThrow();
  });

  it("rejects a duplicate handle", async () => {
    await createUser({ email: "a@example.com", handle: "samehandle" });
    await expect(
      createUser({ email: "b@example.com", handle: "samehandle" })
    ).rejects.toThrow();
  });
});

describe("auth — user fields", () => {
  it("persists email, handle, and displayName", async () => {
    const user = await createUser({
      email: "alice@example.com",
      handle: "alice",
      displayName: "Alice Smith",
    });
    expect(user.email).toBe("alice@example.com");
    expect(user.handle).toBe("alice");
    expect(user.displayName).toBe("Alice Smith");
  });

  it("allows an optional bio", async () => {
    const withBio = await createUser({ bio: "Hello, world!" });
    const withoutBio = await createUser();
    expect(withBio.bio).toBe("Hello, world!");
    expect(withoutBio.bio).toBeNull();
  });

  it("assigns a cuid as the primary key", async () => {
    const user = await createUser();
    expect(user.id).toMatch(/^c[a-z0-9]+$/);
  });
});
