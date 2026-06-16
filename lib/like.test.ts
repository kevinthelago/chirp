import { describe, it, expect, vi, beforeEach } from "vitest"
import { likeChirp, unlikeChirp, hasLiked, getLikeCount, likedByMe } from "./like"

vi.mock("@/lib/db", () => ({
  db: {
    like: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

import { db } from "@/lib/db"

const mockLike = vi.mocked(db.like)

beforeEach(() => {
  vi.clearAllMocks()
})

describe("likeChirp", () => {
  it("upserts a like record (no-op if already liked)", async () => {
    await likeChirp("user-a", "chirp-1")
    expect(mockLike.upsert).toHaveBeenCalledWith({
      where: { userId_chirpId: { userId: "user-a", chirpId: "chirp-1" } },
      update: {},
      create: { userId: "user-a", chirpId: "chirp-1" },
    })
  })
})

describe("unlikeChirp", () => {
  it("deletes the like record", async () => {
    await unlikeChirp("user-a", "chirp-1")
    expect(mockLike.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-a", chirpId: "chirp-1" },
    })
  })
})

describe("hasLiked", () => {
  it("returns true when a like record exists", async () => {
    vi.mocked(mockLike.findFirst).mockResolvedValue({
      userId: "user-a",
      chirpId: "chirp-1",
      createdAt: new Date(),
    } as never)
    expect(await hasLiked("user-a", "chirp-1")).toBe(true)
  })

  it("returns false when no like record exists", async () => {
    vi.mocked(mockLike.findFirst).mockResolvedValue(null)
    expect(await hasLiked("user-a", "chirp-1")).toBe(false)
  })
})

describe("getLikeCount", () => {
  it("returns the count of likes for a chirp", async () => {
    vi.mocked(mockLike.count).mockResolvedValue(7)
    expect(await getLikeCount("chirp-1")).toBe(7)
    expect(mockLike.count).toHaveBeenCalledWith({ where: { chirpId: "chirp-1" } })
  })
})

describe("likedByMe", () => {
  it("returns an empty object for an empty chirpIds array", async () => {
    expect(await likedByMe([], "user-a")).toEqual({})
    expect(mockLike.findMany).not.toHaveBeenCalled()
  })

  it("maps chirpIds to true if liked, false if not", async () => {
    vi.mocked(mockLike.findMany).mockResolvedValue([
      { chirpId: "chirp-1" },
    ] as never)
    const result = await likedByMe(["chirp-1", "chirp-2"], "user-a")
    expect(result).toEqual({ "chirp-1": true, "chirp-2": false })
    expect(mockLike.findMany).toHaveBeenCalledWith({
      where: { chirpId: { in: ["chirp-1", "chirp-2"] }, userId: "user-a" },
      select: { chirpId: true },
    })
  })
})
