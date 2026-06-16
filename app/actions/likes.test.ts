import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/session", () => ({ getCurrentUser: vi.fn() }))
vi.mock("@/lib/like", () => ({
  hasLiked: vi.fn(),
  likeChirp: vi.fn(),
  unlikeChirp: vi.fn(),
}))

import { toggleLike } from "./likes"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/session"
import { hasLiked, likeChirp, unlikeChirp } from "@/lib/like"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("toggleLike", () => {
  it("throws when user is not authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null)
    await expect(toggleLike("chirp-1")).rejects.toThrow("Not authenticated")
  })

  it("creates a like when not already liked", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-a" } as never)
    vi.mocked(hasLiked).mockResolvedValue(false)

    const result = await toggleLike("chirp-1")

    expect(likeChirp).toHaveBeenCalledWith("user-a", "chirp-1")
    expect(unlikeChirp).not.toHaveBeenCalled()
    expect(result).toEqual({ liked: true })
  })

  it("removes a like when already liked", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-a" } as never)
    vi.mocked(hasLiked).mockResolvedValue(true)

    const result = await toggleLike("chirp-1")

    expect(unlikeChirp).toHaveBeenCalledWith("user-a", "chirp-1")
    expect(likeChirp).not.toHaveBeenCalled()
    expect(result).toEqual({ liked: false })
  })

  it("revalidates the feed path after toggling", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-a" } as never)
    vi.mocked(hasLiked).mockResolvedValue(false)

    await toggleLike("chirp-1")

    expect(revalidatePath).toHaveBeenCalledWith("/")
  })
})
