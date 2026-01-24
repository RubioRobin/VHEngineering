import { NextResponse } from 'next/server';
import { getCurrentOrderPeriod } from '@/lib/orderPeriod';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const period = await getCurrentOrderPeriod();

        // Get number of orders in this period to calculate shipping share
        const orderCount = await prisma.order.count({
            where: { orderPeriodId: period.id }
        });

        return NextResponse.json({
            periodId: period.weekId,
            orderCount,
            deadline: period.deadline
        });
    } catch (error) {
        console.error('Error fetching current period:', error);
        return NextResponse.json(
            { error: 'Failed to fetch current period' },
            { status: 500 }
        );
    }
}
