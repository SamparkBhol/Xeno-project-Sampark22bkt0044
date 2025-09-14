import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  // This line gets the full URL of the request, e.g., ".../api/orders-by-date?startDate=...&endDate=..."
  const { searchParams } = new URL(request.url);
  // We extract the startDate and endDate values from the URL.
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  try {
    // --- CRITICAL STEP: Use the same Tenant ID from Part B ---
    const tenantId = "20bacf76-d117-4516-88f8-8dae22428f56"; // <-- PASTE YOUR ID HERE

    // If the URL is missing the date parameters, send back an error.
    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'startDate and endDate URL parameters are required' }, { status: 400 });
    }

    // Use Prisma to find all orders that match our criteria.
    const orders = await prisma.order.findMany({
      where: {
        tenantId: tenantId,
        // We filter by the 'createdAt' timestamp.
        createdAt: {
          gte: new Date(startDate), // 'gte' means "greater than or equal to" the start date.
          lte: new Date(endDate),   // 'lte' means "less than or equal to" the end date.
        },
      },
      // We only select the columns we need to make the query faster.
      select: {
        createdAt: true,
        totalPrice: true,
      },
      // Sort the results by date.
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Send the list of found orders back as a JSON response.
    return NextResponse.json(orders);

  } catch (error) {
    console.error("Failed to fetch orders by date:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}