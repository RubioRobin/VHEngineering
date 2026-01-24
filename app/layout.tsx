import type { Metadata } from 'next';
import { Outfit, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Footer } from '@/components/layout/Footer';
import { UserProvider } from '@/components/providers/UserProvider';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { UserIdentityModal } from '@/components/modals/UserIdentityModal';

const outfit = Outfit({
    subsets: ['latin'],
    variable: '--font-outfit',
    display: 'swap',
});

const jetbrains = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-jetbrains',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'VH Engineering | Premium Broodjes',
    description: 'Bestel je lunch op hoog niveau.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="nl" className={`${outfit.variable} ${jetbrains.variable}`}>
            <body className="min-h-screen bg-background text-text-primary antialiased font-sans overflow-x-hidden">
                <ToastProvider>
                    <UserProvider>
                        <UserIdentityModal />

                        <div className="flex min-h-screen">
                            {/* Sidebar */}
                            <Sidebar />

                            {/* Main Content Area */}
                            <div className="flex-1 md:pl-[280px] transition-[padding] duration-300 flex flex-col">
                                <main className="px-4 pt-4 pb-8 min-h-screen flex-1">
                                    <div className="max-w-7xl mx-auto">
                                        {children}
                                    </div>
                                </main>
                                <Footer />
                            </div>
                        </div>
                    </UserProvider>
                </ToastProvider>
            </body>
        </html>
    );
}
