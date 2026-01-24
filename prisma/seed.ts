import { PrismaClient } from '@prisma/client';
import { runScraper } from '../lib/scraper';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Clear existing data to remove "fake" seeds
    console.log('🧹 Clearing old product data...');
    await prisma.product.deleteMany({});

    // Instead of hardcoded data, we now scrape live data
    console.log('🌍 Starting live scrape to populate database...');
    const result = await runScraper();

    if (result.success) {
        console.log(`✅ Database seeded successfully with ${result.count} products from website!`);
    } else {
        console.error(`❌ Failed to seed database: ${result.message}`);
        // We do not fail the process here to allow the app to start even if scraping fails (e.g. no internet)
        // But we explicitly log the error.
    }
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
