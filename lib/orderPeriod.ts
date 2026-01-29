import { addDays, addHours, nextFriday, setHours, setMinutes, setSeconds, startOfWeek, endOfWeek, getISOWeek, getISOWeekYear, isAfter, isBefore } from 'date-fns';
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
 * Get the deadline associated with the currently active order period.
 * The period switches to the next week on Monday morning (06:00).
 */
export async function getNextDeadline(): Promise<Date> {
    const config = await getDeadlineSettings();
    let now;
    try {
        now = toZonedTime(new Date(), TIMEZONE);
    } catch (e) {
        now = new Date();
    }

    // Determine the "active" date using a 6-hour offset.
    // This keeps the previous week's period active until Monday 06:00.
    const activeDate = addHours(now, -6);

    // Find the Monday of the ISO week containing the active date
    const monday = startOfWeek(activeDate, { weekStartsOn: 1 });

    // The deadline is config.day of that week.
    // config.day: 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
    let daysToAdd = config.day - 1;
    if (daysToAdd < 0) daysToAdd += 7; // Sunday fallback

    const deadlineDate = setSeconds(setMinutes(setHours(addDays(monday, daysToAdd), config.hour), config.minute), 0);

    // Convert back to UTC for storage
    return fromZonedTime(deadlineDate, TIMEZONE);
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

    return `${year}-${week}`;
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

    // Get Jesse's participation status from global settings
    const jesseSetting = await prisma.globalSetting.findUnique({
        where: { key: 'JESSE_PARTICIPATING' }
    });
    const jesseParticipating = jesseSetting?.value === 'true';

    // Find or create period
    // Try both canonical and padded for robustness
    const parts = periodId.split('-');
    const year = parts[0];
    const week = parts[1];
    const paddedId = `${year}-${week.padStart(2, '0')}`;
    const unpaddedId = `${year}-${parseInt(week)}`;

    let period = await prisma.orderPeriod.findFirst({
        where: {
            weekId: {
                in: [unpaddedId, paddedId]
            }
        },
    });

    if (!period) {
        period = await prisma.orderPeriod.create({
            data: {
                weekId: periodId,
                startDate,
                endDate,
                deadline,
                jesseParticipating,
            },
        });
    } else if (period.weekId !== periodId) {
        // Update to canonical ID if we found a non-canonical one
        period = await prisma.orderPeriod.update({
            where: { id: period.id },
            data: {
                weekId: periodId,
                // Also update jesse participation for current period if it exists
                jesseParticipating
            }
        });
    } else {
        // Even if found, we should ensure the current open period's jesse status is updated
        // to match global settings if it's the current period
        if (!period.isClosed) {
            period = await prisma.orderPeriod.update({
                where: { id: period.id },
                data: { jesseParticipating }
            });
        }
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
 * Find all non-closed periods with passed deadlines and mark them as closed.
 * Also ensures only ONE period is open at a time (the current one).
 */
export async function checkAndCloseExpiredPeriods() {
    const now = new Date();
    const currentId = await getCurrentPeriodId();

    // 1. Close periods past their deadline
    const expiredPeriods = await prisma.orderPeriod.findMany({
        where: {
            isClosed: false,
            deadline: {
                lt: now
            }
        }
    });

    for (const period of expiredPeriods) {
        await prisma.orderPeriod.update({
            where: { id: period.id },
            data: { isClosed: true }
        });
        console.log(`Auto-closed expired period: ${period.weekId}`);
    }

    // 2. Proactively close or delete any other non-current periods to prevent UI clutter
    const otherOpenPeriods = await prisma.orderPeriod.findMany({
        where: {
            isClosed: false,
            weekId: {
                not: currentId
            }
        },
        include: {
            _count: {
                select: { orders: true }
            }
        }
    });

    for (const period of otherOpenPeriods) {
        // If it's completely empty, just delete it to keep things clean
        if (period._count?.orders === 0) {
            await prisma.orderPeriod.delete({
                where: { id: period.id }
            });
            console.log(`Deleted empty redundant/stale period: ${period.weekId}`);
            continue;
        }

        // If it has orders, close it so it moves to archives
        await prisma.orderPeriod.update({
            where: { id: period.id },
            data: { isClosed: true }
        });
        console.log(`Closed redundant/stale period with orders: ${period.weekId}`);
    }

    return expiredPeriods.length + otherOpenPeriods.length;
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
