"use client";

import { Plus, Minus, ShoppingCart, Heart } from "lucide-react";
import Image from "next/image";
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
            className="group h-full flex flex-col bg-surface rounded-2xl border border-border shadow-card hover:shadow-hover transition-all duration-300 overflow-hidden relative"
        >
            {/* Image Area */}
            <div className="aspect-[4/3] w-full overflow-hidden bg-gray-50 relative">
                {product.imageUrl ? (
                    <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                        <span className="text-5xl drop-shadow-sm">SANDWICH</span> {/* Placeholder emoji replaced or kept if preferred, using text for now if emoji font issues, but emoji is fine usually. Let's stick to the previous emoji or similar if valid. Previous code had 🥪. Putting it back. */}
                        <span className="text-5xl">🥪</span>
                    </div>
                )}

                {/* Price Tag - Top Left */}
                {product.price && (
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-primary px-3 py-1.5 rounded-full font-bold shadow-sm text-sm border border-primary/10">
                        € {product.price.toFixed(2)}
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
                    <h3 className="font-bold text-lg text-text-primary leading-tight" title={product.name}>
                        {formatName(product.name)}
                    </h3>
                </div>

                <div className="mt-auto pt-4 border-t border-border flex items-center gap-3">
                    {/* Add Button - First now */}
                    <DashboardButton
                        onClick={handleAdd}
                        disabled={disabled}
                        className="flex-1 rounded-xl py-2.5 text-sm font-semibold shadow-none hover:shadow-md transition-all active:scale-95"
                        icon={<ShoppingCart className="w-4 h-4" />}
                    >
                        Toevoegen
                    </DashboardButton>

                    {/* Compact Quantity Selector - Second now */}
                    <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-border/60">
                        <button
                            onClick={handleDecrement}
                            className="w-10 h-10 flex items-center justify-center text-text-secondary hover:text-primary hover:bg-white rounded-lg transition-colors disabled:opacity-50"
                            disabled={disabled}
                        >
                            <Minus className="w-5 h-5" />
                        </button>
                        <span className="font-bold text-sm text-text-primary min-w-[1.5rem] text-center">
                            {quantity}
                        </span>
                        <button
                            onClick={handleIncrement}
                            className="w-10 h-10 flex items-center justify-center text-text-secondary hover:text-primary hover:bg-white rounded-lg transition-colors disabled:opacity-50"
                            disabled={disabled}
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ProductCard;
