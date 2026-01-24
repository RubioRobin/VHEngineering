import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getISOWeek, getYear } from 'date-fns';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        const currentWeekId = `${getYear(new Date())}-${getISOWeek(new Date())}`;

        const order = await prisma.order.findFirst({
            where: {
                userId,
                orderPeriod: {
                    weekId: currentWeekId
                }
            },
            include: {
                orderItems: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json({ order });
    } catch (error) {
        console.error('Error fetching current week order:', error);
        return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
    }
}
