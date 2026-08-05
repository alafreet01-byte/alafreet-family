import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { updateSession } from "./lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const legacyRoutes: Record<string, string> = {
    "/dashboard": "/v9/home",
    "/family": "/v9/family",
    "/calendar": "/v9/calendar",
    "/rewards": "/v9/rewards",
    "/tasks": "/v9/school",
    "/memories": "/v9/time-capsule",
    "/assistant": "/v9/noor",
    "/showcase": "/v9/home",
  };
  const destination = legacyRoutes[request.nextUrl.pathname];
  if (destination) return NextResponse.redirect(new URL(destination, request.url), 308);
  return updateSession(request);
}

export const config = {
  matcher: ["/login", "/v9/:path*", "/dashboard", "/family", "/calendar", "/rewards", "/tasks", "/memories", "/assistant", "/showcase"],
};
