import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { getCurrentPeriodId, getAllOrderPeriods } from '@/lib/orderPeriod';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/periods
 * Get all order periods for dropdown
 */
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!checkAdminAuth(authHeader)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const periods = await getAllOrderPeriods();
        let currentPeriodId = await getCurrentPeriodId();

        // Smart selection:
        // 1. Find the object for currentPeriodId
        const currentPeriodIdx = periods.findIndex((p: any) => p.weekId === currentPeriodId);

        // 2. If current doesn't exist OR has 0 orders, try to find latest with orders
        if (currentPeriodIdx === -1 || (periods[currentPeriodIdx]._count.orders === 0 && periods.length > 0)) {
            // Find first period with orders
            const activePeriod = periods.find((p: any) => p._count.orders > 0);
            if (activePeriod) {
                currentPeriodId = activePeriod.weekId;
            } else if (periods.length > 0) {
                // No periods have orders, just show latest
                currentPeriodId = periods[0].weekId;
            }
        }

        return NextResponse.json({
            periods: periods.map((p: any) => ({
                weekId: p.weekId,
                deadline: p.deadline,
                orderCount: p._count.orders
            })),
            currentPeriodId,
        });
    } catch (error) {
        console.error('Error fetching periods:', error);
        return NextResponse.json(
            { error: 'Failed to fetch periods' },
            { status: 500 }
        );
    }
}
