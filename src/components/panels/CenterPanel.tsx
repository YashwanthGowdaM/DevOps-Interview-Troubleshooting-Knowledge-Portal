import React, { useState, useEffect } from 'react';
import {
  History,
  Copy,
  Check,
  Edit3,
  Eye,
  Trash2,
  Sparkles,
  Terminal,
  ShieldAlert,
  HelpCircle,
  AlertTriangle,
  Zap,
  CheckCircle2,
  TrendingUp,
  Award,
  MessageSquareCode,
  Layers
} from 'lucide-react';
import { Question, AIAnswer, QuestionType } from '../../lib/types';
import { Badge } from '../ui/Badge';
import { CodeBlock } from '../ui/CodeBlock';

interface CenterPanelProps {
  question: Question | null;
  onUpdateQuestion: (updated: Question) => Promise<void>;
  onDeleteQuestion: (id: string) => void;
  onOpenHistory: (id: string) => void;
  onReanalyzeAI: (questionText: string) => void;
  isSaving: boolean;
  saveStatusMessage: string;
  widthPercent?: number;
}

export const CenterPanel: React.FC<CenterPanelProps> = ({
  question,
  onUpdateQuestion,
  onDeleteQuestion,
  onOpenHistory,
  onReanalyzeAI,
  isSaving,
  saveStatusMessage,
  widthPercent,
}) => {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [localQuestion, setLocalQuestion] = useState<Question | null>(question);

  useEffect(() => {
    setLocalQuestion(question);
    setEditingSection(null);
  }, [question?.id]);

  if (!localQuestion) {
    return (
      <main
        style={widthPercent ? { width: `${widthPercent}%` } : undefined}
        className="w-full lg:w-[50%] flex flex-col items-center justify-center h-full bg-white p-8 text-center shrink-0 border-r border-slate-200"
      >
        <div className="max-w-md space-y-3">
          <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-between mx-auto text-indigo-600 p-3.5">
            <HelpCircle className="w-full h-full" />
          </div>
          <h2 className="text-base font-bold text-slate-900">No Question Selected</h2>
          <p className="text-sm text-slate-600">
            Select a DevOps interview or troubleshooting question from the left panel, or paste new questions to start analyzing.
          </p>
        </div>
      </main>
    );
  }

  const answer: AIAnswer = localQuestion.answer || {
    id: crypto.randomUUID(),
    question_id: localQuestion.id,
    flags: '• No flags documented yet.',
    commands: '# Add verification commands here\nkubectl get pods -A',
    dependency_check: '• No dependency risks documented.',
    fix: '1. Describe resolution step-by-step.',
    root_cause: '• Describe root cause analysis.',
    precautions: '• Describe preventive safeguards and alerting.',
    indications: '• Describe early warning metric signals.',
    interview_perspective: '• Direct Verbal Answer: Describe exact Senior DevOps response.',
    last_updated: new Date().toISOString(),
    edited_by: 'User',
  };

  const handleQuestionTypeChange = (newType: QuestionType) => {
    if (!localQuestion) return;
    const updated = { ...localQuestion, question_type: newType, updated_at: new Date().toISOString() };
    setLocalQuestion(updated);
    onUpdateQuestion(updated);
  };

  const handleSectionTextChange = (field: keyof AIAnswer, value: string) => {
    if (!localQuestion) return;
    const updatedAnswer = { ...answer, [field]: value, last_updated: new Date().toISOString() };
    const updatedQuestion = { ...localQuestion, answer: updatedAnswer };
    setLocalQuestion(updatedQuestion);

    // Save EXACT user manual edit into Supabase (No AI improvisation)
    onUpdateQuestion(updatedQuestion);
  };

  const handleCopyFullMarkdown = () => {
    if (!localQuestion) return;
    const isInterview = localQuestion.question_type === 'Interview Question';
    
    let text = `# ${localQuestion.question}
Type: ${localQuestion.question_type} | Topic: ${localQuestion.topic_name || 'N/A'} | Priority: ${localQuestion.priority_name || 'N/A'}

## Senior DevOps Verbal Interview Answer & Framework
${answer.interview_perspective}`;

    if (!isInterview) {
      text += `\n\n## 1. Flags / Ways to Identify the Issue
${answer.flags}

## 2. Commands to Verify
\`\`\`bash
${answer.commands}
\`\`\`

## 3. Dependency Analysis
${answer.dependency_check}

## 4. Resolution
${answer.fix}

## 5. Root Cause Analysis
${answer.root_cause}

## 6. Future Prevention
${answer.precautions}

## 7. Early Warning Signs
${answer.indications}`;
    }

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Safe, Clean Bullet & Numbered Itemized Renderer
  const renderFormattedPoints = (text: string) => {
    if (!text) return null;

    // Split ONLY by explicit newlines OR explicit space-bullet-space (" • ")
    const rawLines = text
      .split(/\n|\s+•\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s !== '•');

    return (
      <div className="space-y-3">
        {rawLines.map((line, idx) => {
          const isBullet = /^[•\-\*]\s*/.test(line);
          const isNumbered = /^\d+\.\s+/.test(line);

          if (isBullet) {
            const cleanText = line.replace(/^[•\-\*]\s*/, '');
            return (
              <div key={idx} className="flex items-start gap-3 text-sm sm:text-base text-slate-800 leading-relaxed font-sans">
                <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-2 select-none" />
                <span className="flex-1 font-sans">{cleanText}</span>
              </div>
            );
          } else if (isNumbered) {
            const match = line.match(/^(\d+\.)\s*(.*)/);
            const num = match ? match[1] : '';
            const cleanText = match ? match[2] : line;
            return (
              <div key={idx} className="flex items-start gap-3 text-sm sm:text-base text-slate-800 leading-relaxed font-sans">
                <span className="font-mono font-bold text-indigo-600 text-sm shrink-0 mt-0.5 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {num}
                </span>
                <span className="flex-1 font-sans">{cleanText}</span>
              </div>
            );
          } else {
            return (
              <div key={idx} className="flex items-start gap-3 text-sm sm:text-base text-slate-800 leading-relaxed font-sans">
                <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-2 select-none" />
                <span className="flex-1 font-sans">{line}</span>
              </div>
            );
          }
        })}
      </div>
    );
  };

  const ALL_SECTIONS: {
    key: keyof AIAnswer;
    num: number;
    title: string;
    icon: React.FC<{ className?: string }>;
    accentColor: string;
    placeholder: string;
  }[] = [
    {
      key: 'flags',
      num: 1,
      title: 'Flags / Ways to Identify the Issue',
      icon: ShieldAlert,
      accentColor: 'text-amber-900 border-amber-200 bg-amber-50',
      placeholder: '• Itemized bullet points for symptoms, logs, metrics, or kernel traces...',
    },
    {
      key: 'commands',
      num: 2,
      title: 'Commands to Verify (Grounded in Official Docs)',
      icon: Terminal,
      accentColor: 'text-emerald-900 border-emerald-200 bg-emerald-50',
      placeholder: '• Exact CLI commands for Linux, Kubernetes, Terraform, AWS, Docker...',
    },
    {
      key: 'dependency_check',
      num: 3,
      title: 'Dependency Analysis',
      icon: AlertTriangle,
      accentColor: 'text-sky-900 border-sky-200 bg-sky-50',
      placeholder: '• Itemized bullet points for upstream/downstream blast radius & risks...',
    },
    {
      key: 'fix',
      num: 4,
      title: 'Resolution (Production-Safe Fix - Official Docs)',
      icon: CheckCircle2,
      accentColor: 'text-indigo-900 border-indigo-200 bg-indigo-50',
      placeholder: '1. Step-by-step production fix...\n2. Rollback steps...\n3. Post-fix verification...',
    },
    {
      key: 'root_cause',
      num: 5,
      title: 'Root Cause Analysis',
      icon: Zap,
      accentColor: 'text-purple-900 border-purple-200 bg-purple-50',
      placeholder: '• Bullet points for underlying config drift, bottlenecks, or app bugs...',
    },
    {
      key: 'precautions',
      num: 6,
      title: 'Future Prevention & Guardrails',
      icon: ShieldAlert,
      accentColor: 'text-blue-900 border-blue-200 bg-blue-50',
      placeholder: '• Bullet points for monitoring rules, Alertmanager alerts, runbooks, IaC policies...',
    },
    {
      key: 'indications',
      num: 7,
      title: 'Early Warning Signs',
      icon: TrendingUp,
      accentColor: 'text-rose-900 border-rose-200 bg-rose-50',
      placeholder: '• Bullet points for metric trends, CPU/Memory creep, restart spikes...',
    },
    {
      key: 'interview_perspective',
      num: 8,
      title: 'Senior DevOps Verbal Interview Answer & Framework',
      icon: MessageSquareCode,
      accentColor: 'text-indigo-950 border-indigo-300 bg-indigo-100/90 font-bold',
      placeholder: '• Direct Verbal Answer: "When asked this question, I structure my response around..."\n• Architectural Trade-offs...\n• Production Incident Framework...',
    },
  ];

  const isInterviewOnly = localQuestion.question_type === 'Interview Question';
  const visibleSections = isInterviewOnly
    ? ALL_SECTIONS.filter((s) => s.key === 'interview_perspective')
    : ALL_SECTIONS;

  return (
    <main
      style={widthPercent ? { width: `${widthPercent}%` } : undefined}
      className="w-full lg:w-[50%] flex flex-col h-full bg-white shrink-0 overflow-hidden border-r border-slate-200"
    >
      {/* Top Action Header */}
      <div className="p-3.5 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center gap-2 overflow-hidden">
          {/* Interactive Question Type Toggle Pill */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => handleQuestionTypeChange('Interview Question')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                isInterviewOnly
                  ? 'bg-amber-500 text-white font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Theory / Conceptual Q&A Mode (Displays ONLY Section 8)"
            >
              Interview Theory
            </button>
            <button
              onClick={() => handleQuestionTypeChange('Troubleshooting Question')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                !isInterviewOnly
                  ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Troubleshooting & Scenario Mode (Displays ALL 8 Sections)"
            >
              Troubleshooting
            </button>
          </div>

          {localQuestion.priority_name && <Badge type="priority" value={localQuestion.priority_name} />}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Save Status Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-slate-700 font-mono bg-slate-100 border border-slate-200">
            <span className={`w-2 h-2 rounded-full ${isSaving ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`}></span>
            <span>{saveStatusMessage || (isSaving ? 'Saving...' : 'Supabase Synced')}</span>
          </div>

          <button
            onClick={() => onOpenHistory(localQuestion.id)}
            className="p-1.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            title="Version History & Audit Logs"
          >
            <History className="w-4 h-4" />
          </button>

          <button
            onClick={handleCopyFullMarkdown}
            className="p-1.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            title="Copy Full Playbook as Markdown"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={() => onReanalyzeAI(localQuestion.question)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition-colors"
            title="Re-run Gemini AI Analysis"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Re-AI</span>
          </button>

          <button
            onClick={() => onDeleteQuestion(localQuestion.id)}
            className="p-1.5 rounded-md bg-slate-100 border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Delete Question"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Question & Answer Content Scroll Container */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50/40">
        {/* Question Title Header */}
        <div className="space-y-2 pb-4 border-b border-slate-200 bg-white p-4 rounded-xl border shadow-2xs">
          <textarea
            value={localQuestion.question}
            onChange={(e) => {
              const updated = { ...localQuestion, question: e.target.value };
              setLocalQuestion(updated);
              onUpdateQuestion(updated);
            }}
            className="w-full text-base sm:text-lg font-bold text-slate-900 bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-500 rounded p-1 focus:outline-none transition-colors resize-none leading-snug"
            rows={2}
          />
        </div>

        {/* Dynamic Category Mode Banner */}
        {isInterviewOnly ? (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-900 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Interview Theory Mode: Displaying ONLY Senior DevOps Verbal Interview Answer & Framework</span>
            </span>
            <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-amber-200 text-amber-800 font-bold">
              Theory / Q&A
            </span>
          </div>
        ) : (
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-semibold text-indigo-900 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Troubleshooting Mode: Displaying ALL 8 SECTIONS (Grounded in Official Docs)</span>
            </span>
            <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-800 font-bold">
              Hands-on / Production
            </span>
          </div>
        )}

        {/* SECTIONS LIST */}
        <div className="space-y-5">
          {visibleSections.map((sec) => {
            const IconComponent = sec.icon;
            const content = (answer[sec.key] as string) || '';
            const isEditing = editingSection === sec.key;

            return (
              <section
                key={sec.key}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs transition-all hover:border-slate-300"
              >
                {/* Section Header Bar */}
                <div className={`px-4 py-2.5 flex items-center justify-between border-b ${sec.accentColor}`}>
                  <div className="flex items-center gap-2 font-bold text-sm tracking-tight">
                    <span className="font-mono text-xs opacity-80">{sec.num}.</span>
                    <IconComponent className="w-4 h-4" />
                    <span>{sec.title}</span>
                  </div>

                  <button
                    onClick={() => setEditingSection(isEditing ? null : sec.key)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 px-2.5 py-1 rounded-md hover:bg-black/5 transition-colors border border-black/5"
                  >
                    {isEditing ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Preview</span>
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Edit Section</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Section Body */}
                <div className="p-4 text-sm sm:text-base text-slate-800 leading-relaxed font-sans">
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={content}
                        onChange={(e) => handleSectionTextChange(sec.key, e.target.value)}
                        placeholder={sec.placeholder}
                        className="w-full min-h-[160px] p-3 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-500 leading-relaxed resize-y"
                      />
                      <p className="text-xs text-slate-500 font-mono">
                        Itemized bullet points enabled. Changes auto-save verbatim to Supabase.
                      </p>
                    </div>
                  ) : (
                    <div>
                      {sec.key === 'commands' ? (
                        <CodeBlock code={content} language="bash" title="Verification Commands" />
                      ) : (
                        renderFormattedPoints(content)
                      )}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
};
