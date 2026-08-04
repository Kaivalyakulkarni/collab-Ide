import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import crypto from "crypto";

export const GET = auth(async (req) => {
  const session = req.auth;
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const state = crypto.randomBytes(16).toString("hex");

  const params = new URLSearchParams({
    client_id: process.env.AUTH_GITHUB_ID!,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/github/connect/callback`,
    scope: "repo",
    state,
  });

  const response = NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`,
  );

  response.cookies.set("github_connect_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });

  return response;
});
