# Fix CORS for Expo Web (localhost:8081 → Vercel API)

When the Expo app runs in the **browser** at `http://localhost:8081` and calls your API at `https://smart-school-system-pmdb.vercel.app`, the browser blocks requests because the API does not send CORS headers.

**Fix:** Add CORS headers in your **backend** repo (`smart-school-system-pmdb` on Vercel). The mobile app (this repo) cannot fix CORS; only the server can.

---

## Option 1 — Global middleware (recommended)

In your **Next.js backend** repo root, create or update `middleware.ts`:

```ts
// middleware.ts (root of Next.js project)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ALLOWED_ORIGINS = [
  'http://localhost:8081',           // Expo web dev
  'http://localhost:19006',         // Expo web alternate
  'https://your-app-domain.com',    // Production app domain
];

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin') ?? '';
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  // Handle preflight (OPTIONS)
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Token',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', allowOrigin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Token');
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

Then deploy to Vercel. All `/api/*` routes will send CORS headers and respond to OPTIONS.

---

## Option 2 — Allow any origin (dev only)

For quick local testing only (not recommended for production):

```ts
response.headers.set('Access-Control-Allow-Origin', '*');
```

Use Option 1 in production and allow only your real origins.

---

## Why Postman works but the browser doesn’t

- **Postman** does not enforce CORS.
- **Browsers** do: they send an OPTIONS preflight and require `Access-Control-Allow-Origin` (and related headers) on the response; otherwise they block the request and you see `net::ERR_FAILED`.

---

## Native app (iOS/Android)

On a real device or simulator, the Expo app uses the native HTTP stack, which does **not** enforce CORS. So the same API will work without CORS when you run the app on a device (e.g. `npx expo run:ios` or scan QR with Expo Go). CORS only applies when the app runs in a **browser** (Expo web at localhost:8081).
