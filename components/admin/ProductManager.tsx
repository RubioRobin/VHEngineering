
'use client';

import { useState, useEffect } from 'react';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { DashboardButton } from '@/components/ui/DashboardButton';
import { useToast } from '@/components/providers/ToastProvider';
import { Edit2, Trash2, Plus, Save, X, Search, DollarSign, ChevronDown, Loader2 } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    price: number | null;
    description: string | null;
    imageUrl: string | null;
}

interface ProductManagerProps {
    adminToken: string;
    onUnauthorized: () => void;
}

export function ProductManager({ adminToken, onUnauthorized }: ProductManagerProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Product>>({});

    // New Product State
    const [isCreating, setIsCreating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [savingEditId, setSavingEditId] = useState<string | null>(null);
    const [newProduct, setNewProduct] = useState({ name: '', price: '', category: 'Belegde broodjes', imageUrl: '' });

    const { showToast, showConfirm } = useToast();

    const CATEGORIES = ["Belegde broodjes", "Snacks", "Banket", "Frisdrank", "Salades", "Overig", "Anders..."];

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
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
        setEditForm({
            ...product,
            description: product.description || 'Overig'
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleSaveEdit = async () => {
        if (!editingId || !editForm.name || !editForm.price) return;

        setSavingEditId(editingId);
        try {
            const res = await fetch(`/api/admin/products/${editingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify(editForm)
            });

            if (res.ok) {
                setProducts(products.map(p => p.id === editingId ? { ...p, ...editForm } as Product : p));
                setEditingId(null);
                showToast('Product bijgewerkt!', 'success');
            } else {
                if (res.status === 401) onUnauthorized();
                showToast('Fout bij opslaan', 'error');
            }
        } catch (error) {
            showToast('Netwerkfout', 'error');
        } finally {
            setSavingEditId(null);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        showConfirm({
            message: `Weet je zeker dat je "${name}" wilt verwijderen?`,
            onConfirm: async () => {
                setDeletingId(id);
                try {
                    const res = await fetch(`/api/admin/products/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${adminToken}`
                        }
                    });

                    if (res.ok) {
                        setProducts(products.filter(p => p.id !== id));
                        showToast('Product verwijderd', 'success');
                    } else {
                        if (res.status === 401) onUnauthorized();
                        showToast('Kon product niet verwijderen', 'error');
                    }
                } catch (error) {
                    showToast('Netwerkfout', 'error');
                } finally {
                    setDeletingId(null);
                }
            }
        });
    };

    const handleCreate = async () => {
        if (!newProduct.name || !newProduct.price) {
            showToast('Naam en prijs zijn verplicht', 'warning');
            return;
        }

        // Prevent saving "Anders..." as the actual category
        if (newProduct.category === 'Anders...') {
            showToast('Vul een categorie naam in', 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/admin/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify({
                    name: newProduct.name,
                    price: parseFloat(newProduct.price),
                    description: newProduct.category, // Map category to description
                    imageUrl: newProduct.imageUrl || null,
                })
            });

            if (res.ok) {
                const data = await res.json();
                setProducts([data.product, ...products]);
                setIsCreating(false);
                setNewProduct({ name: '', price: '', category: 'Belegde broodjes', imageUrl: '' });
                showToast('Product aangemaakt!', 'success');
            } else {
                if (res.status === 401) onUnauthorized();
                showToast('Fout bij aanmaken', 'error');
            }
        } catch (error) {
            showToast('Netwerkfout', 'error');
        } finally {
            setIsSubmitting(false);
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
                <div className="mb-6 p-4 bg-white rounded-xl border border-indigo-100 shadow-sm animate-in fade-in slide-in-from-top-2 space-y-3">
                    <h3 className="font-bold text-gray-700">Nieuw Product Toevoegen</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Name & Price inputs */}
                        <input
                            type="text"
                            placeholder="Product naam"
                            value={newProduct.name}
                            onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg"
                        />
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={newProduct.price}
                                onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                                className="w-full pl-8 pr-4 py-2 border rounded-lg"
                            />
                        </div>

                        {/* Custom Category Logic for Create */}
                        {newProduct.category === 'Anders...' || !CATEGORIES.includes(newProduct.category) ? (
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Eigen categorie..."
                                    value={newProduct.category === 'Anders...' ? '' : newProduct.category}
                                    onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                                    autoFocus
                                />
                                <button
                                    onClick={() => setNewProduct({ ...newProduct, category: 'Belegde broodjes' })}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-indigo-600 bg-white px-1"
                                    title="Terug naar lijst"
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <div className="relative w-full">
                                <select
                                    value={newProduct.category}
                                    onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-700 font-medium"
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        )}

                        <input
                            type="text"
                            placeholder="Afbeelding URL (optioneel)"
                            value={newProduct.imageUrl}
                            onChange={e => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg"
                        />
                    </div>
                    <div className="flex justify-end">
                        <DashboardButton onClick={handleCreate} className="bg-emerald-600" isLoading={isSubmitting}>Opslaan</DashboardButton>
                    </div>
                </div>
            )}

            {/* Product List */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {isLoading ? (
                    <div className="text-center py-8 text-gray-400 flex justify-center">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">Geen producten gevonden</div>
                ) : (
                    filteredProducts.map(product => (
                        <div key={product.id} className="bg-white p-3 rounded-xl border border-indigo-50 flex items-center justify-between group hover:border-indigo-200 transition-colors">
                            {editingId === product.id ? (
                                // Edit Mode
                                <div className="flex-1 flex flex-col gap-2">
                                    <div className="flex gap-2">
                                        <input
                                            value={editForm.name || ''}
                                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                            className="flex-1 px-3 py-1 border rounded"
                                            placeholder="Naam"
                                        />
                                        <input
                                            type="number"
                                            value={editForm.price || 0}
                                            onChange={e => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                                            className="w-24 px-3 py-1 border rounded"
                                            placeholder="Prijs"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        {/* Custom Category Logic for Edit */}
                                        {(editForm.description === 'Anders...' || !CATEGORIES.includes(editForm.description || '')) ? (
                                            <div className="flex-1 relative">
                                                <input
                                                    value={editForm.description === 'Anders...' ? '' : (editForm.description || '')}
                                                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                                    className="w-full px-3 py-1 border rounded border-indigo-300"
                                                    placeholder="Categorie..."
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => setEditForm({ ...editForm, description: 'Overig' })}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-indigo-600 bg-white px-1"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="relative flex-1">
                                                <select
                                                    value={editForm.description || ''}
                                                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                                    className="w-full px-3 py-1 border rounded bg-white appearance-none focus:outline-none focus:border-indigo-500"
                                                >
                                                    {CATEGORIES.map(cat => (
                                                        <option key={cat} value={cat}>{cat}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                                            </div>
                                        )}

                                        <input
                                            value={editForm.imageUrl || ''}
                                            onChange={e => setEditForm({ ...editForm, imageUrl: e.target.value })}
                                            className="flex-1 px-3 py-1 border rounded"
                                            placeholder="Afbeelding URL"
                                        />
                                        <button
                                            onClick={handleSaveEdit}
                                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded"
                                            disabled={savingEditId === product.id}
                                        >
                                            {savingEditId === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        </button>
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
                                            <div className="flex gap-2 text-sm text-gray-500">
                                                <span className="font-bold text-indigo-600">€ {product.price?.toFixed(2)}</span>
                                                <span>•</span>
                                                <span className="italic">{product.description || 'Overig'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEditClick(product)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product.id, product.name)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            disabled={deletingId === product.id}
                                        >
                                            {deletingId === product.id ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <Trash2 className="w-4 h-4" />}
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
