import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { LikeButton } from "./LikeButton"

vi.mock("@/app/actions/likes", () => ({
  toggleLike: vi.fn(),
}))

import { toggleLike } from "@/app/actions/likes"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("LikeButton", () => {
  it("renders the like count and an unliked heart", () => {
    render(<LikeButton chirpId="chirp-1" initialCount={5} initialLiked={false} />)
    expect(screen.getByRole("button", { name: "Like" })).toBeInTheDocument()
    expect(screen.getByText("5")).toBeInTheDocument()
  })

  it("renders with a liked state when initialLiked is true", () => {
    render(<LikeButton chirpId="chirp-1" initialCount={5} initialLiked={true} />)
    expect(screen.getByRole("button", { name: "Unlike" })).toBeInTheDocument()
  })

  it("optimistically increments count and sets liked on click", async () => {
    vi.mocked(toggleLike).mockResolvedValue({ liked: true })

    render(<LikeButton chirpId="chirp-1" initialCount={5} initialLiked={false} />)
    fireEvent.click(screen.getByRole("button"))

    expect(screen.getByRole("button", { name: "Unlike" })).toBeInTheDocument()
    expect(screen.getByText("6")).toBeInTheDocument()
    await waitFor(() => expect(toggleLike).toHaveBeenCalledWith("chirp-1"))
  })

  it("optimistically decrements count and unsets liked on click", async () => {
    vi.mocked(toggleLike).mockResolvedValue({ liked: false })

    render(<LikeButton chirpId="chirp-1" initialCount={5} initialLiked={true} />)
    fireEvent.click(screen.getByRole("button"))

    expect(screen.getByRole("button", { name: "Like" })).toBeInTheDocument()
    expect(screen.getByText("4")).toBeInTheDocument()
  })

  it("rolls back optimistic state when the action throws", async () => {
    vi.mocked(toggleLike).mockRejectedValue(new Error("Not authenticated"))

    render(<LikeButton chirpId="chirp-1" initialCount={5} initialLiked={false} />)
    fireEvent.click(screen.getByRole("button"))

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Like" })).toBeInTheDocument(),
    )
    expect(screen.getByText("5")).toBeInTheDocument()
  })

  it("syncs liked state with the server's returned value", async () => {
    vi.mocked(toggleLike).mockResolvedValue({ liked: false })

    render(<LikeButton chirpId="chirp-1" initialCount={5} initialLiked={false} />)
    fireEvent.click(screen.getByRole("button"))

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Like" })).toBeInTheDocument(),
    )
  })
})
