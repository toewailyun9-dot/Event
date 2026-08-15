-- DropIndex
DROP INDEX "Event_slug_idx";

-- DropIndex
DROP INDEX "Event_slug_key";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "slug";
