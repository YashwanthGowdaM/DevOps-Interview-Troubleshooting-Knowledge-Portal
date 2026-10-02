import { z } from 'zod';

export type QuestionType = 'Interview Question' | 'Troubleshooting Question';
export type ExperienceLevel = 'Junior' | 'Mid-Level' | 'Senior' | 'Lead / Principal';
export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard' | 'Expert';

export interface Topic {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
}

export interface Concept {
  id: string;
  topic_id?: string;
  name: string;
  description?: string;
  created_at?: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface AIAnswer {
  id: string;
  question_id: string;
  flags: string;
  commands: string;
  dependency_check: string;
  fix: string;
  root_cause: string;
  precautions: string;
  indications: string;
  interview_perspective: string;
  last_updated: string;
  edited_by: string;
}

export interface Question {
  id: string;
  question: string;
  question_type: QuestionType;
  topic_id?: string;
  topic_name?: string;
  concept_id?: string;
  concept_name?: string;
  experience_level_id?: string;
  experience_level_name?: ExperienceLevel;
  priority_id?: string;
  priority_name?: PriorityLevel;
  status: string;
  source: string;
  language: string;
  category: string;
  subcategory: string;
  cloud_provider: string;
  technology: string;
  difficulty: DifficultyLevel;
  tags: string[];
  is_bookmarked: boolean;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  answer?: AIAnswer;
}

export interface QuestionHistory {
  id: string;
  question_id: string;
  field_changed: string;
  old_value: string;
  new_value: string;
  changed_at: string;
  changed_by: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, any>;
  created_at: string;
}

export interface FilterState {
  searchQuery: string;
  questionType: string;
  topic: string;
  concept: string;
  experience: string;
  priority: string;
  cloudProvider: string;
  technology: string;
  tag: string;
  bookmarkedOnly: boolean;
  favoritesOnly: boolean;
}

// Zod validation schemas
export const QuestionSchema = z.object({
  question: z.string().min(5, "Question must be at least 5 characters"),
  question_type: z.enum(["Interview Question", "Troubleshooting Question"]),
  topic_name: z.string().min(1, "Topic is required"),
  concept_name: z.string().optional(),
  experience_level_name: z.enum(["Junior", "Mid-Level", "Senior", "Lead / Principal"]),
  priority_name: z.enum(["Low", "Medium", "High", "Critical"]),
  category: z.string().default("Infrastructure"),
  subcategory: z.string().default("General"),
  cloud_provider: z.string().default("Cloud Agnostic"),
  technology: z.string().default("Kubernetes"),
  difficulty: z.enum(["Easy", "Medium", "Hard", "Expert"]),
  tags: z.array(z.string()).default([]),
});

export const AnswerSchema = z.object({
  flags: z.string(),
  commands: z.string(),
  dependency_check: z.string(),
  fix: z.string(),
  root_cause: z.string(),
  precautions: z.string(),
  indications: z.string(),
  interview_perspective: z.string(),
});
