import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { SEED_PRODUCTS } from '@/lib/seed-products';

export const dynamic = 'force-dynamic';

/**
 * GET /api/products
 * Fetch all products with optional search query
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    try {
        let products = await prisma.product.findMany({
            where: query
                ? {
                    OR: [
                        { name: { contains: query } },
                        { description: { contains: query } },
                    ],
                }
                : undefined,
            orderBy: {
                name: 'asc',
            },
        });

        // FALLBACK: If DB is empty (local dev without seed), use static seed data
        if (products.length === 0 && !query) {

            // Add ID to seed products to match interface
            products = SEED_PRODUCTS.map((p, i) => ({
                id: `seed-${i}`,
                ...p,
                createdAt: new Date(),
                updatedAt: new Date(),
                allergens: null
            })) as any;
        }

        return NextResponse.json(products);
    } catch (error) {
        console.error('Error fetching products (DB Offline?), using fallback:', error);

        // ULTIMATE FALLBACK: If DB connection fails entirely
        const fallbackProducts = SEED_PRODUCTS.map((p, i) => ({
            id: `seed-${i}`,
            ...p,
            createdAt: new Date(),
            updatedAt: new Date(),
            allergens: null
        }));

        // Filter fallback if query exists
        if (query) {
            const q = query.toLowerCase();
            const filtered = fallbackProducts.filter(p =>
                p.name.toLowerCase().includes(q) ||
                (p.description && p.description.toLowerCase().includes(q))
            );
            return NextResponse.json(filtered);
        }

        return NextResponse.json(fallbackProducts);
    }
}
