import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { prisma } from "@/lib/db";

export const { auth, signIn, signOut, handlers } = NextAuth({
  providers: [
    GitHub({
      issuer: "https://github.com/login/oauth",
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      if (!account || !user.email) return false;
      try {
        await prisma.$executeRaw`
                INSERT INTO "User" (id, name, email, image, "createdAt", "updatedAt")
                VALUES (gen_random_uuid()::text, ${user.name}, ${user.email}, ${user.image}, NOW(), NOW())
                ON CONFLICT (email) DO UPDATE SET name = ${user.name}, image = ${user.image}, "updatedAt" = NOW()
            `;
        return true;
      } catch (err) {
        console.error("[signIn error]", err);
        return false;
      }
    },
    async session({ session, token }) {
      if (token?.sub) session.user.id = token.sub;
      return session;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await prisma.$queryRaw<{ id: string }[]>`
                SELECT id FROM "User" WHERE email = ${user.email} LIMIT 1
            `;
        if (dbUser[0]) token.sub = dbUser[0].id;
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      return `${baseUrl}/dashboard`;
    },
  },
});
