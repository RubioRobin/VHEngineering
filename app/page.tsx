'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef } from 'react';
import { formatName } from '@/lib/utils';
import ProductCard from '@/components/ProductCard';
import { motion } from 'framer-motion';
import { Search, Loader2, ShoppingBag, ChevronDown } from 'lucide-react';
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
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { user } = useUser();
    const [lastOrder, setLastOrder] = useState<any>(null);
    const [currentWeekOrder, setCurrentWeekOrder] = useState<any>(null);
    const { showToast } = useToast();

    // Helper to clean up categories
    const getCategory = (p: Product) => {
        const cat = p.description || 'Overig';
        if (cat === 'Broodjes') return 'Belegde broodjes';
        if (cat.toLowerCase().includes('handmatig')) return 'Snacks';
        return cat;
    };

    // Timer State
    const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
    const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);
    const [deadline, setDeadline] = useState<Date | null>(null);
    const [showScrollTop, setShowScrollTop] = useState(false);

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

    // Handle clicking outside of category dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsCategoryDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
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

        // Optimistic update
        const wasFavorite = favorites.has(productId);
        setFavorites(prev => {
            const next = new Set(prev);
            if (wasFavorite) {
                next.delete(productId);
            } else {
                next.add(productId);
            }
            return next;
        });

        try {
            const res = await fetch('/api/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, productId })
            });

            if (res.ok) {
                const data = await res.json();

                // Sync with server text just to be sure
                setFavorites(prev => {
                    const next = new Set(prev);
                    if (data.favorited) {
                        next.add(productId);
                    } else {
                        next.delete(productId);
                    }
                    return next;
                });

                if (data.favorited) {
                    showToast("Toegevoegd aan favorieten!", "success");
                } else {
                    showToast("Verwijderd uit favorieten", "success");
                }
            } else {
                const errorData = await res.json().catch(() => ({}));
                if (res.status === 404 || errorData.error === 'User or Product not found') {
                    showToast("Sessie verlopen. Log opnieuw in.", "error");
                    // Optionally clear local storage or redirect
                    // localStorage.removeItem("vh_user");
                } else {
                    throw new Error(errorData.error || "Failed");
                }
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            showToast("Fout bij opslaan favoriet", "error");

            // Revert on error
            setFavorites(prev => {
                const next = new Set(prev);
                if (wasFavorite) {
                    next.add(productId);
                } else {
                    next.delete(productId);
                }
                return next;
            });
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

        if (selectedCategory) {
            filtered = filtered.filter(p => getCategory(p) === selectedCategory);
        }

        setFilteredProducts(filtered);
    }, [searchQuery, products, showOnlyFavorites, favorites, selectedCategory]);

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

    // Scroll to top listener
    useEffect(() => {
        const handleScroll = () => setShowScrollTop(window.scrollY > 400);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 relative">
            <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            <FloatingCartButton onClick={() => setIsCartOpen(true)} />

            {/* Back to Top Button */}
            <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: showScrollTop ? 1 : 0, scale: showScrollTop ? 1 : 0 }}
                onClick={scrollToTop}
                className="fixed bottom-24 right-8 z-40 bg-white p-3 rounded-full shadow-lg border border-gray-200 text-primary hover:bg-gray-50 transition-all"
                title="Naar boven"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                </svg>
            </motion.button>

            {/* Dashboard Header & Timer */}
            <div className="flex flex-col md:flex-row items-stretch gap-6">
                {/* Timer Card */}
                <DashboardCard className={`flex-1 text-white border-none shadow-lg ${timeLeft && (timeLeft.d === 0 && timeLeft.h < 4)
                    ? 'bg-gradient-to-br from-red-500 to-red-700 animate-pulse shadow-red-500/30'
                    : 'bg-gradient-to-br from-indigo-600 to-violet-700 shadow-indigo-500/20'
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

                {/* Recent Order - Reorder */}
                {lastOrder && (
                    <DashboardCard className="flex-1 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                        <div className="mb-3">
                            <h3 className="text-lg font-bold text-text-primary">Bestel opnieuw</h3>
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

            {/* Product Grid & Categories */}
            <div>
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                    <div>
                        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                            {showOnlyFavorites ? 'Jouw Favorieten' : 'Het Assortiment'}
                        </h2>
                        <p className="text-slate-500 font-medium text-base mt-2">
                            {filteredProducts.length} {showOnlyFavorites ? 'favoriete producten' : 'producten'}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Category Dropdown */}
                        {!showOnlyFavorites && !searchQuery && (
                            <div className="relative min-w-[220px]" ref={dropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                    className="w-full pl-6 pr-4 py-3 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm cursor-pointer hover:border-indigo-200 flex items-center justify-between"
                                >
                                    <span className="truncate">
                                        {selectedCategory ? selectedCategory : 'Alle Categorieën'}
                                    </span>
                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isCategoryDropdownOpen && (
                                    <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                        <button
                                            onClick={() => {
                                                setSelectedCategory(null);
                                                setIsCategoryDropdownOpen(false);
                                            }}
                                            className={`w-full px-6 py-3 text-left text-sm font-bold transition-all ${selectedCategory === null
                                                ? 'bg-indigo-600 text-white'
                                                : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                                                }`}
                                        >
                                            Alle Categorieën
                                        </button>
                                        {Array.from(new Set(products.map(p => getCategory(p))))
                                            .sort((a, b) => {
                                                const order = { 'Belegde broodjes': 1, 'Snacks': 2, 'Banket': 3, 'Frisdrank': 4, 'Salades': 5, 'Overig': 99 };
                                                return (order[a as keyof typeof order] || 99) - (order[b as keyof typeof order] || 99);
                                            })
                                            .map(cat => (
                                                <button
                                                    key={cat}
                                                    onClick={() => {
                                                        setSelectedCategory(cat);
                                                        setIsCategoryDropdownOpen(false);
                                                    }}
                                                    className={`w-full px-6 py-3 text-left text-sm font-bold transition-all ${selectedCategory === cat
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                                                        }`}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            {user && (
                                <button
                                    onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                                    className={`p-3 rounded-xl border transition-all ${showOnlyFavorites
                                        ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-inner'
                                        : 'bg-white border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-100 hover:shadow-sm'}`}
                                    title={showOnlyFavorites ? "Toon alles" : "Toon alleen favorieten"}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={showOnlyFavorites ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                    </svg>
                                </button>
                            )}

                            <div className="relative flex-1 sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Zoeken..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 shadow-sm rounded-xl text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-12">
                    {/* If searching or favorites: Show flat list */}
                    {(searchQuery || showOnlyFavorites) ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        onAddToCart={handleAddToCart}
                                        disabled={isDeadlinePassed}
                                        isFavorite={favorites.has(product.id)}
                                        onToggleFavorite={toggleFavorite}
                                    />
                                ))
                            ) : (
                                <div className="col-span-full py-20 text-center">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                                        <Search className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-900">Geen producten gevonden</h3>
                                    <p className="text-slate-500">
                                        {showOnlyFavorites ? "Je hebt nog geen favorieten." : "Probeer een andere zoekterm."}
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Default: Group by Category */
                        Array.from(new Set(filteredProducts.map(p => getCategory(p))))
                            .sort((a, b) => {
                                // Custom sorting: Belegde broodjes first, then Snacks, then Banket
                                const order = { 'Broodjes': 1, 'Snacks': 2, 'Banket': 3, 'Frisdrank': 4, 'Salades': 5, 'Overig': 99 };
                                return (order[a as keyof typeof order] || 99) - (order[b as keyof typeof order] || 99);
                            })
                            .map(category => {
                                const productsInCat = filteredProducts.filter(p => getCategory(p) === category);
                                if (productsInCat.length === 0) return null;

                                return (
                                    <section key={category} id={`cat-${category}`} className="scroll-mt-32">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="h-8 w-1.5 bg-indigo-500 rounded-full"></div>
                                            <h3 className="text-2xl font-bold text-slate-800">
                                                {category === 'Broodjes' ? 'Belegde broodjes' : category}
                                            </h3>
                                            <span className="bg-slate-100 text-slate-500 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-slate-200">
                                                {productsInCat.length}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                            {productsInCat.map((product) => (
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
                                    </section>
                                );
                            })
                    )}
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
