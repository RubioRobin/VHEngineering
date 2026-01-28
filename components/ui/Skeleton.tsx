"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => {
    return (
        <div
            className={cn(
                "animate-pulse bg-gray-200 rounded-md",
                className
            )}
        />
    );
};

export const ProductSkeleton = () => (
    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm flex flex-col h-full">
        <Skeleton className="aspect-square w-full rounded-none" />
        <div className="p-4 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="pt-2 flex justify-between items-center">
                <Skeleton className="h-10 w-24 rounded-xl" />
                <Skeleton className="h-10 w-16 rounded-xl" />
            </div>
        </div>
    </div>
);

export const DashboardCardSkeleton = () => (
    <div className="bg-white rounded-2xl border border-border/50 p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
            </div>
        </div>
        <Skeleton className="h-20 w-full rounded-xl" />
    </div>
);
