import { NextResponse } from "next/server";
import { API_URL, fetchWithRetry, jsonResponse, withAuth, isAbortError } from "../../_utils";

export async function PUT(request, context) {
  const { token, response } = withAuth(request);
  if (!token) return response;

  const body = await request.json();
  const { id } = context.params;
  let res;
  try {
    res = await fetchWithRetry(
      `${API_URL}/water/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
        body: JSON.stringify(body),
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
    return NextResponse.json({ error: json?.error || text || "Failed to update water" }, { status: res.status });
  }

  return NextResponse.json(json);
}
