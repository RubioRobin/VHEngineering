import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        const orders = await (prisma as any).order.findMany({
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
