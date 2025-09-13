import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Handles incoming Shopify webhooks based on the topic.
 * @param topic The webhook topic (e.g., 'orders/create').
 * @param data The data payload from the webhook.
 * @param tenantId The ID of the tenant (store).
 */
export async function handleWebhook(topic: string, data: any, tenantId: string): Promise<void> {
    console.log(`Processing webhook topic: ${topic} for tenant: ${tenantId}`);

    switch (topic) {
        // Customer Events
        case 'customers/create':
        case 'customers/update':
            await upsertCustomer(data, tenantId);
            break;
        case 'customers/delete':
             if (data.id) {
                await deleteCustomer(data.id.toString(), tenantId);
            }
            break;

        // Product Events
        case 'products/create':
        case 'products/update':
            await upsertProduct(data, tenantId);
            break;
        case 'products/delete':
            if (data.id) {
                await deleteProduct(data.id.toString(), tenantId);
            }
            break;

        // Order Events
        case 'orders/create':
        case 'orders/updated':
            await upsertOrder(data, tenantId);
            break;
        case 'orders/delete':
            if (data.id) {
                await deleteOrder(data.id.toString(), tenantId);
            }
            break;

        // Cart & Checkout Events (Bonus)
        case 'carts/create':
        case 'carts/update':
            await upsertCart(data, tenantId);
            break;
        case 'checkouts/create':
        case 'checkouts/update':
            // The cart ID is the same as checkout ID
            if (data.cart_token) {
                 await upsertCart(data, tenantId, 'checkout_started');
            }
            break;
        case 'checkouts/delete':
            // This event is triggered when a checkout is completed or abandoned
            if (data.cart_token) {
                await deleteCart(data.cart_token, tenantId);
            }
            break;


        default:
            console.log(`Unhandled webhook topic: ${topic}`);
    }
}

async function upsertCustomer(customerData: any, tenantId: string) {
    const { id, first_name, last_name, email, phone, default_address } = customerData;
    const customerIdString = id.toString();

    await prisma.customer.upsert({
        where: { shopifyCustomerId_tenantId: { shopifyCustomerId: customerIdString, tenantId } },
        update: {
            firstName: first_name,
            lastName: last_name,
            email: email,
            phone: phone,
            address: default_address ? JSON.stringify(default_address) : undefined,
        },
        create: {
            shopifyCustomerId: customerIdString,
            firstName: first_name,
            lastName: last_name,
            email: email,
            phone: phone,
            address: default_address ? JSON.stringify(default_address) : undefined,
            tenantId: tenantId,
        },
    });
    console.log(`Upserted customer ${customerIdString} for tenant ${tenantId}`);
}

async function deleteCustomer(shopifyCustomerId: string, tenantId: string) {
    try {
        await prisma.customer.delete({
            where: { shopifyCustomerId_tenantId: { shopifyCustomerId, tenantId } },
        });
        console.log(`Deleted customer ${shopifyCustomerId} for tenant ${tenantId}`);
    } catch (error: any) {
        if (error.code !== 'P2025') { // Prisma's code for record not found
            console.error(`Error deleting customer ${shopifyCustomerId}:`, error);
        }
    }
}


async function upsertProduct(productData: any, tenantId: string) {
    const { id, title, handle, vendor, product_type, variants, image } = productData;
    const productIdString = id.toString();

    const product = await prisma.product.upsert({
        where: { shopifyProductId_tenantId: { shopifyProductId: productIdString, tenantId } },
        update: {
            title: title,
            handle: handle,
            vendor: vendor,
            productType: product_type,
            imageUrl: image?.src,
        },
        create: {
            shopifyProductId: productIdString,
            title: title,
            handle: handle,
            vendor: vendor,
            productType: product_type,
            imageUrl: image?.src,
            tenantId: tenantId,
        },
    });
    console.log(`Upserted product ${productIdString} for tenant ${tenantId}`);

    // Upsert variants
    if (variants && variants.length > 0) {
        for (const variantData of variants) {
            const variantIdString = variantData.id.toString();
            await prisma.variant.upsert({
                where: { shopifyVariantId_tenantId: { shopifyVariantId: variantIdString, tenantId } },
                update: {
                    title: variantData.title,
                    sku: variantData.sku,
                    price: parseFloat(variantData.price),
                },
                create: {
                    shopifyVariantId: variantIdString,
                    title: variantData.title,
                    sku: variantData.sku,
                    price: parseFloat(variantData.price),
                    productId: product.id,
                    tenantId: tenantId,
                },
            });
        }
        console.log(`Upserted ${variants.length} variants for product ${productIdString}`);
    }
}

async function deleteProduct(shopifyProductId: string, tenantId: string) {
     try {
        await prisma.product.delete({
            where: { shopifyProductId_tenantId: { shopifyProductId, tenantId } },
        });
        console.log(`Deleted product ${shopifyProductId} for tenant ${tenantId}`);
    } catch (error: any) {
        if (error.code !== 'P2025') {
            console.error(`Error deleting product ${shopifyProductId}:`, error);
        }
    }
}


async function upsertOrder(orderData: any, tenantId: string) {
    const { id, order_number, total_price, currency, financial_status, fulfillment_status, customer, line_items, transactions } = orderData;
    const orderIdString = id.toString();

     let dbCustomer;
    if (customer?.id) {
        // Ensure customer exists before linking
        dbCustomer = await prisma.customer.findUnique({
            where: { shopifyCustomerId_tenantId: { shopifyCustomerId: customer.id.toString(), tenantId } }
        });
        if (!dbCustomer) {
            await upsertCustomer(customer, tenantId);
            dbCustomer = await prisma.customer.findUnique({
                where: { shopifyCustomerId_tenantId: { shopifyCustomerId: customer.id.toString(), tenantId } }
            });
        }
    }


    const order = await prisma.order.upsert({
        where: { shopifyOrderId_tenantId: { shopifyOrderId: orderIdString, tenantId } },
        update: {
            totalPrice: parseFloat(total_price),
            currency: currency,
            financialStatus: financial_status,
            fulfillmentStatus: fulfillment_status,
        },
        create: {
            shopifyOrderId: orderIdString,
            orderNumber: order_number.toString(),
            totalPrice: parseFloat(total_price),
            currency: currency,
            financialStatus: financial_status,
            fulfillmentStatus: fulfillment_status,
            customerId: dbCustomer?.id,
            tenantId: tenantId,
        },
    });
    console.log(`Upserted order ${orderIdString} for tenant ${tenantId}`);

    // Upsert line items
    if (line_items && line_items.length > 0) {
        for (const itemData of line_items) {
             let dbProduct;
            if (itemData.product_id) {
                dbProduct = await prisma.product.findUnique({
                    where: { shopifyProductId_tenantId: { shopifyProductId: itemData.product_id.toString(), tenantId } }
                });
            }

            await prisma.orderItem.upsert({
                where: { shopifyLineItemId_tenantId: { shopifyLineItemId: itemData.id.toString(), tenantId } },
                update: {
                    quantity: itemData.quantity,
                    price: parseFloat(itemData.price),
                },
                create: {
                    shopifyLineItemId: itemData.id.toString(),
                    quantity: itemData.quantity,
                    price: parseFloat(itemData.price),
                    orderId: order.id,
                    productId: dbProduct?.id, // Can be null if product doesn't exist yet
                    tenantId: tenantId,
                },
            });
        }
    }

    // Upsert transactions
    if (transactions && transactions.length > 0) {
        for (const transData of transactions) {
            await prisma.transaction.upsert({
                where: { shopifyTransactionId_tenantId: { shopifyTransactionId: transData.id.toString(), tenantId } },
                update: {
                    amount: parseFloat(transData.amount),
                    kind: transData.kind,
                    status: transData.status,
                },
                create: {
                    shopifyTransactionId: transData.id.toString(),
                    amount: parseFloat(transData.amount),
                    kind: transData.kind,
                    status: transData.status,
                    orderId: order.id,
                    tenantId: tenantId,
                },
            });
        }
    }
}

async function deleteOrder(shopifyOrderId: string, tenantId: string) {
    try {
        await prisma.order.delete({
            where: { shopifyOrderId_tenantId: { shopifyOrderId, tenantId } },
        });
        console.log(`Deleted order ${shopifyOrderId} for tenant ${tenantId}`);
    } catch (error: any) {
        if (error.code !== 'P2025') {
            console.error(`Error deleting order ${shopifyOrderId}:`, error);
        }
    }
}

async function upsertCart(cartData: any, tenantId: string, eventType: 'cart_updated' | 'checkout_started' | 'abandoned' = 'cart_updated') {
    const { id, token, line_items, total_price, customer } = cartData;
    const cartToken = token || id; // checkout hooks use `id`, cart hooks use `token`

    if (!cartToken) {
        console.log('No cart token found, skipping upsert.');
        return;
    }

     let dbCustomer;
    if (customer?.id) {
         dbCustomer = await prisma.customer.findUnique({
            where: { shopifyCustomerId_tenantId: { shopifyCustomerId: customer.id.toString(), tenantId } }
        });
        if (!dbCustomer) {
            await upsertCustomer(customer, tenantId);
             dbCustomer = await prisma.customer.findUnique({
                where: { shopifyCustomerId_tenantId: { shopifyCustomerId: customer.id.toString(), tenantId } }
            });
        }
    }


    let status = 'active';
    if(eventType === 'checkout_started') status = 'checkout_started';
    // Logic for 'abandoned' would be handled by a separate job/webhook

    const cart = await prisma.cart.upsert({
        where: { shopifyCartToken_tenantId: { shopifyCartToken: cartToken, tenantId } },
        update: {
            totalPrice: parseFloat(total_price),
            status: status,
        },
        create: {
            shopifyCartToken: cartToken,
            totalPrice: parseFloat(total_price),
            status: status,
            customerId: dbCustomer?.id,
            tenantId: tenantId,
        },
    });
    console.log(`Upserted cart ${cartToken} for tenant ${tenantId}`);

    // Clear old items before upserting new ones
    await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
    });


    // Upsert cart items
    if (line_items && line_items.length > 0) {
        for (const itemData of line_items) {
             let dbProduct;
            if (itemData.product_id) {
                dbProduct = await prisma.product.findUnique({
                    where: { shopifyProductId_tenantId: { shopifyProductId: itemData.product_id.toString(), tenantId } }
                });
            }

            await prisma.cartItem.create({
                data: {
                    shopifyLineItemId: itemData.id?.toString() || `${cartToken}-${itemData.variant_id}`, // Cart line items may not have IDs
                    quantity: itemData.quantity,
                    price: parseFloat(itemData.price),
                    cartId: cart.id,
                    productId: dbProduct?.id,
                    tenantId: tenantId,
                }
            });
        }
    }
}


async function deleteCart(shopifyCartToken: string, tenantId: string) {
    try {
        await prisma.cart.delete({
            where: { shopifyCartToken_tenantId: { shopifyCartToken, tenantId } },
        });
        console.log(`Deleted cart ${shopifyCartToken} for tenant ${tenantId}`);
    } catch (error: any) {
        if (error.code !== 'P2025') {
            console.error(`Error deleting cart ${shopifyCartToken}:`, error);
        }
    }
}
