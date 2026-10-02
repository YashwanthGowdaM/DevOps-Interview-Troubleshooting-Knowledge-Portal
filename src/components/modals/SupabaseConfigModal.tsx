import React, { useState } from 'react';
import { X, Database, CheckCircle2, AlertCircle, Copy, Download, Key, Link2, ShieldCheck } from 'lucide-react';
import { getSupabaseConfig, saveSupabaseConfig, resetSupabaseClient, SUPABASE_SQL_SCHEMA, getSupabaseClient } from '../../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose, onConfigUpdated }) => {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [key, setKey] = useState(currentConfig.key);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handleTestAndSave = async () => {
    setTestStatus('testing');
    setTestMessage('Testing Supabase connection...');

    try {
      saveSupabaseConfig(url, key);
      resetSupabaseClient();

      const client = getSupabaseClient();
      if (!client) {
        throw new Error('Please enter both Supabase URL and Anon Key.');
      }

      const { error } = await client.from('questions').select('count', { count: 'exact', head: true });
      if (error && error.code !== 'PGRST116') {
        if (error.message.includes('relation "public.questions" does not exist') || error.code === '42P01') {
          setTestStatus('success');
          setTestMessage('Connected to Supabase! (Note: Remember to run the SQL schema below to create tables).');
        } else {
          throw error;
        }
      } else {
        setTestStatus('success');
        setTestMessage('Successfully connected to Supabase PostgreSQL Database!');
      }

      onConfigUpdated();
    } catch (err: any) {
      console.error('Supabase test error:', err);
      setTestStatus('error');
      setTestMessage(err.message || 'Failed to connect. Check URL and Anon Key.');
    }
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadSchema = () => {
    const element = document.createElement('a');
    const file = new Blob([SUPABASE_SQL_SCHEMA], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'devops_portal_schema.sql';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Supabase PostgreSQL Connection & Schema</h2>
              <p className="text-[11px] text-slate-500">
                Connect your real Supabase backend or download the production SQL schema.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-5 flex-1 overflow-y-auto text-xs">
          {testMessage && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
                testStatus === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : testStatus === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              {testStatus === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{testMessage}</span>
            </div>
          )}

          <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-800 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-sky-600" />
                <span>Supabase Project URL</span>
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-project-id.supabase.co"
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-800 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-600" />
                <span>Supabase Anon Public Key</span>
              </label>
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Row Level Security (RLS) enabled
              </span>
              <button
                onClick={handleTestAndSave}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs"
              >
                {testStatus === 'testing' ? 'Connecting...' : 'Save & Test Connection'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-900">Production SQL Schema Script</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySchema}
                  className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition-colors border border-slate-200"
                >
                  {isCopied ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{isCopied ? 'Copied SQL' : 'Copy SQL'}</span>
                </button>
                <button
                  onClick={handleDownloadSchema}
                  className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition-colors border border-slate-200"
                >
                  <Download className="w-3 h-3" />
                  <span>Download .sql</span>
                </button>
              </div>
            </div>

            <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl h-40 overflow-y-auto leading-relaxed border border-slate-800">
              <code>{SUPABASE_SQL_SCHEMA}</code>
            </pre>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
