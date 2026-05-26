import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getUser } from "./userdb";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages:   { signIn: "/login" },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error("[auth] missing credentials");
          return null;
        }
        const email = credentials.email.toLowerCase().trim();
        let user;
        try {
          user = await getUser(email);
        } catch (err) {
          console.error("[auth] Redis error during getUser:", err);
          throw new Error("Database unavailable. Please try again.");
        }
        if (!user) {
          console.error("[auth] no user found for:", email);
          return null;
        }
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) {
          console.error("[auth] wrong password for:", email);
          return null;
        }
        return { id: user.id, email: user.email, name: user.email };
      },
    }),
  ],

  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) session.user.id = token.id;
      return session;
    },
  },
};
