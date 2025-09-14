import express from 'express';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { handleWebhook } from './services/webhookService';
import axios from 'axios';
import 'dotenv/config';

const app = express();
const prisma = new PrismaClient();

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
const APP_URL = process.env.APP_URL;

// =================================================================
// NEW FUNCTION - This function tells Shopify to create a webhook subscription
// =================================================================
async function registerWebhook(shop: string, accessToken: string, topic: string) {
    const webhookUrl = `${APP_URL}/webhooks`;
    const webhookApiUrl = `https://${shop}/admin/api/2025-07/webhooks.json`;

    const webhookPayload = {
        webhook: {
            topic: topic,
            address: webhookUrl,
            format: 'json',
        },
    };

    try {
        await axios.post(webhookApiUrl, webhookPayload, {
            headers: {
                'X-Shopify-Access-Token': accessToken,
            },
        });
        console.log(`Successfully registered webhook for topic: ${topic}`);
    } catch (error: any) {
        console.error(`Failed to register webhook for topic: ${topic}`, error.response?.data);
    }
}


app.get('/auth', (req, res) => {
    const shop = req.query.shop as string;
    if (shop) {
        const scopes = 'read_products,read_customers,write_customers,read_orders,read_checkouts';
        const redirectUri = `${APP_URL}/auth/callback`;
        const installUrl = `https://` + shop + `/admin/oauth/authorize?client_id=` + SHOPIFY_API_KEY +
            `&scope=` + scopes + `&redirect_uri=` + redirectUri;

        res.redirect(installUrl);
    } else {
        return res.status(400).send('Missing shop parameter. Please add ?shop=your-shop-name.myshopify.com to your request');
    }
});

app.get('/auth/callback', async (req, res) => {
    const { shop, hmac, code } = req.query;

    if (typeof shop !== 'string' || typeof code !== 'string') {
        return res.status(400).send('Invalid request');
    }

    const accessTokenRequestUrl = 'https://' + shop + '/admin/oauth/access_token';
    const accessTokenPayload = {
        client_id: SHOPIFY_API_KEY,
        client_secret: SHOPIFY_API_SECRET,
        code,
    };

    try {
        const response = await axios.post(accessTokenRequestUrl, accessTokenPayload);
        const accessToken = response.data.access_token;

        console.log('Successfully retrieved access token!');

        // =================================================================
        // NEW CODE - After installing, immediately register our webhooks.
        // =================================================================
        await registerWebhook(shop, accessToken, 'customers/create');
        await registerWebhook(shop, accessToken, 'products/create');
        await registerWebhook(shop, accessToken, 'orders/create');
        // Add more topics here if needed

        res.status(200).send('<h1>App Installed & Webhooks Registered Successfully!</h1><p>You can now close this window.</p>');

    } catch (error: any) {
        console.error('Error fetching access token:', error.response?.data);
        res.status(500).send('Error fetching access token');
    }
});


const verifyShopifyWebhook = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const hmac = req.get('X-Shopify-Hmac-Sha256');
    const shop = req.get('X-Shopify-Shop-Domain');
    if (!hmac || !shop) return res.status(401).send('Unauthorized');

    const rawBody = (req as any).rawBody;
    const generatedHmac = crypto.createHmac('sha256', SHOPIFY_API_SECRET as string).update(rawBody).digest('base64');
    
    if (generatedHmac === hmac) {
        next();
    } else {
        console.error('HMAC verification failed');
        return res.status(401).send('Unauthorized');
    }
};

app.use(express.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    }
}));

app.get('/', (req, res) => {
    res.send('Shopify Data Ingestion Service is running!');
});

app.post('/webhooks', verifyShopifyWebhook, async (req, res) => {
    try {
        const topic = req.get('X-Shopify-Topic') as string;
        const shopDomain = req.get('X-Shopify-Shop-Domain') as string;
        const data = req.body; // The body is already parsed by express.json()

        console.log(`Received webhook for topic: ${topic} from ${shopDomain}`);

        let tenant = await prisma.tenant.findUnique({ where: { shopifyDomain: shopDomain } });
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