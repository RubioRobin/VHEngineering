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
    const [mobileOpen, setMobileOpen] = useState(false);
    const { user } = useUser();

    // Close mobile menu when screen gets larger
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setMobileOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <>
            {/* Mobile Hamburger Button */}
            <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden fixed top-4 left-4 z-50 w-12 h-12 bg-primary rounded-xl shadow-lg flex items-center justify-center text-white"
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* Mobile Backdrop */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setMobileOpen(false)}
                        className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar - Desktop always visible, Mobile slides in */}
            <motion.aside
                initial={false}
                animate={{
                    width: collapsed ? 80 : 280,
                    x: mobileOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 768 ? -280 : 0)
                }}
                transition={{
                    type: "tween",
                    duration: 0.3,
                    ease: [0.4, 0.0, 0.2, 1]
                }}
                className="fixed left-0 top-0 bottom-0 z-50 bg-white border-r border-border shadow-soft flex flex-col md:z-40"
            >
                {/* User Profile Area (replaces logo) */}
                <div className="h-20 flex items-center px-6 border-b border-border/50">
                    {/* Mobile Close Button */}
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="md:hidden absolute top-6 right-4 p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="w-10 h-10 bg-gradient-to-tr from-primary to-primary-light rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
                        {user?.name?.charAt(0).toUpperCase() || 'G'}
                    </div>
                    <AnimatePresence mode="wait">
                        {!collapsed && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="ml-3"
                            >
                                <h1 className="font-bold text-base text-text-primary">{user?.name || 'Gast'}</h1>
                                <p className="text-xs text-text-muted">{(user as any)?.department || 'Gast'}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Menu */}
                <nav className="flex-1 py-8 px-4 space-y-2">
                    {menuItems.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:bg-background hover:text-primary transition-colors group"
                        >
                            <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <AnimatePresence mode="wait">
                                {!collapsed && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="font-medium text-sm"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </Link>
                    ))}
                </nav>

                {/* Bottom Actions - Only show on desktop */}
                <div className="p-4 border-t border-border/50 space-y-2 hidden md:block">
                    <Link href="/settings" className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-text-secondary hover:bg-background transition-colors">
                        <Settings className="w-5 h-5" />
                        <AnimatePresence mode="wait">
                            {!collapsed && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="font-medium text-sm"
                                >
                                    Settings
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </Link>
                    <button
                        onClick={toggleSidebar}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-text-secondary hover:bg-background transition-colors"
                        title={collapsed ? "Uitklappen" : "Inklappen"}
                    >
                        <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
                        <AnimatePresence mode="wait">
                            {!collapsed && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="font-medium text-sm"
                                >
                                    Inklappen
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </motion.aside>
        </>
    );
};
