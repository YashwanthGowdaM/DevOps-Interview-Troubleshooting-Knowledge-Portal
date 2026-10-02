import React, { useEffect, useState } from 'react';
import { X, History, Clock, Loader2 } from 'lucide-react';
import { QuestionHistory } from '../../lib/types';
import { QuestionService } from '../../services/questionService';

interface VersionHistoryModalProps {
  isOpen: boolean;
  questionId: string | null;
  onClose: () => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({ isOpen, questionId, onClose }) => {
  const [history, setHistory] = useState<QuestionHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && questionId) {
      setIsLoading(true);
      QuestionService.getQuestionHistory(questionId).then((logs) => {
        setHistory(logs);
        setIsLoading(false);
      });
    }
  }, [isOpen, questionId]);

  if (!isOpen || !questionId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Version Audit History</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3 flex-1 overflow-y-auto text-xs font-sans">
          {isLoading ? (
            <div className="p-8 text-center flex items-center justify-center gap-2 text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Fetching audit history from Supabase...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center text-slate-500 space-y-1">
              <Clock className="w-6 h-6 mx-auto text-slate-400 mb-2" />
              <p className="font-semibold text-slate-800">No previous version edits recorded yet.</p>
              <p className="text-[11px] text-slate-500">
                Any modifications made to answer sections or metadata fields will automatically log here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span className="font-semibold text-indigo-700">{item.field_changed}</span>
                    <span className="font-mono text-slate-500">
                      {new Date(item.changed_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-slate-800 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg">
                      <span className="text-rose-700 font-semibold block mb-0.5">Previous:</span>
                      <p className="truncate font-mono">{item.old_value || '(empty)'}</p>
                    </div>
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <span className="text-emerald-700 font-semibold block mb-0.5">New Value:</span>
                      <p className="truncate font-mono">{item.new_value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-medium">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
