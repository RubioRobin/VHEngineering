
'use client';

import { useState, useEffect } from 'react';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { DashboardButton } from '@/components/ui/DashboardButton';
import { useToast } from '@/components/providers/ToastProvider';
import { Edit2, Trash2, Plus, Save, X, Search, DollarSign } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    price: number | null;
    description: string | null;
    imageUrl: string | null;
}

export function ProductManager() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Product>>({});

    // New Product State
    const [isCreating, setIsCreating] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: '', price: '' });

    const { showToast, showConfirm } = useToast();

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/admin/products/list'); // We need to create this or use existing getter?
            // Existing app doesn't have a specific ALL products endpoint for admin that is public often, but /api/orders uses prisma.
            // Let's assume we can fetch from /api/products if it exists, but the user is admin.
            // Wait, we don't have a simple GET all products endpoint yet other than the scraper one.
            // Let's create a simple server action or just fetch from a new endpoint.
            // I'll create a simple GET endpoint in the same POST file: app/api/admin/products/route.ts

            const listRes = await fetch('/api/admin/products');
            if (listRes.ok) {
                const data = await listRes.json();
                setProducts(data.products || []);
            }
        } catch (error) {
            console.error('Failed to fetch products', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditClick = (product: Product) => {
        setEditingId(product.id);
        setEditForm({ ...product });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleSaveEdit = async () => {
        if (!editingId || !editForm.name || !editForm.price) return;

        try {
            const adminCode = prompt("Admin Code:");
            if (!adminCode) return;

            const res = await fetch(`/api/admin/products/${editingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminCode}`
                },
                body: JSON.stringify(editForm)
            });

            if (res.ok) {
                setProducts(products.map(p => p.id === editingId ? { ...p, ...editForm } as Product : p));
                setEditingId(null);
                showToast('Product bijgewerkt!', 'success');
            } else {
                showToast('Fout bij opslaan', 'error');
            }
        } catch (error) {
            showToast('Netwerkfout', 'error');
        }
    };

    const handleDelete = async (id: string, name: string) => {
        showConfirm({
            message: `Weet je zeker dat je "${name}" wilt verwijderen?`,
            onConfirm: async () => {
                const adminCode = prompt("Admin Code ter bevestiging:");
                if (!adminCode) return;

                try {
                    const res = await fetch(`/api/admin/products/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${adminCode}`
                        }
                    });

                    if (res.ok) {
                        setProducts(products.filter(p => p.id !== id));
                        showToast('Product verwijderd', 'success');
                    } else {
                        showToast('Kon product niet verwijderen', 'error');
                    }
                } catch (error) {
                    showToast('Netwerkfout', 'error');
                }
            }
        });
    };

    const handleCreate = async () => {
        if (!newProduct.name || !newProduct.price) {
            showToast('Naam en prijs zijn verplicht', 'warning');
            return;
        }

        const adminCode = prompt("Admin Code:");
        if (!adminCode) return;

        try {
            const res = await fetch('/api/admin/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminCode}`
                },
                body: JSON.stringify({
                    name: newProduct.name,
                    price: parseFloat(newProduct.price),
                    description: 'Handmatig toegevoegd',
                    imageUrl: null, // Optional for now
                    category: 'Overig'
                })
            });

            if (res.ok) {
                const data = await res.json();
                setProducts([data.product, ...products]);
                setIsCreating(false);
                setNewProduct({ name: '', price: '' });
                showToast('Product aangemaakt!', 'success');
            } else {
                showToast('Fout bij aanmaken', 'error');
            }
        } catch (error) {
            showToast('Netwerkfout', 'error');
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardCard className="p-6 border-indigo-100 bg-indigo-50/50 col-span-1 lg:col-span-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-4 text-indigo-600">
                    <Edit2 className="w-8 h-8" />
                    <div>
                        <h2 className="text-xl font-bold">Product Beheer</h2>
                        <p className="text-sm text-text-muted">Prijzen aanpassen of producten toevoegen</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Zoeken..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                        />
                    </div>
                    <DashboardButton
                        onClick={() => setIsCreating(!isCreating)}
                        className="bg-indigo-600 hover:bg-indigo-700"
                        icon={<Plus className="w-4 h-4" />}
                    >
                        Nieuw Product
                    </DashboardButton>
                </div>
            </div>

            {/* Create Form */}
            {isCreating && (
                <div className="mb-6 p-4 bg-white rounded-xl border border-indigo-100 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <h3 className="font-bold text-gray-700 mb-2">Nieuw Product Toevoegen</h3>
                    <div className="flex flex-col md:flex-row gap-3">
                        <input
                            type="text"
                            placeholder="Product naam"
                            value={newProduct.name}
                            onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                            className="flex-1 px-4 py-2 border rounded-lg"
                        />
                        <div className="relative w-32">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={newProduct.price}
                                onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                                className="w-full pl-8 pr-4 py-2 border rounded-lg"
                            />
                        </div>
                        <DashboardButton onClick={handleCreate} className="bg-emerald-600">Opslaan</DashboardButton>
                    </div>
                </div>
            )}

            {/* Product List */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {isLoading ? (
                    <div className="text-center py-8 text-gray-400">Laden...</div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">Geen producten gevonden</div>
                ) : (
                    filteredProducts.map(product => (
                        <div key={product.id} className="bg-white p-3 rounded-xl border border-indigo-50 flex items-center justify-between group hover:border-indigo-200 transition-colors">
                            {editingId === product.id ? (
                                // Edit Mode
                                <div className="flex-1 flex gap-3 items-center">
                                    <input
                                        value={editForm.name || ''}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        className="flex-1 px-3 py-1 border rounded"
                                    />
                                    <input
                                        type="number"
                                        value={editForm.price || 0}
                                        onChange={e => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                                        className="w-24 px-3 py-1 border rounded"
                                    />
                                    <div className="flex gap-1">
                                        <button onClick={handleSaveEdit} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded"><Save className="w-4 h-4" /></button>
                                        <button onClick={handleCancelEdit} className="p-2 text-red-500 hover:bg-red-50 rounded"><X className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ) : (
                                // View Mode
                                <>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                                            {product.imageUrl ? (
                                                <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xs text-gray-400">IMG</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">{product.name}</p>
                                            <p className="text-sm text-indigo-600 font-bold">€ {product.price?.toFixed(2)}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEditClick(product)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(product.id, product.name)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>
        </DashboardCard>
    );
}
