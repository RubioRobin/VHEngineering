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
            <div className="flex items-center justify-center min-h-[400px]">
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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Link href="/archives" className="text-text-muted hover:text-primary flex items-center gap-2 text-sm transition-colors group w-fit">
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Terug naar archief
                </Link>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary">Bestellingen week {period.weekId.split('-')[1]}</h1>
                        <p className="text-text-muted">Overzicht van alle bestellingen geplaatst in deze ronde ({period.weekId})</p>
                    </div>
                    <button
                        onClick={handleDeleteArchive}
                        disabled={deleting}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-sm font-semibold disabled:opacity-50"
                    >
                        <Trash2 className="w-4 h-4" />
                        Verwijder archief
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DashboardCard className="p-4 flex items-center gap-4 bg-primary/5 border-none">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-text-muted uppercase font-bold tracking-wider">Periode</p>
                        <p className="font-semibold text-text-primary">
                            {format(new Date(period.startDate), 'd MMM', { locale: nl })} - {format(new Date(period.endDate), 'd MMM', { locale: nl })}
                        </p>
                    </div>
                </DashboardCard>
                <DashboardCard className="p-4 flex items-center gap-4 bg-primary/5 border-none">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-text-muted uppercase font-bold tracking-wider">Totaal Bestellingen</p>
                        <p className="font-semibold text-text-primary">{period.orders.length} personen</p>
                    </div>
                </DashboardCard>
                <DashboardCard className="p-4 flex items-center gap-4 bg-primary/5 border-none">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-text-muted uppercase font-bold tracking-wider">Status</p>
                        <p className="font-semibold text-text-primary">Gesloten & Gearchiveerd</p>
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
                    {period.orders.map((order: any) => (
                        <DashboardCard key={order.id} className="p-6">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-text-primary font-bold text-xl">
                                        {order.personName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-primary">{order.personName}</h3>
                                        <div className="flex items-center gap-2 text-sm text-text-muted">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>Besteld op {format(new Date(order.createdAt), 'EEEE d MMMM HH:mm', { locale: nl })}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 md:max-w-xl">
                                    <div className="bg-background/50 rounded-2xl p-4 border border-border/50">
                                        <div className="space-y-3">
                                            {order.orderItems.map((item: any) => (
                                                <div key={item.id} className="flex justify-between items-start gap-4 pb-3 border-b border-border/30 last:border-0 last:pb-0">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-text-primary">{item.quantity}x</span>
                                                            <span className="font-medium text-text-primary">{formatName(item.product.name)}</span>
                                                        </div>
                                                        {item.comment && (
                                                            <p className="text-xs text-accent-pink font-medium mt-1 ml-6 italic">
                                                                &quot;{item.comment}&quot;
                                                            </p>
                                                        )}
                                                    </div>
                                                    <span className="text-sm font-semibold text-text-secondary whitespace-nowrap">
                                                        € {(item.product.price * item.quantity).toFixed(2)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {order.generalComment && (
                                            <div className="mt-4 pt-4 border-t border-border/50">
                                                <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Opmerking</p>
                                                <p className="text-sm text-text-secondary italic">&quot;{order.generalComment}&quot;</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col items-end justify-between self-stretch">
                                    <div className="text-right">
                                        <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Totaal</p>
                                        <p className="text-2xl font-bold text-text-primary">
                                            € {order.orderItems.reduce((acc: number, item: any) => acc + (item.product.price * item.quantity), 0).toFixed(2)}
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-end gap-3">

                                        <button
                                            onClick={() => handleDeleteOrder(order.id)}
                                            className="p-2 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
                                            title="Verwijder bestelling"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </DashboardCard>
                    ))}

                    {period.orders.length === 0 && (
                        <div className="p-12 text-center bg-white rounded-3xl border border-border italic text-text-muted">
                            Geen bestellingen gevonden voor deze periode.
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
        </div>
    );
}
