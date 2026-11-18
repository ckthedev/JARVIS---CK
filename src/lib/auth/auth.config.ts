import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      // Allow static assets, public files, and api/auth
      if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/favicon.ico")
      ) {
        return true;
      }

      const isLoginPage = pathname === "/login";
      const isSetupPage = pathname === "/setup";

      if (isLoggedIn) {
        if (isLoginPage || isSetupPage) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      // Unauthenticated access allowed for login and first-time setup
      if (isLoginPage || isSetupPage) {
        return true;
      }

      // Root path redirects to dashboard if logged in, login otherwise
      if (pathname === "/") {
        return Response.redirect(new URL("/login", nextUrl));
      }

      // All other routes require authentication
      const callbackUrl = encodeURIComponent(pathname);
      return Response.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl));
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      if (trigger === "update" && session?.name) {
        token.name = session.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.role = (token.role as string) ?? "ADMIN";
      }
      return session;
    },
  },
  providers: [], // Initialized in auth.ts with full Node.js dependencies
} satisfies NextAuthConfig;
