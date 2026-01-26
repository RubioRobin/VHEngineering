"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardButton } from "../ui/DashboardButton";
import { useUser } from "../providers/UserProvider";
import { formatName } from "@/lib/utils";
import { useToast } from "../providers/ToastProvider";
import { useOrders } from "../providers/OrdersProvider";

interface CartItem {
    id: string;
    product: {
        id: string;
        name: string;
        price: number;
    };
    quantity: number;
    comment: string;
}

export const CartSidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const { user } = useUser();
    const { showToast } = useToast();
    const { refreshOrders } = useOrders();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [generalComment, setGeneralComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [orderCount, setOrderCount] = useState(0);

    const SHIPPING_COST = 1.95;

    useEffect(() => {
        const fetchCurrentPeriod = async () => {
            try {
                const res = await fetch('/api/orders/period/current');
                if (res.ok) {
                    const data = await res.json();
                    setOrderCount(data.orderCount || 0);
                }
            } catch (err) {
                console.error("Failed to fetch current period count", err);
            }
        };

        if (isOpen) {
            fetchCurrentPeriod();
        }
    }, [isOpen]);

    useEffect(() => {
        const loadCart = () => {
            const items = JSON.parse(localStorage.getItem('cart') || '[]');
            setCart(items);
        };

        loadCart();
        window.addEventListener('cart-updated', loadCart);
        return () => window.removeEventListener('cart-updated', loadCart);
    }, []);

    // Hide body scrollbar when cart is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const updateQuantity = (id: string, delta: number) => {
        const newCart = cart.map(item => {
            if (item.id === id) {
                return { ...item, quantity: Math.max(1, item.quantity + delta) };
            }
            return item;
        });
        setCart(newCart);
        localStorage.setItem('cart', JSON.stringify(newCart));
        window.dispatchEvent(new Event('cart-updated'));
    };

    const updateComment = (id: string, comment: string) => {
        const newCart = cart.map(item => item.id === id ? { ...item, comment } : item);
        setCart(newCart);
        localStorage.setItem('cart', JSON.stringify(newCart));
    };

    const removeItem = (id: string) => {
        const newCart = cart.filter(item => item.id !== id);
        setCart(newCart);
        localStorage.setItem('cart', JSON.stringify(newCart));
        window.dispatchEvent(new Event('cart-updated'));
        showToast("Product verwijderd uit mandje", "error");
    };

    const getSubtotal = () => {
        return cart.reduce((total, item) => total + (item.quantity * item.product.price), 0);
    };

    const getShippingShare = () => {
        // We assume the user's order will be the next one, so N + 1
        return SHIPPING_COST / (orderCount + 1);
    };

    const getTotal = () => {
        return getSubtotal() + getShippingShare();
    };

    const handlePlaceOrder = async () => {
        if (!user) {
            showToast("Je moet ingelogd zijn om te bestellen!", "error");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userName: user.name,
                    userId: user.id,
                    items: cart,
                    generalComment
                })
            });

            if (res.ok) {
                // Clear cart
                setCart([]);
                localStorage.setItem('cart', '[]');
                setGeneralComment("");
                window.dispatchEvent(new Event('cart-updated'));
                onClose();
                onClose();
                showToast("Bestelling succesvol geplaatst! Bedankt.", "success");
                refreshOrders();
            } else {
                const data = await res.json();
                showToast(data.error || "Er ging iets mis bij het plaatsen van de bestelling.", "error");
            }
        } catch (error) {
            console.error(error);
            showToast("Netwerkfout bij plaatsen bestelling.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 cursor-pointer"
                    />

                    {/* Sidebar Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed top-0 right-0 bottom-0 w-full md:max-w-md bg-white shadow-2xl z-[51] flex flex-col md:rounded-l-3xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-border flex items-center justify-between bg-background/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                    <ShoppingBag className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg text-text-primary">Bestelling</h2>
                                    <p className="text-xs text-text-muted">{cart.length} artikelen</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-text-secondary" />
                            </button>
                        </div>

                        {/* Items */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                                    <ShoppingBag className="w-16 h-16 mb-4 text-gray-300" />
                                    <p className="text-lg font-medium">Je mandje is leeg</p>
                                    <p className="text-sm">Voeg wat lekkers toe!</p>
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <div key={item.id} className="bg-background rounded-xl p-4 border border-border/50">
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="font-semibold text-text-primary pr-4">{formatName(item.product.name)}</h4>
                                            <span className="font-bold text-primary">€ {(item.product.price * item.quantity).toFixed(2)}</span>
                                        </div>

                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3 bg-white rounded-lg border border-border px-2 py-1">
                                                <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center hover:text-primary">-</button>
                                                <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center hover:text-primary">+</button>
                                            </div>

                                            <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <input
                                            type="text"
                                            value={item.comment || ''}
                                            onChange={(e) => updateComment(item.id, e.target.value)}
                                            placeholder="Opmerking (bijv. geen boter)"
                                            className="w-full mt-3 text-base sm:text-xs bg-white border border-border rounded-lg px-3 py-2 outline-none focus:border-primary/50 transition-colors"
                                        />
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-background border-t border-border">
                            <div className="mb-4">
                                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 block">Algemene opmerking</label>
                                <textarea
                                    value={generalComment}
                                    onChange={(e) => setGeneralComment(e.target.value)}
                                    placeholder="Iets wat we moeten weten over de hele bestelling?"
                                    className="w-full text-base sm:text-sm bg-white border border-border rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-colors resize-none h-20"
                                />
                            </div>

                            <div className="space-y-2 mb-6">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-text-secondary">Subtotaal</span>
                                    <span className="font-semibold text-text-primary">€ {getSubtotal().toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm italic">
                                    <div className="flex flex-col">
                                        <span className="text-text-secondary">Bezorgkosten (gedeeld)</span>
                                        <span className="text-[10px] text-text-muted mt-0.5">Wordt verdeeld over {orderCount + 1} deelnemers</span>
                                    </div>
                                    <span className="font-medium text-text-primary">€ {getShippingShare().toFixed(2)}</span>
                                </div>
                                <div className="pt-2 border-t border-border flex items-center justify-between">
                                    <span className="text-text-primary font-bold">Totaal</span>
                                    <span className="text-2xl font-bold text-primary">€ {getTotal().toFixed(2)}</span>
                                </div>
                            </div>

                            <DashboardButton
                                className="w-full py-4 text-lg shadow-lg shadow-primary/20"
                                onClick={handlePlaceOrder}
                                disabled={cart.length === 0 || submitting}
                                isLoading={submitting}
                            >
                                Bestelling Plaatsen
                            </DashboardButton>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
