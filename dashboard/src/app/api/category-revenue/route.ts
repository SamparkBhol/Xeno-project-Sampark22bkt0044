import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const tenantId = "20bacf76-d117-4516-88f8-8dae22428f56"; // Your Tenant ID

    const orderItems = await prisma.orderItem.findMany({
      where: {
        tenantId: tenantId,
        order: { financialStatus: 'paid' },
        product: { productType: { not: null } }
      },
      include: {
        product: { select: { productType: true } },
      },
    });
    const revenueByCategory = orderItems.reduce((acc: Record<string, number>, item) => {
      const category = item.product?.productType ?? 'Uncategorized';
      acc[category] = (acc[category] || 0) + item.price;
      return acc;
    }, {} as Record<string, number>);

    const categoryData = Object.entries(revenueByCategory).map(([name, value]) => ({ name, value }));

    return NextResponse.json(categoryData);
  } catch (error) {
    console.error("Failed to fetch category revenue:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

