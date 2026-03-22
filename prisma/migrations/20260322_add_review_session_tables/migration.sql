CREATE TABLE "review_sessions" (
  "id" UUID NOT NULL,
  "status" TEXT NOT NULL,
  "current_card_index" INTEGER NOT NULL DEFAULT 0,
  "total_cards" INTEGER NOT NULL,
  "source_query" TEXT,
  "source_filter" TEXT,
  "source_sort" TEXT NOT NULL,
  "source_tag_labels" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "source_collection_labels" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),

  CONSTRAINT "review_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "review_session_cards" (
  "session_id" UUID NOT NULL,
  "card_id" UUID NOT NULL,
  "order_index" INTEGER NOT NULL,
  "assessment" TEXT,
  "assessed_at" TIMESTAMP(3),
  "locked_at" TIMESTAMP(3),

  CONSTRAINT "review_session_cards_pkey" PRIMARY KEY ("session_id", "card_id")
);

CREATE INDEX "review_sessions_status_updated_at_idx" ON "review_sessions"("status", "updated_at");
CREATE UNIQUE INDEX "review_session_cards_session_id_order_index_key" ON "review_session_cards"("session_id", "order_index");
CREATE INDEX "review_session_cards_session_id_locked_at_idx" ON "review_session_cards"("session_id", "locked_at");

ALTER TABLE "review_session_cards"
ADD CONSTRAINT "review_session_cards_session_id_fkey"
FOREIGN KEY ("session_id") REFERENCES "review_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "review_session_cards"
ADD CONSTRAINT "review_session_cards_card_id_fkey"
FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;