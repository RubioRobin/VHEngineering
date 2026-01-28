'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { DashboardButton } from '@/components/ui/DashboardButton';
import { ProductManager } from '@/components/admin/ProductManager';
import { AdminLoginModal } from '@/components/admin/AdminLoginModal';
import { Clock, Mail, Trash2, Plus, Send, Edit3, Eye, RefreshCcw, Settings, AlertTriangle, Database, Calendar, ChevronUp, ChevronDown, Info, LogOut, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

export default function AdminPage() {
    // Auth State
    const [adminToken, setAdminToken] = useState<string | null>(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    // Session Timeout Logic
    useEffect(() => {
        let timeout: NodeJS.Timeout;
        const resetTimer = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                handleLogout();
                showToast('Automatisch uitgelogd wegens inactiviteit', 'info');
            }, 3600000); // 1 hour
        };

        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('keypress', resetTimer);
        resetTimer();

        return () => {
            clearTimeout(timeout);
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('keypress', resetTimer);
        };
    }, []);

    // Dashboard State
    const [currentDeadline, setCurrentDeadline] = useState<Date | null>(null);
    const [emailList, setEmailList] = useState<any[]>([]);
    const [newEmail, setNewEmail] = useState('');
    const [newName, setNewName] = useState('');
    // Loading States
    const [refreshing, setRefreshing] = useState(false);
    const [isResettingWeek, setIsResettingWeek] = useState(false);
    const [isSavingHeadline, setIsSavingHeadline] = useState(false);
    const [isAddingEmail, setIsAddingEmail] = useState(false);
    const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);
    const [deletingEmailId, setDeletingEmailId] = useState<string | null>(null);

    // Recurring settings (Initialize with CURRENT TIME)
    const [deadlinesSettings, setDeadlineSettings] = useState(() => {
        const now = new Date();
        const day = now.getDay();
        const adjustedDay = (day === 0 || day === 6) ? 1 : day;

        return {
            day: adjustedDay,
            hour: now.getHours(),
            minute: now.getMinutes()
        };
    });

    // Saved deadline settings (for display in subtitle)
    const [savedDeadlineSettings, setSavedDeadlineSettings] = useState({
        day: 4,
        hour: 14,
        minute: 0
    });

    // Email template states
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBodyText, setEmailBodyText] = useState('');
    const [emailBodyHtml, setEmailBodyHtml] = useState('');
    const [showHtmlEditor, setShowHtmlEditor] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const hourRef = useRef<HTMLDivElement>(null);
    const minuteRef = useRef<HTMLDivElement>(null);

    const { showToast, showConfirm } = useToast();

    // Check auth on mount
    useEffect(() => {
        const token = localStorage.getItem('vh_admin_token');
        if (token) {
            setAdminToken(token);
        }
        setIsCheckingAuth(false);
    }, []);

    // Initial scroll on mount and wheel listener
    useEffect(() => {
        if (!adminToken) return;

        const hEl = hourRef.current;
        const mEl = minuteRef.current;

        // Set initial positions
        if (hEl) hEl.scrollTop = deadlinesSettings.hour * 32;
        if (mEl) mEl.scrollTop = deadlinesSettings.minute * 32;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            const el = e.currentTarget as HTMLDivElement;
            const itemHeight = 32;
            const direction = e.deltaY > 0 ? 1 : -1;

            el.scrollBy({
                top: direction * itemHeight,
                behavior: 'smooth'
            });
        };

        if (hEl) hEl.addEventListener('wheel', handleWheel, { passive: false });
        if (mEl) mEl.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            if (hEl) hEl.removeEventListener('wheel', handleWheel);
            if (mEl) mEl.removeEventListener('wheel', handleWheel);
        };
    }, [adminToken]);

    useEffect(() => {
        if (adminToken) {
            fetchEmails();
            fetchEmailTemplate();
            fetchCurrentDeadline();
            fetchRecursiveSettings();
        }
    }, [adminToken]);

    const verifyLogin = async (code: string): Promise<boolean> => {
        try {
            // Verify by trying to fetch settings (which requires auth)
            const res = await fetch('/api/admin/settings', {
                headers: { 'Authorization': `Bearer ${code}` }
            });

            if (res.ok) {
                setAdminToken(code);
                localStorage.setItem('vh_admin_token', code);
                return true;
            }
        } catch (error) {
            console.error('Login verification error:', error);
        }
        return false;
    };

    const handleLogout = () => {
        setAdminToken(null);
        localStorage.removeItem('vh_admin_token');
        showToast('Uitgelogd', 'info');
    };

    const fetchRecursiveSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings');
            if (res.ok) {
                const data = await res.json();
                setSavedDeadlineSettings({
                    day: data.dayValue ?? 4,
                    hour: data.hour ?? 14,
                    minute: data.minute ?? 0
                });
            }
        } catch (error) {
            console.error('Error fetching recursive settings:', error);
        }
    };

    const fetchEmails = async () => {
        try {
            const res = await fetch('/api/admin/emails');
            if (res.ok) {
                const data = await res.json();
                setEmailList(data.emails || []);
            }
        } catch (error) {
            console.error('Error fetching emails:', error);
        }
    };

    const fetchEmailTemplate = async () => {
        try {
            const res = await fetch('/api/admin/email-template');
            if (res.ok) {
                const data = await res.json();
                const template = data.template;
                setEmailSubject(template.subject || '');
                setEmailBodyText(template.bodyText || '');
                setEmailBodyHtml(template.bodyHtml || '');
            }
        } catch (error) {
            console.error('Error fetching template:', error);
        }
    };

    const fetchCurrentDeadline = async () => {
        try {
            const res = await fetch('/api/deadline');
            if (res.ok) {
                const data = await res.json();
                setCurrentDeadline(new Date(data.deadline));
            }
        } catch (error) {
            console.error('Error fetching deadline:', error);
        }
    };

    const handleSaveTemplate = async () => {
        if (!emailSubject || !emailBodyText) {
            showToast('Subject en tekst zijn verplicht!', 'warning');
            return;
        }

        setIsSavingTemplate(true);
        try {
            const res = await fetch('/api/admin/email-template', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify({
                    subject: emailSubject,
                    bodyText: emailBodyText,
                    bodyHtml: emailBodyHtml || emailBodyText
                })
            });

            if (res.ok) {
                showToast('Email template opgeslagen!', 'success');
            } else {
                if (res.status === 401) handleLogout();
                showToast('Fout bij opslaan template', 'error');
            }
        } catch (error) {
            showToast('Netwerkfout', 'error');
        } finally {
            setIsSavingTemplate(false);
        }
    };

    const handleAddEmail = async () => {
        if (!newEmail) {
            showToast('Vul een email adres in!', 'warning');
            return;
        }

        setIsAddingEmail(true);
        try {
            const res = await fetch('/api/admin/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify({ email: newEmail, name: newName })
            });

            if (res.ok) {
                showToast('Email toegevoegd!', 'success');
                setNewEmail('');
                setNewName('');
                fetchEmails();
            } else {
                if (res.status === 401) handleLogout();
                const data = await res.json();
                showToast(data.error || 'Fout bij toevoegen email', 'error');
            }
        } catch (error) {
            showToast('Netwerkfout', 'error');
        } finally {
            setIsAddingEmail(false);
        }
    };

    const handleDeleteEmail = async (id: string) => {
        showConfirm({
            message: 'Email verwijderen uit de lijst?',
            onConfirm: async () => {
                setDeletingEmailId(id);
                try {
                    const res = await fetch('/api/admin/emails', {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${adminToken}`
                        },
                        body: JSON.stringify({ id })
                    });

                    if (res.ok) {
                        showToast('Email verwijderd!', 'success');
                        fetchEmails();
                    } else {
                        if (res.status === 401) handleLogout();
                        showToast('Fout bij verwijderen', 'error');
                    }
                } catch (error) {
                    showToast('Netwerkfout', 'error');
                } finally {
                    setDeletingEmailId(null);
                }
            }
        });
    };

    const handleRefreshAssortment = async () => {
        if (!adminToken) return;

        setRefreshing(true);
        try {
            const res = await fetch('/api/admin/refresh-products', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            });

            if (res.ok) {
                showToast('Assortiment succesvol vernieuwd!', 'success');
            } else {
                if (res.status === 401) handleLogout();
                const data = await res.json();
                showToast(data.error || 'Fout bij vernieuwen', 'error');
            }
        } catch (error) {
            showToast('Netwerkfout', 'error');
        } finally {
            setRefreshing(false);
        }
    };

    const handleSaveRecurrentDeadline = async () => {
        if (!adminToken) return;

        setIsSavingHeadline(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify(deadlinesSettings)
            });

            if (res.ok) {
                setSavedDeadlineSettings({ ...deadlinesSettings });
                showToast('Wekelijkse deadline opgeslagen!', 'success');
            } else {
                if (res.status === 401) handleLogout();
                const data = await res.json();
                showToast(data.error || 'Fout bij opslaan', 'error');
            }
        } catch (error) {
            showToast('Netwerkfout', 'error');
        } finally {
            setIsSavingHeadline(false);
        }
    };

    const handleResetWeek = async () => {
        if (!adminToken) return;

        if (!confirm('Weet je zeker dat je alle bestellingen van deze week wilt wissen?')) return;

        try {
            const res = await fetch('/api/admin/reset', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            });

            if (res.ok) {
                showToast('Week succesvol gereset!', 'success');
                fetchCurrentDeadline();
            } else {
                if (res.status === 401) handleLogout();
                const data = await res.json();
                showToast(data.error || 'Fout bij resetten', 'error');
            }
        } catch (error) {
            showToast('Netwerkfout', 'error');
        }
    };

    const handleSendTestEmail = async () => {
        setIsSendingTestEmail(true);
        try {
            const res = await fetch('/api/admin/test-email', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            const data = await res.json();

            if (res.ok) {
                showToast((data.message || 'Test emails verzonden!') + ' (Let op: kan soms even duren)', 'success');
            } else {
                if (res.status === 401) handleLogout();
                console.error('Test email failed:', data);
                showToast(`Fout: ${data.error || 'Kon geen email versturen'}`, 'error');
            }
        } catch (error) {
            console.error('Network error sending test email:', error);
            showToast('Netwerkfout bij versturen', 'error');
        } finally {
            setIsSendingTestEmail(false);
        }
    };

    if (isCheckingAuth) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (!adminToken) {
        return <AdminLoginModal onLogin={verifyLogin} />;
    }

    return (
        <div className="space-y-8 px-6 py-8 max-w-[2400px] mx-auto transition-all duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Admin beheer</h1>
                    <p className="text-text-muted mt-2">Beheer deadline en email notificaties</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all shadow-sm self-start sm:self-center"
                >
                    <LogOut className="w-4 h-4" />
                    Uitloggen
                </button>
            </div>

            {/* Top Row: 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Recurrent Deadline Settings */}
                <DashboardCard className="p-6 border-emerald-100 bg-emerald-50/50 flex flex-col justify-between overflow-visible">
                    <div>
                        <div className="mb-4 text-emerald-600">
                            <div className="flex items-center gap-4 mb-1">
                                <Settings className="w-8 h-8" />
                                <h2 className="text-xl font-bold">Wekelijkse deadline</h2>
                            </div>
                            <p className="text-sm text-emerald-600/70 ml-12 tabular-nums">
                                Huidige instelling: {['', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag'][savedDeadlineSettings.day]} om {savedDeadlineSettings.hour.toString().padStart(2, '0')}:{savedDeadlineSettings.minute.toString().padStart(2, '0')}
                            </p>
                        </div>
                        <div className="flex gap-3 mb-4">
                            {/* Day Selector */}
                            <div className="flex-1">
                                <label className="text-[10px] uppercase font-bold text-text-muted mb-1 ml-1 block">Dag</label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const dropdown = document.getElementById('day-dropdown');
                                            if (dropdown) {
                                                dropdown.classList.toggle('hidden');
                                            }
                                        }}
                                        className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm font-medium text-gray-700 hover:border-emerald-300 transition-colors cursor-pointer text-left flex items-center justify-between"
                                    >
                                        <span>{['', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag'][deadlinesSettings.day]}</span>
                                        <ChevronDown className="w-4 h-4 text-emerald-600" />
                                    </button>
                                    <div
                                        id="day-dropdown"
                                        className="hidden absolute z-30 w-full mt-1 bg-white border border-emerald-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                                    >
                                        {[
                                            { value: 1, label: 'Maandag' },
                                            { value: 2, label: 'Dinsdag' },
                                            { value: 3, label: 'Woensdag' },
                                            { value: 4, label: 'Donderdag' },
                                            { value: 5, label: 'Vrijdag' }
                                        ].map((day) => (
                                            <button
                                                key={day.value}
                                                type="button"
                                                onClick={() => {
                                                    setDeadlineSettings({ ...deadlinesSettings, day: day.value });
                                                    const dropdown = document.getElementById('day-dropdown');
                                                    if (dropdown) dropdown.classList.add('hidden');
                                                }}
                                                className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors ${deadlinesSettings.day === day.value
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'text-gray-700 hover:bg-emerald-50'
                                                    }`}
                                            >
                                                {day.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Time Picker */}
                            <div className="flex-1">
                                <label className="text-[10px] uppercase font-bold text-text-muted mb-1 ml-1 block">Tijd</label>
                                <div className="bg-white rounded-lg p-2 border border-emerald-200">
                                    <div className="flex items-center justify-center gap-2">
                                        {/* Hour Scroll */}
                                        <div className="relative group">
                                            <div
                                                ref={hourRef}
                                                onScroll={(e) => {
                                                    const el = e.currentTarget;
                                                    const itemHeight = 32;
                                                    const index = Math.round(el.scrollTop / itemHeight);
                                                    if (index !== deadlinesSettings.hour && index >= 0 && index < 24) {
                                                        setDeadlineSettings(prev => ({ ...prev, hour: index }));
                                                    }
                                                }}
                                                className="h-16 w-14 overflow-y-scroll snap-y snap-mandatory cursor-grab active:cursor-grabbing remove-scrollbar"
                                            >
                                                <div className="flex flex-col items-center py-[16px]">
                                                    {Array.from({ length: 24 }, (_, i) => (
                                                        <button
                                                            key={i}
                                                            className={`w-full h-8 flex items-center justify-center shrink-0 snap-center transition-all ${deadlinesSettings.hour === i
                                                                ? 'text-emerald-700 font-bold text-lg'
                                                                : 'text-gray-400 text-sm hover:text-emerald-500'
                                                                }`}
                                                            onClick={(e) => {
                                                                e.currentTarget.scrollIntoView({ block: 'center', behavior: 'smooth' });
                                                            }}
                                                        >
                                                            <span className="tabular-nums pointer-events-none">
                                                                {i.toString().padStart(2, '0')}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="absolute top-1/2 left-0 right-0 h-8 -translate-y-1/2 border-y border-emerald-300 pointer-events-none" />
                                        </div>

                                        <span className="text-base font-bold text-emerald-600 pb-1">:</span>

                                        {/* Minute Scroll */}
                                        <div className="relative group">
                                            <div
                                                ref={minuteRef}
                                                onScroll={(e) => {
                                                    const el = e.currentTarget;
                                                    const itemHeight = 32;
                                                    const index = Math.round(el.scrollTop / itemHeight);
                                                    if (index !== deadlinesSettings.minute && index >= 0 && index < 60) {
                                                        setDeadlineSettings(prev => ({ ...prev, minute: index }));
                                                    }
                                                }}
                                                className="h-16 w-14 overflow-y-scroll snap-y snap-mandatory cursor-grab active:cursor-grabbing remove-scrollbar"
                                            >
                                                <div className="flex flex-col items-center py-[16px]">
                                                    {Array.from({ length: 60 }, (_, i) => (
                                                        <button
                                                            key={i}
                                                            className={`w-full h-8 flex items-center justify-center shrink-0 snap-center transition-all ${deadlinesSettings.minute === i
                                                                ? 'text-emerald-700 font-bold text-lg'
                                                                : 'text-gray-400 text-sm hover:text-emerald-500'
                                                                }`}
                                                            onClick={(e) => {
                                                                e.currentTarget.scrollIntoView({ block: 'center', behavior: 'smooth' });
                                                            }}
                                                        >
                                                            <span className="tabular-nums pointer-events-none">
                                                                {i.toString().padStart(2, '0')}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="absolute top-1/2 left-0 right-0 h-8 -translate-y-1/2 border-y border-emerald-300 pointer-events-none" />
                                        </div>
                                    </div>
                                    <style jsx global>{`
                                        .remove-scrollbar::-webkit-scrollbar { display: none; }
                                        .remove-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                                    `}</style>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DashboardButton
                        onClick={handleSaveRecurrentDeadline}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 h-11"
                        isLoading={isSavingHeadline}
                    >
                        Opslaan
                    </DashboardButton>
                </DashboardCard>

                {/* Assortment Management */}
                <DashboardCard className="p-6 border-cyan-100 bg-cyan-50/50 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-4 mb-4 text-cyan-600">
                            <Database className="w-8 h-8" />
                            <h2 className="text-xl font-bold">Standaardlijst Herstellen</h2>
                        </div>
                        <p className="text-text-secondary mb-4 text-sm">
                            Zet het assortiment terug naar de basis (Vervangt huidige producten met standaardlijst).
                        </p>
                    </div>
                    <DashboardButton
                        onClick={handleRefreshAssortment}
                        disabled={refreshing}
                        className="w-full bg-cyan-600 hover:bg-cyan-700 font-semibold"
                        icon={<RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
                        isLoading={refreshing}
                    >
                        {refreshing ? 'Producten ophalen...' : 'Standaardlijst herstellen'}
                    </DashboardButton>
                </DashboardCard>

                {/* Reset Week */}

                {/* Product Manager (FULL WIDTH) */}
                <div className="col-span-1 md:col-span-2">
                    <ProductManager adminToken={adminToken ?? ''} onUnauthorized={handleLogout} />
                </div>
            </div>

            {/* Email Management */}
            <DashboardCard className="p-6 col-span-1 lg:col-span-2 border-blue-100 bg-blue-50/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <div className="flex items-center gap-4 text-blue-600">
                        <Mail className="w-8 h-8" />
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                Email notificaties
                            </h2>
                            <p className="text-sm text-text-muted">
                                De automatische reminder wordt verstuurd op <strong>{['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'][savedDeadlineSettings?.day || 4]}</strong> om <strong>{String(((savedDeadlineSettings?.hour || 14) - 4 + 24) % 24).padStart(2, '0')}:{String(savedDeadlineSettings?.minute || 0).padStart(2, '0')}</strong> (4 uur voor deadline).
                            </p>
                        </div>
                    </div>
                    <DashboardButton
                        onClick={handleSendTestEmail}
                        className="bg-blue-600 hover:bg-blue-700 md:w-auto w-full"
                        icon={<Send className="w-4 h-4" />}
                        isLoading={isSendingTestEmail}
                    >
                        Test email versturen
                    </DashboardButton>
                </div>

                {/* Add Email Form */}
                <div className="flex flex-col md:flex-row gap-3 mb-6 p-4 bg-white/60 rounded-xl border border-blue-100 shadow-sm backdrop-blur-sm">
                    <div className="flex-1 relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300" />
                        <input
                            type="email"
                            placeholder="nieuwe.collega@vh-pe.nl"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-blue-100 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                        />
                    </div>
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Naam (optioneel)"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-blue-100 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm"
                        />
                    </div>
                    <DashboardButton
                        onClick={handleAddEmail}
                        className="bg-blue-600 hover:bg-blue-700 md:w-auto w-full shadow-lg shadow-blue-600/20"
                        icon={<Plus className="w-4 h-4" />}
                        isLoading={isAddingEmail}
                    >
                        Toevoegen
                    </DashboardButton>
                </div>

                {/* Email List */}
                <div className="space-y-2">
                    {emailList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-blue-300">
                            <Mail className="w-12 h-12 mb-2 opacity-20" />
                            <p className="text-sm">Nog geen emails toegevoegd</p>
                        </div>
                    ) : (
                        emailList.map((subscriber) => (
                            <div key={subscriber.id} className="group flex items-center justify-between p-3 bg-white hover:bg-blue-50/50 rounded-xl border border-blue-100/50 hover:border-blue-200 transition-all shadow-sm hover:shadow-md">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                        {(subscriber.name || subscriber.email)[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">{subscriber.email}</p>
                                        {subscriber.name && (
                                            <p className="text-xs text-blue-400 font-medium">{subscriber.name}</p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteEmail(subscriber.id)}
                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    disabled={deletingEmailId === subscriber.id}
                                >
                                    {deletingEmailId === subscriber.id ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <Trash2 className="w-4 h-4" />}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </DashboardCard >

            {/* Email Template Editor */}
            < DashboardCard className="p-6 col-span-1 lg:col-span-2 border-purple-100 bg-purple-50/50" >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4 text-purple-600">
                        <Edit3 className="w-8 h-8" />
                        <div>
                            <h2 className="text-xl font-bold">Email template editor</h2>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <DashboardButton
                            onClick={() => setShowPreview(!showPreview)}
                            className="bg-gray-600 hover:bg-gray-700"
                            icon={<Eye className="w-4 h-4" />}
                        >
                            {showPreview ? 'Editor' : 'Preview'}
                        </DashboardButton>
                        <DashboardButton
                            onClick={handleSaveTemplate}
                            className="bg-purple-600 hover:bg-purple-700"
                            isLoading={isSavingTemplate}
                        >
                            Opslaan
                        </DashboardButton>
                    </div>
                </div>

                {
                    !showPreview ? (
                        <div className="space-y-4">
                            {/* Subject */}
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">
                                    Email onderwerp
                                </label>
                                <input
                                    type="text"
                                    value={emailSubject}
                                    onChange={(e) => setEmailSubject(e.target.value)}
                                    placeholder="Vergeet niet te bestellen!"
                                    className="w-full px-4 py-2 bg-white border border-border rounded-lg focus:border-primary outline-none"
                                />
                            </div>

                            {/* Body Text */}
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">
                                    Email tekst
                                </label>
                                <textarea
                                    value={emailBodyText}
                                    onChange={(e) => setEmailBodyText(e.target.value)}
                                    rows={8}
                                    placeholder="Hallo {{name}}!&#10;&#10;Dit is je reminder om je broodje te bestellen..."
                                    className="w-full px-4 py-3 bg-white border border-border rounded-lg focus:border-primary outline-none font-mono text-sm"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white border border-border rounded-lg p-6">
                            <h3 className="text-lg font-bold text-text-primary mb-4">Email preview</h3>
                            <div className="border-b border-border pb-3 mb-4">
                                <p className="text-xs text-text-muted">Subject:</p>
                                <p className="text-base font-semibold text-text-primary">{emailSubject || '(Geen onderwerp)'}</p>
                            </div>
                            <div className="prose prose-sm max-w-none">
                                <pre className="whitespace-pre-wrap font-sans text-sm text-text-secondary bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    {emailBodyText.replace(/\{\{name\}\}/g, 'Jan') || '(Geen inhoud)'}
                                </pre>
                            </div>
                        </div>
                    )
                }
            </DashboardCard >
        </div >
    );
}
