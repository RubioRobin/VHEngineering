import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database with extensive sandwich catalog...');

    // Extensive list of Dutch sandwiches
    const products = [
        // Cheese varieties
        {
            name: 'Broodje kaas',
            price: 3.50,
            description: 'Verse belegen kaas',
            imageUrl: null,
            sourceUrl: null,
        },
        {
            name: 'Broodje jonge kaas',
            price: 3.50,
            description: 'Jonge kaas',
            imageUrl: null,
            sourceUrl: null,
        },
        {
            name: 'Broodje oude kaas',
            price: 3.75,
            description: 'Pittige oude kaas',
            imageUrl: null,
            sourceUrl: null,
        },
        {
            name: 'Broodje brie',
            price: 4.25,
            description: 'Romige brie met honing',
            imageUrl: null,
            sourceUrl: null,
        },
        {
            name: 'Broodje geitenkaas',
            price: 4.50,
            description: 'Verse geitenkaas',
            imageUrl: null,
            sourceUrl: null,
        },
        // Ham varieties
        {
            name: 'Broodje ham',
            price: 3.75,
            description: 'Gesneden achterham',
            imageUrl: null,
            sourceUrl: null,
        },
        {
            name: 'Broodje ham-kaas',
            price: 4.25,
            description: 'Ham en kaas',
            imageUrl: null,
            sourceUrl: null,
        },
        {
            name: 'Broodje gerookte ham',
            price: 4.00,
            description: 'Gerookte ham',
            imageUrl: null,
            sourceUrl: null,
        },
        // Chicken
        {
            name: 'Broodje kip',
            price: 4.50,
            description: 'Gegrilde kip',
            imageUrl: null,
            sourceUrl: null,
        },
        {
            name: 'Broodje kipfilet',
            price: 4.75,
            description: 'Kipfilet met sla',
            imageUrl: null,
            sourceUrl: null,
        },
        {
            name: 'Broodje kip-kerrie',
            price: 4.50,
            description: 'Kip met kerriesaus',
            imageUrl: null,
            sourceUrl: null,
        },
        // Salads
        {
            name: 'Broodje gezond',
            price: 4.50,
            description: 'Kaas, tomaat, komkommer, sla',
            imageUrl: null,
            sourceUrl: null,
        },
        {
            name: 'Broodje eiersalade',
            price: 4.25,
            description: 'Hausm gemaaakte eiersalade',
            imageUrl: null,
            sourceUrl: null,
        },
        {
            name: 'Broodje tonijnsalade',
            price: 4.50,
            description: 'Verse tonijnsalade',
            imageUrl: null,
            sourceUrl: null,
        },
        {
            name: 'Broodje kipsalade',
            price: 4.50,
            description: 'Kipsalade met mayonaise',
            imageUrl: null,
            sourceUrl: null,
        },
        // Spreads
        {
            name: 'Broodje americain',
            price: 4.00,
            description: 'Filet americain',
            imageUrl: null,
            sourceUrl: null,
        },
        {
            name: 'Broodje ossenworst',
            price: 4.00,
            description: 'Verse ossenworst',
            imageUrl: null,
            sourceUrl: null,
        },
        {
            name: 'Broodje leverworst',
            price: 3.75,
            description: 'Smeuïge leverworst',
            imageUrl: null,
            sourceUrl: null,
        },
        {
            name: 'Broodje pindakaas',
            price: 3.25,
            description: 'Pindakaas',
            imageUrl: null,
            sourceUrl: null,
        },
        {
            name: 'Broodje hagelslag',
            price: 3.00,
            description: 'Chocolade hagelslag',
            imageUrl: null,
            sourceUrl: null,
        },
        // Fish
        {
            name: 'Broodje haring',
            price: 4.75,
            description: 'Hollandse nieuwe',
            imageUrl: null,
            sourceUrl: null,
        },
        {
            name: 'Broodje gerookte zalm',
            price: 5.50,
            description: 'Gerookte zalm met roomkaas',
            imageUrl: null,
            sourceUrl: null,
        },
        {
            name: 'Broodje makreel',
            price: 4.50,
            description: 'Gerookte makreel',
            imageUrl: null,
            sourceUrl: null,
        },
        // Specialty
        {
            name: 'Broodje kroket',
            price: 4.00,
            description: 'Warme kroket',
            imageUrl: null,
            sourceUrl: null,
        },
        {
            name: 'Broodje frikandel',
            price: 3.75,
            description: 'Warme frikandel',
            imageUrl: null,
            sourceUrl: null,
        },
        {
            name: 'Broodje bal gehakt',
            price: 4.25,
            description: 'Gehaktbal',
            imageUrl: null,
            sourceUrl: null,
        },
        {
            name: 'Broodje carpaccio',
            price: 5.25,
            description: 'Carpaccio met pesto en parmezaan',
            imageUrl: null,
            sourceUrl: null,
        },
        {
            name: 'Broodje rosbief',
            price: 5.00,
            description: 'Rosbief met remoulade',
            imageUrl: null,
            sourceUrl: null,
        },
        {
            name: 'Broodje bacon',
            price: 4.50,
            description: 'Knapperige bacon',
            imageUrl: null,
            sourceUrl: null,
        },
        {
            name: 'Broodje blt',
            price: 5.00,
            description: 'Bacon, lettuce, tomato',
            imageUrl: null,
            sourceUrl: null,
        },
        // Vegetarian
        {
            name: 'Broodje hummus',
            price: 4.25,
            description: 'Hummus met groenten',
            imageUrl: null,
            sourceUrl: null,
        },
        {
            name: 'Broodje falafel',
            price: 4.50,
            description: 'Falafel met tahini',
            imageUrl: null,
            sourceUrl: null,
        },
        {
            name: 'Broodje gegrilde groenten',
            price: 4.75,
            description: 'Gegrilde groenten met pesto',
            imageUrl: null,
            sourceUrl: null,
        },
    ];

    for (const product of products) {
        await prisma.product.upsert({
            where: { id: `seed-${product.name.replace(/\s+/g, '-')}` },
            update: product,
            create: {
                id: `seed-${product.name.replace(/\s+/g, '-')}`,
                ...product,
            },
        });
    }

    console.log(`✅ Created ${products.length} sandwich products`);

    // Create scraper log
    await prisma.scraperLog.create({
        data: {
            status: 'success',
            message: `Seed data created with ${products.length} products`,
            productsFound: products.length,
        },
    });

    console.log('✅ Database seeded successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
