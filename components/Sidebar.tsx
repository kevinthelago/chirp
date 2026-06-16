"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </svg>
  );
}

function ExploreIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </svg>
  );
}

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.63-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.03-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
    </svg>
  );
}

function PenIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
  );
}

type NavItem = {
  label: string;
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/home", Icon: HomeIcon },
  { label: "Explore", href: "/explore", Icon: ExploreIcon },
  { label: "Profile", href: "/profile", Icon: ProfileIcon },
  { label: "Settings", href: "/settings", Icon: SettingsIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  const linkClass = (href: string) => {
    const isActive = pathname === href || pathname.startsWith(href + "/");
    return [
      "flex items-center gap-4 rounded-full px-4 py-3 transition-colors",
      isActive
        ? "font-bold text-sky-500"
        : "text-gray-700 hover:bg-gray-100 hover:text-black",
    ].join(" ");
  };

  const mobileClass = (href: string) => {
    const isActive = pathname === href || pathname.startsWith(href + "/");
    return [
      "flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors",
      isActive ? "text-sky-500 font-bold" : "text-gray-600 hover:text-black",
    ].join(" ");
  };

  return (
    <>
      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-gray-200 bg-white md:hidden"
        aria-label="Mobile navigation"
      >
        {NAV_ITEMS.map(({ label, href, Icon }) => (
          <Link key={href} href={href} className={mobileClass(href)} aria-current={pathname === href ? "page" : undefined}>
            <Icon className="h-6 w-6" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* Sidebar — icons only on md, full labels on lg+ */}
      <aside
        className="hidden md:flex flex-col h-screen sticky top-0 w-16 lg:w-64 shrink-0 border-r border-gray-200 bg-white px-2 py-4"
        aria-label="Main navigation"
      >
        {/* Wordmark */}
        <div className="mb-4 flex items-center justify-center lg:justify-start px-2">
          <span className="text-2xl font-extrabold tracking-tight text-sky-500 lg:inline hidden">
            Chirp
          </span>
          <span className="text-2xl font-extrabold text-sky-500 lg:hidden">C</span>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1" aria-label="Main navigation">
          {NAV_ITEMS.map(({ label, href, Icon }) => (
            <Link
              key={href}
              href={href}
              className={linkClass(href)}
              aria-current={pathname === href ? "page" : undefined}
            >
              <Icon className="h-6 w-6 shrink-0" />
              <span className="hidden lg:inline text-xl">{label}</span>
            </Link>
          ))}
        </nav>

        {/* Chirp button */}
        <div className="mt-4 px-2">
          <Link
            href="/chirp/new"
            className="flex items-center justify-center gap-2 rounded-full bg-sky-500 px-4 py-3 font-bold text-white hover:bg-sky-600 transition-colors w-full"
          >
            <PenIcon className="h-5 w-5 shrink-0" />
            <span className="hidden lg:inline">Chirp</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
