'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { DashboardButton } from '@/components/ui/DashboardButton';
import { formatName } from '@/lib/utils';
import { useUser } from '@/components/providers/UserProvider';
import { useToast } from '@/components/providers/ToastProvider';

interface HomeHeaderProps {
    deadline: Date | null;
    lastOrder: any;
    onReorder: () => void;
    products: any[];
    onAddToCart: (product: any, quantity: number) => void;
    weekOrders: any[];
}

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

const DiceIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <circle cx="15.5" cy="15.5" r="1.5" />
    </svg>
);

const TrophyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-yellow-500">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.45.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
);

export const HomeHeader = ({ deadline, lastOrder, onReorder, products, onAddToCart, weekOrders }: HomeHeaderProps) => {
    const { showToast } = useToast();
    // Timer State
    const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

    // Update timer when deadline changes
    useEffect(() => {
        if (!deadline) return;

        const calculateTimeLeft = () => {
            const now = new Date();
            const target = new Date(deadline);
            const diff = target.getTime() - now.getTime();

            if (diff <= 0) {
                return null;
            }

            return {
                d: Math.floor(diff / (1000 * 60 * 60 * 24)),
                h: Math.floor((diff / (1000 * 60 * 60)) % 24),
                m: Math.floor((diff / 1000 / 60) % 60),
                s: Math.floor((diff / 1000) % 60),
            };
        };

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        setTimeLeft(calculateTimeLeft()); // Init

        return () => {
            clearInterval(timer);
        };
    }, [deadline]);

    return (
        <div className="bg-white pt-6 pb-6">
            <div className="max-w-[2400px] mx-auto px-6">
                <div className="flex flex-col md:flex-row items-stretch gap-6">
                    {/* Timer Card */}
                    <DashboardCard className={`flex-1 text-white border-none shadow-lg ${timeLeft && (timeLeft.d === 0 && timeLeft.h < 4)
                        ? 'bg-gradient-to-br from-red-500 to-red-700 animate-pulse shadow-red-500/30'
                        : 'bg-gradient-to-br from-primary to-primary-dark shadow-primary/20'
                        }`}>
                        <div className="flex flex-col h-full justify-between">
                            <div className="flex items-center gap-3 opacity-90">
                                <ClockIcon />
                                <span className="text-sm font-medium uppercase tracking-wider">
                                    {timeLeft && (timeLeft.d === 0 && timeLeft.h < 4) ? 'SPOED!' : 'Bestellen Sluit Over'}
                                </span>
                            </div>
                            <div className="mt-4">
                                {timeLeft ? (
                                    <>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-mono font-bold">{timeLeft.d}d</span>
                                            <span className="text-4xl font-mono font-bold">{timeLeft.h}u</span>
                                            <span className="text-4xl font-mono font-bold">{timeLeft.m}m</span>
                                        </div>
                                        {deadline && (
                                            <p className="text-white/70 text-sm mt-3 font-medium">
                                                Deadline: {format(deadline, 'EEEE d MMMM - HH:mm', { locale: nl })} uur
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <span className="text-3xl font-bold">Gesloten</span>
                                )}
                            </div>
                        </div>
                    </DashboardCard>

                    {/* Recent Order - Reorder */}
                    {lastOrder ? (
                        <DashboardCard className="flex-1 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                            <div className="mb-3">
                                <h3 className="text-lg font-bold text-text-primary">Bestel opnieuw</h3>
                            </div>

                            <div className="mb-3 space-y-1">
                                {lastOrder.orderItems?.slice(0, 3).map((item: any, idx: number) => (
                                    <div key={idx} className="text-sm text-text-secondary">
                                        <span className="font-medium text-text-primary">{item.quantity}x</span> {formatName(item.product.name)}
                                    </div>
                                ))}
                                {lastOrder.orderItems?.length > 3 && (
                                    <div className="text-sm text-text-muted italic">
                                        +{lastOrder.orderItems.length - 3} meer...
                                    </div>
                                )}
                            </div>

                            <DashboardButton
                                onClick={onReorder}
                                className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 shadow-lg"
                            >
                                Opnieuw bestellen
                            </DashboardButton>
                        </DashboardCard>
                    ) : (
                        /* Surprise Me Card for new users or when no last order */
                        <DashboardCard className="flex-1 bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
                            <div className="flex items-center gap-3 mb-3">
                                <DiceIcon />
                                <h3 className="text-lg font-bold text-indigo-900">Verras me! 🎲</h3>
                            </div>
                            <p className="text-sm text-indigo-700 mb-4">
                                Kun je niet kiezen? Laat het lot beslissen en bestel een willekeurig populair broodje!
                            </p>
                            <DashboardButton
                                onClick={() => {
                                    if (products.length === 0) return;
                                    const random = products[Math.floor(Math.random() * products.length)];
                                    onAddToCart(random, 1);
                                    showToast(`Verrassing! ${random.name} is toegevoegd aan je mandje!`, "success");
                                }}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 shadow-lg"
                            >
                                Doe maar wat!
                            </DashboardButton>
                        </DashboardCard>
                    )}

                    {/* Team Stats Card */}
                    <DashboardCard className="flex-1 bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <TrophyIcon />
                                <h3 className="text-lg font-bold text-amber-900">Team Prestatie</h3>
                            </div>
                            <div className="mt-2">
                                <span className="text-4xl font-bold text-amber-600">
                                    {weekOrders.length}
                                </span>
                                <p className="text-sm text-amber-800 font-medium mt-1">
                                    broodjes besteld door het team deze week!
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-amber-200/50">
                            <p className="text-xs text-amber-700 italic">
                                {weekOrders.length > 20 ? '🔥 Jullie zijn heerlijk bezig!' : '🚀 Wie volgt?'}
                            </p>
                        </div>
                    </DashboardCard>
                </div>
            </div>
        </div>
    );
}
