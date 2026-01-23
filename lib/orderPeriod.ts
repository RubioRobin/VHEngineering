import { addDays, nextFriday, setHours, setMinutes, setSeconds, startOfWeek, endOfWeek, getISOWeek, getISOWeekYear, isAfter, isBefore } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import prisma from './prisma';
const TIMEZONE = 'Europe/Amsterdam';

// FALLBACK DEADLINE SETTINGS (used if not found in database)
const DEFAULT_DEADLINE_DAY = 5; // Friday
const DEFAULT_DEADLINE_HOUR = 16; // 16:00
const DEFAULT_DEADLINE_MINUTE = 0;

/**
 * Internal helper to get deadline settings from database or fallbacks
 */
async function getDeadlineSettings() {
    try {
        const settings = await prisma.globalSetting.findMany({
            where: {
                key: {
                    in: ['DEADLINE_DAY', 'DEADLINE_HOUR', 'DEADLINE_MINUTE']
                }
            }
        });

        const settingsMap = settings.reduce((acc: Record<string, number>, s: any) => {
            acc[s.key] = parseInt(s.value);
            return acc;
        }, {} as Record<string, number>);

        return {
            day: settingsMap['DEADLINE_DAY'] ?? DEFAULT_DEADLINE_DAY,
            hour: settingsMap['DEADLINE_HOUR'] ?? DEFAULT_DEADLINE_HOUR,
            minute: settingsMap['DEADLINE_MINUTE'] ?? DEFAULT_DEADLINE_MINUTE,
        };
    } catch (error) {
        console.error('Error fetching deadline settings, using defaults:', error);
        return {
            day: DEFAULT_DEADLINE_DAY,
            hour: DEFAULT_DEADLINE_HOUR,
            minute: DEFAULT_DEADLINE_MINUTE,
        };
    }
}

/**
 * Get the next deadline based on database settings
 */
export async function getNextDeadline(): Promise<Date> {
    const config = await getDeadlineSettings();
    const now = toZonedTime(new Date(), TIMEZONE);

    // Get next occurrence of deadline day
    let deadlineDate: Date;

    if (now.getDay() === config.day) {
        // Today is the deadline day
        const todayAtDeadline = setSeconds(setMinutes(setHours(now, config.hour), config.minute), 0);
        if (isBefore(now, todayAtDeadline)) {
            deadlineDate = todayAtDeadline;
        } else {
            // Already past deadline, get next week
            deadlineDate = addDays(now, 7);
        }
    } else {
        // Find next occurrence of the day
        // This is a simplified logic that works for weekly cycles
        deadlineDate = new Date(now);
        let daysUntil = (config.day - now.getDay() + 7) % 7;
        if (daysUntil === 0) daysUntil = 7;
        deadlineDate.setDate(now.getDate() + daysUntil);
    }

    // Set time to configured deadline
    const deadline = setSeconds(setMinutes(setHours(deadlineDate, config.hour), config.minute), 0);

    // Convert back to UTC for storage
    return fromZonedTime(deadline, TIMEZONE);
}

/**
 * Check if ordering is currently open (before deadline)
 */
export async function isOrderingOpen(): Promise<boolean> {
    const now = new Date();
    const deadline = await getNextDeadline();
    return isBefore(now, deadline);
}

/**
 * Get current order period ID (format: YYYY-WW where WW is ISO week number)
 */
export async function getCurrentPeriodId(): Promise<string> {
    const deadline = await getNextDeadline();
    const zonedDeadline = toZonedTime(deadline, TIMEZONE);

    const year = getISOWeekYear(zonedDeadline);
    const week = getISOWeek(zonedDeadline);

    return `${year}-${String(week).padStart(2, '0')}`;
}

/**
 * Get or create the current order period
 */
export async function getCurrentOrderPeriod() {
    const periodId = await getCurrentPeriodId();
    const deadline = await getNextDeadline();
    const zonedDeadline = toZonedTime(deadline, TIMEZONE);

    // Calculate week start (Monday) and end (Sunday)
    const weekStart = startOfWeek(zonedDeadline, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(zonedDeadline, { weekStartsOn: 1 }); // Sunday

    // Convert to UTC for storage
    const startDate = fromZonedTime(weekStart, TIMEZONE);
    const endDate = fromZonedTime(weekEnd, TIMEZONE);

    // Find or create period
    let period = await prisma.orderPeriod.findUnique({
        where: { weekId: periodId },
    });

    if (!period) {
        period = await prisma.orderPeriod.create({
            data: {
                weekId: periodId,
                startDate,
                endDate,
                deadline,
            },
        });
    }

    return period;
}

/**
 * Get all order periods (for dropdown in admin)
 */
export async function getAllOrderPeriods() {
    return await prisma.orderPeriod.findMany({
        orderBy: { deadline: 'desc' },
        include: {
            _count: {
                select: { orders: true }
            }
        }
    });
}

/**
 * Get time remaining until deadline (in milliseconds)
 */
export async function getTimeUntilDeadline(): Promise<number> {
    const now = new Date();
    const deadline = await getNextDeadline();
    return deadline.getTime() - now.getTime();
}

/**
 * Format time remaining as human-readable string
 */
export function formatTimeRemaining(ms: number): string {
    if (ms <= 0) {
        return 'Gesloten';
    }

    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (days > 0) {
        return `${days}d ${hours}u ${minutes}m`;
    } else if (hours > 0) {
        return `${hours}u ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
}

/**
 * Get deadline configuration (for admin display)
 */
export async function getDeadlineConfig() {
    const config = await getDeadlineSettings();
    const dayNames = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
    return {
        day: dayNames[config.day],
        dayValue: config.day,
        hour: config.hour,
        minute: config.minute,
        formatted: `${dayNames[config.day]} ${String(config.hour).padStart(2, '0')}:${String(config.minute).padStart(2, '0')}`,
    };
}
