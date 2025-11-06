import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import { query } from '@/app/lib/db';
import bcrypt from 'bcrypt';

// ==========================================
// INTERFACES
// ==========================================

interface LoginUser {
    id: number;
    correo: string;
    contrasena: string;
    ultima_vez_conectado: Date | null;
    primera_vez_conectado: Date;
    id_negocio: number;
}

interface NegocioInfo {
    id: number;
    nombre_negocio: string;
    numero: string;
    path: string;
}

// ==========================================
// FUNCIONES DE BASE DE DATOS
// ==========================================

async function getUser(email: string): Promise<LoginUser | undefined> {
    try {
        const result = await query(
            `SELECT 
                l.id, 
                l.correo, 
                l.contrasena, 
                l.ultima_vez_conectado, 
                l.primera_vez_conectado, 
                l.id_negocio
            FROM login l
            WHERE l.correo = $1`,
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

async function getNegocioById(negocioId: number): Promise<NegocioInfo | undefined> {
    try {
        const result = await query(
            'SELECT id, nombre_negocio, numero, path FROM negocio WHERE id = $1',
            [negocioId]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Failed to fetch negocio:', error);
        return undefined;
    }
}

async function updateLastLogin(userId: number): Promise<void> {
    try {
        await query(
            'UPDATE login SET ultima_vez_conectado = NOW() WHERE id = $1',
            [userId]
        );
    } catch (error) {
        console.error('Failed to update last login:', error);
    }
}

// ==========================================
// CONFIGURACIÓN DE NEXTAUTH
// ==========================================

export const { auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ 
                        email: z.string().email(), 
                        password: z.string().min(6) 
                    })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await getUser(email);
                    
                    if (!user) {
                        console.log(' User not found:', email);
                        return null;
                    }

                    // Verificar que el usuario tenga un id_negocio asignado
                    if (!user.id_negocio) {
                        console.log(' Usuario sin negocio asignado:', email);
                        return null;
                    }

                    const passwordsMatch = await bcrypt.compare(password, user.contrasena);
                    
                    if (!passwordsMatch) {
                        console.log(' Invalid password for:', email);
                        return null;
                    }

                    // Actualizar última vez conectado
                    await updateLastLogin(user.id);
                    
                    // Obtener información del negocio
                    const negocio = await getNegocioById(user.id_negocio);
                    
                    if (!negocio) {
                        console.log(' Negocio not found for id:', user.id_negocio);
                        return null;
                    }

                    console.log(' Login successful:', {
                        email: user.correo,
                        id_negocio: negocio.id,
                        nombre_negocio: negocio.nombre_negocio
                    });
                    
                    return {
                        id: user.id.toString(),
                        email: user.correo,
                        name: negocio.nombre_negocio || user.correo.split('@')[0],
                        // CRÍTICO: Guardar id_negocio en la sesión
                        id_negocio: negocio.id,
                        nombre_negocio: negocio.nombre_negocio,
                        numero_negocio: negocio.numero,
                    };
                }

                console.log('Invalid credentials');
                return null;
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                // @ts-ignore - Agregar campos personalizados al token
                token.id_negocio = user.id_negocio;
                // @ts-ignore
                token.nombre_negocio = user.nombre_negocio;
                // @ts-ignore
                token.numero_negocio = user.numero_negocio;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                // @ts-ignore - Agregar campos personalizados a la sesión
                session.user.id_negocio = token.id_negocio as number;
                // @ts-ignore
                session.user.nombre_negocio = token.nombre_negocio as string;
                // @ts-ignore
                session.user.numero_negocio = token.numero_negocio as string;
            }
            return session;
        },
    },
});