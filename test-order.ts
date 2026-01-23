import prisma from './lib/prisma';
import { getCurrentOrderPeriod } from './lib/orderPeriod';

async function testCreateOrder() {
    console.log('🚀 Starting order creation test...');

    try {
        // 1. Check if we have any products
        const products = await prisma.product.findMany({ take: 1 });
        if (products.length === 0) {
            console.error('❌ No products found in database. Run scraper first.');
            return;
        }
        const product = products[0];
        console.log(`📦 Using product: ${product.name} (${product.id})`);

        // 2. Get current order period
        const period = await getCurrentOrderPeriod();
        console.log(`⏰ Current period: ${period.weekId} (ID: ${period.id})`);

        // 3. Attempt to create order
        console.log('📝 Creating order...');
        const order = await prisma.order.create({
            data: {
                personName: 'Test User',
                department: 'Testing',
                clientToken: 'test-token-123',
                orderPeriodId: period.id,
                orderItems: {
                    create: [
                        {
                            productId: product.id,
                            quantity: 1,
                            comment: 'Test comment'
                        }
                    ]
                }
            },
            include: {
                orderItems: true
            }
        });

        console.log('✅ Order created successfully!');
        console.log(JSON.stringify(order, null, 2));

    } catch (error) {
        console.error('❌ Failed to create order:');
        console.error(error);
    } finally {
        process.exit();
    }
}

testCreateOrder();
