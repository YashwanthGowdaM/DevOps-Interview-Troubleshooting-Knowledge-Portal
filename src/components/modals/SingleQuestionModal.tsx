import React, { useState } from 'react';
import { X, Sparkles, Plus, Loader2, AlertCircle, Cpu } from 'lucide-react';
import { Question } from '../../lib/types';
import { QuestionService } from '../../services/questionService';

interface SingleQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newQuestion: Question) => void;
  selectedAiModel: string;
  setSelectedAiModel: (m: string) => void;
}

export const SingleQuestionModal: React.FC<SingleQuestionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  selectedAiModel,
  setSelectedAiModel,
}) => {
  const [questionText, setQuestionText] = useState('');
  const [contextText, setContextText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!questionText.trim()) {
      setErrorMsg('Please enter a question or troubleshooting scenario.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg('');

    try {
      const cleanInput = questionText.trim();
      const response = await fetch('/api/ai/analyze-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: cleanInput,
          context: contextText,
          model: selectedAiModel,
        }),
      });

      if (!response.ok) {
        throw new Error('AI Server Analysis failed');
      }

      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to process question');
      }

      const item = result.data;
      const qId = crypto.randomUUID();
      const now = new Date().toISOString();

      const newQuestion: Question = {
        id: qId,
        // STRICT RULE: PRESERVE EXACT ORIGINAL USER QUESTION TITLE (NO IMPROVISATION)
        question: cleanInput,
        question_type: item.question_type === 'Troubleshooting Question' ? 'Troubleshooting Question' : 'Interview Question',
        topic_name: item.topic || 'DevOps Engineering',
        concept_name: item.concept || 'System Reliability',
        experience_level_name: item.experience_level || 'Senior',
        priority_name: item.priority || 'High',
        status: 'Active',
        source: 'Manual AI Entry',
        language: 'en',
        category: item.category || 'Infrastructure',
        subcategory: item.subcategory || 'General',
        cloud_provider: item.cloud_provider || 'Cloud Agnostic',
        technology: item.technology || 'Kubernetes',
        difficulty: item.difficulty || 'Hard',
        tags: Array.isArray(item.suggested_tags) ? item.suggested_tags : ['devops'],
        is_bookmarked: false,
        is_favorite: false,
        created_at: now,
        updated_at: now,
        answer: {
          id: crypto.randomUUID(),
          question_id: qId,
          flags: item.flags || '',
          commands: item.commands || '',
          dependency_check: item.dependency_check || '',
          fix: item.fix || '',
          root_cause: item.root_cause || '',
          precautions: item.precautions || '',
          indications: item.indications || '',
          interview_perspective: item.interview_perspective || '',
          last_updated: now,
          edited_by: `${selectedAiModel} AI`,
        },
      };

      await QuestionService.saveQuestion(newQuestion);
      onSuccess(newQuestion);
      setIsAnalyzing(false);
      setQuestionText('');
      setContextText('');
      onClose();
    } catch (err: any) {
      console.error('Error saving single question:', err);
      setErrorMsg(err.message || 'AI generation failed. Please try again.');
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Add DevOps Question with AI</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3.5 text-xs">
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* AI Model Selector */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-600" />
              <span>Select AI Model</span>
            </label>
            <select
              value={selectedAiModel}
              onChange={(e) => setSelectedAiModel(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
            >
              <option value="gemini-3.8-flash">Gemini 3.8 Flash (Fast & Balanced)</option>
              <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Ultra Fast)</option>
              <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Deep Reasoning)</option>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Legacy Flash)</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro (Legacy Pro)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-800">Question or Troubleshooting Scenario *</label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="e.g. Pod stuck in Pending"
              className="w-full h-24 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-sans focus:outline-none focus:border-indigo-500 focus:bg-white leading-relaxed resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-800">Additional Context (Optional)</label>
            <input
              type="text"
              value={contextText}
              onChange={(e) => setContextText(e.target.value)}
              placeholder="e.g. Insufficient CPU/Memory resources on node pool"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-sans focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isAnalyzing}
            className="px-3.5 py-1.5 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isAnalyzing || !questionText.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Playbook...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Analyze & Save</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
