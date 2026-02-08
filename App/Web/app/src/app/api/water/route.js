import { NextResponse } from "next/server";
import { API_URL, jsonResponse, withAuth } from "../_utils";

export async function GET(request) {
  const { token, response } = withAuth(request);
  if (!token) return response;

  const res = await fetch(`${API_URL}/water`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const { json, text } = await jsonResponse(res);
  if (!res.ok) {
    return NextResponse.json({ error: json?.error || text || "Failed to load water" }, { status: res.status });
  }

  return NextResponse.json(json);
}

export async function POST(request) {
  const { token, response } = withAuth(request);
  if (!token) return response;

  const body = await request.json();
  const res = await fetch(`${API_URL}/water`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
    body: JSON.stringify(body),
  });

  const { json, text } = await jsonResponse(res);
  if (!res.ok) {
    return NextResponse.json({ error: json?.error || text || "Failed to add water" }, { status: res.status });
  }

  return NextResponse.json(json);
}
