/*
  Warnings:

  - A unique constraint covering the columns `[captainId]` on the table `teams` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "captainId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "teams_captainId_key" ON "teams"("captainId");

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_captainId_fkey" FOREIGN KEY ("captainId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
