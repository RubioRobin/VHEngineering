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
 * Scrape products from a given URL using Puppeteer
 * Handles infinite scroll to load all products dynamically
 */
export async function scrapeProducts(targetUrl: string): Promise<ScrapedProduct[]> {
    const url = targetUrl;

    console.log(`🔍 Launching browser to scrape: ${url}`);

    let browser;
    const isVercel = process.env.VERCEL === '1';

    if (isVercel) {
        // Vercel specific puppeteer configuration
        const puppeteer = require('puppeteer-core');
        const chromium = require('@sparticuz/chromium');
        browser = await puppeteer.launch({
            args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
            defaultViewport: { width: 1920, height: 1080 },
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });
    } else {
        // Local dev configuration
        const puppeteer = require('puppeteer');
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
    }

    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

        console.log('📄 Loading page...');
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        console.log('🔄 Scrolling to load all products (infinite scroll)...');

        // Scroll to bottom multiple times to trigger infinite scroll
        let previousProductCount = 0;
        let currentProductCount = 0;
        let scrollAttempts = 0;
        const maxScrollAttempts = 10;

        do {
            previousProductCount = currentProductCount;

            // Scroll to bottom
            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });

            // Wait for new products to load (Promise-based delay for Puppeteer v21+)
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Count products
            currentProductCount = await page.evaluate(() => {
                return document.querySelectorAll('div.product').length;
            });

            console.log(`  Products loaded: ${currentProductCount}`);
            scrollAttempts++;

        } while (currentProductCount > previousProductCount && scrollAttempts < maxScrollAttempts);

        console.log(`✅ Finished scrolling. Total products found: ${currentProductCount}`);

        // Extract product data using page.evaluate
        const products = await page.evaluate(() => {
            const productElements = document.querySelectorAll('div.product');
            const results: any[] = [];

            productElements.forEach((element) => {
                try {
                    // Extract name from h4
                    const nameElement = element.querySelector('h4');
                    const name = nameElement?.textContent?.trim() || '';

                    // Extract price from .product__price bdi
                    let price: number | null = null;
                    const priceElement = element.querySelector('.product__price bdi');
                    if (priceElement) {
                        const priceText = priceElement.textContent?.trim() || '';
                        // Extract first number (e.g., "€ 4,85 t/m € 4,95" -> 4.85)
                        const priceMatch = priceText.match(/[\d,\.]+/);
                        if (priceMatch) {
                            price = parseFloat(priceMatch[0].replace(',', '.'));
                        }
                    }

                    // Extract image URL
                    let imageUrl: string | null = null;
                    const imgElement = element.querySelector('.product__img img');
                    if (imgElement) {
                        imageUrl = imgElement.getAttribute('src') ||
                            imgElement.getAttribute('data-src') ||
                            null;
                    }

                    // Extract product URL
                    let sourceUrl: string | null = null;
                    const linkElement = element.querySelector('a.product__lnk');
                    if (linkElement) {
                        sourceUrl = linkElement.getAttribute('href') || null;
                    }

                    // Only add valid sandwich products
                    // Exclude drinks, soups, etc.
                    const lowerName = name.toLowerCase();
                    const invalidTerms = ['fles', 'melk', 'jus', 'smoothie', 'soep', 'blikje', 'cola', 'fanta', 'water', 'spa', 'red bull', 'aa drink', 'chocomel', 'fristi'];
                    const isDrinkOrOther = invalidTerms.some(term => lowerName.includes(term));

                    if (name && name.length > 3 && price !== null && !isDrinkOrOther && name.toLowerCase() !== 'belegde broodjes') {
                        results.push({
                            name,
                            price,
                            description: null, // Not available in listing
                            imageUrl,
                            sourceUrl,
                        });
                    }
                } catch (err) {
                    console.error('Error parsing product:', err);
                }
            });

            return results;
        });

        console.log(`\n✅ Successfully scraped ${products.length} products`);
        products.forEach((p: ScrapedProduct) => {
            console.log(`  ✓ ${p.name} - €${p.price || '?'}`);
        });

        return products;

    } catch (error) {
        console.error('❌ Scraping error:', error);
        throw error;
    } finally {
        await browser.close();
    }
}

/**
 * Save scraped products to database
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
                console.log(`  ↻ Updated: ${product.name}`);
            } else {
                // Create new product
                await prisma.product.create({
                    data: product,
                });
                console.log(`  + Added: ${product.name}`);
            }
            savedCount++;
        } catch (err) {
            console.error(`Error saving product "${product.name}":`, err);
        }
    }

    return savedCount;
}

/**
 * Run full scraping process for all active sources and log results
 */
export async function runScraper(): Promise<{ success: boolean; message: string; count: number }> {
    try {
        console.log('\n🚀 Starting multi-source scraper...\n');

        // Fetch active sources from DB
        const sources = await (prisma as any).scraperSource.findMany({
            where: { isActive: true }
        });

        // If no sources in DB, use the default from env or hardcoded fallback
        const urlsToScrape = sources.length > 0
            ? sources.map((s: any) => s.url)
            : [process.env.SCRAPER_URL || 'https://www.brood-shop.nl/assortiment/belegde-broodjes/'];

        let totalScrapedProducts: ScrapedProduct[] = [];
        let sourceResults: string[] = [];

        for (const url of urlsToScrape) {
            try {
                const products = await scrapeProducts(url);
                totalScrapedProducts = [...totalScrapedProducts, ...products];
                sourceResults.push(`Success: ${url} (${products.length} products)`);
            } catch (err: any) {
                console.error(`Error scraping ${url}:`, err);
                sourceResults.push(`Failed: ${url} (${err.message})`);
            }
        }

        // Deduplicate by name
        let uniqueProducts = Array.from(new Map(totalScrapedProducts.map(p => [p.name, p])).values());

        if (uniqueProducts.length === 0) {
            console.log(`⚠️ No products found via scraping. Using fallback seed data (${SEED_PRODUCTS.length} products).`);

            // Use seed data as fallback
            uniqueProducts = SEED_PRODUCTS.map(p => ({
                ...p,
                sourceUrl: p.sourceUrl || null
            }));

            sourceResults.push('Used fallback seed data (Scraping blocked/failed)');
        }

        console.log(`\n💾 Saving ${uniqueProducts.length} unique products to database...\n`);
        const savedCount = await saveScrapedProducts(uniqueProducts);

        await prisma.scraperLog.create({
            data: {
                status: savedCount === uniqueProducts.length ? 'success' : 'partial',
                message: sourceResults.join(' | '),
                productsFound: savedCount,
            },
        });

        console.log(`\n✅ Scraping complete! Saved ${savedCount} products total\n`);

        return {
            success: true,
            message: `Successfully scraped and saved ${savedCount} unique products from ${urlsToScrape.length} sources.`,
            count: savedCount,
        };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`\n❌ Scraper failed: ${errorMessage}\n`);

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
