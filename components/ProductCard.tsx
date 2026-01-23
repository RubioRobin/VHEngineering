'use client';

import Image from 'next/image';

interface Product {
    id: string;
    name: string;
    price: number | null;
    description: string | null;
    imageUrl: string | null;
}

interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product) => void;
    disabled?: boolean;
}

export default function ProductCard({ product, onAddToCart, disabled }: ProductCardProps) {
    return (
        <div className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-primary-300">
            {/* Image */}
            <div className="relative h-48 bg-gradient-to-br from-primary-50 to-primary-100 overflow-hidden">
                {product.imageUrl ? (
                    <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <svg className="w-16 h-16 text-primary-200" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M21.5,8c-1.42,0-2.61,0.95-2.94,2.23C18,10.08,17,9,15.5,9c-0.89,0-1.68,0.48-2.14,1.21C12,10.08,11,9,9.5,9C8,9,7,10.08,6.64,11.23 C6.31,9.95,5.12,9,3.7,9c-1.5,0-2.7,1.2-2.7,2.7c0,0.1,0.01,0.19,0.02,0.29C1.1,14.65,3,19.3,12.11,21.94c0.23,0.07,0.48,0.06,0.78,0 c9.11-2.64,11.01-7.29,11.09-9.95c0.01-0.1,0.02-0.19,0.02-0.29C24,10.2,22.8,8,21.5,8z" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
                <h3 className="font-bold text-lg text-gray-900 line-clamp-2 min-h-[3.5rem]">
                    {product.name}
                </h3>

                {product.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                        {product.description}
                    </p>
                )}

                <div className="flex items-center justify-between pt-2">
                    {product.price ? (
                        <span className="text-2xl font-bold text-primary-600">
                            € {product.price.toFixed(2)}
                        </span>
                    ) : (
                        <span className="text-sm text-gray-400">Prijs onbekend</span>
                    )}

                    <button
                        onClick={() => onAddToCart(product)}
                        disabled={disabled}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${disabled
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-primary-500 hover:bg-primary-600 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                            }`}
                    >
                        {disabled ? 'Gesloten' : 'Toevoegen'}
                    </button>
                </div>
            </div>
        </div>
    );
}
