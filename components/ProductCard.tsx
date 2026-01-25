"use client";

import { Plus, Minus, ShoppingCart, Heart } from "lucide-react";
import React, { useState } from "react";
import { DashboardButton } from "./ui/DashboardButton";
import { useUser } from "./providers/UserProvider";
import { formatName } from "@/lib/utils";
import { motion } from "framer-motion";

interface ProductCardProps {
    product: {
        id: string;
        name: string;
        price: number | null;
        description: string | null;
        imageUrl: string | null;
        allergens: string | null;
    };
    onAddToCart: (product: any, quantity: number) => void;
    disabled?: boolean;
    isFavorite?: boolean;
    onToggleFavorite?: (productId: string) => void;
}

const ProductCard = ({ product, onAddToCart, disabled, isFavorite = false, onToggleFavorite }: ProductCardProps) => {
    const [quantity, setQuantity] = useState(1);
    const { user } = useUser();

    const handleIncrement = () => setQuantity(q => q + 1);
    const handleDecrement = () => setQuantity(q => Math.max(1, q - 1));

    const handleAdd = () => {
        onAddToCart(product, quantity);
        setQuantity(1);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group h-full flex flex-col bg-white rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden relative"
        >
            {/* Image Area */}
            <div className="aspect-[4/3] w-full overflow-hidden bg-gray-50 relative">
                {product.imageUrl ? (
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                        <span className="text-5xl drop-shadow-sm">SANDWICH</span> {/* Placeholder emoji replaced or kept if preferred, using text for now if emoji font issues, but emoji is fine usually. Let's stick to the previous emoji or similar if valid. Previous code had 🥪. Putting it back. */}
                        <span className="text-5xl">🥪</span>
                    </div>
                )}

                {/* Favorite Heart Button - Top Right now for better flow with new layout */}
                {user && onToggleFavorite && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(product.id);
                        }}
                        className={`absolute top-3 right-3 w-9 h-9 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm transition-all z-10 ${isFavorite ? 'bg-white/90 text-rose-500' : 'bg-white/70 text-gray-400 hover:bg-white hover:text-rose-400'
                            }`}
                        title={isFavorite ? 'Verwijder uit favorieten' : 'Toevoegen aan favorieten'}
                    >
                        <Heart className={`w-5 h-5 transition-colors ${isFavorite ? 'fill-rose-500' : ''}`} />
                    </button>
                )}
            </div>

            {/* Content Area */}
            <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start gap-4 mb-2">
                    <h3 className="font-bold text-lg text-slate-800 leading-tight" title={product.name}>
                        {formatName(product.name)}
                    </h3>
                    {product.price && (
                        <span className="font-bold text-lg text-indigo-600 shrink-0 bg-indigo-50 px-2 py-0.5 rounded-lg">
                            € {product.price.toFixed(2)}
                        </span>
                    )}
                </div>

                {product.description && (
                    <p className="text-sm text-slate-500 mb-5 line-clamp-2 leading-relaxed">
                        {product.description}
                    </p>
                )}

                <div className="mt-auto pt-4 border-t border-gray-50 flex items-center gap-3">
                    {/* Compact Quantity Selector */}
                    <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                        <button
                            onClick={handleDecrement}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
                            disabled={disabled}
                        >
                            <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-bold text-sm text-slate-700 min-w-[1.5rem] text-center">
                            {quantity}
                        </span>
                        <button
                            onClick={handleIncrement}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
                            disabled={disabled}
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Add Button */}
                    <DashboardButton
                        onClick={handleAdd}
                        disabled={disabled}
                        className="flex-1 rounded-xl py-2.5 text-sm font-semibold shadow-none hover:shadow-md transition-all active:scale-95"
                        icon={<ShoppingCart className="w-4 h-4" />}
                    >
                        Toevoegen
                    </DashboardButton>
                </div>
            </div>
        </motion.div>
    );
};

export default ProductCard;
