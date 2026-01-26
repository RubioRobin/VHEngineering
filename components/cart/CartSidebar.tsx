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
    const [personName, setPersonName] = useState('');
    const [department, setDepartment] = useState('');
    const [clientToken, setClientToken] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

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

    // Load user info on mount
    const { user, login } = useUser();

    // ...

    // Load user info on mount or when user changes
    useEffect(() => {
        if (user) {
            setPersonName(user.name);
            setDepartment(user.department || '');
        } else {
            // Fallback for non-logged in users (if any)
            setPersonName(localStorage.getItem('personName') || '');
            setDepartment(localStorage.getItem('department') || '');
        }
        setClientToken(localStorage.getItem('clientToken') || '');
    }, [user]);

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

    const handleRemove = (id: string) => {
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

    const handleSubmitOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!personName.trim()) {
            setError('Naam is verplicht');
            return;
        }

        if (cartItems.length === 0) {
            setError('Je winkelmandje is leeg');
            return;
        }

        setIsSubmitting(true);

        // Ensure token
        let currentToken = clientToken;
        if (!currentToken) {
            currentToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            setClientToken(currentToken);
            localStorage.setItem('clientToken', currentToken);
        }

        // Save user info
        localStorage.setItem('personName', personName.trim());
        localStorage.setItem('department', department.trim());

        try {
            // Ensure we have a valid UserId, even if the user didn't explicitly login via the modal
            let activeUserId = user?.id;

            if (!activeUserId) {
                // Auto-create/find user to ensure order history works
                try {
                    const userRes = await fetch("/api/user", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name: personName, department }),
                    });

                    if (userRes.ok) {
                        const userData = await userRes.json();
                        activeUserId = userData.id;
                        // Also update global state silently so "My Orders" works immediately
                        if (login) login(personName, department);
                    }
                } catch (e) {
                    console.error("Auto-link user failed", e);
                }
            }

            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userName: personName,
                    userId: activeUserId, // Use the resolved ID
                    department,
                    clientToken: currentToken,
                    items: cartItems.map((item) => ({
                        productId: item.product.id,
                        quantity: item.quantity,
                        comment: item.comment,
                    })),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit order');
            }

            // Success
            localStorage.removeItem('cart');
            setCartItems([]);
            // Update global cart state
            window.dispatchEvent(new Event('cart-updated'));

            // Dispatch success event for Modal
            const orderDetails = {
                orderId: data.id,
                totalAmount: calculateTotal(),
                itemCount: cartItems.reduce((acc, item) => acc + item.quantity, 0),
                items: cartItems.map(item => ({
                    name: item.product.name,
                    quantity: item.quantity,
                    price: item.product.price
                }))
            };
            window.dispatchEvent(new CustomEvent('order-success', { detail: orderDetails }));

            onClose(); // Close sidebar
        } catch (err: any) {
            setError(err.message || 'Er is iets misgegaan');
        } finally {
            setIsSubmitting(false);
        }
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
                        className="fixed inset-y-0 right-0 z-[100] w-full max-w-md bg-white shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary-glow/20 rounded-lg text-primary">
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

                        <div className="p-5 border-t border-gray-100 bg-white space-y-4">

                            {error && (
                                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                                    {error}
                                </div>
                            )}



                            <div className="flex items-center justify-between pt-2">
                                <span className="text-gray-600 font-medium">Totaal</span>
                                <span className="text-2xl font-bold text-primary">€ {total.toFixed(2)}</span>
                            </div>

                            <button
                                onClick={handleSubmitOrder}
                                disabled={isSubmitting}
                                className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <span>Bezig...</span>
                                ) : (
                                    <>
                                        <span>Plaats Bestelling</span>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
