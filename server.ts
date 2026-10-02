import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const SYSTEM_INSTRUCTION = `You are a Principal DevOps & Site Reliability Engineer (15+ years of production experience at MAANG / Top Tech enterprises).

CRITICAL QUESTION CLASSIFICATION RULES:
1. "Interview Question" (Theory / Conceptual Q&A / Architecture Theory):
   - Use "Interview Question" when the user asks a theoretical, conceptual, or Q&A question (e.g. "What is BGP?", "Explain Kubernetes Architecture", "Difference between CMD and ENTRYPOINT", "What is Terraform State?").
   - FOR "Interview Question", Section 8 ("Senior DevOps Verbal Interview Answer & Framework") IS THE ONLY SECTION NEEDED. Fill "interview_perspective" with a direct, elite Principal SRE verbal answer. You can leave flags, commands, dependency_check, fix, root_cause, precautions, indications as concise empty strings "" or minimal bullet placeholders.

2. "Troubleshooting Question" (Coding / Scenario / Production Issue / Debugging):
   - Use "Troubleshooting Question" when the user inputs a production issue, error scenario, failure, or debugging scenario (e.g. "Pod stuck in Pending", "OOMKilled Exit Code 137", "ErrImagePull", "Terraform apply state lock error").
   - FOR "Troubleshooting Question", fill ALL 8 SECTIONS with deep, battle-tested production analysis grounded strictly in official documentation (Kubernetes docs, Terraform docs, AWS docs, Linux man pages) with ZERO assumptions.

CRITICAL FORMATTING RULES FOR ALL SECTIONS:
- NO META-TALK: Speak directly in first-person ("I") in Section 8 without meta commentary ("In an interview I would say...").
- NEWLINE BULLETS: Every non-empty section MUST be formatted as itemized bullet points or numbered steps separated explicitly by \\n.
- PRESERVE QUESTION TITLE: Keep the exact user question text verbatim.`;

const ANSWER_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    question: { type: Type.STRING, description: "Exact original question verbatim" },
    question_type: { 
      type: Type.STRING, 
      description: "Must be EXACTLY 'Interview Question' (for theory/Q&A) or 'Troubleshooting Question' (for errors/scenarios)" 
    },
    topic: { type: Type.STRING, description: "Main topic e.g. Kubernetes, Terraform, CI/CD, Linux Kernel, AWS" },
    concept: { type: Type.STRING, description: "Specific concept e.g. Pod CrashLoopBackOff, State Drift, BGP Routing, OOMKilled" },
    experience_level: { type: Type.STRING, description: "Junior, Mid-Level, Senior, or Lead / Principal" },
    priority: { type: Type.STRING, description: "Low, Medium, High, or Critical" },
    category: { type: Type.STRING, description: "Primary infrastructure domain" },
    subcategory: { type: Type.STRING, description: "Specific subsystem or component" },
    cloud_provider: { type: Type.STRING, description: "AWS, GCP, Azure, Multi-Cloud, or Cloud Agnostic" },
    technology: { type: Type.STRING, description: "Main tool e.g. Kubernetes, Docker, Terraform, Prometheus, Linux" },
    difficulty: { type: Type.STRING, description: "Easy, Medium, Hard, or Expert" },
    suggested_tags: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "5-8 technical tags" 
    },
    flags: { 
      type: Type.STRING, 
      description: "1. Flags / Ways to Identify (For Troubleshooting Question. Itemized bullet points separated by \\n. Leave empty string for Interview Question)" 
    },
    commands: { 
      type: Type.STRING, 
      description: "2. Commands to Verify (For Troubleshooting Question. Exact CLI syntax separated by \\n. Leave empty string for Interview Question)" 
    },
    dependency_check: { 
      type: Type.STRING, 
      description: "3. Dependency Analysis (For Troubleshooting Question. Itemized bullet points separated by \\n. Leave empty string for Interview Question)" 
    },
    fix: { 
      type: Type.STRING, 
      description: "4. Resolution (For Troubleshooting Question. Numbered steps '1. ', '2. ' separated by \\n. Leave empty string for Interview Question)" 
    },
    root_cause: { 
      type: Type.STRING, 
      description: "5. Root Cause Analysis (For Troubleshooting Question. Itemized bullet points separated by \\n. Leave empty string for Interview Question)" 
    },
    precautions: { 
      type: Type.STRING, 
      description: "6. Future Prevention (For Troubleshooting Question. Itemized bullet points separated by \\n. Leave empty string for Interview Question)" 
    },
    indications: { 
      type: Type.STRING, 
      description: "7. Early Warning Signs (For Troubleshooting Question. Itemized bullet points separated by \\n. Leave empty string for Interview Question)" 
    },
    interview_perspective: { 
      type: Type.STRING, 
      description: "8. Senior DevOps Verbal Interview Answer & Framework (Direct first-person Principal SRE speech with zero meta-talk, exact trade-offs, and decision framework separated by \\n)" 
    },
  },
  required: [
    "question", "question_type", "topic", "concept", "experience_level", 
    "priority", "category", "subcategory", "cloud_provider", "technology", 
    "difficulty", "suggested_tags", "flags", "commands", "dependency_check", 
    "fix", "root_cause", "precautions", "indications", "interview_perspective"
  ]
};

function sanitizeModel(inputModel?: string): string {
  const allowed = [
    'gemini-3.8-flash',
    'gemini-3.1-flash-lite',
    'gemini-3.1-pro-preview',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
  ];
  if (inputModel && allowed.includes(inputModel)) {
    return inputModel;
  }
  return 'gemini-3.8-flash';
}

// Helper: Generate content with automatic fallback if primary model fails/times out
async function generateWithFallback(model: string, prompt: string, schema: any) {
  const modelsToTry = Array.from(new Set([model, 'gemini-3.8-flash', 'gemini-3.1-flash-lite']));

  for (const currentModel of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: currentModel,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0.2,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      if (response.text) {
        return { text: response.text, modelUsed: currentModel };
      }
    } catch (err) {
      console.warn(`Model ${currentModel} failed, trying fallback model...`, err);
    }
  }

  throw new Error('All Gemini model execution attempts failed.');
}

// Helper function to determine if an input question is a theory/conceptual question vs a troubleshooting issue
function classifyQuestionType(questionText: string): 'Interview Question' | 'Troubleshooting Question' {
  const lower = questionText.toLowerCase();
  
  // Indicators of Theory / Conceptual Q&A -> Interview Question
  const theoryKeywords = [
    'what is', 'explain', 'difference between', 'how does', 'what are', 
    'compare', 'architecture of', 'definition', 'overview', 'benefits of',
    'advantages of', 'disadvantages of', 'when to use', 'types of', 'concept'
  ];

  for (const kw of theoryKeywords) {
    if (lower.startsWith(kw) || lower.includes(` ${kw} `)) {
      return 'Interview Question';
    }
  }

  // Indicators of Troubleshooting / Production Issue
  const troubleshootingKeywords = [
    'stuck in', 'error', 'failed', 'failing', 'crash', 'crashloopbackoff',
    'oomkilled', 'evicted', 'pending', 'notready', 'timeout', '502', '503',
    '404', 'permission denied', 'refused', 'troubleshoot', 'fix', 'debug',
    'exception', 'broken', 'latency', 'high cpu', 'memory leak'
  ];

  for (const kw of troubleshootingKeywords) {
    if (lower.includes(kw)) {
      return 'Troubleshooting Question';
    }
  }

  // Default fallback if short question: if it starts with "what" or "explain" -> Interview Question
  if (lower.startsWith('what') || lower.startsWith('explain') || lower.startsWith('how')) {
    return 'Interview Question';
  }

  return 'Troubleshooting Question';
}

// API Endpoint: Single Question AI Analysis
app.post('/api/ai/analyze-single', async (req: Request, res: Response) => {
  try {
    const { questionText, context, model: reqModel } = req.body;
    if (!questionText || typeof questionText !== 'string') {
      res.status(400).json({ error: 'questionText is required' });
      return;
    }

    const targetModel = sanitizeModel(reqModel);
    const cleanUserQuestion = questionText.trim();
    const forcedType = classifyQuestionType(cleanUserQuestion);

    const prompt = `Analyze this exact DevOps input.
Classify as '${forcedType}'.

If 'Interview Question', fill ONLY Section 8 ('interview_perspective') with an elite Principal SRE verbal answer.
If 'Troubleshooting Question', fill ALL 8 SECTIONS with deep production analysis grounded strictly in official documentation.

Exact User Question:
${cleanUserQuestion}

${context ? `Additional Context: ${context}` : ''}`;

    const { text, modelUsed } = await generateWithFallback(targetModel, prompt, ANSWER_SCHEMA);
    const parsed = JSON.parse(text || '{}');
    
    parsed.question = cleanUserQuestion;
    parsed.question_type = forcedType;

    res.json({ success: true, data: parsed, modelUsed });
  } catch (error: any) {
    console.error('Error analyzing question:', error);
    res.status(500).json({ success: false, error: error.message || 'AI Analysis failed' });
  }
});

// API Endpoint: Fast Controlled Batch/Document Parse & Analyze across ALL models
app.post('/api/ai/analyze-batch', async (req: Request, res: Response) => {
  try {
    const { rawText, model: reqModel } = req.body;
    if (!rawText || typeof rawText !== 'string') {
      res.status(400).json({ error: 'rawText is required' });
      return;
    }

    const targetModel = sanitizeModel(reqModel);

    // Step 1: Rapidly split document into individual question titles
    const SPLIT_SCHEMA = {
      type: Type.OBJECT,
      properties: {
        titles: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of distinct DevOps question titles or scenarios"
        }
      },
      required: ["titles"]
    };

    const splitResponse = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: `Extract distinct DevOps question titles from this input text without altering or paraphrasing them.

Input Text:
${rawText}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: SPLIT_SCHEMA,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      }
    });

    const splitText = splitResponse.text || '{"titles":[]}';
    let questionTitles: string[] = [];
    try {
      questionTitles = JSON.parse(splitText).titles || [];
    } catch (e) {
      questionTitles = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 2);
    }

    if (questionTitles.length === 0) {
      questionTitles = [rawText.trim()];
    }

    const titlesToProcess = questionTitles.slice(0, 15);

    // Step 2: Controlled Chunked Execution (Concurrency of 3)
    const results: any[] = [];
    const chunkSize = 3;

    for (let i = 0; i < titlesToProcess.length; i += chunkSize) {
      const chunk = titlesToProcess.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(
        chunk.map(async (qTitle) => {
          try {
            const forcedType = classifyQuestionType(qTitle);
            const prompt = `Analyze this DevOps question: ${qTitle}.
Question Type MUST BE '${forcedType}'.
If 'Interview Question', fill ONLY Section 8 ('interview_perspective').
If 'Troubleshooting Question', fill ALL 8 SECTIONS.`;

            const { text } = await generateWithFallback(targetModel, prompt, ANSWER_SCHEMA);
            const parsedItem = JSON.parse(text || '{}');
            parsedItem.question = qTitle;
            parsedItem.question_type = forcedType;
            return parsedItem;
          } catch (err) {
            console.warn(`Failed to process question in batch chunk: ${qTitle}`, err);
            return null;
          }
        })
      );
      results.push(...chunkResults);
    }

    const validQuestions = results.filter(Boolean);
    res.json({ success: true, data: validQuestions, modelUsed: targetModel });
  } catch (error: any) {
    console.error('Error batch analyzing questions:', error);
    res.status(500).json({ success: false, error: error.message || 'Batch AI Analysis failed' });
  }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        const url = req.originalUrl;
        const htmlPath = path.resolve(__dirname, 'index.html');
        const rawHtml = fs.readFileSync(htmlPath, 'utf-8');
        const template = await vite.transformIndexHtml(url, rawHtml);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer();
