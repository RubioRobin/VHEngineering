'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { formatName } from '@/lib/utils';
import ProductCard from '@/components/ProductCard';
import { motion } from 'framer-motion';
import { Search, Loader2, ShoppingBag } from 'lucide-react';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { DashboardButton } from '@/components/ui/DashboardButton';
import { CartSidebar } from '@/components/cart/CartSidebar';
import { FloatingCartButton } from '@/components/cart/FloatingCartButton';
import { useUser } from '@/components/providers/UserProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Product {
    id: string;
    name: string;
    price: number | null;
    description: string | null;
    imageUrl: string | null;
    allergens: string | null;
}

export default function HomePage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
    const { user } = useUser();
    const [lastOrder, setLastOrder] = useState<any>(null);
    const [currentWeekOrder, setCurrentWeekOrder] = useState<any>(null);
    const { showToast } = useToast();

    // Timer State
    const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
    const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);
    const [deadline, setDeadline] = useState<Date | null>(null);

    useEffect(() => {
        Promise.all([
            fetchProducts(),
            fetchDeadline(),
            user ? fetchLastOrder() : Promise.resolve(),
            user ? fetchCurrentWeekOrder() : Promise.resolve()
        ]).finally(() => {
            setLoading(false);
        });
    }, []);

    // Update timer when deadline changes
    useEffect(() => {
        if (!deadline) return;

        const calculateTimeLeft = () => {
            const now = new Date();
            const target = new Date(deadline);
            const diff = target.getTime() - now.getTime();

            if (diff <= 0) {
                setIsDeadlinePassed(true);
                return null;
            }

            return {
                d: Math.floor(diff / (1000 * 60 * 60 * 24)),
                h: Math.floor((diff / (1000 * 60 * 60)) % 24),
                m: Math.floor((diff / 1000 / 60) % 60),
                s: Math.floor((diff / 1000) % 60),
            };
        };

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        setTimeLeft(calculateTimeLeft()); // Init

        return () => {
            clearInterval(timer);
        };
    }, [deadline]);

    useEffect(() => {
        if (user) {
            fetchFavorites();
        }
    }, [user]);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products');
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
                setFilteredProducts(data);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const fetchLastOrder = async () => {
        if (!user) return;
        try {
            const res = await fetch(`/api/orders/last?userId=${user.id}`);
            if (res.ok) {
                const data = await res.json();
                setLastOrder(data.order);
            }
        } catch (error) {
            console.error('Error fetching last order:', error);
        }
    };

    const fetchCurrentWeekOrder = async () => {
        if (!user) return;
        try {
            const res = await fetch(`/api/orders/current-week?userId=${user.id}`);
            if (res.ok) {
                const data = await res.json();
                setCurrentWeekOrder(data.order);
            }
        } catch (error) {
            console.error('Error fetching current week order:', error);
        }
    };

    const handleReorder = () => {
        if (!lastOrder || !lastOrder.orderItems) return;

        const newCartItems = lastOrder.orderItems.map((item: any) => ({
            id: `${Date.now()}-${Math.random()}`,
            product: {
                id: item.productId,
                name: item.product.name,
                price: item.product.price
            },
            quantity: item.quantity,
            comment: item.comment || ''
        }));

        localStorage.setItem('cart', JSON.stringify(newCartItems));
        window.dispatchEvent(new Event('cart-updated'));
        showToast("Producten opnieuw toegevoegd aan winkelmandje!", "success");
        setIsCartOpen(true);
    };

    const fetchDeadline = async () => {
        try {
            const res = await fetch('/api/deadline');
            if (res.ok) {
                const data = await res.json();
                setDeadline(new Date(data.deadline));
            }
        } catch (error) {
            console.error('Error fetching deadline:', error);
        }
    };

    const fetchFavorites = async () => {
        if (!user) return;
        try {
            const res = await fetch(`/api/favorites?userId=${user.id}`);
            if (res.ok) {
                const data = await res.json();
                const favSet = new Set<string>(data.map((fav: any) => fav.productId as string));
                setFavorites(favSet);
            }
        } catch (error) {
            console.error('Error fetching favorites:', error);
        }
    };

    const toggleFavorite = async (productId: string) => {
        if (!user) {
            showToast("Je moet ingelogd zijn om favorieten op te slaan!", "error");
            return;
        }

        try {
            const res = await fetch('/api/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, productId })
            });

            if (res.ok) {
                const data = await res.json();
                const newFavorites = new Set(favorites);
                if (data.favorited) {
                    newFavorites.add(productId);
                    showToast("Toegevoegd aan favorieten!", "success");
                } else {
                    newFavorites.delete(productId);
                    showToast("Verwijderd uit favorieten", "success");
                }
                setFavorites(newFavorites);
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            showToast("Fout bij opslaan favoriet", "error");
        }
    };

    useEffect(() => {
        let filtered = products;

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(p => p.name.toLowerCase().includes(query));
        }

        if (showOnlyFavorites) {
            filtered = filtered.filter(p => favorites.has(p.id));
        }

        setFilteredProducts(filtered);
    }, [searchQuery, products, showOnlyFavorites, favorites]);

    const handleAddToCart = (product: Product, quantity: number) => {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingItem = cart.find((item: any) => item.product.id === product.id);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({
                id: `${Date.now()}-${Math.random()}`,
                product,
                quantity,
                comment: '',
            });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cart-updated'));
        showToast(`${quantity}x ${product.name} toegevoegd!`, "success");
        // Cart stays closed - user clicks floating button to open
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            <FloatingCartButton onClick={() => setIsCartOpen(true)} />

            {/* Dashboard Header & Timer */}
            <div className="flex flex-col md:flex-row items-stretch gap-6">
                {/* Timer Card */}
                <DashboardCard className={`flex-1 text-white border-none shadow-lg ${timeLeft && (timeLeft.d === 0 && timeLeft.h < 4)
                    ? 'bg-gradient-to-br from-red-500 to-red-700 animate-pulse shadow-red-500/30'
                    : 'bg-gradient-to-br from-primary to-primary-dark shadow-primary/20'
                    }`}>
                    <div className="flex flex-col h-full justify-between">
                        <div className="flex items-center gap-3 opacity-90">
                            <ClockIcon />
                            <span className="text-sm font-medium uppercase tracking-wider">
                                {timeLeft && (timeLeft.d === 0 && timeLeft.h < 4) ? '🚨 SPOED!' : 'Bestellen Sluit Over'}
                            </span>
                        </div>
                        <div className="mt-4">
                            {timeLeft ? (
                                <>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-mono font-bold">{timeLeft.d}d</span>
                                        <span className="text-4xl font-mono font-bold">{timeLeft.h}u</span>
                                        <span className="text-4xl font-mono font-bold">{timeLeft.m}m</span>
                                    </div>
                                    {deadline && (
                                        <p className="text-white/70 text-sm mt-3 font-medium">
                                            Deadline: {format(deadline, 'EEEE d MMMM - HH:mm', { locale: nl })} uur
                                        </p>
                                    )}
                                </>
                            ) : (
                                <span className="text-3xl font-bold">Gesloten</span>
                            )}
                        </div>
                    </div>
                </DashboardCard>

                {/* Quick Stats */}
                <DashboardCard className="flex-1 bg-white">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-10 h-10 rounded-full bg-accent-pink/10 flex items-center justify-center text-accent-pink">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-text-secondary text-xs uppercase font-bold">Mijn Bestelling</p>
                            <h3 className="text-2xl font-bold text-text-primary">Bestelling Plaatsen</h3>
                        </div>
                    </div>
                    <p className="text-text-muted text-sm mt-2">
                        Vergeet niet je bestelling definitief te maken in het winkelmandje.
                    </p>
                    <button
                        onClick={() => setIsCartOpen(true)}
                        className="mt-4 text-sm font-semibold text-primary hover:underline"
                    >
                        Nu afronden →
                    </button>
                </DashboardCard>

                {/* Recent Order - Reorder */}
                {lastOrder && (
                    <DashboardCard className="flex-1 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-600">
                                🔄
                            </div>
                            <div>
                                <p className="text-text-secondary text-xs uppercase font-bold">Recent besteld</p>
                                <h3 className="text-lg font-bold text-text-primary">Bestel opnieuw</h3>
                            </div>
                        </div>

                        {/* Show actual items */}
                        <div className="mb-3 space-y-1">
                            {lastOrder.orderItems?.slice(0, 3).map((item: any, idx: number) => (
                                <div key={idx} className="text-sm text-text-secondary">
                                    <span className="font-medium text-text-primary">{item.quantity}x</span> {formatName(item.product.name)}
                                </div>
                            ))}
                            {lastOrder.orderItems?.length > 3 && (
                                <div className="text-sm text-text-muted italic">
                                    +{lastOrder.orderItems.length - 3} meer...
                                </div>
                            )}
                        </div>

                        <DashboardButton
                            onClick={handleReorder}
                            className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 shadow-lg"
                        >
                            Opnieuw bestellen
                        </DashboardButton>
                    </DashboardCard>
                )}
            </div>

            {/* Product Grid */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-text-primary">
                            {showOnlyFavorites ? 'Jouw favorieten!' : 'Het assortiment'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        {user && (
                            <div className="flex gap-2 bg-white rounded-lg border border-border p-1">
                                <button
                                    onClick={() => setShowOnlyFavorites(false)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${!showOnlyFavorites ? 'bg-primary text-white' : 'text-text-secondary hover:text-primary'}`}
                                >
                                    Alle
                                </button>
                                <button
                                    onClick={() => setShowOnlyFavorites(true)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${showOnlyFavorites ? 'bg-primary text-white' : 'text-text-secondary hover:text-primary'}`}
                                    title="Favorieten"
                                >
                                    Favorieten
                                </button>
                            </div>
                        )}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <input
                                type="text"
                                placeholder="Zoeken..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2.5 bg-white border border-transparent shadow-sm rounded-xl text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none w-full transition-all hover:shadow-md"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProducts.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onAddToCart={handleAddToCart}
                            disabled={isDeadlinePassed}
                            isFavorite={favorites.has(product.id)}
                            onToggleFavorite={toggleFavorite}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);
