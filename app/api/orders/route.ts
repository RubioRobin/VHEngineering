import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getISOWeek, getYear } from 'date-fns';

// Helper to get current Week ID (e.g., "2024-05")
const getCurrentWeekId = () => {
    const now = new Date();
    return `${getYear(now)}-${getISOWeek(now)}`;
};

// Helper to get admin deadline from global settings
const getAdminDeadline = async (): Promise<Date> => {
    const setting = await prisma.globalSetting.findUnique({
        where: { key: 'orderDeadline' }
    });

    if (setting?.value) {
        return new Date(setting.value);
    }

    // Default fallback: Thursday this week at 14:00
    const now = new Date();
    const day = now.getDay();
    const diff = 4 - day; // 4 = Thursday
    const deadline = new Date(now);
    deadline.setDate(now.getDate() + diff);
    deadline.setHours(14, 0, 0, 0);
    return deadline;
};

// Check and close expired periods
const checkAndCloseExpiredPeriods = async () => {
    const now = new Date();

    // Find all open periods with passed deadlines
    const expiredPeriods = await prisma.orderPeriod.findMany({
        where: {
            isClosed: false,
            deadline: {
                lt: now
            }
        }
    });

    // Close them all
    for (const period of expiredPeriods) {
        await prisma.orderPeriod.update({
            where: { id: period.id },
            data: { isClosed: true }
        });
    }
};

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userName, items, generalComment, userId } = body;

        const weekId = getCurrentWeekId();

        // First, check and close any expired periods
        await checkAndCloseExpiredPeriods();

        // Find current open period for this week
        let period = await prisma.orderPeriod.findFirst({
            where: {
                weekId,
                isClosed: false
            }
        });

        // If no open period exists, create one
        if (!period) {
            const deadline = await getAdminDeadline();

            // Calculate week boundaries
            const now = new Date();
            const startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 7);

            period = await prisma.orderPeriod.create({
                data: {
                    weekId,
                    startDate,
                    endDate,
                    deadline,
                    isClosed: false
                }
            });
        }

        // Check if deadline has passed
        const now = new Date();
        if (period.deadline < now) {
            return NextResponse.json({
                error: 'De besteldeadline is verstreken. Bestellingen voor deze week zijn gesloten.'
            }, { status: 400 });
        }

        // Create Order with department from user profile
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

        // Close expired periods first
        await checkAndCloseExpiredPeriods();

        // Fetch current open period
        const period = await prisma.orderPeriod.findFirst({
            where: {
                weekId,
                isClosed: false
            }
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
