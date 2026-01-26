const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDeadline() {
    try {
        console.log('=== Checking GlobalSettings ===');
        const setting = await prisma.globalSetting.findUnique({
            where: { key: 'orderDeadline' }
        });
        console.log('orderDeadline setting:', JSON.stringify(setting, null, 2));

        console.log('\n=== Checking Current OrderPeriods ===');
        const periods = await prisma.orderPeriod.findMany({
            where: { isClosed: false },
            orderBy: { createdAt: 'desc' },
            take: 3
        });
        console.log('Open periods:', JSON.stringify(periods, null, 2));

        console.log('\n=== Current Time ===');
        console.log('Now:', new Date().toISOString());
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDeadline();
