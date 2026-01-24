
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function scrape() {
    console.log('Starting IMPROVED EXTENDED local scrape...');

    const browser = await puppeteer.launch({
        headless: "new",
        defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();

    const urls = [
        'https://www.brood-shop.nl/assortiment/belegde-broodjes/',
        'https://www.brood-shop.nl/assortiment/snacks/',
        'https://www.brood-shop.nl/assortiment/banket/'
    ];

    let allProducts = [];

    try {
        for (const url of urls) {
            console.log(`\n📄 Scrapen van: ${url}`);
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

            // Aggressive scrolling
            await aggressiveScroll(page);

            // Extract products
            const products = await page.evaluate((currentUrl) => {
                const items = document.querySelectorAll('div.product');
                const results = [];

                items.forEach((item) => {
                    const nameEl = item.querySelector('h4');
                    const priceEl = item.querySelector('.product__price bdi');
                    const imgEl = item.querySelector('.product__img img');

                    if (nameEl && priceEl) {
                        const name = nameEl.innerText.trim();
                        const priceText = priceEl.innerText.trim();
                        const priceMatch = priceText.match(/[\d,\.]+/);
                        const price = priceMatch ? parseFloat(priceMatch[0].replace(/[^0-9,]/g, '').replace(',', '.')) : 0;

                        let imageUrl = imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src') || '';
                        if (imageUrl && !imageUrl.startsWith('http')) {
                            imageUrl = 'https://www.brood-shop.nl' + imageUrl;
                        }

                        let category = 'Broodjes';
                        if (currentUrl.includes('snacks')) category = 'Snacks';
                        if (currentUrl.includes('banket')) category = 'Banket';

                        const lowerName = name.toLowerCase();
                        const invalidTerms = ['statiegeld', 'tasje'];

                        if (name && price > 0 && !invalidTerms.some(t => lowerName.includes(t))) {
                            results.push({
                                name,
                                price,
                                description: category,
                                imageUrl,
                                sourceUrl: currentUrl
                            });
                        }
                    }
                });
                return results;
            }, url);

            console.log(`> Gevonden: ${products.length} producten.`);
            allProducts = [...allProducts, ...products];
        }

        console.log(`\n✅ Totaal aantal producten gevonden: ${allProducts.length}`);

        // Save
        const outputPath = path.join(process.cwd(), 'lib', 'seed-data-extended.json');
        fs.writeFileSync(outputPath, JSON.stringify(allProducts, null, 2));
        console.log(`Saved to ${outputPath}`);

    } catch (e) {
        console.error('Error scraping:', e);
    } finally {
        await browser.close();
    }
}

async function aggressiveScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 300; // Scroll meer pixels per keer
            let scrolls = 0;
            let noChangeCount = 0;
            let lastHeight = 0;

            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                scrolls++;

                // Check of we beneden zijn of dat er niets meer bijkomt
                if (scrollHeight === lastHeight) {
                    noChangeCount++;
                } else {
                    noChangeCount = 0; // Reset als er content bij kwam
                }

                lastHeight = scrollHeight;

                // Stop als we 20 keer gescrolled hebben zonder dat de pagina langer werd
                // Of als we heel vaak gescrolled hebben (veiligheid)
                if (noChangeCount >= 20 || scrolls > 400) {
                    clearInterval(timer);
                    resolve();
                }
            }, 200); // Iets langzamer scrollen (200ms) om laden tijd te geven
        });
    });

    // Extra wait na scrollen
    await new Promise(r => setTimeout(r, 2000));
}

scrape();
