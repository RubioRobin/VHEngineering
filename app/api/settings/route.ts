
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const setting = await prisma.globalSetting.findUnique({
            where: { key: 'DELIVERY_COST' }
        });

        // Default to 1.95 if not set
        const deliveryCost = setting ? parseFloat(setting.value) : 1.95;

        return NextResponse.json({ deliveryCost });
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ deliveryCost: 1.95 }); // Fallback
    }
}
