
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkAdminAuth } from '@/lib/auth';

// PUT: Update product
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    const authHeader = request.headers.get('authorization');
    if (!checkAdminAuth(authHeader)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { name, price, description, imageUrl } = body;

        const product = await prisma.product.update({
            where: { id: params.id },
            data: {
                name,
                price: price ? parseFloat(price) : undefined,
                description,
                imageUrl
            }
        });

        return NextResponse.json({ success: true, product });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }
}

// DELETE: Delete product
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const authHeader = request.headers.get('authorization');
    if (!checkAdminAuth(authHeader)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await prisma.product.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }
}
