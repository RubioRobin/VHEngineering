require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const products = await prisma.product.findMany();
        const categories = new Set(products.map(p => p.description));
        console.log("All Categories found in DB:");
        categories.forEach(c => console.log(`'${c}'`));

        const snacks = products.filter(p => p.description === 'Snacks');
        console.log(`\nCount of 'Snacks': ${snacks.length}`);

        const handmatig = products.filter(p => p.description?.includes('Handmatig'));
        console.log(`Count of 'Handmatig...': ${handmatig.length}`);
        if (handmatig.length > 0) {
            console.log(`First Handmatig: '${handmatig[0].description}'`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
