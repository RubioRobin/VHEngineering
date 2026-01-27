'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { Trash2, Clock, Users, ArrowRight, FolderOpen, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useToast } from '@/components/providers/ToastProvider';
import { PasswordModal } from '@/components/modals/PasswordModal';

export default function ArchivesPage() {
    const [periods, setPeriods] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const router = useRouter();
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
                        router.refresh();
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
                    <Link key={period.id} href={`/archives/${period.id}`}>
                        <DashboardCard
                            className="group cursor-pointer"
                            initial={{ opacity: 0, y: 20, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{
                                duration: 0.4,
                                delay: index * 0.05,
                                ease: [0.23, 1, 0.32, 1] // Custom cubic-bezier for smoother feel
                            }}
                        >
                            <div className="flex flex-col h-full">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="bg-primary/5 text-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                        Week {period.weekId.split('-')[1]}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={(e) => handleDeleteArchive(e, period.id)}
                                            className="p-1.5 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Verwijder archief"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <ArrowRight className="w-5 h-5 text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-text-primary mb-4">
                                    Orderronde {period.weekId}
                                </h3>

                                <div className="space-y-2 mt-auto pt-4 border-t border-border/50">
                                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                                        <Clock className="w-4 h-4 text-primary/60" />
                                        <span>
                                            {format(new Date(period.startDate), 'd MMM', { locale: nl })} - {format(new Date(period.endDate), 'd MMM yyyy', { locale: nl })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                                        <Users className="w-4 h-4 text-primary/60" />
                                        <span><span className="font-bold">{period._count.orders}</span> bestellingen geplaatst</span>
                                    </div>
                                </div>
                            </div>
                        </DashboardCard>
                    </Link>
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
