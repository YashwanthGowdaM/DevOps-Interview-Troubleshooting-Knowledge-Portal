import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TopBar } from './components/layout/TopBar';
import { LeftPanel } from './components/panels/LeftPanel';
import { CenterPanel } from './components/panels/CenterPanel';
import { RightPanel } from './components/panels/RightPanel';
import { BulkImporterModal } from './components/modals/BulkImporterModal';
import { SingleQuestionModal } from './components/modals/SingleQuestionModal';
import { SupabaseConfigModal } from './components/modals/SupabaseConfigModal';
import { VersionHistoryModal } from './components/modals/VersionHistoryModal';
import { Question, FilterState } from './lib/types';
import { QuestionService } from './services/questionService';
import { GripVertical } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'library' | 'importer' | 'schema' | 'stats'>('library');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Selected AI Model State
  const [selectedAiModel, setSelectedAiModel] = useState<string>(() => {
    return localStorage.getItem('devops_portal_ai_model') || 'gemini-3.8-flash';
  });

  const handleSetAiModel = (m: string) => {
    setSelectedAiModel(m);
    localStorage.setItem('devops_portal_ai_model', m);
  };

  // Resizable Panel Partitions State (Left%, Center%, Right%)
  const [leftWidth, setLeftWidth] = useState(40);
  const [rightWidth, setRightWidth] = useState(10);
  const centerWidth = Math.max(20, 100 - leftWidth - rightWidth);

  const isDraggingLeft = useRef(false);
  const isDraggingRight = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [historyModalQuestionId, setHistoryModalQuestionId] = useState<string | null>(null);

  // Auto-save feedback message
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatusMessage, setSaveStatusMessage] = useState('Supabase Synced');

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    questionType: 'All',
    topic: '',
    concept: '',
    experience: '',
    priority: '',
    cloudProvider: '',
    technology: '',
    tag: '',
    bookmarkedOnly: false,
    favoritesOnly: false,
  });

  // Load questions based on current filter state
  const fetchQuestions = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const data = await QuestionService.getQuestions(filters);
      setQuestions(data);
      if (data.length > 0 && !selectedQuestionId) {
        setSelectedQuestionId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [filters, selectedQuestionId]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // REALTIME 2-WAY DATABASE SYNC: Subscribe to Supabase Realtime changes + Background Polling
  useEffect(() => {
    // 1. WebSocket Realtime postgres_changes subscription
    const unsubscribe = QuestionService.subscribeToRealtimeChanges(() => {
      fetchQuestions(true);
    });

    // 2. 10-Second Fallback Background Polling Interval
    const pollingInterval = setInterval(() => {
      fetchQuestions(true);
    }, 10000);

    return () => {
      unsubscribe();
      clearInterval(pollingInterval);
    };
  }, [fetchQuestions]);

  // Resizable Partition Drag Listeners
  const handleMouseDownLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingLeft.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleMouseDownRight = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRight.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerWidth = rect.width;

      if (isDraggingLeft.current) {
        const mouseX = e.clientX - rect.left;
        const newLeftPercent = Math.min(Math.max(18, (mouseX / containerWidth) * 100), 55);
        setLeftWidth(newLeftPercent);
      } else if (isDraggingRight.current) {
        const mouseFromRight = rect.right - e.clientX;
        const newRightPercent = Math.min(Math.max(8, (mouseFromRight / containerWidth) * 100), 30);
        setRightWidth(newRightPercent);
      }
    };

    const handleMouseUp = () => {
      isDraggingLeft.current = false;
      isDraggingRight.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleResetPartitions = () => {
    setLeftWidth(40);
    setRightWidth(10);
  };

  // Handle Question Auto-Save / Update
  const handleUpdateQuestion = async (updated: Question) => {
    setIsSaving(true);
    setSaveStatusMessage('Saving to Supabase...');

    setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));

    try {
      await QuestionService.saveQuestion(updated);
      setIsSaving(false);
      setSaveStatusMessage(`Saved at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    } catch (err) {
      console.error('Save failed:', err);
      setIsSaving(false);
      setSaveStatusMessage('Error saving to Supabase');
    }
  };

  // Handle Question Delete
  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    await QuestionService.deleteQuestion(id);
    const updated = questions.filter((q) => q.id !== id);
    setQuestions(updated);
    if (selectedQuestionId === id) {
      setSelectedQuestionId(updated.length > 0 ? updated[0].id : null);
    }
  };

  // Handle Bookmark Toggle
  const handleToggleBookmark = async (q: Question) => {
    const updated = { ...q, is_bookmarked: !q.is_bookmarked };
    await handleUpdateQuestion(updated);
  };

  // Handle Favorite Toggle
  const handleToggleFavorite = async (q: Question) => {
    const updated = { ...q, is_favorite: !q.is_favorite };
    await handleUpdateQuestion(updated);
  };

  // Handle Re-analyze AI trigger using selected model
  const handleReanalyzeAI = async (questionText: string) => {
    setIsSaving(true);
    setSaveStatusMessage(`AI analyzing (${selectedAiModel})...`);
    try {
      const response = await fetch('/api/ai/analyze-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionText, model: selectedAiModel }),
      });

      if (!response.ok) throw new Error('AI analysis failed');
      const result = await response.json();

      if (result.success && result.data && selectedQuestionId) {
        const item = result.data;
        const current = questions.find((q) => q.id === selectedQuestionId);
        if (current) {
          const updated: Question = {
            ...current,
            question_type: item.question_type || current.question_type,
            topic_name: item.topic || current.topic_name,
            concept_name: item.concept || current.concept_name,
            experience_level_name: item.experience_level || current.experience_level_name,
            priority_name: item.priority || current.priority_name,
            updated_at: new Date().toISOString(),
            answer: {
              id: current.answer?.id || crypto.randomUUID(),
              question_id: current.id,
              flags: item.flags || current.answer?.flags || '',
              commands: item.commands || current.answer?.commands || '',
              dependency_check: item.dependency_check || current.answer?.dependency_check || '',
              fix: item.fix || current.answer?.fix || '',
              root_cause: item.root_cause || current.answer?.root_cause || '',
              precautions: item.precautions || current.answer?.precautions || '',
              indications: item.indications || current.answer?.indications || '',
              interview_perspective: item.interview_perspective || current.answer?.interview_perspective || '',
              last_updated: new Date().toISOString(),
              edited_by: `${selectedAiModel} AI`,
            },
          };
          await handleUpdateQuestion(updated);
        }
      }
    } catch (e) {
      console.error('Reanalyze error:', e);
      setSaveStatusMessage('AI Re-analysis error');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedQuestion = questions.find((q) => q.id === selectedQuestionId) || null;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      {/* Top Bar Header */}
      <TopBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenBulkImporter={() => setIsBulkModalOpen(true)}
        totalQuestionsCount={questions.length}
        onResetLayout={handleResetPartitions}
      />

      {/* Main View Area */}
      <div ref={containerRef} className="flex-1 flex flex-col lg:flex-row overflow-hidden w-full relative">
        {/* Left Panel */}
        <LeftPanel
          questions={questions}
          selectedQuestionId={selectedQuestionId}
          onSelectQuestion={(q) => setSelectedQuestionId(q.id)}
          filters={filters}
          setFilters={setFilters}
          onToggleBookmark={handleToggleBookmark}
          onToggleFavorite={handleToggleFavorite}
          onRefresh={() => fetchQuestions(false)}
          isLoading={isLoading}
          widthPercent={leftWidth}
        />

        {/* Resizer Handle 1 (Left <-> Center) */}
        <div
          onMouseDown={handleMouseDownLeft}
          className="hidden lg:flex w-1.5 hover:w-2 bg-slate-200 hover:bg-indigo-500 cursor-col-resize active:bg-indigo-600 transition-all items-center justify-center select-none z-10 group shrink-0"
          title="Drag to resize Left and Center partitions"
        >
          <GripVertical className="w-3 h-3 text-slate-400 group-hover:text-white" />
        </div>

        {/* Center Panel */}
        <CenterPanel
          question={selectedQuestion}
          onUpdateQuestion={handleUpdateQuestion}
          onDeleteQuestion={handleDeleteQuestion}
          onOpenHistory={(id) => setHistoryModalQuestionId(id)}
          onReanalyzeAI={handleReanalyzeAI}
          isSaving={isSaving}
          saveStatusMessage={saveStatusMessage}
          widthPercent={centerWidth}
        />

        {/* Resizer Handle 2 (Center <-> Right) */}
        <div
          onMouseDown={handleMouseDownRight}
          className="hidden lg:flex w-1.5 hover:w-2 bg-slate-200 hover:bg-indigo-500 cursor-col-resize active:bg-indigo-600 transition-all items-center justify-center select-none z-10 group shrink-0"
          title="Drag to resize Center and Right partitions"
        >
          <GripVertical className="w-3 h-3 text-slate-400 group-hover:text-white" />
        </div>

        {/* Right Panel */}
        <RightPanel
          question={selectedQuestion}
          onUpdateQuestion={handleUpdateQuestion}
          widthPercent={rightWidth}
        />
      </div>

      {/* Modals */}
      <BulkImporterModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={(newQuestions) => {
          setQuestions((prev) => [...newQuestions, ...prev]);
          if (newQuestions.length > 0) {
            setSelectedQuestionId(newQuestions[0].id);
          }
        }}
        selectedAiModel={selectedAiModel}
        setSelectedAiModel={handleSetAiModel}
      />

      <SingleQuestionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={(newQuestion) => {
          setQuestions((prev) => [newQuestion, ...prev]);
          setSelectedQuestionId(newQuestion.id);
        }}
        selectedAiModel={selectedAiModel}
        setSelectedAiModel={handleSetAiModel}
      />

      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onConfigUpdated={() => fetchQuestions(false)}
      />

      <VersionHistoryModal
        isOpen={Boolean(historyModalQuestionId)}
        questionId={historyModalQuestionId}
        onClose={() => setHistoryModalQuestionId(null)}
      />
    </div>
  );
}
