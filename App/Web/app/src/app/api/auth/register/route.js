import { NextResponse } from "next/server";
import { API_URL, jsonResponse } from "../../_utils";

export async function POST(request) {
  const body = await request.json();

  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const { json, text } = await jsonResponse(res);
  if (!res.ok) {
    return NextResponse.json(
      { error: json?.error || text || "Registration failed" },
      { status: res.status }
    );
  }

  return NextResponse.json({ success: true });
}
