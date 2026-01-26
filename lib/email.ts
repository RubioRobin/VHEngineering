import nodemailer from 'nodemailer';
import prisma from './prisma';
import { format, isSameDay, nextDay, set, getDay, isTomorrow, isPast, differenceInCalendarDays } from 'date-fns';
import { nl } from 'date-fns/locale';
import { getISOWeek, getYear, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { getNextDeadline } from './orderPeriod';

const TIMEZONE = 'Europe/Amsterdam';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

// Professional / Friendly closings or subtitles
const SUBTITLES = [
    "Vergeet niet je bestelling te plaatsen voor de deadline.",
    "De keuken staat klaar voor een verse lunch.",
    "Geniet van een gezonde en lekkere pauze.",
    "Bestel op tijd en vermijd teleurstelling.",
    "Een goede lunch geeft energie voor de rest van de dag."
];

/**
 * Get the active reminder email template
 */
export async function getReminderTemplate() {
    const template = await (prisma as any).emailTemplate.findFirst({
        where: {
            name: 'reminder_email',
            isActive: true
        }
    });

    // Use a random professional subtitle instead of a "quote"
    const subtitle = SUBTITLES[Math.floor(Math.random() * SUBTITLES.length)];
    const topProducts = await getTopProductsHtml();

    const freshHtml = generateHtmlFromText(template ? template.bodyText : getDefaultEmailText(), subtitle, topProducts);

    return {
        subject: template ? template.subject : 'Plaats je lunchbestelling',
        bodyHtml: freshHtml,
        bodyText: template ? template.bodyText : getDefaultEmailText()
    };
}

interface DeadlineInfo {
    time: string;
    label: string;
    isTomorrow: boolean;
    isToday: boolean;
}

/**
 * Get detailed deadline info (time + day context)
 * NOW USES EXACT SAME LOGIC AS FRONTEND (getNextDeadline)
 */
export async function getDeadlineInfo(): Promise<DeadlineInfo> {
    // Current time in Amsterdam
    const nowUtc = new Date();
    const nowZoned = toZonedTime(nowUtc, TIMEZONE);

    try {
        // Use the EXACT same calculation as the frontend/API
        // This ensures 1-to-1 consistency
        const deadlineUtc = await getNextDeadline();
        const deadlineZoned = toZonedTime(deadlineUtc, TIMEZONE);

        const timeStr = format(deadlineZoned, 'HH:mm');

        let label = format(deadlineZoned, 'EEEE', { locale: nl }); // e.g. "vrijdag"

        // Compare calendar days in the correct timezone
        const diffDays = differenceInCalendarDays(deadlineZoned, nowZoned);

        const isToday = diffDays === 0;
        const isTomorrow = diffDays === 1;

        if (isToday) label = 'Vandaag';
        else if (isTomorrow) label = 'Morgen';

        // Capitalize
        label = label.charAt(0).toUpperCase() + label.slice(1);

        return { time: timeStr, label, isToday, isTomorrow };

    } catch (e) {
        console.error('Error fetching deadline info:', e);
    }

    return { time: '14:00', label: 'Vandaag', isToday: true, isTomorrow: false };
}

/**
 * Send reminder email to a single recipient
 */
export async function sendReminderEmail(
    email: string,
    name?: string,
    context?: { template: any, deadlineInfo: DeadlineInfo }
) {
    let template = context?.template;
    let deadlineInfo = context?.deadlineInfo;

    if (!template) template = await getReminderTemplate();
    if (!deadlineInfo) deadlineInfo = await getDeadlineInfo();

    const senderEmail = process.env.SENDER_EMAIL || 'onboarding@resend.dev';
    const senderName = process.env.SENDER_NAME || 'VH Engineering';

    // Construct the Professional Deadline Widget
    // Clean, light gray background, clear dark text, side highlight
    const deadlineHtml = `
        <div style="margin: 32px 0; background-color: #F8FAFC; border-left: 4px solid #4F46E5; padding: 20px; border-radius: 4px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td>
                        <p style="margin: 0; color: #64748B; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Deadline ${deadlineInfo.label}</p>
                        <p style="margin: 4px 0 0 0; color: #0F172A; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">${deadlineInfo.time}</p>
                    </td>
                    <td align="right" style="vertical-align: middle;">
                         <span style="background-color: #EEF2FF; color: #4F46E5; padding: 6px 12px; border-radius: 99px; font-size: 12px; font-weight: 600;">Vergeet het niet</span>
                    </td>
                </tr>
            </table>
        </div>
    `;

    // Replace placeholders
    const personalizedHtml = template.bodyHtml
        .replace(/\{\{name\}\}/g, name || 'collega')
        .replace(/\{\{email\}\}/g, email)
        .replace(/\{\{deadlineWidget\}\}/g, deadlineHtml)
        .replace(/\{\{deadlineTime\}\}/g, deadlineInfo.time);

    const personalizedText = template.bodyText
        .replace(/\{\{name\}\}/g, name || 'collega')
        .replace(/\{\{email\}\}/g, email)
        .replace(/\{\{deadlineTime\}\}/g, deadlineInfo.time);

    try {
        const info = await transporter.sendMail({
            from: `"${senderName}" <${senderEmail}>`,
            to: email,
            subject: template.subject,
            html: personalizedHtml,
            text: personalizedText,
        });

        console.log(`Email sent successfully to ${email}:`, info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error: any) {
        console.error(`Error sending email to ${email}:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Fetch top 3 products
 */
async function getTopProductsHtml(): Promise<string> {
    try {
        const today = new Date();
        const lastWeekDate = subWeeks(today, 1);
        const startDate = startOfWeek(lastWeekDate, { weekStartsOn: 1 });
        const endDate = endOfWeek(lastWeekDate, { weekStartsOn: 1 });

        const topItems = await (prisma as any).orderItem.groupBy({
            by: ['productId'],
            where: {
                order: {
                    createdAt: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            },
            _count: { productId: true },
            orderBy: { _count: { productId: 'desc' } },
            take: 3
        });

        let finalItems = topItems;
        let title = "Favorieten van vorige week";

        if (finalItems.length === 0) {
            title = "Onze aanraders";
            finalItems = await (prisma as any).orderItem.groupBy({
                by: ['productId'],
                _count: { productId: true },
                orderBy: { _count: { productId: 'desc' } },
                take: 3
            });
        }

        if (finalItems.length === 0) return '';

        const productIds = finalItems.map((item: any) => item.productId);
        const products = await (prisma as any).product.findMany({
            where: { id: { in: productIds } }
        });

        const orderedProducts = finalItems
            .map((item: any) => products.find((p: any) => p.id === item.productId))
            .filter(Boolean);

        // Professional List Design
        // Compact, side-by-side if possible or clean rows
        return `
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #E2E8F0;">
                <h4 style="margin: 0 0 16px 0; color: #475569; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">${title}</h4>
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    ${orderedProducts.map((p: any) => `
                        <tr>
                            <td style="padding-bottom: 8px;">
                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                        <td style="padding: 8px 0; vertical-align: middle;">
                                            <span style="font-weight: 500; color: #1E293B; font-size: 14px; display: block;">${p.name}</span>
                                        </td>
                                        <td style="padding: 8px 0; text-align: right; vertical-align: middle; white-space: nowrap;">
                                            <span style="color: #64748B; font-size: 14px; font-weight: 400;">€ ${p.price.toFixed(2)}</span>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    `).join('')}
                </table>
            </div>
        `;
    } catch (e) {
        console.error('Error fetching top products for email:', e);
        return '';
    }
}

export async function sendReminderToAll() {
    const subscribers = await (prisma as any).emailSubscriber.findMany({ where: { active: true } });
    if (subscribers.length === 0) return { success: true, sent: 0, failed: 0, results: [] };

    const [template, deadlineInfo] = await Promise.all([
        getReminderTemplate(),
        getDeadlineInfo()
    ]);

    const promiseResults = await Promise.all(
        subscribers.map((subscriber: any) =>
            sendReminderEmail(subscriber.email, subscriber.name || undefined, { template, deadlineInfo })
                .then(res => ({ email: subscriber.email, ...res }))
        )
    );

    const sent = promiseResults.filter((r: any) => r.success).length;
    const failed = promiseResults.filter((r: any) => !r.success).length;
    return { success: true, sent, failed, total: subscribers.length, results: promiseResults };
}


/**
 * Default plain text email template
 */
export function getDefaultEmailText(): string {
    return `Beste {{name}},
    
Dit is u herinnering om uw lunchbestelling te plaatsen. De deadline is {{deadlineTime}}.

{{quote}}

We zien uw bestelling graag tegemoet.`.trim();
}

/**
 * Professional/Clean HTML Generator
 */
export function generateHtmlFromText(text: string, subtitle?: string, topProductsHtml?: string): string {
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        return text.replace('{{quote}}', subtitle || '').replace('{{topProducts}}', topProductsHtml || '');
    }

    const contentHtml = text
        .split('\n\n')
        .map(para => `<p style="margin: 0 0 16px 0; color: #475569; font-size: 15px; line-height: 1.6;">${para.replace(/\n/g, '<br>')}</p>`)
        .join('');

    return `
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VH Engineering</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; background-color: #F8FAFC; color: #1E293B;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F8FAFC; width: 100%;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 540px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); overflow: hidden;">
                    
                    <!-- Professional Header with Indigo accent -->
                    <tr>
                        <td style="padding: 32px 32px 0 32px;">
                            <h1 style="margin: 0; color: #0F172A; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">VH Engineering</h1>
                            <p style="margin: 4px 0 0 0; color: #64748B; font-size: 14px; font-weight: 500;">Lunch Service</p>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 32px;">
                            
                            <div style="color: #334155;">
                                ${contentHtml.replace('{{quote}}', '')}
                            </div>

                            <!-- Dynamic Deadline Widget -->
                            {{deadlineWidget}}

                            <!-- Subtitle/Tip (Previously Quote) -->
                            ${subtitle ? `
                                <div style="margin: 24px 0; padding: 16px; background-color: #F1F5F9; border-radius: 8px;">
                                    <p style="margin: 0; color: #475569; font-size: 14px; font-style: italic;">${subtitle}</p>
                                </div>
                            ` : ''}

                            ${topProductsHtml || ''}

                            <!-- CTA Button - Professional Indigo -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 32px;">
                                <tr>
                                    <td>
                                        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="display: inline-block; background-color: #4F46E5; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 14px; font-weight: 600; text-align: center; transition: background-color 0.2s;">
                                            Bestelling Plaatsen
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Quiet Footer -->
                    <tr>
                        <td style="padding: 24px 32px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; text-align: left;">
                            <p style="margin: 0; color: #94A3B8; font-size: 12px;">© ${new Date().getFullYear()} VH Engineering</p>
                            <div style="margin-top: 8px;">
                                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings" style="color: #64748B; text-decoration: none; font-size: 12px; font-weight: 500;">Meldingen beheren</a>
                            </div>
                        </td>
                    </tr>
                </table>

                <!-- Helper Text outside card -->
                 <p style="margin-top: 24px; color: #94A3B8; font-size: 12px; text-align: center;">Dit is een automatisch bericht.</p>

            </td>
        </tr>
    </table>
</body>
</html>`.trim();
}



