import type { ChirpWithAuthor } from "@/lib/chirp";
import Avatar from "@/components/Avatar";
import { deleteChirp } from "@/app/actions/chirps";

const MINUTE = 60;
const HOUR = 3_600;
const DAY = 86_400;

function relativeTime(date: Date): string {
  const elapsed = Math.floor((Date.now() - date.getTime()) / 1000);
  if (elapsed < MINUTE) return `${elapsed}s`;
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h`;
  return `${Math.floor(elapsed / DAY)}d`;
}

/**
 * Props for ChirpCard — stable cross-stream contract.
 * home-feed, explore, and profiles import this type and the component.
 */
export type ChirpCardProps = {
  chirp: ChirpWithAuthor;
  /** Signed-in user's ID; determines whether the delete button is shown. */
  currentUserId?: string;
  /** Rendered by the likes stream; passed through without coupling. */
  likeSlot?: React.ReactNode;
};

export default function ChirpCard({
  chirp,
  currentUserId,
  likeSlot,
}: ChirpCardProps) {
  const isOwner = !!currentUserId && currentUserId === chirp.author.id;
  const deleteWithId = deleteChirp.bind(null, chirp.id);

  return (
    <article className="flex gap-3 border-b border-gray-200 px-4 py-3">
      <Avatar name={chirp.author.displayName} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1">
          <span className="font-semibold text-gray-900">
            {chirp.author.displayName}
          </span>
          <span className="text-sm text-gray-500">@{chirp.author.handle}</span>
          <span className="text-sm text-gray-400">·</span>
          <time
            dateTime={chirp.createdAt.toISOString()}
            className="text-sm text-gray-400"
            title={chirp.createdAt.toLocaleString()}
          >
            {relativeTime(chirp.createdAt)}
          </time>
          {isOwner && (
            <form action={deleteWithId} className="ml-auto">
              <button
                type="submit"
                className="text-sm text-gray-400 transition-colors hover:text-red-500"
                aria-label="Delete chirp"
              >
                ✕
              </button>
            </form>
          )}
        </div>
        <p className="mt-1 break-words text-gray-900">{chirp.text}</p>
        {likeSlot != null && <div className="mt-2">{likeSlot}</div>}
      </div>
    </article>
  );
}
