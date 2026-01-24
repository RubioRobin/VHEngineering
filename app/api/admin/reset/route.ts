import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

import { checkAdminAuth } from '@/lib/auth';

export async function POST(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (!checkAdminAuth(authHeader)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        // Delete all orders
        // In a real app, you might want to archive them instead of hard delete
        // But for this simplified request: "Alles resetten"
        await prisma.order.deleteMany({});

        // Also could implement logic to close/archive the OrderPeriod
        // For now, simple wipe is effective for "Start new week"

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Reset error:", error);
        return NextResponse.json({ error: 'Failed to reset' }, { status: 500 });
    }
}
