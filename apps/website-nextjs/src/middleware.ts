import type { NextRequest } from "next/server";

import { updateSession } from "~/libs/middlewares/auth";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!api|manifest.webmanifest|images|_next/static|_next/image|favicon.ico).*)",
  ],
};
