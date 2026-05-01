import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/** ログイン必須かつメール確認済みのみ（診断アプリ本体） */
const PROTECTED_PREFIXES = ["/home", "/state-check", "/avatar-diagnosis"];

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((c) => {
    to.cookies.set(c.name, c.value);
  });
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next({ request });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // `/api` でも getUser まで通す（トークン更新を Cookie に載せる）。認可は各 Route で行う。
  if (pathname.startsWith("/api")) {
    return supabaseResponse;
  }

  if (!isProtectedPath(pathname)) {
    return supabaseResponse;
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);

  if (!user) {
    const redirect = NextResponse.redirect(loginUrl);
    copyCookies(supabaseResponse, redirect);
    return redirect;
  }

  if (!user.email_confirmed_at) {
    const noticeUrl = new URL("/login", request.url);
    noticeUrl.searchParams.set("notice", "email_unconfirmed");
    const redirect = NextResponse.redirect(noticeUrl);
    copyCookies(supabaseResponse, redirect);
    return redirect;
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
