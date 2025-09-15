-- CreateTable
CREATE TABLE "Checkout" (
    "id" TEXT NOT NULL,
    "shopifyCheckoutId" TEXT NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "Checkout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Checkout_shopifyCheckoutId_key" ON "Checkout"("shopifyCheckoutId");

-- CreateIndex
CREATE INDEX "Checkout_tenantId_idx" ON "Checkout"("tenantId");

-- CreateIndex
CREATE INDEX "Checkout_customerId_idx" ON "Checkout"("customerId");

-- AddForeignKey
ALTER TABLE "Checkout" ADD CONSTRAINT "Checkout_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checkout" ADD CONSTRAINT "Checkout_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
