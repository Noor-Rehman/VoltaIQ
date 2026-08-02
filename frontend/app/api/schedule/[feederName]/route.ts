import { proxyToBackend } from "../../_backend";

interface Params {
  params: Promise<{ feederName: string }>;
}

export async function GET(request: Request, { params }: Params) {
  const resolved = await params;
  const url = new URL(request.url);
  const tier = url.searchParams.get("tier");
  const suffix = tier ? `?tier=${encodeURIComponent(tier)}` : "";
  return proxyToBackend(request, `/schedule/${encodeURIComponent(resolved.feederName)}${suffix}`);
}