import ExcelJS from 'exceljs';
import { PrismaClient } from '@prisma/client';
import { formatName } from './utils';

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

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'VH Engineering';
    workbook.created = new Date();

    // Helper for borders
    const addBorders = (cell: any) => {
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    };

    // Helper for header styling
    const styleHeader = (row: any) => {
        row.eachCell((cell: any) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF1E293B' }, // Slate-800
            };
            cell.font = {
                bold: true,
                color: { argb: 'FFFFFFFF' },
                size: 12
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            addBorders(cell);
        });
        row.height = 30;
    };

    // ===== TAB 1: Per Persoon =====
    const personSheet = workbook.addWorksheet('Per Persoon');

    personSheet.columns = [
        { header: 'Naam', key: 'name', width: 25 },
        { header: 'Afdeling', key: 'department', width: 20 },
        { header: 'Product', key: 'sandwich', width: 35 },
        { header: 'Aantal', key: 'quantity', width: 10 },
        { header: 'Opmerking', key: 'comment', width: 40 },
        { header: 'Prijs', key: 'price', width: 15 },
        { header: 'Besteld op', key: 'orderedAt', width: 25 },
    ];

    styleHeader(personSheet.getRow(1));

    orders.forEach(order => {
        order.orderItems.forEach(item => {
            const row = personSheet.addRow({
                name: order.personName,
                department: order.department || '-',
                sandwich: formatName(item.product.name),
                quantity: item.quantity,
                comment: item.comment || '-',
                price: item.product.price ? item.product.price : 0, // Store as number for Excel math
                orderedAt: order.createdAt.toLocaleString('nl-NL'),
            });

            // Center quantity and format currency
            row.getCell('quantity').alignment = { horizontal: 'center' };
            row.getCell('price').numFmt = '€ #,##0.00';

            // Add borders to all cells
            row.eachCell((cell) => {
                addBorders(cell);
                cell.alignment = { ...cell.alignment, vertical: 'middle' };
            });
        });
    });

    // ===== TAB 2: Totaallijst =====
    const totalsSheet = workbook.addWorksheet('Totaallijst');

    totalsSheet.columns = [
        { header: 'Product', key: 'sandwich', width: 35 },
        { header: 'Aantal', key: 'totalQuantity', width: 15 },
        { header: 'Opmerkingen', key: 'comments', width: 60 },
        { header: 'Stukprijs', key: 'unitPrice', width: 15 },
        { header: 'Totaal', key: 'totalPrice', width: 15 },
    ];

    styleHeader(totalsSheet.getRow(1));

    // Aggregate data
    const sandwichTotals = new Map<string, {
        name: string;
        quantity: number;
        comments: string[];
        price: number | null;
    }>();

    orders.forEach(order => {
        order.orderItems.forEach(item => {
            const key = formatName(item.product.name);
            const existing = sandwichTotals.get(key);
            if (existing) {
                existing.quantity += item.quantity;
                if (item.comment) {
                    existing.comments.push(`${item.comment} (${item.quantity}x)`);
                }
            } else {
                sandwichTotals.set(key, {
                    name: key,
                    quantity: item.quantity,
                    comments: item.comment ? [`${item.comment} (${item.quantity}x)`] : [],
                    price: item.product.price,
                });
            }
        });
    });

    // Sort and Add Rows
    const sortedTotals = Array.from(sandwichTotals.values())
        .sort((a, b) => b.quantity - a.quantity); // Most ordered first

    sortedTotals.forEach(item => {
        const row = totalsSheet.addRow({
            sandwich: item.name,
            totalQuantity: item.quantity,
            comments: item.comments.join('; ') || '-',
            unitPrice: item.price ? item.price : 0,
            totalPrice: item.price ? (item.price * item.quantity) : 0,
        });

        row.getCell('totalQuantity').alignment = { horizontal: 'center' };
        row.getCell('unitPrice').numFmt = '€ #,##0.00';
        row.getCell('totalPrice').numFmt = '€ #,##0.00';

        row.eachCell((cell) => {
            addBorders(cell);
            cell.alignment = { ...cell.alignment, vertical: 'middle' };
        });
    });

    // Grand Total Row
    const grandTotal = sortedTotals.reduce((sum, item) => sum + (item.price ? item.price * item.quantity : 0), 0);

    // Add Shipping Cost Row (Hardcoded for now as per previous logic, usually 1.95 total split)
    // Actually, usually shipping is just added on top. Let's add a "Bezorgkosten" row if needed, 
    // but the user only asked for "slick" look. I'll stick to product totals + grand total.

    // Add empty row
    totalsSheet.addRow([]);

    const totalRow = totalsSheet.addRow({
        sandwich: 'TOTAAL GENERAAL',
        totalQuantity: sortedTotals.reduce((sum, i) => sum + i.quantity, 0),
        comments: '',
        unitPrice: '',
        totalPrice: grandTotal,
    });

    totalRow.height = 30;
    totalRow.eachCell((cell) => {
        cell.font = { bold: true, size: 14 };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE2E8F0' }, // Light gray
        };
        addBorders(cell);
        cell.alignment = { vertical: 'middle' };
    });

    totalRow.getCell('totalQuantity').alignment = { horizontal: 'center', vertical: 'middle' };
    totalRow.getCell('totalPrice').numFmt = '€ #,##0.00_'; // Accounting format

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
}
