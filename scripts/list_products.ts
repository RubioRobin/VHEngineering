
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
            process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
        }
    });
}

const prisma = new PrismaClient();

async function main() {
    console.log('Fetching products...');
    const products = await prisma.product.findMany({
        orderBy: { name: 'asc' }
    });
    console.log('--- Products ---');
    products.forEach(p => console.log(`- ${p.name} (ID: ${p.id})`));
    console.log('--- End ---');
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
