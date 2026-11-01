import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const protectedRoutes = [
  "/dashboard",
  "/chat",
  "/complaints",
  "/lost-found",
  "/admin",
];
const publicRoutes = ["/", "/auth/callback", "/admin/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes immediately
  if (publicRoutes.includes(pathname)) {
    const { supabaseResponse } = await updateSession(request);
    return supabaseResponse;
  }

  // Check if route requires authentication
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtected) {
    const { supabaseResponse } = await updateSession(request);
    return supabaseResponse;
  }

  // Check multiple authentication providers (Supabase session, Firebase session cookie, Admin JWT)
  const { supabaseResponse, user } = await updateSession(request);
  const adminToken = request.cookies.get("aiva_admin_token")?.value;
  const authSessionCookie = request.cookies.get("aiva_auth_session")?.value;

  const isAuthenticated = Boolean(user || authSessionCookie || adminToken);

  if (!isAuthenticated) {
    const url = request.nextUrl.clone();
    if (pathname.startsWith("/admin")) {
      url.pathname = "/admin/login";
    } else {
      url.pathname = "/";
      url.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(url);
  }

  // Check admin route access
  const isAdminPath = pathname.startsWith("/admin") && pathname !== "/admin/login";
  if (isAdminPath) {
    const isSupabaseAdmin = user?.user_metadata?.role === "admin";
    if (!adminToken && !isSupabaseAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
