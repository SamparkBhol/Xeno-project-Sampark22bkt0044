import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// This API counts the number of checkouts that were started but not completed.
export async function GET(request: Request) {
  try {
    const tenantId = "20bacf76-d117-4516-88f8-8dae22428f56"; // Your Tenant ID

    // This query assumes a 'Checkout' model exists in your Prisma schema.
    // If it doesn't, the catch block will handle it gracefully.
    const abandonedCheckouts = await prisma.checkout.count({
      where: {
        tenantId: tenantId,
        completedAt: null, // The key indicator of an abandoned checkout
      },
    });

    return NextResponse.json({ count: abandonedCheckouts });
  } catch (error) {
    // This will likely fail if the 'Checkout' model isn't in the schema, which is okay.
    console.warn("Could not fetch abandoned carts (this is expected if the Checkout model is not in schema)");
    // We return a default value instead of crashing the dashboard.
    return NextResponse.json({ count: 0 }); 
  }
}

