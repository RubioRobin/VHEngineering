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
            <motion.button
                onClick={() => setMobileOpen(true)}
                initial={{ scale: 0 }}
                animate={{ scale: mobileOpen ? 0 : 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="md:hidden fixed bottom-6 left-6 z-50 w-16 h-16 bg-primary rounded-full shadow-lg flex items-center justify-center text-white"
            >
                <Menu className="w-6 h-6" />
            </motion.button>

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
                    width: mobileOpen ? 280 : (collapsed ? 80 : 280),
                    x: mobileOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 768 ? -280 : 0)
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
                    <div className="ml-3 overflow-hidden flex flex-col justify-center h-10">
                        <motion.div
                            initial={false}
                            animate={{
                                opacity: collapsed ? 0 : 1,
                                width: collapsed ? 0 : "auto",
                                marginLeft: collapsed ? 0 : 12
                            }}
                            transition={{ duration: 0.2 }}
                            className="whitespace-nowrap"
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
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center pl-4 pr-3 py-3 rounded-2xl text-slate-600 hover:bg-slate-50 hover:text-primary transition-all group"
                        >
                            <div className="w-6 h-6 flex items-center justify-center shrink-0">
                                <item.icon className="w-6 h-6 transition-colors" />
                            </div>
                            <motion.span
                                initial={false}
                                animate={{
                                    opacity: collapsed ? 0 : 1,
                                    width: collapsed ? 0 : "auto",
                                    marginLeft: collapsed ? 0 : 12
                                }}
                                transition={{ duration: 0.2 }}
                                className="font-bold text-base overflow-hidden whitespace-nowrap"
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
                                opacity: collapsed ? 0 : 1,
                                width: collapsed ? 0 : "auto",
                                marginLeft: collapsed ? 0 : 12
                            }}
                            transition={{ duration: 0.2 }}
                            className="font-bold text-base overflow-hidden whitespace-nowrap"
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
                                opacity: collapsed ? 0 : 1,
                                width: collapsed ? 0 : "auto",
                                marginLeft: collapsed ? 0 : 12
                            }}
                            transition={{ duration: 0.2 }}
                            className="font-bold text-base overflow-hidden whitespace-nowrap"
                        >
                            Inklappen
                        </motion.span>
                    </button>
                </div>
            </motion.aside>
        </>
    );
};
