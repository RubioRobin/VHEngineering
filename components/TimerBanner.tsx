"use client";

import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface TimerBannerProps {
    timeLeft: { d: number; h: number; m: number; s: number } | null;
    deadline: Date | null;
}

export const TimerBanner = ({ timeLeft, deadline }: TimerBannerProps) => {
    const isUrgent = timeLeft && timeLeft.d === 0 && timeLeft.h < 4;

    return (
        <div className={`sticky top-0 z-40 transition-all duration-300 ${isUrgent
            ? 'bg-gradient-to-r from-red-500 via-red-600 to-red-500 animate-pulse shadow-lg shadow-red-500/50'
            : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 shadow-md'
            }`}>
            <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-white/90 text-sm font-semibold uppercase tracking-wider">
                                {isUrgent ? '🚨 Spoed!' : 'Bestellen sluit over'}
                            </span>
                        </div>
                        {timeLeft ? (
                            <div className="flex items-baseline gap-2">
                                <span className="text-white text-2xl md:text-3xl font-mono font-bold">{timeLeft.d}d</span>
                                <span className="text-white text-2xl md:text-3xl font-mono font-bold">{timeLeft.h}u</span>
                                <span className="text-white text-2xl md:text-3xl font-mono font-bold">{timeLeft.m}m</span>
                            </div>
                        ) : (
                            <span className="text-white text-xl font-bold">Gesloten</span>
                        )}
                    </div>
                    {deadline && (
                        <div className="hidden md:block text-white/80 text-sm">
                            {format(deadline, 'EEEE d MMMM', { locale: nl })} · {format(deadline, 'HH:mm', { locale: nl })} uur
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
