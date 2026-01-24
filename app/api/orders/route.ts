import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getISOWeek, getYear } from 'date-fns';

// Helper to get current Week ID (e.g., "2024-05")
const getCurrentWeekId = () => {
    const now = new Date();
    return `${getYear(now)}-${getISOWeek(now)}`;
};

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userName, items, generalComment, userId } = body;

        const weekId = getCurrentWeekId();

        // Find or create OrderPeriod
        let period = await prisma.orderPeriod.findUnique({
            where: { weekId }
        });

        if (!period) {
            // Calculate Thursday 14:00 of this week
            // Simplified logic for demo, ideally robust date math
            const now = new Date();
            const day = now.getDay();
            const diff = 4 - day; // 4 = Thursday
            const deadline = new Date(now);
            deadline.setDate(now.getDate() + diff);
            deadline.setHours(14, 0, 0, 0);

            period = await prisma.orderPeriod.create({
                data: {
                    weekId,
                    startDate: new Date(), // Start of week (conceptually)
                    endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
                    deadline
                }
            });
        }

        // Create Order
        // Include department from user profile if available
        let department = null;
        if (userId) {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (user) {
                department = user.department;
            }
        }

        const order = await (prisma.order as any).create({
            data: {
                personName: userName,
                userId: userId,
                department: department,
                generalComment,
                orderPeriodId: period.id,
                orderItems: {
                    create: items.map((item: any) => ({
                        productId: item.product.id,
                        quantity: item.quantity,
                        comment: item.comment || ''
                    }))
                }
            }
        });

        return NextResponse.json(order);
    } catch (error) {
        console.error('Order creation error:', error);
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const weekId = getCurrentWeekId();

        // Fetch period to verify it exists
        const period = await prisma.orderPeriod.findUnique({
            where: { weekId }
        });

        if (!period) {
            return NextResponse.json({ orders: [], total: 0 });
        }

        const orders = await prisma.order.findMany({
            where: { orderPeriodId: period.id },
            include: {
                orderItems: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ orders });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}
