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
        return NextResponse.json(config);
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
        const { day, hour, minute } = await request.json();

        // Validate values
        if (day < 0 || day > 6 || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
            return NextResponse.json(
                { error: 'Ongeldige waarden voor deadline' },
                { status: 400 }
            );
        }

        // Update in database
        const settings = [
            { key: 'DEADLINE_DAY', value: day.toString() },
            { key: 'DEADLINE_HOUR', value: hour.toString() },
            { key: 'DEADLINE_MINUTE', value: minute.toString() },
        ];

        for (const setting of settings) {
            await prisma.globalSetting.upsert({
                where: { key: setting.key },
                update: { value: setting.value },
                create: { key: setting.key, value: setting.value },
            });
        }

        // Sync current period deadline immediately
        try {
            // Re-import dynamically to get fresh settings? 
            // Actually getNextDeadline fetches from DB so it will see the new values we just upserted above.
            const { getNextDeadline, getCurrentPeriodId } = await import('@/lib/orderPeriod');

            const newDeadline = await getNextDeadline();
            const currentWeekId = await getCurrentPeriodId();

            // Check if period exists
            const period = await prisma.orderPeriod.findUnique({
                where: { weekId: currentWeekId }
            });

            if (period) {
                // Only update if the period deadline is in the future
                // (prevent accidentally re-opening a past period if we mess with settings)
                if (new Date(period.deadline) > new Date()) {
                    await prisma.orderPeriod.update({
                        where: { weekId: currentWeekId },
                        data: { deadline: newDeadline }
                    });
                    console.log(`Updated current period ${currentWeekId} deadline to ${newDeadline}`);
                }
            }
        } catch (syncError) {
            console.error('Error syncing active period deadline:', syncError);
            // Don't fail the request, just log
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
