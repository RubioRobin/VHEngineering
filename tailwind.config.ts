import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // SaaS Dashboard Palette
                background: '#F6F8FF', // Soft Blue-White
                surface: '#FFFFFF',    // Pure White Cards
                'surface-highlight': '#F3F4F6', // Light Gray Hover

                // Primary Accent - Indigo/Blue
                primary: {
                    DEFAULT: '#4F46E5', // Indigo 600
                    glow: '#C7D2FE',    // Indigo 200
                    dark: '#4338CA',    // Indigo 700
                    light: '#818CF8',   // Indigo 400
                },

                // Secondary Accents
                accent: {
                    DEFAULT: '#F59E0B', // Amber 500 (Status/Alerts)
                    glow: '#FDE68A',
                    pink: '#EC4899',    // Pink 500 (Highlights)
                },

                // Text
                text: {
                    primary: '#1F2937',   // Gray 800
                    secondary: '#6B7280', // Gray 500
                    muted: '#9CA3AF',     // Gray 400
                },

                border: '#E5E7EB', // Gray 200
            },
            fontFamily: {
                sans: ['var(--font-outfit)', 'Inter', 'system-ui', 'sans-serif'],
                mono: ['var(--font-jetbrains)', 'monospace'],
            },
            boxShadow: {
                'soft': '0 2px 10px rgba(0, 0, 0, 0.03)',
                'card': '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
                'hover': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
            },
            borderRadius: {
                'lg': '16px',
                'xl': '20px',
                '2xl': '24px',
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'spin-slow': 'spin 12s linear infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-20px)' },
                }
            },
        },
    },
    plugins: [],
};
export default config;
