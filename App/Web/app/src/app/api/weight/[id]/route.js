import { NextResponse } from "next/server";
import { API_URL, jsonResponse, withAuth } from "../../_utils";

export async function PUT(request, context) {
  const { token, response } = withAuth(request);
  if (!token) return response;

  const body = await request.json();
  const { id } = context.params;
  const res = await fetch(`${API_URL}/weight/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
    body: JSON.stringify(body),
  });

  const { json, text } = await jsonResponse(res);
  if (!res.ok) {
    return NextResponse.json({ error: json?.error || text || "Failed to update weight" }, { status: res.status });
  }

  return NextResponse.json(json);
}
