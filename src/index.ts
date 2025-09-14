import express from 'express';
import crypto from 'crypto';
import axios from 'axios';
import amqp from 'amqplib';
import 'dotenv/config';

const app = express();

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
const APP_URL = process.env.APP_URL; // Your ngrok URL
const RABBITMQ_URL = process.env.RABBITMQ_URL;

let amqpChannel: amqp.Channel | null = null;
const QUEUE_NAME = 'shopify_webhooks';

// Function to connect to RabbitMQ
async function connectRabbitMQ() {
    try {
        if (!RABBITMQ_URL) {
            throw new Error("RABBITMQ_URL is not defined in the environment variables.");
        }
        const connection = await amqp.connect(RABBITMQ_URL);
        amqpChannel = await connection.createChannel();
        await amqpChannel.assertQueue(QUEUE_NAME, { durable: true });
        console.log('Successfully connected to RabbitMQ and asserted queue.');
    } catch (error) {
        console.error('Failed to connect to RabbitMQ:', error);
        // In a real app, you'd have a retry mechanism here.
    }
}


// Function to register a webhook with Shopify's API
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


// 1. App Installation and Authentication Routes
app.get('/auth', (req, res) => {
    const shop = req.query.shop as string;
    if (shop) {
        const scopes = 'read_products,read_customers,write_customers,read_orders,read_checkouts,read_draft_orders';
        const redirectUri = `${APP_URL}/auth/callback`;
        const installUrl = `https://` + shop + `/admin/oauth/authorize?client_id=` + SHOPIFY_API_KEY +
            `&scope=` + scopes + `&redirect_uri=` + redirectUri;

        res.redirect(installUrl);
    } else {
        return res.status(400).send('Missing shop parameter. Please add ?shop=your-shop-name.myshopify.com to your request');
    }
});

app.get('/auth/callback', async (req, res) => {
    const { shop, code } = req.query;

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

        // After installing, immediately register our webhooks.
        await registerWebhook(shop, accessToken, 'customers/create');
        await registerWebhook(shop, accessToken, 'products/create');
        await registerWebhook(shop, accessToken, 'orders/create');
        await registerWebhook(shop, accessToken, 'checkouts/create'); // For abandoned carts
        await registerWebhook(shop, accessToken, 'checkouts/update'); // For abandoned carts

        res.status(200).send('<h1>App Installed & Webhooks Registered Successfully!</h1><p>You can now close this window.</p>');

    } catch (error: any) {
        console.error('Error fetching access token:', error.response?.data);
        res.status(500).send('Error fetching access token');
    }
});


// Middleware to keep the raw body for HMAC verification
app.use(express.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    }
}));


// 2. Webhook Ingestion Route
app.post('/webhooks', async (req, res) => {
    // We send a 200 OK response immediately to Shopify before processing
    res.status(200).send('Webhook received');
    
    try {
        if (!amqpChannel) {
            console.error("RabbitMQ channel not available. Cannot queue webhook.");
            return;
        }

        // Extract necessary info to send to the worker
        const webhookData = {
            topic: req.get('X-Shopify-Topic'),
            shopDomain: req.get('X-Shopify-Shop-Domain'),
            hmac: req.get('X-Shopify-Hmac-Sha256'),
            body: (req as any).rawBody.toString('utf-8') // Send the raw body as a string
        };

        // Send the data to the RabbitMQ queue
        amqpChannel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(webhookData)), { persistent: true });
        console.log(`[Server] Webhook for topic ${webhookData.topic} sent to queue.`);

    } catch (error) {
        console.error('[Server] Error queuing webhook:', error);
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    await connectRabbitMQ(); // Connect to RabbitMQ when the server starts
    console.log(`[Server] Web server is running on port ${PORT}`);
});

