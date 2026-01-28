'use client';

import ProductCard from '@/components/ProductCard';

interface ProductGridProps {
    filteredProducts: any[];
    searchQuery: string;
    showOnlyFavorites: boolean;
    selectedCategory: string | null;
    favorites: Set<string>;
    isDeadlinePassed: boolean;
    onAddToCart: (product: any, quantity: number) => void;
    onToggleFavorite: (id: string) => void;
    getCategory: (product: any) => string;
}

export const ProductGrid = ({
    filteredProducts,
    searchQuery,
    showOnlyFavorites,
    selectedCategory,
    favorites,
    isDeadlinePassed,
    onAddToCart,
    onToggleFavorite,
    getCategory
}: ProductGridProps) => {
    return (
        <div className="space-y-12 max-w-[2400px] mx-auto px-6 transition-all duration-300">
            <AnimatePresence mode="wait">
                {/* If searching or favorites: Show flat list */}
                {(searchQuery || showOnlyFavorites) ? (
                    <motion.div
                        key="flat-list"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 4xl:grid-cols-8 gap-6 mt-8"
                    >
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onAddToCart={onAddToCart}
                                    disabled={isDeadlinePassed}
                                    isFavorite={favorites.has(product.id)}
                                    onToggleFavorite={onToggleFavorite}
                                />
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-highlight mb-4">
                                    <Search className="w-8 h-8 text-text-muted" />
                                </div>
                                <h3 className="text-lg font-medium text-text-primary">Geen producten gevonden</h3>
                                <p className="text-text-muted">
                                    {showOnlyFavorites ? "Je hebt nog geen favorieten." : "Probeer een andere zoekterm."}
                                </p>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key={`category-list-${selectedCategory || 'all'}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* Default: Group by Category */}
                        {Array.from(new Set(filteredProducts.map(p => getCategory(p))))
                            .sort((a, b) => {
                                // Custom sorting: Belegde broodjes first, then Snacks, then Banket
                                const order: Record<string, number> = {
                                    'Belegde broodjes': 1,
                                    'Broodjes': 1,
                                    'Snacks': 2,
                                    'Banket': 3,
                                    'Frisdrank': 4,
                                    'Salades': 5,
                                    'Overig': 99
                                };
                                return (order[a] || 99) - (order[b] || 99);
                            })
                            .map(category => {
                                const productsInCat = filteredProducts.filter(p => getCategory(p) === category);
                                if (productsInCat.length === 0) return null;

                                const displayName = category === 'Broodjes' ? 'Belegde broodjes' : category;

                                return (
                                    <section key={category} id={`cat-${category}`} className="scroll-mt-48">
                                        {/* Minimalist Design - Only show title if NOT filtered by specific category (to avoid double title) */}
                                        {!selectedCategory && (
                                            <div className="flex items-baseline justify-between mb-8 pb-4 border-b border-border mt-12">
                                                <h3 className="text-3xl font-extrabold text-text-primary tracking-tight">
                                                    {displayName}
                                                </h3>
                                                <span className="text-sm font-bold text-text-muted">
                                                    {productsInCat.length} opties
                                                </span>
                                            </div>
                                        )}

                                        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 4xl:grid-cols-8 gap-6 ${selectedCategory ? 'mt-6' : ''}`}>
                                            {productsInCat.map((product) => (
                                                <ProductCard
                                                    key={product.id}
                                                    product={product}
                                                    onAddToCart={onAddToCart}
                                                    disabled={isDeadlinePassed}
                                                    isFavorite={favorites.has(product.id)}
                                                    onToggleFavorite={onToggleFavorite}
                                                />
                                            ))}
                                        </div>
                                    </section>
                                );
                            })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
