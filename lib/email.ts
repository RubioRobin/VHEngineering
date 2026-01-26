import nodemailer from 'nodemailer';
import prisma from './prisma';
import { format } from 'date-fns';
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

    // Generate fresh HTML adhering to the new Premium design
    const freshHtml = generateHtmlFromText(template ? template.bodyText : getDefaultEmailText(), quote, topProducts);

    return {
        subject: template ? template.subject : '🍞 De lunch-klok tikt!',
        bodyHtml: freshHtml,
        bodyText: template ? template.bodyText : getDefaultEmailText()
    };
}

/**
 * Get the deadline time string for the current week
 */
export async function getDeadlineTime(): Promise<string> {
    try {
        const weekId = `${getYear(new Date())}-${getISOWeek(new Date())}`;
        const period = await (prisma as any).orderPeriod.findUnique({
            where: { weekId }
        });

        if (period && period.deadline) {
            // Force Dutch time representation to avoid UTC/Local mismatches
            const date = new Date(period.deadline);
            const timeStr = date.toLocaleTimeString('nl-NL', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Europe/Amsterdam'
            });
            console.log(`[Email] Found period deadline: ${timeStr} (from ${period.deadline})`);
            return timeStr;
        }

        // Fallback to global setting if no period specific deadline
        const setting = await (prisma as any).globalSetting.findUnique({
            where: { key: 'DEADLINE_HOUR' }
        });
        const minuteSetting = await (prisma as any).globalSetting.findUnique({
            where: { key: 'DEADLINE_MINUTE' }
        });

        if (setting) {
            const hour = setting.value.padStart(2, '0');
            const minute = minuteSetting?.value.padStart(2, '0') || '00';
            console.log(`[Email] Using global setting deadline: ${hour}:${minute}`);
            return `${hour}:${minute}`;
        }
    } catch (e) {
        console.error('Error fetching deadline for email:', e);
    }
    console.log('[Email] Using default fallback deadline: 14:00');
    return '14:00'; // Default
}

/**
 * Send reminder email to a single recipient
 */
export async function sendReminderEmail(
    email: string,
    name?: string,
    context?: { template: any, deadlineTime: string } // Optional context to avoid re-fetching
) {
    // Use provided context or fetch fresh
    let template = context?.template;
    let deadlineTime = context?.deadlineTime;

    if (!template) template = await getReminderTemplate();
    if (!deadlineTime) deadlineTime = await getDeadlineTime();

    const senderEmail = process.env.SENDER_EMAIL || 'onboarding@resend.dev';
    const senderName = process.env.SENDER_NAME || 'VH Engineering - Broodjes Bestellen';

    // Replace placeholders in template
    const personalizedHtml = template.bodyHtml
        .replace(/\{\{name\}\}/g, name || 'daar')
        .replace(/\{\{email\}\}/g, email)
        .replace(/\{\{deadlineTime\}\}/g, deadlineTime);

    const personalizedText = template.bodyText
        .replace(/\{\{name\}\}/g, name || 'daar')
        .replace(/\{\{email\}\}/g, email)
        .replace(/\{\{deadlineTime\}\}/g, deadlineTime);

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

// ... generateHtmlFromText function stays ...

/**
 * Default plain text email template
 */
export function getDefaultEmailText(): string {
    return `Hallo {{name}}! 👋
    
Dit is je reminder: de deadline nadert! ⏰

Wist je dat? "{{quote}}"

Bekijk onze tips van de week onderaan de mail en bestel snel!`.trim();
}

/**
 * Fetch top 3 products and format as HTML list
 */
/**
 * Fetch top 3 products FROM LAST WEEK and format as Premium HTML cards
 */
async function getTopProductsHtml(): Promise<string> {
    try {
        // Calculate date range for the previous week
        const today = new Date();
        const lastWeekDate = subWeeks(today, 1);
        const startDate = startOfWeek(lastWeekDate, { weekStartsOn: 1 }); // Monday
        const endDate = endOfWeek(lastWeekDate, { weekStartsOn: 1 });     // Sunday

        // Aggregate order items from orders created last week
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
            _count: {
                productId: true
            },
            orderBy: {
                _count: {
                    productId: 'desc'
                }
            },
            take: 3
        });

        // If no orders last week, fallback to all-time popular to avoid empty section
        let finalItems = topItems;
        let title = "🏆 Top 3 van Vorige Week";

        if (finalItems.length === 0) {
            console.log('[Email] No orders found for last week, falling back to all-time.');
            title = "🔥 All-time Favorieten";
            finalItems = await (prisma as any).orderItem.groupBy({
                by: ['productId'],
                _count: { productId: true },
                orderBy: { _count: { productId: 'desc' } },
                take: 3
            });
        }

        if (finalItems.length === 0) return '';

        // Fetch product details
        const productIds = finalItems.map((item: any) => item.productId);
        const products = await (prisma as any).product.findMany({
            where: { id: { in: productIds } }
        });

        // Map back to maintain order
        const orderedProducts = finalItems
            .map((item: any) => products.find((p: any) => p.id === item.productId))
            .filter(Boolean);

        // Premium Grid Layout
        return `
            <div style="margin-top: 40px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 20px 0; color: #1F2937; font-size: 18px; font-weight: 800; text-align: center; letter-spacing: -0.5px;">${title}</h4>
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    ${orderedProducts.map((p: any, index: number) => `
                        <tr>
                            <td style="padding-bottom: 12px;">
                                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F9FAFB; border-radius: 12px; border: 1px solid #E5E7EB;">
                                    <tr>
                                        <td style="padding: 16px; width: 40px; text-align: center; font-size: 20px;">
                                            ${index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                        </td>
                                        <td style="padding: 16px 8px; vertical-align: middle;">
                                            <span style="font-weight: 700; color: #1F2937; font-size: 15px; display: block;">${p.name}</span>
                                            ${p.description ? `<span style="font-size: 12px; color: #6B7280; display: block; margin-top: 2px;">${p.description.substring(0, 50)}${p.description.length > 50 ? '...' : ''}</span>` : ''}
                                        </td>
                                        <td style="padding: 16px; text-align: right; vertical-align: middle; white-space: nowrap;">
                                            <span style="background-color: #ffffff; color: #4F46E5; padding: 6px 10px; border-radius: 8px; font-size: 13px; font-weight: 700; border: 1px solid #E0E7FF; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">€ ${p.price.toFixed(2)}</span>
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

/**
 * Send reminder to all active subscribers
 */
export async function sendReminderToAll() {
    console.log('[Email] Starting bulk send...');
    const subscribers = await (prisma as any).emailSubscriber.findMany({
        where: { active: true }
    });

    if (subscribers.length === 0) {
        return { success: true, sent: 0, failed: 0, results: [] };
    }

    // Pre-fetch data ONCE
    console.log('[Email] Pre-fetching template & deadline info...');
    // Note: getReminderTemplate now internally fetches quotes and top products
    const [template, deadlineTime] = await Promise.all([
        getReminderTemplate(),
        getDeadlineTime()
    ]);

    console.log(`[Email] Sending to ${subscribers.length} recipients in parallel...`);

    // Send in parallel
    const promiseResults = await Promise.all(
        subscribers.map((subscriber: any) =>
            sendReminderEmail(subscriber.email, subscriber.name || undefined, { template, deadlineTime })
                .then(res => ({ email: subscriber.email, ...res }))
        )
    );

    const sent = promiseResults.filter((r: any) => r.success).length;
    const failed = promiseResults.filter((r: any) => !r.success).length;

    console.log(`[Email] Batch complete. Sent: ${sent}, Failed: ${failed}`);

    return {
        success: true,
        sent,
        failed,
        total: subscribers.length,
        results: promiseResults
    };
}

/**
 * Default HTML email template
 */
/**
 * Default HTML email template generator
 * Matches the Indigo/Portal branding
 */
export function generateHtmlFromText(text: string, quote?: string, topProductsHtml?: string): string {
    // If text already looks like full HTML (starts with <!DOCTYPE or <html), return it as is
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        // Just inject dynamic values if placeholders exist
        return text
            .replace('{{quote}}', quote || '')
            .replace('{{topProducts}}', topProductsHtml || '');
    }

    // Clean up text: convert newlines to paragraphs
    const contentHtml = text
        .split('\n\n')
        .map(para => `<p style="margin: 0 0 24px 0; color: #4B5563; font-size: 16px; line-height: 1.8;">${para.replace(/\n/g, '<br>')}</p>`)
        .join('');

    const quoteHtml = quote ? `
        <div style="margin: 0 0 32px 0; text-align: center;">
            <div style="display: inline-block; background-color: #F3F4F6; padding: 16px 24px; border-radius: 16px; position: relative;">
                <span style="font-size: 24px; position: absolute; top: -10px; left: 10px;">❝</span>
                <p style="margin: 0; font-style: italic; color: #4B5563; font-weight: 500; font-size: 15px; line-height: 1.6;">${quote}</p>
                <span style="font-size: 24px; position: absolute; bottom: -15px; right: 10px; line-height: 1;">❞</span>
            </div>
        </div>
    ` : '';

    const contentSection = `
        <div style="background-color: #ffffff; padding: 32px; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            ${contentHtml.replace('{{quote}}', '')}
        </div>
    `;

    return `
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Broodjes Bestellen</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Outfit', 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #F3F4F6; color: #1F2937;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F3F4F6; width: 100%;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                
                <!-- Main Container -->
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px;">
                    
                    <!-- Modern Header -->
                    <tr>
                        <td style="padding: 0 0 32px 0; text-align: center;">
                            <h1 style="margin: 0; color: #111827; font-size: 32px; font-weight: 800; letter-spacing: -1px;">Lunch Time! 🥪</h1>
                            <p style="margin: 8px 0 0 0; color: #6B7280; font-size: 15px;">Tijd om te bestellen</p>
                        </td>
                    </tr>

                    <!-- Quote Hero -->
                    <tr>
                        <td>
                            ${quoteHtml}
                        </td>
                    </tr>

                    <!-- Main Card -->
                    <tr>
                        <td style="background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);">
                            <div style="padding: 40px;">
                                
                                <div style="color: #374151; font-size: 16px; line-height: 1.8;">
                                    ${contentHtml.replace('{{quote}}', '')}
                                </div>

                                <!-- Dynamic Deadline Widget -->
                                <div style="margin-top: 32px; background: linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%); border-radius: 16px; padding: 24px; text-align: center; border: 1px solid #FED7AA;">
                                    <p style="margin: 0; color: #9A3412; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Deadline Vandaag</p>
                                    <div style="font-size: 36px; font-weight: 800; color: #C2410C; line-height: 1.2; margin: 4px 0;">{{deadlineTime}}</div>
                                    <p style="margin: 0; color: #EA580C; font-size: 14px;">Wees er snel bij!</p>
                                </div>

                                ${topProductsHtml || ''}

                                <!-- Big CTA -->
                                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 32px;">
                                    <tr>
                                        <td align="center">
                                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="display: inline-block; background-color: #4F46E5; background-image: linear-gradient(to right, #4F46E5, #6366F1); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 16px; font-size: 18px; font-weight: 700; box-shadow: 0 10px 20px -5px rgba(79, 70, 229, 0.4); text-transform: uppercase; letter-spacing: 0.5px; transition: all 0.2s;">
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
                                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings" style="color: #6B7280; text-decoration: none; font-size: 12px; font-weight: 500;">Instellingen beheren</a>
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


