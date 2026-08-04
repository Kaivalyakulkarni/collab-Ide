import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const GET = auth(async (req) => {
  const session = req.auth;
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = req.cookies.get("github_connect_state")?.value;

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(
      new URL("/dashboard?github_error=state_mismatch", req.url),
    );
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: process.env.AUTH_GITHUB_ID,
      client_secret: process.env.AUTH_GITHUB_SECRET,
      code,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/github/connect/callback`,
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {  
    return NextResponse.redirect(
      new URL("/dashboard?github_error=token_exchange_failed", req.url),
    );
  }

  const userRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const githubUser = await userRes.json();

  await prisma.githubConnection.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      accessToken: tokenData.access_token,
      githubLogin: githubUser.login,
    },
    update: {
      accessToken: tokenData.access_token,
      githubLogin: githubUser.login,
    },
  });

  const response = NextResponse.redirect(
    new URL("/dashboard?github_connected=1", req.url),
  );
  response.cookies.delete("github_connect_state");
  return response;
});
