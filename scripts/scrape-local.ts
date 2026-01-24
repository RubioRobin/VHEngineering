
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function scrape() {
    console.log('Starting local scrape of brood-shop.nl...');

    // Launch standard puppeteer (not core) as we are on user's machine
    const browser = await puppeteer.launch({
        headless: "new",
        defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();
    const url = 'https://www.brood-shop.nl/assortiment/belegde-broodjes/';

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        console.log('Page loaded. Scrolling...');

        // Infinite scroll
        await autoScroll(page);

        // Extract products
        const products = await page.evaluate(() => {
            const items = document.querySelectorAll('div.product');
            const results = [];

            items.forEach((item) => {
                const nameEl = item.querySelector('h4');
                const priceEl = item.querySelector('.product__price bdi');
                const imgEl = item.querySelector('.product__img img');

                if (nameEl && priceEl) {
                    const name = nameEl.innerText.trim();
                    const priceText = priceEl.innerText.trim();
                    const price = parseFloat(priceText.replace(/[^0-9,]/g, '').replace(',', '.'));

                    let imageUrl = imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src') || '';
                    if (imageUrl && !imageUrl.startsWith('http')) {
                        imageUrl = 'https://www.brood-shop.nl' + imageUrl;
                    }

                    if (name && !isNaN(price)) {
                        results.push({
                            name,
                            price,
                            description: 'Vers belegd broodje',
                            imageUrl,
                            sourceUrl: 'https://www.brood-shop.nl/assortiment/belegde-broodjes/'
                        });
                    }
                }
            });
            return results;
        });

        console.log(`Found ${products.length} products.`);

        // Determine output path
        const outputPath = path.join(process.cwd(), 'lib', 'seed-data.json');
        fs.writeFileSync(outputPath, JSON.stringify(products, null, 2));

        console.log(`Saved to ${outputPath}`);

    } catch (e) {
        console.error('Error scraping:', e);
    } finally {
        await browser.close();
    }
}

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

scrape();
