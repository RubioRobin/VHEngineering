import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking Global Settings ---');
    try {
        const setting = await prisma.globalSetting.findUnique({
            where: { key: 'JESSE_PARTICIPATING' }
        });
        console.log('JESSE_PARTICIPATING:', setting);
    } catch (error) {
        console.error("Error fetching settings:", error);
    }

    console.log('\n--- Checking Current Order Period ---');
    try {
        const openPeriods = await prisma.orderPeriod.findMany({
            where: { isOpen: true }
        });
        console.log('Open Periods:', JSON.stringify(openPeriods, null, 2));

        const allPeriods = await prisma.orderPeriod.findMany({
            orderBy: { weekId: 'desc' },
            take: 3
        });
        console.log('Recent Periods:', JSON.stringify(allPeriods, null, 2));
    } catch (error) {
        console.error("Error fetching periods:", error);
    }

    console.log('\n--- Checking Orders ---');
    try {
        const orders = await prisma.order.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { orderPeriod: true }
        });
        console.log('Recent Orders (first 5):');
        orders.forEach(o => {
            console.log(`Order ${o.id}: Person=${o.personName}, NotPart=${o.notParticipating}, Period=${o.orderPeriod?.weekId}, JessePartInPeriod=${o.orderPeriod?.jesseParticipating}`);
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
