import { NextResponse } from "next/server";
import { API_URL, fetchWithRetry, jsonResponse, withAuth } from "../_utils";

export async function GET(request) {
  const { token, response } = withAuth(request);
  if (!token) return response;

  const authHeader = { Authorization: `Bearer ${token}` };

  const results = await Promise.allSettled([
    fetchWithRetry(`${API_URL}/auth/me`, { headers: authHeader, cache: "no-store" }, 1, 15000),
    fetchWithRetry(`${API_URL}/water`, { headers: authHeader, cache: "no-store" }, 1, 15000),
    fetchWithRetry(`${API_URL}/weight`, { headers: authHeader, cache: "no-store" }, 1, 15000),
  ]);

  const [userResult, waterResult, weightResult] = results;
  const resUser = userResult.status === "fulfilled" ? userResult.value : null;
  const resWater = waterResult.status === "fulfilled" ? waterResult.value : null;
  const resWeight = weightResult.status === "fulfilled" ? weightResult.value : null;

  if (!resUser || !resUser.ok) {
    const { json, text } = await jsonResponse(resUser);
    return NextResponse.json(
      { error: json?.error || text || "Unauthorized" },
      { status: resUser?.status || 502 }
    );
  }

  const { json: userJson } = await jsonResponse(resUser);
  const { json: waterJson, text: waterText } = await jsonResponse(resWater);
  const { json: weightJson, text: weightText } = await jsonResponse(resWeight);

  return NextResponse.json({
    user: userJson,
    waterLogs: resWater && resWater.ok ? waterJson : [],
    weightLogs: resWeight && resWeight.ok ? weightJson : [],
    waterError: resWater && resWater.ok ? null : waterText || "Failed to load water logs",
    weightError: resWeight && resWeight.ok ? null : weightText || "Failed to load weight logs",
  });
}
