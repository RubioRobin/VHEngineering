import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateHtmlFromText, getDefaultEmailText } from '@/lib/email';

// GET - Fetch email template
export async function GET() {
    try {
        const template = await (prisma as any).emailTemplate.findFirst({
            where: { name: 'reminder_email' }
        });

        // Return default template if none exists
        if (!template) {
            return NextResponse.json({
                template: {
                    name: 'reminder_email',
                    subject: '🍞 Vergeet niet te bestellen!',
                    bodyHtml: generateHtmlFromText(getDefaultEmailText()),
                    bodyText: getDefaultEmailText(),
                    isActive: true
                }
            });
        }

        return NextResponse.json({ template });
    } catch (error) {
        console.error('Error fetching template:', error);
        return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
    }
}

// POST - Create or update email template
export async function POST(request: Request) {
    try {
        const { subject, bodyText } = await request.json();

        if (!subject || !bodyText) {
            return NextResponse.json({
                error: 'Subject and bodyText are required'
            }, { status: 400 });
        }

        // Generate the HTML version automatically based on the text
        const bodyHtml = generateHtmlFromText(bodyText);

        // Upsert the reminder email template
        const template = await (prisma as any).emailTemplate.upsert({
            where: { name: 'reminder_email' },
            update: {
                subject,
                bodyHtml,
                bodyText
            },
            create: {
                name: 'reminder_email',
                subject,
                bodyHtml,
                bodyText
            }
        });

        return NextResponse.json({ template });
    } catch (error) {
        console.error('Error saving template:', error);
        return NextResponse.json({ error: 'Failed to save template' }, { status: 500 });
    }
}
