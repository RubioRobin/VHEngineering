import ExcelJS from 'exceljs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface OrderWithDetails {
    id: string;
    personName: string;
    department: string | null;
    createdAt: Date;
    orderItems: {
        id: string;
        quantity: number;
        comment: string | null;
        product: {
            name: string;
            price: number | null;
        };
    }[];
}

/**
 * Generate Excel file with order data
 * Tab 1: Orders per person
 * Tab 2: Totals per sandwich
 */
export async function generateOrdersExcel(periodId: string): Promise<Buffer> {
    // Fetch orders for the period
    const orders = await prisma.order.findMany({
        where: {
            orderPeriod: {
                weekId: periodId,
            },
        },
        include: {
            orderItems: {
                include: {
                    product: true,
                },
            },
        },
        orderBy: {
            createdAt: 'asc',
        },
    }) as OrderWithDetails[];

    const workbook = new ExcelJS.Workbook();

    // ===== TAB 1: Per Person =====
    const personSheet = workbook.addWorksheet('Per Persoon');

    // Define columns
    personSheet.columns = [
        { header: 'Naam', key: 'name', width: 20 },
        { header: 'Afdeling', key: 'department', width: 15 },
        { header: 'Broodje', key: 'sandwich', width: 30 },
        { header: 'Aantal', key: 'quantity', width: 10 },
        { header: 'Opmerking', key: 'comment', width: 30 },
        { header: 'Prijs', key: 'price', width: 10 },
        { header: 'Besteld op', key: 'orderedAt', width: 20 },
    ];

    // Style header row
    personSheet.getRow(1).font = { bold: true };
    personSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE8DCC8' }, // Light beige
    };

    // Add data rows
    orders.forEach(order => {
        order.orderItems.forEach(item => {
            personSheet.addRow({
                name: order.personName,
                department: order.department || '-',
                sandwich: item.product.name,
                quantity: item.quantity,
                comment: item.comment || '-',
                price: item.product.price ? `€ ${item.product.price.toFixed(2)}` : '-',
                orderedAt: order.createdAt.toLocaleString('nl-NL'),
            });
        });
    });

    // ===== TAB 2: Totals =====
    const totalsSheet = workbook.addWorksheet('Totalen');

    // Define columns
    totalsSheet.columns = [
        { header: 'Broodje', key: 'sandwich', width: 30 },
        { header: 'Totaal Aantal', key: 'totalQuantity', width: 15 },
        { header: 'Opmerkingen', key: 'comments', width: 50 },
        { header: 'Prijs per stuk', key: 'unitPrice', width: 15 },
        { header: 'Totaal Bedrag', key: 'totalPrice', width: 15 },
    ];

    // Style header row
    totalsSheet.getRow(1).font = { bold: true };
    totalsSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE8DCC8' },
    };

    // Aggregate data per sandwich
    const sandwichTotals = new Map<string, {
        name: string;
        quantity: number;
        comments: string[];
        price: number | null;
    }>();

    orders.forEach(order => {
        order.orderItems.forEach(item => {
            const existing = sandwichTotals.get(item.product.name);
            if (existing) {
                existing.quantity += item.quantity;
                if (item.comment) {
                    existing.comments.push(`${item.comment} (${item.quantity}x)`);
                }
            } else {
                sandwichTotals.set(item.product.name, {
                    name: item.product.name,
                    quantity: item.quantity,
                    comments: item.comment ? [`${item.comment} (${item.quantity}x)`] : [],
                    price: item.product.price,
                });
            }
        });
    });

    // Add totals rows
    Array.from(sandwichTotals.values())
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(item => {
            totalsSheet.addRow({
                sandwich: item.name,
                totalQuantity: item.quantity,
                comments: item.comments.join('; ') || '-',
                unitPrice: item.price ? `€ ${item.price.toFixed(2)}` : '-',
                totalPrice: item.price ? `€ ${(item.price * item.quantity).toFixed(2)}` : '-',
            });
        });

    // Add grand total row if prices available
    const grandTotal = Array.from(sandwichTotals.values())
        .reduce((sum, item) => {
            if (item.price) {
                return sum + (item.price * item.quantity);
            }
            return sum;
        }, 0);

    if (grandTotal > 0) {
        const totalRow = totalsSheet.addRow({
            sandwich: 'TOTAAL',
            totalQuantity: '',
            comments: '',
            unitPrice: '',
            totalPrice: `€ ${grandTotal.toFixed(2)}`,
        });
        totalRow.font = { bold: true };
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
}
