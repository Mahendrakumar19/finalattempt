'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Flame, Plus, Trash2, Edit3, X, 
  HelpCircle, Eye, Sparkles, RefreshCw, AlertCircle,
  Upload, FileText, Check, Copy, ArrowUp, ArrowDown,
  Search, CheckCircle2, Image as ImageIcon, Layers,
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
  isFree: true
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

  // Bulk Importer Modal State (Full Test Series Standard)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkRawText, setBulkRawText] = useState('');
  const [parsedBulkQuestions, setParsedBulkQuestions] = useState<Question[]>([]);
  const [bulkDefaultMarks, setBulkDefaultMarks] = useState(1.0);
  const [bulkDefaultNegMarks, setBulkDefaultNegMarks] = useState(0.33);
  const [importingBulk, setImportingBulk] = useState(false);

  // Answer Key Inspector Modal State
  const [isAnswerKeyModalOpen, setIsAnswerKeyModalOpen] = useState(false);
  const [copiedKeyToast, setCopiedKeyToast] = useState(false);

  // Fetch all daily quizzes
  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const data = await db.getPreviousDailyQuizzes();
      setQuizzes(data || []);
      if (!selectedQuizId && data && data.length > 0) {
        handleSelectQuizForQuestions(data[0].id);
      }
    } catch (err) {
      console.error('Failed loading daily quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isSubscribed = true;
    db.getPreviousDailyQuizzes()
      .then(data => {
        if (!isSubscribed) return;
        setQuizzes(data || []);
        if (data && data.length > 0 && !selectedQuizId) {
          handleSelectQuizForQuestions(data[0].id);
        }
      })
      .catch(err => console.error('Failed loading daily quizzes:', err))
      .finally(() => {
        if (isSubscribed) setLoading(false);
      });
    return () => { isSubscribed = false; };
  }, []);

  // Fetch questions for a selected quiz
  const handleSelectQuizForQuestions = async (quizId: string) => {
    setSelectedQuizId(quizId);
    setLoadingQuestions(true);
    try {
      const adminQuestions = await (db as any).getAdminDailyQuizQuestions(quizId);
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
  };

  // Selected Quiz object
  const currentSelectedQuiz = useMemo(() => {
    return quizzes.find(q => q.id === selectedQuizId) || null;
  }, [quizzes, selectedQuizId]);

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

  // Filtered Questions in selected quiz
  const filteredQuestions = useMemo(() => {
    if (!searchQuestionQuery.trim()) return questions;
    const q = searchQuestionQuery.toLowerCase();
    return questions.filter(item =>
      item.questionText?.toLowerCase().includes(q) ||
      item.questionTextHi?.includes(q) ||
      item.explanation?.toLowerCase().includes(q) ||
      item.explanationHi?.includes(q)
    );
  }, [questions, searchQuestionQuery]);

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
        id: editingQuiz.id || `dq-${Date.now()}`,
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
        isFree: true
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
      const duplicateId = `dq-${Date.now()}`;
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
          id: `q-${duplicateId}-${idx + 1}-${Date.now()}`
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
        id: editingQ.id || `q-${selectedQuizId}-${Date.now()}`,
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
        id: `q-${selectedQuizId}-${Date.now()}`,
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
      } catch (_) {}
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
    if (!selectedQuizId || parsedBulkQuestions.length === 0) return;
    setImportingBulk(true);

    try {
      await (db as any).saveDailyQuizQuestionsBulk(selectedQuizId, parsedBulkQuestions);
      await handleSelectQuizForQuestions(selectedQuizId);
      setIsBulkModalOpen(false);
      setParsedBulkQuestions([]);
      setBulkRawText('');
      alert(`Successfully imported ${parsedBulkQuestions.length} questions into this Daily Quiz!`);
    } catch (err) {
      console.error('Error importing bulk questions:', err);
      alert('Failed importing questions.');
    } finally {
      setImportingBulk(false);
    }
  };

  // Copy Answer Key to Clipboard
  const handleCopyAnswerKey = () => {
    if (!questions.length) return;
    const summaryText = questions
      .map((q, idx) => `Q${idx + 1}: ${q.correctAnswer} (Marks: +${q.marks || 1}, -${q.negativeMarks || 0.33}) - ${q.explanation || 'No explanation'}`)
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
                          `🎯 Final Attempt IAS Daily Quiz\n📚 ${currentSelectedQuiz.title}\n📅 Date: ${currentSelectedQuiz.publishDate}\n⏱️ ${currentSelectedQuiz.timeLimitMins || 10} Mins | ${questions.length || 10} Questions\n\nAttempt now & check your state leaderboard rank:\n${typeof window !== 'undefined' ? window.location.origin : 'https://finalattemptias.com'}/daily-quiz/${currentSelectedQuiz.slug || currentSelectedQuiz.id}`
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

              {/* Filter Questions in Bank */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search questions in this quiz..."
                    value={searchQuestionQuery}
                    onChange={e => setSearchQuestionQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500 shadow-xs placeholder:text-slate-400"
                  />
                </div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0">
                  Total Marks: {questions.reduce((acc, q) => acc + (q.marks || 1), 0).toFixed(2)}
                </span>
              </div>

              {/* Questions List */}
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
              ) : (
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
                            {/* eslint-disable-next-line @next/next/no-img-element */}
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
                              return <div className="font-heading font-bold text-sm text-slate-900 dark:text-white leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />;
                            }
                            return (
                              <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white leading-relaxed">
                                {raw}
                              </h4>
                            );
                          })()}

                          {/* Only render Hindi question text if it's actually different from English */}
                          {q.questionTextHi && q.questionTextHi.trim() !== (q.questionText || '').trim() && (
                            <p className="text-xs text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
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
                            const isCorrect = String(q.correctAnswer || '').trim().toUpperCase() === opt.key.toUpperCase();
                            return (
                              <button
                                key={opt.key}
                                type="button"
                                onClick={() => handleQuickSetCorrectAnswer(q, opt.key)}
                                title={`Click to set Option ${opt.key} as the correct answer`}
                                className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 transition-all text-left cursor-pointer ${
                                  isCorrect
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 text-emerald-950 dark:text-emerald-100 font-bold shadow-xs ring-1 ring-emerald-500/20'
                                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:border-amber-400 hover:bg-amber-50/30'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                                  <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 border ${
                                    isCorrect
                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                      : 'bg-amber-100 dark:bg-slate-700 text-amber-950 dark:text-amber-200 border-amber-300 dark:border-slate-600'
                                  }`}>
                                    {opt.key}
                                  </span>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-slate-900 dark:text-white font-medium leading-snug line-clamp-2">
                                      {opt.text || opt.textHi}
                                    </span>
                                    {opt.text && opt.textHi && opt.textHi.trim() !== opt.text.trim() && (
                                      <span className="text-[11px] text-amber-800 dark:text-amber-300 font-medium leading-snug line-clamp-2 mt-0.5">
                                        {opt.textHi}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {isCorrect ? (
                                  <span className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md border border-emerald-400 shrink-0">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                    <span>Correct</span>
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
                          <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs space-y-1">
                            <span className="font-extrabold text-amber-900 dark:text-amber-400 text-[10px] uppercase tracking-wider">
                              Rationale / Solution:
                            </span>
                            {q.explanation && (
                              <p className="text-slate-800 dark:text-slate-200 leading-relaxed">{q.explanation}</p>
                            )}
                            {q.explanationHi && (
                              <p className="text-amber-800 dark:text-amber-300 font-medium leading-relaxed">{q.explanationHi}</p>
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
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

      {/* ── MODAL 3: UNIVERSAL BULK QUESTION IMPORTER (TEST SERIES STANDARD) ─ */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-4xl w-full space-y-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md text-[10px] font-black uppercase tracking-wider">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Bulk Question Importer</span>
                </div>
                <h3 className="text-xl font-heading font-black text-slate-900 dark:text-white mt-1">
                  Import Multiple Questions in One Click
                </h3>
                <p className="text-xs text-slate-500">
                  Paste entire tests from Word/PDF/Notepad or CSV/JSON. The universal parser detects questions, options (A-E), answers, and explanations.
                </p>
              </div>
              <button onClick={() => setIsBulkModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Input & Helper Row */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Paste Text / Questions Feed:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkRawText(SAMPLE_BULK_TEXT)}
                    className="text-[11px] font-bold text-amber-500 hover:underline cursor-pointer"
                  >
                    Insert BPSC Sample Format
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkRawText('')}
                    className="text-[11px] font-bold text-slate-400 hover:text-red-500 cursor-pointer"
                  >
                    Clear Text
                  </button>
                </div>
              </div>

              <textarea
                rows={9}
                placeholder="1. Question text here...&#10;(A) Option A&#10;(B) Option B&#10;(C) Option C&#10;(D) Option D&#10;(E) Option E (optional)&#10;Ans: B&#10;Explanation: Solution here..."
                value={bulkRawText}
                onChange={e => setBulkRawText(e.target.value)}
                className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-slate-900 dark:text-white font-mono text-xs focus:border-amber-500 leading-relaxed shadow-2xs"
              />

              {/* Bulk Settings & Parse Button */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-amber-50/50 dark:bg-slate-900/60 rounded-2xl border border-amber-200/60 dark:border-slate-700">
                <div className="flex items-center gap-4 text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 dark:text-slate-400">Default Marks:</span>
                    <input
                      type="number"
                      step="0.01"
                      value={bulkDefaultMarks}
                      onChange={e => setBulkDefaultMarks(Number(e.target.value))}
                      className="w-16 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center text-slate-900 dark:text-white shadow-2xs"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 dark:text-slate-400">Negative Marks:</span>
                    <input
                      type="number"
                      step="0.01"
                      value={bulkDefaultNegMarks}
                      onChange={e => setBulkDefaultNegMarks(Number(e.target.value))}
                      className="w-16 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center text-slate-900 dark:text-white shadow-2xs"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleParseBulkText}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                >
                  ⚡ Parse & Preview Questions
                </button>
              </div>
            </div>

            {/* Parsed Preview Section */}
            {parsedBulkQuestions.length > 0 && (
              <div className="space-y-4 border-t border-slate-200 dark:border-slate-800 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <h4 className="font-heading font-black text-sm text-slate-900 dark:text-white">
                      Successfully Parsed {parsedBulkQuestions.length} Questions
                    </h4>
                  </div>

                  <button
                    onClick={handleCommitBulkImport}
                    disabled={importingBulk}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {importingBulk ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                    <span>Import All {parsedBulkQuestions.length} Questions</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {parsedBulkQuestions.map((pq, pidx) => (
                    <div key={pidx} className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-amber-700 dark:text-amber-400">Q{pidx + 1}</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">Answer: {pq.correctAnswer}</span>
                      </div>
                      <p className="font-medium text-slate-900 dark:text-white">{pq.questionText}</p>
                      {pq.questionTextHi && pq.questionTextHi !== pq.questionText && (
                        <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">{pq.questionTextHi}</p>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                        <div>
                          <span>A: {pq.optionA}</span>
                          {pq.optionAHi && <span className="block text-[10px] text-amber-800 dark:text-amber-300">({pq.optionAHi})</span>}
                        </div>
                        <div>
                          <span>B: {pq.optionB}</span>
                          {pq.optionBHi && <span className="block text-[10px] text-amber-800 dark:text-amber-300">({pq.optionBHi})</span>}
                        </div>
                        <div>
                          <span>C: {pq.optionC}</span>
                          {pq.optionCHi && <span className="block text-[10px] text-amber-800 dark:text-amber-300">({pq.optionCHi})</span>}
                        </div>
                        <div>
                          <span>D: {pq.optionD}</span>
                          {pq.optionDHi && <span className="block text-[10px] text-amber-800 dark:text-amber-300">({pq.optionDHi})</span>}
                        </div>
                        {pq.optionE && (
                          <div className="col-span-2 text-purple-600 dark:text-purple-400 font-bold">
                            <span>E: {pq.optionE}</span>
                            {pq.optionEHi && <span className="block text-[10px] text-purple-700 dark:text-purple-300">({pq.optionEHi})</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Quick Verification Grid:</span>
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
              {questions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="p-3 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between shadow-2xs"
                >
                  <span className="font-bold text-slate-600 dark:text-slate-400">Q{idx + 1}</span>
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-400 font-black flex items-center justify-center">
                    {q.correctAnswer}
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
