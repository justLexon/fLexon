import { NextResponse } from "next/server";

export const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const jsonResponse = async (res) => {
  if (!res) {
    return { text: "", json: null };
  }
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

export const fetchWithTimeout = async (url, options = {}, timeoutMs = 15000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

export const fetchWithRetry = async (url, options = {}, retries = 1, timeoutMs = 15000) => {
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fetchWithTimeout(url, options, timeoutMs);
    } catch (err) {
      const isAbort =
        (err && typeof err === "object" && "name" in err && err.name === "AbortError") ||
        (err && typeof err === "object" && "code" in err && err.code === 20);
      const message = isAbort
        ? "Upstream request timed out"
        : err instanceof Error && err.message
        ? err.message
        : "Request failed";
      lastError = new Error(message, { cause: err });
    }
  }
  throw lastError;
};

export const isAbortError = (err) => {
  if (!err || typeof err !== "object") return false;
  if ("name" in err && err.name === "AbortError") return true;
  if ("code" in err && err.code === 20) return true;
  return false;
};

export const withAuth = (request) => {
  const token = request.cookies.get("flexon_token")?.value;
  if (!token) {
    return { token: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { token, response: null };
};
