import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { userId, productId } = await request.json();

        if (!userId || !productId) {
            return NextResponse.json({ error: 'Missing userId or productId' }, { status: 400 });
        }

        try {
            // Check if favorite exists
            const existing = await prisma.favorite.findUnique({
                where: {
                    userId_productId: { userId, productId }
                }
            });

            if (existing) {
                // Remove favorite
                await prisma.favorite.delete({
                    where: { id: existing.id }
                });
                return NextResponse.json({ favorited: false });
            } else {
                // Add favorite
                await prisma.favorite.create({
                    data: { userId, productId }
                });
                return NextResponse.json({ favorited: true });
            }
        } catch (dbError: any) {
            // Handle foreign key constraint violation (User or Product not found)
            if (dbError.code === 'P2003') {
                return NextResponse.json({ error: 'User or Product not found' }, { status: 404 });
            }
            throw dbError; // Re-throw other errors
        }
    } catch (error) {
        console.error('Favorites error:', error);
        return NextResponse.json({ error: 'Failed to toggle favorite' }, { status: 500 });
    }
}

// GET user's favorites
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        const favorites = await prisma.favorite.findMany({
            where: { userId },
            include: { product: true }
        });

        return NextResponse.json(favorites);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
    }
}
