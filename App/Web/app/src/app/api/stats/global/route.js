import { NextResponse } from "next/server";
import { API_URL, jsonResponse, withAuth } from "../../_utils";

export async function GET(request) {
  const { token, response } = withAuth(request);
  if (!token) return response;

  const res = await fetch(`${API_URL}/stats/global`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const { json, text } = await jsonResponse(res);
  if (!res.ok) {
    return NextResponse.json({ error: json?.error || text || "Failed to load stats" }, { status: res.status });
  }

  return NextResponse.json(json);
}
