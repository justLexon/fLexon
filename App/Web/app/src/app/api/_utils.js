import { NextResponse } from "next/server";

export const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const jsonResponse = async (res) => {
  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();
  let json = null;
  if (contentType.includes("application/json")) {
    try {
      json = JSON.parse(text);
    } catch (err) {
      json = null;
    }
  }
  return { text, json };
};

export const withAuth = (request) => {
  const token = request.cookies.get("flexon_token")?.value;
  if (!token) {
    return { token: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { token, response: null };
};
