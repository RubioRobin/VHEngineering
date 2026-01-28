'use client';

import { formatName } from "@/lib/utils";

interface Product {
    id: string;
    name: string;
    price: number | null;
}

export interface CartItemData {
    id: string; // unique cart item ID
    product: Product;
    quantity: number;
    comment: string;
}

interface CartItemProps {
    item: CartItemData;
    onUpdateQuantity: (id: string, quantity: number) => void;
    onUpdateComment: (id: string, comment: string) => void;
    onRemove: (id: string) => void;
}

export default function CartItem({
    item,
    onUpdateQuantity,
    onUpdateComment,
    onRemove,
}: CartItemProps) {
    return (
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 space-y-2">
            {/* Product name and remove button */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{formatName(item.product.name)}</h3>
                    {item.product.price != null && (
                        <p className="text-xs text-gray-500">€ {item.product.price.toFixed(2)}</p>
                    )}
                </div>
                <button
                    onClick={() => onRemove(item.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    title="Verwijder"
                >
                    <span className="sr-only">Verwijder</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            {/* Quantity controls & Price */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 font-bold text-gray-600 flex items-center justify-center transition-colors text-sm"
                    >
                        −
                    </button>
                    <span className="w-6 text-center font-semibold text-sm">{item.quantity}</span>
                    <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-md bg-primary hover:bg-primary-dark text-white font-bold flex items-center justify-center transition-colors text-sm"
                    >
                        +
                    </button>
                </div>
                {item.product.price != null && (
                    <span className="font-bold text-primary text-sm">
                        € {(item.product.price * item.quantity).toFixed(2)}
                    </span>
                )}
            </div>

            {/* Compact Comment Input */}
            <div>
                <input
                    type="text"
                    value={item.comment}
                    onChange={(e) => onUpdateComment(item.id, e.target.value)}
                    placeholder="Opmerking (optioneel)..."
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-1 focus:ring-primary focus:border-primary transition-all bg-gray-50 focus:bg-white"
                />
            </div>
        </div>
    );
}
