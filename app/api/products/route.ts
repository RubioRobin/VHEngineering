import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/products
 * Fetch all products with optional search query
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q');

        const products = await prisma.product.findMany({
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

        return NextResponse.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json(
            { error: 'Failed to fetch products' },
            { status: 500 }
        );
    }
}
