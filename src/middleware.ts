import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// どのパスでこのMiddlewareを実行するかを指定します
export const config = {
  // /main と、その配下のすべてのパス（例: /main/settings）にマッチします
  matcher: '/main/:path*',
};

export function middleware(request: NextRequest) {
  // リクエストに含まれるCookieから 'loggedIn' の値を取得します
  let loggedInCookie = request.cookies.get('loggedIn');

  // Cookieが存在しないか、値が 'true' でない場合
  if (!loggedInCookie || loggedInCookie.value !== 'true') {
    // ログインページへの絶対URLを構築してリダイレクトさせます
    const loginUrl = new URL('/', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 認証が成功した場合は、ユーザーがリクエストしたページへのアクセスを許可します
  return NextResponse.next();
}