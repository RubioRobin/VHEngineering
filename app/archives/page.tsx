'use client';

import { useState, useEffect } from 'react';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { Trash2, Clock, Users, ArrowRight, FolderOpen } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useToast } from '@/components/providers/ToastProvider';

export default function ArchivesPage() {
    const [periods, setPeriods] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        fetchArchives();
    }, []);

    const fetchArchives = async () => {
        try {
            const res = await fetch('/api/archives');
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

        const code = prompt('Voer de admin code in om dit archief te verwijderen:');
        if (!code) return;

        if (!confirm('Weet je zeker dat je dit gehele archief wilt verwijderen?')) return;

        try {
            const res = await fetch(`/api/archives/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${code}`
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
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <FolderOpen className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Archief</h1>
                    <p className="text-text-muted">Bekijk bestellingen van voorgaande weken</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {periods.map((period) => (
                    <Link key={period.id} href={`/archives/${period.id}`}>
                        <DashboardCard className="group hover:border-primary/50 transition-all cursor-pointer p-6">
                            <div className="flex flex-col h-full">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-primary/5 text-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                        Week {period.weekId.split('-')[1]}
                                    </div>
                                    <div className="flex gap-2">
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

                                <h3 className="text-xl font-bold text-text-primary mb-2">
                                    Orderronde {period.weekId}
                                </h3>

                                <div className="space-y-2 mt-auto">
                                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                                        <Clock className="w-4 h-4" />
                                        <span>
                                            {format(new Date(period.startDate), 'd MMM', { locale: nl })} - {format(new Date(period.endDate), 'd MMM yyyy', { locale: nl })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                                        <Users className="w-4 h-4" />
                                        <span>{period._count.orders} bestellingen geplaatst</span>
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
        </div>
    );
}
