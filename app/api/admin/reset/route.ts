import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

import { checkAdminAuth } from '@/lib/auth';

export async function POST(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (!checkAdminAuth(authHeader)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        // Close the current order period to create an archive
        const currentPeriod = await prisma.orderPeriod.findFirst({
            where: { isClosed: false },
            orderBy: { createdAt: 'desc' }
        });

        if (currentPeriod) {
            // Close the current period - this preserves it as an archive
            await prisma.orderPeriod.update({
                where: { id: currentPeriod.id },
                data: { isClosed: true }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Reset error:", error);
        return NextResponse.json({ error: 'Failed to reset' }, { status: 500 });
    }
}
