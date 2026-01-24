import { NextResponse } from 'next/server';
import { sendReminderToAll } from '@/lib/email';

// POST - Send test email to all active subscribers
export async function POST() {
    console.log('[TestEmail] Starting request...');
    try {
        // Check if API key is configured
        if (!process.env.RESEND_API_KEY) {
            console.error('[TestEmail] Missing RESEND_API_KEY');
            return NextResponse.json({
                success: false,
                error: 'Resend API key not configured in .env'
            }, { status: 400 }); // 400 instead of 500 to avoid some client network error interpretations
        }

        console.log('[TestEmail] Key found, sending...');
        const result = await sendReminderToAll();
        console.log('[TestEmail] Result:', result);

        if (result.sent === 0 && result.total === 0) {
            return NextResponse.json({
                success: true,
                message: 'Geen actieve ontvangers gevonden. Voeg eerst emails toe.'
            });
        }

        return NextResponse.json({
            success: true,
            message: `Verzonden naar ${result.sent} van de ${result.total} adressen`,
            sent: result.sent,
            failed: result.failed,
            total: result.total,
            details: result.results
        });
    } catch (error: any) {
        console.error('[TestEmail] Critical error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Interne server fout bij versturen'
        }, { status: 500 });
    }
}

