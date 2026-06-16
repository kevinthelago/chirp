"use client";

import { useActionState } from "react";
import { updateProfile, type UpdateProfileState } from "@/app/actions/profile";

interface Props {
  initialDisplayName: string;
  initialBio: string | null;
}

const initialState: UpdateProfileState = {};

export default function ProfileForm({ initialDisplayName, initialBio }: Props) {
  const [state, action, isPending] = useActionState(updateProfile, initialState);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="displayName" className="text-sm font-semibold">
          Display name <span className="text-red-500">*</span>
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          defaultValue={initialDisplayName}
          maxLength={50}
          required
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="bio" className="text-sm font-semibold">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={initialBio ?? ""}
          maxLength={160}
          rows={3}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
          placeholder="Tell the world about yourself"
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="text-sm text-green-600">
          Profile updated.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="self-start bg-sky-500 text-white rounded-full px-6 py-2 font-semibold hover:bg-sky-600 transition-colors disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
