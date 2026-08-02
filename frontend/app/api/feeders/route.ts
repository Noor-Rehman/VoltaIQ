import { proxyToBackend } from "../_backend";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const suffix = url.search ? url.search : "";
  return proxyToBackend(request, `/feeders${suffix}`);
}