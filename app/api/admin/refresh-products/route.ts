import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { runScraper } from '@/lib/scraper';

/**
 * POST /api/admin/refresh-products
 * Manually trigger product scraping (admin only)
 * TESTING MODE: Auth disabled
 */
export async function POST(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!checkAdminAuth(authHeader)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await runScraper();

        if (result.success) {
            return NextResponse.json({
                message: result.message,
                count: result.count,
            });
        } else {
            // Return the specific error message from the scraper (e.g. "No products found", "Browser failed")
            return NextResponse.json(
                { error: result.message },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error refreshing products:', error);
        return NextResponse.json(
            { error: 'Failed to refresh products' },
            { status: 500 }
        );
    }
}
