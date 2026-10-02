import React, { useState } from 'react';
import { Database, Copy, CheckCircle2, Download, Table, Zap } from 'lucide-react';
import { SUPABASE_SQL_SCHEMA } from '../../lib/supabase';

export const SchemaView: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([SUPABASE_SQL_SCHEMA], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'devops_portal_schema.sql';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const TABLES = [
    { name: 'questions', desc: 'Core questions index, tags, categories, cloud provider, status, full-text vectors' },
    { name: 'ai_answers', desc: 'Mandatory 8 Senior DevOps Playbook sections (Flags, Commands, Resolution, Root Cause...)' },
    { name: 'topics', desc: 'Main domain categories (Kubernetes, Terraform, CI/CD, Networking, Linux)' },
    { name: 'concepts', desc: 'Subsystem concepts (CrashLoopBackOff, State Drift, BGP Routing, OOMKilled)' },
    { name: 'experience_levels', desc: 'Junior, Mid-Level, Senior, Lead / Principal' },
    { name: 'issue_priorities', desc: 'P1 - Critical, P2 - High, P3 - Medium, P4 - Low' },
    { name: 'tags & question_tags', desc: 'Normalized tags junction for instant multi-tag filtering' },
    { name: 'question_history', desc: 'Field-level version audit logs for all edits made' },
    { name: 'audit_logs', desc: 'System-wide activity logs for imports, updates, and deletes' },
    { name: 'bookmarks & favorites', desc: 'User-level pinned questions and star list' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 text-slate-900 font-sans space-y-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Banner */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Database className="w-6 h-6 text-indigo-600" />
              <h1 className="text-lg font-bold text-slate-900">Supabase PostgreSQL Database Architecture</h1>
            </div>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Normalized relational database schema optimized for over 10,000+ DevOps questions with PostgreSQL GIN full-text search indexes, B-Tree indexes, Row Level Security (RLS) policies, and cascading foreign keys.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied SQL Schema' : 'Copy SQL Schema'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold border border-slate-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download .sql</span>
            </button>
          </div>
        </div>

        {/* Tables Overview Grid */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Table className="w-4 h-4 text-emerald-600" />
            <span>Normalized Database Tables (12 Entities)</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {TABLES.map((tbl) => (
              <div key={tbl.name} className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
                <span className="font-mono font-bold text-indigo-700 block">{tbl.name}</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">{tbl.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Full SQL Script Code Display */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-600" />
            <span>SQL Migration Script (Run in Supabase SQL Editor)</span>
          </h2>
          <div className="rounded-xl border border-slate-800 bg-slate-900 text-slate-100 overflow-hidden font-mono text-xs shadow-sm">
            <pre className="p-4 text-emerald-400 overflow-x-auto leading-relaxed max-h-96 text-[11px]">
              <code>{SUPABASE_SQL_SCHEMA}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
