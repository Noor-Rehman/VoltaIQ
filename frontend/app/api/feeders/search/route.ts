import { proxyToBackend } from "../../_backend";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const suffix = q ? `?q=${encodeURIComponent(q)}` : "";
  return proxyToBackend(request, `/feeders/search${suffix}`);
}