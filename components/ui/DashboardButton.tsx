"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import React from "react";

interface DashboardButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
    variant?: "primary" | "secondary" | "accent" | "ghost";
    size?: "sm" | "default" | "lg";
    isLoading?: boolean;
    icon?: React.ReactNode;
}

export const DashboardButton = ({
    children,
    className,
    variant = "primary",
    size = "default",
    isLoading,
    icon,
    ...props
}: DashboardButtonProps) => {

    const variants = {
        primary: "bg-primary text-white shadow-md hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/20",
        secondary: "bg-white border border-border text-text-secondary hover:bg-gray-50 hover:border-gray-300 hover:text-text-primary",
        accent: "bg-accent text-white shadow-md hover:bg-yellow-500",
        ghost: "bg-transparent text-text-secondary hover:bg-background hover:text-primary",
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs font-medium",
        default: "px-5 py-2.5 text-sm font-semibold",
        lg: "px-8 py-3.5 text-base font-semibold",
    };

    return (
        <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "relative inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-200",
                "disabled:opacity-50 disabled:pointer-events-none disabled:grayscale",
                variants[variant],
                sizes[size],
                className
            )}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {!isLoading && icon && <span className="w-4 h-4 shrink-0">{icon}</span>}
            {children as React.ReactNode}
        </motion.button>
    );
};
