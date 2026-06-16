import { describe, it, expect, vi, beforeEach } from "vitest"
import { followUser, unfollowUser, isFollowing, getFollowingIds } from "./follow"

vi.mock("@/lib/db", () => ({
  db: {
    follow: {
      create: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

import { db } from "@/lib/db"

const mockFollow = vi.mocked(db).follow

beforeEach(() => {
  vi.clearAllMocks()
})

describe("followUser", () => {
  it("creates a follow record", async () => {
    await followUser("user-a", "user-b")
    expect(mockFollow.create).toHaveBeenCalledWith({
      data: { followerId: "user-a", followingId: "user-b" },
    })
  })
})

describe("unfollowUser", () => {
  it("deletes follow records matching both IDs", async () => {
    await unfollowUser("user-a", "user-b")
    expect(mockFollow.deleteMany).toHaveBeenCalledWith({
      where: { followerId: "user-a", followingId: "user-b" },
    })
  })
})

describe("isFollowing", () => {
  it("returns true when a follow record exists", async () => {
    vi.mocked(mockFollow.findFirst).mockResolvedValue({
      followerId: "user-a",
      followingId: "user-b",
      createdAt: new Date(),
    } as never)

    expect(await isFollowing("user-a", "user-b")).toBe(true)
  })

  it("returns false when no follow record exists", async () => {
    vi.mocked(mockFollow.findFirst).mockResolvedValue(null)

    expect(await isFollowing("user-a", "user-b")).toBe(false)
  })
})

describe("getFollowingIds", () => {
  it("returns following IDs for the given user", async () => {
    vi.mocked(mockFollow.findMany).mockResolvedValue([
      { followingId: "user-b" },
      { followingId: "user-c" },
    ] as never)

    const ids = await getFollowingIds("user-a")

    expect(ids).toEqual(["user-b", "user-c"])
    expect(mockFollow.findMany).toHaveBeenCalledWith({
      where: { followerId: "user-a" },
      select: { followingId: true },
    })
  })

  it("returns empty array when user follows nobody", async () => {
    vi.mocked(mockFollow.findMany).mockResolvedValue([])

    expect(await getFollowingIds("user-a")).toEqual([])
  })
})
