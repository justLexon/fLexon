import { NextResponse } from "next/server";
import { API_URL, fetchWithRetry, jsonResponse, isAbortError } from "../../_utils";

export async function POST(request) {
  const body = await request.json();

  let res;
  try {
    res = await fetchWithRetry(
      `${API_URL}/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      },
      1,
      15000
    );
  } catch (err) {
    if (isAbortError(err)) {
      return NextResponse.json({ error: "Backend timeout" }, { status: 504 });
    }
    return NextResponse.json({ error: "Upstream error" }, { status: 502 });
  }

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
