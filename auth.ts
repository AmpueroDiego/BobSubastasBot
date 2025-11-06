import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import { query } from '@/app/lib/db';
import bcrypt from 'bcrypt';

interface LoginUser {
    id: number;
    email: string;
    password: string;
}

async function getUser(email: string): Promise<LoginUser | undefined> {
    try {
        const result = await query(
            `SELECT id, email, password 
             FROM login 
             WHERE email = $1`,
            [email]
        );
        
        if (result.rows.length === 0) {
            return undefined;
        }
        
        return result.rows[0];
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');
    }
}

export const { auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ 
                        email: z.string().min(1, 'Email requerido'), 
                        password: z.string().min(1, 'Contraseña requerida')
                    })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await getUser(email);
                    
                    if (!user) {
                        console.log('❌ User not found:', email);
                        return null;
                    }

                    const passwordsMatch = await bcrypt.compare(password, user.password);
                    
                    if (!passwordsMatch) {
                        console.log('❌ Invalid password for:', email);
                        return null;
                    }

                    console.log('✅ Login successful:', email);
                    
                    return {
                        id: user.id.toString(),
                        email: user.email,
                        name: user.email.split('@')[0],
                    };
                }

                console.log('❌ Invalid credentials');
                return null;
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.email = token.email as string;
            }
            return session;
        },
    },
});