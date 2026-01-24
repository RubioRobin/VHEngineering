import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getISOWeek, getYear } from 'date-fns';

export const dynamic = 'force-dynamic';

// Helper to get current Week ID (e.g., "2024-05")
const getCurrentWeekId = () => {
    const now = new Date();
    return `${getYear(now)}-${getISOWeek(now)}`;
};

/**
 * GET /api/orders/period/current/all
 * Get all orders for the current active period
 */
export async function GET(request: NextRequest) {
    try {
        const weekId = getCurrentWeekId();
        console.log('🔍 Looking for orders in week:', weekId);

        // Get the current week's period
        const period = await (prisma as any).orderPeriod.findUnique({
            where: { weekId }
        });

        console.log('📅 Period found:', period ? `Yes (ID: ${period.id}, Closed: ${period.isClosed})` : 'No');

        if (!period) {
            console.log('⚠️ No period exists for this week yet');
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

        console.log('📊 Found period:', period.id, 'Week:', period.weekId);
        console.log('📦 Total orders found:', orders.length);
        orders.forEach((order: any) => {
            console.log('  - Order:', order.personName, '|', order.department, '| Items:', order.orderItems?.length);
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
