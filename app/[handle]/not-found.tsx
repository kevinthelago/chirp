import Link from "next/link";

export default function HandleNotFound() {
  return (
    <main className="flex flex-col items-center justify-center py-24 gap-4">
      <h1 className="text-2xl font-bold">This account doesn&apos;t exist</h1>
      <p className="text-gray-500">Try searching for another handle.</p>
      <Link
        href="/"
        className="mt-2 bg-sky-500 text-white rounded-full px-5 py-2 font-semibold hover:bg-sky-600 transition-colors"
      >
        Go home
      </Link>
    </main>
  );
}
