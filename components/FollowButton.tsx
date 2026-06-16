"use client"

import React, { useState, useTransition } from "react"
import { toggleFollow } from "@/app/actions/follow"

interface FollowButtonProps {
  targetUserId: string
  targetHandle: string
  initialIsFollowing: boolean
}

export function FollowButton({
  targetUserId,
  targetHandle,
  initialIsFollowing,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialIsFollowing)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    const next = !following
    setFollowing(next)

    startTransition(async () => {
      try {
        const result = await toggleFollow(targetUserId, targetHandle)
        setFollowing(result.isFollowing)
      } catch {
        // Roll back the optimistic update
        setFollowing(!next)
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={following}
      className={
        following
          ? "rounded-full border border-gray-300 px-4 py-1.5 text-sm font-semibold hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          : "rounded-full bg-black px-4 py-1.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
      }
    >
      {following ? "Following" : "Follow"}
    </button>
  )
}
