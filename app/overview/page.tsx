'use client';

import { useEffect, useState } from 'react';

import { motion } from 'framer-motion';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { DashboardButton } from '@/components/ui/DashboardButton';
import { Download, Loader2, User, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useUser } from '@/components/providers/UserProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { formatName } from '@/lib/utils';
import { useOrders } from '@/components/providers/OrdersProvider';

interface OrderItem {
    id: string;
    quantity: number;
    comment: string | null;
    product: {
        name: string;
        price: number;
    };
}

interface Order {
    id: string;
    personName: string;
    generalComment: string | null;
    createdAt: string;
    orderItems: OrderItem[];
    notParticipating?: boolean;
    orderPeriod?: {
        jesseParticipating: boolean;
    };
}

const FALLBACK_SHIPPING_COST = 1.95;

export default function OverviewPage() {
    const { weekOrders: orders, currentPeriod, isWeekLoading: loading, fetchWeekOrders } = useOrders();
    const { user } = useUser();
    const { showToast } = useToast();

    const [isExporting, setIsExporting] = useState(false);

    const [deliveryCost, setDeliveryCost] = useState(FALLBACK_SHIPPING_COST);

    useEffect(() => {
        // Trigger fetch if not already loaded (handled by provider)
        fetchWeekOrders();

        // Fetch current delivery cost
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.deliveryCost) setDeliveryCost(data.deliveryCost);
            })
            .catch(err => console.error('Failed to fetch settings:', err));
    }, [fetchWeekOrders]);




    const getTop5Products = () => {
        const productCounts: Record<string, { name: string; count: number; price: number }> = {};

        const participatingOrders = orders.filter((o: Order) => !o.notParticipating);

        participatingOrders.forEach((order: Order) => {
            order.orderItems.forEach((item: OrderItem) => {
                const key = item.product.name;
                if (!productCounts[key]) {
                    productCounts[key] = { name: item.product.name, count: 0, price: item.product.price };
                }
                productCounts[key].count += item.quantity;
            });
        });

        // Add Jesse's fixed order if active
        if (currentPeriod?.jesseParticipating) {
            const jesseItems = [
                { name: 'Pistolet kip-kerrie', price: 5.00 },
                { name: 'Milano chili-kip speciaal', price: 5.40 }
            ];
            jesseItems.forEach(item => {
                if (!productCounts[item.name]) {
                    productCounts[item.name] = { name: item.name, count: 0, price: item.price };
                }
                productCounts[item.name].count += 1;
            });
        }

        return Object.values(productCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    };

    const jesseParticipating = currentPeriod?.jesseParticipating || false;
    const participatingOrders = orders.filter((o: Order) => !o.notParticipating);
    const nonParticipatingOrders = orders.filter((o: Order) => o.notParticipating);
    const participantsCount = participatingOrders.length + (jesseParticipating ? 1 : 0);
    const shippingPerPerson = participantsCount > 0 ? deliveryCost / participantsCount : 0;

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const response = await fetch('/api/orders/export');

            if (!response.ok) {
                throw new Error('Export failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bestellingen-${format(new Date(), 'dd-MM-yyyy')}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            showToast('Export succesvol', 'success');
        } catch (error) {
            console.error('Export error:', error);
            showToast('Er ging iets mis bij het exporteren', 'error');
        } finally {
            setIsExporting(false);
        }
    };

    const calculateTotal = (orderItems: any[]) => {
        return orderItems.reduce((acc, item) => acc + (item.quantity * item.product.price), 0);
    };

    const totalProductRevenue = participatingOrders.reduce((acc, order) => acc + calculateTotal(order.orderItems), 0) + (jesseParticipating ? 10.40 : 0);
    const totalWithShipping = totalProductRevenue + (participantsCount > 0 ? deliveryCost : 0);

    if (loading) {
        return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-8 px-6 py-8 max-w-[2400px] mx-auto transition-all duration-300">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Week overzicht</h1>
                    <p className="text-text-secondary">Alle bestellingen voor deze week</p>
                </div>
                <DashboardButton onClick={handleExport} isLoading={isExporting} icon={<Download className="w-4 h-4" />}>
                    Export naar Excel
                </DashboardButton>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DashboardCard className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xl font-bold">
                        {participantsCount}
                    </div>
                    <div>
                        <p className="text-text-muted text-sm">Bestellingen</p>
                        <p className="text-xl font-bold text-text-primary">Deelnemers</p>
                    </div>
                </DashboardCard>
                <DashboardCard className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center text-green-600 text-xl font-bold">
                        €
                    </div>
                    <div>
                        <p className="text-text-muted text-sm">Totale Waarde (inc. bezorging)</p>
                        <p className="text-xl font-bold text-text-primary">€ {totalWithShipping.toFixed(2)}</p>
                    </div>
                </DashboardCard>
                <DashboardCard className="p-6 flex items-center gap-4 bg-orange-50/50 border-orange-100">
                    <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-600 font-bold">
                        {deliveryCost.toFixed(2)}
                    </div>
                    <div>
                        <p className="text-text-muted text-sm">Bezorging p.p.</p>
                        <p className="text-xl font-bold text-text-primary">€ {shippingPerPerson.toFixed(2)}</p>
                    </div>
                </DashboardCard>
            </div>

            {/* Top 5 Most Ordered */}
            <DashboardCard className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                <h3 className="font-bold text-lg text-text-primary mb-4 flex items-center gap-2">
                    <span className="text-2xl">🏆</span> Top 5 Meest Besteld
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {getTop5Products().map((product, index) => (
                        <div key={product.name} className="bg-white rounded-xl p-4 text-center border border-border/50">
                            <div className="text-2xl font-bold text-primary mb-1">#{index + 1}</div>
                            <div className="text-sm font-medium text-text-primary mb-1 line-clamp-2 h-10">{formatName(product.name)}</div>
                            <div className="text-lg font-bold text-accent">{product.count}x</div>
                        </div>
                    ))}
                </div>
            </DashboardCard>

            {/* Orders List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Jesse Order Injection */}
                {jesseParticipating && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <DashboardCard className="p-0 overflow-hidden border-indigo-200 bg-indigo-50/20">
                            <div className="p-4 bg-indigo-50/50 border-b border-indigo-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                        J
                                    </div>
                                    <span className="font-semibold text-indigo-900 text-lg">Jesse</span>
                                    <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-bold uppercase tracking-wider">Vaste bestelling</span>
                                </div>
                                <span className="text-xs text-indigo-400 font-medium">Wekelijks</span>
                            </div>

                            <div className="p-4 space-y-3">
                                {[
                                    { name: 'Pistolet kip-kerrie', price: 5.00 },
                                    { name: 'Milano chili-kip speciaal', price: 5.40 }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-start text-sm">
                                        <div className="flex gap-2">
                                            <span className="font-bold w-6 text-center bg-indigo-100/50 rounded text-indigo-700">
                                                1x
                                            </span>
                                            <p className="text-indigo-900">{formatName(item.name)}</p>
                                        </div>
                                        <span className="text-indigo-700">€ {item.price.toFixed(2)}</span>
                                    </div>
                                ))}

                                <div className="flex justify-between items-center text-xs text-indigo-400 mt-2 pt-2 border-t border-dashed border-indigo-100">
                                    <span>Bezorgkosten (aandeel)</span>
                                    <span>€ {shippingPerPerson.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="p-3 bg-indigo-50 border-t border-indigo-100 flex justify-end items-center text-sm font-semibold">
                                <div className="text-right">
                                    <span className="text-indigo-600 mr-2">Totaal:</span>
                                    <span className="text-indigo-900 text-lg">€ {(10.40 + shippingPerPerson).toFixed(2)}</span>
                                </div>
                            </div>
                        </DashboardCard>
                    </motion.div>
                )}

                {participatingOrders.map((order: any) => (
                    <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <DashboardCard className="p-0 overflow-hidden">
                            <div className="p-4 bg-background/50 border-b border-border flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                        {order.personName.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-semibold text-text-primary">{order.personName}</span>
                                </div>
                                <span className="text-sm text-text-muted">
                                    {format(new Date(order.createdAt), 'EEEE HH:mm', { locale: nl })}
                                </span>
                            </div>

                            <div className="p-4 space-y-3">
                                {order.orderItems.map((item: OrderItem) => (
                                    <div key={item.id} className="flex justify-between items-start text-sm">
                                        <div className="flex gap-2">
                                            <span className="font-bold w-6 text-center bg-gray-100 rounded text-text-primary">
                                                {item.quantity}x
                                            </span>
                                            <div>
                                                <p className="text-text-primary">{formatName(item.product.name)}</p>
                                                {item.comment && (
                                                    <p className="text-xs text-orange-500 italic">Opmerking: {item.comment}</p>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-text-secondary">€ {(item.quantity * item.product.price).toFixed(2)}</span>
                                    </div>
                                ))}

                                <div className="flex justify-between items-center text-xs text-text-muted mt-2 pt-2 border-t border-dashed border-border">
                                    <span>Bezorgkosten (aandeel)</span>
                                    <span>€ {shippingPerPerson.toFixed(2)}</span>
                                </div>

                                {order.generalComment && (
                                    <div className="mt-4 pt-3 border-t border-dashed border-border text-xs">
                                        <span className="font-semibold text-text-secondary">Algemene opmerking:</span>
                                        <p className="text-text-primary italic">"{order.generalComment}"</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-3 bg-gray-50 border-t border-border flex justify-end items-center text-sm font-semibold">
                                <div className="text-right">
                                    <span className="text-text-secondary mr-2">Totaal:</span>
                                    <span className="text-primary text-lg">€ {(calculateTotal(order.orderItems) + shippingPerPerson).toFixed(2)}</span>
                                </div>
                            </div>
                        </DashboardCard>
                    </motion.div>
                ))}
            </div>

            {/* Non-participants Section */}
            {nonParticipatingOrders.length > 0 && (
                <div className="space-y-4 pt-8 border-t border-border">
                    <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                        <span className="text-2xl">🚫</span> {nonParticipatingOrders.length} {nonParticipatingOrders.length === 1 ? 'Collega eet' : 'Collega\'s eten'} niet mee
                    </h2>
                    <div className="flex flex-wrap gap-3">
                        {nonParticipatingOrders.map((order: any) => (
                            <div
                                key={order.id}
                                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-full flex items-center gap-2 group hover:bg-white hover:border-gray-300 transition-all shadow-sm"
                                title={`Afgemeld op ${format(new Date(order.createdAt), 'EEEE HH:mm', { locale: nl })}`}
                            >
                                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-[10px] font-bold group-hover:bg-gray-300 transition-colors">
                                    {order.personName.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-gray-700">{order.personName}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
