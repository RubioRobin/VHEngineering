const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.order.count();
        console.log('Order count:', count);

        const reactionCount = await prisma.reaction.count();
        console.log('Reaction count:', reactionCount);

        const periods = await prisma.orderPeriod.findMany();
        console.log('Periods:', periods.map(p => p.weekId));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
