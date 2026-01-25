"use client";

import { useUI } from "../providers/UIProvider";

export function LayoutContent({ children }: { children: React.ReactNode }) {
    const { isSidebarCollapsed } = useUI();

    return (
        <div
            className={`flex-1 flex flex-col ${isSidebarCollapsed ? 'md:pl-[80px]' : 'md:pl-[280px]'
                }`}
            style={{
                transition: 'padding-left 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                willChange: 'padding-left'
            }}
        >
            {children}
        </div>
    );
}
