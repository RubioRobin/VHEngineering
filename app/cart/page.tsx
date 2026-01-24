'use client';

export const dynamic = 'force-dynamic';

import nextDynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const CartContainer = nextDynamic(() => import('@/components/CartContainer'), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Winkelmandje laden...</p>
            </div>
        </div>
    ),
});

export default function CartPage() {
    return <CartContainer />;
}
