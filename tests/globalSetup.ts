import { execSync } from "child_process";

export default async function setup() {
  const env = { ...process.env };
  if (!env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Set TEST_DATABASE_URL or DATABASE_URL to point at a test Postgres instance."
    );
  }
  // Apply any pending migrations to the test database.
  execSync("npx prisma migrate deploy", { env, stdio: "inherit" });
}
