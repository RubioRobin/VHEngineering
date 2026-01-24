'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';

interface AdminLoginModalProps {
    onLogin: (code: string) => Promise<boolean>;
}

export function AdminLoginModal({ onLogin }: AdminLoginModalProps) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(false);

        const success = await onLogin(code);
        if (!success) {
            setError(true);
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl transform transition-all scale-100 animate-in fade-in zoom-in duration-200">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                        <Lock className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Admin Login</h2>
                    <p className="text-gray-500 text-sm mt-1">Voer de toegangscode in</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <input
                            type="password"
                            value={code}
                            onChange={(e) => {
                                setCode(e.target.value);
                                setError(false);
                            }}
                            className={`w-full px-4 py-3 text-center text-lg tracking-widest border rounded-xl outline-none transition-all ${error
                                    ? 'border-red-300 bg-red-50 focus:border-red-500 text-red-900'
                                    : 'border-gray-200 bg-gray-50 focus:border-indigo-500 focus:bg-white text-gray-900'
                                }`}
                            placeholder="••••"
                            autoFocus
                        />
                        {error && (
                            <p className="text-center text-red-500 text-sm font-medium animate-pulse">
                                Onjuiste code
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !code}
                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
                    >
                        {loading ? 'Controleren...' : 'Inloggen'}
                    </button>
                </form>
            </div>
        </div>
    );
}
