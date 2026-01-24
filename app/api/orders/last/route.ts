import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        const lastOrder = await prisma.order.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                orderItems: {
                    include: {
                        product: true
                    }
                }
            }
        });

        return NextResponse.json({ order: lastOrder });
    } catch (error) {
        console.error('Error fetching last order:', error);
        return NextResponse.json({ error: 'Failed to fetch last order' }, { status: 500 });
    }
}
