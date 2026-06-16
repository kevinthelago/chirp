import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/session", () => ({ getCurrentUser: vi.fn() }))
vi.mock("@/lib/follow", () => ({
  followUser: vi.fn(),
  unfollowUser: vi.fn(),
  isFollowing: vi.fn(),
}))

import { toggleFollow } from "./follow"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/session"
import { followUser, unfollowUser, isFollowing } from "@/lib/follow"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("toggleFollow", () => {
  it("throws when user is not authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null)
    await expect(toggleFollow("user-b", "alice")).rejects.toThrow("Not authenticated")
  })

  it("throws when user attempts to follow themselves", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-a" } as never)
    await expect(toggleFollow("user-a", "me")).rejects.toThrow("Cannot follow yourself")
  })

  it("creates a follow when not already following", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-a" } as never)
    vi.mocked(isFollowing).mockResolvedValue(false)

    const result = await toggleFollow("user-b", "alice")

    expect(followUser).toHaveBeenCalledWith("user-a", "user-b")
    expect(unfollowUser).not.toHaveBeenCalled()
    expect(result).toEqual({ isFollowing: true })
  })

  it("removes a follow when already following", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-a" } as never)
    vi.mocked(isFollowing).mockResolvedValue(true)

    const result = await toggleFollow("user-b", "alice")

    expect(unfollowUser).toHaveBeenCalledWith("user-a", "user-b")
    expect(followUser).not.toHaveBeenCalled()
    expect(result).toEqual({ isFollowing: false })
  })

  it("revalidates the target profile path and home feed", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-a" } as never)
    vi.mocked(isFollowing).mockResolvedValue(false)

    await toggleFollow("user-b", "alice")

    expect(revalidatePath).toHaveBeenCalledWith("/alice")
    expect(revalidatePath).toHaveBeenCalledWith("/")
  })
})
