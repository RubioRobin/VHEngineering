import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkAdminAuth } from '@/lib/auth';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const period = await prisma.orderPeriod.findUnique({
            where: { id: params.id },
            include: {
                orders: {
                    include: {
                        orderItems: {
                            include: {
                                product: true
                            }
                        }
                    }
                }
            }
        });

        if (!period) {
            return NextResponse.json({ error: 'Archive not found' }, { status: 404 });
        }

        return NextResponse.json(period);
    } catch (error) {
        console.error('Error fetching archive detail:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!checkAdminAuth(authHeader)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Finally, delete the period itself
        // Cascade should handle orders and orderItems if configured, 
        // but we'll be explicit to avoid any potential 500 errors
        await prisma.orderPeriod.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting archive:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
