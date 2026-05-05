import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";

export const { auth, signIn, signOut, handlers } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [GitHub],
    session: {
        strategy: "jwt"
    },
    callbacks: {
        session({ session, token }) {
            if (token.sub) {
                session.user.id = token.sub
            }
            return session
        }
    }
})