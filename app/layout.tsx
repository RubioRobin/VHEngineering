import type { Metadata } from 'next';
import { Outfit, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { UserProvider } from '@/components/providers/UserProvider';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { UserIdentityModal } from '@/components/modals/UserIdentityModal';
import { UIProvider } from '@/components/providers/UIProvider';
import { LayoutInterior } from '@/components/layout/LayoutInterior';

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
                    <UIProvider>
                        <UserProvider>
                            <UserIdentityModal />
                            <LayoutInterior>
                                {children}
                            </LayoutInterior>
                        </UserProvider>
                    </UIProvider>
                </ToastProvider>
            </body>
        </html>
    );
}
