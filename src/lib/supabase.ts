import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Question, AIAnswer, QuestionHistory, AuditLog, FilterState } from './types';
import { INITIAL_SEED_QUESTIONS } from './seedData';

// Default environment variables or local storage overrides
const STORAGE_KEY_URL = 'devops_portal_supabase_url';
const STORAGE_KEY_KEY = 'devops_portal_supabase_key';
const STORAGE_KEY_LOCAL_DB = 'devops_portal_local_questions_v2';

export const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) || '' : '';
  const localKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_KEY) || '' : '';

  return {
    url: localUrl || envUrl,
    key: localKey || envKey,
    isConfigured: Boolean((localUrl || envUrl) && (localKey || envKey)),
  };
};

export const saveSupabaseConfig = (url: string, key: string) => {
  if (typeof window !== 'undefined') {
    if (url) localStorage.setItem(STORAGE_KEY_URL, url.trim());
    else localStorage.removeItem(STORAGE_KEY_URL);

    if (key) localStorage.setItem(STORAGE_KEY_KEY, key.trim());
    else localStorage.removeItem(STORAGE_KEY_KEY);
  }
};

let clientInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  const { url, key, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  if (!clientInstance) {
    clientInstance = createClient(url, key, {
      auth: { persistSession: true },
    });
  }
  return clientInstance;
};

export const resetSupabaseClient = () => {
  clientInstance = null;
};

// SQL Migration Script string for Supabase SQL Editor
export const SUPABASE_SQL_SCHEMA = `-- ============================================================
-- DEVOPS KNOWLEDGE PORTAL - FULL SUPABASE POSTGRESQL SCHEMA
-- Execute this script in your Supabase SQL Editor.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Topics Table
CREATE TABLE IF NOT EXISTS topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Concepts Table
CREATE TABLE IF NOT EXISTS concepts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(topic_id, name)
);

-- 3. Experience Levels Table
CREATE TABLE IF NOT EXISTS experience_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    display_order INT DEFAULT 0
);

-- 4. Issue Priorities Table
CREATE TABLE IF NOT EXISTS issue_priorities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    severity_code TEXT,
    color TEXT
);

-- 5. Tags Table
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL
);

-- 6. Questions Table
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    question_type TEXT CHECK (question_type IN ('Interview Question', 'Troubleshooting Question')),
    topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
    topic_name TEXT,
    concept_id UUID REFERENCES concepts(id) ON DELETE SET NULL,
    concept_name TEXT,
    experience_level_id UUID REFERENCES experience_levels(id) ON DELETE SET NULL,
    experience_level_name TEXT,
    priority_id UUID REFERENCES issue_priorities(id) ON DELETE SET NULL,
    priority_name TEXT,
    status TEXT DEFAULT 'Active',
    source TEXT DEFAULT 'Web Input',
    language TEXT DEFAULT 'en',
    category TEXT DEFAULT 'Infrastructure',
    subcategory TEXT DEFAULT 'General',
    cloud_provider TEXT DEFAULT 'Cloud Agnostic',
    technology TEXT DEFAULT 'Kubernetes',
    difficulty TEXT DEFAULT 'Medium',
    tags TEXT[] DEFAULT '{}',
    is_bookmarked BOOLEAN DEFAULT FALSE,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. AI Answers Table (Mandatory 8 Senior DevOps Sections)
CREATE TABLE IF NOT EXISTS ai_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID UNIQUE REFERENCES questions(id) ON DELETE CASCADE,
    flags TEXT DEFAULT '',
    commands TEXT DEFAULT '',
    dependency_check TEXT DEFAULT '',
    fix TEXT DEFAULT '',
    root_cause TEXT DEFAULT '',
    precautions TEXT DEFAULT '',
    indications TEXT DEFAULT '',
    interview_perspective TEXT DEFAULT '',
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    edited_by TEXT DEFAULT 'Senior DevOps AI'
);

-- 8. Question Tags Junction Table
CREATE TABLE IF NOT EXISTS question_tags (
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (question_id, tag_id)
);

-- 9. Question History / Version Audit
CREATE TABLE IF NOT EXISTS question_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    field_changed TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    changed_by TEXT DEFAULT 'User'
);

-- 10. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Bookmarks Table
CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT DEFAULT 'default_user',
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, question_id)
);

-- 12. Favorites Table
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT DEFAULT 'default_user',
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, question_id)
);

-- INDEXES FOR 10,000+ HIGH PERFORMANCE SEARCH & PAGINATION
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(question_type);
CREATE INDEX IF NOT EXISTS idx_questions_topic_name ON questions(topic_name);
CREATE INDEX IF NOT EXISTS idx_questions_experience ON questions(experience_level_name);
CREATE INDEX IF NOT EXISTS idx_questions_priority ON questions(priority_name);
CREATE INDEX IF NOT EXISTS idx_questions_cloud ON questions(cloud_provider);
CREATE INDEX IF NOT EXISTS idx_questions_tech ON questions(technology);
CREATE INDEX IF NOT EXISTS idx_questions_updated ON questions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_tags ON questions USING GIN(tags);

-- FULL-TEXT SEARCH INDEX
ALTER TABLE questions ADD COLUMN IF NOT EXISTS fts tsvector 
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(question, '') || ' ' || coalesce(topic_name, '') || ' ' || coalesce(concept_name, '') || ' ' || coalesce(technology, ''))
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_questions_fts ON questions USING GIN(fts);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow read/write access for authenticated and anon users
CREATE POLICY "Public Read Questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Public Insert Questions" ON questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Questions" ON questions FOR UPDATE USING (true);
CREATE POLICY "Public Delete Questions" ON questions FOR DELETE USING (true);

CREATE POLICY "Public Read Answers" ON ai_answers FOR SELECT USING (true);
CREATE POLICY "Public Insert Answers" ON ai_answers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Answers" ON ai_answers FOR UPDATE USING (true);
CREATE POLICY "Public Delete Answers" ON ai_answers FOR DELETE USING (true);

CREATE POLICY "Public Read History" ON question_history FOR SELECT USING (true);
CREATE POLICY "Public Insert History" ON question_history FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read Audit" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "Public Insert Audit" ON audit_logs FOR INSERT WITH CHECK (true);

-- Seed Initial Lookups
INSERT INTO experience_levels (name, display_order) VALUES
  ('Junior', 1), ('Mid-Level', 2), ('Senior', 3), ('Lead / Principal', 4)
  ON CONFLICT (name) DO NOTHING;

INSERT INTO issue_priorities (name, severity_code, color) VALUES
  ('Low', 'P4', '#10B981'),
  ('Medium', 'P3', '#3B82F6'),
  ('High', 'P2', '#F59E0B'),
  ('Critical', 'P1', '#EF4444')
  ON CONFLICT (name) DO NOTHING;
`;

// Helper: Local fallback DB state management
export const getLocalQuestions = (): Question[] => {
  if (typeof window === 'undefined') return INITIAL_SEED_QUESTIONS;
  const stored = localStorage.getItem(STORAGE_KEY_LOCAL_DB);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY_LOCAL_DB, JSON.stringify(INITIAL_SEED_QUESTIONS));
    return INITIAL_SEED_QUESTIONS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return INITIAL_SEED_QUESTIONS;
  }
};

export const saveLocalQuestions = (questions: Question[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_LOCAL_DB, JSON.stringify(questions));
  }
};
