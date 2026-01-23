'use client';

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
        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 space-y-3">
            {/* Product name and remove button */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                    {item.product.price && (
                        <p className="text-sm text-gray-600">€ {item.product.price.toFixed(2)}</p>
                    )}
                </div>
                <button
                    onClick={() => onRemove(item.id)}
                    className="text-red-500 hover:text-red-700 font-semibold text-sm transition-colors"
                >
                    ✕ Verwijder
                </button>
            </div>

            {/* Quantity controls */}
            <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Aantal:</span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="w-8 h-8 rounded-lg bg-gray-200 hover:bg-gray-300 font-bold transition-colors"
                    >
                        −
                    </button>
                    <span className="w-12 text-center font-semibold">{item.quantity}</span>
                    <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-bold transition-colors"
                    >
                        +
                    </button>
                </div>
                {item.product.price && (
                    <span className="ml-auto font-semibold text-primary-600">
                        € {(item.product.price * item.quantity).toFixed(2)}
                    </span>
                )}
            </div>

            {/* Comment input */}
            <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                    Opmerking (optioneel):
                </label>
                <input
                    type="text"
                    value={item.comment}
                    onChange={(e) => onUpdateComment(item.id, e.target.value)}
                    placeholder="Bijv: zonder saus, extra kaas..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
            </div>
        </div>
    );
}
