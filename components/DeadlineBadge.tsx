"use client";

import { useEffect, useState } from 'react';
import { Clock } from "lucide-react";
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

export const DeadlineBadge = () => {
    const [deadline, setDeadline] = useState<Date | null>(null);

    useEffect(() => {
        const fetchDeadline = async () => {
            try {
                const res = await fetch('/api/deadline');
                if (res.ok) {
                    const data = await res.json();
                    setDeadline(new Date(data.deadline));
                }
            } catch (error) {
                console.error('Error fetching deadline:', error);
            }
        };

        fetchDeadline();

        // Refresh deadline every minute
        const interval = setInterval(fetchDeadline, 60000);
        return () => clearInterval(interval);
    }, []);

    const deadlineText = deadline
        ? `Bestellen sluit om ${format(deadline, 'HH:mm', { locale: nl })}`
        : 'Bestellen sluit om 14:00';

    return (
        <div className="fixed bottom-6 left-6 md:left-[304px] z-40 transition-[left] duration-300">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 text-sm font-bold animate-pulse">
                <Clock className="w-4 h-4" />
                <span>{deadlineText}</span>
            </div>
        </div>
    );
};
