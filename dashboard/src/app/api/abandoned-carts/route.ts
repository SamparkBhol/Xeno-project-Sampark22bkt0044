import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: Request) {
  try {
    // NOTE: This uses the tenantId from our previous successful setup.
    const tenantId = "20bacf76-d117-4516-88f8-8dae22428f56"; 

    // This query now correctly uses the new 'Checkout' model from your updated schema.
    // It counts all checkouts that were started but never completed.
    const abandonedCount = await prisma.checkout.count({
      where: {
        tenantId: tenantId,
        isCompleted: false, // The key filter for identifying abandoned carts
      },
    });

    return NextResponse.json({ count: abandonedCount });

  } catch (error) {
    console.error("Failed to fetch abandoned carts:", error);
    // Return a graceful response with a count of 0 if the query fails for any reason.
    // This prevents the entire dashboard from crashing.
    return NextResponse.json({ count: 0 });
  }
}

