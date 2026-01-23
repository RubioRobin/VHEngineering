import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/orders/my-orders?token=...
 * Fetch all orders for a specific client token
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }

        const orders = await prisma.order.findMany({
            where: {
                clientToken: token,
            },
            include: {
                orderItems: {
                    include: {
                        product: true,
                    },
                },
                orderPeriod: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(orders);
    } catch (error) {
        console.error('Error fetching my orders:', error);
        return NextResponse.json(
            { error: 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}
