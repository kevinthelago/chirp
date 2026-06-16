import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/**
 * Runs `fn` inside a Prisma interactive transaction and rolls back afterwards.
 * Use this when the code under test accepts a `Prisma.TransactionClient` so
 * tests have zero persistent side-effects.
 *
 * For code that uses the global `db` singleton directly, use the `afterEach`
 * cleanup in `tests/setup.ts` instead.
 */
export async function withRollback<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  const ROLLBACK_SENTINEL = "__vitest_rollback__";
  let captured!: T;
  try {
    await db.$transaction(async (tx) => {
      captured = await fn(tx);
      // Throwing causes Prisma to roll back the transaction.
      throw new Error(ROLLBACK_SENTINEL);
    });
  } catch (e) {
    if (e instanceof Error && e.message === ROLLBACK_SENTINEL) {
      return captured;
    }
    throw e;
  }
  // Unreachable — keeps TypeScript happy.
  return captured;
}
