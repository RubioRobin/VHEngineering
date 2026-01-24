import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const archives = await prisma.orderPeriod.findMany({
            where: {
                isClosed: true
            },
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
