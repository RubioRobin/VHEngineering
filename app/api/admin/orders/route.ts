import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getCurrentPeriodId } from '@/lib/orderPeriod';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/orders
 * Fetch all orders (admin only)
 * TESTING MODE: Auth disabled
 */
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!checkAdminAuth(authHeader)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const searchParams = request.nextUrl.searchParams;
        const periodId = searchParams.get('period') || await getCurrentPeriodId();

        const orders = await prisma.order.findMany({
            where: {
                orderPeriod: {
                    weekId: periodId,
                },
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
                createdAt: 'asc',
            },
        });

        return NextResponse.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json(
            { error: 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}
