"use client";

import { useUI } from "../providers/UIProvider";

export function LayoutContent({ children }: { children: React.ReactNode }) {
    const { isSidebarCollapsed } = useUI();

    return (
        <div
            className={`flex-1 transition-[padding] duration-300 flex flex-col ${isSidebarCollapsed ? 'md:pl-[80px]' : 'md:pl-[280px]'
                }`}
        >
            {children}
        </div>
    );
}
