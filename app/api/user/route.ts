import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { name, department } = await request.json();

        if (!name || name.trim().length < 2) {
            return NextResponse.json(
                { error: 'Name is required (min 2 chars)' },
                { status: 400 }
            );
        }

        const cleanName = name.trim();
        const cleanDepartment = department ? department.trim() : null;

        // Find or create user
        let user = await prisma.user.findFirst({
            where: { name: cleanName },
            include: { favorites: true }
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    name: cleanName,
                    department: cleanDepartment
                },
                include: { favorites: true }
            });
        } else if (cleanDepartment && user.department !== cleanDepartment) {
            // Update department if it changed
            user = await prisma.user.update({
                where: { id: user.id },
                data: { department: cleanDepartment },
                include: { favorites: true }
            });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error in user API:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
