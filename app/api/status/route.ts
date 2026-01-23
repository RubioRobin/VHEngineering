import { NextRequest, NextResponse } from 'next/server';
import { isOrderingOpen, getNextDeadline, getTimeUntilDeadline } from '@/lib/orderPeriod';

export const dynamic = 'force-dynamic';

/**
 * GET /api/status
 * Get ordering status and deadline info
 * TESTING MODE: Always returns open for easier testing
 */
export async function GET() {
    try {
        const isOpen = await isOrderingOpen();
        const deadline = await getNextDeadline();
        const timeRemaining = await getTimeUntilDeadline();

        return NextResponse.json({
            isOpen,
            deadline: deadline.toISOString(),
            timeRemaining,
        });
    } catch (error) {
        console.error('Error fetching status:', error);
        return NextResponse.json(
            { error: 'Failed to fetch status' },
            { status: 500 }
        );
    }
}
