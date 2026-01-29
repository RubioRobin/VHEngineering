import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getDeadlineConfig } from '@/lib/orderPeriod';
import { checkAdminAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/settings
 * Fetch current deadline settings
 */
export async function GET(request: NextRequest) {
    // Auth check disabled for testing as per current project state
    // const authHeader = request.headers.get('authorization');
    // if (!checkAdminAuth(authHeader)) {
    //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }


    try {
        const config = await getDeadlineConfig();

        // Fetch delivery cost
        const deliverySetting = await prisma.globalSetting.findUnique({
            where: { key: 'DELIVERY_COST' }
        });

        // Fetch Jesse status
        const jesseSetting = await prisma.globalSetting.findUnique({
            where: { key: 'JESSE_PARTICIPATING' }
        });

        return NextResponse.json({
            ...config,
            deliveryCost: deliverySetting ? parseFloat(deliverySetting.value) : 1.95,
            jesseParticipating: jesseSetting ? jesseSetting.value === 'true' : false
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/settings
 * Update deadline settings
 */
export async function POST(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!checkAdminAuth(authHeader)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { day, hour, minute, deliveryCost, jesseParticipating } = await request.json();

        const settings = [];

        // Update deadline if provided
        if (day !== undefined) {
            if (day < 0 || day > 6 || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
                return NextResponse.json({ error: 'Ongeldige waarden voor deadline' }, { status: 400 });
            }
            settings.push({ key: 'DEADLINE_DAY', value: day.toString() });
            settings.push({ key: 'DEADLINE_HOUR', value: hour.toString() });
            settings.push({ key: 'DEADLINE_MINUTE', value: minute.toString() });
        }

        // Update delivery cost if provided
        if (deliveryCost !== undefined) {
            settings.push({ key: 'DELIVERY_COST', value: deliveryCost.toString() });
        }

        // Update Jesse status if provided
        if (jesseParticipating !== undefined) {
            settings.push({ key: 'JESSE_PARTICIPATING', value: jesseParticipating.toString() });
        }

        for (const setting of settings) {
            await prisma.globalSetting.upsert({
                where: { key: setting.key },
                update: { value: setting.value },
                create: { key: setting.key, value: setting.value },
            });
        }

        // Sync current period deadline immediately if deadline changed
        if (day !== undefined) {
            try {
                const { getNextDeadline, getCurrentOrderPeriod } = await import('@/lib/orderPeriod');
                const newDeadline = await getNextDeadline();
                const period = await getCurrentOrderPeriod();

                if (period) {
                    if (new Date(newDeadline) > new Date()) {
                        await prisma.orderPeriod.update({
                            where: { id: period.id },
                            data: { deadline: newDeadline }
                        });
                        console.log(`Updated active period ${period.weekId} deadline to ${newDeadline}`);
                    }
                }
            } catch (syncError) {
                console.error('Error syncing active period deadline:', syncError);
            }
        }

        return NextResponse.json({ message: 'Instellingen succesvol bijgewerkt' });
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json(
            { error: 'Failed to update settings' },
            { status: 500 }
        );
    }
}

