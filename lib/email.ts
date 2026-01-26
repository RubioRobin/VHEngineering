import nodemailer from 'nodemailer';
import prisma from './prisma';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { getISOWeek, getYear } from 'date-fns';

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

    // Default template if none exists OR if it's the old default (force upgrade)
    if (!template || template.subject === '🍞 Vergeet niet te bestellen!') {
        const quote = FUN_QUOTES[Math.floor(Math.random() * FUN_QUOTES.length)];
        const topProducts = await getTopProductsHtml();

        return {
            subject: '🍞 De lunch-klok tikt!',
            bodyHtml: generateHtmlFromText(getDefaultEmailText(), quote, topProducts),
            bodyText: getDefaultEmailText() // Text fallback is simple
        };
    }

    const quote = FUN_QUOTES[Math.floor(Math.random() * FUN_QUOTES.length)];
    const topProducts = await getTopProductsHtml();

    return {
        subject: template.subject,
        bodyHtml: generateHtmlFromText(template.bodyHtml, quote, topProducts), // Inject into DB template too (if placeholders exist, otherwise just wraps)
        bodyText: template.bodyText
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
async function getTopProductsHtml(): Promise<string> {
    try {
        // Aggregate order items to find top products
        const topItems = await (prisma as any).orderItem.groupBy({
            by: ['productId'],
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

        if (topItems.length === 0) return '';

        // Fetch product details
        const productIds = topItems.map((item: any) => item.productId);
        const products = await (prisma as any).product.findMany({
            where: { id: { in: productIds } }
        });

        // Map back to maintain order
        const orderedProducts = topItems
            .map((item: any) => products.find((p: any) => p.id === item.productId))
            .filter(Boolean);

        return `
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px dashed #E5E7EB;">
                <h4 style="margin: 0 0 16px 0; color: #4F46E5; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">🔥 Populairste Broodjes</h4>
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    ${orderedProducts.map((p: any) => `
                        <tr>
                            <td style="padding: 8px 0; vertical-align: middle;">
                                <span style="font-weight: 600; color: #1F2937;">${p.name}</span>
                            </td>
                            <td style="padding: 8px 0; text-align: right; vertical-align: middle;">
                                <span style="background-color: #EEF2FF; color: #4F46E5; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">€ ${p.price.toFixed(2)}</span>
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
        <div style="background-color: #F8FAFC; border-left: 4px solid #4F46E5; padding: 16px; margin: 0 0 24px 0; font-style: italic; color: #555;">
            "${quote}"
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
<body style="margin: 0; padding: 0; font-family: 'Outfit', 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #F3F4F6; color: #1F2937;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F3F4F6; width: 100%;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                
                <!-- Main Container -->
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);">
                    
                    <!-- Simple Header -->
                    <tr>
                        <td style="padding: 40px 40px 0 40px; text-align: center;">
                            <h1 style="margin: 0; color: #4F46E5; font-size: 36px; font-weight: 800; letter-spacing: -1px;">Lunch Time!</h1>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 48px 40px 32px 40px;">
                            ${quoteHtml}
                            ${contentHtml.replace('{{quote}}', '')} 

                            <!-- Premium Deadline Widget -->
                            <div style="background-color: #FFF7ED; border: 2px dashed #FDBA74; border-radius: 16px; padding: 24px; margin: 32px 0; text-align: center;">
                                <div style="display: inline-block; background-color: #FFEDD5; color: #C2410C; border-radius: 50px; padding: 6px 16px; font-size: 12px; font-weight: 700; text-transform: uppercase; tracking-wide; margin-bottom: 12px;">Deadline Vandaag</div>
                                <h3 style="margin: 0; color: #9A3412; font-size: 24px; font-weight: 800;">{{deadlineTime}} uur</h3>
                                <p style="margin: 8px 0 0 0; color: #C2410C; font-size: 14px;">Zorg dat je bestelling binnen is!</p>
                            </div>

                            ${topProductsHtml || ''}

                            <!-- Big CTA -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 32px;">
                                <tr>
                                    <td align="center">
                                        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="display: inline-block; background-color: #4F46E5; background-image: linear-gradient(to right, #4F46E5, #6366F1); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 50px; font-size: 18px; font-weight: 700; box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
                                            Nu Bestellen
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #F9FAFB; padding: 24px 40px; text-align: center; border-top: 1px solid #F3F4F6;">
                            <p style="margin: 0; color: #9CA3AF; font-size: 13px; font-weight: 500;">
                                Eet smakelijk alvast! &#129366;
                            </p>
                            <div style="margin-top: 12px;">
                                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/archives" style="color: #6B7280; text-decoration: none; font-size: 12px; margin: 0 8px;">Archief</a>
                                <span style="color: #E5E7EB;">|</span>
                                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings" style="color: #6B7280; text-decoration: none; font-size: 12px; margin: 0 8px;">Instellingen</a>
                            </div>
                        </td>
                    </tr>
                </table>

                <!-- Bottom Copyright -->
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin-top: 24px;">
                    <tr>
                        <td align="center">
                             <p style="margin: 0; color: #9CA3AF; font-size: 12px;">&copy; ${new Date().getFullYear()} VH Engineering</p>
                        </td>
                    </tr>
                </table>

            </td>
        </tr>
    </table>
</body>
</html>`.trim();
}


