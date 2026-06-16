import Image from "next/image";

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
  "#14b8a6", "#f43f5e", "#84cc16", "#a855f7",
];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (Math.imul(31, h) + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

const SIZE_CLASSES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
} as const;

interface AvatarProps {
  name: string;
  src?: string;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}

export default function Avatar({ name, src, size = "md", className = "" }: AvatarProps) {
  const sizeClass = SIZE_CLASSES[size];
  const color = COLORS[hashName(name) % COLORS.length];
  const initials = getInitials(name);

  if (src) {
    return (
      <span className={`${sizeClass} relative inline-block rounded-full overflow-hidden ${className}`}>
        <Image src={src} alt={name} fill className="object-cover" sizes="48px" />
      </span>
    );
  }

  return (
    <span
      className={`${sizeClass} inline-flex items-center justify-center rounded-full font-semibold text-white select-none ${className}`}
      style={{ backgroundColor: color }}
      aria-label={name}
    >
      {initials}
    </span>
  );
}
