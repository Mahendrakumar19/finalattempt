/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { 
  Flame, Plus, Trash2, Edit3, X, 
  HelpCircle, Eye, Sparkles, RefreshCw, AlertCircle,
  Upload, FileText, Check, Copy, ArrowUp, ArrowDown,
  Search, Image as ImageIcon, Layers,
  BookOpen, Share2, ExternalLink, Link2
} from 'lucide-react';
import { db } from '@/services/db';
import { renderFormattedQuestionText, sanitizeAndRepairQuestion } from '@/utils/questionFormatter';

export function generateDailyQuizSlug(title: string, publishDate: string): string {
  const cleanTitle = (title || 'daily-practice-quiz')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const cleanDate = (publishDate || new Date().toISOString().split('T')[0]).trim();
  return `${cleanTitle || 'daily-quiz'}-${cleanDate}`.replace(/--+/g, '-');
}

export function generateUniqueId(prefix = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

/** Strips any leading "(a) " / "(A) " / "(क) " option prefix from stored option text */
function stripOptionPrefix(text: string): string {
  if (!text) return '';
  return text.replace(/^\s*\([a-dA-D\u0915-\u0918]\)\s+/, '').trim();
}

function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash >>> 0;
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleArraySeeded<T>(array: T[], seedStr: string): T[] {
  const arr = [...array];
  const random = mulberry32(stringToSeed(seedStr));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface DailyQuiz {
  id: string;
  slug?: string;
  title: string;
  title_hi?: string;
  description: string;
  description_hi?: string;
  publishDate: string;
  publish_target?: 'english' | 'hindi' | 'both' | string;
  timeLimitMins: number;
  totalQuestions: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HIGH' | string;
  category?: string;
  attemptsCount?: number;
  passingScore?: number;
  isFree?: boolean;
  setMode?: 'single' | 'multi';
  defaultSet?: string;
  availableSets?: string[];
  scheduledReleaseAt?: string;
}

export interface Question {
  id: string;
  questionText: string;
  questionTextHi?: string;
  optionA: string;
  optionAHi?: string;
  optionB: string;
  optionBHi?: string;
  optionC: string;
  optionCHi?: string;
  optionD: string;
  optionDHi?: string;
  optionE?: string;
  optionEHi?: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E' | string;
  explanation: string;
  explanationHi?: string;
  questionImageUrl?: string;
  imageUrl?: string;
  marks?: number;
  negativeMarks?: number;
  [key: string]: unknown;
}

const BLANK_DAILY_QUIZ: Partial<DailyQuiz> = {
  title: 'Daily Practice: Current Affairs & Bihar GS',
  title_hi: 'दैनिक अभ्यास: समसामयिकी एवं बिहार सामान्य ज्ञान',
  slug: '',
  description: '10 high-yield questions covering National & Bihar Current Affairs, Polity, and Bihar Special static GS.',
  description_hi: 'राष्ट्रीय व बिहार समसामयिकी, राजव्यवस्था, एवं बिहार विशेष के 10 महत्वपूर्ण अभ्यास प्रश्न।',
  publishDate: new Date().toISOString().split('T')[0],
  publish_target: 'both',
  timeLimitMins: 10,
  totalQuestions: 10,
  difficulty: 'MEDIUM',
  category: 'Daily Practice',
  passingScore: 40,
  isFree: true,
  setMode: 'single',
  defaultSet: 'SET-A',
  availableSets: ['SET-A', 'SET-B', 'SET-C', 'SET-D']
};

const BLANK_QUESTION: Partial<Question> = {
  questionText: '',
  questionTextHi: '',
  optionA: '',
  optionAHi: '',
  optionB: '',
  optionBHi: '',
  optionC: '',
  optionCHi: '',
  optionD: '',
  optionDHi: '',
  optionE: '',
  optionEHi: '',
  correctAnswer: 'A',
  explanation: '',
  explanationHi: '',
  questionImageUrl: '',
  marks: 1.0,
  negativeMarks: 0.33
};

const SAMPLE_BULK_TEXT = `1. Under Article 213 of the Indian Constitution, the Governor of a State can promulgate Ordinances when:
(A) The State Legislative Assembly is dissolved only
(B) Both Houses of the State Legislature (or Assembly) are not in session
(C) The High Court approves the emergency decree
(D) The Chief Minister submits a written recommendation
(E) None of the above / More than one of the above
Ans: B
Explanation: The Governor can promulgate an ordinance under Article 213 only when the Legislative Assembly (or both Houses in a bicameral legislature) is not in session.

2. Which sector recorded the highest growth rate in Bihar Economic Survey 2024-25?
(A) Primary Sector (Agriculture & Allied)
(B) Secondary Sector (Manufacturing & Industry)
(C) Tertiary Sector (Services)
(D) Quaternary Knowledge Sector
(E) None of the above / More than one of the above
Ans: C
Explanation: The Tertiary (Services) sector in Bihar recorded the highest growth rate exceeding 10.3%, led by trade, logistics, and communications.`;

interface DailyQuizCMSProps {
  BACKEND_URL?: string;
}

export default function DailyQuizCMS({}: DailyQuizCMSProps = {}) {
  const [quizzes, setQuizzes] = useState<DailyQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuizQuery, setSearchQuizQuery] = useState('');

  // Quiz Modal State
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Partial<DailyQuiz>>({ ...BLANK_DAILY_QUIZ });
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [quizModalLangTab, setQuizModalLangTab] = useState<'en' | 'hi'>('en');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [copiedLinkQuizId, setCopiedLinkQuizId] = useState<string | null>(null);

  // Question Management State
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [searchQuestionQuery, setSearchQuestionQuery] = useState('');

  // Question Modal State (Single Question Builder)
  const [isQModalOpen, setIsQModalOpen] = useState(false);
  const [editingQ, setEditingQ] = useState<Partial<Question>>({ ...BLANK_QUESTION });
  const [savingQ, setSavingQ] = useState(false);
  const [qModalLangTab, setQModalLangTab] = useState<'en' | 'hi'>('en');
  const [hasOptionE, setHasOptionE] = useState(false);
  const [previewMarkdown, setPreviewMarkdown] = useState(false);

  // Question Display View Layout ('cards' | 'table')
  const [questionViewLayout, setQuestionViewLayout] = useState<'cards' | 'table'>('table');

  // Bulk Importer Modal State (Universal Test Series Standard)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkParseMode, setBulkParseMode] = useState<'text' | 'pdf' | 'excel'>('text');
  const [bulkRawText, setBulkRawText] = useState('');
  const [parsedBulkQuestions, setParsedBulkQuestions] = useState<Question[]>([]);
  const [bulkDefaultMarks, setBulkDefaultMarks] = useState(1.0);
  const [bulkDefaultNegMarks, setBulkDefaultNegMarks] = useState(0.33);
  const [importingBulk, setImportingBulk] = useState(false);
  const [parsingBulkFile, setParsingBulkFile] = useState(false);
  const [bulkParseErrors, setBulkParseErrors] = useState<string[]>([]);
  const [bilingualReport, setBilingualReport] = useState<any>(null);
  const [bilingualViewMode, setBilingualViewMode] = useState<'canonical' | 'single'>('canonical');
  const [previewQuestionIndex, setPreviewQuestionIndex] = useState(0);
  const [bilingualPaperLanguage, setBilingualPaperLanguage] = useState<'BILINGUAL' | 'HINDI_ONLY' | 'ENGLISH_ONLY'>('BILINGUAL');

  // Answer Key Inspector Modal State
  const [isAnswerKeyModalOpen, setIsAnswerKeyModalOpen] = useState(false);
  const [copiedKeyToast, setCopiedKeyToast] = useState(false);

  // SET Inspection & Variant preview state (SET-A, SET-B, SET-C, SET-D)
  const [selectedSetCode, setSelectedSetCode] = useState<'SET-A' | 'SET-B' | 'SET-C' | 'SET-D'>('SET-A');

  // Fetch questions for a selected quiz
  const handleSelectQuizForQuestions = useCallback(async (quizId: string) => {
    setSelectedQuizId(quizId);
    setLoadingQuestions(true);
    setSelectedSetCode('SET-A');
    try {
      const adminQuestions = await (db as unknown as { getAdminDailyQuizQuestions: (id: string) => Promise<Question[]> }).getAdminDailyQuizQuestions(quizId);
      if (Array.isArray(adminQuestions) && adminQuestions.length > 0) {
        setQuestions(adminQuestions);
      } else {
        const data = await db.startDailyQuiz(quizId);
        if (data && data.questions) {
          setQuestions(data.questions);
        } else {
          setQuestions([]);
        }
      }
    } catch (err) {
      console.error('Failed loading questions:', err);
      setQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  }, []);

  // Fetch all daily quizzes
  const loadQuizzes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await db.getPreviousDailyQuizzes();
      setQuizzes(data || []);
      if (data && data.length > 0) {
        setSelectedQuizId(prev => {
          if (!prev) {
            handleSelectQuizForQuestions(data[0].id);
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Failed loading daily quizzes:', err);
    } finally {
      setLoading(false);
    }
  }, [handleSelectQuizForQuestions]);

  useEffect(() => {
    let isSubscribed = true;
    db.getPreviousDailyQuizzes()
      .then(data => {
        if (!isSubscribed) return;
        setQuizzes(data || []);
        if (data && data.length > 0) {
          setSelectedQuizId(prev => {
            if (!prev) {
              handleSelectQuizForQuestions(data[0].id);
            }
            return prev;
          });
        }
      })
      .catch(err => console.error('Failed loading daily quizzes:', err))
      .finally(() => {
        if (isSubscribed) setLoading(false);
      });
    return () => { isSubscribed = false; };
  }, [handleSelectQuizForQuestions]);

  // Selected Quiz object
  const currentSelectedQuiz = useMemo(() => {
    return quizzes.find(q => q.id === selectedQuizId) || null;
  }, [quizzes, selectedQuizId]);

  // Compute SET-shuffled questions for current quiz and selectedSetCode
  const activeSetQuestions = useMemo<Question[]>(() => {
    if (!questions || questions.length === 0) return [];
    if (selectedSetCode === 'SET-A' || currentSelectedQuiz?.setMode !== 'multi') {
      return questions.map(q => ({ ...q, mappedCorrectKey: q.correctAnswer }));
    }
    const seed = `seed-${selectedQuizId || 'dq'}-${selectedSetCode}`;
    const shuffledQs = shuffleArraySeeded(questions, `${seed}-q`);
    return shuffledQs.map((q: Question) => {
      const rawOptionPairs = [
        { origKey: 'A', text: q.optionA, textHi: q.optionAHi },
        { origKey: 'B', text: q.optionB, textHi: q.optionBHi },
        { origKey: 'C', text: q.optionC, textHi: q.optionCHi },
        { origKey: 'D', text: q.optionD, textHi: q.optionDHi },
        { origKey: 'E', text: q.optionE, textHi: q.optionEHi },
      ];
      const optionPairs = rawOptionPairs.filter(o => o.text || o.textHi);
      const shuffledOpts = shuffleArraySeeded(optionPairs, `${seed}-opt-${q.id}`);
      let mappedCorrectKey = q.correctAnswer;
      const newLetters = ['A', 'B', 'C', 'D', 'E'];
      shuffledOpts.forEach((opt: any, idx: number) => {
        if (opt.origKey === q.correctAnswer) mappedCorrectKey = newLetters[idx];
      });

      return {
        ...q,
        optionA: shuffledOpts[0]?.text || '',
        optionB: shuffledOpts[1]?.text || '',
        optionC: shuffledOpts[2]?.text || '',
        optionD: shuffledOpts[3]?.text || '',
        optionE: shuffledOpts[4]?.text || undefined,
        optionAHi: shuffledOpts[0]?.textHi || undefined,
        optionBHi: shuffledOpts[1]?.textHi || undefined,
        optionCHi: shuffledOpts[2]?.textHi || undefined,
        optionDHi: shuffledOpts[3]?.textHi || undefined,
        optionEHi: shuffledOpts[4]?.textHi || undefined,
        mappedCorrectKey
      };
    });
  }, [questions, selectedSetCode, currentSelectedQuiz, selectedQuizId]);

  // Filtered Quizzes
  const filteredQuizzes = useMemo(() => {
    if (!searchQuizQuery.trim()) return quizzes;
    const q = searchQuizQuery.toLowerCase();
    return quizzes.filter(quiz => 
      quiz.title?.toLowerCase().includes(q) ||
      quiz.title_hi?.includes(q) ||
      quiz.category?.toLowerCase().includes(q) ||
      quiz.publishDate?.includes(q) ||
      quiz.slug?.toLowerCase().includes(q)
    );
  }, [quizzes, searchQuizQuery]);

  // Filtered Questions in selected quiz (using activeSetQuestions)
  const filteredQuestions = useMemo(() => {
    if (!searchQuestionQuery.trim()) return activeSetQuestions;
    const q = searchQuestionQuery.toLowerCase();
    return activeSetQuestions.filter((item: Question) =>
      item.questionText?.toLowerCase().includes(q) ||
      item.questionTextHi?.includes(q) ||
      item.explanation?.toLowerCase().includes(q) ||
      item.explanationHi?.includes(q)
    );
  }, [activeSetQuestions, searchQuestionQuery]);

  // Save / Update Daily Quiz Metadata
  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingQuiz(true);

    try {
      const titleForSlug = editingQuiz.title || 'daily-practice-quiz';
      const fallbackDate = editingQuiz.publishDate || new Date().toISOString().split('T')[0];
      const autoSlug = (editingQuiz.slug && editingQuiz.slug.trim())
        ? editingQuiz.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        : generateDailyQuizSlug(titleForSlug, fallbackDate);

      const newQuiz: DailyQuiz = {
        id: editingQuiz.id || generateUniqueId('dq'),
        slug: autoSlug,
        title: editingQuiz.title || 'Daily Practice Quiz',
        title_hi: editingQuiz.title_hi || undefined,
        description: editingQuiz.description || '',
        description_hi: editingQuiz.description_hi || undefined,
        publishDate: editingQuiz.publishDate || new Date().toISOString().split('T')[0],
        publish_target: editingQuiz.publish_target || 'both',
        timeLimitMins: Number(editingQuiz.timeLimitMins || 10),
        totalQuestions: Number(editingQuiz.totalQuestions || 10),
        difficulty: editingQuiz.difficulty || 'MEDIUM',
        category: editingQuiz.category || 'Daily Practice',
        attemptsCount: editingQuiz.attemptsCount || 0,
        passingScore: Number(editingQuiz.passingScore || 40),
        isFree: true,
        setMode: editingQuiz.setMode || 'single',
        defaultSet: editingQuiz.defaultSet || 'SET-A',
        availableSets: editingQuiz.availableSets || ['SET-A', 'SET-B', 'SET-C', 'SET-D']
      };

      await db.saveDailyQuiz(newQuiz);
      await loadQuizzes();
      setSelectedQuizId(newQuiz.id);
      setIsQuizModalOpen(false);
      alert('Daily Practice Quiz saved successfully!');
    } catch (err) {
      console.error('Error saving quiz:', err);
      alert('Failed saving quiz.');
    } finally {
      setSavingQuiz(false);
    }
  };

  // Delete Daily Quiz
  const handleDeleteQuiz = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Daily Quiz and its questions?')) return;
    try {
      await db.deleteDailyQuiz(id);
      if (selectedQuizId === id) {
        setSelectedQuizId(null);
        setQuestions([]);
      }
      await loadQuizzes();
    } catch (err) {
      console.error('Error deleting quiz:', err);
    }
  };

  // Duplicate Daily Quiz
  const handleDuplicateQuiz = async (quiz: DailyQuiz) => {
    try {
      const duplicateId = generateUniqueId('dq');
      const duplicateTitle = `${quiz.title} (Copy)`;
      const today = new Date().toISOString().split('T')[0];
      const dupQuiz: DailyQuiz = {
        ...quiz,
        id: duplicateId,
        title: duplicateTitle,
        publishDate: today,
        slug: generateDailyQuizSlug(duplicateTitle, today),
        attemptsCount: 0
      };

      await db.saveDailyQuiz(dupQuiz);

      // Copy questions as well
      const origData = await db.startDailyQuiz(quiz.id);
      if (origData && origData.questions && origData.questions.length > 0) {
        const clonedQs = origData.questions.map((q: Question, idx: number) => ({
          ...q,
          id: generateUniqueId(`q-${duplicateId}-${idx + 1}`)
        }));
        await (db as any).saveDailyQuizQuestionsBulk(duplicateId, clonedQs);
      }

      await loadQuizzes();
      setSelectedQuizId(duplicateId);
      alert('Daily Quiz duplicated successfully with all questions!');
    } catch (err) {
      console.error('Error duplicating quiz:', err);
      alert('Failed duplicating quiz.');
    }
  };

  // Open Question Modal
  const handleOpenAddQuestion = () => {
    setEditingQ({ ...BLANK_QUESTION });
    setHasOptionE(false);
    setQModalLangTab('en');
    setPreviewMarkdown(false);
    setIsQModalOpen(true);
  };

  const handleOpenEditQuestion = (q: Question) => {
    setEditingQ({ ...q });
    setHasOptionE(Boolean(q.optionE || q.optionEHi));
    setQModalLangTab('en');
    setPreviewMarkdown(false);
    setIsQModalOpen(true);
  };

  // Save Single Question
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuizId) return;
    setSavingQ(true);

    try {
      const newQ: Question = {
        id: editingQ.id || generateUniqueId(`q-${selectedQuizId}`),
        questionText: editingQ.questionText || '',
        questionTextHi: editingQ.questionTextHi || undefined,
        optionA: editingQ.optionA || '',
        optionAHi: editingQ.optionAHi || undefined,
        optionB: editingQ.optionB || '',
        optionBHi: editingQ.optionBHi || undefined,
        optionC: editingQ.optionC || '',
        optionCHi: editingQ.optionCHi || undefined,
        optionD: editingQ.optionD || '',
        optionDHi: editingQ.optionDHi || undefined,
        optionE: hasOptionE ? (editingQ.optionE || undefined) : undefined,
        optionEHi: hasOptionE ? (editingQ.optionEHi || undefined) : undefined,
        correctAnswer: editingQ.correctAnswer || 'A',
        explanation: editingQ.explanation || '',
        explanationHi: editingQ.explanationHi || undefined,
        questionImageUrl: editingQ.questionImageUrl || undefined,
        marks: Number(editingQ.marks || 1.0),
        negativeMarks: Number(editingQ.negativeMarks || 0.33)
      };

      await db.saveDailyQuizQuestion(selectedQuizId, newQ);
      await handleSelectQuizForQuestions(selectedQuizId);
      setIsQModalOpen(false);
    } catch (err) {
      console.error('Error saving question:', err);
      alert('Failed saving question.');
    } finally {
      setSavingQ(false);
    }
  };

  // Delete Question
  const handleDeleteQuestion = async (qId: string) => {
    if (!selectedQuizId) return;
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await db.deleteDailyQuizQuestion(selectedQuizId, qId);
      await handleSelectQuizForQuestions(selectedQuizId);
    } catch (err) {
      console.error('Error deleting question:', err);
    }
  };

  // Duplicate Question
  const handleDuplicateQuestion = async (q: Question) => {
    if (!selectedQuizId) return;
    try {
      const cloned: Question = {
        ...q,
        id: generateUniqueId(`q-${selectedQuizId}`),
        questionText: `${q.questionText} (Copy)`
      };
      await db.saveDailyQuizQuestion(selectedQuizId, cloned);
      await handleSelectQuizForQuestions(selectedQuizId);
    } catch (err) {
      console.error('Error duplicating question:', err);
    }
  };

  // Quick 1-Click Update Correct Answer from Card
  const handleQuickSetCorrectAnswer = async (q: Question, newCorrectKey: string) => {
    if (!selectedQuizId) return;
    const updatedQ = { ...q, correctAnswer: newCorrectKey };
    // Optimistic UI update
    setQuestions(prev => prev.map(item => item.id === q.id ? updatedQ : item));
    try {
      await db.saveDailyQuizQuestion(selectedQuizId, updatedQ);
    } catch (err) {
      console.error('Failed quick saving correct answer:', err);
      await handleSelectQuizForQuestions(selectedQuizId);
    }
  };

  // Move Question Up / Down
  const handleMoveQuestion = async (idx: number, direction: 'up' | 'down') => {
    if (!selectedQuizId) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= questions.length) return;

    const nextList = [...questions];
    const temp = nextList[idx];
    nextList[idx] = nextList[targetIdx];
    nextList[targetIdx] = temp;

    setQuestions(nextList);
    try {
      await (db as any).saveDailyQuizQuestionsBulk(selectedQuizId, nextList);
    } catch (e) {
      console.error('Error updating order:', e);
    }
  };

  // ── Universal Bulk Text Parser (Test Series Standard) ────────────────────
  const handleParseBulkText = () => {
    const raw = bulkRawText.trim();
    if (!raw) {
      alert('Please paste question text or JSON/CSV content first.');
      return;
    }

    const parsed: Question[] = [];

    // 1. Try parsing JSON format
    if (raw.startsWith('[') || raw.startsWith('{')) {
      try {
        const jsonData = JSON.parse(raw);
        const list = Array.isArray(jsonData) ? jsonData : [jsonData];
        for (const item of list) {
          if (item.questionText || item.question) {
            const repaired = sanitizeAndRepairQuestion({
              id: `q-bulk-${Date.now()}-${parsed.length + 1}`,
              questionText: item.questionText || item.question,
              optionA: item.optionA || item.a || '',
              optionB: item.optionB || item.b || '',
              optionC: item.optionC || item.c || '',
              optionD: item.optionD || item.d || '',
              optionE: item.optionE || item.e || '',
              questionTextHi: item.questionTextHi || item.questionHi || undefined,
              optionAHi: item.optionAHi || undefined,
              optionBHi: item.optionBHi || undefined,
              optionCHi: item.optionCHi || undefined,
              optionDHi: item.optionDHi || undefined,
              optionEHi: item.optionEHi || undefined,
              explanationHi: item.explanationHi || undefined,
              correctAnswer: (item.correctAnswer || item.answer || 'A').toString().toUpperCase().trim().charAt(0),
              explanation: item.explanation || item.solution || 'Refer to official syllabus notes.',
              questionImageUrl: item.questionImageUrl || item.imageUrl || undefined,
              marks: Number(item.marks || bulkDefaultMarks),
              negativeMarks: Number(item.negativeMarks || bulkDefaultNegMarks)
            });
            if (repaired) parsed.push(repaired as Question);
          }
        }
        if (parsed.length > 0) {
          setParsedBulkQuestions(parsed);
          return;
        }
      } catch {
        // Not JSON formatted
      }
    }

    // 2. Try parsing CSV format
    if (raw.includes(',') && (raw.toLowerCase().includes('option') || raw.toLowerCase().includes('question'))) {
      const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (i === 0 && line.toLowerCase().includes('question')) continue;
        const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
        if (cols.length >= 5) {
          const repaired = sanitizeAndRepairQuestion({
            id: `q-bulk-${Date.now()}-${parsed.length + 1}`,
            questionText: cols[0],
            optionA: cols[1] || '',
            optionB: cols[2] || '',
            optionC: cols[3] || '',
            optionD: cols[4] || '',
            optionE: cols[5] && cols.length > 6 ? cols[5] : '',
            correctAnswer: (cols.length > 6 ? cols[6] : cols[5] || 'A').toUpperCase().trim().charAt(0),
            explanation: (cols.length > 6 ? cols[7] : cols[6]) || 'Refer to official syllabus notes.',
            marks: bulkDefaultMarks,
            negativeMarks: bulkDefaultNegMarks
          });
          if (repaired) parsed.push(repaired as Question);
        }
      }
      if (parsed.length > 0) {
        setParsedBulkQuestions(parsed);
        return;
      }
    }

    // 3. Robust Regex Parser for Text Feeds (Standard Mock Exam format)
    const blocks = raw.split(/(?=\n\s*(?:Q\.?\s*\d+|\d+[\.\)])\s+)/i).filter(b => b.trim().length > 10);

    for (const block of blocks) {
      // Check multi-option match (a)... (b)... (c)... (d)... [e]...
      const multiOptMatch = block.match(/(?:^|\n|\s*)(?:\(([a-dA-D1-4क-घ])\)|([a-dA-D1-4क-घ])[\)\.\:\t]+)\s*([\s\S]+?)\s*(?:\(([b-eB-E2-5ख-ङ])\)|([b-eB-E2-5ख-ङ])[\)\.\:\t]+)\s*([\s\S]+?)\s*(?:\(([cC3ग])\)|([cC3ग])[\)\.\:\t]+)\s*([\s\S]+?)\s*(?:\(([dD4घ])\)|([dD4घ])[\)\.\:\t]+)\s*([\s\S]+?)(?=\s*(?:\([eE5ङ]\)|[eE5ङ][\)\.\:\t]+|Ans|Answer|Explanation|Sol|Solution|$))/i);

      let qText = '';
      let optA = '', optB = '', optC = '', optD = '', optE = '';

      if (multiOptMatch) {
        if (multiOptMatch.index !== undefined && multiOptMatch.index > 0) {
          qText = block.substring(0, multiOptMatch.index).trim();
        } else {
          qText = block.replace(multiOptMatch[0], '').trim();
        }

        optA = multiOptMatch[3]?.trim() || '';
        optB = multiOptMatch[6]?.trim() || '';
        optC = multiOptMatch[9]?.trim() || '';
        const restD = multiOptMatch[12]?.trim() || '';

        const optEMatch = /(?:\(([eE5ङ])\)|[eE5ङ][\)\.\:\t]+)\s*([\s\S]+?)$/i.exec(restD);
        if (optEMatch) {
          optE = optEMatch[2].trim().replace(/\s*(?:Ans|Answer|Explanation|Sol|Solution).*$/i, '');
          optD = restD.substring(0, optEMatch.index).trim();
        } else {
          optD = restD.replace(/\s*(?:Ans|Answer|Explanation|Sol|Solution).*$/i, '');
        }
      } else {
        const qMatch = block.match(/^(?:Q\.?\s*\d+[\.\:\)]?|\d+[\.\:\)])?\s*([\s\S]+?)(?=\s*(?:\([A-Da-d1-4]\)|[\(\[]?[A-Da-d1-4][\)\.\:\s]))/i);
        const optAMatch = block.match(/[\(\[]?(?:A|a|1)[\)\.\:\s]+([\s\S]+?)(?=\s*[\(\[]?(?:B|b|2)[\)\.\:\s]|$)/i);
        const optBMatch = block.match(/[\(\[]?(?:B|b|2)[\)\.\:\s]+([\s\S]+?)(?=\s*[\(\[]?(?:C|c|3)[\)\.\:\s]|$)/i);
        const optCMatch = block.match(/[\(\[]?(?:C|c|3)[\)\.\:\s]+([\s\S]+?)(?=\s*[\(\[]?(?:D|d|4)[\)\.\:\s]|$)/i);
        const optDMatch = block.match(/[\(\[]?(?:D|d|4)[\)\.\:\s]+([\s\S]+?)(?=\s*(?:\([Ee5]\)|[Ee5][\)\.\:\s]|Ans|Answer|Correct|Explanation|Sol|Solution|----------|\n\s*\d+\.)[\:\s]|$)/i);
        const optEMatch = block.match(/[\(\[]?(?:E|e|5)[\)\.\:\s]+([\s\S]+?)(?=\s*(?:Ans|Answer|Correct|Explanation|Sol|Solution|----------|\n\s*\d+\.)[\:\s]|$)/i);

        if (qMatch) qText = qMatch[1].trim();
        if (optAMatch) optA = optAMatch[1].trim();
        if (optBMatch) optB = optBMatch[1].trim();
        if (optCMatch) optC = optCMatch[1].trim();
        if (optDMatch) optD = optDMatch[1].trim();
        if (optEMatch) optE = optEMatch[1].trim();
      }

      if (!qText) qText = block.trim();

      // Extract Answer and Explanation
      const ansMatch = block.match(/(?:Ans|Answer|Correct|Option)[\:\s\-]*[\(\[]?([A-Ea-e1-5])[\)\]]?/i);
      const expMatch = block.match(/(?:Explanation|Sol|Solution|व्याख्या)[\:\s]+([\s\S]+)$/i);

      let ansLetter = 'A';
      if (ansMatch) {
        const val = ansMatch[1].toUpperCase();
        if (val === '1') ansLetter = 'A';
        else if (val === '2') ansLetter = 'B';
        else if (val === '3') ansLetter = 'C';
        else if (val === '4') ansLetter = 'D';
        else if (val === '5') ansLetter = 'E';
        else ansLetter = val;
      }

      // Helper function to split bilingual text into { en, hi }
      const splitBilingualText = (rawStr: string): { en: string; hi?: string } => {
        if (!rawStr) return { en: '' };
        const trimmed = rawStr.trim();
        const hasHindi = /[\u0900-\u097F]/.test(trimmed);
        if (!hasHindi) return { en: trimmed };

        // Case 1: Split by " / " or " // "
        if (trimmed.includes(' / ') || trimmed.includes(' // ') || trimmed.includes(' | ')) {
          const parts = trimmed.split(/\s*(?:\/{1,2}|\|)\s*/);
          if (parts.length >= 2) {
            const hiPart = parts.find(p => /[\u0900-\u097F]/.test(p));
            const enPart = parts.find(p => !/[\u0900-\u097F]/.test(p) && /[a-zA-Z0-9]/.test(p));
            if (hiPart && enPart) {
              return { en: enPart.trim(), hi: hiPart.trim() };
            }
          }
        }

        // Case 2: Parenthetical Hindi or English: "Agra Gharana (आगरा घराना)"
        const parenMatch = trimmed.match(/^([^\(\)]+?)\s*[\(（]([\u0900-\u097F\s\-]+)[\)）]$/);
        if (parenMatch && /[a-zA-Z]/.test(parenMatch[1])) {
          return { en: parenMatch[1].trim(), hi: parenMatch[2].trim() };
        }

        // Case 3: Line-separated bilingual (English line followed by Hindi line)
        const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length === 2) {
          if (!/[\u0900-\u097F]/.test(lines[0]) && /[\u0900-\u097F]/.test(lines[1])) {
            return { en: lines[0], hi: lines[1] };
          }
        }

        return { en: trimmed };
      };

      const qSplit = splitBilingualText(qText.replace(/^(?:Q\.?\s*\d+[\.\:\)]?|\d+[\.\:\)])\s*/i, '').trim());
      const optASplit = splitBilingualText(optA);
      const optBSplit = splitBilingualText(optB);
      const optCSplit = splitBilingualText(optC);
      const optDSplit = splitBilingualText(optD);
      const optESplit = optE ? splitBilingualText(optE) : undefined;

      let expEn = expMatch ? expMatch[1].trim() : 'Refer to official syllabus notes.';
      let expHi: string | undefined = undefined;
      if (expEn) {
        const expSplit = splitBilingualText(expEn);
        if (expSplit.hi) {
          expEn = expSplit.en;
          expHi = expSplit.hi;
        }
      }

      if (qText) {
        const repaired = sanitizeAndRepairQuestion({
          id: `q-bulk-${Date.now()}-${parsed.length + 1}`,
          questionText: qSplit.en || qText,
          questionTextHi: qSplit.hi,
          optionA: optASplit.en || optA,
          optionAHi: optASplit.hi,
          optionB: optBSplit.en || optB,
          optionBHi: optBSplit.hi,
          optionC: optCSplit.en || optC,
          optionCHi: optCSplit.hi,
          optionD: optDSplit.en || optD,
          optionDHi: optDSplit.hi,
          optionE: optESplit ? (optESplit.en || optE) : undefined,
          optionEHi: optESplit?.hi,
          correctAnswer: ansLetter,
          explanation: expEn,
          explanationHi: expHi,
          marks: bulkDefaultMarks,
          negativeMarks: bulkDefaultNegMarks
        });
        if (repaired) parsed.push(repaired as Question);
      }
    }

    if (parsed.length === 0) {
      alert('Could not detect standard MCQs. Please ensure format starts with numbers like 1., followed by (A), (B), (C), (D), Ans: A.');
    } else {
      setParsedBulkQuestions(parsed);
    }
  };

  // Commit Parsed Bulk Questions to Quiz
  const handleCommitBulkImport = async () => {
    const toImport = parsedBulkQuestions.length > 0
      ? parsedBulkQuestions
      : (bilingualReport?.questionsPreview || []).map((q: any, idx: number) => ({
          id: generateUniqueId(`q-bulk-${idx + 1}`),
          questionText: q.questionText || '',
          questionTextHi: q.questionTextHi || undefined,
          optionA: stripOptionPrefix(q.optionA || ''),
          optionAHi: q.optionAHi ? stripOptionPrefix(q.optionAHi) : undefined,
          optionB: stripOptionPrefix(q.optionB || ''),
          optionBHi: q.optionBHi ? stripOptionPrefix(q.optionBHi) : undefined,
          optionC: stripOptionPrefix(q.optionC || ''),
          optionCHi: q.optionCHi ? stripOptionPrefix(q.optionCHi) : undefined,
          optionD: stripOptionPrefix(q.optionD || ''),
          optionDHi: q.optionDHi ? stripOptionPrefix(q.optionDHi) : undefined,
          optionE: q.optionE ? stripOptionPrefix(q.optionE) : undefined,
          optionEHi: q.optionEHi ? stripOptionPrefix(q.optionEHi) : undefined,
          correctAnswer: q.correctAnswer || 'A',
          explanation: q.explanation || 'Refer to official syllabus notes.',
          explanationHi: q.explanationHi || undefined,
          marks: bulkDefaultMarks,
          negativeMarks: bulkDefaultNegMarks
        }));

    if (!selectedQuizId || toImport.length === 0) return;
    setImportingBulk(true);

    try {
      await (db as any).saveDailyQuizQuestionsBulk(selectedQuizId, toImport);
      await handleSelectQuizForQuestions(selectedQuizId);
      setIsBulkModalOpen(false);
      setParsedBulkQuestions([]);
      setBilingualReport(null);
      setBulkRawText('');
      alert(`Successfully imported ${toImport.length} questions into this Daily Quiz!`);
    } catch (err) {
      console.error('Error importing bulk questions:', err);
      alert('Failed importing questions.');
    } finally {
      setImportingBulk(false);
    }
  };

  // Copy Answer Key to Clipboard
  const handleCopyAnswerKey = () => {
    const listToCopy = activeSetQuestions.length ? activeSetQuestions : questions;
    if (!listToCopy.length) return;
    const summaryText = `Final Attempt Daily Quiz Answer Key [${selectedSetCode}]\nQuiz: ${currentSelectedQuiz?.title || 'Daily Quiz'}\n` +
      listToCopy
        .map((q: Question, idx: number) => `Q${idx + 1}: ${(q as any).mappedCorrectKey || q.correctAnswer} (Marks: +${q.marks || 1}, -${q.negativeMarks || 0.33}) - ${q.explanation || 'No explanation'}`)
        .join('\n');
    navigator.clipboard.writeText(summaryText);
    setCopiedKeyToast(true);
    setTimeout(() => setCopiedKeyToast(false), 2500);
  };

  return (
    <div className="space-y-8">
      
      {/* ── CMS Top Control Banner ────────────────────────────────────────── */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 sm:p-8 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-black uppercase tracking-wider mb-2">
            <Flame className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Admin Daily Quiz Control Center</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-[var(--text-color)]">
            Daily Practice Quiz CMS
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Full test-series caliber question management: Bilingual Hindi & English support, BPSC Option E, universal bulk question parser, diagram attachments, and instant publishing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/daily-quiz"
            target="_blank"
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[var(--text-color)] font-bold rounded-xl text-xs flex items-center gap-2 border border-[var(--card-border)] transition-all cursor-pointer"
          >
            <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Preview Student Portal</span>
          </Link>

          <button
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              const defaultTitle = 'Daily Practice: Current Affairs & Bihar GS';
              setEditingQuiz({
                ...BLANK_DAILY_QUIZ,
                publishDate: today,
                slug: generateDailyQuizSlug(defaultTitle, today)
              });
              setIsSlugManuallyEdited(false);
              setQuizModalLangTab('en');
              setIsQuizModalOpen(true);
            }}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create New Quiz</span>
          </button>
        </div>
      </div>

      {/* ── Grid: Quiz Sets List (Left) & Question Manager (Right) ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Daily Sets Selector & Search (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-500" />
              <h3 className="font-heading font-bold text-sm text-[var(--text-color)]">
                Daily Quiz Sets ({quizzes.length})
              </h3>
            </div>
            <button
              onClick={loadQuizzes}
              className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg hover:text-[var(--text-color)] transition-all"
              title="Refresh Quizzes"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search Quizzes */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, date, or category..."
              value={searchQuizQuery}
              onChange={e => setSearchQuizQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-xs text-[var(--text-color)] outline-none focus:border-amber-500"
            />
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-28 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredQuizzes.length === 0 ? (
            <div className="p-8 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="text-xs font-bold text-slate-500">No matching Daily Quizzes found</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
              {filteredQuizzes.map((q) => {
                const isSelected = selectedQuizId === q.id;
                return (
                  <div
                    key={q.id}
                    className={`bg-[var(--card-bg)] border rounded-2xl p-4 transition-all space-y-2.5 cursor-pointer select-none ${
                      isSelected
                        ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                        : 'border-[var(--card-border)] hover:border-amber-500/40'
                    }`}
                    onClick={() => handleSelectQuizForQuestions(q.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md">
                          {new Date(q.publishDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                        {q.title_hi ? (
                          <span className="text-[9px] font-black px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-md">
                            🌐 Bilingual
                          </span>
                        ) : (
                          <span className="text-[9px] font-black px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 rounded-md">
                            EN
                          </span>
                        )}
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded">
                          {q.difficulty}
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-400 font-mono">
                        {q.totalQuestions || 10} Qs
                      </span>
                    </div>

                    <h4 className="font-heading font-bold text-xs text-[var(--text-color)] line-clamp-2">
                      {q.title}
                    </h4>

                    {q.category && (
                      <span className="inline-block text-[9px] font-extrabold uppercase text-amber-500 tracking-wider">
                        {q.category}
                      </span>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-400 border-t border-[var(--card-border)] pt-2" onClick={e => e.stopPropagation()}>
                      <span className="text-[10px] text-slate-400">{q.timeLimitMins || 10} mins limit</span>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            const origin = typeof window !== 'undefined' ? window.location.origin : 'https://finalattemptias.com';
                            const url = `${origin}/daily-quiz/${q.slug || q.id}`;
                            navigator.clipboard.writeText(url);
                            setCopiedLinkQuizId(q.id);
                            setTimeout(() => setCopiedLinkQuizId(null), 2500);
                          }}
                          className={`p-1 transition-colors ${copiedLinkQuizId === q.id ? 'text-emerald-500 font-bold' : 'hover:text-amber-500'}`}
                          title="Copy Shareable Link"
                        >
                          {copiedLinkQuizId === q.id ? (
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          ) : (
                            <Share2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDuplicateQuiz(q)}
                          className="p-1 hover:text-amber-500 transition-colors"
                          title="Duplicate Quiz"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingQuiz(q);
                            setIsSlugManuallyEdited(Boolean(q.slug));
                            setQuizModalLangTab('en');
                            setIsQuizModalOpen(true);
                          }}
                          className="p-1 hover:text-amber-500 transition-colors"
                          title="Edit Quiz Settings"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuiz(q.id)}
                          className="p-1 hover:text-red-500 transition-colors"
                          title="Delete Quiz"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Full Question Manager & Bank for Selected Quiz (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedQuizId && currentSelectedQuiz ? (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-md">
              
              {/* Selected Quiz Header with High-Impact Stats */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--card-border)] pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">
                      Selected Quiz
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      ID: {currentSelectedQuiz.id}
                    </span>
                  </div>
                  <h3 className="text-xl font-heading font-black text-[var(--text-color)] mt-1">
                    {currentSelectedQuiz.title}
                  </h3>
                  {currentSelectedQuiz.title_hi && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
                      {currentSelectedQuiz.title_hi}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2">
                    <span>📅 {currentSelectedQuiz.publishDate}</span>
                    <span>⏱️ {currentSelectedQuiz.timeLimitMins || 10} Mins</span>
                    <span>🎯 Passing: {currentSelectedQuiz.passingScore || 40}%</span>
                    <span>📚 {questions.length} Questions</span>
                  </div>

                  {/* Shareable Public Quiz Link Banner */}
                  <div className="mt-3 p-2.5 sm:p-3 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/25 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 max-w-2xl">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1 border border-amber-500/30">
                        <Link2 className="w-3 h-3" />
                        <span>Share URL</span>
                      </span>
                      <span className="text-xs font-mono text-slate-700 dark:text-slate-200 font-bold truncate select-all">
                        {typeof window !== 'undefined' ? `${window.location.origin}/daily-quiz/${currentSelectedQuiz.slug || currentSelectedQuiz.id}` : `/daily-quiz/${currentSelectedQuiz.slug || currentSelectedQuiz.id}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          const origin = typeof window !== 'undefined' ? window.location.origin : 'https://finalattemptias.com';
                          const url = `${origin}/daily-quiz/${currentSelectedQuiz.slug || currentSelectedQuiz.id}`;
                          navigator.clipboard.writeText(url);
                          setCopiedLinkQuizId(currentSelectedQuiz.id);
                          setTimeout(() => setCopiedLinkQuizId(null), 2500);
                        }}
                        className={`px-3 py-1.5 font-black rounded-xl text-[11px] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                          copiedLinkQuizId === currentSelectedQuiz.id
                            ? 'bg-emerald-500 text-slate-950 font-black'
                            : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                        }`}
                        title="Copy direct link for students"
                      >
                        {copiedLinkQuizId === currentSelectedQuiz.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Link Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>

                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                          `🎯 Final Attempt Daily Quiz\n📚 ${currentSelectedQuiz.title}\n📅 Date: ${currentSelectedQuiz.publishDate}\n⏱️ ${currentSelectedQuiz.timeLimitMins || 10} Mins | ${questions.length || 10} Questions\n\nAttempt now & check your state leaderboard rank:\n${typeof window !== 'undefined' ? window.location.origin : 'https://finalattemptias.com'}/daily-quiz/${currentSelectedQuiz.slug || currentSelectedQuiz.id}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[11px] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                        title="Share directly into WhatsApp Groups & Channels"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>

                      <Link
                        href={`/daily-quiz/${currentSelectedQuiz.slug || currentSelectedQuiz.id}`}
                        target="_blank"
                        className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all"
                        title="Test & preview student portal in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Primary Quiz Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setParsedBulkQuestions([]);
                      setBulkRawText('');
                      setIsBulkModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-slate-900 text-amber-400 dark:bg-amber-400/10 dark:text-amber-300 font-bold border border-amber-500/30 rounded-xl text-xs uppercase tracking-wider shadow-sm hover:border-amber-500 transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Paste or import multi-question text blocks"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Bulk Import</span>
                  </button>

                  <button
                    onClick={() => setIsAnswerKeyModalOpen(true)}
                    className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[var(--text-color)] font-bold rounded-xl text-xs flex items-center gap-1.5 border border-[var(--card-border)] transition-all cursor-pointer"
                    title="View Answer Key and scoring rationale"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-500" />
                    <span>Answer Key</span>
                  </button>

                  <button
                    onClick={handleOpenAddQuestion}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Add Question</span>
                  </button>
                </div>
              </div>

              {/* SET Paper Variant Selector Bar (Test Series Standard) */}
              {currentSelectedQuiz?.setMode === 'multi' && (
                <div className="p-3 bg-gradient-to-r from-amber-500/10 via-slate-100 dark:via-slate-900 to-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-amber-500 text-slate-950 font-black text-[10px] rounded-lg uppercase tracking-wider">
                      Multi-SET Paper
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Active Variant Inspection:
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-white dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner">
                    {(currentSelectedQuiz.availableSets || ['SET-A', 'SET-B', 'SET-C', 'SET-D']).map((setCode) => {
                      const isSelected = selectedSetCode === setCode;
                      return (
                        <button
                          key={setCode}
                          type="button"
                          onClick={() => setSelectedSetCode(setCode as any)}
                          className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 shadow-xs scale-105'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                          }`}
                        >
                          {setCode}
                          {currentSelectedQuiz.defaultSet === setCode && (
                            <span className="ml-1 text-[9px] font-black opacity-80">(Default)</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <span className="text-[11px] text-slate-500 font-medium">
                    Shuffled viewing: Showing question order and answer keys for <strong>{selectedSetCode}</strong>
                  </span>
                </div>
              )}

              {/* Filter Questions in Bank & View Layout Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search questions in this quiz..."
                    value={searchQuestionQuery}
                    onChange={e => setSearchQuestionQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500 shadow-xs placeholder:text-slate-400"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* View Layout Toggle: Table vs Cards */}
                  <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setQuestionViewLayout('table')}
                      className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
                        questionViewLayout === 'table'
                          ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title="Spreadsheet Table View"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Table</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuestionViewLayout('cards')}
                      className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
                        questionViewLayout === 'cards'
                          ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title="Expanded Card View"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Cards</span>
                    </button>
                  </div>

                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    Total Marks: {questions.reduce((acc, q) => acc + (q.marks || 1), 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Questions List (Cards or Table) */}
              {loadingQuestions ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : questions.length === 0 ? (
                <div className="p-12 text-center space-y-4 border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 shadow-xs">
                  <HelpCircle className="w-12 h-12 text-amber-500/80 mx-auto" />
                  <div>
                    <h4 className="font-heading font-black text-base text-slate-900 dark:text-white">
                      No Questions Added Yet
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Use &quot;Bulk Import&quot; to paste entire sets of questions with options and explanations at once, or click &quot;Add Question&quot; to build them manually.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        setBulkRawText(SAMPLE_BULK_TEXT);
                        setIsBulkModalOpen(true);
                      }}
                      className="px-4 py-2 bg-amber-50 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-slate-700 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Try Sample Questions
                    </button>
                    <button
                      onClick={handleOpenAddQuestion}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl transition-all cursor-pointer shadow-xs"
                    >
                      Add First Question
                    </button>
                  </div>
                </div>
              ) : questionViewLayout === 'table' ? (
                /* ── SPREADSHEET TABLE VIEW (TEST SERIES STANDARD) ──────────────── */
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                          <th className="py-3 px-3 w-12 text-center">#</th>
                          <th className="py-3 px-4 min-w-[240px]">Question Prompt (EN / HI)</th>
                          <th className="py-3 px-3 w-16 text-center">Key</th>
                          <th className="py-3 px-4 min-w-[280px]">Options (A - E)</th>
                          <th className="py-3 px-3 w-20 text-center">Marks</th>
                          <th className="py-3 px-3 w-28 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                        {filteredQuestions.map((q, idx) => {
                          const originalIndex = questions.findIndex(orig => orig.id === q.id);
                          const correctKey = String((q as any).mappedCorrectKey || q.correctAnswer || 'A').toUpperCase();
                          return (
                            <tr
                              key={q.id || idx}
                              className="hover:bg-amber-50/30 dark:hover:bg-slate-800/40 transition-colors"
                            >
                              {/* Serial Index */}
                              <td className="py-3 px-3 text-center align-top font-black text-amber-600 dark:text-amber-400">
                                {originalIndex + 1}
                              </td>

                              {/* Question Prompt */}
                              <td className="py-3 px-4 align-top space-y-1">
                                <p className="font-bold text-slate-900 dark:text-blue-100 leading-snug line-clamp-3">
                                  {q.questionText}
                                </p>
                                {q.questionTextHi && q.questionTextHi !== q.questionText && (
                                  <p className="text-[11px] text-blue-950 dark:text-sky-300 font-medium leading-snug line-clamp-2">
                                    {q.questionTextHi}
                                  </p>
                                )}
                                {(q.explanation || q.explanationHi) && (
                                  <span className="inline-block text-[10px] text-slate-500 dark:text-slate-400 font-medium italic mt-1 line-clamp-1">
                                    💡 {q.explanation || q.explanationHi}
                                  </span>
                                )}
                              </td>

                              {/* Correct Key */}
                              <td className="py-3 px-3 text-center align-top">
                                <span className="inline-flex w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs items-center justify-center shadow-xs">
                                  {correctKey}
                                </span>
                              </td>

                              {/* Options */}
                              <td className="py-3 px-4 align-top space-y-1">
                                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                                  <div className={correctKey === 'A' ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-300'}>
                                    <span className="font-black text-blue-950 dark:text-sky-300">A.</span> {stripOptionPrefix(q.optionA || '')}
                                  </div>
                                  <div className={correctKey === 'B' ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-300'}>
                                    <span className="font-black text-blue-950 dark:text-sky-300">B.</span> {stripOptionPrefix(q.optionB || '')}
                                  </div>
                                  <div className={correctKey === 'C' ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-300'}>
                                    <span className="font-black text-blue-950 dark:text-sky-300">C.</span> {stripOptionPrefix(q.optionC || '')}
                                  </div>
                                  <div className={correctKey === 'D' ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-300'}>
                                    <span className="font-black text-blue-950 dark:text-sky-300">D.</span> {stripOptionPrefix(q.optionD || '')}
                                  </div>
                                  {q.optionE && (
                                    <div className={`col-span-2 ${correctKey === 'E' ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-indigo-900 dark:text-indigo-300 font-semibold'}`}>
                                      <span className="font-black text-blue-950 dark:text-sky-300">E.</span> {stripOptionPrefix(q.optionE || '')}
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* Marks Scheme */}
                              <td className="py-3 px-3 text-center align-top">
                                <div className="inline-flex flex-col text-[10px] font-bold">
                                  <span className="text-emerald-600 dark:text-emerald-400">+{q.marks || 1.0}</span>
                                  <span className="text-red-500">-{q.negativeMarks || 0.33}</span>
                                </div>
                              </td>

                              {/* Row Actions */}
                              <td className="py-3 px-3 text-center align-top">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => handleMoveQuestion(originalIndex, 'up')}
                                    disabled={originalIndex === 0}
                                    className="p-1 rounded-lg text-slate-400 hover:text-amber-500 disabled:opacity-20 cursor-pointer"
                                    title="Move Up"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleMoveQuestion(originalIndex, 'down')}
                                    disabled={originalIndex === questions.length - 1}
                                    className="p-1 rounded-lg text-slate-400 hover:text-amber-500 disabled:opacity-20 cursor-pointer"
                                    title="Move Down"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenEditQuestion(q)}
                                    className="p-1 rounded-lg text-amber-500 hover:bg-amber-500/10 cursor-pointer"
                                    title="Edit Question"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteQuestion(q.id)}
                                    className="p-1 rounded-lg text-red-500 hover:bg-red-500/10 cursor-pointer"
                                    title="Delete Question"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* ── EXPANDED CARD VIEW ─────────────────────────────────────────── */
                <div className="space-y-4">
                  {filteredQuestions.map((q, idx) => {
                    const originalIndex = questions.findIndex(orig => orig.id === q.id);
                    return (
                      <div
                        key={q.id || idx}
                        className="p-5 border border-slate-200/90 dark:border-slate-800 rounded-2xl space-y-4 bg-white dark:bg-slate-900/90 hover:border-amber-500/50 transition-all shadow-sm"
                      >
                        {/* Question Meta Bar */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 px-2.5 py-1 rounded-lg">
                              Question {originalIndex + 1}
                            </span>
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md">
                              +{q.marks || 1.0} / -{q.negativeMarks || 0.33}
                            </span>
                            {q.questionTextHi && (
                              <span className="text-[9px] font-black px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 rounded-md">
                                Bilingual
                              </span>
                            )}
                            {q.optionE && (
                              <span className="text-[9px] font-black px-2 py-0.5 bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/30 rounded-md">
                                Option E (BPSC)
                              </span>
                            )}
                          </div>

                          {/* Quick Ordering & Actions */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleMoveQuestion(originalIndex, 'up')}
                              disabled={originalIndex === 0}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-amber-600 disabled:opacity-30 cursor-pointer shadow-2xs"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveQuestion(originalIndex, 'down')}
                              disabled={originalIndex === questions.length - 1}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-amber-600 disabled:opacity-30 cursor-pointer shadow-2xs"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDuplicateQuestion(q)}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-amber-600 cursor-pointer shadow-2xs"
                              title="Duplicate Question"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditQuestion(q)}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-amber-600 cursor-pointer shadow-2xs"
                              title="Edit Question"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-red-600 cursor-pointer shadow-2xs"
                              title="Delete Question"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Optional Question Diagram Image */}
                        {(q.questionImageUrl || q.imageUrl) && (
                          <div className="max-w-xs rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                            <img
                              src={q.questionImageUrl || q.imageUrl}
                              alt="Question Diagram"
                              className="w-full h-auto object-cover max-h-48"
                            />
                          </div>
                        )}

                        {/* Rendered Question Text */}
                        <div className="space-y-1.5">
                          {(() => {
                            const raw = q.questionText || '';
                            const { isHtml, formatted } = renderFormattedQuestionText(raw);
                            if (isHtml) {
                              return <div className="font-heading font-bold text-sm text-slate-900 dark:text-blue-100 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />;
                            }
                            return (
                              <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-blue-100 leading-relaxed">
                                {raw}
                              </h4>
                            );
                          })()}

                          {/* Only render Hindi question text if it's actually different from English */}
                          {q.questionTextHi && q.questionTextHi.trim() !== (q.questionText || '').trim() && (
                            <p className="text-xs text-blue-950 dark:text-sky-300 font-medium leading-relaxed">
                              {q.questionTextHi}
                            </p>
                          )}
                        </div>

                        {/* Options Display with 1-Click Interactive Answer Selector */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs pt-1">
                          {[
                            { key: 'A', text: q.optionA, textHi: q.optionAHi },
                            { key: 'B', text: q.optionB, textHi: q.optionBHi },
                            { key: 'C', text: q.optionC, textHi: q.optionCHi },
                            { key: 'D', text: q.optionD, textHi: q.optionDHi },
                            { key: 'E', text: q.optionE, textHi: q.optionEHi }
                          ].filter(opt => opt.text || opt.textHi).map(opt => {
                            const effectiveCorrectKey = String((q as any).mappedCorrectKey || q.correctAnswer || '').trim().toUpperCase();
                            const isCorrect = effectiveCorrectKey === opt.key.toUpperCase();
                            return (
                              <button
                                key={opt.key}
                                type="button"
                                onClick={() => {
                                  if (selectedSetCode !== 'SET-A' && currentSelectedQuiz?.setMode === 'multi') {
                                    alert('Answer key can be modified in SET-A (Master Key). Variants (B, C, D) are automatically mapped.');
                                    return;
                                  }
                                  handleQuickSetCorrectAnswer(q, opt.key);
                                }}
                                title={selectedSetCode === 'SET-A' ? `Click to set Option ${opt.key} as the correct answer` : `Mapped answer for ${selectedSetCode}`}
                                className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 transition-all text-left cursor-pointer ${
                                  isCorrect
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 text-emerald-950 dark:text-emerald-100 font-bold shadow-xs ring-1 ring-emerald-500/20'
                                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-blue-400 hover:bg-blue-50/20'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                                  <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 border ${
                                    isCorrect
                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                      : 'bg-blue-950 text-white border-blue-900 shadow-xs'
                                  }`}>
                                    {opt.key}
                                  </span>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-slate-900 dark:text-white font-medium leading-snug line-clamp-2">
                                      {opt.text || opt.textHi}
                                    </span>
                                    {opt.text && opt.textHi && opt.textHi.trim() !== opt.text.trim() && (
                                      <span className="text-[11px] text-blue-950 dark:text-sky-300 font-medium leading-snug line-clamp-2 mt-0.5">
                                        {opt.textHi}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {isCorrect ? (
                                  <span className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md border border-emerald-400 shrink-0">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                    <span>Correct {selectedSetCode !== 'SET-A' ? `(${selectedSetCode})` : ''}</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    Set Correct
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Explanation Rationale Box */}
                        {(q.explanation || q.explanationHi) && (
                          <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl text-xs space-y-1">
                            <span className="font-extrabold text-blue-950 dark:text-sky-300 text-[10px] uppercase tracking-wider">
                              Rationale / Solution:
                            </span>
                            {q.explanation && (
                              <p className="text-slate-900 dark:text-slate-200 leading-relaxed font-normal">{q.explanation}</p>
                            )}
                            {q.explanationHi && (
                              <p className="text-blue-950 dark:text-sky-300 font-medium leading-relaxed">{q.explanationHi}</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-16 text-center space-y-3">
              <Sparkles className="w-12 h-12 text-amber-500 mx-auto" />
              <h3 className="font-heading font-black text-lg text-[var(--text-color)]">
                Select a Daily Quiz
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Choose a daily practice set from the left panel to build questions, or click &quot;Create New Quiz&quot; above.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* ── MODAL 1: ADD / EDIT DAILY QUIZ METADATA ──────────────────────── */}
      {isQuizModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-lg w-full space-y-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-heading font-black text-slate-900 dark:text-white">
                  {editingQuiz.id ? 'Edit Daily Quiz Settings' : 'Create Daily Practice Quiz'}
                </h3>
                <p className="text-[11px] text-slate-500">Configure quiz metadata, schedule, and passing criteria</p>
              </div>
              <button onClick={() => setIsQuizModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Language Switcher Tabs */}
            <div className="flex items-center gap-2 p-1 bg-amber-50/70 dark:bg-slate-800 rounded-2xl border border-amber-200/50 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setQuizModalLangTab('en')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  quizModalLangTab === 'en'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-950'
                }`}
              >
                English Version
              </button>
              <button
                type="button"
                onClick={() => setQuizModalLangTab('hi')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  quizModalLangTab === 'hi'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-500 hover:text-[var(--text-color)]'
                }`}
              >
                Hindi Version (हिन्दी)
              </button>
            </div>

            <form onSubmit={handleSaveQuiz} className="space-y-4 text-xs">
              {quizModalLangTab === 'en' ? (
                <>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500">English Quiz Title *</label>
                    <input
                      type="text"
                      required
                      value={editingQuiz.title || ''}
                      onChange={e => {
                        const newTitle = e.target.value;
                        setEditingQuiz(prev => {
                          const datePart = prev.publishDate || new Date().toISOString().split('T')[0];
                          const newSlug = (!isSlugManuallyEdited || !prev.slug)
                            ? generateDailyQuizSlug(newTitle, datePart)
                            : prev.slug;
                          return {
                            ...prev,
                            title: newTitle,
                            slug: newSlug
                          };
                        });
                      }}
                      className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white focus:border-amber-500 shadow-2xs"
                    />
                  </div>

                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <span>URL Slug (Unique Link for Sharing)</span>
                        {!isSlugManuallyEdited ? (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">Auto Generated</span>
                        ) : (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">Custom</span>
                        )}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const auto = generateDailyQuizSlug(editingQuiz.title || '', editingQuiz.publishDate || '');
                          setEditingQuiz(prev => ({ ...prev, slug: auto }));
                          setIsSlugManuallyEdited(false);
                        }}
                        className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 flex items-center gap-1 cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded-lg transition-all"
                        title="Re-generate slug using current Title & Publish Date"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Auto-Generate from Title & Date</span>
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="e.g. daily-practice-current-affairs-bihar-gs-2026-10-18"
                      value={editingQuiz.slug || ''}
                      onChange={e => {
                        setIsSlugManuallyEdited(true);
                        setEditingQuiz(prev => ({
                          ...prev,
                          slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/--+/g, '-')
                        }));
                      }}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-900 dark:text-white focus:border-amber-500 font-mono text-xs shadow-inner"
                    />

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                      <span className="text-slate-400">Share Link:</span>
                      <span className="text-amber-600 dark:text-amber-400 truncate">
                        /daily-quiz/{editingQuiz.slug || generateDailyQuizSlug(editingQuiz.title || '', editingQuiz.publishDate || '')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 dark:text-slate-400">English Short Description</label>
                    <textarea
                      rows={3}
                      value={editingQuiz.description || ''}
                      onChange={e => setEditingQuiz(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white focus:border-amber-500 shadow-2xs"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="font-bold text-amber-600 dark:text-amber-400">Hindi Quiz Title (हिन्दी शीर्षक)</label>
                    <input
                      type="text"
                      placeholder="उदा. दैनिक समसामयिकी एवं बिहार सामान्य ज्ञान अभ्यास सेट..."
                      value={editingQuiz.title_hi || ''}
                      onChange={e => setEditingQuiz(prev => ({ ...prev, title_hi: e.target.value }))}
                      className="w-full p-3 bg-white dark:bg-slate-900 border border-amber-500/40 rounded-xl outline-none text-slate-900 dark:text-white focus:border-amber-500 shadow-2xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-amber-600 dark:text-amber-400">Hindi Short Description (हिन्दी विवरण)</label>
                    <textarea
                      rows={3}
                      placeholder="राष्ट्रीय व बिहार करंट अफेयर्स, राजव्यवस्था, और बिहार विशेष सामान्य ज्ञान के 10 प्रश्न..."
                      value={editingQuiz.description_hi || ''}
                      onChange={e => setEditingQuiz(prev => ({ ...prev, description_hi: e.target.value }))}
                      className="w-full p-3 bg-white dark:bg-slate-900 border border-amber-500/40 rounded-xl outline-none text-slate-900 dark:text-white focus:border-amber-500 shadow-2xs"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Subject / Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Current Affairs, Bihar Special"
                    value={editingQuiz.category || 'Daily Practice'}
                    onChange={e => setEditingQuiz(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Publish Target</label>
                  <select
                    value={editingQuiz.publish_target || 'both'}
                    onChange={e => setEditingQuiz(prev => ({ ...prev, publish_target: e.target.value }))}
                    className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white font-bold cursor-pointer shadow-2xs"
                  >
                    <option value="both">🌐 Both EN & HI</option>
                    <option value="english">English Only</option>
                    <option value="hindi">Hindi Only</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Publish Date</label>
                  <input
                    type="date"
                    required
                    value={editingQuiz.publishDate || ''}
                    onChange={e => {
                      const newDate = e.target.value;
                      setEditingQuiz(prev => {
                        const titlePart = prev.title || 'daily-practice-quiz';
                        const newSlug = (!isSlugManuallyEdited || !prev.slug)
                          ? generateDailyQuizSlug(titlePart, newDate)
                          : prev.slug;
                        return {
                          ...prev,
                          publishDate: newDate,
                          slug: newSlug
                        };
                      });
                    }}
                    className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white focus:border-amber-500 shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Difficulty</label>
                  <select
                    value={editingQuiz.difficulty || 'MEDIUM'}
                    onChange={e => setEditingQuiz(prev => ({ ...prev, difficulty: e.target.value }))}
                    className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white font-bold shadow-2xs"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High Yield</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Time Limit (Mins)</label>
                  <input
                    type="number"
                    value={editingQuiz.timeLimitMins || 10}
                    onChange={e => setEditingQuiz(prev => ({ ...prev, timeLimitMins: Number(e.target.value) }))}
                    className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Passing Score (%)</label>
                  <input
                    type="number"
                    value={editingQuiz.passingScore || 40}
                    onChange={e => setEditingQuiz(prev => ({ ...prev, passingScore: Number(e.target.value) }))}
                    className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white shadow-2xs"
                  />
                </div>
              </div>

              {/* SET-Wise Exam Paper Access Configuration Card (Test Series Standard) */}
              <div className="p-5 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                  <div>
                    <label className="block text-amber-500 font-extrabold uppercase text-[10px] tracking-wider">
                      SET-Wise Exam Paper Access System
                    </label>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                      Configure paper variants (SET-A, B, C, D) and default assigned SET code
                    </span>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-lg text-[9px] font-black uppercase shrink-0">
                    {editingQuiz.setMode === 'multi' ? 'Multi-SET Mode' : 'Single Paper Mode'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1 text-[10px] uppercase font-bold">SET Access Mode</label>
                    <select
                      value={editingQuiz.setMode || 'single'}
                      onChange={e => setEditingQuiz(prev => ({ ...prev, setMode: e.target.value as 'single' | 'multi' }))}
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none font-bold cursor-pointer text-xs focus:border-amber-500 transition-colors"
                    >
                      <option value="single">Single Paper (Standard)</option>
                      <option value="multi">Multi-SET Paper (Sets A, B, C, D)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1 text-[10px] uppercase font-bold">Assigned Default SET Code</label>
                    <select
                      value={editingQuiz.defaultSet || 'SET-A'}
                      onChange={e => setEditingQuiz(prev => ({ ...prev, defaultSet: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none font-bold cursor-pointer text-xs focus:border-amber-500 transition-colors"
                    >
                      <option value="SET-A">SET-A</option>
                      <option value="SET-B">SET-B</option>
                      <option value="SET-C">SET-C</option>
                      <option value="SET-D">SET-D</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-2 text-[10px] uppercase font-bold">Available SET Variants</label>
                  <div className="flex flex-wrap items-center gap-4">
                    {['SET-A', 'SET-B', 'SET-C', 'SET-D'].map((setCode) => {
                      const currentSets: string[] = editingQuiz.availableSets || ['SET-A', 'SET-B', 'SET-C', 'SET-D'];
                      const isChecked = currentSets.includes(setCode);
                      return (
                        <label key={setCode} className="flex items-center gap-2 cursor-pointer text-xs font-bold select-none bg-slate-50 dark:bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 transition-colors shadow-2xs">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const nextSets = e.target.checked
                                ? [...currentSets, setCode]
                                : currentSets.filter(s => s !== setCode);
                              setEditingQuiz(prev => ({ ...prev, availableSets: nextSets }));
                            }}
                            className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                          />
                          <span className={isChecked ? 'text-amber-500 font-black' : 'text-slate-600 dark:text-slate-400'}>{setCode}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsQuizModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl cursor-pointer transition-all"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingQuiz}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl uppercase tracking-wider cursor-pointer"
                >
                  {savingQuiz ? 'Saving...' : 'Save & Publish Quiz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: SINGLE QUESTION BUILDER (FULL TEST SERIES STANDARD) ──── */}
      {isQModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-2xl w-full space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-heading font-black text-slate-900 dark:text-white">
                  {editingQ.id ? 'Edit Question' : 'Add New Question'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Configure bilingual text, Option E, diagram attachments, and scoring scheme
                </p>
              </div>
              <button onClick={() => setIsQModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Language Switcher & Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 p-1 bg-amber-50/70 dark:bg-slate-800 rounded-2xl border border-amber-200/50 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setQModalLangTab('en')}
                  className={`py-1.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    qModalLangTab === 'en'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-950'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setQModalLangTab('hi')}
                  className={`py-1.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    qModalLangTab === 'hi'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-950'
                  }`}
                >
                  हिन्दी (Hindi)
                </button>
              </div>

              {/* Option E Toggle (BPSC 5th Option) */}
              <button
                type="button"
                onClick={() => setHasOptionE(!hasOptionE)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  hasOptionE
                    ? 'bg-purple-500/15 border-purple-500 text-purple-700 dark:text-purple-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <span>Option E (BPSC 5th Option)</span>
                <span className={`w-2 h-2 rounded-full ${hasOptionE ? 'bg-purple-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
              
              {/* Question Text */}
              {qModalLangTab === 'en' ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-500">English Question Text *</label>
                    <button
                      type="button"
                      onClick={() => setPreviewMarkdown(!previewMarkdown)}
                      className="text-[10px] text-amber-500 hover:underline"
                    >
                      {previewMarkdown ? 'Hide Table Preview' : 'Preview Table / Markdown'}
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    required
                    value={editingQ.questionText || ''}
                    onChange={e => setEditingQ(prev => ({ ...prev, questionText: e.target.value }))}
                    className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white focus:border-amber-500 font-sans leading-relaxed shadow-2xs"
                  />
                  {previewMarkdown && (
                    <div className="p-3 bg-amber-50/50 dark:bg-slate-950 border border-amber-500/30 rounded-xl">
                      {(() => {
                        const { isHtml, formatted } = renderFormattedQuestionText(editingQ.questionText || '');
                        if (isHtml) return <div dangerouslySetInnerHTML={{ __html: formatted }} />;
                        return <p>{editingQ.questionText}</p>;
                      })()}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="font-bold text-amber-600 dark:text-amber-400">Hindi Question Text (हिन्दी प्रश्न - Optional)</label>
                  <textarea
                    rows={4}
                    placeholder="उदा. भारतीय संविधान के अनुच्छेद 213 के अंतर्गत राज्यपाल अध्यादेश कब जारी कर सकता है..."
                    value={editingQ.questionTextHi || ''}
                    onChange={e => setEditingQ(prev => ({ ...prev, questionTextHi: e.target.value }))}
                    className="w-full p-3 bg-white dark:bg-slate-900 border border-amber-500/40 rounded-xl outline-none text-slate-900 dark:text-white focus:border-amber-500 leading-relaxed shadow-2xs"
                  />
                </div>
              )}

              {/* Options Inputs */}
              <div className="space-y-3">
                <span className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider">
                  {qModalLangTab === 'en' ? 'Options (A, B, C, D)' : 'विकल्प (हिन्दी अनुवाद)'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 dark:text-slate-400">Option A *</label>
                    <input
                      type="text"
                      required={qModalLangTab === 'en'}
                      value={qModalLangTab === 'en' ? (editingQ.optionA || '') : (editingQ.optionAHi || '')}
                      onChange={e => {
                        const v = e.target.value;
                        setEditingQ(prev => qModalLangTab === 'en' ? { ...prev, optionA: v } : { ...prev, optionAHi: v });
                      }}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white shadow-2xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 dark:text-slate-400">Option B *</label>
                    <input
                      type="text"
                      required={qModalLangTab === 'en'}
                      value={qModalLangTab === 'en' ? (editingQ.optionB || '') : (editingQ.optionBHi || '')}
                      onChange={e => {
                        const v = e.target.value;
                        setEditingQ(prev => qModalLangTab === 'en' ? { ...prev, optionB: v } : { ...prev, optionBHi: v });
                      }}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white shadow-2xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 dark:text-slate-400">Option C *</label>
                    <input
                      type="text"
                      required={qModalLangTab === 'en'}
                      value={qModalLangTab === 'en' ? (editingQ.optionC || '') : (editingQ.optionCHi || '')}
                      onChange={e => {
                        const v = e.target.value;
                        setEditingQ(prev => qModalLangTab === 'en' ? { ...prev, optionC: v } : { ...prev, optionCHi: v });
                      }}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white shadow-2xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 dark:text-slate-400">Option D *</label>
                    <input
                      type="text"
                      required={qModalLangTab === 'en'}
                      value={qModalLangTab === 'en' ? (editingQ.optionD || '') : (editingQ.optionDHi || '')}
                      onChange={e => {
                        const v = e.target.value;
                        setEditingQ(prev => qModalLangTab === 'en' ? { ...prev, optionD: v } : { ...prev, optionDHi: v });
                      }}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white shadow-2xs"
                    />
                  </div>
                </div>

                {/* Option E (If Enabled) */}
                {hasOptionE && (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-purple-600 dark:text-purple-400">
                        Option E (BPSC Standard 5th Option)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          if (qModalLangTab === 'en') {
                            setEditingQ(prev => ({ ...prev, optionE: 'None of the above / More than one of the above' }));
                          } else {
                            setEditingQ(prev => ({ ...prev, optionEHi: 'उपर्युक्त में से कोई नहीं / उपर्युक्त में से एक से अधिक' }));
                          }
                        }}
                        className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline cursor-pointer font-bold"
                      >
                        + Insert Standard BPSC Text
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder={qModalLangTab === 'en' ? 'None of the above / More than one of the above' : 'उपर्युक्त में से कोई नहीं / उपर्युक्त में से एक से अधिक'}
                      value={qModalLangTab === 'en' ? (editingQ.optionE || '') : (editingQ.optionEHi || '')}
                      onChange={e => {
                        const v = e.target.value;
                        setEditingQ(prev => qModalLangTab === 'en' ? { ...prev, optionE: v } : { ...prev, optionEHi: v });
                      }}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-purple-500/40 rounded-xl outline-none text-slate-900 dark:text-white font-medium shadow-2xs"
                    />
                  </div>
                )}
              </div>

              {/* Correct Answer & Marks Scheme */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Correct Answer Key *</label>
                  <select
                    value={editingQ.correctAnswer || 'A'}
                    onChange={e => setEditingQ(prev => ({ ...prev, correctAnswer: e.target.value }))}
                    className="w-full p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500 rounded-xl outline-none text-emerald-800 dark:text-emerald-300 font-black cursor-pointer shadow-2xs"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                    {hasOptionE && <option value="E">Option E</option>}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Marks (+)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingQ.marks !== undefined ? editingQ.marks : 1.0}
                    onChange={e => setEditingQ(prev => ({ ...prev, marks: Number(e.target.value) }))}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white font-bold shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-400">Negative Marks (-)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingQ.negativeMarks !== undefined ? editingQ.negativeMarks : 0.33}
                    onChange={e => setEditingQ(prev => ({ ...prev, negativeMarks: Number(e.target.value) }))}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white font-bold shadow-2xs"
                  />
                </div>
              </div>

              {/* Quick Marking Scheme Presets */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Presets:</span>
                {[
                  { label: '+1.0 / -0.33 (BPSC/UPSC 1/3rd)', m: 1.0, neg: 0.33 },
                  { label: '+2.0 / -0.66 (UPSC GS-1)', m: 2.0, neg: 0.66 },
                  { label: '+2.0 / -0.50 (BPSC 1/4th)', m: 2.0, neg: 0.50 },
                  { label: '+1.0 / 0.00 (No Negative)', m: 1.0, neg: 0.00 }
                ].map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => setEditingQ(prev => ({ ...prev, marks: preset.m, negativeMarks: preset.neg }))}
                    className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Diagram / Image URL */}
              <div className="space-y-1 pt-1">
                <label className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                  <span>Question Image / Diagram URL (Optional)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://... or /media/... image URL"
                  value={editingQ.questionImageUrl || ''}
                  onChange={e => setEditingQ(prev => ({ ...prev, questionImageUrl: e.target.value }))}
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white font-mono text-xs shadow-2xs"
                />
                {editingQ.questionImageUrl && (
                  <div className="mt-2 max-w-xs rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <img
                      src={editingQ.questionImageUrl}
                      alt="Preview"
                      className="w-full h-auto object-cover max-h-36"
                    />
                  </div>
                )}
              </div>

              {/* Explanation & Rationale */}
              <div className="space-y-1 pt-1">
                <label className="font-bold text-slate-600 dark:text-slate-400">
                  {qModalLangTab === 'en' ? 'Explanation & Solution Rationale' : 'हिन्दी व्याख्या (Optional)'}
                </label>
                <textarea
                  rows={3}
                  value={qModalLangTab === 'en' ? (editingQ.explanation || '') : (editingQ.explanationHi || '')}
                  onChange={e => {
                    const v = e.target.value;
                    setEditingQ(prev => qModalLangTab === 'en' ? { ...prev, explanation: v } : { ...prev, explanationHi: v });
                  }}
                  className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white focus:border-amber-500 shadow-2xs"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsQModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl cursor-pointer transition-all"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingQ}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl uppercase tracking-wider cursor-pointer shadow-md"
                >
                  {savingQ ? 'Saving Question...' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: UNIVERSAL 3-MODE BILINGUAL IMPORTER & REVIEW DASHBOARD (TEST SERIES STANDARD) ─ */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 shrink-0 bg-white dark:bg-slate-900">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md text-[10px] font-black uppercase tracking-wider">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Universal Bilingual Engine</span>
                </div>
                <h3 className="font-heading font-black text-xl text-slate-900 dark:text-white mt-0.5">
                  Bilingual Question Importer & Review Dashboard
                </h3>
                <p className="text-xs text-slate-500">
                  Import questions into &quot;{currentSelectedQuiz?.title}&quot; via Paste Text, Document/PDF, or structured Excel (.xlsx).
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsBulkModalOpen(false);
                  setBilingualReport(null);
                  setBulkParseErrors([]);
                  setBulkParseMode('text');
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* STEP 1: Input — 3 Mode Switcher (Paste Text, Upload PDF/Doc, Excel .xlsx) */}
              {!bilingualReport && (
                <div className="space-y-5">
                  {/* Mode Toggle Tabs */}
                  <div className="flex flex-wrap gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold w-fit">
                    <button
                      type="button"
                      onClick={() => { setBulkParseMode('text'); setBulkParseErrors([]); }}
                      className={`px-4 py-2 rounded-xl cursor-pointer transition-all ${
                        bulkParseMode === 'text'
                          ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      📋 Paste Text
                    </button>
                    <button
                      type="button"
                      onClick={() => { setBulkParseMode('pdf'); setBulkParseErrors([]); }}
                      className={`px-4 py-2 rounded-xl cursor-pointer transition-all ${
                        bulkParseMode === 'pdf'
                          ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      📄 Upload Document / PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => { setBulkParseMode('excel'); setBulkParseErrors([]); }}
                      className={`px-4 py-2 rounded-xl cursor-pointer transition-all ${
                        bulkParseMode === 'excel'
                          ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      📊 Import from Excel (.xlsx)
                    </button>
                  </div>

                  {/* Info Banner */}
                  {bulkParseMode !== 'excel' ? (
                    <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed flex items-center gap-3">
                      <span className="text-xl shrink-0">✨</span>
                      <div>
                        <strong className="block font-bold text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">
                          Universal Format-Agnostic Import Engine
                        </strong>
                        <span>Paste text or upload test papers in any format (English, Hindi, or Bilingual). The engine automatically detects questions, options A-E, answers, and explanations.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed flex items-center gap-3">
                      <span className="text-xl shrink-0">📊</span>
                      <div>
                        <strong className="block font-bold text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">
                          Structured Question Bank Excel Engine
                        </strong>
                        <span>Strict 1-row-per-question importer using standard Question Bank template (.xlsx) for 100% structured accuracy.</span>
                      </div>
                    </div>
                  )}

                  {/* Bulk Default Marks Settings */}
                  <div className="flex flex-wrap items-center gap-4 p-4 bg-amber-50/50 dark:bg-slate-800/40 rounded-2xl border border-amber-200/60 dark:border-slate-700 text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600 dark:text-slate-400">Default Positive Marks:</span>
                      <input
                        type="number"
                        step="0.01"
                        value={bulkDefaultMarks}
                        onChange={e => setBulkDefaultMarks(Number(e.target.value))}
                        className="w-16 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600 dark:text-slate-400">Negative Penalty:</span>
                      <input
                        type="number"
                        step="0.01"
                        value={bulkDefaultNegMarks}
                        onChange={e => setBulkDefaultNegMarks(Number(e.target.value))}
                        className="w-16 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Parse Errors */}
                  {bulkParseErrors.length > 0 && (
                    <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl space-y-1">
                      {bulkParseErrors.map((err, i) => (
                        <p key={i} className="text-xs font-medium text-red-600 dark:text-red-400">⚠️ {err}</p>
                      ))}
                    </div>
                  )}

                  {/* 1. TEXT MODE */}
                  {bulkParseMode === 'text' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">Paste Text / Questions Feed:</span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setBulkRawText(SAMPLE_BULK_TEXT)}
                            className="text-xs font-bold text-amber-500 hover:underline cursor-pointer"
                          >
                            Insert BPSC Sample Format
                          </button>
                          <button
                            type="button"
                            onClick={() => setBulkRawText('')}
                            className="text-xs font-bold text-slate-400 hover:text-red-500 cursor-pointer"
                          >
                            Clear Text
                          </button>
                        </div>
                      </div>

                      <textarea
                        rows={12}
                        value={bulkRawText}
                        onChange={e => { setBulkRawText(e.target.value); setBulkParseErrors([]); }}
                        placeholder="1. Question text here...&#10;(A) Option A&#10;(B) Option B&#10;(C) Option C&#10;(D) Option D&#10;(E) Option E (optional)&#10;Ans: B&#10;Explanation: Solution here..."
                        className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl outline-none focus:border-amber-500 font-mono text-xs resize-y leading-relaxed shadow-2xs"
                      />

                      <div className="flex justify-end">
                        <button
                          type="button"
                          disabled={parsingBulkFile || !bulkRawText.trim()}
                          onClick={async () => {
                            if (!bulkRawText.trim()) return;
                            setParsingBulkFile(true);
                            setBulkParseErrors([]);
                            try {
                              const res = await (db as any).parseBilingualText(bulkRawText);
                              if (res && res.success && res.report) {
                                if (res.report.errors && res.report.errors.length > 0) {
                                  setBulkParseErrors(res.report.errors);
                                }
                                setBilingualReport(res.report);
                                if (res.report.questionsPreview) {
                                  const qList = res.report.questionsPreview.map((q: any, idx: number) => ({
                                    id: generateUniqueId(`q-bulk-${idx + 1}`),
                                    questionText: q.questionText || '',
                                    questionTextHi: q.questionTextHi || undefined,
                                    optionA: stripOptionPrefix(q.optionA || ''),
                                    optionAHi: q.optionAHi ? stripOptionPrefix(q.optionAHi) : undefined,
                                    optionB: stripOptionPrefix(q.optionB || ''),
                                    optionBHi: q.optionBHi ? stripOptionPrefix(q.optionBHi) : undefined,
                                    optionC: stripOptionPrefix(q.optionC || ''),
                                    optionCHi: q.optionCHi ? stripOptionPrefix(q.optionCHi) : undefined,
                                    optionD: stripOptionPrefix(q.optionD || ''),
                                    optionDHi: q.optionDHi ? stripOptionPrefix(q.optionDHi) : undefined,
                                    optionE: q.optionE ? stripOptionPrefix(q.optionE) : undefined,
                                    optionEHi: q.optionEHi ? stripOptionPrefix(q.optionEHi) : undefined,
                                    correctAnswer: q.correctAnswer || 'A',
                                    explanation: q.explanation || 'Refer to official syllabus notes.',
                                    explanationHi: q.explanationHi || undefined,
                                    marks: bulkDefaultMarks,
                                    negativeMarks: bulkDefaultNegMarks
                                  }));
                                  setParsedBulkQuestions(qList);
                                }
                              } else {
                                handleParseBulkText();
                              }
                            } catch {
                              handleParseBulkText();
                            } finally {
                              setParsingBulkFile(false);
                            }
                          }}
                          className="px-8 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl cursor-pointer shadow-md transition-all"
                        >
                          {parsingBulkFile ? 'Parsing...' : 'Parse & Validate →'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 2. PDF / DOC MODE */}
                  {bulkParseMode === 'pdf' && (
                    <div className="space-y-4">
                      <div className="p-8 border-2 border-dashed border-amber-500/40 rounded-3xl hover:border-amber-500 transition-colors space-y-4 text-center bg-amber-50/20 dark:bg-slate-900/50">
                        <FileText className="w-12 h-12 text-amber-500 mx-auto" />
                        <div className="space-y-1">
                          <h4 className="font-heading font-black text-sm text-slate-900 dark:text-white">
                            Upload Test Paper (PDF, Word, or Document)
                          </h4>
                          <p className="text-xs text-slate-400 max-w-sm mx-auto">
                            Universal Engine extracts questions, bilingual options, and explanations from digital exam papers.
                          </p>
                        </div>
                        <label className="inline-block px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl cursor-pointer shadow-md transition-all">
                          <span>{parsingBulkFile ? 'Extracting & Validating Document...' : 'Select PDF or Document File'}</span>
                          <input
                            type="file"
                            accept=".pdf,.docx,.txt"
                            disabled={parsingBulkFile}
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setParsingBulkFile(true);
                              setBulkParseErrors([]);
                              try {
                                if (file.name.endsWith('.pdf')) {
                                  const res = await (db as any).parseBilingualPdf(file);
                                  if (res && res.success && res.report) {
                                    if (res.report.errors && res.report.errors.length > 0) {
                                      setBulkParseErrors(res.report.errors);
                                    }
                                    setBilingualReport(res.report);
                                    if (res.report.questionsPreview) {
                                      const qList = res.report.questionsPreview.map((q: any, idx: number) => ({
                                        id: generateUniqueId(`q-bulk-${idx + 1}`),
                                        questionText: q.questionText || '',
                                        questionTextHi: q.questionTextHi || undefined,
                                        optionA: stripOptionPrefix(q.optionA || ''),
                                        optionAHi: q.optionAHi ? stripOptionPrefix(q.optionAHi) : undefined,
                                        optionB: stripOptionPrefix(q.optionB || ''),
                                        optionBHi: q.optionBHi ? stripOptionPrefix(q.optionBHi) : undefined,
                                        optionC: stripOptionPrefix(q.optionC || ''),
                                        optionCHi: q.optionCHi ? stripOptionPrefix(q.optionCHi) : undefined,
                                        optionD: stripOptionPrefix(q.optionD || ''),
                                        optionDHi: q.optionDHi ? stripOptionPrefix(q.optionDHi) : undefined,
                                        optionE: q.optionE ? stripOptionPrefix(q.optionE) : undefined,
                                        optionEHi: q.optionEHi ? stripOptionPrefix(q.optionEHi) : undefined,
                                        correctAnswer: q.correctAnswer || 'A',
                                        explanation: q.explanation || 'Refer to official syllabus notes.',
                                        explanationHi: q.explanationHi || undefined,
                                        marks: bulkDefaultMarks,
                                        negativeMarks: bulkDefaultNegMarks
                                      }));
                                      setParsedBulkQuestions(qList);
                                    }
                                  } else {
                                    setBulkParseErrors([res?.error || 'Failed parsing PDF document.']);
                                  }
                                } else {
                                  const text = await file.text();
                                  setBulkRawText(text);
                                  setBulkParseMode('text');
                                  setTimeout(() => handleParseBulkText(), 100);
                                }
                              } catch (err: any) {
                                setBulkParseErrors([err.message || 'Error extracting file.']);
                              } finally {
                                setParsingBulkFile(false);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {/* 3. EXCEL MODE (.xlsx) */}
                  {bulkParseMode === 'excel' && (
                    <div className="space-y-4">
                      <div className="p-8 border-2 border-dashed border-emerald-500/30 rounded-3xl hover:border-emerald-500/60 transition-colors space-y-4 text-center bg-emerald-500/5 dark:bg-emerald-950/20">
                        <FileText className="w-12 h-12 text-emerald-500 mx-auto" />
                        <div className="space-y-1">
                          <h4 className="font-heading font-black text-sm text-slate-900 dark:text-white">
                            Upload Excel Question Bank (.xlsx)
                          </h4>
                          <p className="text-xs text-slate-400 max-w-sm mx-auto">
                            Uses standard 17-column Question Bank schema for 100% structured accuracy.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                          <label className="inline-block px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-2xl cursor-pointer shadow-md transition-all">
                            <span>{parsingBulkFile ? 'Parsing Excel File...' : 'Select Excel File (.xlsx)'}</span>
                            <input
                              type="file"
                              accept=".xlsx,.xls"
                              disabled={parsingBulkFile}
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setParsingBulkFile(true);
                                setBulkParseErrors([]);
                                try {
                                  const res = await (db as any).parseExcel(file);
                                  if (res && res.success && res.report) {
                                    if (res.report.errors && res.report.errors.length > 0) {
                                      setBulkParseErrors(res.report.errors);
                                    }
                                    setBilingualReport(res.report);
                                    if (res.report.questionsPreview) {
                                      const qList = res.report.questionsPreview.map((q: any, idx: number) => ({
                                        id: generateUniqueId(`q-bulk-${idx + 1}`),
                                        questionText: q.questionText || '',
                                        questionTextHi: q.questionTextHi || undefined,
                                        optionA: stripOptionPrefix(q.optionA || ''),
                                        optionAHi: q.optionAHi ? stripOptionPrefix(q.optionAHi) : undefined,
                                        optionB: stripOptionPrefix(q.optionB || ''),
                                        optionBHi: q.optionBHi ? stripOptionPrefix(q.optionBHi) : undefined,
                                        optionC: stripOptionPrefix(q.optionC || ''),
                                        optionCHi: q.optionCHi ? stripOptionPrefix(q.optionCHi) : undefined,
                                        optionD: stripOptionPrefix(q.optionD || ''),
                                        optionDHi: q.optionDHi ? stripOptionPrefix(q.optionDHi) : undefined,
                                        optionE: q.optionE ? stripOptionPrefix(q.optionE) : undefined,
                                        optionEHi: q.optionEHi ? stripOptionPrefix(q.optionEHi) : undefined,
                                        correctAnswer: q.correctAnswer || 'A',
                                        explanation: q.explanation || 'Refer to official syllabus notes.',
                                        explanationHi: q.explanationHi || undefined,
                                        marks: bulkDefaultMarks,
                                        negativeMarks: bulkDefaultNegMarks
                                      }));
                                      setParsedBulkQuestions(qList);
                                    }
                                  } else {
                                    setBulkParseErrors([res?.error || 'Failed parsing Excel file.']);
                                  }
                                } catch (err: any) {
                                  setBulkParseErrors([err.message || 'Error processing Excel file.']);
                                } finally {
                                  setParsingBulkFile(false);
                                }
                              }}
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() => (db as any).downloadExcelTemplate()}
                            className="px-5 py-3 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-2xl transition-all border border-slate-200 dark:border-slate-700 flex items-center gap-2 cursor-pointer shadow-xs"
                          >
                            <span>📥 Download Excel Template</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Canonical Two-Section & Interactive Review Dashboard */}
              {bilingualReport && (
                <div className="space-y-6">
                  {/* Validation Summary Header */}
                  <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 text-xs font-bold ${
                    bilingualReport?.isValid !== false
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{bilingualReport?.isValid !== false ? '✓' : '⚠️'}</span>
                      <div>
                        <span className="font-extrabold uppercase tracking-wider block">
                          Validation Status: {bilingualReport?.isValid !== false ? 'VALID' : 'REVIEW DETECTED'}
                        </span>
                        <span className="text-[10px] font-medium opacity-90">
                          {bilingualReport?.mappedQuestionsCount || (parsedBulkQuestions || []).length} questions parsed and ready for import.
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => { setBilingualReport(null); setBulkParseErrors([]); }}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer shrink-0 transition-colors"
                    >
                      ← Re-upload / Edit Input
                    </button>
                  </div>

                  {/* Two-Section View Toggle (Canonical vs Single Card) */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100 dark:bg-slate-800/80 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setBilingualViewMode('canonical')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all cursor-pointer flex items-center gap-2 ${
                          bilingualViewMode === 'canonical'
                            ? 'bg-amber-500 text-slate-950 shadow-md'
                            : 'bg-transparent text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <span>📋 Canonical View (Section 1 Questions + Section 2 Explanations)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBilingualViewMode('single')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all cursor-pointer flex items-center gap-2 ${
                          bilingualViewMode === 'single'
                            ? 'bg-amber-500 text-slate-950 shadow-md'
                            : 'bg-transparent text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <span>🔍 Single Question Card View</span>
                      </button>
                    </div>

                    {bilingualViewMode === 'single' && (bilingualReport.questionsPreview || parsedBulkQuestions).length > 0 && (
                      <div className="flex items-center gap-2">
                        <select
                          value={previewQuestionIndex}
                          onChange={e => setPreviewQuestionIndex(Number(e.target.value))}
                          className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold outline-none cursor-pointer"
                        >
                          {(bilingualReport.questionsPreview || parsedBulkQuestions).map((_: any, idx: number) => (
                            <option key={idx} value={idx}>
                              Jump to Q{idx + 1}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={previewQuestionIndex === 0}
                          onClick={() => setPreviewQuestionIndex(prev => Math.max(0, prev - 1))}
                          className="px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer disabled:opacity-30"
                        >
                          ← Prev
                        </button>
                        <button
                          type="button"
                          disabled={previewQuestionIndex >= (bilingualReport.questionsPreview || parsedBulkQuestions).length - 1}
                          onClick={() => setPreviewQuestionIndex(prev => Math.min((bilingualReport.questionsPreview || parsedBulkQuestions).length - 1, prev + 1))}
                          className="px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer disabled:opacity-30"
                        >
                          Next →
                        </button>
                      </div>
                    )}
                  </div>

                  {/* CANONICAL TWO-SECTION VIEW */}
                  {bilingualViewMode === 'canonical' && (
                    <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-1">
                      {/* Section 1: Questions */}
                      <div className="p-6 bg-slate-50 dark:bg-slate-900 border-2 border-amber-500/30 rounded-3xl space-y-5">
                        <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                          <h4 className="font-heading font-black text-sm uppercase text-amber-500 tracking-wider">
                            SECTION 1 — QUESTIONS (Q1 to Q{(bilingualReport.questionsPreview || parsedBulkQuestions).length})
                          </h4>
                          <span className="text-[10px] font-extrabold px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded-lg uppercase">
                            Question Texts & Options
                          </span>
                        </div>

                        <div className="space-y-5 divide-y divide-slate-200 dark:divide-slate-800">
                          {(bilingualReport.questionsPreview || parsedBulkQuestions).map((q: any, idx: number) => (
                            <div key={idx} className="pt-4 first:pt-0 space-y-2">
                              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 font-black text-xs rounded-lg border border-amber-500/30">
                                Q{idx + 1}
                              </span>
                              <p className="text-xs font-bold text-slate-900 dark:text-white leading-relaxed">
                                {q.questionText}
                              </p>
                              {q.questionTextHi && q.questionTextHi !== q.questionText && (
                                <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                                  {q.questionTextHi}
                                </p>
                              )}
                              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                                {['A', 'B', 'C', 'D', 'E'].map(optKey => {
                                  const text = q[`option${optKey}`];
                                  const textHi = q[`option${optKey}Hi`];
                                  if (!text && !textHi) return null;
                                  return (
                                    <div key={optKey} className="p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-start gap-2">
                                      <span className="font-bold text-amber-500">({optKey.toLowerCase()})</span>
                                      <span className="text-slate-800 dark:text-slate-200 text-[11px]">{stripOptionPrefix(text || textHi)}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Section 2: Explanations */}
                      <div className="p-6 bg-slate-50 dark:bg-slate-900 border-2 border-emerald-500/30 rounded-3xl space-y-5">
                        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                          <h4 className="font-heading font-black text-sm uppercase text-emerald-500 tracking-wider">
                            SECTION 2 — EXPLANATIONS & ANSWER KEY (Q1 to Q{(bilingualReport.questionsPreview || parsedBulkQuestions).length})
                          </h4>
                          <span className="text-[10px] font-extrabold px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg uppercase">
                            Solution Explanations
                          </span>
                        </div>

                        <div className="space-y-4 divide-y divide-slate-200 dark:divide-slate-800">
                          {(bilingualReport.questionsPreview || parsedBulkQuestions).map((q: any, idx: number) => (
                            <div key={idx} className="pt-4 first:pt-0 space-y-2">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black text-xs rounded-lg border border-emerald-500/30">
                                  Q{idx + 1} Answer & Rationale
                                </span>
                                <span className="px-3 py-1 bg-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-xs">
                                  Correct Option: {q.correctAnswer}
                                </span>
                              </div>
                              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs leading-relaxed space-y-1">
                                {q.explanation && <p className="text-slate-800 dark:text-slate-200">{q.explanation}</p>}
                                {q.explanationHi && <p className="text-emerald-800 dark:text-emerald-300 font-medium">{q.explanationHi}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SINGLE QUESTION CARD VIEW */}
                  {bilingualViewMode === 'single' && (() => {
                    const curQ = (bilingualReport.questionsPreview || parsedBulkQuestions)[previewQuestionIndex];
                    if (!curQ) return null;
                    return (
                      <div className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 text-xs">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 font-bold">
                          <span className="px-3 py-1 bg-amber-500/20 text-amber-600 dark:text-amber-400 font-black rounded-xl">
                            Q{previewQuestionIndex + 1}
                          </span>
                          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black rounded-xl border border-emerald-500/30">
                            Answer: Option {curQ.correctAnswer}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{curQ.questionText}</p>
                          {curQ.questionTextHi && <p className="text-amber-800 dark:text-amber-300">{curQ.questionTextHi}</p>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                          {['A', 'B', 'C', 'D', 'E'].map(optKey => {
                            const text = curQ[`option${optKey}`];
                            const textHi = curQ[`option${optKey}Hi`];
                            if (!text && !textHi) return null;
                            const isCorrect = String(curQ.correctAnswer).toUpperCase() === optKey;
                            return (
                              <button
                                key={optKey}
                                type="button"
                                onClick={() => {
                                  const updated = [...(parsedBulkQuestions.length ? parsedBulkQuestions : bilingualReport.questionsPreview)];
                                  updated[previewQuestionIndex] = { ...updated[previewQuestionIndex], correctAnswer: optKey };
                                  setParsedBulkQuestions(updated);
                                }}
                                className={`p-3 rounded-xl border flex items-center justify-between text-left cursor-pointer transition-all ${
                                  isCorrect
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-200 font-bold'
                                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                <span><strong>({optKey})</strong> {stripOptionPrefix(text || textHi)}</span>
                                {isCorrect && <Check className="w-4 h-4 text-emerald-500" />}
                              </button>
                            );
                          })}
                        </div>

                        {(curQ.explanation || curQ.explanationHi) && (
                          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1">
                            <span className="font-bold uppercase text-[10px] text-amber-600 dark:text-amber-400">Explanation:</span>
                            <p>{curQ.explanation || curQ.explanationHi}</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Target Medium Selection */}
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-4 text-xs font-bold">
                    <div>
                      <span className="block text-amber-700 dark:text-amber-300 font-black uppercase tracking-wider">
                        Publish Target Medium
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Choose whether this daily practice test is bilingual, Hindi-only, or English-only.
                      </span>
                    </div>

                    <select
                      value={bilingualPaperLanguage}
                      onChange={e => setBilingualPaperLanguage(e.target.value as any)}
                      className="px-4 py-2 bg-white dark:bg-slate-900 border border-amber-500/40 text-slate-900 dark:text-white rounded-xl outline-none font-bold text-xs cursor-pointer shadow-xs"
                    >
                      <option value="BILINGUAL">🌐 Both Pages (Bilingual Portal)</option>
                      <option value="HINDI_ONLY">Hindi Medium Only (हिन्दी)</option>
                      <option value="ENGLISH_ONLY">English Medium Only</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer (Commit Button) */}
            <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => {
                  setIsBulkModalOpen(false);
                  setBilingualReport(null);
                  setBulkParseErrors([]);
                }}
                className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold rounded-2xl cursor-pointer transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={importingBulk || (parsedBulkQuestions.length === 0 && (!bilingualReport || !bilingualReport.questionsPreview))}
                onClick={handleCommitBulkImport}
                className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl cursor-pointer shadow-md transition-all flex items-center gap-2"
              >
                {importingBulk ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                <span>
                  {importingBulk
                    ? 'Importing...'
                    : `Import All ${parsedBulkQuestions.length || bilingualReport?.questionsPreview?.length || 0} Questions`}
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── MODAL 4: ANSWER KEY / SET INSPECTOR ───────────────────────────── */}
      {isAnswerKeyModalOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-2xl w-full space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-heading font-black text-slate-900 dark:text-white">
                  Answer Key & Scoring Rationale
                </h3>
                <p className="text-xs text-slate-500">
                  {currentSelectedQuiz?.title} ({questions.length} Questions)
                </p>
              </div>
              <button onClick={() => setIsAnswerKeyModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SET Selector in Answer Key Modal */}
            {currentSelectedQuiz?.setMode === 'multi' && (
              <div className="flex items-center justify-between gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                <span className="text-xs font-black uppercase text-amber-700 dark:text-amber-300">
                  Select SET Variant:
                </span>
                <div className="flex items-center gap-1.5">
                  {(currentSelectedQuiz.availableSets || ['SET-A', 'SET-B', 'SET-C', 'SET-D']).map((setCode) => (
                    <button
                      key={setCode}
                      type="button"
                      onClick={() => setSelectedSetCode(setCode as any)}
                      className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                        selectedSetCode === setCode
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-950'
                      }`}
                    >
                      {setCode}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Verification Grid ({selectedSetCode}):
              </span>
              <button
                onClick={handleCopyAnswerKey}
                className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-900 dark:text-amber-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-amber-200 dark:border-slate-700"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedKeyToast ? 'Copied to Clipboard!' : 'Copy Formatted Key'}</span>
              </button>
            </div>

            {/* Answer Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 max-h-96 overflow-y-auto pr-1 text-xs">
              {activeSetQuestions.map((q: Question, idx: number) => (
                <div
                  key={q.id || idx}
                  className="p-3 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between shadow-2xs"
                >
                  <span className="font-bold text-slate-600 dark:text-slate-400">Q{idx + 1}</span>
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-400 font-black flex items-center justify-center">
                    {(q as any).mappedCorrectKey || q.correctAnswer}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
