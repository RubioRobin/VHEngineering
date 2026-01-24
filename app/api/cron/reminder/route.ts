import { NextResponse } from 'next/server';
import { sendReminderToAll, getDeadlineTime } from '@/lib/email';
import prisma from '@/lib/prisma';
import { getISOWeek, getYear, differenceInHours, subHours, isAfter } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        // Authenticate Cron Request
        const authHeader = request.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        console.log('[Cron] Starting hourly check...');

        // 1. Get current week period
        const weekId = `${getYear(new Date())}-${getISOWeek(new Date())}`;
        const period = await (prisma as any).orderPeriod.findUnique({
            where: { weekId }
        });

        if (!period) {
            console.log('[Cron] No active period for this week.');
            return NextResponse.json({ message: 'No active period' });
        }

        if (period.reminderSent) {
            console.log('[Cron] Reminder already sent for this period.');
            return NextResponse.json({ message: 'Reminder already sent' });
        }

        // 2. Check Time Condition (Now >= Deadline - 4 hours)
        const deadline = new Date(period.deadline);
        const triggerTime = subHours(deadline, 4);
        const now = new Date();

        console.log(`[Cron] Check: Now(${now.toISOString()}) >= Trigger(${triggerTime.toISOString()})?`);

        if (isAfter(now, triggerTime) && now < deadline) {
            console.log('[Cron] ⏰ It is time! 4 hours or less before deadline.');

            // 3. Send Emails
            const result = await sendReminderToAll();

            // 4. Mark as sent
            await (prisma as any).orderPeriod.update({
                where: { id: period.id },
                data: { reminderSent: true }
            });

            return NextResponse.json({
                success: true,
                message: 'Reminders sent successfully',
                result
            });
        } else {
            console.log('[Cron] Not yet time to send.');
            return NextResponse.json({
                message: 'Not within 4 hour window yet',
                deadline: deadline.toISOString(),
                triggerTime: triggerTime.toISOString(),
                now: now.toISOString()
            });
        }

    } catch (error: any) {
        console.error('Cron job failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
