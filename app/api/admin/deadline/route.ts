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

        const deadlineDate = new Date(deadline);

        // Save to GlobalSettings for future periods
        await prisma.globalSetting.upsert({
            where: { key: 'orderDeadline' },
            update: { value: deadlineDate.toISOString() },
            create: {
                key: 'orderDeadline',
                value: deadlineDate.toISOString()
            }
        });

        // Also update current open period if it exists
        const weekId = `${getYear(new Date())}-${getISOWeek(new Date())}`;
        const currentPeriod = await prisma.orderPeriod.findFirst({
            where: {
                weekId,
                isClosed: false
            }
        });

        if (currentPeriod) {
            await prisma.orderPeriod.update({
                where: { id: currentPeriod.id },
                data: { deadline: deadlineDate }
            });
        }

        return NextResponse.json({ success: true, deadline: deadlineDate });
    } catch (error) {
        console.error('Error setting deadline:', error);
        return NextResponse.json({ error: 'Failed to set deadline' }, { status: 500 });
    }
}
