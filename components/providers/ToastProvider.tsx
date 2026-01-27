"use client";

import { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, X, Loader2 } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ConfirmOptions {
    message: string;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
    showConfirm: (options: ConfirmOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [confirmDialog, setConfirmDialog] = useState<ConfirmOptions | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);

    const showToast = (message: string, type: ToastType = 'info') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    };

    const showConfirm = (options: ConfirmOptions) => {
        setConfirmDialog(options);
    };

    const handleConfirm = async () => {
        if (!confirmDialog) return;

        const result = confirmDialog.onConfirm();

        // Check if it's a promise
        if (result instanceof Promise) {
            setIsConfirming(true);
            try {
                await result;
                setConfirmDialog(null);
            } catch (error) {
                console.error("Confirm action failed", error);
                // Optionally keep dialog open or close it
                setConfirmDialog(null);
            } finally {
                setIsConfirming(false);
            }
        } else {
            setConfirmDialog(null);
        }
    };

    const handleCancel = () => {
        confirmDialog?.onCancel?.();
        setConfirmDialog(null);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="w-5 h-5" />;
            case 'error': return <XCircle className="w-5 h-5" />;
            case 'warning': return <AlertCircle className="w-5 h-5" />;
            default: return <AlertCircle className="w-5 h-5" />;
        }
    };

    const getColors = (type: ToastType) => {
        switch (type) {
            case 'success': return 'bg-green-50 border-green-200 text-green-800';
            case 'error': return 'bg-red-50 border-red-200 text-red-800';
            case 'warning': return 'bg-orange-50 border-orange-200 text-orange-800';
            default: return 'bg-blue-50 border-blue-200 text-blue-800';
        }
    };

    return (
        <ToastContext.Provider value={{ showToast, showConfirm }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map(toast => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, x: 50, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.95, transition: { duration: 0.2 } }}
                            className={`${getColors(toast.type)} border rounded-full shadow-lg min-w-[320px] max-w-md pointer-events-auto relative`}
                        >
                            <div className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="shrink-0">{getIcon(toast.type)}</div>
                                    <p className="flex-1 font-semibold text-sm leading-tight">{toast.message}</p>
                                    <button
                                        onClick={() => removeToast(toast.id)}
                                        className="p-1 hover:bg-black/5 rounded-full transition-colors shrink-0"
                                    >
                                        <X className="w-4 h-4 opacity-50" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Confirm Dialog */}
            <AnimatePresence>
                {confirmDialog && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                            onClick={handleCancel}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed inset-0 flex items-center justify-center z-50 p-4"
                            style={{ pointerEvents: 'none' }}
                        >
                            <div
                                className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full"
                                style={{ pointerEvents: 'auto' }}
                            >
                                <h3 className="text-lg font-bold text-text-primary mb-2">Bevestiging</h3>
                                <p className="text-text-secondary mb-6">{confirmDialog.message}</p>
                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={handleCancel}
                                        disabled={isConfirming}
                                        className="px-4 py-2 rounded-lg border border-border text-text-secondary hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                                    >
                                        {confirmDialog.cancelText || 'Annuleren'}
                                    </button>
                                    <button
                                        onClick={handleConfirm}
                                        disabled={isConfirming}
                                        className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white transition-colors font-medium disabled:opacity-70 flex items-center gap-2"
                                    >
                                        {isConfirming && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {confirmDialog.confirmText || 'Bevestigen'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </ToastContext.Provider>
    );
};
