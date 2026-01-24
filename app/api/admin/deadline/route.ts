import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getISOWeek, getYear } from 'date-fns';
import { checkAdminAuth } from '@/lib/auth';

export async function POST(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (!checkAdminAuth(authHeader)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const { deadline } = await request.json();

        if (!deadline) {
            return NextResponse.json({ error: 'Missing deadline' }, { status: 400 });
        }

        const weekId = `${getYear(new Date())}-${getISOWeek(new Date())}`;
        const deadlineDate = new Date(deadline);

        // Find or create current order period
        let period = await prisma.orderPeriod.findUnique({
            where: { weekId }
        });

        if (!period) {
            period = await prisma.orderPeriod.create({
                data: {
                    weekId,
                    startDate: new Date(),
                    endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
                    deadline: deadlineDate
                }
            });
        } else {
            // Update deadline
            period = await prisma.orderPeriod.update({
                where: { weekId },
                data: { deadline: deadlineDate }
            });
        }

        return NextResponse.json({ success: true, deadline: period.deadline });
    } catch (error) {
        console.error('Error setting deadline:', error);
        return NextResponse.json({ error: 'Failed to set deadline' }, { status: 500 });
    }
}
