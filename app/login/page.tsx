import LoginForm from '@/app/ui/login-form';
import {Metadata} from "next";
import Image from "next/image";

export const metadata: Metadata = {
    title: 'Login',
};

export default function LoginPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 px-4 py-12">
            <div className="relative w-full max-w-md">
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-32 h-32 bg-white rounded-full shadow-2xl flex items-center justify-center animate-float">
                    <Image
                        src="/logo_llama.png"
                        width={90}
                        height={90}
                        alt="Logo"
                        className="object-contain"
                    />
                </div>
                <div className="mt-20 pt-16">
                    <LoginForm />
                </div>
            </div>
        </main>
    );
}