"use client";

import { motion } from "framer-motion";
import { ShoppingCart, Menu, Search } from "lucide-react";
import Link from "next/link";
import { NeonButton } from "./NeonButton";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                scrolled ? "py-4" : "py-6"
            )}
        >
            <div className={cn(
                "container mx-auto px-4 transition-all duration-300",
                scrolled ? "max-w-7xl" : "max-w-7xl"
            )}>
                <div className={cn(
                    "flex items-center justify-between rounded-2xl px-6 py-4",
                    "bg-white/80 backdrop-blur-xl border border-gray-200 shadow-lg transition-all duration-300",
                    scrolled && "bg-white/95 border-primary/10 shadow-xl"
                )}>
                    {/* Logo Area */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="relative w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                            <span className="text-white font-bold text-xl">VH</span>
                        </div>
                        <span className="text-xl font-bold tracking-tight text-gray-900 group-hover:text-primary transition-colors">
                            Engineering
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        {['Het Assortiment', 'Weektopper', 'Mijn Bestelling'].map((item) => (
                            <Link
                                key={item}
                                href="#"
                                className="text-sm font-medium text-gray-600 hover:text-primary transition-colors relative group"
                            >
                                {item}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                            </Link>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            className="p-2 text-gray-500 hover:text-primary transition-colors"
                        >
                            <Search className="w-5 h-5" />
                        </motion.button>

                        <NeonButton variant="primary" className="px-4 py-2 text-sm">
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Winkelmandje</span>
                            <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded text-xs">0</span>
                        </NeonButton>
                    </div>
                </div>
            </div>
        </motion.header>
    );
};
