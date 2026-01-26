'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { formatName } from '@/lib/utils';
import { useToast } from '@/components/providers/ToastProvider';
import { Loader2 } from 'lucide-react';

interface OrderItem {
    id: string;
    quantity: number;
    comment: string | null;
    product: {
        id: string;
        name: string;
        price: number | null;
        imageUrl: string | null;
    };
}

interface Order {
    id: string;
    personName: string;
    department: string | null;
    createdAt: string;
    orderPeriod: {
        weekId: string;
        deadline: string;
    };
    orderItems: OrderItem[];
}

export default function MyOrdersPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const token = localStorage.getItem('clientToken');

        if (!token) {
            setOrders([]);
            setLoading(false);
            return;
        }

        try {
            const [ordersRes, statusRes] = await Promise.all([
                fetch(`/api/orders/my-orders?token=${token}`),
                fetch('/api/status')
            ]);

            const ordersData = await ordersRes.json();
            const statusData = await statusRes.json();

            if (ordersRes.ok) setOrders(ordersData);
            if (statusRes.ok) setIsOpen(statusData.isOpen);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Kan je bestellingen niet ophalen');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async (orderId: string) => {
        const token = localStorage.getItem('clientToken');
        setCancellingId(orderId);
        try {
            const res = await fetch(`/api/orders/${orderId}?token=${token}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setOrders(orders.filter(o => o.id !== orderId));
                showToast("Bestelling succesvol geannuleerd.", "success");
            } else {
                const data = await res.json();
                console.error(data.error || 'Fout bij annuleren');
                showToast(data.error || "Fout bij annuleren van bestelling.", "error");
            }
        } catch (err) {
            console.error('Er is een fout opgetreden');
            showToast("Netwerkfout bij annuleren.", "error");
        } finally {
            setCancellingId(null);
        }
    };

    const handleEditOrder = (order: Order) => {
        const cartItems = order.orderItems.map(item => ({
            id: `${Date.now()}-${Math.random()}`,
            product: item.product,
            quantity: item.quantity,
            comment: item.comment || '',
        }));

        localStorage.setItem('cart', JSON.stringify(cartItems));
        // We'll also tell the cart page we are editing this order
        localStorage.setItem('editingOrderId', order.id);

        showToast("Bestelling ingeladen in winkelmandje.", "success");
        router.push('/');
    };

    const isOrderEditable = (order: Order) => {
        // Simplification: only allow editing if the global window is still open
        // and it's the current period.
        const deadline = new Date(order.orderPeriod.deadline);
        return isOpen && new Date() < deadline;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Laden...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm py-8 mb-8">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Mijn Bestellingen</h1>
                            <p className="text-gray-600 mt-1">Overzicht van je geplaatste bestellingen</p>
                        </div>
                        <button
                            onClick={() => router.push('/')}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                        >
                            ← Terug
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 pb-12">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8">
                        {error}
                    </div>
                )}

                {orders.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                        <div className="text-gray-300 mb-6">
                            <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Je hebt nog geen bestellingen</h2>
                        <p className="text-gray-600 mb-8 max-w-md mx-auto">
                            Zodra je een bestelling plaatst, verschijnt deze hier in het overzicht.
                        </p>
                        <button
                            onClick={() => router.push('/')}
                            className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary-200 transition-all transform hover:-translate-y-1"
                        >
                            Nu broodjes uitzoeken
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => {
                            const editable = isOrderEditable(order);
                            const total = order.orderItems.reduce((sum, item) => sum + (item.product.price || 0) * item.quantity, 0);

                            return (
                                <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="p-6 md:p-8 bg-gray-50/50 border-b border-gray-100">
                                        <div className="flex flex-col md:flex-row justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-sm font-bold uppercase tracking-wider text-gray-500">
                                                        Week {order.orderPeriod.weekId.split('-')[1]}
                                                    </span>
                                                    {!editable && (
                                                        <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-[10px] font-bold rounded uppercase">
                                                            Gesloten
                                                        </span>
                                                    )}
                                                    {editable && (
                                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase">
                                                            Aanpasbaar
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-900">
                                                    Besteld op {format(new Date(order.createdAt), 'd MMMM yyyy HH:mm', { locale: nl })}
                                                </h3>
                                            </div>
                                            <div className="flex flex-wrap gap-3 items-center">
                                                {editable && (
                                                    <>
                                                        <button
                                                            onClick={() => handleEditOrder(order)}
                                                            className="px-4 py-2 bg-primary-100 text-primary-700 hover:bg-primary-200 rounded-lg font-bold transition-colors text-sm"
                                                        >
                                                            Aanpassen
                                                        </button>
                                                        <button
                                                            onClick={() => handleCancelOrder(order.id)}
                                                            className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-bold transition-colors text-sm flex items-center gap-2"
                                                            disabled={cancellingId === order.id}
                                                        >
                                                            {cancellingId === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Annuleren'}
                                                        </button>
                                                    </>
                                                )}
                                                <div className="md:ml-4 text-right">
                                                    <p className="text-sm text-gray-500 font-medium">Totaalbedrag</p>
                                                    <p className="text-2xl font-black text-primary-600">€{total.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 md:p-8">
                                        <div className="space-y-4">
                                            {order.orderItems.map((item) => (
                                                <div key={item.id} className="flex items-center gap-4">
                                                    <div className="w-16 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                        {item.product.imageUrl && (
                                                            <img
                                                                src={item.product.imageUrl}
                                                                alt={item.product.name}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => (e.currentTarget.style.display = 'none')}
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="flex-grow">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-gray-900">{item.quantity}x</span>
                                                            <span className="font-medium text-gray-800">{formatName(item.product.name)}</span>
                                                        </div>
                                                        {item.comment && (
                                                            <p className="text-sm text-gray-500 mt-0.5 italic">Opmerking: {item.comment}</p>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-gray-900">€{((item.product.price || 0) * item.quantity).toFixed(2)}</p>
                                                        <p className="text-xs text-gray-400">€{item.product.price?.toFixed(2)} p.s.</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
