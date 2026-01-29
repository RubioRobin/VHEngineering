'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, X, Loader2, Ban } from 'lucide-react';
import { DashboardButton } from '../ui/DashboardButton';
import { useToast } from '../providers/ToastProvider';
import { useUser } from '../providers/UserProvider';

interface NotParticipatingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const NotParticipatingModal = ({ isOpen, onClose, onSuccess }: NotParticipatingModalProps) => {
    const { user, adminShadowUser } = useUser();
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();

    // Reset/Sync name when modal opens or user/shadow changes
    useEffect(() => {
        if (isOpen) {
            setName(adminShadowUser || (user ? user.name : ''));
        }
    }, [isOpen, user, adminShadowUser]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const submitName = adminShadowUser || (user ? user.name : name);

        if (!submitName.trim()) {
            showToast('Vul a.u.b. je naam in', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userName: submitName.trim(),
                    userId: adminShadowUser ? null : user?.id,
                    items: [],
                    notParticipating: true
                }),
            });

            if (res.ok) {
                showToast(
                    adminShadowUser
                        ? `Afgemeld voor deze week: ${adminShadowUser}`
                        : 'Je hebt je afgemeld voor deze week',
                    'success'
                );
                onSuccess();
                onClose();
            } else {
                const data = await res.json();
                showToast(data.error || 'Er is iets misgegaan', 'error');
            }
        } catch (error) {
            showToast('Kon afmelding niet versturen', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const hasIdentity = !!adminShadowUser || !!user;
    const displayName = adminShadowUser || user?.name;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                                        <Ban className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-800">Ik eet niet mee</h2>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X className="w-6 h-6 text-gray-400" />
                                </button>
                            </div>

                            <p className="text-gray-600 mb-6 italic">
                                Laat de organisator weten dat je deze week overslaat. Je wordt dan niet meegerekend voor de bezorgkosten.
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {hasIdentity ? (
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <p className="text-gray-700 text-center font-medium">
                                            Wil je {adminShadowUser ? 'een collega' : 'jezelf'} afmelden als <span className="font-bold text-gray-900">{displayName}</span>?
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 ml-1">Jouw Naam</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                autoFocus
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Bijv. Jan de Vries"
                                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-red-500 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>
                                )}

                                <DashboardButton
                                    type="submit"
                                    className="w-full bg-red-600 hover:bg-red-700 h-14 text-lg shadow-lg shadow-red-600/20"
                                    isLoading={isLoading}
                                    icon={<Ban className="w-5 h-5" />}
                                >
                                    {hasIdentity ? 'Ja, ik eet niet mee' : 'Bevestig afmelding'}
                                </DashboardButton>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
