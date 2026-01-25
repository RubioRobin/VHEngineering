import type { Metadata } from 'next';
import { Outfit, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Footer } from '@/components/layout/Footer';
import { UserProvider } from '@/components/providers/UserProvider';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { UIProvider } from '@/components/providers/UIProvider';
import { UserIdentityModal } from '@/components/modals/UserIdentityModal';
import { LayoutContent } from '@/components/layout/LayoutContent';

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
                        <UIProvider>
                            <UserIdentityModal />

                            <div className="flex min-h-screen">
                                {/* Sidebar */}
                                <Sidebar />

                                {/* Main Content Area */}
                                <LayoutContent>
                                    <main className="px-4 pt-4 pb-8 min-h-screen flex-1">
                                        <div className="max-w-7xl mx-auto">
                                            {children}
                                        </div>
                                    </main>
                                    <Footer />
                                </LayoutContent>
                            </div>
                        </UIProvider>
                    </UserProvider>
                </ToastProvider>
            </body>
        </html>
    );
}
