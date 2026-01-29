import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Fetch all email subscribers
export async function GET() {
    try {
        const emails = await prisma.emailSubscriber.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({ emails });
    } catch (error) {
        console.error('Error fetching emails:', error);
        return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
    }
}

// POST - Add new email subscriber
export async function POST(request: Request) {
    try {
        const { email, name } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const subscriber = await prisma.emailSubscriber.create({
            data: {
                email,
                name: name || null
            }
        });

        return NextResponse.json({ subscriber });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
        }
        console.error('Error adding email:', error);
        return NextResponse.json({ error: 'Failed to add email' }, { status: 500 });
    }
}

// DELETE - Remove email subscriber
export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        await prisma.emailSubscriber.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting email:', error);
        return NextResponse.json({ error: 'Failed to delete email' }, { status: 500 });
    }
}
// PATCH - Update email subscriber status
export async function PATCH(request: Request) {
    try {
        const { id, active } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const subscriber = await prisma.emailSubscriber.update({
            where: { id },
            data: { active }
        });

        return NextResponse.json({ subscriber });
    } catch (error) {
        console.error('Error updating email:', error);
        return NextResponse.json({ error: 'Failed to update email' }, { status: 500 });
    }
}
