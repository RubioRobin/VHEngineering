import { NextResponse } from 'next/server';
import { sendReminderToAll, getDeadlineInfo } from '@/lib/email';
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



        // 1. Get current week period
        const weekId = `${getYear(new Date())}-${getISOWeek(new Date())}`;
        const period = await (prisma as any).orderPeriod.findUnique({
            where: { weekId }
        });

        if (!period) {

            return NextResponse.json({ message: 'No active period' });
        }

        if (period.reminderSent) {

            return NextResponse.json({ message: 'Reminder already sent' });
        }

        // 2. Check if TODAY is the deadline day
        const today = new Date();
        const deadline = new Date(period.deadline);

        const isSameDay = today.getFullYear() === deadline.getFullYear() &&
            today.getMonth() === deadline.getMonth() &&
            today.getDate() === deadline.getDate();



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
                deadline: deadline.toISOString(),
                today: today.toISOString()
            });
        }

    } catch (error: any) {
        console.error('Cron job failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
