import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkAdminAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/sources
 * List all scraping sources
 */
export async function GET(request: NextRequest) {
    try {
        const sources = await (prisma as any).scraperSource.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({ sources });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * POST /api/admin/sources
 * Add a new scraping source
 */
export async function POST(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!checkAdminAuth(authHeader)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { url, name } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is verplicht' }, { status: 400 });
        }

        const source = await (prisma as any).scraperSource.upsert({
            where: { url },
            update: { name, isActive: true },
            create: { url, name }
        });

        return NextResponse.json(source);
    } catch (error) {
        return NextResponse.json({ error: 'Fout bij opslaan bron' }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/sources
 * Remove a scraping source
 */
export async function DELETE(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!checkAdminAuth(authHeader)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'ID is verplicht' }, { status: 400 });
        }

        await (prisma as any).scraperSource.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Fout bij verwijderen bron' }, { status: 500 });
    }
}
