"use client";

import { Plus, Minus, ShoppingCart, Heart } from "lucide-react";
import React, { useState } from "react";
import { DashboardCard } from "./ui/DashboardCard";
import { DashboardButton } from "./ui/DashboardButton";
import { useUser } from "./providers/UserProvider";
import { formatName } from "@/lib/utils";

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
        <DashboardCard className="h-full flex flex-col group relative" hoverEffect={!disabled}>
            {/* Image Area */}
            <div className="aspect-[4/3] w-full overflow-hidden bg-gray-50 relative rounded-t-2xl">
                {product.imageUrl ? (
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <span className="text-4xl">🥪</span>
                    </div>
                )}

                {/* Favorite Heart Button - Top Left */}
                {user && onToggleFavorite && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(product.id);
                        }}
                        className="absolute top-3 left-3 w-11 h-11 bg-white/95 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all z-10"
                        title={isFavorite ? 'Verwijder uit favorieten' : 'Toevoegen aan favorieten'}
                    >
                        <Heart
                            className={`w-6 h-6 transition-colors ${isFavorite
                                ? 'fill-rose-500 text-rose-500'
                                : 'text-gray-400'
                                }`}
                        />
                    </button>
                )}

                {/* Price Tag - Top Right */}
                {product.price && (
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur text-text-primary px-3 py-1.5 rounded-full font-bold shadow-md text-sm border border-border/30">
                        € {product.price.toFixed(2)}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-lg text-text-primary mb-1 line-clamp-1" title={product.name}>
                    {formatName(product.name)}
                </h3>
                {/* Onderschriften verwijderd op verzoek */}

                <div className="mt-auto space-y-3">
                    {/* Quantity Selector */}
                    <div className="flex items-center justify-between bg-background rounded-xl p-1 border border-border/50">
                        <button
                            onClick={handleDecrement}
                            className="w-10 h-10 flex items-center justify-center text-text-secondary hover:text-primary hover:bg-white rounded-lg transition-colors"
                            disabled={disabled}
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-bold text-lg text-text-primary min-w-[2rem] text-center">
                            {quantity}
                        </span>
                        <button
                            onClick={handleIncrement}
                            className="w-10 h-10 flex items-center justify-center text-text-secondary hover:text-primary hover:bg-white rounded-lg transition-colors"
                            disabled={disabled}
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Add to Cart Button */}
                    <DashboardButton
                        onClick={handleAdd}
                        disabled={disabled}
                        className="w-full py-3 text-sm shadow-md"
                        icon={<ShoppingCart className="w-4 h-4" />}
                    >
                        Toevoegen
                    </DashboardButton>
                </div>
            </div>
        </DashboardCard>
    );
};

export default ProductCard;
