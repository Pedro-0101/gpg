/*
  Warnings:

  - You are about to drop the column `teamId` on the `Subtopic` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Subtopic" DROP CONSTRAINT "Subtopic_teamId_fkey";

-- AlterTable
ALTER TABLE "Subtopic" DROP COLUMN "teamId";

-- CreateTable
CREATE TABLE "SubtopicTeam" (
    "subtopicId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "SubtopicTeam_pkey" PRIMARY KEY ("subtopicId","teamId")
);

-- AddForeignKey
ALTER TABLE "SubtopicTeam" ADD CONSTRAINT "SubtopicTeam_subtopicId_fkey" FOREIGN KEY ("subtopicId") REFERENCES "Subtopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubtopicTeam" ADD CONSTRAINT "SubtopicTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
