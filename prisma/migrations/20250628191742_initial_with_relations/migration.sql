-- CreateTable
CREATE TABLE "territories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "coordinates" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "territories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pins" (
    "id" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "address" TEXT NOT NULL,
    "place_id" TEXT,
    "property_name" TEXT,
    "status" TEXT DEFAULT 'new',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "pin_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "owns_crypto" BOOLEAN DEFAULT false,
    "socials" JSONB,
    "notes" TEXT,
    "address" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follow_ups" (
    "id" TEXT NOT NULL,
    "pin_id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "property_name" TEXT,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT DEFAULT 'scheduled',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_territories_created_at" ON "territories"("created_at");

-- CreateIndex
CREATE INDEX "idx_pins_created_at" ON "pins"("created_at");

-- CreateIndex
CREATE INDEX "idx_pins_status" ON "pins"("status");

-- CreateIndex
CREATE UNIQUE INDEX "customers_pin_id_key" ON "customers"("pin_id");

-- CreateIndex
CREATE INDEX "idx_customers_created_at" ON "customers"("created_at");

-- CreateIndex
CREATE INDEX "idx_customers_pin_id" ON "customers"("pin_id");

-- CreateIndex
CREATE INDEX "idx_follow_ups_date" ON "follow_ups"("date");

-- CreateIndex
CREATE INDEX "idx_follow_ups_pin_id" ON "follow_ups"("pin_id");

-- CreateIndex
CREATE INDEX "idx_follow_ups_status" ON "follow_ups"("status");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_pin_id_fkey" FOREIGN KEY ("pin_id") REFERENCES "pins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_pin_id_fkey" FOREIGN KEY ("pin_id") REFERENCES "pins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
