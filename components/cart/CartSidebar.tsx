'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation'; // Correct import for App Router
import { X, ShoppingBag, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CartItem, { CartItemData } from '@/components/CartItem'; // Adjust path if needed
import { useUser } from '@/components/providers/UserProvider'; // Assuming this exists

interface CartSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CartSidebar = ({ isOpen, onClose }: CartSidebarProps) => {
    const router = useRouter();
    const [cartItems, setCartItems] = useState<CartItemData[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Close on click outside
    // (Implementation omitted for brevity, focusing on core logic)

    useEffect(() => {
        if (isOpen) {
            loadCart();
        }
    }, [isOpen]);

    // Listen for global cart updates
    useEffect(() => {
        const handleCartUpdate = () => loadCart();
        window.addEventListener('cart-updated', handleCartUpdate);
        return () => window.removeEventListener('cart-updated', handleCartUpdate);
    }, []);

    const loadCart = () => {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        setCartItems(cart);
    };

    const saveCart = (items: CartItemData[]) => {
        localStorage.setItem('cart', JSON.stringify(items));
        setCartItems(items);
        window.dispatchEvent(new Event('cart-updated')); // Keep sync
    };

    const handleUpdateQuantity = (id: string, quantity: number) => {
        const updated = cartItems.map((item) =>
            item.id === id ? { ...item, quantity } : item
        );
        saveCart(updated);
    };

    const handleUpdateComment = (id: string, comment: string) => {
        const updated = cartItems.map((item) =>
            item.id === id ? { ...item, comment } : item
        );
        saveCart(updated);
    };

    const handleRemove = (id: string, force = false) => {
        if (!force && !window.confirm('Weet je zeker dat je dit item wilt verwijderen?')) return;
        const updated = cartItems.filter((item) => item.id !== id);
        saveCart(updated);
    };

    const calculateTotal = () => {
        return cartItems.reduce((sum, item) => {
            if (item.product.price) {
                return sum + item.product.price * item.quantity;
            }
            return sum;
        }, 0);
    };

    const handleCheckout = () => {
        onClose();
        router.push('/cart'); // Navigate to full cart page
    };

    const total = calculateTotal();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black z-50 transition-opacity backdrop-blur-sm"
                    />

                    {/* Sidebar */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                                    <ShoppingBag className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Winkelmandje</h2>
                                    <p className="text-sm text-gray-500">{cartItems.length} items</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Items */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50">
                            {cartItems.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                                        <ShoppingBag className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-medium text-gray-900">Je mandje is leeg</p>
                                        <p className="text-sm text-gray-500">Tijd om iets lekkers uit te zoeken!</p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="mt-4 px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                    >
                                        Verder winkelen
                                    </button>
                                </div>
                            ) : (
                                cartItems.map((item) => (
                                    <CartItem
                                        key={item.id}
                                        item={item}
                                        onUpdateQuantity={handleUpdateQuantity}
                                        onUpdateComment={handleUpdateComment}
                                        onRemove={handleRemove}
                                    />
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {cartItems.length > 0 && (
                            <div className="p-5 border-t border-gray-100 bg-white space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 font-medium">Totaal</span>
                                    <span className="text-2xl font-bold text-primary-600">€ {total.toFixed(2)}</span>
                                </div>
                                <button
                                    onClick={handleCheckout}
                                    className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                >
                                    <span>Afrekenen</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
