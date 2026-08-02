const BACKEND_BASE_URL =
  process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export async function proxyToBackend(request: Request, path: string) {
  const url = new URL(path, BACKEND_BASE_URL);
  const method = request.method.toUpperCase();
  const headers = new Headers();
  const contentType = request.headers.get("content-type");

  if (contentType) {
    headers.set("content-type", contentType);
  }

  const backendResponse = await fetch(url, {
    method,
    headers: method === "GET" || method === "HEAD" ? undefined : headers,
    body: method === "GET" || method === "HEAD" ? undefined : await request.text(),
    cache: "no-store",
  });

  const responseHeaders = new Headers();
  const backendType = backendResponse.headers.get("content-type");
  if (backendType) {
    responseHeaders.set("content-type", backendType);
  }

  return new Response(await backendResponse.text(), {
    status: backendResponse.status,
    headers: responseHeaders,
  });
}
