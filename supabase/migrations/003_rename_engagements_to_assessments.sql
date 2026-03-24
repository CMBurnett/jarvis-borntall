-- =============================================================================
-- 003_rename_engagements_to_assessments.sql
-- Rename engagements table and all engagement_id columns to assessments / assessment_id
-- =============================================================================

-- Rename the table
ALTER TABLE public.engagements RENAME TO assessments;

-- Rename engagement_id columns across dependent tables
ALTER TABLE public.documents        RENAME COLUMN engagement_id TO assessment_id;
ALTER TABLE public.document_chunks  RENAME COLUMN engagement_id TO assessment_id;
ALTER TABLE public.clause_assessments RENAME COLUMN engagement_id TO assessment_id;
ALTER TABLE public.processing_jobs  RENAME COLUMN engagement_id TO assessment_id;

-- Rename indexes
ALTER INDEX IF EXISTS idx_engagements_standards       RENAME TO idx_assessments_standards;
-- idx_clause_assessments_provider name is unchanged, no rename needed

-- Update unique constraint on clause_assessments (references engagement_id → assessment_id)
-- The constraint name stays the same; only the column it covers changed via the RENAME above.

-- Recreate match_chunks with assessment_id parameter name (must DROP first to rename param)
DROP FUNCTION IF EXISTS public.match_chunks(vector, uuid, integer);
CREATE OR REPLACE FUNCTION public.match_chunks(
  query_embedding vector(1536),
  assessment_id   uuid,
  match_count     int DEFAULT 5
)
RETURNS TABLE (id uuid, content text, similarity float)
LANGUAGE sql STABLE AS $$
  SELECT
    id,
    content,
    1 - (embedding <=> query_embedding) AS similarity
  FROM public.document_chunks
  WHERE document_chunks.assessment_id = match_chunks.assessment_id
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

DROP FUNCTION IF EXISTS public.match_chunks_local(vector, uuid, integer);
CREATE OR REPLACE FUNCTION public.match_chunks_local(
  query_embedding vector(768),
  assessment_id   uuid,
  match_count     int DEFAULT 5
)
RETURNS TABLE (id uuid, content text, similarity float)
LANGUAGE sql STABLE AS $$
  SELECT
    id,
    content,
    1 - (embedding_local <=> query_embedding) AS similarity
  FROM public.document_chunks
  WHERE document_chunks.assessment_id = match_chunks_local.assessment_id
    AND embedding_local IS NOT NULL
  ORDER BY embedding_local <=> query_embedding
  LIMIT match_count;
$$;

-- Update RLS policies for the renamed table
DROP POLICY IF EXISTS "org isolation on engagements" ON public.assessments;
CREATE POLICY "org isolation on assessments"
  ON public.assessments FOR ALL
  USING (org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()));
