"use client";

import { useActionState } from "react";
import type { LoginState, SignupState } from "@/app/actions/auth";

type LoginFormProps = {
  type: "login";
  action: (state: LoginState, formData: FormData) => Promise<LoginState>;
};

type SignupFormProps = {
  type: "signup";
  action: (state: SignupState, formData: FormData) => Promise<SignupState>;
};

type AuthFormProps = LoginFormProps | SignupFormProps;

export default function AuthForm({ type, action }: AuthFormProps) {
  const [state, formAction, isPending] = useActionState(
    action as (
      state: LoginState | SignupState,
      formData: FormData
    ) => Promise<LoginState | SignupState>,
    { errors: {} }
  );

  return (
    <form action={formAction} noValidate>
      {state.errors?._form && (
        <p role="alert" aria-live="polite">
          {state.errors._form[0]}
        </p>
      )}

      {type === "signup" && (
        <>
          <div>
            <label htmlFor="displayName">Display name</label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              autoComplete="name"
              required
              aria-describedby={
                state.errors?.displayName ? "displayName-error" : undefined
              }
            />
            {state.errors?.displayName && (
              <p id="displayName-error" role="alert">
                {state.errors.displayName[0]}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="handle">Handle</label>
            <input
              id="handle"
              name="handle"
              type="text"
              autoComplete="username"
              required
              aria-describedby={
                state.errors?.handle ? "handle-error" : undefined
              }
            />
            {state.errors?.handle && (
              <p id="handle-error" role="alert">
                {state.errors.handle[0]}
              </p>
            )}
          </div>
        </>
      )}

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-describedby={state.errors?.email ? "email-error" : undefined}
        />
        {state.errors?.email && (
          <p id="email-error" role="alert">
            {state.errors.email[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={type === "login" ? "current-password" : "new-password"}
          required
          aria-describedby={
            state.errors?.password ? "password-error" : undefined
          }
        />
        {state.errors?.password && (
          <p id="password-error" role="alert">
            {state.errors.password[0]}
          </p>
        )}
      </div>

      <button type="submit" disabled={isPending} aria-busy={isPending}>
        {isPending
          ? "Please wait…"
          : type === "login"
            ? "Sign in"
            : "Create account"}
      </button>
    </form>
  );
}
