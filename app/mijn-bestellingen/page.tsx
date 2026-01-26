'use client';

import { useState, useEffect } from 'react';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { Trash2, User, RotateCcw } from 'lucide-react';
import { useUser } from '@/components/providers/UserProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { format } from 'date-fns';
import { formatName } from '@/lib/utils';
import { nl } from 'date-fns/locale';

export default function MijnBestellingenPage() {
    const [myOrders, setMyOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useUser();
    const { showToast, showConfirm } = useToast();
    const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (user) {
            fetchMyOrders();
        }
    }, [user]);

    const fetchMyOrders = async () => {
        if (!user) return;
        try {
            const res = await fetch(`/api/orders/user?userId=${user.id}`);
            if (res.ok) {
                const data = await res.json();
                setMyOrders(data.orders || []);
                // Auto-expand most recent week
                if (data.orders.length > 0) {
                    const firstWeek = data.orders[0].orderPeriod?.weekId;
                    if (firstWeek) setExpandedWeeks(new Set([firstWeek]));
                }
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteOrder = async (orderId: string) => {
        showConfirm({
            message: 'Weet je zeker dat je deze bestelling wilt verwijderen?',
            confirmText: 'Verwijderen',
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/orders/delete`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orderId, userId: user?.id })
                    });

                    if (res.ok) {
                        showToast('Bestelling verwijderd!', 'success');
                        fetchMyOrders();
                    } else {
                        showToast('Fout bij verwijderen', 'error');
                    }
                } catch (error) {
                    showToast('Netwerkfout', 'error');
                }
            }
        });
    };

    const handleReorder = (order: any) => {
        if (!order || !order.orderItems) return;

        const cart = JSON.parse(localStorage.getItem('cart') || '[]');

        order.orderItems.forEach((item: any) => {
            const existingItemIndex = cart.findIndex((cartItem: any) => cartItem.product.id === item.product.id);

            if (existingItemIndex !== -1) {
                cart[existingItemIndex].quantity += item.quantity;
            } else {
                cart.push({
                    id: `${Date.now()}-${Math.random()}`,
                    product: item.product,
                    quantity: item.quantity,
                    comment: item.comment || ''
                });
            }
        });

        localStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cart-updated'));

        showToast('Toegevoegd aan winkelmandje!', 'success');
    };

    const SHIPPING_COST = 1.95;

    const calculateTotal = (orderItems: any[], participantsCount: number = 1) => {
        const itemsTotal = orderItems.reduce((acc, item) => acc + (item.quantity * item.product.price), 0);
        return itemsTotal + (participantsCount > 0 ? SHIPPING_COST / participantsCount : 0);
    };

    const toggleWeek = (weekId: string) => {
        const newExpanded = new Set(expandedWeeks);
        if (newExpanded.has(weekId)) {
            newExpanded.delete(weekId);
        } else {
            newExpanded.add(weekId);
        }
        setExpandedWeeks(newExpanded);
    };

    // Group orders by week
    const ordersByWeek = myOrders.reduce((acc: any, order) => {
        const weekId = order.orderPeriod?.weekId || 'Onbekend';
        if (!acc[weekId]) acc[weekId] = [];
        acc[weekId].push(order);
        return acc;
    }, {});

    return (
        <div className="space-y-6 px-6 py-8 max-w-[1800px] mx-auto">
            <div className="pl-0">
                <h1 className="text-3xl font-bold text-text-primary">Mijn bestellingen</h1>
                <p className="text-text-muted mt-1 text-sm">Bestelgeschiedenis per week</p>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2].map((i) => (
                        <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : myOrders.length === 0 ? (
                <DashboardCard className="p-12">
                    <div className="text-center">
                        <User className="w-16 h-16 mx-auto text-text-muted mb-4" />
                        <p className="text-text-muted text-lg">Geen bestellingen gevonden</p>
                    </div>
                </DashboardCard>
            ) : (
                <div className="space-y-3">
                    {Object.entries(ordersByWeek).map(([weekId, weekOrders]: [string, any]) => {
                        const isExpanded = expandedWeeks.has(weekId);
                        const firstOrder = weekOrders[0];
                        const participantsCount = firstOrder?.orderPeriod?._count?.orders || 1;
                        const weekTotal = weekOrders.reduce((sum: number, order: any) =>
                            sum + calculateTotal(order.orderItems || [], participantsCount), 0
                        );

                        return (
                            <DashboardCard key={weekId} className="overflow-hidden hover:shadow-md transition-shadow">
                                {/* Week Header - Clickable */}
                                <button
                                    onClick={() => toggleWeek(weekId)}
                                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isExpanded
                                            ? 'bg-primary text-white'
                                            : 'bg-gray-100 text-text-muted group-hover:bg-gray-200'
                                            }`}>
                                            <svg
                                                className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                        <div className="text-left">
                                            <h3 className="font-bold text-lg text-text-primary group-hover:text-primary transition-colors">
                                                Week {weekId}
                                            </h3>
                                            <p className="text-sm text-text-muted">
                                                {weekOrders.length} bestelling{weekOrders.length !== 1 ? 'en' : ''} • {participantsCount} deelnemer{participantsCount !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-primary">€ {weekTotal.toFixed(2)}</p>
                                        <p className="text-xs text-text-muted">{isExpanded ? 'Verberg details' : 'Toon details'}</p>
                                    </div>
                                </button>

                                {/* Week Orders - Collapsible with Animation */}
                                {isExpanded && (
                                    <div className="border-t border-border bg-gray-50/30 pb-3">
                                        {weekOrders.map((order: any, idx: number) => {
                                            const shippingShare = SHIPPING_COST / participantsCount;
                                            return (
                                                <div
                                                    key={order.id}
                                                    className={`px-6 py-4 bg-white ${idx !== 0 ? 'mt-3' : 'mt-3'} mx-3 rounded-lg border border-border/50 hover:border-primary/30 transition-all shadow-sm`}
                                                >
                                                    {/* Order Header */}
                                                    <div className="flex flex-col md:flex-row md:items-start justify-between mb-3 gap-3">
                                                        <div className="flex-1">
                                                            <p className="text-sm font-semibold text-text-primary">
                                                                {format(new Date(order.createdAt), 'EEEE d MMMM, HH:mm', { locale: nl })}
                                                            </p>
                                                            <p className="text-xs text-text-muted mt-0.5">
                                                                Totaal inc. € {shippingShare.toFixed(2)} bezorgkosten
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2 w-full md:w-auto">
                                                            <button
                                                                onClick={() => handleReorder(order)}
                                                                className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all font-medium shadow-sm hover:shadow flex-1 md:flex-none"
                                                            >
                                                                <RotateCcw className="w-4 h-4" />
                                                                Opnieuw bestellen
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteOrder(order.id)}
                                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Verwijderen"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Order Items - Compact List */}
                                                    <div className="space-y-2">
                                                        {order.orderItems?.map((item: any) => (
                                                            <div key={item.id} className="flex justify-between items-center text-sm py-1">
                                                                <span className="text-text-secondary flex items-center gap-2">
                                                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-primary/10 text-primary text-xs font-bold">
                                                                        {item.quantity}
                                                                    </span>
                                                                    <span>{formatName(item.product.name)}</span>
                                                                </span>
                                                                <span className="text-text-primary font-semibold ml-4">
                                                                    € {(item.quantity * item.product.price).toFixed(2)}
                                                                </span>
                                                            </div>
                                                        ))}

                                                        {/* Shipping Share Item */}
                                                        <div className="flex justify-between items-center text-sm py-1 border-t border-dashed border-border/50 mt-1 pt-2 italic text-text-muted">
                                                            <span>Bezorgkosten (aandeel {participantsCount} pers.)</span>
                                                            <span className="font-medium">€ {shippingShare.toFixed(2)}</span>
                                                        </div>
                                                    </div>

                                                    {/* Total per Order - only if multiple orders in week */}
                                                    {weekOrders.length > 1 && (
                                                        <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
                                                            <span className="text-xs font-bold text-text-muted tracking-wider">Subtotaal</span>
                                                            <span className="text-base font-bold text-text-primary">
                                                                € {calculateTotal(order.orderItems || [], participantsCount).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Comment if exists */}
                                                    {order.generalComment && (
                                                        <div className="mt-3 pt-3 border-t border-border/50">
                                                            <p className="text-xs text-text-muted">
                                                                <span className="font-semibold">Opmerking:</span> {order.generalComment}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </DashboardCard>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
