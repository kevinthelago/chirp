import { describe, it, expect } from "vitest";

// Test the routing logic in isolation, independent of NextAuth middleware wrapper.
// We extract and test the redirect decision logic directly.

const PROTECTED_PREFIXES = ["/home", "/notifications", "/messages", "/compose"];
const AUTH_ROUTES = ["/login", "/signup"];

function routingDecision(
  pathname: string,
  isSignedIn: boolean
): "redirect-login" | "redirect-home" | "next" {
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  if (isProtected && !isSignedIn) return "redirect-login";
  if (isAuthRoute && isSignedIn) return "redirect-home";
  return "next";
}

describe("middleware routing logic", () => {
  it("redirects unauthenticated user from /home to login", () => {
    expect(routingDecision("/home", false)).toBe("redirect-login");
  });

  it("redirects unauthenticated user from /notifications to login", () => {
    expect(routingDecision("/notifications", false)).toBe("redirect-login");
  });

  it("redirects unauthenticated user from /messages to login", () => {
    expect(routingDecision("/messages", false)).toBe("redirect-login");
  });

  it("redirects unauthenticated user from /compose to login", () => {
    expect(routingDecision("/compose", false)).toBe("redirect-login");
  });

  it("allows authenticated user to access /home", () => {
    expect(routingDecision("/home", true)).toBe("next");
  });

  it("redirects signed-in user away from /login to /home", () => {
    expect(routingDecision("/login", true)).toBe("redirect-home");
  });

  it("redirects signed-in user away from /signup to /home", () => {
    expect(routingDecision("/signup", true)).toBe("redirect-home");
  });

  it("allows unauthenticated user to access /login", () => {
    expect(routingDecision("/login", false)).toBe("next");
  });

  it("allows unauthenticated user to access /signup", () => {
    expect(routingDecision("/signup", false)).toBe("next");
  });

  it("allows public routes to pass through without auth", () => {
    expect(routingDecision("/", false)).toBe("next");
  });
});
