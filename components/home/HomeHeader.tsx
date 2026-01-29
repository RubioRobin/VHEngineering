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
    onNotParticipating: () => void;
}

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

export const HomeHeader = ({ deadline, lastOrder, onReorder, onNotParticipating }: HomeHeaderProps) => {
    const { user, adminShadowUser, clearAdminShadowUser } = useUser();
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

                {/* Shadow Mode Banner */}
                <AnimatePresence>
                    {adminShadowUser && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="mb-8 p-4 bg-accent text-white rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border-2 border-accent-dark/20"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Admin Bestel Modus</h3>
                                    <p className="text-white/80 font-medium">Je bent momenteel aan het bestellen voor: <span className="text-white font-black underline decoration-2 underline-offset-4">{adminShadowUser}</span></p>
                                </div>
                            </div>
                            <button
                                onClick={clearAdminShadowUser}
                                className="px-6 py-2 bg-white/20 hover:bg-white/30 text-white font-bold rounded-2xl transition-all border border-white/30 active:scale-95"
                            >
                                Annuleren
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

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
                    {!adminShadowUser && (
                        lastOrder ? (
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

                                <div className="flex gap-2">
                                    <DashboardButton
                                        onClick={onReorder}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-4 shadow-lg"
                                    >
                                        Opnieuw
                                    </DashboardButton>
                                    <DashboardButton
                                        onClick={onNotParticipating}
                                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold py-4 border border-gray-200"
                                    >
                                        Eet niet mee
                                    </DashboardButton>
                                </div>
                            </DashboardCard>
                        ) : (
                            <DashboardCard className="flex-1 bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-100">
                                <div className="mb-4">
                                    <h3 className="text-lg font-bold text-indigo-900">Nog geen bestelling</h3>
                                    <p className="text-sm text-indigo-700 mt-1">
                                        Heb je deze week al wat gekozen? Of eet je niet mee?
                                    </p>
                                </div>

                                <DashboardButton
                                    onClick={onNotParticipating}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 shadow-lg shadow-indigo-200"
                                >
                                    Ik eet niet mee
                                </DashboardButton>
                            </DashboardCard>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};
