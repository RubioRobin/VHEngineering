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

    const topProducts = await getTopProductsHtml();

    const freshHtml = generateHtmlFromText(template ? template.bodyText : getDefaultEmailText(), undefined, topProducts);

    return {
        subject: template ? template.subject : '🔥 BESTEL NU! Deadline nadert.',
        bodyHtml: freshHtml,
        bodyText: template ? template.bodyText : getDefaultEmailText()
    };
}

interface DeadlineInfo {
    time: string;
    label: string;
    isTomorrow: boolean;
    isToday: boolean;
    fullDate: string;
}

/**
 * Get detailed deadline info (time + day context)
 * Use the EXACT same calculation as the frontend/API
 */
export async function getDeadlineInfo(): Promise<DeadlineInfo> {
    // Current time in Amsterdam
    const nowUtc = new Date();
    const nowZoned = toZonedTime(nowUtc, TIMEZONE);

    try {
        // Use the EXACT same calculation as the frontend/API
        const deadlineUtc = await getNextDeadline();
        const deadlineZoned = toZonedTime(deadlineUtc, TIMEZONE);

        const timeStr = format(deadlineZoned, 'HH:mm');
        const fullDate = format(deadlineZoned, "EEEE d MMMM", { locale: nl });

        let label = format(deadlineZoned, 'EEEE', { locale: nl }); // e.g. "vrijdag"

        // Compare calendar days in the correct timezone
        const diffDays = differenceInCalendarDays(deadlineZoned, nowZoned);

        const isToday = diffDays === 0;
        const isTomorrow = diffDays === 1;

        if (isToday) label = 'VANDAAG';
        else if (isTomorrow) label = 'MORGEN';
        else label = label.toUpperCase();

        return { time: timeStr, label, isToday, isTomorrow, fullDate: fullDate.charAt(0).toUpperCase() + fullDate.slice(1) };

    } catch (e) {
        console.error('Error fetching deadline info:', e);
        // Fallback to safe defaults to prevent crash
        return {
            time: '00:00',
            label: 'VANDAAG',
            isToday: true,
            isTomorrow: false,
            fullDate: 'Vandaag'
        };
    }

    return { time: '14:00', label: 'VANDAAG', isToday: true, isTomorrow: false, fullDate: 'Vandaag' };
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

    // Construct the "Blue Timer" Card (Gradient) Matches image provided
    // Gradient: indigo-purple (#4f46e5 -> #7c3aed to match website 'primary' glow)
    const deadlineHtml = `
        <div style="margin: 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); background-color: #4f46e5; border-radius: 12px; color: #ffffff; overflow: hidden;">
                <tr>
                    <td style="padding: 24px;">
                        
                        <!-- Header: Icon + Is Closing -->
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td style="vertical-align: middle; width: 24px; padding-right: 8px;">
                                     <!-- Clock Icon (simulated with emoji or image, emoji safest for now) -->
                                     <span style="font-size: 16px;">⏱️</span>
                                </td>
                                <td style="vertical-align: middle;">
                                    <p style="margin: 0; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 700; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px;">
                                        BESTELLEN SLUIT ${deadlineInfo.label}
                                    </p>
                                </td>
                            </tr>
                        </table>

                        <!-- Big Time -->
                        <p style="margin: 12px 0 8px 0; font-family: 'Outfit', sans-serif; font-size: 48px; font-weight: 800; line-height: 1; letter-spacing: -1px;">
                            ${deadlineInfo.time}
                        </p>

                        <!-- Footer: Full Date -->
                        <p style="margin: 0; font-family: 'Outfit', sans-serif; font-size: 14px; opacity: 0.8; font-weight: 500;">
                            Deadline: ${deadlineInfo.fullDate}
                        </p>

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
        // Always use the requested title "DIT WAREN DE POPULAIRSTE BROODJES..."
        // Even if we fall back to all-time data, this header is what the user wants to see.
        let title = "DIT WAREN DE POPULAIRSTE BROODJES AFGELOPEN WEEK";

        if (finalItems.length === 0) {
            // title = "ONZE AANRADERS"; <--- THE BUG. User wants "Populairste", not "Aanraders".
            // We keep the title consistent or slightly adjusted but definitely NOT "Onze aanraders" if that's what they dislike.
            // If strictly 'last week' is empty, we might want to drop "AFGELOPEN WEEK" to be accurate, 
            // BUT user asked for "iets in de trend van dit waren de populairste broodjes afgelopen week"
            // So we stick to "POPULAIRSTE BROODJES" or just keep the long one.
            // Let's stick to the requested text or close to it.

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
        return `
            <div style="margin-top: 40px;">
                <h4 style="margin: 0 0 20px 0; color: #64748B; font-family: 'Outfit', sans-serif; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${title}</h4>
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    ${orderedProducts.map((p: any) => `
                        <tr>
                            <td style="padding-bottom: 12px;">
                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                        <td style="padding: 0 0; vertical-align: middle;">
                                            <span style="font-family: 'Outfit', sans-serif; font-weight: 500; color: #1E293B; font-size: 15px; display: block;">${p.name}</span>
                                        </td>
                                        <td style="padding: 0 0; text-align: right; vertical-align: middle; white-space: nowrap;">
                                            <span style="font-family: 'Outfit', sans-serif; color: #64748B; font-size: 14px; font-weight: 500;">€ ${p.price.toFixed(2)}</span>
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
    
Dit is u herinnering om uw broodjes te bestellen. De deadline is {{deadlineTime}}.

We zien uw bestelling graag tegemoet.`.trim();
}

/**
 * Card Design HTML Generator
 */
export function generateHtmlFromText(text: string, subtitle?: string, topProductsHtml?: string): string {
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        return text.replace('{{quote}}', subtitle || '').replace('{{topProducts}}', topProductsHtml || '');
    }

    const contentHtml = text
        .split('\n\n')
        .map(para => `<p style="margin: 0 0 16px 0; color: #334155; font-family: 'Outfit', sans-serif; font-size: 15px; line-height: 1.6;">${para.replace(/\n/g, '<br>')}</p>`)
        .join('');

    return `
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VH Engineering</title>
    <!-- Import Google Font Outfit -->
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;800&display=swap" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;800&display=swap');
        body { font-family: 'Outfit', sans-serif; }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; color: #1E293B;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F8FAFC; width: 100%;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                
                <!-- Main Card with Rounded Corners -->
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 500px; background-color: #ffffff; border-radius: 20px; box-shadow: 0 8px 12px -2px rgba(0, 0, 0, 0.05); overflow: hidden;">
                    <tr>
                        <td style="padding: 40px;">
                            
                            <!-- Header Code -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td>
                                        <h1 style="margin: 0; font-family: 'Outfit', sans-serif; color: #0F172A; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">VH ENGINEERING</h1>
                                        <p style="margin: 4px 0 0 0; font-family: 'Outfit', sans-serif; color: #64748B; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">BROODJES SERVICE</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Body Content -->
                            <div style="margin-top: 32px; color: #334155;">
                                ${contentHtml.replace('{{quote}}', '')}
                            </div>

                            <!-- Blue Timer Gradient Deadline Widget -->
                            {{deadlineWidget}}

                            ${topProductsHtml || ''}

                            <!-- CTA Button - Centered Bottom -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 40px;">
                                <tr>
                                    <td align="center">
                                        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="display: inline-block; background-color: #4F46E5; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-family: 'Outfit', sans-serif; font-size: 16px; font-weight: 700; text-align: center; transition: background-color 0.2s; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
                                            Bestelling Plaatsen
                                        </a>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>
                </table>

                <!-- Helper Text outside card -->
                 <p style="margin-top: 24px; font-family: 'Outfit', sans-serif; color: #94A3B8; font-size: 14px; text-align: center; font-style: italic;">Alvast eet smakelijk!</p>

            </td>
        </tr>
    </table>
</body>
</html>`.trim();
}



