"use client";

import { usePathname } from "next/navigation";

export const Topbar = () => {
    const pathname = usePathname();

    return (
        <header className="h-20 fixed top-0 right-0 left-0 md:left-[280px] z-30 bg-background/80 backdrop-blur-md px-8 flex items-center justify-between transition-[left] duration-300">
            {/* Empty - search moved to product section */}
            <div></div>
        </header>
    );
};
