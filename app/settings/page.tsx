'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/components/providers/UserProvider';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { DashboardButton } from '@/components/ui/DashboardButton';
import { User, Shield, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/providers/ToastProvider';

export default function SettingsPage() {
    const { user, login, logout } = useUser();
    const { showToast } = useToast();
    const [newName, setNewName] = useState(user?.name || '');
    const [newDepartment, setNewDepartment] = useState((user as any)?.department || '');
    const [isEditing, setIsEditing] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (user) {
            setNewName(user.name);
            setNewDepartment((user as any)?.department || '');
        }
    }, [user]);

    const handleSaveProfile = async () => {
        if (newName.trim().length >= 2 && newDepartment) {
            await login(newName.trim(), newDepartment);
            setIsEditing(false);
            showToast("Profiel succesvol opgeslagen", "success");
        } else {
            showToast("Vul naam (min 2 tekens) en afdeling in", "error");
        }
    };

    const handleLogout = () => {
        if (confirm('Weet je zeker dat je wilt uitloggen?')) {
            logout();
            showToast("Je bent uitgelogd", "success");
            router.push('/');
        }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-text-primary">Instellingen</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile */}
                <DashboardCard className="p-0 flex flex-col justify-between overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-6">
                        {isEditing ? (
                            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-bold text-lg text-text-primary">Gegevens wijzigen</h3>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 block ml-1">Naam</label>
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-border rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium text-text-primary"
                                            placeholder="Jouw naam"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 block ml-1">Afdeling</label>
                                        <input
                                            type="text"
                                            value={newDepartment}
                                            onChange={(e) => setNewDepartment(e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-border rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium text-text-primary"
                                            placeholder="Jouw afdeling"
                                        />
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <DashboardButton onClick={handleSaveProfile} className="w-full rounded-xl py-3 ">Opslaan</DashboardButton>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-2xl font-bold text-primary shadow-sm ring-4 ring-primary/5">
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-text-primary tracking-tight leading-none mb-2">{user?.name}</h2>
                                        <span className="inline-flex px-2.5 py-0.5 bg-gray-100 border border-border/60 rounded-md text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                                            {(user as any)?.department || 'Geen afdeling'}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-5 py-2 text-sm font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-full transition-colors self-center"
                                >
                                    Wijzigen
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-border mt-auto bg-gray-50/30">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 text-red-600 hover:text-red-700 font-medium text-sm transition-colors opacity-80 hover:opacity-100"
                        >
                            <LogOut className="w-4 h-4" />
                            Uitloggen
                        </button>
                    </div>
                </DashboardCard>



                {/* Admin */}
                <DashboardCard className="p-6 border-primary/20 bg-primary/5 h-full flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                <Shield className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-text-primary">Beheer</h2>
                        </div>

                        <p className="text-text-secondary mb-4">
                            Toegang tot admin functies zoals week resetten en instellingen beheren.
                        </p>
                    </div>

                    <DashboardButton
                        onClick={() => router.push('/admin')}
                        className="w-full mt-4"
                    >
                        Open Admin Paneel
                    </DashboardButton>
                </DashboardCard>
            </div>
        </div>
    );
}
