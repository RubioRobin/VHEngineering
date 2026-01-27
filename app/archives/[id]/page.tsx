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
            <div className="space-y-4">
                <Link href="/archives" className="text-text-muted hover:text-primary flex items-center gap-2 text-sm transition-all group w-fit">
                    <div className="p-1.5 bg-gray-50 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                    </div>
                    <span className="font-medium">Terug naar overzicht</span>
                </Link>

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-4xl font-black text-text-primary tracking-tight">Week {period.weekId.split('-')[1]}</h1>
                            {!period.isClosed ? (
                                <div className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider animate-pulse shadow-lg shadow-emerald-200">
                                    Lopend
                                </div>
                            ) : (
                                <div className="bg-gray-100 text-gray-400 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider border border-gray-200">
                                    Gearchiveerd
                                </div>
                            )}
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
                <DashboardCard className="p-6 flex items-center gap-5 bg-gradient-to-br from-white to-gray-50/50 border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
                        <Calendar className="w-24 h-24" />
                    </div>
                    <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center text-primary shadow-inner border border-primary/10">
                        <Calendar className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-[10px] text-primary/60 uppercase font-black tracking-widest mb-1 items-center flex gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40" /> Periode
                        </p>
                        <p className="text-xl font-black text-text-primary leading-tight">
                            {format(new Date(period.startDate), 'd MMM', { locale: nl })} - {format(new Date(period.endDate), 'd MMM yyyy', { locale: nl })}
                        </p>
                    </div>
                </DashboardCard>

                <DashboardCard className="p-6 flex items-center gap-5 bg-gradient-to-br from-white to-gray-50/50 border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
                        <ShoppingBag className="w-24 h-24" />
                    </div>
                    <div className="w-14 h-14 bg-emerald-500/5 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner border border-emerald-500/10">
                        <ShoppingBag className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-[10px] text-emerald-500/60 uppercase font-black tracking-widest mb-1 items-center flex gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" /> Totaal
                        </p>
                        <p className="text-xl font-black text-text-primary leading-tight">
                            {period.orders.length} <span className="text-text-muted font-bold text-sm">personen</span>
                        </p>
                    </div>
                </DashboardCard>

                <DashboardCard className="p-6 flex items-center gap-5 bg-gradient-to-br from-white to-gray-50/50 border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
                        <Clock className="w-24 h-24" />
                    </div>
                    <div className="w-14 h-14 bg-amber-500/5 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner border border-amber-500/10">
                        <Clock className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-[10px] text-amber-500/60 uppercase font-black tracking-widest mb-1 items-center flex gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500/40" /> Status
                        </p>
                        <div className="flex items-center gap-2">
                            <p className={`text-xl font-black leading-tight ${!period.isClosed ? 'text-emerald-600' : 'text-text-muted'}`}>
                                {!period.isClosed ? 'Lopend' : 'Gearchiveerd'}
                            </p>
                            {!period.isClosed && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />}
                        </div>
                    </div>
                </DashboardCard>
            </div>

            {/* Orders List */}
            <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <h2 className="text-2xl font-black text-text-primary flex items-center gap-3">
                        <div className="w-2 h-8 bg-primary rounded-full" />
                        Geplaatste Bestellingen
                    </h2>
                    <div className="text-xs font-bold text-text-muted bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                        {period.orders.length} {period.orders.length === 1 ? 'bestelling' : 'bestellingen'}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {period.orders.map((order: any, index: number) => (
                        <motion.div
                            key={order.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                        >
                            <DashboardCard className="p-0 overflow-hidden hover:shadow-xl transition-all border-gray-100 group rounded-[2.5rem]">
                                <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
                                    {/* User Info Section */}
                                    <div className="p-8 lg:w-72 bg-gray-50/50 flex flex-col justify-center items-center lg:items-start text-center lg:text-left gap-4">
                                        <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center text-primary font-black text-3xl shadow-sm border border-gray-100 group-hover:scale-105 transition-transform duration-500">
                                            {order.personName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-2xl text-text-primary tracking-tight">{order.personName}</h3>
                                            <div className="flex items-center gap-2 text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">
                                                <Clock className="w-3 h-3" />
                                                <span>{format(new Date(order.createdAt), 'EEEE HH:mm', { locale: nl })}</span>
                                            </div>
                                        </div>
                                        {/* Row Delete Button (for admin) */}
                                        <button
                                            onClick={() => handleDeleteOrder(order.id)}
                                            className="mt-2 p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                                            title="Verwijder bestelling"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Items Section */}
                                    <div className="flex-1 p-8 bg-white">
                                        <div className="space-y-4">
                                            {order.orderItems.map((item: any) => (
                                                <div key={item.id} className="flex justify-between items-center group/item hover:bg-gray-50/80 p-3 -m-3 rounded-2xl transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary text-sm font-black">
                                                            {item.quantity}x
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-text-primary lg:text-lg">{formatName(item.product.name)}</span>
                                                            {item.comment && (
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <div className="w-1 h-3 bg-amber-400 rounded-full" />
                                                                    <p className="text-xs text-amber-600 font-bold italic">{item.comment}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className="font-black text-text-primary">
                                                        € {(item.product.price * item.quantity).toFixed(2)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {order.generalComment && (
                                            <div className="mt-8 pt-6 border-t border-dashed border-gray-200">
                                                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                                                    <div className="w-4 h-0.5 bg-primary/30 rounded-full" /> Algemene Opmerking
                                                </p>
                                                <p className="text-sm text-text-secondary italic font-medium bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                                    &quot;{order.generalComment}&quot;
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Total Section */}
                                    <div className="p-8 lg:w-48 bg-gray-50/30 flex flex-col justify-center items-center text-center gap-2">
                                        <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Totaalbedrag</p>
                                        <div className="bg-gradient-to-br from-primary to-primary-dark text-white px-6 py-2.5 rounded-[1.5rem] shadow-xl shadow-primary/20 transform group-hover:scale-110 transition-transform duration-500">
                                            <p className="text-2xl font-black">
                                                € {order.orderItems.reduce((acc: number, item: any) => acc + (item.product.price * item.quantity), 0).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </DashboardCard>
                        </motion.div>
                    ))}

                    {period.orders.length === 0 && (
                        <div className="py-32 text-center bg-gray-50/50 rounded-[3rem] border-4 border-dashed border-gray-100 flex flex-col items-center justify-center gap-6">
                            <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center text-gray-200 shadow-inner">
                                <ShoppingBag className="w-12 h-12" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-gray-400 italic">Geen bestellingen gevonden</h3>
                                <p className="text-gray-400 font-medium max-w-xs mx-auto mt-2">Deze ronde bevat op dit moment nog geen bestellingen.</p>
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

