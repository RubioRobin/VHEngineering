const fs = require('fs');
const path = require('path');

// Manual .env loading
try {
    const envPath = path.join(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^['"]|['"]$/g, ''); // simple unquote
                process.env[key] = value;
            }
        });
        console.log('Loaded .env.local');
    } else {
        console.log('.env.local not found');
    }
} catch (e) {
    console.error('Error loading env:', e);
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking Global Settings ---');
    try {
        const setting = await prisma.globalSetting.findUnique({
            where: { key: 'JESSE_PARTICIPATING' },
        });
        console.log('GlobalSetting JESSE_PARTICIPATING:', setting);
    } catch (error) {
        console.error("Error fetching settings:", error);
    }

    console.log('\n--- Checking Current Order Period ---');
    try {
        const openPeriods = await prisma.orderPeriod.findMany({
            where: { isOpen: true },
        });
        console.log('Open Periods:', JSON.stringify(openPeriods, null, 2));

        const allPeriods = await prisma.orderPeriod.findMany({
            orderBy: { weekId: 'desc' },
            take: 3,
        });
        console.log('Recent Periods:', JSON.stringify(allPeriods, null, 2));
    } catch (error) {
        console.error("Error fetching periods:", error);
    }

    console.log('\n--- Checking Order Count ---');
    try {
        const count = await prisma.order.count();
        console.log("Total orders in DB:", count);
    } catch (e) {
        console.error(e);
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
