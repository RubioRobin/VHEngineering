import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/orders/period/current/all
 * Get all orders for the current active period
 */
export async function GET(request: NextRequest) {
    try {
        // Get the current active period
        const period = await (prisma as any).orderPeriod.findFirst({
            where: { isClosed: false },
            orderBy: { deadline: 'desc' }
        });

        if (!period) {
            return NextResponse.json({ orders: [] });
        }

        // Fetch all orders for this period
        const orders = await (prisma as any).order.findMany({
            where: { orderPeriodId: period.id },
            include: {
                orderItems: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ orders });
    } catch (error) {
        console.error('Error fetching current period orders:', error);
        return NextResponse.json(
            { error: 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}
