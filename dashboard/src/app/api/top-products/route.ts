import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    // NOTE: Using the tenantId you provided earlier
    const tenantId = "20bacf76-d117-4516-88f8-8dae22428f56"; 

    // This query finds all order items for paid orders, groups them by product,
    // and calculates the total revenue and quantity sold for each product.
    const productSales = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        tenantId: tenantId,
        order: {
          financialStatus: 'paid',
        },
        productId: {
          not: null,
        },
      },
      _sum: {
        price: true, // Total revenue from this product
      },
      orderBy: {
        _sum: {
          price: 'desc', // Order by the highest revenue
        },
      },
      take: 5, // Get the top 5
    });

    const productIds = productSales.map((p: { productId: string; }) => p.productId as string);

    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      select: { id: true, title: true },
    });

    // Combine the sales data with the product titles for the chart
    const topProducts = productSales.map((sale: { productId: any; _sum: { price: any; }; }) => {
      const productInfo = products.find((p: { id: any; }) => p.id === sale.productId);
      return {
        name: productInfo?.title || 'Unknown Product',
        revenue: sale._sum.price || 0,
      };
    });

    return NextResponse.json(topProducts);

  } catch (error) {
    console.error("Failed to fetch top products:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
