import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const authPrisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! })
})

export const { auth, signIn, signOut, handlers } = NextAuth({
    adapter: PrismaAdapter(authPrisma),
    providers: [GitHub],
    logger: {
        error: (error: any) => {
            console.error("[NextAuth Error]", error)
            console.error("[NextAuth Cause]", JSON.stringify(error?.cause, null, 2))
        }
    },
    callbacks: {
        session({ session, token }) {
            if (token?.sub) {
                session.user.id = token.sub
            }
            return session
        },
        jwt({ token, user }) {
            if (user) {
                token.sub = user.id
            }
            return token
        }
    }
})