"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import React from "react";

interface NeonButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
    variant?: "primary" | "accent" | "outline";
    size?: "sm" | "default" | "lg";
    isLoading?: boolean;
    icon?: React.ReactNode;
}

export const NeonButton = ({
    children,
    className,
    variant = "primary",
    size = "default",
    isLoading,
    icon,
    ...props
}: NeonButtonProps) => {
    // Light mode adjusted variants
    const variants = {
        primary: "bg-primary text-white shadow-md hover:shadow-lg hover:bg-primary-dark",
        accent: "bg-accent text-white shadow-md hover:shadow-lg",
        outline: "bg-transparent border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-primary/50",
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        default: "px-6 py-3 text-sm",
        lg: "px-8 py-4 text-base",
    };

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "relative inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300",
                "disabled:opacity-50 disabled:pointer-events-none",
                variants[variant],
                sizes[size],
                className
            )}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {!isLoading && icon && <span className="w-4 h-4">{icon}</span>}
            {children as React.ReactNode}

            {/* Subtle Shine Effect */}
            <div className="absolute inset-0 -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none" />
        </motion.button>
    );
};
