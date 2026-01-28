'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

import { CartSidebar } from '@/components/cart/CartSidebar';
import { FloatingCartButton } from '@/components/cart/FloatingCartButton';
import { useUser } from '@/components/providers/UserProvider';
import { useOrders } from '@/components/providers/OrdersProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { HomeHeader } from '@/components/home/HomeHeader';
import { ProductFilterBar } from '@/components/home/ProductFilterBar';
import { ProductGrid } from '@/components/home/ProductGrid';
import { OrderSuccessModal } from '@/components/modals/OrderSuccessModal';
import { differenceInHours, differenceInMinutes } from 'date-fns';
import { Clock } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    price: number | null;
    description: string | null;
    imageUrl: string | null;
    allergens: string | null;
    category?: string | null;
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

    const { user } = useUser();
    const { orders } = useOrders();
    const lastOrder = orders && orders.length > 0 ? orders[0] : null;
    const { showToast } = useToast();

    // Timer / Deadline State
    const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);
    const [deadline, setDeadline] = useState<Date | null>(null);
    const [showScrollTop, setShowScrollTop] = useState(false);

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [lastOrderDetails, setLastOrderDetails] = useState<{
        orderId: string,
        totalAmount: number,
        itemCount: number,
        items?: { name: string, quantity: number, price: number | null }[]
    } | null>(null);

    useEffect(() => {
        Promise.all([
            fetchProducts(),
            fetchDeadline()
        ]).finally(() => {
            setLoading(false);
        });

        // Listen for order success event
        const handleOrderSuccess = (e: CustomEvent) => {
            setLastOrderDetails(e.detail);
            setShowSuccessModal(true);
        };
        window.addEventListener('order-success', handleOrderSuccess as EventListener);
        return () => window.removeEventListener('order-success', handleOrderSuccess as EventListener);
    }, []);

    // Fetch favorites when user loads
    useEffect(() => {
        if (user) {
            fetchFavorites();
        }
    }, [user]);

    // Check deadline status periodically
    useEffect(() => {
        if (!deadline) return;
        const checkDeadline = () => {
            setIsDeadlinePassed(new Date() > deadline);
        };
        checkDeadline();
        const interval = setInterval(checkDeadline, 1000);
        return () => clearInterval(interval);
    }, [deadline]);

    // Filter Logic
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

    // Scroll to top listener
    useEffect(() => {
        const handleScroll = () => setShowScrollTop(window.scrollY > 400);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // --- Helpers ---

    const getCategory = (p: Product) => {
        // Use database category if available, with fallbacks for legacy/mixed data
        if (p.category) return p.category;

        const cat = p.description || 'Overig';
        if (cat === 'Broodjes') return 'Belegde broodjes';
        if (cat.toLowerCase().includes('handmatig')) return 'Snacks';
        return cat;
    };

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

    // --- Handlers ---

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

    const toggleFavorite = async (productId: string) => {
        if (!user) {
            showToast("Je moet ingelogd zijn om favorieten op te slaan!", "error");
            return;
        }

        // Optimistic update
        const wasFavorite = favorites.has(productId);
        setFavorites(prev => {
            const next = new Set(prev);
            if (wasFavorite) next.delete(productId);
            else next.add(productId);
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
                    if (data.favorited) next.add(productId);
                    else next.delete(productId);
                    return next;
                });
                showToast(data.favorited ? "Toegevoegd aan favorieten!" : "Verwijderd uit favorieten", "success");
            } else {
                const errorData = await res.json().catch(() => ({}));
                if (res.status === 404 || errorData.error === 'User or Product not found') {
                    showToast("Sessie verlopen. Log opnieuw in.", "error");
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
                if (wasFavorite) next.add(productId);
                else next.delete(productId);
                return next;
            });
        }
    };

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
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    // Get unique categories for dropdown
    const categories = Array.from(new Set(products.map(p => getCategory(p))))
        .sort((a, b) => {
            const order: Record<string, number> = { 'Belegde broodjes': 1, 'Snacks': 2, 'Banket': 3, 'Frisdrank': 4, 'Salades': 5, 'Overig': 99 };
            return (order[a] || 99) - (order[b] || 99);
        });

    return (
        <div className="min-h-screen pb-20 relative">
            <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            <FloatingCartButton onClick={() => setIsCartOpen(prev => !prev)} />
            <OrderSuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                orderData={lastOrderDetails}
            />


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

            {/* Header */}
            <HomeHeader
                deadline={deadline}
                lastOrder={lastOrder}
                onReorder={handleReorder}
            />

            {/* Filter Bar */}
            <ProductFilterBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                showOnlyFavorites={showOnlyFavorites}
                setShowOnlyFavorites={setShowOnlyFavorites}
                categories={categories}
                productCount={filteredProducts.length}
            />

            {/* Product Grid */}
            <ProductGrid
                filteredProducts={filteredProducts}
                searchQuery={searchQuery}
                showOnlyFavorites={showOnlyFavorites}
                selectedCategory={selectedCategory}
                favorites={favorites}
                isDeadlinePassed={isDeadlinePassed}
                onAddToCart={handleAddToCart}
                onToggleFavorite={toggleFavorite}
                getCategory={getCategory}
            />
        </div>
    );
}
