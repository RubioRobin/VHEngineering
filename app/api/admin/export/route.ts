import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { generateOrdersExcel } from '@/lib/excel';
import { getCurrentPeriodId } from '@/lib/orderPeriod';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/export
 * Generate and download Excel file (admin only)
 * TESTING MODE: Auth disabled
 */
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!checkAdminAuth(authHeader)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const searchParams = request.nextUrl.searchParams;
        const periodId = searchParams.get('period') || await getCurrentPeriodId();

        const buffer = await generateOrdersExcel(periodId);

        return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="bestellingen-${periodId}.xlsx"`,
            },
        });
    } catch (error) {
        console.error('Error generating Excel:', error);
        return NextResponse.json(
            { error: 'Failed to generate Excel file' },
            { status: 500 }
        );
    }
}
