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
        <div className={`rounded-xl overflow-hidden shadow-lg transition-all duration-300 ${isUrgent
                ? 'bg-gradient-to-r from-red-500 to-red-600 animate-pulse'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600'
            }`}>
            <div className="px-6 py-5">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-1">
                            {isUrgent ? 'SPOED!' : 'Bestellen sluit over'}
                        </p>
                        {timeLeft ? (
                            <div className="flex items-baseline gap-2">
                                <span className="text-white text-4xl font-mono font-bold">{timeLeft.d}d</span>
                                <span className="text-white text-4xl font-mono font-bold">{timeLeft.h}u</span>
                                <span className="text-white text-4xl font-mono font-bold">{timeLeft.m}m</span>
                            </div>
                        ) : (
                            <span className="text-white text-3xl font-bold">Gesloten</span>
                        )}
                    </div>
                    {deadline && (
                        <div className="hidden md:flex items-center gap-2 text-white/90">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div className="text-sm">
                                <div className="font-semibold">{format(deadline, 'EEEE d MMMM', { locale: nl })}</div>
                                <div className="text-white/70">{format(deadline, 'HH:mm', { locale: nl })} uur</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
