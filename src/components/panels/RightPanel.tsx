import React, { useState } from 'react';
import { Tag as TagIcon, Bookmark, Star, Sliders, Plus, X, Globe, Cpu, Layers, ShieldAlert, Award } from 'lucide-react';
import { Question, QuestionType, ExperienceLevel, PriorityLevel, DifficultyLevel } from '../../lib/types';

interface RightPanelProps {
  question: Question | null;
  onUpdateQuestion: (updated: Question) => Promise<void>;
  widthPercent?: number;
}

export const RightPanel: React.FC<RightPanelProps> = ({ question, onUpdateQuestion, widthPercent }) => {
  const [newTagInput, setNewTagInput] = useState('');

  if (!question) {
    return (
      <aside
        style={widthPercent ? { width: `${widthPercent}%` } : undefined}
        className="w-full lg:w-[10%] min-w-[200px] flex flex-col h-full bg-slate-50 border-l border-slate-200 p-3 text-center justify-center text-slate-500 shrink-0 text-xs sm:text-sm font-medium"
      >
        <Sliders className="w-5 h-5 mx-auto mb-2 opacity-40 text-slate-500" />
        <span>Metadata Inspector</span>
      </aside>
    );
  }

  const handleFieldChange = (field: keyof Question, value: any) => {
    const updated = { ...question, [field]: value, updated_at: new Date().toISOString() };
    onUpdateQuestion(updated);
  };

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const tag = newTagInput.trim().toLowerCase();
    if (!question.tags.includes(tag)) {
      handleFieldChange('tags', [...question.tags, tag]);
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleFieldChange(
      'tags',
      question.tags.filter((t) => t !== tagToRemove)
    );
  };

  return (
    <aside
      style={widthPercent ? { width: `${widthPercent}%` } : undefined}
      className="w-full lg:w-[10%] min-w-[220px] max-w-[340px] flex flex-col h-full bg-slate-50 border-l border-slate-200 shrink-0 overflow-y-auto divide-y divide-slate-200 font-sans"
    >
      {/* Header */}
      <div className="p-3.5 bg-white sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-slate-900">
          <Sliders className="w-4 h-4 text-indigo-600" />
          <span>Metadata</span>
        </div>
        <span className="text-xs text-emerald-700 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          LIVE SYNC
        </span>
      </div>

      <div className="p-3.5 space-y-4 text-xs sm:text-sm bg-slate-50/50">
        {/* Bookmarks & Favorites Quick Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleFieldChange('is_bookmarked', !question.is_bookmarked)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs font-bold transition-colors ${
              question.is_bookmarked
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-white text-slate-700 border-slate-200 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Bookmark className="w-4 h-4 fill-current" />
            <span>{question.is_bookmarked ? 'Bookmarked' : 'Bookmark'}</span>
          </button>

          <button
            onClick={() => handleFieldChange('is_favorite', !question.is_favorite)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs font-bold transition-colors ${
              question.is_favorite
                ? 'bg-rose-100 text-rose-900 border-rose-300'
                : 'bg-white text-slate-700 border-slate-200 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Star className="w-4 h-4 fill-current" />
            <span>{question.is_favorite ? 'Favorite' : 'Favorite'}</span>
          </button>
        </div>

        {/* Question Type */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Question Type</span>
          </label>
          <select
            value={question.question_type}
            onChange={(e) => handleFieldChange('question_type', e.target.value as QuestionType)}
            className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-900 font-semibold focus:outline-none focus:border-indigo-500 text-xs sm:text-sm shadow-2xs"
          >
            <option value="Interview Question">Interview Question</option>
            <option value="Troubleshooting Question">Troubleshooting Question</option>
          </select>
        </div>

        {/* Issue Priority */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Priority</span>
          </label>
          <select
            value={question.priority_name || 'Medium'}
            onChange={(e) => handleFieldChange('priority_name', e.target.value as PriorityLevel)}
            className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-900 font-semibold focus:outline-none focus:border-indigo-500 text-xs sm:text-sm shadow-2xs"
          >
            <option value="Critical">P1 - Critical</option>
            <option value="High">P2 - High</option>
            <option value="Medium">P3 - Medium</option>
            <option value="Low">P4 - Low</option>
          </select>
        </div>

        {/* Experience Level */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span>Experience Level</span>
          </label>
          <select
            value={question.experience_level_name || 'Senior'}
            onChange={(e) => handleFieldChange('experience_level_name', e.target.value as ExperienceLevel)}
            className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-900 font-semibold focus:outline-none focus:border-indigo-500 text-xs sm:text-sm shadow-2xs"
          >
            <option value="Junior">Junior</option>
            <option value="Mid-Level">Mid-Level</option>
            <option value="Senior">Senior</option>
            <option value="Lead / Principal">Lead / Principal</option>
          </select>
        </div>

        {/* Topic */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-800">Topic</label>
          <input
            type="text"
            value={question.topic_name || ''}
            onChange={(e) => handleFieldChange('topic_name', e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-900 font-semibold focus:outline-none focus:border-indigo-500 text-xs sm:text-sm shadow-2xs"
          />
        </div>

        {/* Concept */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-800">Concept</label>
          <input
            type="text"
            value={question.concept_name || ''}
            onChange={(e) => handleFieldChange('concept_name', e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-900 font-semibold focus:outline-none focus:border-indigo-500 text-xs sm:text-sm shadow-2xs"
          />
        </div>

        {/* Cloud Provider */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-sky-600" />
            <span>Cloud Provider</span>
          </label>
          <input
            type="text"
            value={question.cloud_provider || 'Cloud Agnostic'}
            onChange={(e) => handleFieldChange('cloud_provider', e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-900 font-semibold focus:outline-none focus:border-indigo-500 text-xs sm:text-sm shadow-2xs"
          />
        </div>

        {/* Primary Technology */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-emerald-600" />
            <span>Technology</span>
          </label>
          <input
            type="text"
            value={question.technology || 'Kubernetes'}
            onChange={(e) => handleFieldChange('technology', e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-900 font-semibold focus:outline-none focus:border-indigo-500 text-xs sm:text-sm shadow-2xs"
          />
        </div>

        {/* Difficulty */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-800">Difficulty</label>
          <select
            value={question.difficulty || 'Hard'}
            onChange={(e) => handleFieldChange('difficulty', e.target.value as DifficultyLevel)}
            className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-900 font-semibold focus:outline-none focus:border-indigo-500 text-xs sm:text-sm shadow-2xs"
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
            <option value="Expert">Expert</option>
          </select>
        </div>

        {/* Tags Section */}
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
            <TagIcon className="w-3.5 h-3.5 text-amber-600" />
            <span>Tags ({question.tags?.length || 0})</span>
          </label>

          <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto">
            {question.tags?.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-800 border border-slate-200 font-mono font-medium"
              >
                #{tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="text-slate-400 hover:text-rose-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          {/* Add Tag Input */}
          <div className="flex items-center gap-1">
            <input
              type="text"
              placeholder="Add tag..."
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
              className="flex-1 bg-white border border-slate-200 rounded-md py-1 px-2 text-slate-800 text-xs focus:outline-none focus:border-indigo-500 font-mono"
            />
            <button
              onClick={handleAddTag}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
