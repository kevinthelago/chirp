import Link from "next/link";
import { login } from "@/app/actions/auth";
import AuthForm from "@/components/AuthForm";

export const metadata = {
  title: "Sign in — Chirp",
};

export default function LoginPage() {
  return (
    <main>
      <h1>Sign in to Chirp</h1>
      <AuthForm type="login" action={login} />
      <p>
        Don&apos;t have an account?{" "}
        <Link href="/signup">Create one</Link>
      </p>
    </main>
  );
}
