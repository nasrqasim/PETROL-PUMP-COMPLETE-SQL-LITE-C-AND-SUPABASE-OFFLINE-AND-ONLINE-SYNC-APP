const CSHARP_URL = process.env.CSHARP_API_URL || "http://localhost:5000";

export async function fetchFromCSharp(endpoint: string, options: RequestInit = {}) {
  const url = `${CSHARP_URL.replace(/\/+$/, "")}/${endpoint.replace(/^\/+/, "")}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(options.headers || {}),
      },
      cache: "no-store",
    });
    return res;
  } catch (error: any) {
    console.error(`[C# Bridge Error] Failed to fetch ${url}:`, error.message);
    throw error;
  }
}
