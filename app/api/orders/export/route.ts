import { NextResponse } from 'next/server';
import { generateOrdersExcel } from '@/lib/excel';
import { getISOWeek, getYear } from 'date-fns';

export const dynamic = 'force-dynamic'; // Ensure no caching

const getCurrentWeekId = () => {
    const now = new Date();
    return `${getYear(now)}-${getISOWeek(now)}`;
};

export async function GET() {
    try {
        const weekId = getCurrentWeekId();
        const buffer = await generateOrdersExcel(weekId);

        return new NextResponse(buffer as unknown as BodyInit, {
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
