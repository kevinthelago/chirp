"use client"

import { useState, useTransition } from "react"
import { toggleLike } from "@/app/actions/likes"

interface LikeButtonProps {
  chirpId: string
  initialCount: number
  initialLiked: boolean
}

export function LikeButton({ chirpId, initialCount, initialLiked }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    const nextLiked = !liked
    setLiked(nextLiked)
    setCount((c) => c + (nextLiked ? 1 : -1))

    startTransition(async () => {
      try {
        const result = await toggleLike(chirpId)
        setLiked(result.liked)
      } catch {
        setLiked(!nextLiked)
        setCount((c) => c + (nextLiked ? -1 : 1))
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={liked}
      aria-label={liked ? "Unlike" : "Like"}
      className={`flex items-center gap-1.5 text-sm transition-colors disabled:opacity-50 ${
        liked
          ? "text-rose-500 hover:text-rose-600"
          : "text-gray-500 hover:text-rose-500"
      }`}
    >
      <HeartIcon filled={liked} />
      <span>{count}</span>
    </button>
  )
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="h-5 w-5"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    </svg>
  )
}
