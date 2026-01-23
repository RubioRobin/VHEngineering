'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Product {
    id: string;
    name: string;
    price: number | null;
}

interface OrderItem {
    id: string;
    quantity: number;
    comment: string | null;
    product: Product;
}

interface Order {
    id: string;
    personName: string;
    department: string | null;
    createdAt: string;
    orderItems: OrderItem[];
}

interface Period {
    weekId: string;
    deadline: string;
}

interface DeadlineConfig {
    day: string;
    dayValue: number;
    hour: number;
    minute: number;
    formatted: string;
}

export default function AdminPage() {
    const router = useRouter();
    const [adminCode, setAdminCode] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [orders, setOrders] = useState<Order[]>([]);
    const [periods, setPeriods] = useState<Period[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<string>('');
    const [groupBy, setGroupBy] = useState<'person' | 'sandwich'>('person');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);
    const [deadlineConfig, setDeadlineConfig] = useState<DeadlineConfig | null>(null);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Auto-clear status after 3 seconds
    useEffect(() => {
        if (statusMessage) {
            const timer = setTimeout(() => setStatusMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [statusMessage]);

    useEffect(() => {
        // Only fetch public settings on mount
        fetchSettings();

        // Check for stored session
        const storedCode = sessionStorage.getItem('adminCode');
        if (storedCode) {
            setAdminCode(storedCode);
            setIsAuthenticated(true);
            loadAdminData(storedCode);
        }
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        sessionStorage.setItem('adminCode', adminCode);
        setIsAuthenticated(true);
        loadAdminData(adminCode);
    };

    const loadAdminData = async (code: string) => {
        setLoading(true);
        try {
            // Fetch periods
            const periodsRes = await fetch('/api/admin/periods', {
                headers: { 'Authorization': `Bearer ${code}` }
            });
            if (periodsRes.ok) {
                const data = await periodsRes.json();
                setPeriods(data.periods);
                setSelectedPeriod(data.currentPeriodId);

                // Fetch orders for current period
                await fetchOrders(data.currentPeriodId, code);
            }
        } catch (error) {
            console.error('Error loading admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings');
            if (res.ok) {
                const data = await res.json();
                setDeadlineConfig(data);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!deadlineConfig) return;

        setSavingSettings(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminCode}`
                },
                body: JSON.stringify({
                    day: deadlineConfig.dayValue,
                    hour: deadlineConfig.hour,
                    minute: deadlineConfig.minute,
                }),
            });

            if (res.ok) {
                setStatusMessage({ type: 'success', text: 'Instellingen opgeslagen!' });
                fetchSettings(); // Refresh formatted string
            } else {
                const data = await res.json();
                setStatusMessage({ type: 'error', text: `Fout: ${data.error}` });
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            setStatusMessage({ type: 'error', text: 'Opslaan mislukt' });
        } finally {
            setSavingSettings(false);
        }
    };





    const fetchOrders = async (periodId: string, code: string = adminCode) => {
        setLoading(true);

        try {
            const res = await fetch(`/api/admin/orders?period=${periodId}`, {
                headers: { 'Authorization': `Bearer ${code}` }
            });

            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            } else {
                console.error('Failed to fetch orders');
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefreshProducts = async () => {
        setRefreshing(true);

        try {
            const res = await fetch('/api/admin/refresh-products', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${adminCode}` }
            });

            const data = await res.json();

            if (res.ok) {
                setStatusMessage({ type: 'success', text: `Producten vernieuwd! ${data.count} items.` });
            } else {
                setStatusMessage({ type: 'error', text: `Fout: ${data.error}` });
            }
        } catch (error) {
            console.error('Error refreshing products:', error);
            setStatusMessage({ type: 'error', text: 'Refresh mislukt' });
        } finally {
            setRefreshing(false);
        }
    };

    const handleExportExcel = async () => {
        setExporting(true);
        try {
            const res = await fetch(`/api/admin/export?period=${selectedPeriod}`, {
                headers: { 'Authorization': `Bearer ${adminCode}` }
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `bestellingen-${selectedPeriod}.xlsx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                window.URL.revokeObjectURL(url);
                setStatusMessage({ type: 'success', text: 'Excel gedownload!' });
            } else {
                setStatusMessage({ type: 'error', text: 'Export mislukt' });
            }
        } catch (error) {
            console.error('Error exporting:', error);
            setStatusMessage({ type: 'error', text: 'Export mislukt' });
        } finally {
            setExporting(false);
        }
    };

    const handleDeleteOrder = async (orderId: string) => {
        // if (!confirm('Weet je zeker dat je deze bestelling wilt verwijderen?')) return;

        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${adminCode}` }
            });

            if (res.ok) {
                setStatusMessage({ type: 'success', text: 'Bestelling verwijderd' });
                fetchOrders(selectedPeriod);
            } else {
                const data = await res.json();
                setStatusMessage({ type: 'error', text: `Fout: ${data.error}` });
            }
        } catch (error) {
            console.error('Error deleting order:', error);
            setStatusMessage({ type: 'error', text: 'Verwijderen mislukt' });
        }
    };

    const handlePeriodChange = (periodId: string) => {
        setSelectedPeriod(periodId);
        fetchOrders(periodId);
    };



    // Prepare grouped data
    const groupedData = () => {
        if (groupBy === 'person') {
            // Group by person
            return orders.map((order) => ({
                id: order.id,
                person: order.personName,
                department: order.department,
                items: order.orderItems,
                orderedAt: order.createdAt,
            }));
        } else {
            // Group by sandwich
            const sandwichMap = new Map<
                string,
                { name: string; quantity: number; comments: string[]; price: number | null }
            >();

            orders.forEach((order) => {
                order.orderItems.forEach((item) => {
                    const existing = sandwichMap.get(item.product.id);
                    if (existing) {
                        existing.quantity += item.quantity;
                        if (item.comment) {
                            existing.comments.push(`${item.comment} (${order.personName})`);
                        }
                    } else {
                        sandwichMap.set(item.product.id, {
                            name: item.product.name,
                            quantity: item.quantity,
                            comments: item.comment ? [`${item.comment} (${order.personName})`] : [],
                            price: item.product.price,
                        });
                    }
                });
            });

            return Array.from(sandwichMap.values());
        }
    };

    // Login Screen
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                    <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
                        Admin Login
                    </h1>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Admin Code
                            </label>
                            <input
                                type="password"
                                value={adminCode}
                                onChange={(e) => setAdminCode(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                placeholder="Voer code in..."
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition-colors"
                        >
                            Inloggen
                        </button>
                    </form>
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <button
                            onClick={() => router.push('/')}
                            className="w-full text-gray-500 hover:text-gray-700 text-sm font-medium"
                        >
                            ← Terug naar Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Admin dashboard
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
            {/* Header */}
            <header className="bg-white shadow-md">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                        <div className="flex gap-3">
                            <button
                                onClick={() => router.push('/')}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
                            >
                                ← Home
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                {/* Status Message */}
                {statusMessage && (
                    <div className="absolute top-20 left-0 right-0 flex justify-center z-50 pointer-events-none">
                        <div className={`px-6 py-2 rounded-full shadow-lg text-white font-bold animate-bounce ${statusMessage.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                            }`}>
                            {statusMessage.text}
                        </div>
                    </div>
                )}

                {/* Controls */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Period Selector */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Periode
                            </label>
                            <select
                                value={selectedPeriod}
                                onChange={(e) => handlePeriodChange(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                                {periods.map((period) => (
                                    <option key={period.weekId} value={period.weekId}>
                                        Week {period.weekId}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Group By */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Groeperen
                            </label>
                            <select
                                value={groupBy}
                                onChange={(e) => setGroupBy(e.target.value as 'person' | 'sandwich')}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="person">Per Persoon</option>
                                <option value="sandwich">Per Broodje</option>
                            </select>
                        </div>

                        {/* Export Button */}
                        <div className="flex items-end">
                            <button
                                onClick={handleExportExcel}
                                disabled={exporting}
                                className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors disabled:bg-gray-400"
                            >
                                {exporting ? 'Exporteren...' : 'Excel Export'}
                            </button>
                        </div>

                        {/* Refresh Products */}
                        <div className="flex items-end">
                            <button
                                onClick={handleRefreshProducts}
                                disabled={refreshing}
                                className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors disabled:bg-gray-400"
                            >
                                {refreshing ? 'Bezig...' : 'Ververs Assortiment'}
                            </button>
                        </div>
                    </div>
                </div>


                {/* Settings Section */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border-t-4 border-primary-500">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        Bestel Deadline Instellingen
                    </h2>
                    {deadlineConfig ? (
                        <form onSubmit={handleSaveSettings} className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Deadline Dag
                                </label>
                                <select
                                    value={deadlineConfig.dayValue}
                                    onChange={(e) => setDeadlineConfig({ ...deadlineConfig, dayValue: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value={0}>Zondag</option>
                                    <option value={1}>Maandag</option>
                                    <option value={2}>Dinsdag</option>
                                    <option value={3}>Woensdag</option>
                                    <option value={4}>Donderdag</option>
                                    <option value={5}>Vrijdag</option>
                                    <option value={6}>Zaterdag</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bestel Deadline Tijd (Uur:Minuut)
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        max="23"
                                        value={deadlineConfig.hour}
                                        onChange={(e) => setDeadlineConfig({ ...deadlineConfig, hour: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                    <span className="font-bold">:</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max="59"
                                        value={deadlineConfig.minute}
                                        onChange={(e) => setDeadlineConfig({ ...deadlineConfig, minute: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-200">
                                <p className="font-semibold text-primary-700">Huidige deadline:</p>
                                <p>{deadlineConfig.formatted}</p>
                            </div>
                            <div>
                                <button
                                    type="submit"
                                    disabled={savingSettings}
                                    className="w-full px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg shadow-md transition-all disabled:bg-gray-400"
                                >
                                    {savingSettings ? 'Opslaan...' : 'Instellingen Opslaan'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="text-center py-4">Laden van instellingen...</div>
                    )}
                </div>

                {/* Stats */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="text-sm font-medium text-gray-600 mb-1">
                            Totaal Bestellingen
                        </div>
                        <div className="text-3xl font-bold text-primary-600">
                            {orders.length}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="text-sm font-medium text-gray-600 mb-1">
                            Totaal Broodjes
                        </div>
                        <div className="text-3xl font-bold text-primary-600">
                            {orders.reduce(
                                (sum, order) =>
                                    sum +
                                    order.orderItems.reduce((s, item) => s + item.quantity, 0),
                                0
                            )}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="text-sm font-medium text-gray-600 mb-1">
                            Unieke Personen
                        </div>
                        <div className="text-3xl font-bold text-primary-600">
                            {new Set(orders.map((o) => o.personName)).size}
                        </div>
                    </div>
                </div>

                {/* Orders Table */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Laden...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <div className="text-gray-300 mb-4">
                            <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Nog geen bestellingen
                        </h2>
                        <p className="text-gray-600">
                            Er zijn nog geen bestellingen voor deze periode
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            {groupBy === 'person' ? (
                                <table className="w-full">
                                    <thead className="bg-primary-100">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Naam
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Afdeling
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Broodje
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Aantal
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Opmerking
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Besteld op
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Acties
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {orders.map((order) =>
                                            order.orderItems.map((item, idx) => (
                                                <tr
                                                    key={`${order.id}-${item.id}`}
                                                    className="hover:bg-gray-50"
                                                >
                                                    {idx === 0 && (
                                                        <>
                                                            <td
                                                                className="px-6 py-4 font-semibold"
                                                                rowSpan={order.orderItems.length}
                                                            >
                                                                {order.personName}
                                                            </td>
                                                            <td
                                                                className="px-6 py-4 text-gray-600"
                                                                rowSpan={order.orderItems.length}
                                                            >
                                                                {order.department || '-'}
                                                            </td>
                                                        </>
                                                    )}
                                                    <td className="px-6 py-4">{item.product.name}</td>
                                                    <td className="px-6 py-4 font-semibold">
                                                        {item.quantity}x
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600">
                                                        {item.comment || '-'}
                                                    </td>
                                                    {idx === 0 && (
                                                        <>
                                                            <td
                                                                className="px-6 py-4 text-sm text-gray-600"
                                                                rowSpan={order.orderItems.length}
                                                            >
                                                                {new Date(order.createdAt).toLocaleString('nl-NL')}
                                                            </td>
                                                            <td
                                                                className="px-6 py-4 text-sm text-gray-600"
                                                                rowSpan={order.orderItems.length}
                                                            >
                                                                <button
                                                                    onClick={() => handleDeleteOrder((order as any).id)}
                                                                    className="text-red-600 hover:text-red-800 font-bold"
                                                                    title="Verwijder bestelling"
                                                                >
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                </button>
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-primary-100">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Broodje
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Totaal Aantal
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Prijs
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Totaal Bedrag
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Opmerkingen
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {groupedData().map((item: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-semibold">
                                                    {item.name}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-primary-600">
                                                    {item.quantity}x
                                                </td>
                                                <td className="px-6 py-4">
                                                    {item.price ? `€ ${item.price.toFixed(2)}` : '-'}
                                                </td>
                                                <td className="px-6 py-4 font-semibold">
                                                    {item.price
                                                        ? `€ ${(item.price * item.quantity).toFixed(2)}`
                                                        : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {item.comments.length > 0
                                                        ? item.comments.join('; ')
                                                        : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
