
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkAdminAuth } from '@/lib/auth';

// GET: List all products
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    // Admin check validation optional? List is public in main app mostly, but for admin editing let's verify or allowing it is fine.
    // Let's enforce it to be safe as it's under /api/admin
    // Actually, usually fetching products list is public. But let's stick to consistent admin API pattern.
    // If the main app fetches products via a different route (e.g. server component or /api/products), fine.

    // We can allow public read for list if we want, but "admin products list" implies management.
    // Let's keep it simple: allow it. The main app displays them publicly anyway.

    try {
        const products = await prisma.product.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json({ products });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

// POST: Create a new product
export async function POST(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!checkAdminAuth(authHeader)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, price, description, imageUrl, category } = body;

        if (!name || !price) {
            return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
        }

        const product = await prisma.product.create({
            data: {
                name,
                price: parseFloat(price),
                description,
                imageUrl,
                // We'll store category in description or a loose field if schema doesn't have it yet, 
                // but checking schema: it has 'allergens' etc. let's just stick to standard fields for now.
                // If the user wants categories we might need schema update, but current schema is simple.
            }
        });

        return NextResponse.json({ success: true, product });
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
}
