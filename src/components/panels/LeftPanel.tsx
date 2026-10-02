import React, { useMemo } from 'react';
import { Search, Filter, Bookmark, Star, X, RefreshCw } from 'lucide-react';
import { Question, FilterState } from '../../lib/types';
import { Badge } from '../ui/Badge';

interface LeftPanelProps {
  questions: Question[];
  selectedQuestionId: string | null;
  onSelectQuestion: (q: Question) => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onToggleBookmark: (q: Question) => void;
  onToggleFavorite: (q: Question) => void;
  onRefresh: () => void;
  isLoading: boolean;
  widthPercent?: number;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  questions,
  selectedQuestionId,
  onSelectQuestion,
  filters,
  setFilters,
  onToggleBookmark,
  onToggleFavorite,
  onRefresh,
  isLoading,
  widthPercent,
}) => {
  const { availableTopics, availableClouds } = useMemo(() => {
    const topics = new Set<string>();
    const clouds = new Set<string>();

    questions.forEach((q) => {
      if (q.topic_name) topics.add(q.topic_name);
      if (q.cloud_provider) clouds.add(q.cloud_provider);
    });

    return {
      availableTopics: Array.from(topics).sort(),
      availableClouds: Array.from(clouds).sort(),
    };
  }, [questions]);

  const hasActiveFilters =
    filters.questionType !== 'All' ||
    filters.topic !== '' ||
    filters.concept !== '' ||
    filters.experience !== '' ||
    filters.priority !== '' ||
    filters.cloudProvider !== '' ||
    filters.technology !== '' ||
    filters.bookmarkedOnly ||
    filters.favoritesOnly ||
    filters.searchQuery !== '';

  const resetFilters = () => {
    setFilters({
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
  };

  return (
    <aside
      style={widthPercent ? { width: `${widthPercent}%` } : undefined}
      className="w-full lg:w-[40%] flex flex-col h-full border-r border-slate-200 bg-slate-50 shrink-0 overflow-hidden"
    >
      {/* Search Header */}
      <div className="p-3.5 border-b border-slate-200 bg-white space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search 10,000+ questions, commands, logs, topics..."
            value={filters.searchQuery}
            onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
            className="w-full pl-10 pr-8 py-2 text-sm bg-slate-100 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors font-medium"
          />
          {filters.searchQuery && (
            <button
              onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Question Type Segmented Control */}
        <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold">
          {(['All', 'Interview Question', 'Troubleshooting Question'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilters((prev) => ({ ...prev, questionType: type }))}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center truncate ${
                filters.questionType === type
                  ? 'bg-white text-indigo-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              {type === 'All' ? 'All Questions' : type.replace(' Question', '')}
            </button>
          ))}
        </div>

        {/* Dynamic Filter Selectors */}
        <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
          <div className="relative">
            <select
              value={filters.topic}
              onChange={(e) => setFilters((prev) => ({ ...prev, topic: e.target.value }))}
              className="w-full bg-slate-100 border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-800 font-medium focus:outline-none focus:border-indigo-500 truncate"
            >
              <option value="">All Topics</option>
              {availableTopics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <select
              value={filters.priority}
              onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))}
              className="w-full bg-slate-100 border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-800 font-medium focus:outline-none focus:border-indigo-500 truncate"
            >
              <option value="">All Priorities</option>
              <option value="Critical">P1 - Critical</option>
              <option value="High">P2 - High</option>
              <option value="Medium">P3 - Medium</option>
              <option value="Low">P4 - Low</option>
            </select>
          </div>

          <div className="relative">
            <select
              value={filters.experience}
              onChange={(e) => setFilters((prev) => ({ ...prev, experience: e.target.value }))}
              className="w-full bg-slate-100 border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-800 font-medium focus:outline-none focus:border-indigo-500 truncate"
            >
              <option value="">All Levels</option>
              <option value="Junior">Junior</option>
              <option value="Mid-Level">Mid-Level</option>
              <option value="Senior">Senior</option>
              <option value="Lead / Principal">Lead / Principal</option>
            </select>
          </div>

          <div className="relative">
            <select
              value={filters.cloudProvider}
              onChange={(e) => setFilters((prev) => ({ ...prev, cloudProvider: e.target.value }))}
              className="w-full bg-slate-100 border border-slate-200 rounded-lg py-1.5 px-2.5 text-slate-800 font-medium focus:outline-none focus:border-indigo-500 truncate"
            >
              <option value="">All Cloud Providers</option>
              {availableClouds.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Quick Buttons & Stats */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilters((prev) => ({ ...prev, bookmarkedOnly: !prev.bookmarkedOnly }))}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-semibold transition-colors ${
                filters.bookmarkedOnly
                  ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Bookmarked</span>
            </button>

            <button
              onClick={() => setFilters((prev) => ({ ...prev, favoritesOnly: !prev.favoritesOnly }))}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-semibold transition-colors ${
                filters.favoritesOnly
                  ? 'bg-rose-100 text-rose-900 border-rose-300 font-bold'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>Favorites</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline"
              >
                Reset filters
              </button>
            )}
            <button
              onClick={onRefresh}
              className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
              title="Refresh questions"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* List Header Count */}
      <div className="px-3.5 py-1.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 font-mono font-bold">
        <span>SHOWING {questions.length} MATCHES</span>
        <span>INDEX SEARCH ACTIVE</span>
      </div>

      {/* Scrollable Question Cards List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-200 bg-white">
        {questions.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <Filter className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm text-slate-600 font-medium">No DevOps questions match your current filter settings.</p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-3.5 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-lg text-indigo-600 hover:bg-slate-200 font-semibold"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          questions.map((q) => {
            const isSelected = q.id === selectedQuestionId;
            return (
              <div
                key={q.id}
                onClick={() => onSelectQuestion(q)}
                className={`p-4 cursor-pointer transition-all hover:bg-slate-50 group relative ${
                  isSelected ? 'bg-indigo-50/80 border-l-4 border-l-indigo-600' : 'hover:border-l-2 hover:border-l-slate-400'
                }`}
              >
                {/* Badges Bar */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    <Badge type="questionType" value={q.question_type} />
                    {q.priority_name && <Badge type="priority" value={q.priority_name} />}
                    {q.experience_level_name && <Badge type="experience" value={q.experience_level_name} />}
                  </div>

                  {/* Bookmark & Favorite Actions */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleBookmark(q);
                      }}
                      className={`p-1 rounded-md hover:bg-slate-200/60 transition-colors ${
                        q.is_bookmarked ? 'text-amber-600' : 'text-slate-400 hover:text-slate-700'
                      }`}
                      title={q.is_bookmarked ? 'Remove Bookmark' : 'Bookmark Question'}
                    >
                      <Bookmark className="w-4 h-4 fill-current" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(q);
                      }}
                      className={`p-1 rounded-md hover:bg-slate-200/60 transition-colors ${
                        q.is_favorite ? 'text-rose-600' : 'text-slate-400 hover:text-slate-700'
                      }`}
                      title={q.is_favorite ? 'Remove Favorite' : 'Favorite Question'}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-indigo-700 transition-colors mb-2">
                  {q.question}
                </h3>

                {/* Quiet Metadata Line */}
                <div className="flex items-center gap-2 text-xs text-slate-600 truncate font-mono">
                  <span>{q.topic_name || 'General'}</span>
                  <span aria-hidden="true">·</span>
                  <span>{q.technology || 'Kubernetes'}</span>
                  <span aria-hidden="true">·</span>
                  <span>{q.cloud_provider || 'Cloud Agnostic'}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
