import { NextResponse } from 'next/server';
import { getNextDeadline } from '@/lib/orderPeriod';

export const dynamic = 'force-dynamic';

// GET - Fetch current deadline
export async function GET() {
    try {
        const deadline = await getNextDeadline();
        return NextResponse.json({ deadline });
    } catch (error) {
        console.error('Error fetching deadline:', error);
        return NextResponse.json({ error: 'Failed to fetch deadline' }, { status: 500 });
    }
}
