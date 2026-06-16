import { beforeEach, describe, expect, it, vi } from "vitest";
import { createChirp, deleteChirp } from "./chirps";

vi.mock("@/lib/db", () => ({
  db: {
    chirp: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/session", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { revalidatePath } from "next/cache";

const mockDb = db as {
  chirp: {
    create: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};
const mockGetCurrentUser = getCurrentUser as ReturnType<typeof vi.fn>;
const mockRevalidatePath = revalidatePath as ReturnType<typeof vi.fn>;

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return fd;
}

const MOCK_USER = { id: "user-1", handle: "alice", displayName: "Alice", email: "alice@example.com" };

describe("createChirp", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    const result = await createChirp(null, makeFormData({ text: "hello" }));
    expect(result).toEqual({ error: "Not authenticated" });
    expect(mockDb.chirp.create).not.toHaveBeenCalled();
  });

  it("returns error for empty text", async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_USER);
    const result = await createChirp(null, makeFormData({ text: "   " }));
    expect(result).toEqual({ error: "Chirp cannot be empty" });
  });

  it("returns error when text exceeds 280 characters", async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_USER);
    const result = await createChirp(null, makeFormData({ text: "a".repeat(281) }));
    expect(result).toEqual({ error: "Chirp exceeds 280 characters" });
  });

  it("creates chirp and revalidates paths on success", async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_USER);
    mockDb.chirp.create.mockResolvedValue({});
    const result = await createChirp(null, makeFormData({ text: "Hello world" }));
    expect(result).toEqual({ success: true });
    expect(mockDb.chirp.create).toHaveBeenCalledWith({
      data: { authorId: "user-1", text: "Hello world" },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/alice");
  });

  it("accepts text at exactly 280 characters", async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_USER);
    mockDb.chirp.create.mockResolvedValue({});
    const result = await createChirp(null, makeFormData({ text: "a".repeat(280) }));
    expect(result).toEqual({ success: true });
  });
});

describe("deleteChirp", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does nothing when not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    await deleteChirp("chirp-1");
    expect(mockDb.chirp.findUnique).not.toHaveBeenCalled();
  });

  it("does nothing when chirp not found", async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_USER);
    mockDb.chirp.findUnique.mockResolvedValue(null);
    await deleteChirp("chirp-1");
    expect(mockDb.chirp.delete).not.toHaveBeenCalled();
  });

  it("does nothing when user does not own the chirp", async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_USER);
    mockDb.chirp.findUnique.mockResolvedValue({
      authorId: "other-user",
      author: { handle: "bob" },
    });
    await deleteChirp("chirp-1");
    expect(mockDb.chirp.delete).not.toHaveBeenCalled();
  });

  it("deletes chirp and revalidates paths when owner requests deletion", async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_USER);
    mockDb.chirp.findUnique.mockResolvedValue({
      authorId: "user-1",
      author: { handle: "alice" },
    });
    mockDb.chirp.delete.mockResolvedValue({});

    await deleteChirp("chirp-1");

    expect(mockDb.chirp.delete).toHaveBeenCalledWith({ where: { id: "chirp-1" } });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/alice");
  });
});
