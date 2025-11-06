import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth(async function middleware(req: NextRequest) {
  const session = await auth();
  
  if (session?.user) {
    const requestHeaders = new Headers(req.headers);
    // @ts-ignore
    const idNegocio = session.user.id_negocio;
    
    if (idNegocio) {
      requestHeaders.set('x-id-negocio', idNegocio.toString());
    }
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};