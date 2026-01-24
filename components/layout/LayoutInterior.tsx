"use client";

import { Sidebar } from '@/components/layout/Sidebar';
import { Footer } from '@/components/layout/Footer';
import { useUI } from '@/components/providers/UIProvider';

export const LayoutInterior = ({ children }: { children: React.ReactNode }) => {
    const { isSidebarCollapsed } = useUI();

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div
                className={`flex-1 transition-[padding] duration-300 ease-out flex flex-col ${isSidebarCollapsed ? 'md:pl-[80px]' : 'md:pl-[280px]'
                    }`}
            >
                <main className="px-4 pt-4 pb-8 min-h-screen flex-1">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
                <Footer />
            </div>
        </div>
    );
};
