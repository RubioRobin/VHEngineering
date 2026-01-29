import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { toZonedTime } from 'date-fns-tz';
import { getCurrentOrderPeriod, checkAndCloseExpiredPeriods } from '@/lib/orderPeriod';

const TIMEZONE = 'Europe/Amsterdam';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userName, items, generalComment, userId, notParticipating } = body;

        // First, check and close any expired periods
        await checkAndCloseExpiredPeriods();

        // Get or create current period (using shared logic)
        const period = await getCurrentOrderPeriod();

        // Check if deadline has passed
        const now = new Date();
        if (period.deadline < now) {
            return NextResponse.json({
                error: 'De besteldeadline is verstreken. Bestellingen voor deze week zijn gesloten.'
            }, { status: 400 });
        }

        // Create Order with department from user profile or body
        let department = (body.department as string) || null;
        if (userId) {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (user && user.department) {
                department = user.department;
            }
        }

        const order = await (prisma.order as any).create({
            data: {
                personName: userName,
                userId: userId,
                department: department,
                generalComment,
                notParticipating: !!notParticipating,
                orderPeriodId: period.id,
                orderItems: notParticipating ? undefined : {
                    create: items.map((item: any) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        comment: item.comment || ''
                    }))
                }
            }
        });

        return NextResponse.json(order);
    } catch (error) {
        console.error('Order creation error:', error);

        // Check for specific Prisma errors (e.g., Foreign Key constraint failed)
        if ((error as any).code === 'P2003') {
            return NextResponse.json({ error: 'Een of meer producten in je bestelling bestaan niet meer. Ververs de pagina.' }, { status: 400 });
        }

        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        // Ensure periods are up to date
        // 1. Standardize/Claim current period
        const period = await getCurrentOrderPeriod();
        // 2. Cleanup redundant ones
        await checkAndCloseExpiredPeriods();

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
