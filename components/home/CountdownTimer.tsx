'use client';

import { useEffect, useState } from 'react';

interface CountdownTimerProps {
    deadline: Date;
    isOpen: boolean;
}

export default function CountdownTimer({ deadline, isOpen }: CountdownTimerProps) {
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        const targetTime = new Date(deadline).getTime();
        if (isNaN(targetTime)) return;

        // Initial calculation
        setTimeRemaining(targetTime - Date.now());

        // Update every second
        const interval = setInterval(() => {
            setTimeRemaining(targetTime - Date.now());
        }, 1000);

        return () => clearInterval(interval);
    }, [deadline]);

    const formatTime = (ms: number): string => {
        if (isNaN(ms) || ms <= 0) return 'Gesloten';

        const days = Math.floor(ms / (1000 * 60 * 60 * 24));
        const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);

        if (days > 0) {
            return `${days}d ${hours}u ${minutes}m`;
        } else if (hours > 0) {
            return `${hours}u ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    };

    const formattedDeadline = () => {
        const d = new Date(deadline);
        if (isNaN(d.getTime())) return 'Onbekend';
        return d.toLocaleString('nl-NL', {
            weekday: 'long',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    if (!mounted) {
        return (
            <div className="sticky top-0 z-50 bg-primary-700 text-white shadow-lg h-[84px]"></div>
        );
    }

    return (
        <div
            className={`sticky top-0 z-50 ${isOpen
                ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                : 'bg-gradient-to-r from-red-500 to-rose-600'
                } text-white shadow-lg`}
        >
            <div className="container mx-auto px-4 py-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <svg className="w-8 h-8 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <h2 className="font-bold text-lg">
                                {isOpen ? 'Bestellen kan nog' : 'Bestellen gesloten'}
                            </h2>
                            <p className="text-sm opacity-90">
                                {isOpen
                                    ? `Tot ${formattedDeadline()}`
                                    : 'De deadline is verstreken'}
                            </p>
                        </div>
                    </div>
                    <div className="text-center">
                        {isOpen ? (
                            <div className="text-3xl font-bold tabular-nums">
                                {formatTime(timeRemaining)}
                            </div>
                        ) : (
                            <div className="text-lg font-semibold">
                                Opent weer volgende week
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
