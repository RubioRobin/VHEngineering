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
                <div className={`h-20 flex items-center border-b border-border/50 transition-[padding] duration-300 ease-in-out ${collapsed ? 'pl-[22px]' : 'px-6'}`}>
                    <div className="w-10 h-10 bg-gradient-to-tr from-primary to-primary-light rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
                        {user?.name?.charAt(0).toUpperCase() || 'G'}
                    </div>
                    {/* Text Container - Scroll width/opacity/margin */}
                    <motion.div
                        initial={false}
                        animate={{
                            width: collapsed ? 0 : "auto",
                            opacity: collapsed ? 0 : 1,
                            marginLeft: collapsed ? 0 : 12, // ml-3 is 12px
                        }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden flex flex-col justify-center h-10"
                    >
                        <div className="whitespace-nowrap">
                            <h1 className="font-medium text-base text-text-primary">{user?.name || 'Gast'}</h1>
                            <p className="text-xs text-text-muted">{(user as any)?.department || 'Gast'}</p>
                        </div>
                    </motion.div>
                </div>

                {/* Menu */}
                <nav className="flex-1 pt-2 pb-4 px-3 space-y-2">
                    {menuItems.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            // Collapsed: 80px width. Icon 24px. Center = 28px padding.
                            // Expanded: pl-4 (16px).
                            // using pl-[28px] centers the 24px icon in 80px container
                            className={`flex items-center py-3 rounded-2xl text-slate-600 hover:bg-slate-50 hover:text-primary transition-all duration-300 group ${collapsed ? 'pl-[28px] pr-0' : 'pl-4 pr-3'}`}
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
                        </Link>
                    ))}
                </nav>

                {/* Bottom Actions - Only show on desktop */}
                <div className="p-3 border-t border-border/50 space-y-2 hidden md:block">
                    <Link
                        href="/settings"
                        className={`flex items-center py-3 w-full rounded-2xl text-slate-600 hover:bg-slate-50 hover:text-primary transition-all duration-300 group ${collapsed ? 'pl-[28px] pr-0' : 'pl-4 pr-3'}`}
                        title={collapsed ? "Instellingen" : undefined}
                    >
                        <div className="w-6 h-6 flex items-center justify-center shrink-0">
                            <Settings className="w-6 h-6" />
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
                            Settings
                        </motion.span>
                    </Link>
                    <button
                        onClick={toggleSidebar}
                        className={`flex items-center py-3 w-full rounded-2xl text-slate-600 hover:bg-slate-50 hover:text-primary transition-all duration-300 group ${collapsed ? 'pl-[28px] pr-0' : 'pl-4 pr-3'}`}
                        title={collapsed ? "Uitklappen" : "Inklappen"}
                    >
                        <div className="w-6 h-6 flex items-center justify-center shrink-0">
                            <ChevronLeft className={`w-6 h-6 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
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
                            Inklappen
                        </motion.span>
                    </button>
                </div>
            </motion.aside>
        </>
    );
};
