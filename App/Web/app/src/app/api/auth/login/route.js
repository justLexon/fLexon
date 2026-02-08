import { NextResponse } from "next/server";
import { API_URL, jsonResponse } from "../../_utils";

export async function POST(request) {
  const body = await request.json();

  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const { json, text } = await jsonResponse(res);
  if (!res.ok) {
    return NextResponse.json({ error: json?.error || text || "Login failed" }, { status: res.status });
  }

  const token = json?.token;
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 500 });
  }

  const response = NextResponse.json({ success: true, user: json?.user || null });
  response.cookies.set("flexon_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
