
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Load .env.local manually
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    console.log('Loading .env.local...');
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, ''); // Remove quotes if any
        }
    });
} else {
    console.log('.env.local not found!');
}

const prisma = new PrismaClient();

async function main() {
    console.log('Fetching all subscribers...');
    try {
        const all = await prisma.emailSubscriber.findMany();
        console.log(`Total subscribers: ${all.length}`);
        console.table(all.map(s => ({ email: s.email, active: s.active, name: s.name })));

        console.log('\nFetching ACTIVE subscribers (target for emails)...');
        const active = await prisma.emailSubscriber.findMany({ where: { active: true } });
        console.log(`Total ACTIVE subscribers: ${active.length}`);
        console.table(active.map(s => ({ email: s.email, active: s.active, name: s.name })));
    } catch (error) {
        console.error("Prisma error:", error);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
