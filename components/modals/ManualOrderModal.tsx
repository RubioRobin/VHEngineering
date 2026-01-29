'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, X, ShoppingBag } from 'lucide-react';
import { DashboardButton } from '../ui/DashboardButton';

interface ManualOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (name: string) => void;
}

export const ManualOrderModal = ({ isOpen, onClose, onConfirm }: ManualOrderModalProps) => {
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onConfirm(name.trim());
            setName('');
            onClose();
        }
    };

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
                                    <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center text-accent">
                                        <ShoppingBag className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-800">Bestel voor collega</h2>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X className="w-6 h-6 text-gray-400" />
                                </button>
                            </div>

                            <p className="text-gray-600 mb-6 italic">
                                Voer de naam van de collega in voor wie je een bestelling wilt plaatsen.
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 ml-1">Naam Collega</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            autoFocus
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Bijv. Jan de Vries"
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-accent focus:bg-white rounded-2xl outline-none transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                <DashboardButton
                                    type="submit"
                                    className="w-full bg-accent hover:bg-accent-dark h-14 text-lg shadow-lg shadow-accent/20 text-white"
                                    disabled={!name.trim()}
                                    icon={<ShoppingBag className="w-5 h-5" />}
                                >
                                    Start bestelling
                                </DashboardButton>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
