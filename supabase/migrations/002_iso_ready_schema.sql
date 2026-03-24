-- =============================================================================
-- 002_iso_ready_schema.sql
-- ISO Ready agent schema — assessments, documents, embeddings, gap analysis
-- Depends on: 001_initial_schema.sql (organisations + profiles)
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS vector;

-- ---------------------------------------------------------------------------
-- Assessments  (one per client assessment)
-- ---------------------------------------------------------------------------
CREATE TABLE public.assessments (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid        REFERENCES public.organisations(id),
  client_name text        NOT NULL,
  status      text        DEFAULT 'ingesting', -- ingesting | analysing | interviewing | complete
  standards   text[]      NOT NULL DEFAULT '{as9100}',
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_assessments_standards
  ON public.assessments USING GIN (standards);

-- ---------------------------------------------------------------------------
-- Documents  (pointer to Supabase Storage bucket "documents")
-- ---------------------------------------------------------------------------
CREATE TABLE public.documents (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid        REFERENCES public.assessments(id),
  org_id        uuid        REFERENCES public.organisations(id),
  storage_path  text        NOT NULL,
  filename      text        NOT NULL,
  doc_type      text,
  status        text        DEFAULT 'pending', -- pending | processing | done | error
  created_at    timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Document chunks  (chunked + embedded content)
-- ---------------------------------------------------------------------------
CREATE TABLE public.document_chunks (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id   uuid        REFERENCES public.assessments(id),
  org_id          uuid        REFERENCES public.organisations(id),
  document_id     uuid        REFERENCES public.documents(id),
  chunk_index     int,
  content         text        NOT NULL,
  likely_clauses  text[],
  embedding       vector(1536),       -- OpenAI / remote embeddings
  embedding_local vector(768),        -- Ollama nomic-embed-text (local)
  created_at      timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- ISO clause library  (shared, pre-loaded via seed script)
-- IDs are prefixed: iso9001-X.X | as9100-X.X | iso14001-X.X | iso45001-X.X
-- ---------------------------------------------------------------------------
CREATE TABLE public.iso_clauses (
  id              text        PRIMARY KEY,
  standard        text        NOT NULL DEFAULT 'as9100', -- iso9001 | as9100 | iso14001 | iso45001
  as9100_specific boolean     DEFAULT false,
  section         text,
  title           text,
  shall_text      text,
  evidence_types  text[],
  complexity      text,
  embedding       vector(1536),
  embedding_local vector(768)
);

CREATE INDEX idx_iso_clauses_standard
  ON public.iso_clauses (standard);

-- ---------------------------------------------------------------------------
-- Clause assessments  (gap analysis results — one row per clause × engagement)
-- ---------------------------------------------------------------------------
CREATE TABLE public.clause_assessments (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id       uuid        REFERENCES public.assessments(id) ON DELETE CASCADE,
  org_id              uuid        REFERENCES public.organisations(id),
  clause_id           text        REFERENCES public.iso_clauses(id),
  provider            text        NOT NULL DEFAULT 'anthropic',
  status              text        CHECK (status IN ('evidenced', 'partial', 'gap')) NOT NULL,
  evidence_summary    text,
  gap_description     text,
  action_item         text,
  priority            int         CHECK (priority IN (1, 2, 3)),
  interview_questions text[],
  evidence_chunk_ids  uuid[],
  evidence_checks     jsonb,
  source_chunk_ids    uuid[],
  assessed_at         timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),

  CONSTRAINT clause_assessments_engagement_clause_provider_key
    UNIQUE (assessment_id, clause_id, provider)
);

CREATE INDEX idx_clause_assessments_provider
  ON public.clause_assessments (assessment_id, provider);

-- ---------------------------------------------------------------------------
-- Processing jobs  (async ingest/analysis queue)
-- ---------------------------------------------------------------------------
CREATE TABLE public.processing_jobs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid        REFERENCES public.assessments(id),
  org_id        uuid        REFERENCES public.organisations(id),
  job_type      text,
  status        text        DEFAULT 'queued', -- queued | running | done | error
  payload       jsonb,
  error         text,
  created_at    timestamptz DEFAULT now(),
  completed_at  timestamptz
);

-- ---------------------------------------------------------------------------
-- Vector similarity search functions
-- ---------------------------------------------------------------------------

-- Remote embeddings (1536 dims — OpenAI)
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

-- Local embeddings (768 dims — Ollama nomic-embed-text)
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

-- ---------------------------------------------------------------------------
-- Row Level Security
-- All iso-ready tables use org_id isolation via profiles.org_id
-- ---------------------------------------------------------------------------
ALTER TABLE public.assessments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iso_clauses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clause_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_jobs    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org isolation on assessments"
  ON public.assessments FOR ALL
  USING (org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "org isolation on documents"
  ON public.documents FOR ALL
  USING (org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "org isolation on document_chunks"
  ON public.document_chunks FOR ALL
  USING (org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "org isolation on clause_assessments"
  ON public.clause_assessments FOR ALL
  USING (org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "org isolation on processing_jobs"
  ON public.processing_jobs FOR ALL
  USING (org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

-- iso_clauses is a shared read-only library
CREATE POLICY "authenticated read on iso_clauses"
  ON public.iso_clauses FOR SELECT
  USING (auth.role() = 'authenticated');
