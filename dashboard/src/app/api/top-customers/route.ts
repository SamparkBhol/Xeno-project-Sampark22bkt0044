import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    // --- CRITICAL STEP: Use the same Tenant ID from Part B ---
    const tenantId = "20bacf76-d117-4516-88f8-8dae22428f56"; // <-- PASTE YOUR ID HERE

    // This is a more advanced Prisma query.
    // Step 1: We group all orders by the customer who made them.
    const topCustomerSpend = await prisma.order.groupBy({
      by: ['customerId'], // The field we are grouping by.
      where: {
        tenantId: tenantId,
        customerId: {
          not: null, // We must ignore orders that aren't linked to a customer.
        },
        financialStatus: 'paid'
      },
      // For each customer group, we sum up their 'totalPrice'.
      _sum: {
        totalPrice: true,
      },
      // We order the groups in descending order based on the sum.
      orderBy: {
        _sum: {
          totalPrice: 'desc',
        },
      },
      // We only want the top 5 results.
      take: 5,
    });

    // The result from Step 1 only gives us customer IDs and their total spend.
    // Now, we need to get the actual customer names and emails.
    const customerIds = topCustomerSpend.map(c => c.customerId as string);

    const customers = await prisma.customer.findMany({
        where: {
            id: {
                in: customerIds, // Find all customers whose ID is in our list of top spenders.
            }
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
        }
    });

    // Step 3: Now we merge the two pieces of data together.
    const topCustomersData = topCustomerSpend.map(spendInfo => {
        const customerInfo = customers.find(c => c.id === spendInfo.customerId);
        return {
            name: `${customerInfo?.firstName || ''} ${customerInfo?.lastName || ''}`.trim(),
            email: customerInfo?.email,
            totalSpend: spendInfo._sum.totalPrice
        }
    });

    return NextResponse.json(topCustomersData);

  } catch (error) {
    console.error("Failed to fetch top customers:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}