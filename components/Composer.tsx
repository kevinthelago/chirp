"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createChirp, type CreateChirpState } from "@/app/actions/chirps";

const MAX_CHARS = 280;

export default function Composer() {
  const [state, formAction, pending] = useActionState<
    CreateChirpState,
    FormData
  >(createChirp, null);

  const [text, setText] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const remaining = MAX_CHARS - text.length;
  const isValid = text.trim().length > 0 && text.length <= MAX_CHARS;

  useEffect(() => {
    if (state && "success" in state) {
      setText("");
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="border-b border-gray-200 p-4">
      <textarea
        name="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What's chirping?"
        rows={3}
        className="w-full resize-none rounded-lg border border-gray-200 p-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
        aria-label="Compose a chirp"
      />
      <div className="mt-2 flex items-center justify-between">
        <span
          aria-live="polite"
          className={`text-sm tabular-nums ${
            remaining < 0
              ? "font-semibold text-red-500"
              : remaining <= 20
                ? "text-amber-500"
                : "text-gray-400"
          }`}
        >
          {remaining}
        </span>
        <button
          type="submit"
          disabled={!isValid || pending}
          className="rounded-full bg-sky-500 px-4 py-1.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
        >
          {pending ? "Chirping…" : "Chirp"}
        </button>
      </div>
      {state && "error" in state && (
        <p role="alert" className="mt-1 text-sm text-red-500">
          {state.error}
        </p>
      )}
    </form>
  );
}
