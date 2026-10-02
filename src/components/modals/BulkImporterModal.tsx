import React, { useState } from 'react';
import { X, Sparkles, FileText, AlertCircle, Loader2, Cpu } from 'lucide-react';
import { Question } from '../../lib/types';
import { QuestionService } from '../../services/questionService';

interface BulkImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newQuestions: Question[]) => void;
  selectedAiModel: string;
  setSelectedAiModel: (m: string) => void;
}

export const BulkImporterModal: React.FC<BulkImporterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  selectedAiModel,
  setSelectedAiModel,
}) => {
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [progressMsg, setProgressMsg] = useState('');

  if (!isOpen) return null;

  const handleRunAIAnalysis = async () => {
    if (!inputText.trim()) {
      setErrorMsg('Please paste a question, list of questions, or document text.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg('');
    setProgressMsg(`Connecting to ${selectedAiModel} AI Engine...`);

    try {
      setProgressMsg('Splitting document and generating Senior 8-section playbooks in parallel...');

      const response = await fetch('/api/ai/analyze-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: inputText,
          model: selectedAiModel,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI Analysis failed with status ${response.status}`);
      }

      const result = await response.json();
      if (!result.success || !Array.isArray(result.data)) {
        throw new Error(result.error || 'Failed to process questions.');
      }

      const rawQuestions = result.data;
      setProgressMsg(`Generated ${rawQuestions.length} playbooks. Saving to Supabase...`);

      const now = new Date().toISOString();
      const formattedQuestions: Question[] = rawQuestions.map((item: any) => {
        const qId = crypto.randomUUID();
        return {
          id: qId,
          // PRESERVE EXACT QUESTION TITLE (NO IMPROVISATION)
          question: item.question || 'DevOps Scenario',
          question_type: item.question_type === 'Troubleshooting Question' ? 'Troubleshooting Question' : 'Interview Question',
          topic_name: item.topic || 'DevOps Architecture',
          concept_name: item.concept || 'System Reliability',
          experience_level_name: item.experience_level || 'Senior',
          priority_name: item.priority || 'High',
          status: 'Active',
          source: 'Bulk Document AI Import',
          language: 'en',
          category: item.category || 'Infrastructure',
          subcategory: item.subcategory || 'General',
          cloud_provider: item.cloud_provider || 'Cloud Agnostic',
          technology: item.technology || 'Kubernetes',
          difficulty: item.difficulty || 'Hard',
          tags: Array.isArray(item.suggested_tags) ? item.suggested_tags : ['devops', 'ai-analyzed'],
          is_bookmarked: false,
          is_favorite: false,
          created_at: now,
          updated_at: now,
          answer: {
            id: crypto.randomUUID(),
            question_id: qId,
            flags: item.flags || 'No flags specified.',
            commands: item.commands || '# Verification commands\nkubectl get pods',
            dependency_check: item.dependency_check || 'No dependency risks specified.',
            fix: item.fix || 'Resolution steps specified.',
            root_cause: item.root_cause || 'Root cause specified.',
            precautions: item.precautions || 'Prevention safeguards specified.',
            indications: item.indications || 'Early warning indicators specified.',
            interview_perspective: item.interview_perspective || 'Senior interview guidance.',
            last_updated: now,
            edited_by: `${selectedAiModel} AI`,
          },
        };
      });

      await QuestionService.bulkSaveQuestions(formattedQuestions);

      onSuccess(formattedQuestions);
      setIsAnalyzing(false);
      setInputText('');
      onClose();
    } catch (err: any) {
      console.error('Import error:', err);
      setErrorMsg(err.message || 'AI processing failed. Check your network or server logs.');
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Bulk AI Document & Bundle Importer</h2>
              <p className="text-[11px] text-slate-500">
                Paste 1 question, 100s of questions, or entire postmortem docs. Fast parallel AI playbooks.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-3.5 flex-1 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* AI Model Selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <span>Select AI Model for Generation</span>
            </label>
            <select
              value={selectedAiModel}
              onChange={(e) => setSelectedAiModel(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-xs focus:outline-none focus:border-indigo-500 focus:bg-white"
            >
              <option value="gemini-3.8-flash">Gemini 3.8 Flash (Fast & Balanced)</option>
              <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Ultra Low Latency)</option>
              <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Deep Reasoning)</option>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Legacy Flash)</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro (Legacy Pro)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Paste Question Bundles or Document Text</span>
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isAnalyzing}
              placeholder={`ErrImagePull
Pod in OOMKilled
Pod gets Evicted
Pod stuck in Terminating
Pod NotReady`}
              className="w-full h-56 p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-indigo-500 focus:bg-white leading-relaxed resize-y"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
            <span className="font-semibold text-slate-900">Supported AI Features:</span>
            <ul className="list-disc list-inside space-y-0.5 text-slate-600">
              <li>Splits text into individual questions & generates playbooks in parallel</li>
              <li>Auto-classifies Topic, Concept, Cloud Provider, Priority, and Experience Level</li>
              <li>Generates all Senior DevOps Playbook sections for every question</li>
              <li>Saves directly to Supabase with instant indexing</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-600 font-mono">
            {isAnalyzing && (
              <span className="flex items-center gap-2 text-indigo-600 font-semibold">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{progressMsg}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isAnalyzing}
              className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleRunAIAnalysis}
              disabled={isAnalyzing || !inputText.trim()}
              className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-xs disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Process & Save to Supabase</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
