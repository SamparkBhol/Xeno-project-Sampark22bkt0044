Xeno FDE Internship Assignment: Technical Documentation
Project: Multi-Tenant Shopify Data Ingestion & Insights Service

Author: [Your Name Here]

Date: September 14, 2025

1. Project Goal & Assumptions
1.1. Project Goal
The primary goal of this project was to design, build, and deploy a multi-tenant Shopify Data Ingestion & Insights Service. This service simulates how a real-world platform like Xeno would onboard enterprise retailers by connecting to their Shopify stores, ingesting key business data in real-time, and presenting it in a secure, insightful, and user-friendly analytics dashboard.

The project encompasses a complete, full-stack solution, including a robust backend service for data ingestion, a secure and scalable database architecture, and a dynamic frontend dashboard for data visualization.

1.2. Assumptions Made
To deliver a functional proof-of-concept within the assignment's scope, the following assumptions were made:

Authentication Scope: The dashboard is protected by a single, hard-coded user (test@xeno.com). A production system would have a full user management and invitation system, but this was simplified to focus on the core data pipeline and visualization features.

Tenant Onboarding: The initial tenant record is created programmatically upon the first received webhook from a new Shopify store. A production application would feature a more explicit and secure onboarding flow where tenants formally install and authorize the app.

Webhook Reliability: The system assumes that Shopify webhooks will be delivered successfully. In a production environment, a queuing system (like RabbitMQ or AWS SQS) would be implemented to handle webhook delivery failures and retries, ensuring no data is lost.

Data Models: The Prisma schema was designed to capture the most critical fields from Shopify's API responses for customers, orders, and products. It is not an exhaustive 1-to-1 mapping of every possible field but is structured to support the required analytics.

Abandoned Cart Data: The bonus metric for "Abandoned Carts" is designed to query a Checkout model. It is assumed that this model might not be populated by default webhooks. The code is written to handle this gracefully by returning 0 if the model is not present or populated, preventing the dashboard from crashing.

Product Categorization: The "Revenue by Category" chart assumes that the productType field in the Shopify Product model is used for categorization. If this field is empty, products are grouped under an "Uncategorized" label.

2. High-Level Architecture
The service is designed using a modern, decoupled three-tier architecture, which ensures scalability, maintainability, and a clear separation of concerns.

Components:

Frontend (Insights Dashboard): A client-side application built with Next.js and React. It is responsible for all user interface elements, data visualization, and user interaction. It communicates with our own backend APIs, not directly with the database, ensuring a secure data flow.

Backend (Data Ingestion Service): A server-side application built with Node.js and Express.js. Its primary responsibilities are handling the Shopify OAuth2 installation flow, receiving and verifying Shopify webhooks, and processing and storing the incoming data into the database.

Database: A serverless PostgreSQL database hosted on NeonDB. It stores all the ingested data from various Shopify stores. The schema, managed by Prisma ORM, is designed for multi-tenancy, with every key data table containing a tenantId to ensure strict data isolation between different stores.

Data Flow Diagram:

Installation: The process begins when a merchant installs the app. They are redirected from their store to our Express.js backend's /auth endpoint.

OAuth Handshake: The backend performs the OAuth2 handshake with Shopify, obtaining a permanent access token.

Webhook Registration: Immediately after a successful installation, the backend makes an API call back to Shopify to programmatically register the necessary webhooks (customers/create, orders/create, etc.), telling Shopify to send real-time updates to our /webhooks endpoint.

Real-time Ingestion: When an event occurs in the Shopify store (e.g., a new order is placed), Shopify sends a signed webhook payload to our backend's /webhooks endpoint.

Data Processing & Storage: The backend verifies the webhook's signature, processes the data, and uses Prisma to save it into the appropriate tables in the NeonDB database, always associating the data with the correct tenantId.

Dashboard Visualization: When a user logs into the Next.js dashboard, the frontend makes authenticated requests to its own internal API routes (/api/stats, /api/top-customers, etc.). These routes then query the NeonDB database (using the logged-in user's tenantId) and return the requested data to the frontend for visualization in charts and tables.

3. APIs and Data Models
3.1. Backend API (Express.js)
GET /auth: Initiates the Shopify app installation process.

GET /auth/callback: Handles the redirect from Shopify after a user authorizes the app. It exchanges the temporary code for a permanent access token and triggers the webhook registration.

POST /webhooks: The main endpoint for receiving all incoming webhooks from Shopify. It handles HMAC signature verification and routes the data to the appropriate service for processing.

3.2. Frontend API (Next.js)
GET /api/stats: Fetches key performance indicators (KPIs), including total revenue, orders, customers, and data for trend analysis.

GET /api/orders-by-date: Fetches aggregated order data within a specified date range for trend charts.

GET /api/new-customers-by-date: Fetches aggregated new customer data within a specified date range.

GET /api/top-customers: Fetches the top 5 customers ranked by their total spend.

GET /api/top-products: Fetches the top 5 products ranked by their total revenue.

GET /api/category-revenue: Fetches an aggregation of total revenue for each product category.

GET /api/abandoned-carts: (Bonus) Fetches a count of checkouts that were started but never completed.

3.3. Data Models (Prisma Schema)
The database schema is the backbone of the application, designed for multi-tenancy and relational integrity.

// This is your Prisma schema file.
// It tells Prisma how your database is structured.

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// Represents a single Shopify store tenant.
model Tenant {
  id            String    @id @default(cuid())
  name          String
  shopifyDomain String    @unique
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  customers     Customer[]
  products      Product[]
  orders        Order[]
  orderItems    OrderItem[]
  checkouts     Checkout[]
}

// Represents a customer from a Shopify store.
model Customer {
  id             String   @id
  tenantId       String
  tenant         Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  email          String?
  firstName      String?
  lastName       String?
  totalSpent     Float    @default(0)
  ordersCount    Int      @default(0)
  createdAt      DateTime
  updatedAt      DateTime
  orders         Order[]
}

// Represents a product from a Shopify store.
model Product {
  id           String      @id
  tenantId     String
  tenant       Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  title        String
  productType  String?
  vendor       String?
  createdAt    DateTime
  updatedAt    DateTime
  orderItems   OrderItem[]
}

// Represents a single order from a Shopify store.
model Order {
  id               String      @id
  tenantId         String
  tenant           Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  customerId       String?
  customer         Customer?   @relation(fields: [customerId], references: [id], onDelete: SetNull)
  totalPrice       Float
  financialStatus  String?
  fulfillmentStatus String?
  createdAt        DateTime
  updatedAt        DateTime
  lineItems        OrderItem[]
}

// Represents a single line item within an order.
model OrderItem {
  id        String   @id
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  orderId   String
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId String?
  product   Product? @relation(fields: [productId], references: [id], onDelete: SetNull)
  title     String
  quantity  Int
  price     Float
}

// (Bonus) Represents a checkout, completed or abandoned.
model Checkout {
  id          String    @id
  tenantId    String
  tenant      Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  totalPrice  Float
  createdAt   DateTime
  updatedAt   DateTime
  completedAt DateTime? // This will be null if the checkout was abandoned.
}

4. Next Steps to Productionize
While this project is a robust and feature-complete prototype, several steps would be necessary to prepare it for a production environment with real-world customers.

Enhanced Multi-Tenant Authentication: Implement a full authentication and authorization system. This would include user roles (admin, viewer), an invitation system for new team members, and a secure way for tenants to manage their own users.

Scalable Webhook Ingestion: Integrate a message queue like RabbitMQ or AWS SQS. When a webhook is received, the backend would place it into the queue and immediately respond to Shopify with a 200 OK. Separate worker processes would then pull from this queue to process and save the data. This makes the system resilient to database slowdowns and ingestion spikes, preventing webhook timeouts.

Comprehensive Testing Suite: Develop a full suite of tests, including:

Unit Tests for individual functions (e.g., calculating growth metrics).

Integration Tests to ensure the API routes correctly interact with the database.

End-to-End (E2E) Tests to simulate a user logging in, filtering data, and viewing charts, ensuring the entire system works together.

CI/CD Pipeline: Set up a Continuous Integration/Continuous Deployment pipeline using tools like GitHub Actions. This would automatically run tests, build the applications, and deploy any changes to production upon merging to the main branch, ensuring safe and reliable updates.

Historical Data Import: Create a feature that allows a new tenant to import their historical data from Shopify. The current webhook-only approach only captures data from the moment of installation forward. A production system must be able to ingest past orders, customers, and products.

Advanced Caching: Implement a caching layer (e.g., using Redis) for frequently accessed data, such as the results for the main stat cards. This would dramatically reduce database load and improve dashboard loading times.

Robust Logging and Monitoring: Integrate a professional logging service (like Datadog or Sentry) to capture all application errors and performance metrics. Set up dashboards and alerts to proactively monitor the health of the entire system.
