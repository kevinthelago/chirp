import { afterEach, afterAll, beforeAll } from "vitest";
import { db } from "@/lib/db";

beforeAll(async () => {
  // Guard: refuse to run against a non-test DATABASE_URL to prevent
  // accidentally wiping a staging or production database.
  const url = process.env.DATABASE_URL ?? "";
  if (!url.includes("test") && !url.includes("localhost") && !url.includes("127.0.0.1")) {
    throw new Error(
      `Refusing to run tests against DATABASE_URL="${url}". ` +
        'Use a local or test-specific database (URL must contain "test", "localhost", or "127.0.0.1").'
    );
  }
});

// Truncate all tables in FK-safe order after every test so each test
// starts with a clean slate.  This is the transaction-rollback equivalent
// for code that uses the global `db` singleton directly.
afterEach(async () => {
  await db.$transaction([
    db.like.deleteMany(),
    db.chirp.deleteMany(),
    db.follow.deleteMany(),
    db.user.deleteMany(),
  ]);
});

afterAll(async () => {
  await db.$disconnect();
});
