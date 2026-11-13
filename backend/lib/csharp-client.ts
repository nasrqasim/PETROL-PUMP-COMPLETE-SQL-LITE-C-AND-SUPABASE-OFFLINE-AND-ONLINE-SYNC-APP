const CSHARP_URL = process.env.CSHARP_API_URL || "http://localhost:5000";

export async function fetchFromCSharp(endpoint: string, options: RequestInit = {}) {
  const url = `${CSHARP_URL.replace(/\/+$/, "")}/${endpoint.replace(/^\/+/, "")}`;
  
  // Quick timeout to prevent hanging during Vercel builds or when bridge is down
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(options.headers || {}),
      },
      cache: "no-store",
    });
    clearTimeout(timeout);
    return res;
  } catch (error: any) {
    clearTimeout(timeout);
    console.error(`[C# Bridge Error] Failed to fetch ${url}:`, error.message);
    throw error;
  }
}
