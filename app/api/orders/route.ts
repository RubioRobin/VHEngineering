import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isOrderingOpen, getCurrentOrderPeriod } from '@/lib/orderPeriod';

export const dynamic = 'force-dynamic';

/**
 * POST /api/orders
 * Create a new order with items
 * TESTING MODE: Deadline check disabled
 */
export async function POST(request: NextRequest) {
    try {
        // Re-enabled deadline check
        if (!(await isOrderingOpen())) {
            return NextResponse.json(
                { error: 'Helaas, bestellen is gesloten.' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { personName, department, items, clientToken } = body;

        // Validation
        if (!personName || !personName.trim()) {
            return NextResponse.json(
                { error: 'Naam is verplicht' },
                { status: 400 }
            );
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: 'Minimaal één broodje is vereist' },
                { status: 400 }
            );
        }

        // Get current order period
        const orderPeriod = await getCurrentOrderPeriod();

        // Create order with items
        const order = await prisma.order.create({
            data: {
                personName: personName.trim(),
                department: department?.trim() || null,
                clientToken: clientToken || "",
                orderPeriodId: orderPeriod.id,
                orderItems: {
                    create: items.map((item: any) => ({
                        productId: item.productId,
                        quantity: item.quantity || 1,
                        comment: item.comment?.trim() || null,
                    })),
                },
            },
            include: {
                orderItems: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        return NextResponse.json(order, { status: 201 });
    } catch (error) {
        console.error('Error creating order:', error);
        return NextResponse.json(
            { error: 'Failed to create order' },
            { status: 500 }
        );
    }
}
