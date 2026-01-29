'use client';

import { useState, useEffect } from 'react';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { Trash2, Trash, Clock, User, ChevronLeft, Calendar, ShoppingBag, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useToast } from '@/components/providers/ToastProvider';
import { formatName } from '@/lib/utils';
import { PasswordModal } from '@/components/modals/PasswordModal';
import { motion } from 'framer-motion';
import { useOrders } from '@/components/providers/OrdersProvider';

export default function ArchiveDetailPage({ params }: { params: { id: string } }) {
    const [period, setPeriod] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [deleteAction, setDeleteAction] = useState<'archive' | 'order' | null>(null);
    const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
    const [deliveryCost, setDeliveryCost] = useState(1.95);
    const router = useRouter();
    const { showToast, showConfirm } = useToast();
    const { refreshOrders } = useOrders();

    useEffect(() => {
        fetchArchiveDetail();

        // Fetch current delivery cost
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.deliveryCost) setDeliveryCost(data.deliveryCost);
            })
            .catch(err => console.error('Failed to fetch settings:', err));
    }, []);

    const fetchArchiveDetail = async () => {
        try {
            const res = await fetch(`/api/archives/${params.id}`, {
                cache: 'no-store',
                headers: { 'Pragma': 'no-cache' }
            });
            if (res.ok) {
                const data = await res.json();
                setPeriod(data);
            }
        } catch (error) {
            console.error('Error fetching archive detail:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteArchive = async () => {
        setDeleteAction('archive');
        setShowPasswordModal(true);
    };

    const handleDeleteOrder = async (orderId: string) => {
        setPendingOrderId(orderId);
        setDeleteAction('order');
        setShowPasswordModal(true);
    };

    const confirmDelete = async (password: string) => {
        setShowPasswordModal(false);

        if (deleteAction === 'archive') {
            showConfirm({
                message: 'Weet je zeker dat je dit gehele archief wilt verwijderen? Dit kan niet ongedaan worden gemaakt.',
                onConfirm: async () => {
                    setDeleting(true);
                    try {
                        const res = await fetch(`/api/archives/${params.id}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${password}`
                            }
                        });

                        if (res.ok) {
                            showToast('Archief verwijderd', 'success');
                            router.push('/archives');
                        } else {
                            const data = await res.json();
                            showToast(data.error || 'Er is een fout opgetreden.', 'error');
                        }
                    } catch (error) {
                        showToast('Kon het archief niet verwijderen.', 'error');
                    } finally {
                        setDeleting(false);
                    }
                }
            });
        } else if (deleteAction === 'order' && pendingOrderId) {
            showConfirm({
                message: 'Weet je zeker dat je deze bestelling wilt verwijderen?',
                onConfirm: async () => {
                    try {
                        const res = await fetch(`/api/orders/delete`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${password}`
                            },
                            body: JSON.stringify({ orderId: pendingOrderId })
                        });

                        if (res.ok) {
                            showToast('Bestelling verwijderd', 'success');
                            // Await both local and global refreshes to ensure state is clean
                            await Promise.all([
                                fetchArchiveDetail(),
                                refreshOrders()
                            ]);
                        } else {
                            const data = await res.json();
                            showToast(data.error || 'Er is een fout opgetreden.', 'error');
                        }
                    } catch (error) {
                        showToast('Kon de bestelling niet verwijderen.', 'error');
                    }
                    setPendingOrderId(null);
                }
            });
        }
        setDeleteAction(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    if (!period) {
        return (
            <div className="text-center py-20">
                <h1 className="text-2xl font-bold mb-4">Archief niet gevonden</h1>
                <Link href="/archives" className="text-primary hover:underline flex items-center justify-center gap-2">
                    <ChevronLeft className="w-4 h-4" /> Terug naar archief
                </Link>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-8 px-6 py-8 max-w-[1800px] mx-auto min-h-screen"
        >
            {/* Header */}
            <div className="space-y-4">
                <Link href="/archives" className="text-text-muted hover:text-primary flex items-center gap-2 text-sm transition-all group w-fit">
                    <div className="p-1.5 bg-gray-50 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                    </div>
                    <span className="font-medium">Terug naar overzicht</span>
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <div>
                        <div className="mb-2">
                            <h1 className="text-3xl font-bold text-text-primary">Week {period.weekId.split('-')[1]}</h1>
                        </div>
                        <p className="text-text-muted font-medium">Alle bestellingen van ronde <span className="text-text-primary font-bold">{period.weekId}</span></p>
                    </div>
                    <button
                        onClick={handleDeleteArchive}
                        disabled={deleting}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-400 hover:text-red-500 rounded-2xl hover:bg-red-50 transition-all border border-gray-100 hover:border-red-100 shadow-sm text-sm font-bold disabled:opacity-50 group"
                    >
                        <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Verwijder ronde
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DashboardCard className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xl font-bold">
                        {(period.orders.filter((o: any) => !o.notParticipating).length + (period.jesseParticipating ? 1 : 0))}
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
                        <p className="text-text-muted text-sm">Totale Waarde (inc. Jesse)</p>
                        <p className="text-xl font-bold text-text-primary">
                            € {(period.orders.filter((o: any) => !o.notParticipating).reduce((acc: number, order: any) => acc + order.orderItems.reduce((iAcc: number, item: any) => iAcc + (item.product.price * item.quantity), 0), 0) + (period.jesseParticipating ? 10.40 : 0)).toFixed(2)}
                        </p>
                    </div>
                </DashboardCard>

                <DashboardCard className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-600 font-bold">
                        €
                    </div>
                    <div>
                        <p className="text-text-muted text-sm">Bezorging p.p.</p>
                        <p className="text-xl font-bold text-text-primary">
                            € {(deliveryCost / (period.orders.filter((o: any) => !o.notParticipating).length + (period.jesseParticipating ? 1 : 0))).toFixed(2)}
                        </p>
                    </div>
                </DashboardCard>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-primary" />
                    Geplaatste Bestellingen
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Jesse Order Injection */}
                    {period.jesseParticipating && (
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
                                    <span className="text-xs text-indigo-400 font-medium italic">Automatisch</span>
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
                                        <span>€ {(deliveryCost / (period.orders.filter((o: any) => !o.notParticipating).length + (period.jesseParticipating ? 1 : 0))).toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="p-3 bg-indigo-50 border-t border-indigo-100 flex justify-end items-center text-sm font-semibold">
                                    <div className="text-right">
                                        <span className="text-indigo-600 mr-2">Totaal:</span>
                                        <span className="text-indigo-900 text-lg">€ {(10.40 + (deliveryCost / (period.orders.filter((o: any) => !o.notParticipating).length + (period.jesseParticipating ? 1 : 0)))).toFixed(2)}</span>
                                    </div>
                                </div>
                            </DashboardCard>
                        </motion.div>
                    )}

                    {period.orders.filter((o: any) => !o.notParticipating).map((order: any, index: number) => {
                        const participatingCount = period.orders.filter((o: any) => !o.notParticipating).length + (period.jesseParticipating ? 1 : 0);
                        const shippingPerPerson = deliveryCost / participatingCount;
                        return (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                                <DashboardCard className="p-0 overflow-hidden group">
                                    <div className="p-4 bg-background/50 border-b border-border flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                                {order.personName.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-semibold text-text-primary">{order.personName}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm text-text-muted">
                                                {format(new Date(order.createdAt), 'EEEE HH:mm', { locale: nl })}
                                            </span>
                                            <button
                                                onClick={() => handleDeleteOrder(order.id)}
                                                className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                title="Verwijder bestelling"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 space-y-3">
                                        {order.orderItems.map((item: any) => (
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
                                            <span className="text-primary text-lg">
                                                € {(order.orderItems.reduce((acc: number, item: any) => acc + (item.product.price * item.quantity), 0) + shippingPerPerson).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </DashboardCard>
                            </motion.div>
                        );
                    })}

                    {period.orders.filter((o: any) => !o.notParticipating).length === 0 && (
                        <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
                            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-500 italic">Geen bestellingen gevonden</h3>
                            <p className="text-gray-400 max-w-sm mx-auto mt-2">Deze ronde bevat op dit moment nog geen bestellingen.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Non-participants Section */}
            {period.orders.filter((o: any) => o.notParticipating).length > 0 && (
                <div className="space-y-4 pt-8 border-t border-border">
                    <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                        <span className="text-2xl">🚫</span> {period.orders.filter((o: any) => o.notParticipating).length} {period.orders.filter((o: any) => o.notParticipating).length === 1 ? 'Collega at' : 'Collega\'s aten'} niet mee
                    </h2>
                    <div className="flex flex-wrap gap-3">
                        {period.orders.filter((o: any) => o.notParticipating).map((order: any) => (
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

            <PasswordModal
                isOpen={showPasswordModal}
                onClose={() => {
                    setShowPasswordModal(false);
                    setDeleteAction(null);
                    setPendingOrderId(null);
                }}
                onSubmit={confirmDelete}
                title={deleteAction === 'archive' ? 'Archief verwijderen' : 'Bestelling verwijderen'}
                description="Voer de admin code in om door te gaan"
            />
        </motion.div>
    );
}

