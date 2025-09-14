// This line imports a tool from Next.js to help us send responses.
import { NextResponse } from 'next/server';
// This line imports the Prisma client we just generated.
import { PrismaClient } from '@prisma/client';

// We create a single instance of the Prisma Client to be used by our API.
const prisma = new PrismaClient();

// This is an async function that handles any GET request coming to this URL.
export async function GET(request: Request) {
  try {
    // --- CRITICAL STEP: FIND AND REPLACE YOUR TENANT ID ---
    // 1. Go to your NeonDB dashboard in your web browser.
    // 2. On the left, click on "Tables".
    // 3. Click on the table named "Tenant".
    // 4. You will see a row for your store. Copy the long string of characters from the "id" column.
    // 5. Paste that ID string in the line below, replacing the placeholder text.
    const tenantId = "20bacf76-d117-4516-88f8-8dae22428f56"; // <-- PASTE YOUR ID HERE

    // Query 1: Use Prisma to count the number of rows in the "Customer" table for this tenant.
    const totalCustomers = await prisma.customer.count({
      where: { tenantId: tenantId },
    });

    // Query 2: Count the rows in the "Order" table for this tenant.
    const totalOrders = await prisma.order.count({
      where: { tenantId: tenantId },
    });

    // Query 3: Sum up the 'totalPrice' from all paid orders for this tenant.
    const revenueAggregation = await prisma.order.aggregate({
      _sum: {
        totalPrice: true,
      },
      where: {
        tenantId: tenantId,
        financialStatus: 'paid' // We only want to count revenue from completed payments.
      },
    });

    // The result from the sum query is an object. We get the value, or 0 if there's no revenue.
    const totalRevenue = revenueAggregation._sum.totalPrice || 0;

    // Finally, send all the data back to the browser in a structured JSON format.
    return NextResponse.json({
      totalCustomers,
      totalOrders,
      totalRevenue,
    });

  } catch (error) {
    // If any of the database queries fail, we log the error to the server console...
    console.error("Failed to fetch stats:", error);
    // ...and send a generic "Internal Server Error" message to the browser.
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}