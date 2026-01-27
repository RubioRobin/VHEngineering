import { NextResponse } from 'next/server';
import { sendReminderToAll, getDeadlineInfo } from '@/lib/email';
import prisma from '@/lib/prisma';
import { getCurrentOrderPeriod, checkAndCloseExpiredPeriods } from '@/lib/orderPeriod';
import { toZonedTime } from 'date-fns-tz';
import { format, differenceInHours, subHours, isAfter } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        // Authenticate Cron Request
        const authHeader = request.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // 0. Auto-archive any expired periods
        await checkAndCloseExpiredPeriods();



        // 1. Get or create current week period
        const period = await getCurrentOrderPeriod();

        if (!period) {
            return NextResponse.json({ message: 'No active period' });
        }

        if (period.reminderSent) {
            return NextResponse.json({ message: 'Reminder already sent' });
        }

        // 2. Check if TODAY (in Amsterdam) is the deadline day
        const TIMEZONE = 'Europe/Amsterdam';
        const nowZoned = toZonedTime(new Date(), TIMEZONE);
        const deadlineZoned = toZonedTime(new Date(period.deadline), TIMEZONE);

        const isSameDay = format(nowZoned, 'yyyy-MM-dd') === format(deadlineZoned, 'yyyy-MM-dd');

        if (isSameDay) {


            // 3. Send Emails
            const result = await sendReminderToAll();

            // 4. Mark as sent
            await (prisma as any).orderPeriod.update({
                where: { id: period.id },
                data: { reminderSent: true }
            });

            return NextResponse.json({
                success: true,
                message: 'Reminders sent successfully for deadline day',
                result
            });
        } else {

            return NextResponse.json({
                message: 'Not deadline day',
                deadline: deadlineZoned.toISOString(),
                today: nowZoned.toISOString()
            });
        }

    } catch (error: any) {
        console.error('Cron job failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
