import nodemailer from 'nodemailer';
import prisma from './prisma';
import { format, isSameDay, nextDay, set, getDay } from 'date-fns';
import { nl } from 'date-fns/locale';
import { getISOWeek, getYear, startOfWeek, endOfWeek, subWeeks } from 'date-fns';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

const FUN_QUOTES = [
    "Broodje aap? Nee, lekker vers!",
    "Life is like a sandwich, you have to fill it with the best ingredients.",
    "Beter een broodje in de hand dan tien in de lucht.",
    "Lunch is de belangrijkste maaltijd tussen ontbijt en diner.",
    "Keep calm and eat a sandwich.",
    "A balanced diet is a sandwich in each hand.",
    "Happiness is a warm sandwich.",
    "Tijd voor broodnodige versterking!",
    "Make sandwiches, not war.",
    "Een dag niet geluncht is een dag niet geleefd.",
    "Sandwiches are wonderful. You don't need a spoon or a plate!",
    "Ask not what you can do for your country. Ask what's for lunch.",
    "Powered by bread.",
    "You can't buy happiness, but you can buy a sandwich.",
    "All you need is love and a good sandwich.",
    "De beste ideeën komen na de lunch.",
    "Honger maakt rauwe bonen zoet, maar broodjes smaken beter.",
    "Het leven is beter met kaas.",
    "Don't worry, eat veggie.",
    "Verser dan dit wordt het niet."
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

    // Always force the new Premium design
    const quote = FUN_QUOTES[Math.floor(Math.random() * FUN_QUOTES.length)];
    const topProducts = await getTopProductsHtml();

    // The logic here is tricky because we need the deadline info *before* generating HTML
    // But getDeadlineInfo is async.
    // Ideally we pass the raw template text and let sendReminderEmail inject everything.
    // However, generateHtmlFromText constructs the whole HTML structure.
    // We will inject a placeholder {{deadlineHtml}} which we will generate and replace later, 
    // OR we simply generate the deadline HTML here if we can.

    // Let's rely on sendReminderEmail to do the heavy lifting of replacements.
    // But we need the structure.

    // We will return the raw parts needed.
    // The "bodyHtml" returned here is used as a base. 
    // We'll update generateHtmlFromText to accept placeholders.

    const freshHtml = generateHtmlFromText(template ? template.bodyText : getDefaultEmailText(), quote, topProducts);

    return {
        subject: template ? template.subject : '🍞 De lunch-klok tikt!',
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
    const now = new Date();

    try {
        const weekId = `${getYear(now)}-${getISOWeek(now)}`;
        const period = await (prisma as any).orderPeriod.findUnique({
            where: { weekId }
        });

        if (period && period.deadline) {
            const date = new Date(period.deadline);
            const timeStr = format(date, 'HH:mm');

            let label = format(date, 'EEEE', { locale: nl }); // e.g. "vrijdag"
            const isToday = isSameDay(date, now);
            const isTomorrow = isSameDay(date, new Date(now.getTime() + 86400000));

            if (isToday) label = 'Vandaag';
            if (isTomorrow) label = 'Morgen';

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

            let targetDate = new Date();
            const currentDay = getDay(targetDate); // 0=Sunday, 1=Monday

            // If today is past the target day (or same day but past time), assume next week? 
            // For simplicity, we just find the next occurrence of this day.
            // Actually, usually this email is sent *before* the deadline.

            if (currentDay === targetDay) {
                // It's today
                // Check if time passed? Assume it's today's deadline.
            } else {
                // Calculate date of next targetDay
                // If it's Thursday (4) and we want Friday (5) -> +1 day
                // If it's Friday (5) and we want Monday (1) -> +3 days
                // helpers like date-fns nextDay are useful if imported, or just basic math
                // We'll use a simple approximation for the label
            }

            const days = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
            let label = days[targetDay] || 'Vrijdag';

            // Refine label if it's today/tomorrow
            if (currentDay === targetDay) label = 'Vandaag';
            if ((currentDay + 1) % 7 === targetDay) label = 'Morgen';

            return {
                time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
                label,
                isToday: label === 'Vandaag',
                isTomorrow: label === 'Morgen'
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
    const senderName = process.env.SENDER_NAME || 'VH Engineering - Broodjes Bestellen';

    // Construct the Deadline HTML Snippet (Website Style)
    // Matches DashboardCard: White bg, border, clean text. indigo/primary accents.
    const deadlineHtml = `
        <div style="margin-top: 32px; background-color: #ffffff; border: 1px solid #E5E7EB; border-radius: 16px; padding: 24px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <p style="margin: 0; color: #6B7280; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Deadline ${deadlineInfo.label}</p>
            <div style="font-size: 42px; font-weight: 800; color: #4F46E5; line-height: 1.1; margin: 8px 0;">${deadlineInfo.time}</div>
            <p style="margin: 0; color: #4B5563; font-size: 14px;">Niet vergeten!</p>
        </div>
    `;

    // Replace placeholders
    const personalizedHtml = template.bodyHtml
        .replace(/\{\{name\}\}/g, name || 'collega')
        .replace(/\{\{email\}\}/g, email)
        .replace(/\{\{deadlineWidget\}\}/g, deadlineHtml) // Inject the widget
        // Fallbacks for legacy templates that might use old keys
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
 * Fetch top 3 products FROM LAST WEEK and format as Premium HTML cards
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
        let title = "🏆 Top 3 van Vorige Week";

        if (finalItems.length === 0) {
            title = "🔥 All-time Favorieten";
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

        // Updated for "Website Aesthetic"
        // Clean white cards, subtle borders, indigo price tag
        return `
            <div style="margin-top: 40px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 20px 0; color: #111827; font-size: 18px; font-weight: 700; text-align: center;">${title}</h4>
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    ${orderedProducts.map((p: any, index: number) => `
                        <tr>
                            <td style="padding-bottom: 12px;">
                                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 16px; border: 1px solid #E5E7EB; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);">
                                    <tr>
                                        <td style="padding: 16px; width: 40px; text-align: center; font-size: 20px; color: #4F46E5; font-weight: 800;">
                                            #${index + 1}
                                        </td>
                                        <td style="padding: 16px 8px; vertical-align: middle;">
                                            <span style="font-weight: 600; color: #1F2937; font-size: 15px; display: block;">${p.name}</span>
                                            ${p.description ? `<span style="font-size: 13px; color: #6B7280; display: block; margin-top: 2px;">${p.description.substring(0, 50)}${p.description.length > 50 ? '...' : ''}</span>` : ''}
                                        </td>
                                        <td style="padding: 16px; text-align: right; vertical-align: middle; white-space: nowrap;">
                                            <span style="background-color: #EEF2FF; color: #4F46E5; padding: 6px 12px; border-radius: 99px; font-size: 13px; font-weight: 700;">€ ${p.price.toFixed(2)}</span>
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

export function generateHtmlFromText(text: string, quote?: string, topProductsHtml?: string): string {
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        return text.replace('{{quote}}', quote || '').replace('{{topProducts}}', topProductsHtml || '');
    }

    const contentHtml = text
        .split('\n\n')
        .map(para => `<p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.7;">${para.replace(/\n/g, '<br>')}</p>`)
        .join('');

    const quoteHtml = quote ? `
        <div style="margin: 0 0 40px 0; text-align: center;">
            <p style="margin: 0; font-style: italic; color: #6B7280; font-weight: 500; font-size: 16px; line-height: 1.6;">"${quote}"</p>
        </div>
    ` : '';

    return `
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Broodjes Bestellen</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F9FAFB; color: #1F2937;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F9FAFB; width: 100%;">
        <tr>
            <td align="center" style="padding: 60px 20px;">
                
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 0 0 40px 0; text-align: center;">
                            <h1 style="margin: 0; color: #111827; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Lunch Time!</h1>
                            <p style="margin: 8px 0 0 0; color: #6B7280; font-size: 16px;">Vergeet je broodje niet</p>
                        </td>
                    </tr>

                    <!-- Card -->
                    <tr>
                        <td style="background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #F3F4F6;">
                            <div style="padding: 48px;">
                                
                                ${quoteHtml}

                                <div style="color: #374151;">
                                    ${contentHtml.replace('{{quote}}', '')}
                                </div>

                                <!-- Dynamic Deadline Widget Placeholder -->
                                {{deadlineWidget}}

                                ${topProductsHtml || ''}

                                <!-- CTA -->
                                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 40px;">
                                    <tr>
                                        <td align="center">
                                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="display: inline-block; background-color: #4F46E5; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600; text-align: center; transition: all 0.2s;">
                                                Nu Bestellen
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 32px; text-align: center;">
                            <p style="margin: 0; color: #9CA3AF; font-size: 13px;">
                                &copy; ${new Date().getFullYear()} VH Engineering
                            </p>
                            <div style="margin-top: 12px;">
                                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings" style="color: #6B7280; text-decoration: none; font-size: 12px; font-weight: 500;">Instellingen</a>
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



