import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Formats a string to Sentence Case (Only first letter capital)
 * Example: "BROODJE GEZOND" -> "Broodje gezond"
 * Example: "Broodje Gezond" -> "Broodje gezond"
 */
export function formatName(name: string): string {
    if (!name) return "";
    const lower = name.toLowerCase().trim();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
}
