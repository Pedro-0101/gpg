-- CreateTable
CREATE TABLE "SubtopicProfessional" (
    "subtopicId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,

    CONSTRAINT "SubtopicProfessional_pkey" PRIMARY KEY ("subtopicId","professionalId")
);

-- AddForeignKey
ALTER TABLE "SubtopicProfessional" ADD CONSTRAINT "SubtopicProfessional_subtopicId_fkey" FOREIGN KEY ("subtopicId") REFERENCES "Subtopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubtopicProfessional" ADD CONSTRAINT "SubtopicProfessional_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;
