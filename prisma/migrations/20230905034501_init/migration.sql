-- CreateTable
CREATE TABLE "readings" (
    "id" SERIAL NOT NULL,
    "mmol_l" DOUBLE PRECISION NOT NULL,
    "trend_arrow" TEXT NOT NULL,
    "trend_description" TEXT NOT NULL,
    "datetime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "readings_pkey" PRIMARY KEY ("id")
);
