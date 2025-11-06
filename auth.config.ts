import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            const isOnLogin = nextUrl.pathname.startsWith('/login');
            
            // Si está en dashboard y no está logueado, redirigir a login
            if (isOnDashboard && !isLoggedIn) {
                return false; // Trigger redirect to sign-in page
            }
            
            // Si está logueado y está en login, redirigir a dashboard
            if (isLoggedIn && isOnLogin) {
                return Response.redirect(new URL('/dashboard', nextUrl));
            }
            
            return true;
        },
    },
    providers: [],
} satisfies NextAuthConfig;