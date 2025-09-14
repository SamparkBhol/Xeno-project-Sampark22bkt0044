import amqp from 'amqplib';
import { PrismaClient } from '@prisma/client';
import { handleWebhook } from './services/webhookService';
import crypto from 'crypto';
import 'dotenv/config';

const prisma = new PrismaClient();
const RABBITMQ_URL = process.env.RABBITMQ_URL;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
const QUEUE_NAME = 'shopify_webhooks';

// This function verifies the HMAC signature of the webhook
function verifyShopifyWebhook(webhookData: any): boolean {
    if (!SHOPIFY_API_SECRET || !webhookData.hmac) {
        console.error('[Worker] Missing Shopify secret or HMAC for verification.');
        return false;
    }
    const { hmac, ...dataForHmac } = webhookData;
    const bodyForHmac = dataForHmac.body;

    const generatedHmac = crypto
        .createHmac('sha256', SHOPIFY_API_SECRET)
        .update(bodyForHmac, 'utf-8')
        .digest('base64');
    
    return generatedHmac === hmac;
}


async function startWorker() {
    if (!RABBITMQ_URL) {
        console.error("[Worker] RABBITMQ_URL is not defined. Worker cannot start.");
        return;
    }

    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();
        await channel.assertQueue(QUEUE_NAME, { durable: true });
        
        // This tells RabbitMQ to only send one message at a time to this worker
        channel.prefetch(1); 
        
        console.log(`[Worker] Waiting for messages in queue: ${QUEUE_NAME}. To exit press CTRL+C`);

        channel.consume(QUEUE_NAME, async (msg) => {
            if (msg !== null) {
                const webhookData = JSON.parse(msg.content.toString());
                console.log(`[Worker] Received message for topic: ${webhookData.topic}`);
                
                // 1. Verify the webhook signature
                if (!verifyShopifyWebhook(webhookData)) {
                    console.error('[Worker] HMAC verification failed. Discarding message.');
                    channel.ack(msg); // Acknowledge message to remove it from queue
                    return;
                }

                try {
                    // 2. Find or create the tenant
                    const shopDomain = webhookData.shopDomain;
                    let tenant = await prisma.tenant.findUnique({
                        where: { shopifyDomain: shopDomain },
                    });

                    if (!tenant) {
                        tenant = await prisma.tenant.create({
                            data: {
                                name: shopDomain.split('.')[0],
                                shopifyDomain: shopDomain,
                            },
                        });
                        console.log(`[Worker] Created new tenant: ${tenant.name}`);
                    }

                    // 3. Process the webhook data
                    const data = JSON.parse(webhookData.body);
                    await handleWebhook(webhookData.topic, data, tenant.id);
                    console.log(`[Worker] Successfully processed webhook for topic: ${webhookData.topic}`);
                    
                    // 4. Acknowledge the message was processed successfully
                    channel.ack(msg);
                } catch (error) {
                    console.error('[Worker] Error processing message:', error);
                    // In a production app, you might want to requeue the message or move it to a dead-letter queue
                    channel.nack(msg, false, false); // Nack without requeueing
                }
            }
        }, {
            noAck: false // We will manually acknowledge messages
        });
    } catch (error) {
        console.error('[Worker] Failed to connect to RabbitMQ and start worker:', error);
    }
}

startWorker();

