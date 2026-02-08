import { NextResponse } from "next/server";
import { API_URL, fetchWithRetry, jsonResponse, withAuth, isAbortError } from "../../_utils";

export async function GET(request) {
  const { token, response } = withAuth(request);
  if (!token) return response;

  let res;
  try {
    res = await fetchWithRetry(
      `${API_URL}/auth/me`,
      {
        headers: { Authorization: `Bearer ${token}` },
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
    return NextResponse.json({ error: json?.error || text || "Unauthorized" }, { status: res.status });
  }

  return NextResponse.json(json);
}
