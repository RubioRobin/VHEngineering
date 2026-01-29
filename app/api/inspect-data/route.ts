import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const setting = await prisma.globalSetting.findUnique({
            where: { key: 'JESSE_PARTICIPATING' },
        });

        const periods = await prisma.orderPeriod.findMany({
            orderBy: { weekId: 'desc' },
            take: 5,
        });

        return NextResponse.json({
            globalSetting: setting,
            periods: periods,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
