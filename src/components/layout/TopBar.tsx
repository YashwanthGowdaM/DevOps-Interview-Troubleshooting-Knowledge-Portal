import React from 'react';
import { Plus, Sparkles, Layers } from 'lucide-react';

interface TopBarProps {
  activeTab: 'library' | 'importer' | 'schema' | 'stats';
  setActiveTab: (tab: 'library' | 'importer' | 'schema' | 'stats') => void;
  onOpenAddModal: () => void;
  onOpenBulkImporter: () => void;
  totalQuestionsCount: number;
  onResetLayout: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  onOpenBulkImporter,
  totalQuestionsCount,
  onResetLayout,
}) => {
  return (
    <header className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between shrink-0 sticky top-0 z-30 select-none shadow-xs">
      {/* Zone 1: Brand Title */}
      <div className="flex items-center gap-3">
        <a href="/" className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
          DevOps Knowledge Portal
        </a>
        <span className="text-xs text-slate-500 font-mono hidden sm:inline-block">
          ({totalQuestionsCount.toLocaleString()} indexed)
        </span>
      </div>

      {/* Zone 2: Navigation Tabs */}
      <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
        <button
          onClick={() => setActiveTab('library')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'library'
              ? 'bg-white text-slate-900 shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-indigo-600" />
          <span>Questions Library</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('library');
            onOpenBulkImporter();
          }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'importer'
              ? 'bg-white text-slate-900 shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Bulk AI Importer</span>
        </button>
      </nav>

      {/* Zone 3: Actions */}
      <div className="flex items-center gap-2">
        {/* Reset Partitions Layout button */}
        <button
          onClick={onResetLayout}
          className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors hidden xl:inline-block"
          title="Reset panels to default 40% / 50% / 10% sizes"
        >
          Reset Partitions
        </button>

        {/* + Add Question Button */}
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="whitespace-nowrap">Add Question</span>
        </button>
      </div>
    </header>
  );
};
