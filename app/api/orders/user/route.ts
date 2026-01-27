import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkAndCloseExpiredPeriods } from '@/lib/orderPeriod';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        // Ensure periods are up-to-date before fetching
        await checkAndCloseExpiredPeriods();

        const orders = await prisma.order.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                orderItems: {
                    include: {
                        product: true
                    }
                },
                orderPeriod: {
                    include: {
                        _count: {
                            select: { orders: true }
                        }
                    }
                }
            }
        });

        return NextResponse.json({ orders });
    } catch (error) {
        console.error('Error fetching user orders:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}
