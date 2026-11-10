-- AlterTable: category image
ALTER TABLE "categories" ADD COLUMN "image_url" TEXT;

-- AlterTable: project Excel attachment (stored as base64 in the database)
ALTER TABLE "projects" ADD COLUMN "excel_file_name" TEXT;
ALTER TABLE "projects" ADD COLUMN "excel_file_type" TEXT;
ALTER TABLE "projects" ADD COLUMN "excel_file_data" TEXT;

-- CreateTable: archived monthly reports
CREATE TABLE "monthly_reports" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "total_in" INTEGER NOT NULL DEFAULT 0,
    "total_out" INTEGER NOT NULL DEFAULT 0,
    "movement_count" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "monthly_reports_year_month_key" ON "monthly_reports"("year", "month");

-- CreateIndex
CREATE INDEX "monthly_reports_year_month_idx" ON "monthly_reports"("year", "month");
