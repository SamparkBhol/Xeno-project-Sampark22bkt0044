import express from 'express';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { handleWebhook } from './services/webhookService';

const app = express();
const prisma = new PrismaClient();

// Middleware to verify Shopify webhook HMAC
const verifyShopifyWebhook = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const hmac = req.get('X-Shopify-Hmac-Sha256');
    const topic = req.get('X-Shopify-Topic');
    const shop = req.get('X-Shopify-Shop-Domain');
    const body = req.body;

    if (!hmac || !topic || !shop) {
        console.error('Missing Shopify webhook headers');
        return res.status(401).send('Unauthorized');
    }

    const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET;
    if (!SHOPIFY_WEBHOOK_SECRET) {
        console.error('SHOPIFY_WEBHOOK_SECRET is not set');
        return res.status(500).send('Internal Server Error');
    }

    const generatedHmac = crypto
        .createHmac('sha256', SHOPIFY_WEBHOOK_SECRET)
        .update(body)
        .digest('base64');

    if (generatedHmac === hmac) {
        next();
    } else {
        console.error('HMAC verification failed');
        return res.status(401).send('Unauthorized');
    }
};


app.use(express.json({
    verify: (req: express.Request, res, buf) => {
        req.body = buf.toString(); // Keep the raw body for HMAC verification
    }
}));


app.get('/', (req, res) => {
    res.send('Shopify Data Ingestion Service is running!');
});

// Endpoint for receiving all Shopify webhooks
app.post('/webhooks', verifyShopifyWebhook, async (req, res) => {
    try {
        const topic = req.get('X-Shopify-Topic') as string;
        const shopDomain = req.get('X-Shopify-Shop-Domain') as string;
        const data = JSON.parse(req.body);

        console.log(`Received webhook for topic: ${topic} from ${shopDomain}`);

        // Find or create the tenant
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
            console.log(`Created new tenant: ${tenant.name}`);
        }

        await handleWebhook(topic, data, tenant.id);

        res.status(200).send('Webhook received');
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).send('Error processing webhook');
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
