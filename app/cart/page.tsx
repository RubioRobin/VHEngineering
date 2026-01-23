'use client';

export const dynamic = 'force-dynamic';

import nextDynamic from 'next/dynamic';

const CartContainer = nextDynamic(() => import('@/components/CartContainer'), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Winkelmandje laden...</p>
            </div>
        </div>
    ),
});

export default function CartPage() {
    return <CartContainer />;
}
