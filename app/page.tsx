'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CountdownTimer from '@/components/CountdownTimer';
import ProductCard from '@/components/ProductCard';

interface Product {
    id: string;
    name: string;
    price: number | null;
    description: string | null;
    imageUrl: string | null;
}

interface OrderStatus {
    isOpen: boolean;
    deadline: string;
    timeRemaining: number;
}

export default function HomePage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [cartCount, setCartCount] = useState(0);
    const [toast, setToast] = useState<string | null>(null);

    // Auto-hide toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // Load products and status
    useEffect(() => {
        Promise.all([fetchProducts(), fetchOrderStatus()]).finally(() => {
            setLoading(false);
        });

        // Load cart count from localStorage
        updateCartCount();
    }, []);

    // Filter products when search changes
    useEffect(() => {
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            setFilteredProducts(
                products.filter(
                    (p) =>
                        p.name.toLowerCase().includes(query) ||
                        p.description?.toLowerCase().includes(query)
                )
            );
        } else {
            setFilteredProducts(products);
        }
    }, [searchQuery, products]);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products');
            if (!res.ok) throw new Error('Network response was not ok');
            const data = await res.json();
            setProducts(data);
            setFilteredProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts([]);
        }
    };

    const fetchOrderStatus = async () => {
        try {
            const res = await fetch('/api/status');
            if (!res.ok) throw new Error('Network response was not ok');
            const data = await res.json();
            setOrderStatus(data);
        } catch (error) {
            console.error('Error fetching status:', error);
        }
    };

    const updateCartCount = () => {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const count = cart.reduce((sum: number, item: any) => sum + item.quantity, 0);
        setCartCount(count);
    };

    const handleAddToCart = (product: Product) => {
        // Get existing cart
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');

        // Add new item with unique ID
        cart.push({
            id: `${Date.now()}-${Math.random()}`,
            product,
            quantity: 1,
            comment: '',
        });

        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();

        // Show success message (optional)
        // Silent add to cart - user sees cart count update
        setToast(`${product.name} toegevoegd`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Laden...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Countdown Timer */}
            {orderStatus && (
                <CountdownTimer
                    deadline={new Date(orderStatus.deadline)}
                    isOpen={orderStatus.isOpen}
                />
            )}

            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="container mx-auto px-4 py-6">
                    {/* Toast Notification - Floating centered */}
                    {toast && (
                        <div className="absolute top-24 left-0 right-0 flex justify-center z-50 pointer-events-none">
                            <div className="px-6 py-2 rounded-full shadow-lg bg-green-500 text-white font-bold animate-bounce">
                                {toast}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900">
                                Broodjes Bestellen
                            </h1>
                            <p className="text-gray-500 mt-1 font-medium">VH Engineering</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => router.push('/cart')}
                                className="relative px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-all"
                            >
                                Winkelmandje
                                {cartCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-accent-red text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => router.push('/my-orders')}
                                className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 hover:border-primary-500 hover:text-primary-700 hover:bg-gray-50 font-semibold rounded-lg transition-all"
                            >
                                Mijn Bestellingen
                            </button>
                            <button
                                onClick={() => router.push('/admin')}
                                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
                            >
                                Admin
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                {/* Search Bar */}
                <div className="mb-8">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Zoek broodjes..."
                        className="w-full max-w-2xl mx-auto block px-6 py-4 text-lg border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm transition-all"
                    />
                </div>

                {/* Products Grid */}
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-xl text-gray-600">
                            {searchQuery ? 'Geen broodjes gevonden' : 'Geen broodjes beschikbaar'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onAddToCart={handleAddToCart}
                                disabled={!orderStatus?.isOpen}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-gray-100 mt-12 py-6">
                <div className="container mx-auto px-4 text-center text-gray-600">
                    <p>&copy; 2026 VH Engineering - Broodjes Bestellen</p>
                </div>
            </footer>
        </div>
    );
}
