const { PrismaClient } = require('@prisma/client');
const { getCurrentOrderPeriod } = require('../lib/orderPeriod');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- Database State ---');
        const periods = await prisma.orderPeriod.findMany({
            orderBy: { createdAt: 'desc' }
        });
        console.log('OrderPeriods:', JSON.stringify(periods, null, 2));

        console.log('--- Logic Verification ---');
        const currentPeriod = await getCurrentOrderPeriod();
        console.log('Current Period from logic:', JSON.stringify(currentPeriod, null, 2));

        const settings = await prisma.globalSetting.findMany();
        console.log('GlobalSettings:', JSON.stringify(settings, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
