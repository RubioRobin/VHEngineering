"use client";

import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Clock, Settings, Menu, X, History, FolderOpen, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useUser } from "../providers/UserProvider";
import { useUI } from "../providers/UIProvider";

const menuItems = [
    { icon: LayoutDashboard, label: 'Het assortiment', href: '/' },
    { icon: Clock, label: 'Overzicht', href: '/overview' },
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
                transition={{ type: "spring", stiffness: 260, damping: 25, mass: 0.8 }}
                className="fixed left-0 top-0 bottom-0 z-50 bg-white border-r border-border shadow-soft flex flex-col md:z-40"
            >
                {/* User Profile Area (replaces logo) */}
                <div className="h-20 flex items-center justify-between px-6 border-b border-border/50">
                    <div className="flex items-center">
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
                        {!collapsed && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-3">
                                <h1 className="font-bold text-base text-text-primary">{user?.name || 'Gast'}</h1>
                                <p className="text-xs text-text-muted">{(user as any)?.department || 'Gast'}</p>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Desktop Collapse Toggle - Floating in middle */}
                <button
                    onClick={toggleSidebar}
                    className="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-4 w-8 h-12 items-center justify-center rounded-r-lg bg-primary hover:bg-primary-dark text-white border-l-0 border border-primary/20 hover:border-primary/30 transition-all duration-200 shadow-lg z-10"
                    title={collapsed ? "Uitklappen" : "Inklappen"}
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>

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
                            {!collapsed && (
                                <span className="font-medium text-sm">{item.label}</span>
                            )}
                        </Link>
                    ))}
                </nav>

                {/* Bottom Actions - Only show on desktop */}
                <div className="p-4 border-t border-border/50 space-y-2 hidden md:block">
                    <Link href="/settings" className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-text-secondary hover:bg-background transition-colors">
                        <Settings className="w-5 h-5" />
                        {!collapsed && <span className="font-medium text-sm">Settings</span>}
                    </Link>
                </div>
            </motion.aside>
        </>
    );
};
