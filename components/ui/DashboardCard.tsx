"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import React from "react";

interface DashboardCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    hoverEffect?: boolean;
    noPadding?: boolean;
    className?: string; // Explicitly added for better compatibility
}

export const DashboardCard = ({ children, className, hoverEffect = true, noPadding = false, ...props }: DashboardCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={hoverEffect ? { y: -4, boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.05)" } : {}}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={cn(
                "bg-white rounded-2xl border border-border/50 shadow-card overflow-hidden",
                !noPadding && "p-6",
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
};
