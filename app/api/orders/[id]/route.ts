import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isOrderingOpen } from '@/lib/orderPeriod';
import { checkAdminAuth } from '@/lib/auth';

/**
 * PATCH /api/orders/[id] - Update an order
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = await request.json();
        const { clientToken, items } = body;

        // 1. Validate deadline
        if (!(await isOrderingOpen())) {
            return NextResponse.json(
                { error: 'Helaas, de deadline is verstreken. Je kunt je bestelling niet meer aanpassen.' },
                { status: 403 }
            );
        }

        // 2. Fetch order and verify ownership
        const order = await prisma.order.findUnique({
            where: { id },
            include: { orderItems: true }
        });

        if (!order) {
            return NextResponse.json({ error: 'Bestelling niet gevonden' }, { status: 404 });
        }

        if (order.clientToken !== clientToken) {
            return NextResponse.json({ error: 'Ongeautoriseerd' }, { status: 401 });
        }

        // 3. Update items (simplest way: delete and recreate)
        await prisma.orderItem.deleteMany({
            where: { orderId: id }
        });

        const updatedOrder = await prisma.order.update({
            where: { id },
            data: {
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

        return NextResponse.json(updatedOrder);
    } catch (error) {
        console.error('Error updating order:', error);
        return NextResponse.json(
            { error: 'Failed to update order' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/orders/[id] - Cancel an order
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const searchParams = request.nextUrl.searchParams;
        const clientToken = searchParams.get('token');

        // Check for Admin Auth
        const authHeader = request.headers.get('authorization');
        const isAdmin = checkAdminAuth(authHeader);

        // 1. Validate deadline (skip for admin)
        if (!isAdmin && !(await isOrderingOpen())) {
            return NextResponse.json(
                { error: 'Helaas, de deadline is verstreken. Je kunt je bestelling niet meer annuleren.' },
                { status: 403 }
            );
        }

        // 2. Fetch order and verify ownership or admin
        const order = await prisma.order.findUnique({
            where: { id }
        });

        if (!order) {
            return NextResponse.json({ error: 'Bestelling niet gevonden' }, { status: 404 });
        }

        // Allow if tokens match OR if it is an admin
        if (!isAdmin && order.clientToken !== clientToken) {
            return NextResponse.json({ error: 'Ongeautoriseerd' }, { status: 401 });
        }

        // 3. Delete order (cascades to items)
        await prisma.order.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Bestelling geannuleerd' });
    } catch (error) {
        console.error('Error deleting order:', error);
        return NextResponse.json(
            { error: 'Failed to cancel order' },
            { status: 500 }
        );
    }
}
