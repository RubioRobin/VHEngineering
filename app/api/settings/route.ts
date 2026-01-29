
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const deliverySetting = await prisma.globalSetting.findUnique({
            where: { key: 'DELIVERY_COST' }
        });

        const jesseSetting = await prisma.globalSetting.findUnique({
            where: { key: 'JESSE_PARTICIPATING' }
        });

        return NextResponse.json({
            deliveryCost: deliverySetting ? parseFloat(deliverySetting.value) : 1.95,
            jesseParticipating: jesseSetting ? jesseSetting.value === 'true' : false
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ deliveryCost: 1.95, jesseParticipating: false });
    }
}
