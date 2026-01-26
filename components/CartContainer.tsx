'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CartItem, { CartItemData } from '@/components/CartItem';

export default function CartContainer() {
    const router = useRouter();
    const [cartItems, setCartItems] = useState<CartItemData[]>([]);
    const [personName, setPersonName] = useState('');
    const [department, setDepartment] = useState('');
    const [clientToken, setClientToken] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Auto-hide toast after 3 seconds
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    useEffect(() => {
        loadCart();
        loadUserInfo();
    }, []);

    const loadCart = () => {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        setCartItems(cart);
    };

    const loadUserInfo = () => {
        setPersonName(localStorage.getItem('personName') || '');
        setDepartment(localStorage.getItem('department') || '');
        setClientToken(localStorage.getItem('clientToken') || '');
    };

    const saveCart = (items: CartItemData[]) => {
        localStorage.setItem('cart', JSON.stringify(items));
        setCartItems(items);
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
            setError('Winkelmandje is leeg');
            return;
        }

        setIsSubmitting(true);

        // Ensure we have a client token
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
            const editingOrderId = localStorage.getItem('editingOrderId');
            const url = editingOrderId ? `/api/orders/${editingOrderId}` : '/api/orders';
            const method = editingOrderId ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    personName,
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

            // Success! Clear cart and redirect
            localStorage.removeItem('cart');
            localStorage.removeItem('editingOrderId');
            // alert(editingOrderId ? 'Bestelling aangepast!' : 'Bestelling geplaatst! Bedankt voor je bestelling.');
            setToast({ message: editingOrderId ? 'Bestelling aangepast!' : 'Bestelling geplaatst!', type: 'success' });

            // Dispatch success event for Modal
            const orderDetails = {
                orderId: data.id,
                totalAmount: calculateTotal(),
                itemCount: cartItems.reduce((acc, item) => acc + item.quantity, 0)
            };
            window.dispatchEvent(new CustomEvent('order-success', { detail: orderDetails }));

            setTimeout(() => router.push('/my-orders'), 2000);
        } catch (err: any) {
            setError(err.message || 'Er is iets misgegaan');
        } finally {
            setIsSubmitting(false);
        }
    };

    const total = calculateTotal();

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white relative">
            {/* Header */}
            <header className="bg-white shadow-md">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold text-gray-900">Winkelmandje</h1>
                        <button
                            onClick={() => router.push('/')}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
                        >
                            ← Terug naar assortiment
                        </button>
                    </div>
                </div>
            </header>

            {/* Toast Notification */}
            {toast && (
                <div className="absolute top-28 left-0 right-0 flex justify-center z-50 pointer-events-none">
                    <div className={`px-6 py-2 rounded-full shadow-lg text-white font-bold animate-bounce ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                        {toast.message}
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                {localStorage.getItem('editingOrderId') && (
                    <div className="bg-primary-50 border-2 border-primary-200 p-4 rounded-xl mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <div>
                                <p className="font-bold text-primary-900">Je bent een bestaande bestelling aan het aanpassen</p>
                                <p className="text-primary-700 text-sm">Zodra je op 'Bestelling aanpassen' klikt, wordt je oude bestelling overschreven.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                localStorage.removeItem('editingOrderId');
                                router.push('/my-orders');
                            }}
                            className="text-primary-600 hover:text-primary-800 font-bold text-sm underline"
                        >
                            Bestelling behouden & stoppen
                        </button>
                    </div>
                )}

                {cartItems.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4 text-gray-300">
                            <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Je winkelmandje is leeg
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Voeg broodjes toe om te beginnen met bestellen
                        </p>
                        <button
                            onClick={() => router.push('/')}
                            className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg shadow-md transition-all"
                        >
                            Bekijk assortiment
                        </button>
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                Je broodjes ({cartItems.length})
                            </h2>
                            {cartItems.map((item) => (
                                <CartItem
                                    key={item.id}
                                    item={item}
                                    onUpdateQuantity={handleUpdateQuantity}
                                    onUpdateComment={handleUpdateComment}
                                    onRemove={handleRemove}
                                />
                            ))}
                        </div>

                        {/* Order Form */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">
                                    Bestelling plaatsen
                                </h2>

                                <form onSubmit={handleSubmitOrder} className="space-y-4">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Naam *
                                        </label>
                                        <input
                                            type="text"
                                            value={personName}
                                            onChange={(e) => setPersonName(e.target.value)}
                                            required
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            placeholder="Je naam"
                                        />
                                    </div>

                                    {/* Department */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Afdeling (optioneel)
                                        </label>
                                        <input
                                            type="text"
                                            value={department}
                                            onChange={(e) => setDepartment(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            placeholder="Bijv: Engineering"
                                        />
                                    </div>

                                    {/* Total */}
                                    {total > 0 && (
                                        <div className="pt-4 border-t border-gray-200">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-medium text-gray-700">Totaal:</span>
                                                <span className="text-2xl font-bold text-primary-600">
                                                    € {total.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Error */}
                                    {error && (
                                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                            {error}
                                        </div>
                                    )}

                                    {/* Submit */}
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`w-full py-4 rounded-lg font-bold text-white shadow-lg transition-all ${isSubmitting
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-green-500 hover:bg-green-600 transform hover:-translate-y-0.5'
                                            }`}
                                    >
                                        {isSubmitting
                                            ? 'Bezig...'
                                            : typeof window !== 'undefined' && localStorage.getItem('editingOrderId')
                                                ? '✓ Bestelling aanpassen'
                                                : '✓ Bestelling plaatsen'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
