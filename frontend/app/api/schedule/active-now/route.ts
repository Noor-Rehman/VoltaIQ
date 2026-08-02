import { proxyToBackend } from "../../_backend";

export async function GET(request: Request) {
  return proxyToBackend(request, "/schedule/active-now");
}