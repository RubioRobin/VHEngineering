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

export default function ArchiveDetailPage({ params }: { params: { id: string } }) {
    const [period, setPeriod] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [deleteAction, setDeleteAction] = useState<'archive' | 'order' | null>(null);
    const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
    const router = useRouter();
    const { showToast, showConfirm } = useToast();

    useEffect(() => {
        fetchArchiveDetail();
    }, []);

    const fetchArchiveDetail = async () => {
        try {
            const res = await fetch(`/api/archives/${params.id}`);
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
                            fetchArchiveDetail();
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
            <div className="space-y-2">
                <Link href="/archives" className="text-text-muted hover:text-primary flex items-center gap-2 text-sm transition-colors group w-fit mb-2">
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Terug naar archief
                </Link>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary">Bestellingen week {period.weekId.split('-')[1]}</h1>
                        <p className="text-text-muted">Overzicht van alle bestellingen geplaatst in deze ronde ({period.weekId})</p>
                    </div>
                    <button
                        onClick={handleDeleteArchive}
                        disabled={deleting}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all shadow-sm hover:shadow-md text-sm font-semibold disabled:opacity-50 self-start sm:self-center"
                    >
                        <Trash2 className="w-4 h-4" />
                        Verwijder archief
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DashboardCard className="p-5 flex items-center gap-4 bg-indigo-50/50 border-indigo-100 shadow-sm">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-50">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] text-indigo-400 uppercase font-black tracking-widest mb-0.5">Periode</p>
                        <p className="font-bold text-indigo-900 leading-tight">
                            {format(new Date(period.startDate), 'd MMM', { locale: nl })} - {format(new Date(period.endDate), 'd MMM', { locale: nl })}
                        </p>
                    </div>
                </DashboardCard>
                <DashboardCard className="p-5 flex items-center gap-4 bg-emerald-50/50 border-emerald-100 shadow-sm">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-50">
                        <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] text-emerald-400 uppercase font-black tracking-widest mb-0.5">Totaal Bestellingen</p>
                        <p className="font-bold text-emerald-900 leading-tight">{period.orders.length} personen</p>
                    </div>
                </DashboardCard>
                <DashboardCard className="p-5 flex items-center gap-4 bg-purple-50/50 border-purple-100 shadow-sm">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-purple-600 shadow-sm border border-purple-50">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] text-purple-400 uppercase font-black tracking-widest mb-0.5">Status</p>
                        <p className="font-bold text-purple-900 leading-tight">Gearchiveerd</p>
                    </div>
                </DashboardCard>
            </div>

            {/* Orders List */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Geplaatste Bestellingen
                </h2>

                <div className="grid grid-cols-1 gap-4">
                    {period.orders.map((order: any, index: number) => (
                        <motion.div
                            key={order.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                            <DashboardCard className="p-6 hover:shadow-lg transition-all border-gray-100 group">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-text-primary font-bold text-xl border border-gray-100 shadow-inner">
                                            {order.personName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-primary">{order.personName}</h3>
                                            <div className="flex items-center gap-2 text-xs text-text-muted font-medium bg-gray-50 px-2.5 py-1 rounded-full w-fit mt-1">
                                                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                                                <span>Besteld op {format(new Date(order.createdAt), 'EEEE d MMMM HH:mm', { locale: nl })}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 md:max-w-xl">
                                        <div className="bg-background/40 rounded-2xl p-4 border border-border/40">
                                            <div className="space-y-3">
                                                {order.orderItems.map((item: any) => (
                                                    <div key={item.id} className="flex justify-between items-start gap-4 pb-3 border-b border-border/20 last:border-0 last:pb-0">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-indigo-600">{item.quantity}x</span>
                                                                <span className="font-medium text-text-primary">{formatName(item.product.name)}</span>
                                                            </div>
                                                            {item.comment && (
                                                                <p className="text-xs text-accent-pink font-medium mt-1 ml-6 italic bg-pink-50/50 px-2 py-0.5 rounded-lg w-fit">
                                                                    &quot;{item.comment}&quot;
                                                                </p>
                                                            )}
                                                        </div>
                                                        <span className="text-sm font-bold text-indigo-500 whitespace-nowrap">
                                                            € {(item.product.price * item.quantity).toFixed(2)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>

                                            {order.generalComment && (
                                                <div className="mt-4 pt-4 border-t border-border/40">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <div className="h-4 w-1 bg-indigo-200 rounded-full"></div>
                                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Algemene Opmerking</p>
                                                    </div>
                                                    <p className="text-sm text-text-secondary italic font-medium pl-3">&quot;{order.generalComment}&quot;</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end justify-between self-stretch">
                                        <div className="text-right">
                                            <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-0.5">Totaal</p>
                                            <div className="bg-indigo-600 text-white px-4 py-1 rounded-xl shadow-lg shadow-indigo-200">
                                                <p className="text-xl font-black">
                                                    € {order.orderItems.reduce((acc: number, item: any) => acc + (item.product.price * item.quantity), 0).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-3">
                                            <button
                                                onClick={() => handleDeleteOrder(order.id)}
                                                className="p-2 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                title="Verwijder bestelling"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </DashboardCard>
                        </motion.div>
                    ))}

                    {period.orders.length === 0 && (
                        <div className="p-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center gap-4">
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
                                <ShoppingBag className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-500 italic">Geen bestellingen gevonden</h3>
                                <p className="text-sm text-gray-400 max-w-xs mx-auto mt-1">Er zijn voor deze periode geen bestellingen in de database opgeslagen.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

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

