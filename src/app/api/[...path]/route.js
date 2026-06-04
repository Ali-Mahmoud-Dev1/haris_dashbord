import { NextResponse } from "next/server";

const API_BASE = (
  process.env.API_BASE_URL ||
  "http://t12zliy5o7f2azy6tyt1zz3e.76.13.155.172.sslip.io/api"
).replace(/\/+$/, "");

const FORWARD_HEADERS = ["authorization", "content-type", "accept", "accept-language"];

function buildBackendUrl(subPath, search) {
  const clean = String(subPath || "").replace(/^\/+|\/+$/g, "");
  if (!clean) return `${API_BASE}${search}`;
  const segment = /\.[a-z0-9]+$/i.test(clean) ? clean : `${clean}/`;
  return `${API_BASE}/${segment}${search}`;
}

async function proxyRequest(request, context) {
  const { path = [] } = await context.params;
  const subPath = path.join("/");
  const targetUrl = buildBackendUrl(subPath, request.nextUrl.search);

  const headers = new Headers();
  for (const name of FORWARD_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  let body;
  if (request.method !== "GET" && request.method !== "HEAD") {
    body = await request.arrayBuffer();
  }

  let backendResponse;
  try {
    backendResponse = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: body?.byteLength ? body : undefined,
      redirect: "manual",
    });
  } catch {
    return NextResponse.json({ detail: "Cannot reach the API server." }, { status: 502 });
  }

  if (backendResponse.status >= 300 && backendResponse.status < 400) {
    return NextResponse.json(
      {
        detail: `Unexpected API redirect (${backendResponse.status}) for ${subPath}.`,
      },
      { status: 502 }
    );
  }

  const responseHeaders = new Headers();
  const contentType = backendResponse.headers.get("content-type");
  if (contentType) responseHeaders.set("content-type", contentType);

  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
