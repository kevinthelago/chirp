import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import ProfileForm from "./_components/ProfileForm";

export const metadata: Metadata = { title: "Edit profile" };

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { displayName: true, bio: true },
  });

  if (!user) redirect("/login");

  return (
    <div className="max-w-xl border-r border-gray-200 min-h-full">
      <header className="px-4 py-3 border-b border-gray-200 font-bold text-xl sticky top-0 bg-white/80 backdrop-blur">
        Edit profile
      </header>
      <div className="p-4">
        <ProfileForm
          initialDisplayName={user.displayName}
          initialBio={user.bio}
        />
      </div>
    </div>
  );
}
