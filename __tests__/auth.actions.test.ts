import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

// Inline the validation schemas to test them in isolation from server-action machinery
import { z } from "zod";

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

describe("signup validation schema", () => {
  it("accepts valid input", () => {
    const result = signupSchema.safeParse({
      email: "alice@example.com",
      handle: "alice_1",
      displayName: "Alice",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = signupSchema.safeParse({
      email: "not-an-email",
      handle: "alice",
      displayName: "Alice",
      password: "password123",
    });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.email).toBeDefined();
  });

  it("rejects password shorter than 8 characters", () => {
    const result = signupSchema.safeParse({
      email: "alice@example.com",
      handle: "alice",
      displayName: "Alice",
      password: "short",
    });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.password).toContain(
      "Password must be at least 8 characters"
    );
  });

  it("rejects handle with special characters", () => {
    const result = signupSchema.safeParse({
      email: "alice@example.com",
      handle: "alice!@#",
      displayName: "Alice",
      password: "password123",
    });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.handle).toBeDefined();
  });

  it("rejects handle longer than 20 characters", () => {
    const result = signupSchema.safeParse({
      email: "alice@example.com",
      handle: "a".repeat(21),
      displayName: "Alice",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty display name", () => {
    const result = signupSchema.safeParse({
      email: "alice@example.com",
      handle: "alice",
      displayName: "",
      password: "password123",
    });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.displayName).toBeDefined();
  });

  it("allows handle with underscores and numbers", () => {
    const result = signupSchema.safeParse({
      email: "alice@example.com",
      handle: "alice_123",
      displayName: "Alice",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });
});

describe("password hashing", () => {
  it("hashes password with bcrypt and does not store plaintext", async () => {
    const plain = "securePass1";
    const hash = await bcrypt.hash(plain, 12);

    expect(hash).not.toBe(plain);
    expect(hash.startsWith("$2")).toBe(true);
  });

  it("verifies correct password", async () => {
    const plain = "securePass1";
    const hash = await bcrypt.hash(plain, 12);
    expect(await bcrypt.compare(plain, hash)).toBe(true);
  });

  it("rejects wrong password", async () => {
    const hash = await bcrypt.hash("securePass1", 12);
    expect(await bcrypt.compare("wrongPass!", hash)).toBe(false);
  });
});

describe("signup server action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns validation errors for invalid email", async () => {
    const { signup } = await import("@/app/actions/auth");
    const formData = new FormData();
    formData.append("email", "bad-email");
    formData.append("handle", "alice");
    formData.append("displayName", "Alice");
    formData.append("password", "password123");

    const result = await signup({}, formData);
    expect(result.errors?.email).toBeDefined();
  });

  it("returns validation errors for short password", async () => {
    const { signup } = await import("@/app/actions/auth");
    const formData = new FormData();
    formData.append("email", "alice@example.com");
    formData.append("handle", "alice");
    formData.append("displayName", "Alice");
    formData.append("password", "short");

    const result = await signup({}, formData);
    expect(result.errors?.password).toContain(
      "Password must be at least 8 characters"
    );
  });

  it("returns error when email is already taken", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.user.findUnique)
      .mockResolvedValueOnce({ id: "existing-id" } as any)
      .mockResolvedValueOnce(null);

    const { signup } = await import("@/app/actions/auth");
    const formData = new FormData();
    formData.append("email", "alice@example.com");
    formData.append("handle", "alice");
    formData.append("displayName", "Alice");
    formData.append("password", "password123");

    const result = await signup({}, formData);
    expect(result.errors?.email).toContain("This email is already in use");
  });

  it("returns error when handle is already taken", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.user.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "existing-id" } as any);

    const { signup } = await import("@/app/actions/auth");
    const formData = new FormData();
    formData.append("email", "alice@example.com");
    formData.append("handle", "alice");
    formData.append("displayName", "Alice");
    formData.append("password", "password123");

    const result = await signup({}, formData);
    expect(result.errors?.handle).toContain("This handle is already taken");
  });
});

describe("login server action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error for invalid credentials", async () => {
    const { signIn } = await import("@/lib/auth");
    const { AuthError } = await import("next-auth");
    vi.mocked(signIn).mockRejectedValueOnce(new AuthError("Invalid credentials"));

    const { login } = await import("@/app/actions/auth");
    const formData = new FormData();
    formData.append("email", "alice@example.com");
    formData.append("password", "wrongpassword");

    const result = await login({}, formData);
    expect(result.errors?._form).toContain("Invalid email or password");
  });

  it("re-throws non-auth errors", async () => {
    const { signIn } = await import("@/lib/auth");
    const networkError = new Error("Network error");
    vi.mocked(signIn).mockRejectedValueOnce(networkError);

    const { login } = await import("@/app/actions/auth");
    const formData = new FormData();
    formData.append("email", "alice@example.com");
    formData.append("password", "password123");

    await expect(login({}, formData)).rejects.toThrow("Network error");
  });
});
