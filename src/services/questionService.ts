import { Question, AIAnswer, FilterState, QuestionHistory, AuditLog } from '../lib/types';
import { getSupabaseClient, getLocalQuestions, saveLocalQuestions } from '../lib/supabase';

export class QuestionService {
  /**
   * Fetch all questions matching filters, optimized with pagination support.
   */
  static async getQuestions(filters?: FilterState): Promise<Question[]> {
    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        let query = supabase
          .from('questions')
          .select('*, answer:ai_answers(*)')
          .order('updated_at', { ascending: false });

        if (filters?.questionType && filters.questionType !== 'All') {
          query = query.eq('question_type', filters.questionType);
        }
        if (filters?.topic) {
          query = query.ilike('topic_name', `%${filters.topic}%`);
        }
        if (filters?.concept) {
          query = query.ilike('concept_name', `%${filters.concept}%`);
        }
        if (filters?.experience) {
          query = query.eq('experience_level_name', filters.experience);
        }
        if (filters?.priority) {
          query = query.eq('priority_name', filters.priority);
        }
        if (filters?.cloudProvider) {
          query = query.eq('cloud_provider', filters.cloudProvider);
        }
        if (filters?.technology) {
          query = query.ilike('technology', `%${filters.technology}%`);
        }
        if (filters?.bookmarkedOnly) {
          query = query.eq('is_bookmarked', true);
        }
        if (filters?.favoritesOnly) {
          query = query.eq('is_favorite', true);
        }
        if (filters?.searchQuery) {
          const q = filters.searchQuery.trim();
          query = query.or(`question.ilike.%${q}%,topic_name.ilike.%${q}%,concept_name.ilike.%${q}%,technology.ilike.%${q}%`);
        }

        const { data, error } = await query;
        if (!error && data) {
          return data.map((item: any) => ({
            ...item,
            tags: item.tags || [],
            answer: Array.isArray(item.answer) ? item.answer[0] : item.answer,
          }));
        }
      } catch (err) {
        console.warn('Supabase query error, using local database fallback:', err);
      }
    }

    // Local Fallback Filtering Engine
    let local = getLocalQuestions();
    if (!filters) return local;

    return local.filter((q) => {
      if (filters.questionType && filters.questionType !== 'All' && q.question_type !== filters.questionType) return false;
      if (filters.topic && !q.topic_name?.toLowerCase().includes(filters.topic.toLowerCase())) return false;
      if (filters.concept && !q.concept_name?.toLowerCase().includes(filters.concept.toLowerCase())) return false;
      if (filters.experience && q.experience_level_name !== filters.experience) return false;
      if (filters.priority && q.priority_name !== filters.priority) return false;
      if (filters.cloudProvider && q.cloud_provider !== filters.cloudProvider) return false;
      if (filters.technology && !q.technology.toLowerCase().includes(filters.technology.toLowerCase())) return false;
      if (filters.bookmarkedOnly && !q.is_bookmarked) return false;
      if (filters.favoritesOnly && !q.is_favorite) return false;
      if (filters.tag && !q.tags.some(t => t.toLowerCase() === filters.tag.toLowerCase())) return false;

      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const inQuestion = q.question.toLowerCase().includes(query);
        const inTopic = q.topic_name?.toLowerCase().includes(query);
        const inConcept = q.concept_name?.toLowerCase().includes(query);
        const inTech = q.technology.toLowerCase().includes(query);
        const inCategory = q.category.toLowerCase().includes(query);
        const inTags = q.tags.some(t => t.toLowerCase().includes(query));
        
        const ans = q.answer;
        const inAnswer = ans ? (
          ans.flags.toLowerCase().includes(query) ||
          ans.commands.toLowerCase().includes(query) ||
          ans.dependency_check.toLowerCase().includes(query) ||
          ans.fix.toLowerCase().includes(query) ||
          ans.root_cause.toLowerCase().includes(query) ||
          ans.precautions.toLowerCase().includes(query) ||
          ans.indications.toLowerCase().includes(query) ||
          ans.interview_perspective.toLowerCase().includes(query)
        ) : false;

        return inQuestion || inTopic || inConcept || inTech || inCategory || inTags || inAnswer;
      }

      return true;
    });
  }

  /**
   * Save or update a single question and its associated AI answer.
   */
  static async saveQuestion(question: Question): Promise<void> {
    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        const questionPayload = {
          id: question.id,
          question: question.question,
          question_type: question.question_type,
          topic_name: question.topic_name,
          concept_name: question.concept_name,
          experience_level_name: question.experience_level_name,
          priority_name: question.priority_name,
          status: question.status,
          source: question.source,
          language: question.language,
          category: question.category,
          subcategory: question.subcategory,
          cloud_provider: question.cloud_provider,
          technology: question.technology,
          difficulty: question.difficulty,
          tags: question.tags,
          is_bookmarked: question.is_bookmarked,
          is_favorite: question.is_favorite,
          updated_at: new Date().toISOString(),
        };

        const { error: qError } = await supabase.from('questions').upsert(questionPayload);
        if (qError) console.error('Error upserting question to Supabase:', qError);

        if (question.answer) {
          const answerPayload = {
            id: question.answer.id || crypto.randomUUID(),
            question_id: question.id,
            flags: question.answer.flags,
            commands: question.answer.commands,
            dependency_check: question.answer.dependency_check,
            fix: question.answer.fix,
            root_cause: question.answer.root_cause,
            precautions: question.answer.precautions,
            indications: question.answer.indications,
            interview_perspective: question.answer.interview_perspective,
            last_updated: new Date().toISOString(),
            edited_by: question.answer.edited_by || 'User',
          };

          const { error: aError } = await supabase.from('ai_answers').upsert(answerPayload);
          if (aError) console.error('Error upserting ai_answer to Supabase:', aError);
        }
      } catch (err) {
        console.warn('Supabase save error, writing to local database:', err);
      }
    }

    // Always update local cache
    const local = getLocalQuestions();
    const existingIdx = local.findIndex((q) => q.id === question.id);
    if (existingIdx >= 0) {
      local[existingIdx] = question;
    } else {
      local.unshift(question);
    }
    saveLocalQuestions(local);
  }

  /**
   * Bulk save multiple questions.
   */
  static async bulkSaveQuestions(questions: Question[]): Promise<void> {
    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        const qPayloads = questions.map((q) => ({
          id: q.id,
          question: q.question,
          question_type: q.question_type,
          topic_name: q.topic_name,
          concept_name: q.concept_name,
          experience_level_name: q.experience_level_name,
          priority_name: q.priority_name,
          status: q.status,
          source: q.source,
          language: q.language,
          category: q.category,
          subcategory: q.subcategory,
          cloud_provider: q.cloud_provider,
          technology: q.technology,
          difficulty: q.difficulty,
          tags: q.tags,
          is_bookmarked: q.is_bookmarked,
          is_favorite: q.is_favorite,
          updated_at: new Date().toISOString(),
        }));

        await supabase.from('questions').upsert(qPayloads);

        const aPayloads = questions
          .filter((q) => q.answer)
          .map((q) => ({
            id: q.answer!.id || crypto.randomUUID(),
            question_id: q.id,
            flags: q.answer!.flags,
            commands: q.answer!.commands,
            dependency_check: q.answer!.dependency_check,
            fix: q.answer!.fix,
            root_cause: q.answer!.root_cause,
            precautions: q.answer!.precautions,
            indications: q.answer!.indications,
            interview_perspective: q.answer!.interview_perspective,
            last_updated: new Date().toISOString(),
            edited_by: q.answer!.edited_by || 'User',
          }));

        if (aPayloads.length > 0) {
          await supabase.from('ai_answers').upsert(aPayloads);
        }
      } catch (err) {
        console.warn('Supabase bulk save error:', err);
      }
    }

    const local = getLocalQuestions();
    const updated = [...questions, ...local];
    saveLocalQuestions(updated);
  }

  /**
   * Delete a question by ID.
   */
  static async deleteQuestion(id: string): Promise<void> {
    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        await supabase.from('ai_answers').delete().eq('question_id', id);
        await supabase.from('questions').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete error:', err);
      }
    }

    const local = getLocalQuestions();
    saveLocalQuestions(local.filter((q) => q.id !== id));
  }

  /**
   * Subscribe to Realtime Database changes for live 2-way sync across all tabs/users!
   */
  static subscribeToRealtimeChanges(onDataChanged: () => void): () => void {
    const supabase = getSupabaseClient();
    if (!supabase) return () => {};

    try {
      const channel = supabase
        .channel('public-db-realtime-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, () => {
          console.log('⚡ Realtime postgres_change detected on questions table! Auto-syncing...');
          onDataChanged();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_answers' }, () => {
          console.log('⚡ Realtime postgres_change detected on ai_answers table! Auto-syncing...');
          onDataChanged();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Realtime subscription warning:', err);
      return () => {};
    }
  }

  /**
   * Log version history change for a field.
   */
  static async logFieldHistory(
    questionId: string,
    fieldChanged: string,
    oldVal: string,
    newVal: string,
    user = 'Senior SRE User'
  ) {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('question_history').insert({
          question_id: questionId,
          field_changed: fieldChanged,
          old_value: oldVal,
          new_value: newVal,
          changed_by: user,
        });
      } catch (e) {
        console.warn('History log error:', e);
      }
    }
  }

  /**
   * Get version history for a question.
   */
  static async getQuestionHistory(questionId: string): Promise<QuestionHistory[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('question_history')
          .select('*')
          .eq('question_id', questionId)
          .order('changed_at', { ascending: false });

        if (!error && data) return data;
      } catch (e) {
        console.warn('Failed to fetch history:', e);
      }
    }
    return [];
  }
}
