import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🗑️  Cleaning database...\n');

    // Step 1: Delete all orders (and their items will cascade)
    const ordersDeleted = await prisma.order.deleteMany({});
    console.log(`✅ Deleted ${ordersDeleted.count} orders`);

    // Step 2: Delete all seed products
    const seedProductsDeleted = await prisma.product.deleteMany({
        where: {
            id: {
                startsWith: 'seed-',
            },
        },
    });
    console.log(`✅ Deleted ${seedProductsDeleted.count} seed products`);

    // Step 3: Show remaining products (should be only scraped ones)
    const remaining = await prisma.product.findMany({
        orderBy: { name: 'asc' },
    });

    console.log(`\n📦 Remaining products: ${remaining.length}`);
    if (remaining.length > 0) {
        console.log('\nReal products from brood-shop.nl:');
        remaining.forEach((p, idx) => {
            console.log(`  ${idx + 1}. ${p.name} - €${p.price?.toFixed(2) || '?'}`);
        });
    } else {
        console.log('\n⚠️  No products remaining! Run scraper to load products.');
    }
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
