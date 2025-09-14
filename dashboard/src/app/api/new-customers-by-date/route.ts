import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  
  try {
    const tenantId = "20bacf76-d117-4516-88f8-8dae22428f56"; // Your Tenant ID

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
    }

    const customers = await prisma.customer.findMany({
      where: {
        tenantId: tenantId,
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Process data to group new customers by day
    const dailyNewCustomers = customers.reduce((acc: { [key: string]: number }, customer) => {
      const date = customer.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += 1;
      return acc;
    }, {});

    return NextResponse.json(dailyNewCustomers);
  } catch (error) {
    console.error("Failed to fetch new customers by date:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
