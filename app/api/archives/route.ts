import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentOrderPeriod, checkAndCloseExpiredPeriods } from '@/lib/orderPeriod';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Ensure periods are up to date
        await checkAndCloseExpiredPeriods();
        await getCurrentOrderPeriod();

        const archives = await prisma.orderPeriod.findMany({
            include: {
                _count: {
                    select: { orders: true }
                }
            },
            orderBy: {
                startDate: 'desc'
            }
        });

        return NextResponse.json(archives);
    } catch (error) {
        console.error('Error fetching archives:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
