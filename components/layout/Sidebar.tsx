"use client";

import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, ClipboardList, Settings, Menu, X, History, FolderOpen, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useUser } from "../providers/UserProvider";
import { useUI } from "../providers/UIProvider";

const menuItems = [
    { icon: LayoutDashboard, label: 'Het assortiment', href: '/' },
    { icon: ClipboardList, label: 'Overzicht', href: '/overview' },
    { icon: History, label: 'Mijn bestellingen', href: '/mijn-bestellingen' },
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
                    width: collapsed ? 80 : 280,
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
                <div className="h-20 flex items-center px-6 border-b border-border/50">


                    <div className="w-10 h-10 bg-gradient-to-tr from-primary to-primary-light rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
                        {user?.name?.charAt(0).toUpperCase() || 'G'}
                    </div>
                    <div className="ml-3 overflow-hidden flex flex-col justify-center h-10">
                        <motion.div
                            initial={false}
                            animate={{
                                opacity: collapsed ? 0 : 1
                            }}
                            transition={{
                                duration: 0.2,
                                ease: "easeInOut",
                                delay: collapsed ? 0 : 0.1 // Delay fade-in slightly
                            }}
                            className="whitespace-nowrap ml-3"
                        >
                            <h1 className="font-bold text-base text-text-primary">{user?.name || 'Gast'}</h1>
                            <p className="text-xs text-text-muted">{(user as any)?.department || 'Gast'}</p>
                        </motion.div>
                    </div>
                </div>

                {/* Menu */}
                <nav className="flex-1 pt-2 pb-4 px-3 space-y-2">
                    {menuItems.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="flex items-center pl-4 pr-3 py-3 rounded-2xl text-slate-600 hover:bg-slate-50 hover:text-primary transition-all group"
                        >
                            <div className="w-6 h-6 flex items-center justify-center shrink-0">
                                <item.icon className="w-6 h-6 transition-colors" />
                            </div>
                            <motion.span
                                initial={false}
                                animate={{
                                    opacity: collapsed ? 0 : 1
                                }}
                                transition={{
                                    duration: 0.2,
                                    ease: "easeInOut",
                                    delay: collapsed ? 0 : 0.1
                                }}
                                className="font-bold text-base overflow-hidden whitespace-nowrap ml-3"
                            >
                                {item.label}
                            </motion.span>
                        </Link>
                    ))}
                </nav>

                {/* Bottom Actions - Only show on desktop */}
                <div className="p-3 border-t border-border/50 space-y-2 hidden md:block">
                    <Link href="/settings" className="flex items-center pl-4 pr-3 py-3 w-full rounded-2xl text-slate-600 hover:bg-slate-50 hover:text-primary transition-all group">
                        <div className="w-6 h-6 flex items-center justify-center shrink-0">
                            <Settings className="w-6 h-6" />
                        </div>
                        <motion.span
                            initial={false}
                            animate={{
                                opacity: collapsed ? 0 : 1
                            }}
                            transition={{
                                duration: 0.2,
                                ease: "easeInOut",
                                delay: collapsed ? 0 : 0.1
                            }}
                            className="font-bold text-base overflow-hidden whitespace-nowrap ml-3"
                        >
                            Settings
                        </motion.span>
                    </Link>
                    <button
                        onClick={toggleSidebar}
                        className="flex items-center pl-4 pr-3 py-3 w-full rounded-2xl text-slate-600 hover:bg-slate-50 hover:text-primary transition-all group"
                        title={collapsed ? "Uitklappen" : "Inklappen"}
                    >
                        <div className="w-6 h-6 flex items-center justify-center shrink-0">
                            <ChevronLeft className={`w-6 h-6 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
                        </div>
                        <motion.span
                            initial={false}
                            animate={{
                                opacity: collapsed ? 0 : 1
                            }}
                            transition={{
                                duration: 0.2,
                                ease: "easeInOut",
                                delay: collapsed ? 0 : 0.1
                            }}
                            className="font-bold text-base overflow-hidden whitespace-nowrap ml-3"
                        >
                            Inklappen
                        </motion.span>
                    </button>
                </div>
            </motion.aside>
        </>
    );
};
