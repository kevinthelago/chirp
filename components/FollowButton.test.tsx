import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { FollowButton } from "./FollowButton"

vi.mock("@/app/actions/follow", () => ({
  toggleFollow: vi.fn(),
}))

import { toggleFollow } from "@/app/actions/follow"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("FollowButton", () => {
  it("renders Follow when not following", () => {
    render(
      <FollowButton
        targetUserId="user-b"
        targetHandle="alice"
        initialIsFollowing={false}
      />,
    )
    expect(screen.getByRole("button", { name: "Follow" })).toBeInTheDocument()
  })

  it("renders Following when already following", () => {
    render(
      <FollowButton
        targetUserId="user-b"
        targetHandle="alice"
        initialIsFollowing={true}
      />,
    )
    expect(screen.getByRole("button", { name: "Following" })).toBeInTheDocument()
  })

  it("optimistically toggles to Following on click", async () => {
    vi.mocked(toggleFollow).mockResolvedValue({ isFollowing: true })

    render(
      <FollowButton
        targetUserId="user-b"
        targetHandle="alice"
        initialIsFollowing={false}
      />,
    )

    fireEvent.click(screen.getByRole("button"))

    // Optimistic update is immediate
    expect(screen.getByRole("button", { name: "Following" })).toBeInTheDocument()
    await waitFor(() => expect(toggleFollow).toHaveBeenCalledWith("user-b", "alice"))
  })

  it("rolls back optimistic state when the action throws", async () => {
    vi.mocked(toggleFollow).mockRejectedValue(new Error("Not authenticated"))

    render(
      <FollowButton
        targetUserId="user-b"
        targetHandle="alice"
        initialIsFollowing={false}
      />,
    )

    fireEvent.click(screen.getByRole("button"))

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Follow" })).toBeInTheDocument(),
    )
  })

  it("syncs with the server's returned isFollowing value", async () => {
    // Server says false even though we optimistically set true — sync with server
    vi.mocked(toggleFollow).mockResolvedValue({ isFollowing: false })

    render(
      <FollowButton
        targetUserId="user-b"
        targetHandle="alice"
        initialIsFollowing={false}
      />,
    )

    fireEvent.click(screen.getByRole("button"))

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Follow" })).toBeInTheDocument(),
    )
  })
})
