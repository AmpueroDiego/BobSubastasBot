import '@/app/ui/global.css';
import { inter } from '@/app/ui/fonts';
import { Metadata } from 'next';
// Ajusta la ruta de importación
import Sidebar from './sidebar';
import Navbar from './navbar';


export const metadata: Metadata = {
  title: {
    template: '%s | Bob Subastas',
    default: 'Bob Subastas Dashboard',
  },
  description: 'Sistema de gestión de citas y clientes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased bg-gray-50 flex h-screen`}>

        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />
          
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}