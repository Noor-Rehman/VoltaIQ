module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/frontend/app/api/_backend.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "proxyToBackend",
    ()=>proxyToBackend
]);
const BACKEND_BASE_URL = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";
async function proxyToBackend(request, path) {
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
        cache: "no-store"
    });
    const responseHeaders = new Headers();
    const backendType = backendResponse.headers.get("content-type");
    if (backendType) {
        responseHeaders.set("content-type", backendType);
    }
    return new Response(await backendResponse.text(), {
        status: backendResponse.status,
        headers: responseHeaders
    });
}
}),
"[project]/frontend/app/api/predict/today/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$app$2f$api$2f$_backend$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/app/api/_backend.ts [app-route] (ecmascript)");
;
async function GET(request) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$app$2f$api$2f$_backend$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["proxyToBackend"])(request, "/predict/today");
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0kjhabm._.js.map