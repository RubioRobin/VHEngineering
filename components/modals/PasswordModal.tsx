'use client';

import { useState } from 'react';
import { Lock, X } from 'lucide-react';

interface PasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (password: string) => void;
    title?: string;
    description?: string;
}

export function PasswordModal({
    isOpen,
    onClose,
    onSubmit,
    title = "Bevestiging vereist",
    description = "Voer de admin code in om door te gaan"
}: PasswordModalProps) {
    const [password, setPassword] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password.trim()) {
            onSubmit(password);
            setPassword('');
        }
    };

    const handleClose = () => {
        setPassword('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl transform transition-all scale-100 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                            <Lock className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                            <p className="text-gray-500 text-sm mt-0.5">{description}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 text-center text-lg tracking-widest border border-gray-200 bg-gray-50 focus:border-red-500 focus:bg-white text-gray-900 rounded-xl outline-none transition-all"
                            placeholder="••••"
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all"
                        >
                            Annuleren
                        </button>
                        <button
                            type="submit"
                            disabled={!password.trim()}
                            className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
                        >
                            Bevestigen
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
