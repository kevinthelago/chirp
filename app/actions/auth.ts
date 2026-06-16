"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { db } from "@/lib/db";

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  handle: z
    .string()
    .min(1, "Handle is required")
    .max(20, "Handle must be 20 characters or less")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Handle can only contain letters, numbers, and underscores"
    ),
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(50, "Display name must be 50 characters or less"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type SignupState = {
  errors?: {
    email?: string[];
    handle?: string[];
    displayName?: string[];
    password?: string[];
    _form?: string[];
  };
};

export async function signup(
  prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    handle: formData.get("handle"),
    displayName: formData.get("displayName"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { email, handle, displayName, password } = parsed.data;

  const [existingEmail, existingHandle] = await Promise.all([
    db.user.findUnique({ where: { email }, select: { id: true } }),
    db.user.findUnique({ where: { handle }, select: { id: true } }),
  ]);

  if (existingEmail) {
    return { errors: { email: ["This email is already in use"] } };
  }

  if (existingHandle) {
    return { errors: { handle: ["This handle is already taken"] } };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.user.create({
    data: { email, handle, displayName, passwordHash },
  });

  await signIn("credentials", { email, password, redirectTo: "/home" });

  return {};
}

export type LoginState = {
  errors?: {
    email?: string[];
    password?: string[];
    _form?: string[];
  };
};

export async function login(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/home",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { errors: { _form: ["Invalid email or password"] } };
    }
    throw error;
  }

  return {};
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
