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
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden p-6 relative"
            >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-emerald-600" />

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
                        <div className="w-full bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-500 text-sm">Aantal items</span>
                                <span className="font-semibold text-gray-800">{orderData.itemCount}</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-500 text-sm">Ordernummer</span>
                                <span className="font-mono text-xs bg-white px-2 py-1 rounded border overflow-ellipsis max-w-[120px]">
                                    {orderData.orderId.slice(-6).toUpperCase()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                                <span className="text-gray-600 font-medium">Totaal</span>
                                <span className="font-bold text-emerald-600">€ {orderData.totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    )}

                    <DashboardButton
                        onClick={onClose}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 py-3"
                    >
                        Sluiten
                    </DashboardButton>
                </div>
            </motion.div>
        </div>
    );
};
