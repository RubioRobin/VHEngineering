"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { DashboardButton } from "../ui/DashboardButton";
import confetti from "canvas-confetti";
import { useEffect } from "react";

interface OrderSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderData: {
        orderId: string;
        totalAmount: number;
        itemCount: number;
        items?: { name: string; quantity: number; price: number | null }[];
    } | null;
}

export const OrderSuccessModal = ({ isOpen, onClose, orderData }: OrderSuccessModalProps) => {
    useEffect(() => {
        if (isOpen) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#10B981', '#3B82F6', '#F59E0B']
            });

            // Auto close after 5 seconds
            const timer = setTimeout(() => {
                onClose();
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden p-6 relative"
            >


                <div className="flex flex-col items-center text-center mt-4">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 text-emerald-600">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                        >
                            <Check className="w-10 h-10 stroke-[3]" />
                        </motion.div>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Bestelling geplaatst!</h2>

                    {orderData && (
                        <div className="w-full bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100 text-left">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-500 text-sm">Aantal items</span>
                                <span className="font-semibold text-gray-800">{orderData.itemCount}</span>
                            </div>

                            {/* Item Summary List */}
                            {orderData.items && orderData.items.length > 0 && (
                                <div className="mb-4 mt-2 max-h-40 overflow-y-auto border-t border-b border-gray-100 py-2">
                                    <ul className="space-y-2">
                                        {orderData.items.map((item, index) => (
                                            <li key={index} className="flex justify-between text-sm">
                                                <span className="text-gray-700 truncate max-w-[200px]" title={item.name}>
                                                    {item.quantity}x {item.name}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                                <span className="text-gray-600 font-medium text-sm">Totaal</span>
                                <span className="font-bold text-emerald-600">€ {orderData.totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    )}

                    <div className="w-full relative group">
                        <DashboardButton
                            onClick={onClose}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 py-3 relative overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                Sluiten
                            </span>
                        </DashboardButton>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
