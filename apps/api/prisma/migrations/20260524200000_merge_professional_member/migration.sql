-- Merge TeamMember into Professional, remove SubtopicAssignment, simplify TeamProfessional

-- 1. Drop tables that are being removed
DROP TABLE IF EXISTS "SubtopicAssignment";
DROP TABLE IF EXISTS "TeamMember" CASCADE;

-- 2. Rename CostEntry.memberId → professionalId
ALTER TABLE "CostEntry" DROP CONSTRAINT IF EXISTS "CostEntry_memberId_fkey";
ALTER TABLE "CostEntry" RENAME COLUMN "memberId" TO "professionalId";

-- 3. Rename Decision.memberId → professionalId
ALTER TABLE "Decision" DROP CONSTRAINT IF EXISTS "Decision_memberId_fkey";
ALTER TABLE "Decision" RENAME COLUMN "memberId" TO "professionalId";

-- 4. Drop TeamProfessional.quantity
ALTER TABLE "TeamProfessional" DROP COLUMN IF EXISTS "quantity";

-- 5. Rename Professional.teamMembers relation name (no SQL needed, Prisma-only)

-- 6. Add new columns to Professional (with defaults so existing rows don't fail)
ALTER TABLE "Professional"
  ADD COLUMN IF NOT EXISTS "name"        TEXT NOT NULL DEFAULT 'Profissional',
  ADD COLUMN IF NOT EXISTS "initials"    VARCHAR(4) NOT NULL DEFAULT 'PRO',
  ADD COLUMN IF NOT EXISTS "skills"      TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "avatarColor" INTEGER NOT NULL DEFAULT 0;

-- Remove the temporary defaults (columns stay but defaults are cleared)
ALTER TABLE "Professional" ALTER COLUMN "name" DROP DEFAULT;
ALTER TABLE "Professional" ALTER COLUMN "initials" DROP DEFAULT;

-- 7. Re-add foreign keys for renamed columns
ALTER TABLE "CostEntry"
  ADD CONSTRAINT "CostEntry_professionalId_fkey"
  FOREIGN KEY ("professionalId") REFERENCES "Professional"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Decision"
  ADD CONSTRAINT "Decision_professionalId_fkey"
  FOREIGN KEY ("professionalId") REFERENCES "Professional"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 8. Remove Project.members relation (already handled by dropping TeamMember table)
