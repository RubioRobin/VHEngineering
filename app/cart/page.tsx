'use client';

export const dynamic = 'force-dynamic';

import nextDynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const CartContainer = nextDynamic(() => import('@/components/cart/CartContainer'), {
    ssr: false,
    loading: () => (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Winkelmandje laden...</p>
            </div>
        </div>
    ),
});

export default function CartPage() {
    return <CartContainer />;
}
