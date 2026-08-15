import { NextRequest, NextResponse } from 'next/server';

const getBackendOrigin = () => {
  if (process.env.BACKEND_PROXY_TARGET) return process.env.BACKEND_PROXY_TARGET;
  if (process.env.NEXT_PUBLIC_BACKEND_URL) return process.env.NEXT_PUBLIC_BACKEND_URL;
  return 'http://127.0.0.1:5000';
};

async function handleProxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await context.params;
    const pathString = Array.isArray(path) ? path.join('/') : '';
    const searchParams = request.nextUrl.search || '';
    const backendOrigin = getBackendOrigin();
    const targetUrl = `${backendOrigin.replace(/\/$/, '')}/api/${pathString}${searchParams}`;

    const reqHeaders = new Headers(request.headers);
    reqHeaders.delete('host');

    const hasBody = !['GET', 'HEAD'].includes(request.method);
    const bodyData = hasBody ? await request.blob() : undefined;

    const backendRes = await fetch(targetUrl, {
      method: request.method,
      headers: reqHeaders,
      body: bodyData,
      cache: 'no-store'
    });

    const resHeaders = new Headers(backendRes.headers);
    resHeaders.delete('content-encoding');

    const arrayBuffer = await backendRes.arrayBuffer();
    return new NextResponse(arrayBuffer, {
      status: backendRes.status,
      statusText: backendRes.statusText,
      headers: resHeaders
    });
  } catch (err: any) {
    console.error('[Next.js API Catch-All Proxy Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Backend server communication error', details: err.message },
      { status: 502 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
export const PATCH = handleProxy;
export const OPTIONS = handleProxy;
