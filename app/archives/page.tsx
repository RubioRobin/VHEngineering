'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { Trash2, Clock, Users, ArrowRight, FolderOpen, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useToast } from '@/components/providers/ToastProvider';
import { PasswordModal } from '@/components/modals/PasswordModal';

export default function ArchivesPage() {
    const [periods, setPeriods] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const { showToast, showConfirm } = useToast();

    useEffect(() => {
        fetchArchives();
    }, []);

    const fetchArchives = async () => {
        try {
            const res = await fetch('/api/archives', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setPeriods(data);
            }
        } catch (error) {
            console.error('Error fetching archives:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteArchive = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();

        setPendingDeleteId(id);
        setShowPasswordModal(true);
    };

    const confirmDeleteArchive = async (password: string) => {
        setShowPasswordModal(false);

        if (!pendingDeleteId) return;

        showConfirm({
            message: 'Weet je zeker dat je dit gehele archief wilt verwijderen?',
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/archives/${pendingDeleteId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${password}`
                        }
                    });

                    if (res.ok) {
                        showToast('Archief verwijderd', 'success');
                        fetchArchives();
                    } else {
                        const data = await res.json();
                        showToast(data.error || 'Er is een fout opgetreden.', 'error');
                    }
                } catch (error) {
                    showToast('Kon het archief niet verwijderen.', 'error');
                }
                setPendingDeleteId(null);
            }
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-8 px-6 py-8 max-w-[1800px] mx-auto"
        >
            <div className="flex items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Archief</h1>
                    <p className="text-text-muted">Bekijk bestellingen van voorgaande weken</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {periods.map((period, index) => (
                    <motion.div
                        key={period.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                        <Link href={`/archives/${period.id}`}>
                            <DashboardCard className="group hover:border-primary/50 transition-all cursor-pointer p-0 overflow-hidden relative border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1">
                                <div className="p-6 h-full flex flex-col">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="bg-primary/5 text-primary text-[10px] sm:text-xs font-black px-3 py-1.5 rounded-xl uppercase tracking-widest border border-primary/10">
                                            Week {period.weekId.split('-')[1]}
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={(e) => handleDeleteArchive(e, period.id)}
                                                className="p-2 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                title="Verwijder archief"
                                            >
                                                <Trash2 className="w-4.5 h-4.5" />
                                            </button>
                                            <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                                <ArrowRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 mb-6">
                                        <h3 className="text-xl font-black text-text-primary group-hover:text-primary transition-colors">
                                            Orderronde {period.weekId}
                                        </h3>
                                        <div className="h-1 w-12 bg-primary/20 rounded-full group-hover:w-20 transition-all"></div>
                                    </div>

                                    <div className="space-y-3 mt-auto pt-4 border-t border-gray-50">
                                        <div className="flex items-center gap-3 text-sm text-text-secondary font-medium">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                                                <Clock className="w-4 h-4" />
                                            </div>
                                            <span>
                                                {format(new Date(period.startDate), 'd MMM', { locale: nl })} - {format(new Date(period.endDate), 'd MMM yyyy', { locale: nl })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-text-muted font-medium">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
                                                <Users className="w-4 h-4" />
                                            </div>
                                            <span><b className="text-emerald-600 font-bold">{period._count.orders}</b> bestellingen geplaatst</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </DashboardCard>
                        </Link>
                    </motion.div>
                ))}

                {periods.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-background rounded-3xl border-2 border-dashed border-border">
                        <FolderOpen className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-medium text-text-secondary">Nog geen afgeronde rondes gevonden</h3>
                        <p className="text-text-muted max-w-sm mx-auto mt-2">
                            Zodra de eerste bestelronde is voltooid, verschijnt deze hier in het archief.
                        </p>
                    </div>
                )}
            </div>

            <PasswordModal
                isOpen={showPasswordModal}
                onClose={() => {
                    setShowPasswordModal(false);
                    setPendingDeleteId(null);
                }}
                onSubmit={confirmDeleteArchive}
                title="Archief verwijderen"
                description="Voer de admin code in om door te gaan"
            />
        </motion.div>
    );
}
