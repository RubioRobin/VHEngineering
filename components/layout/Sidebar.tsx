"use client";

import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, ClipboardList, Settings, History, FolderOpen, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useUser } from "../providers/UserProvider";
import { useUI } from "../providers/UIProvider";

const menuItems = [
    { icon: LayoutDashboard, label: 'Het assortiment', href: '/' },
    { icon: ClipboardList, label: 'Overzicht', href: '/overview' },
    { icon: History, label: 'Mijn bestellingen', href: '/my-orders' },
    { icon: FolderOpen, label: 'Archief', href: '/archives' },
];

export const Sidebar = () => {
    const { isSidebarCollapsed: collapsed, toggleSidebar } = useUI();
    const { user } = useUser();

    return (
        <>


            {/* Sidebar - Desktop always visible, Mobile slides in */}
            <motion.aside
                initial={false}
                animate={{
                    width: collapsed ? 80 : 240,
                    x: 0
                }}
                transition={{
                    type: "tween",
                    duration: 0.25,
                    ease: [0.4, 0.0, 0.2, 1]
                }}
                style={{ willChange: 'width' }}
                className="fixed left-0 top-0 bottom-0 z-50 bg-white border-r border-slate-300 shadow-soft flex flex-col md:z-40 overflow-hidden"
            >
                {/* User Profile Area (replaces logo) */}
                <motion.div
                    animate={{
                        paddingLeft: collapsed ? 20 : 24 // 20px centers 40px avatar in 80px. 24px is px-6.
                    }}
                    transition={{ duration: 0.2 }}
                    className="h-20 flex items-center border-b border-border/50"
                >
                    <div className="w-10 h-10 bg-gradient-to-tr from-primary to-primary-light rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
                        {user?.name?.charAt(0).toUpperCase() || 'G'}
                    </div>
                    {/* Text Container */}
                    <motion.div
                        initial={false}
                        animate={{
                            width: collapsed ? 0 : "auto",
                            opacity: collapsed ? 0 : 1,
                            marginLeft: collapsed ? 0 : 12,
                        }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden flex flex-col justify-center h-10"
                    >
                        <div className="whitespace-nowrap">
                            <h1 className="font-medium text-base text-text-primary">{user?.name || 'Gast'}</h1>
                            <p className="text-xs text-text-muted">{(user as any)?.department || 'Gast'}</p>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Menu */}
                <nav className="flex-1 pt-2 pb-4 px-3 space-y-2">
                    {menuItems.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            // Using motion.div wrapper or similar? No, Link can wrap motion.
                            // But Link expects string href.
                            // We will use a div inside link for the padding animation? 
                            // Or standard motion works on Link if we cast it?
                            // Safest: Animate padding via style prop or motion div inside? 
                            // Let's use CSS class for hover, but Motion for layout.
                            // Actually, let's keep it simple: Render Link as container, 
                            // but use motion.div as the inner content which accepts the padding? 
                            // No, padding needs to be on the container.
                            // Strategy: Use style prop driven by Framer or just CSS transition with adjusted ease.
                            // The user complained about smoothness. Framer is smoothest.
                            // Let's use motion.create(Link) - wait, that's complex with Next.js
                            // Let's use a motion.div surrounding the content inside the Link? No.
                            // Let's use `motion.a` (but we lose prefetch).
                            // Solution: Link > motion.div acting as the button.
                            passHref
                        >
                            <motion.div
                                animate={{
                                    paddingLeft: collapsed ? 28 : 16, // 28px centers 24px icon in 80px. 16px is pl-4.
                                    paddingRight: collapsed ? 0 : 12 // 12px is pr-3.
                                }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center py-3 rounded-2xl text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors group cursor-pointer"
                                title={collapsed ? item.label : undefined}
                            >
                                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                                    <item.icon className="w-6 h-6 transition-colors" />
                                </div>
                                <motion.span
                                    initial={false}
                                    animate={{
                                        opacity: collapsed ? 0 : 1,
                                        width: collapsed ? 0 : 'auto',
                                        marginLeft: collapsed ? 0 : 12
                                    }}
                                    transition={{ duration: 0.2 }}
                                    className="font-medium text-base overflow-hidden whitespace-nowrap"
                                >
                                    {item.label}
                                </motion.span>
                            </motion.div>
                        </Link>
                    ))}
                </nav>

                {/* Bottom Actions - Only show on desktop */}
                <div className="p-3 border-t border-border/50 space-y-2 hidden md:block">
                    <Link href="/settings" passHref>
                        <motion.div
                            animate={{
                                paddingLeft: collapsed ? 28 : 16,
                                paddingRight: collapsed ? 0 : 12
                            }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center py-3 w-full rounded-2xl text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors group cursor-pointer"
                            title={collapsed ? "Instellingen" : undefined}
                        >
                            <div className="w-6 h-6 flex items-center justify-center shrink-0">
                                <Settings className="w-6 h-6" />
                            </div>
                            <motion.span
                                animate={{
                                    opacity: collapsed ? 0 : 1,
                                    width: collapsed ? 0 : 'auto',
                                    marginLeft: collapsed ? 0 : 12
                                }}
                                transition={{ duration: 0.2 }}
                                className="font-medium text-base overflow-hidden whitespace-nowrap"
                            >
                                Settings
                            </motion.span>
                        </motion.div>
                    </Link>
                    <motion.button
                        onClick={toggleSidebar}
                        animate={{
                            paddingLeft: collapsed ? 28 : 16,
                            paddingRight: collapsed ? 0 : 12
                        }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center py-3 w-full rounded-2xl text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors group"
                        title={collapsed ? "Uitklappen" : "Inklappen"}
                    >
                        <div className="w-6 h-6 flex items-center justify-center shrink-0">
                            <ChevronLeft className={`w-6 h-6 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
                        </div>
                        <motion.span
                            animate={{
                                opacity: collapsed ? 0 : 1,
                                width: collapsed ? 0 : 'auto',
                                marginLeft: collapsed ? 0 : 12
                            }}
                            transition={{ duration: 0.2 }}
                            className="font-medium text-base overflow-hidden whitespace-nowrap"
                        >
                            Inklappen
                        </motion.span>
                    </motion.button>
                </div>
            </motion.aside>
        </>
    );
};
