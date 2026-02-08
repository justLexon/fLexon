import { NextResponse } from "next/server";
import { API_URL, fetchWithRetry, jsonResponse, isAbortError } from "../../_utils";

export async function POST(request) {
  const body = await request.json();

  let res;
  try {
    res = await fetchWithRetry(
      `${API_URL}/auth/register`,
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
    return NextResponse.json(
      { error: json?.error || text || "Registration failed" },
      { status: res.status }
    );
  }

  return NextResponse.json({ success: true });
}
