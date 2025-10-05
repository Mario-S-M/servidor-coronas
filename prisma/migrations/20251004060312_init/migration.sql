-- CreateEnum
CREATE TYPE "sales_type_enum" AS ENUM ('menudeo', 'mayoreo');

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "precioMenudeo" DECIMAL(10,2) NOT NULL,
    "precioMayoreo" DECIMAL(10,2) NOT NULL,
    "precioProduccion" DECIMAL(10,2) NOT NULL,
    "categoria" VARCHAR(50) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "ticketNumber" VARCHAR(20) NOT NULL,
    "type" "sales_type_enum" NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "totalItems" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_items" (
    "id" TEXT NOT NULL,
    "sale_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "productName" VARCHAR(100) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_cuts" (
    "id" TEXT NOT NULL,
    "totalMenudeo" DECIMAL(10,2) NOT NULL,
    "totalMayoreo" DECIMAL(10,2) NOT NULL,
    "totalGeneral" DECIMAL(10,2) NOT NULL,
    "ventasMenudeo" INTEGER NOT NULL,
    "ventasMayoreo" INTEGER NOT NULL,
    "totalVentas" INTEGER NOT NULL,
    "gananciaEstimada" DECIMAL(10,2) NOT NULL,
    "fechaCorte" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaInicio" DATE NOT NULL,
    "fechaFin" DATE NOT NULL,

    CONSTRAINT "cash_cuts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sales_ticketNumber_key" ON "sales"("ticketNumber");

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
