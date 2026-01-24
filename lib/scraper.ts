import prisma from './prisma';
import { SEED_PRODUCTS } from './seed-products';

interface ScrapedProduct {
    name: string;
    price: number | null;
    description: string | null;
    imageUrl: string | null;
    sourceUrl: string | null;
}

/**
 * Save products to database
 * Updates existing products or creates new ones
 */
export async function saveScrapedProducts(products: ScrapedProduct[]): Promise<number> {
    let savedCount = 0;

    for (const product of products) {
        try {
            // Check if product exists by name
            const existing = await prisma.product.findFirst({
                where: { name: product.name },
            });

            if (existing) {
                // Update existing product
                await prisma.product.update({
                    where: { id: existing.id },
                    data: {
                        price: product.price,
                        description: product.description,
                        imageUrl: product.imageUrl,
                        sourceUrl: product.sourceUrl,
                        allergens: (product as any).allergens || null,
                    } as any,
                });
            } else {
                // Create new product
                await prisma.product.create({
                    data: product,
                });
            }
            savedCount++;
        } catch (err) {
            console.error(`Error saving product "${product.name}":`, err);
        }
    }

    return savedCount;
}

/**
 * Reset products to standard assortment (Seed Data)
 * Replaces the old scraper functionality
 */
export async function runScraper(): Promise<{ success: boolean; message: string; count: number }> {
    try {
        console.log('\n🚀 Resetting to standard assortment (Seed Data)...\n');

        const uniqueProducts = new Map<string, any>();
        SEED_PRODUCTS.forEach(p => {
            if (!uniqueProducts.has(p.name)) {
                uniqueProducts.set(p.name, {
                    ...p,
                    sourceUrl: p.sourceUrl || null
                });
            }
        });

        const products = Array.from(uniqueProducts.values());

        console.log(`\n💾 Saving ${products.length} unique products to database...\n`);
        const savedCount = await saveScrapedProducts(products);

        await prisma.scraperLog.create({
            data: {
                status: 'success',
                message: 'Reset to standard assortment (Seed Data)',
                productsFound: savedCount,
            },
        });

        return {
            success: true,
            message: `Producten gereset naar standaard assortiment (${savedCount} producten).`,
            count: savedCount,
        };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`\n❌ Reset failed: ${errorMessage}\n`);

        await prisma.scraperLog.create({
            data: {
                status: 'error',
                message: errorMessage,
                productsFound: 0,
            },
        });

        return {
            success: false,
            message: errorMessage,
            count: 0,
        };
    }
}
