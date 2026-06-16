import Link from "next/link";
import { signup } from "@/app/actions/auth";
import AuthForm from "@/components/AuthForm";

export const metadata = {
  title: "Join Chirp",
};

export default function SignupPage() {
  return (
    <main>
      <h1>Join Chirp</h1>
      <AuthForm type="signup" action={signup} />
      <p>
        Already have an account?{" "}
        <Link href="/login">Sign in</Link>
      </p>
    </main>
  );
}
