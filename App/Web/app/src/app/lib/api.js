const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export async function apiFetch(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
        ...options,
    });

    const data = await res.json();

    if(!res.ok) {
        throw new Error(data.error || "Something went wrong");
    }

    return data;
}