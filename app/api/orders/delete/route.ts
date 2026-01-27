import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkAdminAuth } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const { orderId, userId } = await request.json();

        if (!orderId) {
            return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
        }

        // Verify ownership OR Admin
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const isAdmin = checkAdminAuth(request.headers.get('authorization'));

        if (!isAdmin && (order as any).userId !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Delete order (cascade deletes orderItems)
        await prisma.order.delete({
            where: { id: orderId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting order:', error);

        // Detailed error for debugging
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Detailed deletion error for order ${orderId}:`, errorMessage);

        return NextResponse.json({
            error: 'Failed to delete order',
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        }, { status: 500 });
    }
}
