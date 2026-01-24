import fs from 'fs';
import path from 'path';

async function main() {
    // 1. Load .env manually BEFORE importing prisma
    try {
        const envPath = path.join(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf-8');
            envConfig.split('\n').forEach(line => {
                const match = line.match(/^([^=#]+)=(.*)$/);
                if (match) {
                    const key = match[1].trim();
                    const value = match[2].trim().replace(/^["'](.*)["']$/, '$1');
                    process.env[key] = value;
                }
            });
            console.log('✅ Loaded .env file');
        } else {
            console.warn('⚠️ No .env file found!');
        }
    } catch (e) {
        console.error('Failed to load .env', e);
    }

    // 2. Dynamic imports to ensure env vars are set first
    const { runScraper } = await import('../lib/scraper');
    const { default: prisma } = await import('../lib/prisma');

    console.log('🌱 Seeding database with new product list...');
    await runScraper();
    console.log('✅ Done!');

    await prisma.$disconnect();
}

main().catch(e => console.error(e));
