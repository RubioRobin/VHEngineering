import { NextResponse } from 'next/server';
import { generateOrdersExcel } from '@/lib/excel';
import { getISOWeek } from 'date-fns';
import { getCurrentPeriodId } from '@/lib/orderPeriod';

export const dynamic = 'force-dynamic'; // Ensure no caching

export async function GET() {
    try {
        const weekId = await getCurrentPeriodId();
        const buffer = await generateOrdersExcel(weekId);

        return new NextResponse(new Uint8Array(buffer), {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="Bestellijst_Week_${getISOWeek(new Date())}.xlsx"`,
            },
        });
    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json({ error: 'Failed to generate export' }, { status: 500 });
    }
}
