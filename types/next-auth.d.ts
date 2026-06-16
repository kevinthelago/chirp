import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      handle: string;
      displayName: string;
    };
  }

  interface User {
    handle: string;
    displayName: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    handle: string;
    displayName: string;
  }
}
