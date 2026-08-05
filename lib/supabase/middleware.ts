import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },

      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtectedRoute = request.nextUrl.pathname.startsWith("/v9");
  const isLoginRoute = request.nextUrl.pathname === "/login";

  if (isProtectedRoute && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginRoute && user) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = user.user_metadata?.must_change_password
      ? "/v9/account"
      : "/v9/home";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  if (isProtectedRoute && user) {
    if (
      user.user_metadata?.must_change_password === true &&
      request.nextUrl.pathname !== "/v9/account"
    ) {
      const passwordUrl = request.nextUrl.clone();
      passwordUrl.pathname = "/v9/account";
      passwordUrl.search = "";
      return NextResponse.redirect(passwordUrl);
    }

    const { data: member } = await supabase
      .from("family_members")
      .select("id, role")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (member) {
      const path = request.nextUrl.pathname;
      const isSuperAdmin = member.role === "super_admin";
      const isSchoolAdmin = member.role === "school_admin";
      const isUniversityUser = member.role === "university_user";
      const isStudent = member.role === "student" || member.role === "child";

      const restricted =
        ((path.startsWith("/v9/admin") ||
          path.startsWith("/v9/father") ||
          path.startsWith("/v9/core") ||
          path.startsWith("/v9/intelligence")) &&
          !isSuperAdmin) ||
        (path.startsWith("/v9/amal") &&
          !isSuperAdmin &&
          !isSchoolAdmin) ||
        (path.startsWith("/v9/khalid") &&
          !isSuperAdmin &&
          !isSchoolAdmin &&
          !isUniversityUser) ||
        (path.startsWith("/v9/school") &&
          !isSuperAdmin &&
          !isSchoolAdmin &&
          !isStudent);

      if (restricted) {
        const allowedUrl = request.nextUrl.clone();
        allowedUrl.pathname = isSuperAdmin
          ? "/v9/father"
          : isSchoolAdmin
            ? "/v9/amal"
            : isUniversityUser
              ? "/v9/khalid"
              : isStudent
                ? "/v9/school"
                : "/v9/home";
        allowedUrl.search = "";
        return NextResponse.redirect(allowedUrl);
      }
    }
  }

  return response;
}
