import nodemailer from 'nodemailer';
import prisma from './prisma';
import { format, isSameDay, nextDay, set, getDay, isTomorrow, isPast, differenceInCalendarDays } from 'date-fns';
import { nl } from 'date-fns/locale';
import { getISOWeek, getYear, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const TIMEZONE = 'Europe/Amsterdam';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

const EDGY_QUOTES = [
    "Geen gezeik, gewoon eten.",
    "Beter te dik in de kist dan weer een feestje gemist.",
    "Lunch is de enige reden dat ik opsta.",
    "Eet je broodje en hou je bek.",
    "Als je niet bestelt, heb je honger. Jouw probleem.",
    "Calorieën tellen is voor mietjes.",
    "Niet lullen, vullen.",
    "Je bent wat je eet. Wees geen pannenkoek.",
    "Honger is een keuze. Bestel gewoon.",
    "Werk hard, eet harder.",
    "Broodje eten, niet zeuren.",
    "Alles is te koop, behalve tijd. En uitverkochte broodjes.",
    "Eet als een baas.",
    "Deadline gemist? Honger lijden.",
    "Geen woorden maar broodjes.",
    "Eten is belangrijker dan je email.",
    "Voer troepen, geen discussies.",
    "Je maag boeit je deadline niet.",
    "Niet wachten, gewoon bestellen.",
    "Eet, werk, herhaal."
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

    const quote = EDGY_QUOTES[Math.floor(Math.random() * EDGY_QUOTES.length)];
    const topProducts = await getTopProductsHtml();

    const freshHtml = generateHtmlFromText(template ? template.bodyText : getDefaultEmailText(), quote, topProducts);

    return {
        subject: template ? template.subject : 'Deadline. Nu.',
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
 */
export async function getDeadlineInfo(): Promise<DeadlineInfo> {
    // Current time in Amsterdam
    const nowUtc = new Date();
    const nowZoned = toZonedTime(nowUtc, TIMEZONE);

    try {
        const weekId = `${getYear(nowZoned)}-${getISOWeek(nowZoned)}`;
        const period = await (prisma as any).orderPeriod.findUnique({
            where: { weekId }
        });

        if (period && period.deadline) {
            const deadlineUtc = new Date(period.deadline);
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
        }

        // Fallback to global setting
        const daySetting = await (prisma as any).globalSetting.findUnique({ where: { key: 'DEADLINE_DAY' } });
        const hourSetting = await (prisma as any).globalSetting.findUnique({ where: { key: 'DEADLINE_HOUR' } });
        const minuteSetting = await (prisma as any).globalSetting.findUnique({ where: { key: 'DEADLINE_MINUTE' } });

        if (daySetting && hourSetting) {
            const targetDay = parseInt(daySetting.value); // 1=Monday, 5=Friday
            const hour = parseInt(hourSetting.value);
            const minute = parseInt(minuteSetting?.value || '0');

            const currentDay = getDay(nowZoned); // 0=Sunday, 1=Monday based on local time

            const days = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
            let label = days[targetDay] || 'Vrijdag';

            // Fixed comparison logic
            // differenceInCalendarDays is better than custom math for "Next Day" logic
            // but here we just have a target day index (0-6)

            const isToday = currentDay === targetDay;
            // logic for tomorrow: (currentDay + 1) % 7 === targetDay
            const isTomorrow = (currentDay + 1) % 7 === targetDay;

            if (isToday) label = 'Vandaag';
            if (isTomorrow) label = 'Morgen';

            return {
                time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
                label,
                isToday,
                isTomorrow
            };
        }
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
    const senderName = process.env.SENDER_NAME || 'VH Engineering'; // Removed suffix

    // Construct the Minimalist Deadline HTML
    const deadlineHtml = `
        <div style="margin-top: 40px; border-top: 1px solid #E5E7EB; border-bottom: 1px solid #E5E7EB; padding: 24px 0; text-align: center;">
            <p style="margin: 0; color: #4B5563; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">DEADLINE ${deadlineInfo.label.toUpperCase()}</p>
            <div style="font-size: 48px; font-weight: 900; color: #111827; line-height: 1; margin: 12px 0;">${deadlineInfo.time}</div>
            <p style="margin: 0; color: #6B7280; font-size: 13px;">Niet vergeten. Gewoon doen.</p>
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
        let title = "Meest besteld vorige week";

        if (finalItems.length === 0) {
            title = "All-time favorieten";
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

        // Minimalist List Design
        return `
            <div style="margin-top: 40px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 16px 0; color: #111827; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #E5E7EB; display: inline-block; padding-bottom: 4px;">${title}</h4>
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    ${orderedProducts.map((p: any, index: number) => `
                        <tr>
                            <td style="padding-bottom: 8px;">
                                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                        <td style="padding: 12px 16px; width: 24px; text-align: left; font-size: 14px; color: #9CA3AF; font-weight: 600;">0${index + 1}</td>
                                        <td style="padding: 12px 0; vertical-align: middle;">
                                            <span style="font-weight: 600; color: #1F2937; font-size: 15px; display: block;">${p.name}</span>
                                        </td>
                                        <td style="padding: 12px 0; text-align: right; vertical-align: middle; white-space: nowrap;">
                                            <span style="color: #374151; font-size: 14px; font-weight: 600;">€ ${p.price.toFixed(2)}</span>
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
    return `Hey {{name}},
    
De deadline komt eraan. Bestel nu of heb honger. {{deadlineTime}}.

"{{quote}}"

Check wat anderen vreten onderaan deze mail.`.trim();
}

/**
 * Edgy/Minimalist HTML Generator
 */
export function generateHtmlFromText(text: string, quote?: string, topProductsHtml?: string): string {
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        return text.replace('{{quote}}', quote || '').replace('{{topProducts}}', topProductsHtml || '');
    }

    const contentHtml = text
        .split('\n\n')
        .map(para => `<p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">${para.replace(/\n/g, '<br>')}</p>`)
        .join('');

    const quoteHtml = quote ? `
        <div style="margin: 40px 0; padding: 24px; background-color: #F9FAFB; border-left: 4px solid #111827;">
            <p style="margin: 0; font-style: normal; color: #111827; font-weight: 600; font-size: 18px; line-height: 1.4; text-transform: uppercase;">"${quote.toUpperCase()}"</p>
        </div>
    ` : '';

    return `
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VH Engineering</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #ffffff; color: #111827;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; width: 100%;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 500px;">
                    
                    <!-- Minimalist Header -->
                    <tr>
                        <td style="padding: 0 0 40px 0; text-align: left; border-bottom: 2px solid #111827;">
                            <h1 style="margin: 0; color: #111827; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px;">VH Engineering</h1>
                            <p style="margin: 4px 0 0 0; color: #6B7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Lunch Service</p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 0;">
                            
                            <div style="color: #374151;">
                                ${contentHtml.replace('{{quote}}', '')}
                            </div>

                            ${quoteHtml}

                            <!-- Deadine Widget -->
                            {{deadlineWidget}}

                            ${topProductsHtml || ''}

                            <!-- CTA Button - Black & White -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 40px;">
                                <tr>
                                    <td align="center">
                                        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="display: block; background-color: #111827; color: #ffffff; text-decoration: none; padding: 20px 0; font-size: 14px; font-weight: 700; text-align: center; text-transform: uppercase; letter-spacing: 2px; border: 2px solid #111827; transition: all 0.2s;">
                                            Bestel Nu
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Minimal Footer -->
                    <tr>
                        <td style="padding: 40px 0; text-align: center; border-top: 1px solid #E5E7EB;">
                            <p style="margin: 0; color: #9CA3AF; font-size: 12px;">VH ENGINEERING © ${new Date().getFullYear()}</p>
                            <div style="margin-top: 12px;">
                                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings" style="color: #6B7280; text-decoration: none; font-size: 12px; font-weight: 500;">INSTELLINGEN</a>
                            </div>
                        </td>
                    </tr>
                </table>

            </td>
        </tr>
    </table>
</body>
</html>`.trim();
}



