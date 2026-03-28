ALTER TABLE "collections"
  ADD COLUMN "normalized_name" TEXT,
  ADD COLUMN "description" TEXT NOT NULL DEFAULT '';

UPDATE "collections"
SET "normalized_name" = lower(trim("name"))
WHERE "normalized_name" IS NULL;

ALTER TABLE "collections"
  ALTER COLUMN "normalized_name" SET NOT NULL;

CREATE UNIQUE INDEX "collections_owner_id_normalized_name_key"
  ON "collections"("owner_id", "normalized_name");