import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, Edit3, ChevronDown, ChevronRight, FileText, X, Check,
  Layers, Sparkles, Eye, ArrowUp, ArrowDown, Folder
} from 'lucide-react';
import { db, TestSeriesItem, ExamData } from '@/services/db';
import MediaPicker from '@/components/MediaPicker';
import { sanitizeAndRepairQuestion, formatMatchListsInText } from '@/utils/questionFormatter';

/** Strips any leading "(a) " / "(A) " / "(क) " option prefix from stored option text */
function stripOptionPrefix(text: string): string {
  if (!text) return '';
  return text.replace(/^\s*\([a-dA-D\u0915-\u0918]\)\s+/, '').trim();
}

/** Renders question text with support for Side-by-Side Matching Tables, Markdown Tables (| List-I | List-II |) and HTML */
function renderMarkdownContent(text: string) {
  if (!text) return null;

  const formattedMatch = formatMatchListsInText(text);
  if (formattedMatch !== text || formattedMatch.includes('match-list-container') || formattedMatch.includes('<table')) {
    return <div className="font-medium text-[var(--text-color)] leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedMatch }} />;
  }

  if (text.includes('|')) {
    const rawLines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const tableRows: string[][] = [];
    const textOutsideTable: string[] = [];

    for (const line of rawLines) {
      if (line.includes('|')) {
        if (line.includes(':---') || line.includes('---')) continue;
        const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        if (cells.length >= 2) {
          tableRows.push(cells);
        } else if (line.length > 0) {
          textOutsideTable.push(line);
        }
      } else {
        textOutsideTable.push(line);
      }
    }

    if (tableRows.length > 0) {
      const headerRow = tableRows[0];
      const dataRows = tableRows.slice(1);

      return (
        <div className="space-y-3 my-2">
          {textOutsideTable.length > 0 && (
            <p className="font-bold text-[var(--text-color)] leading-relaxed whitespace-pre-wrap">
              {textOutsideTable.join('\n')}
            </p>
          )}
          <div className="overflow-x-auto my-2 rounded-xl border border-[var(--card-border)]">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--card-border)] text-[var(--text-color)] font-bold">
                  {headerRow.map((cell, cIdx) => (
                    <th key={cIdx} className="px-3.5 py-2 uppercase tracking-wider font-bold border-r last:border-r-0 border-[var(--card-border)]">
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)] font-medium text-[var(--text-color)]">
                {dataRows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3.5 py-2 text-xs border-r last:border-r-0 border-[var(--card-border)]">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
  }

  if (text.includes('<') && text.includes('>')) {
    return <div className="font-bold text-[var(--text-color)] leading-relaxed" dangerouslySetInnerHTML={{ __html: text }} />;
  }

  return <p className="font-bold text-[var(--text-color)] leading-relaxed whitespace-pre-wrap">{text}</p>;
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

function shuffleArraySeeded<T>(array: T[], seedStr: string): T[] {
  const arr = [...array];
  const random = mulberry32(stringToSeed(seedStr));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const BLANK_SERIES: Partial<TestSeriesItem> = {
  title: '',
  slug: '',
  category: 'Prelims',
  exam: '71st BPSC CCE',
  language: 'English',
  publish_target: 'both',
  status: 'active',
  price: 2999,
  discountedPrice: 1499,
  totalTests: 20,
  totalQuestions: 3000,
  duration: '6 Months Validity',
  description: '',
  highlights: [
    'Subject-wise sectional tests & full-length mock papers',
    'Detailed solutions PDF with extra notes',
    'Negative marking score calculator'
  ],
  syllabus: [
    { subject: 'General Studies & Bihar Special', topics: ['History of Bihar', 'Geography & Polity', 'Current Affairs'] }
  ],
  faq: [
    { q: 'Can I attempt tests 24/7?', a: 'Yes, tests are accessible anytime once unlocked.' }
  ],
  batchStartDate: new Date().toISOString().split('T')[0],
  enrolledCount: 0,
  validityDays: 180,
  isPublished: true,
  displayOrder: 1
};

const BLANK_QUIZ = {
  id: '',
  title: '',
  description: '',
  timeLimitMins: 30,
  passingScore: 40,
  setMode: 'single' as 'single' | 'multi',
  defaultSet: 'SET-A',
  availableSets: ['SET-A', 'SET-B', 'SET-C', 'SET-D']
};

const BLANK_QUESTION = {
  questionText: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  optionE: '',
  correctAnswer: 'A' as const,
  explanation: '',
  marks: 1,
  negativeMarks: 0.33,
};

interface QuizItem {
  id: string;
  title: string;
  description?: string;
  timeLimitMins?: number;
  passingScore?: number;
  courseId?: string;
}

interface QuestionItem {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC?: string;
  optionD?: string;
  optionE?: string;
  correctAnswer?: string;
  explanation?: string;
  questionTextHi?: string;
  optionAHi?: string;
  optionBHi?: string;
  optionCHi?: string;
  optionDHi?: string;
  optionEHi?: string;
  explanationHi?: string;
  questionImageUrl?: string;
  imageUrl?: string;
  marks?: number;
  negativeMarks?: number;
  quizId?: string;
}

interface TestSeriesAdminProps {
  BACKEND_URL?: string;
  initialSeriesId?: string;
  initialSubTab?: 'series' | 'quizzes' | 'exams';
}

export default function TestSeriesAdmin({
  BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000',
  initialSeriesId,
  initialSubTab = 'series'
}: TestSeriesAdminProps) {
  const [subTab, setSubTab] = useState<'series' | 'quizzes' | 'exams'>(initialSubTab);

  // Test Series programs list state
  const [seriesList, setSeriesList] = useState<TestSeriesItem[]>([]);
  const [loadingSeries, setLoadingSeries] = useState(true);

  // Exam Logo & Schedule PDF Media Management State
  const [editingExam, setEditingExam] = useState<ExamData | null>(null);
  const [savingExam, setSavingExam] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'exam_logo' | 'series_pdf' | 'series_image'>('exam_logo');

  // Series Add/Edit Modal
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false);
  const [seriesModalType, setSeriesModalType] = useState<'add' | 'edit'>('add');
  const [editingSeries, setEditingSeries] = useState<Partial<TestSeriesItem>>({ ...BLANK_SERIES });
  const [savingSeries, setSavingSeries] = useState(false);

  // Highlighting/syllabus/faq string helpers for form editing
  const [highlightsInput, setHighlightsInput] = useState('');

  // Quiz & Questions manager states
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('');
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  const [showQuizForm, setShowQuizForm] = useState(false);
  const [quizForm, setQuizForm] = useState({ ...BLANK_QUIZ });
  const [savingQuiz, setSavingQuiz] = useState(false);

  const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<Record<string, QuestionItem[]>>({});
  const [loadingQuestions, setLoadingQuestions] = useState<string | null>(null);

  const [showQForm, setShowQForm] = useState<string | null>(null);
  const [qForm, setQForm] = useState({ ...BLANK_QUESTION });
  const [savingQ, setSavingQ] = useState(false);

  // Strict Bilingual Mock Test Importer Wizard State
  const [showBilingualPdfModal, setShowBilingualPdfModal] = useState(false);
  const [parsingBilingualPdf, setParsingBilingualPdf] = useState(false);
  const [bilingualReport, setBilingualReport] = useState<any | null>(null);
  const [previewQuestionIndex, setPreviewQuestionIndex] = useState(0);
  const [importingBilingualQuiz, setImportingBilingualQuiz] = useState(false);
  const [bilingualQuizTitle, setBilingualQuizTitle] = useState('');
  const [bilingualQuizDescription, setBilingualQuizDescription] = useState('');
  const [replaceExistingQuizConfirm, setReplaceExistingQuizConfirm] = useState(false);
  const [bilingualPastedText, setBilingualPastedText] = useState('');
  const [bilingualParseMode, setBilingualParseMode] = useState<'text' | 'pdf' | 'excel'>('text');
  const [bilingualParseErrors, setBilingualParseErrors] = useState<string[]>([]);
  const [quizLangMode, setQuizLangMode] = useState<Record<string, 'EN' | 'HI'>>({});

  // Admin SET Paper & Explanation Key Inspector State
  const [inspectingSetQuiz, setInspectingSetQuiz] = useState<QuizItem | null>(null);
  const [inspectingSetCode, setInspectingSetCode] = useState<'SET-A' | 'SET-B' | 'SET-C' | 'SET-D'>('SET-A');

  const handleInspectSetKey = async (quiz: QuizItem) => {
    setInspectingSetQuiz(quiz);
    setInspectingSetCode('SET-A');
    if (!quizQuestions[quiz.id]) {
      setLoadingQuestions(quiz.id);
      try {
        const qList = await db.getQuizQuestions(quiz.id);
        setQuizQuestions(prev => ({ ...prev, [quiz.id]: qList || [] }));
      } catch (e) {
        console.error('Error loading questions for SET inspection:', e);
      } finally {
        setLoadingQuestions(null);
      }
    }
  };

  // Exams hierarchy state
  const [examsList, setExamsList] = useState<ExamData[]>([]);

  // Load Test Series list from DB
  const loadSeries = useCallback(async () => {
    setLoadingSeries(true);
    try {
      const examsHierarchy = await db.getExamsHierarchy(true);
      setExamsList(examsHierarchy || []);

      const list = await db.getTestSeries(true);
      setSeriesList(list || []);
      if (initialSeriesId) {
        const found = (list || []).find(s => s.id === initialSeriesId || s.slug === initialSeriesId);
        setSelectedSeriesId(found ? found.id : initialSeriesId);
      } else if (list && list.length > 0 && !selectedSeriesId) {
        setSelectedSeriesId(list[0].id);
      }
    } catch (err) {
      console.error('Failed loading test series:', err);
    } finally {
      setLoadingSeries(false);
    }
  }, [initialSeriesId, selectedSeriesId]);

  useEffect(() => {
    loadSeries();
  }, [loadSeries]);

  // Sync quizzes when selected test series changes
  useEffect(() => {
    if (!selectedSeriesId) {
      return;
    }
    let isSubscribed = true;
    setLoadingQuizzes(true);
    db.getTestSeriesQuizzes(selectedSeriesId)
      .then(list => {
        if (isSubscribed) setQuizzes(list || []);
      })
      .catch(() => { })
      .finally(() => {
        if (isSubscribed) setLoadingQuizzes(false);
      });

    return () => { isSubscribed = false; };
  }, [selectedSeriesId]);

  // Open modal to Add
  const handleOpenAddSeries = () => {
    setSeriesModalType('add');
    const newId = `ts-${Date.now()}`;
    const defaultEx = examsList[0] || { id: 'exam-bpsc', name: 'BPSC', code: 'BPSC', hasStages: true, stages: [{ id: 'stage-bpsc-prelims', name: 'Prelims' }] };
    const examName = defaultEx.code || defaultEx.name || 'bpsc';
    const initial = {
      ...BLANK_SERIES,
      id: newId,
      slug: `${examName.toLowerCase()}-test-series`,
      examId: defaultEx.id,
      exam: defaultEx.code || defaultEx.name || 'BPSC',
      stageId: defaultEx.hasStages && defaultEx.stages?.[0] ? defaultEx.stages[0].id : null,
      category: defaultEx.hasStages && defaultEx.stages?.[0] ? defaultEx.stages[0].name : 'Prelims'
    };
    setEditingSeries(initial);
    setHighlightsInput((initial.highlights || []).join('\n'));
    setIsSeriesModalOpen(true);
  };

  // Open modal to Edit
  const handleOpenEditSeries = (item: TestSeriesItem) => {
    setSeriesModalType('edit');
    const cleanLang = (item.language && item.language.toLowerCase().includes('hindi')) ? 'Hindi' : 'English';

    // Resolve matching examId from examsList by examId, code, or name
    const foundEx = (examsList.length > 0 ? examsList : [
      { id: 'exam-bpsc', name: 'BPSC', code: 'BPSC' },
      { id: 'exam-appsc', name: 'APPSC', code: 'APPSC' },
      { id: 'exam-apssb', name: 'APSSB', code: 'APSSB' }
    ]).find((ex: any) =>
      ex.id === item.examId ||
      ex.code?.toLowerCase() === (item.exam || '').toLowerCase() ||
      ex.name?.toLowerCase() === (item.exam || '').toLowerCase() ||
      (item.exam || '').toLowerCase().includes(ex.slug || '')
    );

    const resolvedExamId = foundEx ? foundEx.id : (item.examId || 'exam-bpsc');

    setEditingSeries({
      ...item,
      examId: resolvedExamId,
      language: cleanLang,
      medium: cleanLang
    });
    setHighlightsInput((item.highlights || []).join('\n'));
    setIsSeriesModalOpen(true);
  };

  // Save Series Program
  const handleSaveSeriesProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSeries.title || !editingSeries.id) {
      alert('Title and Program ID are required.');
      return;
    }
    setSavingSeries(true);

    const highlightsArray = highlightsInput
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const examCode = (editingSeries.exam || 'bpsc').toLowerCase().replace(/[^a-z0-9]/g, '');
    const categoryPart = (editingSeries.category || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const titlePart = editingSeries.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const generatedSlug = [examCode, categoryPart, titlePart].filter(Boolean).join('-');
    const finalSlug = (editingSeries.slug && editingSeries.slug.trim()) ? editingSeries.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : generatedSlug;

    const payload: TestSeriesItem = {
      id: editingSeries.id,
      title: editingSeries.title,
      title_hi: editingSeries.title_hi || undefined,
      slug: finalSlug,
      examId: editingSeries.examId || (examsList.find(e => e.name === editingSeries.exam || e.code === editingSeries.exam)?.id || examsList[0]?.id || 'exam-bpsc'),
      category: editingSeries.category || 'Prelims',
      exam: editingSeries.exam || 'BPSC',
      language: (editingSeries.language && editingSeries.language.toLowerCase().includes('hindi')) ? 'Hindi' : 'English',
      status: editingSeries.status || 'active',
      thumbnailUrl: editingSeries.thumbnailUrl || '',
      bannerUrl: editingSeries.bannerUrl || '',
      price: Number(editingSeries.price) || 0,
      discountedPrice: Number(editingSeries.discountedPrice) || 0,
      totalTests: Number(editingSeries.totalTests) || 0,
      totalQuestions: Number(editingSeries.totalQuestions) || 0,
      duration: editingSeries.duration || '6 Months Validity',
      description: editingSeries.description || '',
      description_hi: editingSeries.description_hi || undefined,
      highlights: highlightsArray,
      syllabus: editingSeries.syllabus || [],
      faq: editingSeries.faq || [],
      batchStartDate: editingSeries.batchStartDate || new Date().toISOString().split('T')[0],
      enrolledCount: Number(editingSeries.enrolledCount) > 0 
        ? Number(editingSeries.enrolledCount) 
        : (seriesList.find(s => s.id === editingSeries.id)?.enrolledCount || 0),
      validityDays: Number(editingSeries.validityDays) || 180,
      isPublished: editingSeries.isPublished !== false,
      displayOrder: Number(editingSeries.displayOrder) || 1,
      moduleCode: editingSeries.moduleCode || '',
      medium: editingSeries.medium || editingSeries.language || 'English',
      programDetails: editingSeries.programDetails || '',
      schedulePdfUrl: editingSeries.schedulePdfUrl || ''
    };

    try {
      setSeriesList(prev => {
        const idx = prev.findIndex(s => s.id === payload.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = payload;
          return next;
        }
        return [payload, ...prev];
      });

      await db.saveTestSeries(payload);
      setIsSeriesModalOpen(false);
      alert('Test Series Program saved successfully!');
    } catch (err) {
      console.error('Error saving test series program:', err);
      alert('Failed saving test series program.');
    } finally {
      setSavingSeries(false);
    }
  };

  // Toggle Published Switch
  const handleTogglePublishSeries = async (seriesItem: TestSeriesItem) => {
    const currentLive = seriesItem.isPublished !== false;
    const nextState = !currentLive;

    // Ensure mandatory backend fields (examId, title) exist
    const updated: TestSeriesItem = {
      ...seriesItem,
      examId: seriesItem.examId || (examsList.find(e => e.name === seriesItem.exam || e.code === seriesItem.exam)?.id || examsList[0]?.id || 'exam-bpsc'),
      isPublished: nextState
    };

    setSeriesList(prev => prev.map(s => s.id === seriesItem.id ? updated : s));
    try {
      await db.saveTestSeries(updated);
    } catch (err) {
      console.error('Failed toggling published state:', err);
    }
  };

  // Delete Test Series Program
  const handleDeleteSeriesProgram = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Test Series Program? This action cannot be undone.')) return;
    setSeriesList(prev => prev.filter(s => s.id !== id));
    await db.deleteTestSeries(id);
  };

  // ── Quiz & Question Handlers ───────────────────────────────────────────────
  const toggleQuiz = async (quizId: string) => {

    if (expandedQuiz === quizId) { setExpandedQuiz(null); return; }
    setExpandedQuiz(quizId);
    if (quizQuestions[quizId]) return;
    setLoadingQuestions(quizId);
    try {
      const list = await db.getQuizQuestions(quizId);
      setQuizQuestions(prev => ({ ...prev, [quizId]: list || [] }));
    } finally {
      setLoadingQuestions(null);
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeriesId) return;
    setSavingQuiz(true);
    try {
      const isEdit = !!(quizForm as any).id;
      const id = (quizForm as any).id || `quiz-${selectedSeriesId}-${Date.now()}`;
      const payload = { ...quizForm, id, courseId: selectedSeriesId };
      const success = await db.saveQuiz(payload);
      if (success) {
        setQuizzes(prev => {
          const idx = prev.findIndex(q => q.id === id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...payload };
            return next;
          }
          return [...prev, payload];
        });
        setShowQuizForm(false);
        setQuizForm({ ...BLANK_QUIZ });
      } else {
        alert('Failed to save quiz to database. Please check backend connection.');
      }
    } catch (err) {
      console.error('Error creating/updating quiz:', err);
      alert('Database error saving quiz.');
    } finally {
      setSavingQuiz(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Delete this quiz and ALL its questions?')) return;
    await db.deleteQuiz(quizId, selectedSeriesId);
    setQuizzes(prev => prev.filter(q => q.id !== quizId));
    if (expandedQuiz === quizId) setExpandedQuiz(null);
  };

  const handleCreateQuestion = async (e: React.FormEvent, quizId: string) => {
    e.preventDefault();
    setSavingQ(true);
    try {
      const id = `q-${quizId}-${Date.now()}`;
      const payload = { id, ...qForm, quizId };
      const success = await db.saveQuestion(payload);
      if (success) {
        setQuizQuestions(prev => ({
          ...prev,
          [quizId]: [...(prev[quizId] || []), payload],
        }));
        setShowQForm(null);
        setQForm({ ...BLANK_QUESTION });
      } else {
        alert('Failed saving question to database. Please check database connection.');
      }
    } catch (err) {
      console.error('Error creating question:', err);
      alert('Database error saving question.');
    } finally {
      setSavingQ(false);
    }
  };

  // Bulk Import State
  const [showBulkImportModal, setShowBulkImportModal] = useState<string | null>(null);
  const [bulkRawText, setBulkRawText] = useState<string>('');
  const [parsedBulkQuestions, setParsedBulkQuestions] = useState<Array<any>>([]);
  const [importingBulk, setImportingBulk] = useState(false);

  // Edit Question State
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);


  // Universal Multi-Format Parser (JSON, CSV, PDF/DOC/TXT Text Feeds)
  const handleParseBulkText = (textToParse: string) => {
    const raw = textToParse || bulkRawText;
    if (!raw.trim()) {
      alert('Please paste question text or upload a PDF/CSV/JSON/Text file first.');
      return;
    }

    const parsed: any[] = [];

    // 1. Try parsing JSON format
    if (raw.trim().startsWith('[') || raw.trim().startsWith('{')) {
      try {
        const jsonData = JSON.parse(raw.trim());
        const list = Array.isArray(jsonData) ? jsonData : [jsonData];
        for (const item of list) {
          if (item.questionText || item.question) {
            parsed.push({
              questionText: item.questionText || item.question,
              optionA: item.optionA || item.a || '',
              optionB: item.optionB || item.b || '',
              optionC: item.optionC || item.c || '',
              optionD: item.optionD || item.d || '',
              correctAnswer: (item.correctAnswer || item.answer || 'A').toString().toUpperCase().trim().charAt(0),
              explanation: item.explanation || item.solution || 'Refer to BPSC official syllabus notes.',
              marks: Number(item.marks) || 1,
              negativeMarks: Number(item.negativeMarks) || 0.33
            });
          }
        }
        if (parsed.length > 0) {
          setParsedBulkQuestions(parsed);
          return;
        }
      } catch (_) { }
    }

    // 2. Try parsing CSV format
    if (raw.includes(',') && (raw.toLowerCase().includes('option') || raw.toLowerCase().includes('question'))) {
      const lines = raw.split('\n').map((l: string) => l.trim()).filter(Boolean);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip CSV Header row
        if (i === 0 && line.toLowerCase().includes('question')) continue;
        const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c: string) => c.replace(/^"|"$/g, '').trim());
        if (cols.length >= 5) {
          parsed.push({
            questionText: cols[0],
            optionA: cols[1] || '',
            optionB: cols[2] || '',
            optionC: cols[3] || '',
            optionD: cols[4] || '',
            correctAnswer: cols[5] ? cols[5].toUpperCase().trim().charAt(0) : 'A',
            explanation: cols[6] || 'Refer to BPSC official syllabus notes.',
            marks: 1,
            negativeMarks: 0.33
          });
        }
      }
      if (parsed.length > 0) {
        setParsedBulkQuestions(parsed);
        return;
      }
    }

    // 3. Fallback: Intelligent Regex Parser for PDF / DOC / TXT Text Feeds
    const blocks = raw.split(/(?=\n\s*(?:Q\.?\s*\d+|\d+[\.\)])\s+)/i).filter((b: string) => b.trim().length > 10);

    for (const block of blocks) {
      // Extract Question Text before options (a)/(b)/(c)/(d) or (A)/(B)/(C)/(D)
      const qMatch = block.match(/^(?:Q\.?\s*\d+[\.\:\)]?|\d+[\.\:\)])?\s*([\s\S]+?)(?=\s*(?:[\(\[]?[A-Da-d1-4][\)\.\:\s]))/i);

      // Extract Options (a)/(b)/(c)/(d) or (A)/(B)/(C)/(D)
      const optAMatch = block.match(/[\(\[]?(?:A|a|1)[\)\.\:\s]+([\s\S]+?)(?=\s*[\(\[]?(?:B|b|2)[\)\.\:\s]|$)/i);
      const optBMatch = block.match(/[\(\[]?(?:B|b|2)[\)\.\:\s]+([\s\S]+?)(?=\s*[\(\[]?(?:C|c|3)[\)\.\:\s]|$)/i);
      const optCMatch = block.match(/[\(\[]?(?:C|c|3)[\)\.\:\s]+([\s\S]+?)(?=\s*[\(\[]?(?:D|d|4)[\)\.\:\s]|$)/i);
      const optDMatch = block.match(/[\(\[]?(?:D|d|4)[\)\.\:\s]+([\s\S]+?)(?=\s*(?:Ans|Answer|Correct|Explanation|Sol|Solution|----------|\n\s*\d+\.)[\:\s]|$)/i);

      const ansMatch = block.match(/(?:Ans|Answer|Correct|Option)[\:\s\-]*[\(\[]?([A-Da-d1-4])[\)\]]?/i);
      const expMatch = block.match(/(?:Explanation|Sol|Solution)[\:\s]+([\s\S]+)$/i);

      if (qMatch && optAMatch && optBMatch) {
        let ansLetter: 'A' | 'B' | 'C' | 'D' = 'A';
        if (ansMatch) {
          const matchedVal = ansMatch[1].toUpperCase();
          if (matchedVal === '1') ansLetter = 'A';
          else if (matchedVal === '2') ansLetter = 'B';
          else if (matchedVal === '3') ansLetter = 'C';
          else if (matchedVal === '4') ansLetter = 'D';
          else if (['A', 'B', 'C', 'D'].includes(matchedVal)) ansLetter = matchedVal as any;
        }

        parsed.push(sanitizeAndRepairQuestion({
          questionText: qMatch[1].trim().replace(/^(?:Q\.?\s*\d+[\.\:\)]?|\d+[\.\:\)])\s*/i, ''),
          optionA: optAMatch[1].trim(),
          optionB: optBMatch[1].trim(),
          optionC: optCMatch ? optCMatch[1].trim() : '',
          optionD: optDMatch ? optDMatch[1].trim() : '',
          correctAnswer: ansLetter,
          explanation: expMatch ? expMatch[1].trim() : 'Refer to official syllabus notes.',
          marks: 1,
          negativeMarks: 0.33
        }));
      }
    }

    if (parsed.length === 0) {
      alert('Could not detect standard MCQs. Please ensure questions follow standard format or upload a CSV/JSON/TXT file.\n\nExample:\n1. Question text\n(A) Option 1\n(B) Option 2\n(C) Option 3\n(D) Option 4\nAns: A\nExplanation: ...');
    } else {
      setParsedBulkQuestions(parsed);
    }
  };

  // Handle File Upload Read (PDF, DOCX, DOC, TXT, JSON, CSV, HTML, Images)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Send file directly to Universal Document Import Engine (/api/document-imports)
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', file.name);

    try {
      const res = await fetch(`${BACKEND_URL}/api/document-imports`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data && data.success && data.import) {
        // Fetch Extracted Staged QnAs from Universal Engine
        const qnasRes = await fetch(`${BACKEND_URL}/api/document-imports/${data.import.id}/qnas`);
        const qnasData = await qnasRes.json();

        if (qnasData && Array.isArray(qnasData.qnas) && qnasData.qnas.length > 0) {
          const formatted = qnasData.qnas.map((q: any) => {
            let parsed: any = {};
            try {
              parsed = typeof q.parsedQnaJson === 'string' ? JSON.parse(q.parsedQnaJson) : q.parsedQnaJson || {};
            } catch (_) { }

            const textEn = parsed.question?.versions?.find((v: any) => v.language === 'en')?.text || q.questionText || '';
            const textHi = parsed.question?.versions?.find((v: any) => v.language === 'hi')?.text || '';

            const optsMap: Record<string, string> = {};
            const optsMapHi: Record<string, string> = {};
            (parsed.options || []).forEach((opt: any) => {
              const lbl = (opt.label || '').toUpperCase();
              optsMap[lbl] = opt.versions?.find((v: any) => v.language === 'en')?.text || opt.versions?.[0]?.text || '';
              optsMapHi[lbl] = opt.versions?.find((v: any) => v.language === 'hi')?.text || '';
            });

            return {
              questionText: textEn,
              optionA: optsMap['A'] || '',
              optionB: optsMap['B'] || '',
              optionC: optsMap['C'] || '',
              optionD: optsMap['D'] || '',
              optionE: optsMap['E'] || '',
              correctAnswer: q.correctAnswer || parsed.answer?.values?.[0] || 'A',
              explanation: parsed.explanation?.versions?.find((v: any) => v.language === 'en')?.text || q.explanation || '',
              questionTextHi: textHi,
              optionAHi: optsMapHi['A'] || '',
              optionBHi: optsMapHi['B'] || '',
              optionCHi: optsMapHi['C'] || '',
              optionDHi: optsMapHi['D'] || '',
              optionEHi: optsMapHi['E'] || '',
              explanationHi: parsed.explanation?.versions?.find((v: any) => v.language === 'hi')?.text || '',
              questionImageUrl: parsed.question?.imageUrl || null,
              marks: 1,
              negativeMarks: 0.33
            };
          });

          setParsedBulkQuestions(formatted);
          alert(`✓ Successfully extracted ${formatted.length} questions from '${file.name}' via Universal Document Engine!`);
          return;
        }
      }
    } catch (err: any) {
      console.warn('Universal document engine fallback:', err);
    }

    // Fallback for local text files
    if (!file.name.toLowerCase().endsWith('.pdf') && !file.name.toLowerCase().endsWith('.docx') && !file.name.toLowerCase().endsWith('.doc')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          setBulkRawText(content);
          handleParseBulkText(content);
        }
      };
      reader.readAsText(file);
    }
  };

  // Submit All Bulk Parsed Questions to DB
  const handleImportParsedQuestions = async (quizId: string) => {
    if (parsedBulkQuestions.length === 0) return;
    setImportingBulk(true);

    try {
      const createdItems = parsedBulkQuestions.map((q: any) => ({
        id: `q-${quizId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        ...q,
        quizId
      }));


      const success = await db.saveBulkQuestions(quizId, createdItems);

      if (success) {
        setQuizQuestions(prev => ({
          ...prev,
          [quizId]: [...(prev[quizId] || []), ...createdItems],
        }));

        alert(`Successfully imported ${createdItems.length} questions into the Quiz Question Bank!`);
        setShowBulkImportModal(null);
        setBulkRawText('');
        setParsedBulkQuestions([]);
      } else {
        alert('Database error: Questions could not be persisted to server MySQL database.');
      }
    } catch (err) {
      console.error('Error importing bulk questions:', err);
      alert('Failed importing questions to database. Please check connection.');
    } finally {
      setImportingBulk(false);
    }
  };

  // Save Edit Question Changes
  const handleSaveEditQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion || !editingQuestion.quizId) return;

    await db.saveQuestion(editingQuestion);
    setQuizQuestions(prev => ({
      ...prev,
      [editingQuestion.quizId]: (prev[editingQuestion.quizId] || []).map(q => q.id === editingQuestion.id ? editingQuestion : q)
    }));
    setEditingQuestion(null);
    alert('Question updated successfully!');
  };

  // Export Question Bank to JSON
  const handleExportQuestions = (quizId: string, quizTitle: string) => {
    const qs = quizQuestions[quizId] || [];
    if (qs.length === 0) {
      alert('No questions in this quiz to export.');
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(qs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${quizTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_questions.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDeleteQuestion = async (quizId: string, questionId: string) => {
    if (!confirm('Delete this question?')) return;
    await db.deleteQuestion(questionId, quizId);
    setQuizQuestions(prev => ({
      ...prev,
      [quizId]: (prev[quizId] || []).filter(q => q.id !== questionId),
    }));
  };




  return (
    <div className="space-y-8 font-body">
      {/* ── Sub Navigation Bar ────────────────────────────────────────────── */}
      {!initialSeriesId && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xs">
          <div>
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              TEST SERIES CMS WORKBENCH
            </span>
            <h2 className="text-xl font-heading font-black text-[var(--text-color)] mt-1">
              Test Series & Mock Exam Manager
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage Test Series programs, syllabus structures, pricing, published status, quizzes, and question banks.
            </p>
          </div>

          {/* Sub-tab Switcher */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-[var(--card-border)] shrink-0">
            <button
              type="button"
              onClick={() => setSubTab('series')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${subTab === 'series'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-500 hover:text-[var(--text-color)]'
                }`}
            >
              Programs ({seriesList.length})
            </button>
            <button
              type="button"
              onClick={() => setSubTab('exams')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${subTab === 'exams'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-500 hover:text-[var(--text-color)]'
                }`}
            >
              Exams & Logos ({examsList.length})
            </button>
          </div>
        </div>
      )}

      {/* ── SUB-TAB 0: EXAMS & LOGOS MANAGEMENT ───────────────────────────── */}
      {subTab === 'exams' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-heading font-black text-base text-[var(--text-color)] uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>Isolated State Exam Categories & Custom Logos</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Create exam categories, add custom logos, and define exam stage structure independently for the Test Series System.</p>
            </div>
            <button
              type="button"
              onClick={() => setEditingExam({
                id: `exam-${Date.now()}`,
                name: '',
                code: '',
                slug: '',
                logoUrl: '',
                description: '',
                hasStages: true,
                displayOrder: (examsList.length || 0) + 1,
                isActive: true,
                stages: [
                  { id: `stage-${Date.now()}-1`, examId: `exam-${Date.now()}`, name: 'Prelims', slug: 'prelims', sortOrder: 1, isActive: true },
                  { id: `stage-${Date.now()}-2`, examId: `exam-${Date.now()}`, name: 'Mains', slug: 'mains', sortOrder: 2, isActive: true }
                ]
              })}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Exam Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {examsList.map((ex: any, idx: number) => (
              <div
                key={ex.id}
                className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 space-y-4 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="w-16 h-16 rounded-2xl bg-white text-amber-600 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-heading font-black text-lg tracking-tight shadow-sm overflow-hidden p-1.5 shrink-0">
                    {ex.logoUrl ? (
                      <img src={ex.logoUrl} alt={ex.name} className="w-full h-full object-contain drop-shadow-xs" />
                    ) : (
                      <span className="text-amber-600 font-extrabold">{ex.code || ex.name}</span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 bg-amber-50/80 dark:bg-amber-950/40 text-slate-700 dark:text-slate-200 rounded-full border border-amber-200/50 dark:border-amber-500/20">
                    {ex.hasStages ? 'STAGE WISE' : 'DIRECT SERIES'}
                  </span>
                </div>

                <div>
                  <h4 className="font-heading font-black text-lg text-[var(--text-color)]">{ex.name}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{ex.description || 'State Civil Services Exam'}</p>
                </div>

                <div className="pt-2 border-t border-[var(--card-border)] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-black px-2 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-500/20">
                      #{ex.displayOrder || idx + 1}
                    </span>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={async () => {
                        if (idx === 0) return;
                        const prevEx = examsList[idx - 1];
                        const currEx = ex;
                        const orderA = currEx.displayOrder || idx + 1;
                        const orderB = prevEx.displayOrder || idx;
                        const newOrderCurr = Math.min(orderA, orderB) > 1 ? Math.min(orderA, orderB) - 1 : 1;
                        const newOrderPrev = newOrderCurr + 1;

                        const updatedList = [...examsList];
                        updatedList[idx] = { ...currEx, displayOrder: newOrderCurr };
                        updatedList[idx - 1] = { ...prevEx, displayOrder: newOrderPrev };
                        updatedList.sort((a, b) => (Number(a.displayOrder || 1) - Number(b.displayOrder || 1)));

                        setExamsList(updatedList);
                        await db.saveExam({ ...currEx, displayOrder: newOrderCurr });
                        await db.saveExam({ ...prevEx, displayOrder: newOrderPrev });
                      }}
                      className={`p-1.5 rounded-lg border transition-colors ${idx === 0 ? 'text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed' : 'text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'}`}
                      title="Move Left / Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === examsList.length - 1}
                      onClick={async () => {
                        if (idx === examsList.length - 1) return;
                        const nextEx = examsList[idx + 1];
                        const currEx = ex;
                        const orderA = currEx.displayOrder || idx + 1;
                        const orderB = nextEx.displayOrder || idx + 2;
                        const newOrderCurr = Math.max(orderA, orderB);
                        const newOrderNext = Math.min(orderA, orderB);

                        const updatedList = [...examsList];
                        updatedList[idx] = { ...currEx, displayOrder: newOrderCurr };
                        updatedList[idx + 1] = { ...nextEx, displayOrder: newOrderNext };
                        updatedList.sort((a, b) => (Number(a.displayOrder || 1) - Number(b.displayOrder || 1)));

                        setExamsList(updatedList);
                        await db.saveExam({ ...currEx, displayOrder: newOrderCurr });
                        await db.saveExam({ ...nextEx, displayOrder: newOrderNext });
                      }}
                      className={`p-1.5 rounded-lg border transition-colors ${idx === examsList.length - 1 ? 'text-slate-300 border-slate-200 dark:border-slate-800 cursor-not-allowed' : 'text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer'}`}
                      title="Move Right / Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingExam({ ...ex })}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm(`Are you sure you want to delete the exam folder "${ex.name}"?`)) return;
                        setExamsList(prev => prev.filter(item => item.id !== ex.id));
                        await db.deleteExam(ex.id);
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                      title="Delete Exam Folder"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SUB-TAB 1: TEST SERIES PROGRAMS MANAGEMENT ────────────────────── */}
      {subTab === 'series' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-heading font-black text-base text-[var(--text-color)] uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-500" />
              <span>Published & Draft Test Series Programs ({seriesList.length})</span>
            </h3>

            <button
              type="button"
              onClick={handleOpenAddSeries}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Test Series Program</span>
            </button>
          </div>

          {loadingSeries ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map(i => <div key={i} className="h-64 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] animate-pulse" />)}
            </div>
          ) : seriesList.length === 0 ? (
            <div className="p-12 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] text-center space-y-3">
              <FileText className="w-12 h-12 text-slate-400 mx-auto" />
              <h4 className="font-heading font-bold text-sm text-[var(--text-color)]">No Test Series Programs Created Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click &quot;Create Test Series Program&quot; above to publish a new test series for BPSC Prelims or Mains.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {seriesList.map((series) => (
                <div
                  key={series.id}
                  className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl overflow-hidden flex flex-col justify-between space-y-6 shadow-xs hover:shadow-md transition-all relative"
                >
                  {/* Thumbnail Cover Image Header */}
                  {series.thumbnailUrl && (
                    <div className="w-full h-36 relative bg-slate-900 overflow-hidden">
                      <img
                        src={series.thumbnailUrl}
                        alt={series.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    </div>
                  )}

                  <div className="p-6 space-y-4">
                    {/* Top Badges */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[9px] font-black uppercase rounded-lg">
                          {series.category} • {series.exam}
                        </span>
                        {series.title_hi || series.language === 'Bilingual' || (series.medium && series.medium.includes('Bilingual')) ? (
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[9px] font-black rounded-lg">
                            🌐 Bilingual (Both)
                          </span>
                        ) : series.language === 'Hindi' || series.medium === 'Hindi' ? (
                          <span className="px-2 py-0.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30 text-[9px] font-black rounded-lg">
                            🇮🇳 Hindi Only
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-[9px] font-black rounded-lg">
                            🇬🇧 EN (AI Hindi)
                          </span>
                        )}
                      </div>

                      {/* Published Toggle Switch */}
                      {(() => {
                        const isLive = series.isPublished !== false;
                        return (
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-extrabold uppercase ${isLive ? 'text-emerald-500' : 'text-slate-400'}`}>
                              {isLive ? 'Live' : 'Draft'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleTogglePublishSeries(series)}
                              className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${isLive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                                }`}
                            >
                              <div className={`w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform ${isLive ? 'translate-x-4' : 'translate-x-0'
                                }`} />
                            </button>
                          </div>
                        );
                      })()}

                    </div>

                    {/* Title & Slug */}
                    <div className="space-y-1">
                      <h4 className="font-heading font-extrabold text-base text-[var(--text-color)] leading-snug">
                        {series.title}
                      </h4>
                      {series.title_hi && (
                        <p className="text-[11px] font-bold text-amber-500 leading-snug">
                          🇮🇳 {series.title_hi}
                        </p>
                      )}
                      <p className="text-[10px] font-mono text-slate-400">
                        /test-series/{series.slug}
                      </p>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {series.description}
                    </p>

                    {/* Specs Pills */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500 pt-2 border-t border-[var(--card-border)]">
                      <div>Mocks: <span className="text-[var(--text-color)]">{series.totalTests} Tests</span></div>
                      <div>Questions: <span className="text-[var(--text-color)]">{series.totalQuestions} Qs</span></div>
                      <div>Fee: <span className="text-emerald-500 font-extrabold">₹{series.discountedPrice || series.price}</span></div>
                      <div>Validity: <span className="text-[var(--text-color)]">{series.duration}</span></div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 border-t border-[var(--card-border)] flex items-center justify-between gap-2">
                    {/* <a
                      href={`/test-series/${series.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-[var(--text-color)] font-bold rounded-xl text-[10px] flex items-center gap-1 hover:bg-slate-200 transition-colors"
                    >
                    </a> */}

                    <div className="flex items-center gap-2">
                      <a
                        href={`/admin/test-series/${series.id}`}
                        className="px-3 py-1.5 bg-amber-500 text-slate-950 hover:bg-amber-600 font-bold rounded-xl text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Manage Program</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleOpenEditSeries(series)}
                        className="px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 font-bold rounded-xl text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSeriesProgram(series.id)}
                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                        title="Delete program"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SUB-TAB 2: QUIZZES & QUESTION BANK MANAGER ─────────────────────── */}
      {subTab === 'quizzes' && (
        <div className="space-y-6">
          {/* Select Target Test Series Program (Shown only on global tab) */}
          {!initialSeriesId && (
            <div className="bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-xs space-y-3">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Select Test Series Program to Manage Quizzes
              </label>
              <select
                value={selectedSeriesId}
                onChange={e => setSelectedSeriesId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] text-[var(--text-color)] text-xs font-bold rounded-2xl outline-none cursor-pointer"
              >
                {seriesList.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.category} • {s.exam})
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedSeriesId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-heading font-black text-base text-[var(--text-color)]">
                    Quizzes & Mock Papers
                  </h4>
                  <p className="text-xs text-slate-500">
                    {quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''} configured for this test series program.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBilingualPdfModal(true);
                      setBilingualReport(null);
                      setPreviewQuestionIndex(0);
                      setBilingualQuizTitle('');
                      setBilingualQuizDescription('');
                      setBilingualParseMode('text');
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl transition-all shadow-sm cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-amber-300" />
                    <span>Import Document</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowBilingualPdfModal(true);
                      setBilingualReport(null);
                      setPreviewQuestionIndex(0);
                      setBilingualQuizTitle('');
                      setBilingualQuizDescription('');
                      setBilingualParseMode('excel');
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-2xl transition-all shadow-sm cursor-pointer"
                  >
                    <Layers className="w-4 h-4 text-emerald-300" />
                    <span>Import from Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setShowQuizForm(true); setQuizForm({ ...BLANK_QUIZ }); }}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-2xl transition-all shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Mock Quiz
                  </button>
                </div>
              </div>

              {loadingQuizzes ? (
                <div className="space-y-3">
                  {[1, 2].map(i => <div key={i} className="h-20 bg-[var(--card-bg)] rounded-2xl animate-pulse border border-[var(--card-border)]" />)}
                </div>
              ) : quizzes.length === 0 ? (
                <div className="p-8 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] text-center space-y-2">
                  <FileText className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="text-slate-500 text-xs font-semibold">No quizzes added yet. Click &quot;Add Mock Quiz&quot; above.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {quizzes.map(quiz => (
                    <div key={quiz.id} className="bg-[var(--card-bg)] rounded-3xl border border-[var(--card-border)] shadow-xs overflow-hidden">
                      {/* Quiz Header Bar */}
                      <div className="flex items-center justify-between p-5">
                        <button
                          type="button"
                          onClick={() => toggleQuiz(quiz.id)}
                          className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer"
                        >
                          <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-500">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-[var(--text-color)] truncate">{quiz.title}</p>
                            <p className="text-[10px] text-slate-400 font-bold">
                              {quiz.timeLimitMins ? `${quiz.timeLimitMins} mins` : 'No time limit'}
                            </p>
                          </div>
                          <div className="ml-2 shrink-0">
                            {expandedQuiz === quiz.id ? <ChevronDown className="w-4 h-4 text-amber-500" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                          </div>
                        </button>
                        <div className="flex items-center gap-1.5 ml-3 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleInspectSetKey(quiz)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold rounded-xl text-[10px] cursor-pointer"
                            title="Inspect SET Papers (SET A, B, C, D) & Solution Explanations Key"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span>SET Papers & Explanations</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setQuizForm({
                                id: quiz.id,
                                title: quiz.title,
                                timeLimitMins: quiz.timeLimitMins || 60,
                                passingScore: quiz.passingScore || 40,
                                description: quiz.description || '',
                                setMode: (quiz as any).setMode || 'single',
                                defaultSet: (quiz as any).defaultSet || 'SET-A',
                                availableSets: (quiz as any).availableSets || ['SET-A', 'SET-B', 'SET-C', 'SET-D']
                              });
                              setShowQuizForm(true);
                            }}
                            className="p-2 rounded-xl text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer"
                            title="Edit quiz duration & passing score"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuiz(quiz.id)}
                            className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Delete quiz"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Question List Expandable Drawer */}
                      {expandedQuiz === quiz.id && (
                        <div className="border-t border-[var(--card-border)] p-5 space-y-4 bg-slate-50/50 dark:bg-slate-900/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                Questions Bank ({(quizQuestions[quiz.id] || []).length})
                              </p>
                              {/* Language View Toggle */}
                              <div className="flex items-center p-0.5 bg-slate-200 dark:bg-slate-800 rounded-lg text-[10px] font-bold">
                                <button
                                  type="button"
                                  onClick={() => setQuizLangMode(prev => ({ ...prev, [quiz.id]: 'EN' }))}
                                  className={`px-2 py-0.5 rounded-md cursor-pointer transition-all ${(quizLangMode[quiz.id] || 'EN') === 'EN'
                                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                                      : 'text-slate-400 hover:text-[var(--text-color)]'
                                    }`}
                                >
                                  EN
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setQuizLangMode(prev => ({ ...prev, [quiz.id]: 'HI' }))}
                                  className={`px-2 py-0.5 rounded-md cursor-pointer transition-all ${quizLangMode[quiz.id] === 'HI'
                                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                                      : 'text-slate-400 hover:text-[var(--text-color)]'
                                    }`}
                                >
                                  हिन्दी (HI)
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleExportQuestions(quiz.id, quiz.title)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 text-slate-300 text-[10px] font-bold rounded-xl hover:bg-slate-700 cursor-pointer"
                                title="Export Question Bank to JSON"
                              >
                                Export JSON
                              </button>

                              <button
                                type="button"
                                onClick={() => { setShowBulkImportModal(quiz.id); setParsedBulkQuestions([]); setBulkRawText(''); }}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-extrabold rounded-xl shadow-xs transition-all cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5 text-amber-300" /> Bulk Import PDF / Text
                              </button>

                              <button
                                type="button"
                                onClick={() => { setShowQForm(quiz.id); setQForm({ ...BLANK_QUESTION }); }}
                                className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-slate-950 text-[10px] font-black rounded-xl hover:bg-amber-600 transition-all cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add Question
                              </button>
                            </div>
                          </div>

                          {loadingQuestions === quiz.id ? (
                            <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                          ) : (quizQuestions[quiz.id] || []).length === 0 ? (
                            <p className="text-xs text-slate-400 font-semibold text-center py-4">No questions added to this quiz yet.</p>
                          ) : (
                            <div className="space-y-3">
                              {(quizQuestions[quiz.id] || []).map((q, idx) => {
                                const isHi = quizLangMode[quiz.id] === 'HI';
                                const prompt = isHi && q.questionTextHi ? q.questionTextHi : q.questionText;
                                const optA = isHi && q.optionAHi ? q.optionAHi : q.optionA;
                                const optB = isHi && q.optionBHi ? q.optionBHi : q.optionB;
                                const optC = isHi && q.optionCHi ? q.optionCHi : q.optionC;
                                const optD = isHi && q.optionDHi ? q.optionDHi : q.optionD;
                                const optE = isHi && q.optionEHi ? q.optionEHi : q.optionE;
                                const exp = isHi && q.explanationHi ? q.explanationHi : q.explanation;
                                const optsMap = { A: optA, B: optB, C: optC, D: optD, E: optE };

                                return (
                                  <div key={q.id} className="flex items-start gap-3 p-4 bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)]">
                                    <span className="w-6 h-6 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                                      {idx + 1}
                                    </span>
                                    <div className="flex-1 min-w-0 space-y-2">
                                      <p className="text-xs text-[var(--text-color)] font-bold whitespace-pre-wrap leading-relaxed">{prompt}</p>

                                      {(q.questionImageUrl || q.imageUrl) && (
                                        <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded-xl border border-[var(--card-border)] max-w-md">
                                          <img
                                            src={q.questionImageUrl || q.imageUrl}
                                            alt="Question Visual"
                                            className="max-h-52 max-w-full object-contain rounded-lg shadow-xs"
                                          />
                                        </div>
                                      )}
                                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-medium">
                                        {(['A', 'B', 'C', 'D', 'E'] as const).map(opt => optsMap[opt] ? (
                                          <span key={opt} className={`flex items-center gap-1 p-1.5 rounded-lg border ${q.correctAnswer === opt ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-bold' : 'border-transparent'
                                            }`}>
                                            {q.correctAnswer === opt && <Check className="w-3 h-3 text-emerald-500 shrink-0" />}
                                            <span className="font-bold">{opt}.</span> {stripOptionPrefix(optsMap[opt] || '')}
                                          </span>
                                        ) : null)}
                                      </div>
                                      {exp && (
                                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium bg-amber-500/5 p-2 rounded-xl border border-amber-500/10">
                                          <strong>{isHi ? 'व्याख्या:' : 'Explanation:'}</strong> {exp}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => setEditingQuestion({ ...q })}
                                        className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-colors shrink-0 cursor-pointer"
                                        title="Edit question"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteQuestion(quiz.id, q.id)}
                                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors shrink-0 cursor-pointer"
                                        title="Delete question"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}


                          {/* Add Question Form Modal inline */}
                          {showQForm === quiz.id && (
                            <form onSubmit={e => handleCreateQuestion(e, quiz.id)} className="p-5 bg-[var(--card-bg)] rounded-2xl border border-amber-500/30 space-y-4 shadow-md">
                              <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-2">
                                <p className="text-xs font-black uppercase text-amber-500 tracking-wider">New MCQ Question</p>
                                <button type="button" onClick={() => setShowQForm(null)} className="p-1 rounded-lg text-slate-400 hover:text-[var(--text-color)]"><X className="w-4 h-4" /></button>
                              </div>

                              <div>
                                <label className="text-[10px] font-bold uppercase text-slate-400">Question Prompt *</label>
                                <textarea
                                  required
                                  value={qForm.questionText}
                                  onChange={e => setQForm({ ...qForm, questionText: e.target.value })}
                                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] text-[var(--text-color)] text-xs rounded-xl outline-none min-h-16 mt-1"
                                  placeholder="Enter the question text..."
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {(['A', 'B', 'C', 'D', 'E'] as const).map(opt => (
                                  <div key={opt}>
                                    <label className="text-[10px] font-bold uppercase text-slate-400">Option {opt} {opt !== 'E' ? '*' : ''}</label>
                                    <input
                                      required={opt !== 'E'}
                                      type="text"
                                      value={qForm[`option${opt}` as keyof typeof qForm] as string}
                                      onChange={e => setQForm({ ...qForm, [`option${opt}`]: e.target.value })}
                                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] text-[var(--text-color)] text-xs rounded-xl outline-none mt-1"
                                      placeholder={`Option ${opt}`}
                                    />
                                  </div>
                                ))}
                              </div>

                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <label className="text-[10px] font-bold uppercase text-slate-400">Correct Answer *</label>
                                  <select
                                    value={qForm.correctAnswer}
                                    onChange={e => setQForm({ ...qForm, correctAnswer: e.target.value as any })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] text-[var(--text-color)] text-xs rounded-xl outline-none mt-1 font-bold cursor-pointer"
                                  >
                                    {(['A', 'B', 'C', 'D', 'E'] as const).map(o => <option key={o} value={o}>Option {o}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold uppercase text-slate-400">Marks</label>
                                  <input
                                    type="number" step="0.5" min="0.5"
                                    value={qForm.marks}
                                    onChange={e => setQForm({ ...qForm, marks: Number(e.target.value) })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] text-[var(--text-color)] text-xs rounded-xl outline-none mt-1"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold uppercase text-slate-400">Negative Penalty</label>
                                  <input
                                    type="number" step="0.01" min="0"
                                    value={qForm.negativeMarks}
                                    onChange={e => setQForm({ ...qForm, negativeMarks: Number(e.target.value) })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] text-[var(--text-color)] text-xs rounded-xl outline-none mt-1"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-[10px] font-bold uppercase text-slate-400">Explanation Note</label>
                                <textarea
                                  value={qForm.explanation}
                                  onChange={e => setQForm({ ...qForm, explanation: e.target.value })}
                                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] text-[var(--text-color)] text-xs rounded-xl outline-none min-h-12 mt-1"
                                  placeholder="Detailed solution explanation shown after quiz submission..."
                                />
                              </div>

                              <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowQForm(null)} className="px-4 py-2 border border-[var(--card-border)] text-slate-400 text-xs font-bold rounded-xl">Cancel</button>
                                <button type="submit" disabled={savingQ} className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl cursor-pointer">
                                  {savingQ ? 'Saving…' : 'Save Question'}
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── CREATE / EDIT TEST SERIES PROGRAM MODAL ───────────────────────── */}
      {isSeriesModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <form
            onSubmit={handleSaveSeriesProgram}
            className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Test Series CMS</span>
                <h3 className="font-heading font-black text-xl text-[var(--text-color)] mt-0.5">
                  {seriesModalType === 'add' ? 'Create New Test Series Program' : 'Edit Test Series Program'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSeriesModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-[var(--text-color)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-bold">
              {/* Program Title */}
              <div>
                <label className="block text-slate-400 mb-1">Test Series Title (English) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pre Full Length Series 2026"
                  value={editingSeries.title || ''}
                  onChange={e => {
                    const newTitle = e.target.value;
                    const examCode = (editingSeries.exam || 'bpsc').toLowerCase().replace(/[^a-z0-9]/g, '');
                    const categoryPart = (editingSeries.category || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                    const titlePart = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                    const autoSlug = [examCode, categoryPart, titlePart].filter(Boolean).join('-');
                    setEditingSeries({
                      ...editingSeries,
                      title: newTitle,
                      slug: autoSlug
                    });
                  }}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] text-[var(--text-color)] rounded-xl outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-amber-500 mb-1 font-bold">Test Series Title (Hindi - हिन्दी optional)</label>
                <input
                  type="text"
                  placeholder="Enter Hindi title ( उदा. 71वीं बीपीएससी प्रारंभिक परीक्षा ऑल इंडिया टेस्ट सीरीज)..."
                  value={editingSeries.title_hi || ''}
                  onChange={e => setEditingSeries({ ...editingSeries, title_hi: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-amber-500/40 text-[var(--text-color)] rounded-xl outline-none font-bold focus:border-amber-500"
                />
              </div>

              {/* Editable URL Slug */}
              <div>
                <label className="block text-slate-400 mb-1">Canonical URL Slug (/test-series/program/slug)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. appsc-prelims-full-length"
                  value={editingSeries.slug || ''}
                  onChange={e => setEditingSeries({ ...editingSeries, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] text-[var(--text-color)] rounded-xl outline-none font-mono text-xs font-bold"
                />
              </div>

              {/* Exam & Stage Dynamic Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Target Exam *</label>
                  <select
                    value={editingSeries.examId || (examsList[0]?.id || 'exam-bpsc')}
                    onChange={e => {
                      const selectedExId = e.target.value;
                      const selectedExObj = (examsList.length > 0 ? examsList : [
                        { id: 'exam-bpsc', name: 'BPSC', code: 'BPSC', hasStages: true, stages: [{ id: 'stage-bpsc-prelims', name: 'Prelims' }, { id: 'stage-bpsc-mains', name: 'Mains' }] },
                        { id: 'exam-appsc', name: 'APPSC', code: 'APPSC', hasStages: true, stages: [{ id: 'stage-appsc-prelims', name: 'Prelims' }, { id: 'stage-appsc-mains', name: 'Mains' }] },
                        { id: 'exam-apssb', name: 'APSSB', code: 'APSSB', hasStages: false, stages: [] }
                      ]).find(ex => ex.id === selectedExId);
                      const defaultStageId = selectedExObj?.hasStages && selectedExObj.stages?.[0] ? selectedExObj.stages[0].id : null;
                      const defaultCategory = selectedExObj?.hasStages && selectedExObj.stages?.[0] ? selectedExObj.stages[0].name : null;
                      const newExamCode = selectedExObj?.code || selectedExObj?.name || 'bpsc';
                      const categoryPart = (defaultCategory || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                      const titlePart = (editingSeries.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                      const autoSlug = [newExamCode.toLowerCase().replace(/[^a-z0-9]/g, ''), categoryPart, titlePart].filter(Boolean).join('-');
                      setEditingSeries({
                        ...editingSeries,
                        examId: selectedExId,
                        exam: selectedExObj?.code || selectedExObj?.name || 'BPSC',
                        stageId: defaultStageId,
                        category: defaultCategory,
                        slug: autoSlug
                      });
                    }}
                    className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] text-[var(--text-color)] rounded-xl outline-none font-bold cursor-pointer"
                  >
                    {(examsList.length > 0 ? examsList : [
                      { id: 'exam-bpsc', name: 'BPSC', code: 'BPSC', hasStages: true },
                      { id: 'exam-appsc', name: 'APPSC', code: 'APPSC', hasStages: true },
                      { id: 'exam-apssb', name: 'APSSB', code: 'APSSB', hasStages: false }
                    ]).map((ex: any) => (
                      <option key={ex.id} value={ex.id}>{ex.name} ({ex.hasStages ? 'Has Stages' : 'Direct Series'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Exam Stage</label>
                  {(() => {
                    const effectiveList = examsList.length > 0 ? examsList : [
                      { id: 'exam-bpsc', name: 'BPSC', code: 'BPSC', hasStages: true, stages: [{ id: 'stage-bpsc-prelims', name: 'Prelims' }, { id: 'stage-bpsc-mains', name: 'Mains' }] },
                      { id: 'exam-appsc', name: 'APPSC', code: 'APPSC', hasStages: true, stages: [{ id: 'stage-appsc-prelims', name: 'Prelims' }, { id: 'stage-appsc-mains', name: 'Mains' }] },
                      { id: 'exam-apssb', name: 'APSSB', code: 'APSSB', hasStages: false, stages: [] }
                    ];
                    const currentEx = effectiveList.find((ex: any) => ex.id === editingSeries.examId) || effectiveList[0];
                    if (!currentEx || !currentEx.hasStages || !currentEx.stages || currentEx.stages.length === 0) {
                      return (
                        <div className="px-3 py-3 bg-slate-100 dark:bg-slate-800 border border-[var(--card-border)] text-slate-400 rounded-xl font-bold">
                          Not Applicable (Direct Series)
                        </div>
                      );
                    }
                    return (
                      <select
                        value={editingSeries.stageId || (currentEx.stages[0]?.id || '')}
                        onChange={e => {
                          const stgId = e.target.value;
                          const stgObj = currentEx.stages?.find((s: any) => s.id === stgId);
                          setEditingSeries({
                            ...editingSeries,
                            stageId: stgId,
                            category: stgObj?.name || 'Prelims'
                          });
                        }}
                        className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] text-[var(--text-color)] rounded-xl outline-none font-bold cursor-pointer"
                      >
                        {currentEx.stages.map((stg: any) => (
                          <option key={stg.id} value={stg.id}>{stg.name} Stage</option>
                        ))}
                      </select>
                    );
                  })()}
                </div>
              </div>

              {/* Language & Publish Target Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Medium / Language *</label>
                  <select
                    value={editingSeries.language || editingSeries.medium || 'Bilingual'}
                    onChange={e => setEditingSeries({ ...editingSeries, language: e.target.value as any, medium: e.target.value })}
                    className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] text-[var(--text-color)] rounded-xl outline-none font-bold cursor-pointer"
                  >
                    <option value="Bilingual">🌐 Bilingual (English & Hindi)</option>
                    <option value="English">🇬🇧 English Medium Only</option>
                    <option value="Hindi">🇮🇳 Hindi Medium Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-amber-500 mb-1 font-extrabold uppercase text-[10px] tracking-wider">Where Do You Want To Publish?</label>
                  <select
                    value={editingSeries.publish_target || 'both'}
                    onChange={e => setEditingSeries({ ...editingSeries, publish_target: e.target.value as any })}
                    className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-900 border border-amber-500/40 text-[var(--text-color)] rounded-xl outline-none font-bold cursor-pointer"
                  >
                    <option value="both">🌐 Both English & Hindi Pages (Default)</option>
                    <option value="english">🇬🇧 English Page Only (/test-series)</option>
                    <option value="hindi">🇮🇳 Hindi Page Only (/test-series in Hindi)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Price, Discounted Price, Total Tests, Questions & Validity */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Regular Fee (₹)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={editingSeries.price || 0}
                  onChange={e => setEditingSeries({ ...editingSeries, price: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] text-[var(--text-color)] rounded-xl outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Discounted Fee (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={editingSeries.discountedPrice || 0}
                  onChange={e => setEditingSeries({ ...editingSeries, discountedPrice: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] text-[var(--text-color)] rounded-xl outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Total Mocks</label>
                <input
                  type="number"
                  min="1"
                  value={editingSeries.totalTests || 10}
                  onChange={e => setEditingSeries({ ...editingSeries, totalTests: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] text-[var(--text-color)] rounded-xl outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Total Questions</label>
                <input
                  type="number"
                  min="10"
                  value={editingSeries.totalQuestions || 1500}
                  onChange={e => setEditingSeries({ ...editingSeries, totalQuestions: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] text-[var(--text-color)] rounded-xl outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Validity Period *</label>
                <select
                  value={editingSeries.duration || '6 Months Validity'}
                  onChange={e => {
                    const val = e.target.value;
                    let days = 180;
                    if (val.includes('1 Month')) days = 30;
                    else if (val.includes('3 Months')) days = 90;
                    else if (val.includes('6 Months')) days = 180;
                    else if (val.includes('1 Year') || val.includes('12 Months')) days = 365;
                    else if (val.includes('2 Years')) days = 730;
                    else if (val.includes('Till Exam')) days = 365;

                    setEditingSeries({
                      ...editingSeries,
                      duration: val,
                      validityDays: days
                    });
                  }}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] text-[var(--text-color)] rounded-xl outline-none font-bold cursor-pointer"
                >
                  <option value="1 Month Validity">1 Month</option>
                  <option value="3 Months Validity">3 Months</option>
                  <option value="6 Months Validity">6 Months</option>
                  <option value="1 Year Validity">1 Year (12 Months)</option>
                  <option value="2 Years Validity">2 Years</option>
                  <option value="Till Prelims Exam">Till Prelims Exam</option>
                  <option value="Till Mains Exam">Till Mains Exam</option>
                  <option value="Lifetime Access">Lifetime Access</option>
                </select>
              </div>
            </div>

            {/* Schedule PDF Document URL / File Upload / Select from DAM */}
            <div>
              <label className="block text-slate-400 mb-1">
                Schedule PDF Document URL (Optional - Leaves Download Schedule hidden if empty)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="url"
                  placeholder="https://finalattemptias.com/uploads/schedules/bpsc_schedule.pdf"
                  value={editingSeries.schedulePdfUrl || ''}
                  onChange={e => setEditingSeries({ ...editingSeries, schedulePdfUrl: e.target.value })}
                  className="flex-1 min-w-[200px] px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] text-[var(--text-color)] rounded-xl outline-none font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    setMediaPickerTarget('series_pdf');
                    setShowMediaPicker(true);
                  }}
                  className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors shadow-sm"
                >
                  <Folder className="w-4 h-4 text-white" />
                  <span>Select from DAM</span>
                </button>
                <label className="px-4 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shrink-0">
                  <span>Upload Schedule PDF</span>
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const formData = new FormData();
                      formData.append('file', file);
                      try {
                        const res = await fetch(`${BACKEND_URL}/api/uploads`, {
                          method: 'POST',
                          body: formData
                        });
                        const data = await res.json();
                        if (data && data.url) {
                          setEditingSeries(prev => ({ ...prev, schedulePdfUrl: data.url }));
                          alert('Schedule PDF uploaded successfully!');
                        } else {
                          // Local object URL fallback
                          const localUrl = URL.createObjectURL(file);
                          setEditingSeries(prev => ({ ...prev, schedulePdfUrl: localUrl }));
                        }
                      } catch (_) {
                        const localUrl = URL.createObjectURL(file);
                        setEditingSeries(prev => ({ ...prev, schedulePdfUrl: localUrl }));
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Test Series Cover / Thumbnail Image & Banner Image */}
            <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-[var(--card-border)]">
              <div className="flex justify-between items-center">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-color)] uppercase tracking-wider">
                    Test Series Cover / Thumbnail Image
                  </label>
                  <span className="text-[10px] text-slate-400">Card header image rendered on test series listings & program pages</span>
                </div>
                {editingSeries.thumbnailUrl && (
                  <button
                    type="button"
                    onClick={() => setEditingSeries({ ...editingSeries, thumbnailUrl: '' })}
                    className="text-[10px] font-bold text-red-500 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                <div className="sm:col-span-8 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://example.com/cover.jpg or select from DAM"
                      value={editingSeries.thumbnailUrl || ''}
                      onChange={e => setEditingSeries({ ...editingSeries, thumbnailUrl: e.target.value })}
                      className="flex-1 px-4 py-2.5 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-color)] rounded-xl outline-none font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setMediaPickerTarget('series_image');
                        setShowMediaPicker(true);
                      }}
                      className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors shadow-xs"
                    >
                      <Folder className="w-4 h-4 text-white" />
                      <span>DAM</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Upload Cover:</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append('file', file);
                        try {
                          const res = await fetch(`${BACKEND_URL}/api/uploads`, {
                            method: 'POST',
                            body: formData
                          });
                          const data = await res.json();
                          if (data && data.url) {
                            setEditingSeries(prev => ({ ...prev, thumbnailUrl: data.url }));
                            alert('Cover image uploaded successfully!');
                          } else {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              if (ev.target?.result) {
                                setEditingSeries(prev => ({ ...prev, thumbnailUrl: ev.target?.result as string }));
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        } catch (_) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            if (ev.target?.result) {
                              setEditingSeries(prev => ({ ...prev, thumbnailUrl: ev.target?.result as string }));
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Thumbnail Card Live Preview */}
                <div className="sm:col-span-4 flex flex-col items-center">
                  <div className="w-full h-24 rounded-2xl bg-slate-900 border border-[var(--card-border)] overflow-hidden relative flex items-center justify-center shadow-xs">
                    {editingSeries.thumbnailUrl ? (
                      <img
                        src={editingSeries.thumbnailUrl}
                        alt="Test Series Cover Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="text-center p-2">
                        <Layers className="w-6 h-6 text-slate-500 mx-auto mb-1" />
                        <span className="text-[9px] text-slate-400 font-bold block">No Cover Image</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold mt-1">Cover Preview</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-slate-400 mb-1">Program Overview & Description (English) *</label>
              <textarea
                required
                rows={3}
                placeholder="Comprehensive test series engineered strictly according to the latest pattern..."
                value={editingSeries.description || ''}
                onChange={e => setEditingSeries({ ...editingSeries, description: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] text-[var(--text-color)] rounded-xl outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-amber-500 mb-1 font-bold">Program Overview & Description (Hindi - हिन्दी optional)</label>
              <textarea
                rows={3}
                placeholder="नवीनतम पैटर्न पर आधारित संपूर्ण हिंदी टेस्ट सीरीज विवरण..."
                value={editingSeries.description_hi || ''}
                onChange={e => setEditingSeries({ ...editingSeries, description_hi: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-amber-500/40 text-[var(--text-color)] rounded-xl outline-none font-medium focus:border-amber-500"
              />
            </div>

            {/* Bullet Highlights (line by line) */}
            <div>
              <label className="block text-slate-400 mb-1">Feature Highlights (One bullet line per line)</label>
              <textarea
                rows={3}
                placeholder="20 Subject-Wise Micro Sectional Tests&#10;10 Bihar Special Exclusive Mock Tests&#10;Instant Answer Keys with Video Explanations"
                value={highlightsInput}
                onChange={e => setHighlightsInput(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] text-[var(--text-color)] rounded-xl outline-none font-medium"
              />
            </div>

            {/* ── SYLLABUS MODULES BUILDER ────────────────────────────── */}
            <div className="space-y-3 pt-2 border-t border-[var(--card-border)]">
              <div className="flex items-center justify-between">
                <label className="block text-slate-400 font-bold uppercase tracking-wider">
                  Syllabus & Micro-Topics Modules ({(editingSeries.syllabus || []).length})
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const current = editingSeries.syllabus || [];
                    setEditingSeries({
                      ...editingSeries,
                      syllabus: [...current, { subject: 'New Subject Module', topics: ['Topic 1', 'Topic 2'] }]
                    });
                  }}
                  className="px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 text-[10px] font-black rounded-xl cursor-pointer"
                >
                  + Add Subject Module
                </button>
              </div>

              <div className="space-y-3">
                {(editingSeries.syllabus || []).map((sub, sIdx) => (
                  <div key={sIdx} className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-[var(--card-border)] space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={sub.subject}
                        onChange={e => {
                          const nextSyllabus = [...(editingSeries.syllabus || [])];
                          nextSyllabus[sIdx] = { ...nextSyllabus[sIdx], subject: e.target.value };
                          setEditingSeries({ ...editingSeries, syllabus: nextSyllabus });
                        }}
                        className="flex-1 px-3 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-color)] text-xs font-bold rounded-xl outline-none"
                        placeholder="Subject Name (e.g. History & Bihar Special)"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const nextSyllabus = (editingSeries.syllabus || []).filter((_, i) => i !== sIdx);
                          setEditingSeries({ ...editingSeries, syllabus: nextSyllabus });
                        }}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl"
                        title="Remove subject"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Topics (Comma separated)</label>
                      <input
                        type="text"
                        value={(sub.topics || []).join(', ')}
                        onChange={e => {
                          const topicsArr = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                          const nextSyllabus = [...(editingSeries.syllabus || [])];
                          nextSyllabus[sIdx] = { ...nextSyllabus[sIdx], topics: topicsArr };
                          setEditingSeries({ ...editingSeries, syllabus: nextSyllabus });
                        }}
                        className="w-full px-3 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-color)] text-xs font-medium rounded-xl outline-none"
                        placeholder="Ancient Bihar, 1857 Revolt, Freedom Movement"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── PROGRAM FAQS BUILDER ───────────────────────────────── */}
            <div className="space-y-3 pt-2 border-t border-[var(--card-border)]">
              <div className="flex items-center justify-between">
                <label className="block text-slate-400 font-bold uppercase tracking-wider">
                  Program FAQs ({(editingSeries.faq || []).length})
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const current = editingSeries.faq || [];
                    setEditingSeries({
                      ...editingSeries,
                      faq: [...current, { q: 'How do I attempt tests?', a: 'Tests unlock 24/7 in student dashboard.' }]
                    });
                  }}
                  className="px-3 py-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 text-[10px] font-black rounded-xl cursor-pointer"
                >
                  + Add FAQ Pair
                </button>
              </div>

              <div className="space-y-3">
                {(editingSeries.faq || []).map((faqItem, fIdx) => (
                  <div key={fIdx} className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-[var(--card-border)] space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={faqItem.q}
                        onChange={e => {
                          const nextFaq = [...(editingSeries.faq || [])];
                          nextFaq[fIdx] = { ...nextFaq[fIdx], q: e.target.value };
                          setEditingSeries({ ...editingSeries, faq: nextFaq });
                        }}
                        className="flex-1 px-3 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-color)] text-xs font-bold rounded-xl outline-none"
                        placeholder="Question (e.g. Are tests bilingual?)"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const nextFaq = (editingSeries.faq || []).filter((_, i) => i !== fIdx);
                          setEditingSeries({ ...editingSeries, faq: nextFaq });
                        }}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl"
                        title="Remove FAQ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <textarea
                      rows={2}
                      value={faqItem.a}
                      onChange={e => {
                        const nextFaq = [...(editingSeries.faq || [])];
                        nextFaq[fIdx] = { ...nextFaq[fIdx], a: e.target.value };
                        setEditingSeries({ ...editingSeries, faq: nextFaq });
                      }}
                      className="w-full px-3 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-color)] text-xs font-medium rounded-xl outline-none"
                      placeholder="Answer text..."
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Status & Published Switch */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-[var(--card-border)]">
              <div>
                <span className="text-xs font-bold text-[var(--text-color)] block">Publishing Control</span>
                <span className="text-[10px] text-slate-400 font-medium">When checked, program shows live on website & student portal immediately.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold">{editingSeries.isPublished ? 'Live' : 'Draft'}</span>
                <button
                  type="button"
                  onClick={() => setEditingSeries({ ...editingSeries, isPublished: !editingSeries.isPublished })}
                  className={`w-10 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${editingSeries.isPublished ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-xs transform transition-transform ${editingSeries.isPublished ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setIsSeriesModalOpen(false)}
                className="px-5 py-2.5 border border-[var(--card-border)] text-slate-400 text-xs font-bold rounded-2xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingSeries}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl shadow-md cursor-pointer"
              >
                {savingSeries ? 'Saving…' : 'Save Test Series Program'}
              </button>
            </div>
          </form>
        </div>
      )}


      {/* ── CREATE / EDIT MOCK QUIZ MODAL ────────────────────────────────────── */}
      {showQuizForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Test Series Management</span>
                <h3 className="font-heading font-black text-xl text-slate-900 dark:text-white mt-0.5">
                  {(quizForm as any).id ? 'Edit Mock Quiz / Paper' : 'Add New Mock Quiz / Paper'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQuizForm(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuiz} className="space-y-5 text-xs font-bold">
              {/* Quiz Title */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1.5 text-xs">Quiz Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Full Length Grand Mock Paper 2"
                  value={quizForm.title}
                  onChange={e => setQuizForm({ ...quizForm, title: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none font-medium text-xs shadow-xs focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Time Limit & Passing Cut-off */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1.5 text-xs">Time Limit (Minutes)</label>
                  <input
                    type="number"
                    value={quizForm.timeLimitMins}
                    onChange={e => setQuizForm({ ...quizForm, timeLimitMins: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none font-medium text-xs shadow-xs focus:border-amber-500 transition-colors"
                  />
                </div>

              </div>

              {/* SET-Wise Exam Paper Access Configuration Card */}
              <div className="p-5 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                  <div>
                    <label className="block text-amber-500 font-extrabold uppercase text-[10px] tracking-wider">
                      SET-Wise Exam Paper Access System
                    </label>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">Configure paper variants and default assigned SET code</span>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-lg text-[9px] font-black uppercase shrink-0">
                    {(quizForm as any).setMode === 'multi' ? 'Multi-SET Mode' : 'Single Paper Mode'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1 text-[10px] uppercase">SET Access Mode</label>
                    <select
                      value={(quizForm as any).setMode || 'single'}
                      onChange={e => setQuizForm({ ...quizForm, setMode: e.target.value as any })}
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none font-bold cursor-pointer text-xs focus:border-amber-500 transition-colors"
                    >
                      <option value="single" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Single Paper (Standard)</option>
                      <option value="multi" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Multi-SET Paper (Sets A, B, C, D)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1 text-[10px] uppercase">Assigned SET Code</label>
                    <select
                      value={(quizForm as any).defaultSet || 'SET-A'}
                      onChange={e => setQuizForm({ ...quizForm, defaultSet: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none font-bold cursor-pointer text-xs focus:border-amber-500 transition-colors"
                    >
                      <option value="SET-A" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">SET-A</option>
                      <option value="SET-B" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">SET-B</option>
                      <option value="SET-C" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">SET-C</option>
                      <option value="SET-D" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">SET-D</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-2 text-[10px] uppercase">Available SET Variants For Students</label>
                  <div className="flex flex-wrap items-center gap-4">
                    {['SET-A', 'SET-B', 'SET-C', 'SET-D'].map((setCode) => {
                      const currentSets: string[] = (quizForm as any).availableSets || ['SET-A', 'SET-B', 'SET-C', 'SET-D'];
                      const isChecked = currentSets.includes(setCode);
                      return (
                        <label key={setCode} className="flex items-center gap-2 cursor-pointer text-xs font-bold select-none bg-slate-50 dark:bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 transition-colors shadow-xs">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const nextSets = e.target.checked
                                ? [...currentSets, setCode]
                                : currentSets.filter(s => s !== setCode);
                              setQuizForm({ ...quizForm, availableSets: nextSets } as any);
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

              {/* Quiz Description / Instructions */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1.5 text-xs">Quiz Description / Instructions</label>
                <textarea
                  rows={3}
                  placeholder="Official 150-question mock test pattern..."
                  value={quizForm.description}
                  onChange={e => setQuizForm({ ...quizForm, description: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl outline-none font-medium text-xs focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Modal Actions Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowQuizForm(false)}
                  className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold rounded-2xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingQuiz}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl shadow-md cursor-pointer transition-colors uppercase tracking-wider"
                >
                  {savingQuiz ? 'Saving...' : (quizForm as any).id ? 'Save Quiz / Paper' : 'Create Mock Quiz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT QUESTION MODAL ────────────────────────────────────────────── */}
      {editingQuestion && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Question Bank Editor</span>
                <h3 className="font-heading font-black text-xl text-[var(--text-color)] mt-0.5">
                  Edit MCQ Question Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-[var(--text-color)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditQuestion} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-400 mb-1">Question Prompt *</label>
                <textarea
                  rows={4}
                  required
                  value={editingQuestion.questionText || ''}
                  onChange={e => setEditingQuestion({ ...editingQuestion, questionText: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] text-[var(--text-color)] rounded-xl outline-none font-mono text-xs leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Question Image URL / Visual Diagram (Optional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://example.com/image.png or /uploads/images/q14.png"
                    value={editingQuestion.questionImageUrl || (editingQuestion as any).imageUrl || ''}
                    onChange={e => setEditingQuestion({ ...editingQuestion, questionImageUrl: e.target.value, imageUrl: e.target.value } as any)}
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] text-[var(--text-color)] rounded-xl outline-none font-mono text-xs"
                  />
                  {(editingQuestion.questionImageUrl || (editingQuestion as any).imageUrl) && (
                    <button
                      type="button"
                      onClick={() => setEditingQuestion({ ...editingQuestion, questionImageUrl: '', imageUrl: '' } as any)}
                      className="px-3 py-2 bg-red-500/10 text-red-500 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {(editingQuestion.questionImageUrl || (editingQuestion as any).imageUrl) && (
                  <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-900 rounded-xl border border-[var(--card-border)] flex flex-col items-center gap-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Attached Image Preview</span>
                    <img
                      src={editingQuestion.questionImageUrl || (editingQuestion as any).imageUrl}
                      alt="Question Diagram Preview"
                      className="max-h-44 max-w-full object-contain rounded-lg shadow-xs"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Option A *</label>
                  <input
                    type="text"
                    required
                    value={editingQuestion.optionA || ''}
                    onChange={e => setEditingQuestion({ ...editingQuestion, optionA: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] text-[var(--text-color)] rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Option B *</label>
                  <input
                    type="text"
                    required
                    value={editingQuestion.optionB || ''}
                    onChange={e => setEditingQuestion({ ...editingQuestion, optionB: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] text-[var(--text-color)] rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Option C</label>
                  <input
                    type="text"
                    value={editingQuestion.optionC || ''}
                    onChange={e => setEditingQuestion({ ...editingQuestion, optionC: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] text-[var(--text-color)] rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Option D</label>
                  <input
                    type="text"
                    value={editingQuestion.optionD || ''}
                    onChange={e => setEditingQuestion({ ...editingQuestion, optionD: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] text-[var(--text-color)] rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Option E</label>
                  <input
                    type="text"
                    value={editingQuestion.optionE || ''}
                    onChange={e => setEditingQuestion({ ...editingQuestion, optionE: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] text-[var(--text-color)] rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Correct Answer *</label>
                  <select
                    value={editingQuestion.correctAnswer || 'A'}
                    onChange={e => setEditingQuestion({ ...editingQuestion, correctAnswer: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] text-[var(--text-color)] rounded-xl outline-none"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                    <option value="E">Option E</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Marks</label>
                  <input
                    type="number"
                    value={editingQuestion.marks || 1}
                    onChange={e => setEditingQuestion({ ...editingQuestion, marks: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] text-[var(--text-color)] rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Penalty (-)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingQuestion.negativeMarks || 0.33}
                    onChange={e => setEditingQuestion({ ...editingQuestion, negativeMarks: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] text-[var(--text-color)] rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Solution Explanation Notes</label>
                <textarea
                  rows={2}
                  value={editingQuestion.explanation || ''}
                  onChange={e => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] text-[var(--text-color)] rounded-xl outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="px-5 py-2.5 border border-[var(--card-border)] text-slate-400 text-xs font-bold rounded-2xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl shadow-md cursor-pointer"
                >
                  Save Question Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── BULK QUESTION IMPORT WORKBENCH MODAL (PDF / TEXT AUTO-PARSER) ──── */}
      {showBulkImportModal && (


        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">AI Question Feeder & Auto-Parser</span>
                <h3 className="font-heading font-black text-xl text-[var(--text-color)] mt-0.5">
                  Bulk Import Questions from PDF / Text Feed
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkImportModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-[var(--text-color)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Input Controls: File Upload or Raw Paste */}
            <div className="space-y-4 text-xs font-bold">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-[var(--card-border)] space-y-3">
                <label className="block text-slate-400 font-extrabold uppercase text-[10px]">
                  Option 1: Upload Question Bank File (.txt / .pdf / .doc)
                </label>
                <input
                  type="file"
                  accept=".txt,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-slate-400 font-extrabold uppercase text-[10px]">
                    Option 2: Paste Raw Question Paper Text Below
                  </label>
                  <span className="text-[10px] text-slate-400 font-normal">Formats: Q1. ... (A) ... (B) ... Ans: A</span>
                </div>
                <textarea
                  rows={8}
                  value={bulkRawText}
                  onChange={e => setBulkRawText(e.target.value)}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] text-[var(--text-color)] rounded-2xl outline-none font-mono text-xs leading-relaxed"
                  placeholder={`1. Which Article deals with Governor Ordinance?\n(A) Article 123\n(B) Article 213\n(C) Article 200\n(D) Article 161\nAns: B\nExplanation: Article 213 deals with Governor ordinances.\n\n2. Who led the Bakasht movement in Bihar?\n(A) Swami Sahajanand\n(B) Karyanand Sharma\n(C) Rahul Sankrityayan\n(D) Yadunandan Sharma\nAns: B\nExplanation: Karyanand Sharma led Bakasht movement.`}
                />
              </div>

              <button
                type="button"
                onClick={() => handleParseBulkText(bulkRawText)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Auto-Parse Questions & Preview ({parsedBulkQuestions.length} Detected)</span>
              </button>

              {/* Parsed Questions Preview Cards */}
              {parsedBulkQuestions.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-[var(--card-border)]">
                  <span className="text-xs font-black uppercase text-emerald-500 tracking-wider block">
                    Detected {parsedBulkQuestions.length} Questions (Review before importing):
                  </span>

                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {parsedBulkQuestions.map((pq: any, pIdx: number) => (
                      <div key={pIdx} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-[var(--card-border)] space-y-2">

                        <div className="flex justify-between items-center text-[10px] font-black text-amber-500">
                          <span>Q{pIdx + 1}</span>
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded">Ans: Option {pq.correctAnswer}</span>
                        </div>
                        <p className="text-xs font-bold text-[var(--text-color)]">{pq.questionText}</p>
                        <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-500">
                          <span>A. {stripOptionPrefix(pq.optionA)}</span>
                          <span>B. {stripOptionPrefix(pq.optionB)}</span>
                          <span>C. {stripOptionPrefix(pq.optionC)}</span>
                          <span>D. {stripOptionPrefix(pq.optionD)}</span>
                          {pq.optionE && <span>E. {stripOptionPrefix(pq.optionE)}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => setShowBulkImportModal(null)}
                className="px-5 py-2.5 border border-[var(--card-border)] text-slate-400 text-xs font-bold rounded-2xl"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={parsedBulkQuestions.length === 0 || importingBulk}
                onClick={() => handleImportParsedQuestions(showBulkImportModal)}
                className={`px-6 py-2.5 font-black text-xs rounded-2xl shadow-md cursor-pointer transition-all ${parsedBulkQuestions.length > 0 && !importingBulk
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                    : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
              >
                {importingBulk ? 'Importing Questions...' : `Import ${parsedBulkQuestions.length} Questions into Quiz`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MANAGE / CREATE EXAM CATEGORY MODAL ──────────────────────────── */}
      {editingExam && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!editingExam.name) {
                alert('Exam Name is required.');
                return;
              }
              setSavingExam(true);
              try {
                const code = editingExam.code || editingExam.name.toUpperCase().replace(/[^A-Z0-9]/g, '');
                const slug = editingExam.slug || editingExam.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
                let stages = editingExam.stages || [];
                if (editingExam.hasStages && (!stages || stages.length === 0)) {
                  stages = [
                    { id: `stage-${editingExam.id}-prelims`, examId: editingExam.id, name: 'Prelims', slug: 'prelims', sortOrder: 1, isActive: true },
                    { id: `stage-${editingExam.id}-mains`, examId: editingExam.id, name: 'Mains', slug: 'mains', sortOrder: 2, isActive: true }
                  ];
                }
                const payload = {
                  ...editingExam,
                  code,
                  slug,
                  stages,
                  displayOrder: Number(editingExam.displayOrder || 1)
                };
                await db.saveExam(payload);
                setExamsList(prev => {
                  const idx = prev.findIndex(ex => ex.id === payload.id);
                  let updated = [];
                  if (idx >= 0) {
                    updated = [...prev];
                    updated[idx] = payload;
                  } else {
                    updated = [...prev, payload];
                  }
                  return updated.sort((a, b) => (Number(a.displayOrder || 1) - Number(b.displayOrder || 1)));
                });
                setEditingExam(null);
                alert('Exam category, order & logo saved successfully!');
              } catch (err) {
                console.error(err);
                alert('Failed to save exam category.');
              } finally {
                setSavingExam(false);
              }
            }}
            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl my-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Test Series Exam Manager</span>
                <h3 className="font-heading font-black text-xl text-slate-900 dark:text-white mt-0.5">
                  {editingExam.name ? `Edit ${editingExam.name}` : 'New Exam Category'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingExam(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-bold">
              {/* Logo Preview with Pure White Background */}
              <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-20 h-16 rounded-2xl bg-white text-amber-600 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-heading font-black text-xl tracking-tight shadow-sm overflow-hidden p-1.5 shrink-0">
                  {editingExam.logoUrl ? (
                    <img src={editingExam.logoUrl} alt={editingExam.name || 'Exam'} className="w-full h-full object-contain drop-shadow-xs" />
                  ) : (
                    <span className="text-amber-600 font-extrabold">{editingExam.code || editingExam.name || 'EXAM'}</span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Exam Card Live Badge Preview</span>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Exam Category Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UPSC Civil Services, BPSC CCE, APPSC"
                  value={editingExam.name || ''}
                  onChange={e => setEditingExam({ ...editingExam, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Short Code / Badge</label>
                  <input
                    type="text"
                    placeholder="e.g. BPSC"
                    value={editingExam.code || ''}
                    onChange={e => setEditingExam({ ...editingExam, code: e.target.value })}
                    className="w-full px-3 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Display Order (Sort) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editingExam.displayOrder || 1}
                    onChange={e => setEditingExam({ ...editingExam, displayOrder: Number(e.target.value) })}
                    className="w-full px-3 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-amber-600 dark:text-amber-400 rounded-xl outline-none focus:border-amber-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Structure Type</label>
                  <select
                    value={editingExam.hasStages ? 'stages' : 'direct'}
                    onChange={e => setEditingExam({ ...editingExam, hasStages: e.target.value === 'stages' })}
                    className="w-full px-3 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl outline-none cursor-pointer focus:border-amber-500"
                  >
                    <option value="stages">Stage-Wise</option>
                    <option value="direct">Direct Series</option>
                  </select>
                </div>
              </div>

              {/* Logo Selection: URL, File Upload or Select from Site DAM */}
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Exam Logo Image</label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="https://example.com/logo.png or select from DAM below"
                    value={editingExam.logoUrl || ''}
                    onChange={e => setEditingExam({ ...editingExam, logoUrl: e.target.value })}
                    className="flex-1 px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl outline-none focus:border-amber-500 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setMediaPickerTarget('exam_logo');
                      setShowMediaPicker(true);
                    }}
                    className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors shadow-sm"
                  >
                    <Folder className="w-4 h-4 text-white" />
                    <span>Select from DAM</span>
                  </button>
                </div>

                <div className="pt-1">
                  <label className="block text-[11px] text-slate-400 mb-1">Or Upload Custom Logo File</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) {
                            setEditingExam({ ...editingExam, logoUrl: ev.target.result as string });
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-600 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Exam Description / Subtitle</label>
                <textarea
                  rows={2}
                  placeholder="State public service commission exam description..."
                  value={editingExam.description || ''}
                  onChange={e => setEditingExam({ ...editingExam, description: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingExam(null)}
                className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold rounded-2xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingExam}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl shadow-md cursor-pointer"
              >
                {savingExam ? 'Saving…' : 'Save Exam Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Site DAM Media Picker Modal */}
      {showMediaPicker && (
        <MediaPicker
          allowedTypes={mediaPickerTarget === 'series_pdf' ? ['DOCUMENT'] : ['IMAGE']}
          onSelect={(url) => {
            if (mediaPickerTarget === 'series_pdf') {
              setEditingSeries(prev => ({ ...prev, schedulePdfUrl: url }));
            } else if (mediaPickerTarget === 'series_image') {
              setEditingSeries(prev => ({ ...prev, thumbnailUrl: url }));
            } else if (editingExam) {
              setEditingExam(prev => (prev ? { ...prev, logoUrl: url } : prev));
            }
            setShowMediaPicker(false);
          }}
          onClose={() => setShowMediaPicker(false)}
        />
      )}

      {/* ── STRICT BILINGUAL MOCK TEST IMPORTER WIZARD MODAL ───────────── */}
      {showBilingualPdfModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header (Fixed Top) */}
            <div className="flex items-center justify-between border-b border-[var(--card-border)] px-6 py-4 shrink-0 bg-[var(--card-bg)]">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Universal Bilingual Engine</span>
                <h3 className="font-heading font-black text-xl text-[var(--text-color)] mt-0.5">
                  Bilingual Test Importer & Review Dashboard
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowBilingualPdfModal(false);
                  setBilingualPastedText('');
                  setBilingualParseErrors([]);
                  setBilingualParseMode('text');
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-[var(--text-color)] hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable Middle) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* STEP 1: Input — Paste Text (primary) or Upload PDF (fallback) */}
              {!bilingualReport && (
                <div className="space-y-5">

                  {/* Mode Toggle Tabs */}
                  <div className="flex flex-wrap gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl text-xs font-bold w-fit">
                    <button
                      type="button"
                      onClick={() => { setBilingualParseMode('text'); setBilingualParseErrors([]); }}
                      className={`px-4 py-2 rounded-xl cursor-pointer transition-all ${bilingualParseMode === 'text'
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-500 hover:text-[var(--text-color)]'
                        }`}
                    >
                      📋 Paste Text
                    </button>
                    <button
                      type="button"
                      onClick={() => { setBilingualParseMode('pdf'); setBilingualParseErrors([]); }}
                      className={`px-4 py-2 rounded-xl cursor-pointer transition-all ${bilingualParseMode === 'pdf'
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-500 hover:text-[var(--text-color)]'
                        }`}
                    >
                      📄 Upload Document / PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => { setBilingualParseMode('excel'); setBilingualParseErrors([]); }}
                      className={`px-4 py-2 rounded-xl cursor-pointer transition-all ${bilingualParseMode === 'excel'
                          ? 'bg-emerald-500 text-slate-950 shadow-sm font-extrabold'
                          : 'text-slate-500 hover:text-[var(--text-color)]'
                        }`}
                    >
                      📊 Import from Excel (.xlsx)
                    </button>
                  </div>

                  {/* Info Banner */}
                  {bilingualParseMode !== 'excel' ? (
                    <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-[12px] text-emerald-800 dark:text-emerald-300 leading-relaxed flex items-center gap-3">
                      <span className="text-xl shrink-0">✨</span>
                      <div>
                        <strong className="block font-bold text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">Universal Format-Agnostic Import Engine</strong>
                        <span>Paste text or upload <strong>ANY format</strong>—separate English papers, separate Hindi papers, combined bilingual tests, PDFs, DOCX, or text files. No rigid section headers or specific layouts required!</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-[12px] text-emerald-800 dark:text-emerald-300 leading-relaxed flex items-center gap-3">
                      <span className="text-xl shrink-0">📊</span>
                      <div>
                        <strong className="block font-bold text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">Structured Question Bank Excel Engine</strong>
                        <span>Strict 1-row-per-question importer using the canonical 17-column Excel template (`Question_Bank_Import_Template.xlsx`). Bypasses OCR for 100% structured accuracy.</span>
                      </div>
                    </div>
                  )}

                  {/* Parse Errors */}
                  {bilingualParseErrors.length > 0 && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl space-y-1">
                      {bilingualParseErrors.map((e, i) => (
                        <p key={i} className="text-xs font-medium text-red-600 dark:text-red-400">⚠ {e}</p>
                      ))}
                    </div>
                  )}

                  {/* TEXT MODE */}
                  {bilingualParseMode === 'text' && (
                    <div className="space-y-4">
                      <textarea
                        rows={14}
                        value={bilingualPastedText}
                        onChange={e => { setBilingualPastedText(e.target.value); setBilingualParseErrors([]); }}
                        placeholder="Paste any question paper or mock test here in ANY format (English, Hindi, or Bilingual)..."
                        className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl outline-none focus:border-amber-500 font-mono text-[11px] resize-y"
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          disabled={parsingBilingualPdf || !bilingualPastedText.trim()}
                          onClick={async () => {
                            if (!bilingualPastedText.trim()) return;
                            setParsingBilingualPdf(true);
                            setBilingualParseErrors([]);
                            try {
                              const res = await db.parseBilingualText(bilingualPastedText);
                              if (res && res.success && res.report) {
                                if (res.report.errors && res.report.errors.length > 0) {
                                  setBilingualParseErrors(res.report.errors);
                                }
                                setBilingualReport(res.report);
                              } else {
                                setBilingualParseErrors([res?.error || 'Failed to parse text.']);
                              }
                            } catch (err: any) {
                              setBilingualParseErrors([err.message || 'Network error.']);
                            } finally {
                              setParsingBilingualPdf(false);
                            }
                          }}
                          className="px-8 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-sm rounded-2xl cursor-pointer shadow-md transition-all"
                        >
                          {parsingBilingualPdf ? 'Parsing...' : 'Parse & Validate →'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* PDF MODE */}
                  {bilingualParseMode === 'pdf' && (
                    <div className="space-y-4">
                      <div className="p-8 border-2 border-dashed border-[var(--card-border)] rounded-3xl hover:border-amber-500/50 transition-colors space-y-4 text-center bg-slate-50/50 dark:bg-slate-900/50">
                        <FileText className="w-12 h-12 text-amber-500 mx-auto" />
                        <div className="space-y-1">
                          <h4 className="font-heading font-bold text-base text-[var(--text-color)]">Upload Test Paper (PDF, DOCX, Image, Text)</h4>
                          <p className="text-xs text-slate-400 max-w-xs mx-auto">
                            Universal Engine accepts any digital PDF, scanned image PDF, or text document.
                          </p>
                        </div>
                        <label className="inline-block px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl cursor-pointer shadow-md transition-all">
                          <span>{parsingBilingualPdf ? 'Extracting & Validating PDF...' : 'Select PDF File'}</span>
                          <input
                            type="file"
                            accept=".pdf"
                            disabled={parsingBilingualPdf}
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setParsingBilingualPdf(true);
                              setBilingualParseErrors([]);
                              try {
                                const res = await db.parseBilingualPdf(file);
                                if (res && res.success && res.report) {
                                  if (res.report.errors && res.report.errors.length > 0) {
                                    setBilingualParseErrors(res.report.errors);
                                  }
                                  setBilingualReport(res.report);
                                  if (!bilingualQuizTitle) {
                                    setBilingualQuizTitle(file.name.replace(/\.pdf$/i, '').replace(/_/g, ' '));
                                  }
                                } else {
                                  setBilingualParseErrors([res?.error || 'Failed parsing PDF document.']);
                                }
                              } catch (err: any) {
                                setBilingualParseErrors([err.message || 'Error extracting PDF file.']);
                              } finally {
                                setParsingBilingualPdf(false);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {/* EXCEL MODE */}
                  {bilingualParseMode === 'excel' && (
                    <div className="space-y-4">
                      <div className="p-8 border-2 border-dashed border-emerald-500/30 rounded-3xl hover:border-emerald-500/60 transition-colors space-y-4 text-center bg-emerald-500/5 dark:bg-emerald-950/20">
                        <FileText className="w-12 h-12 text-emerald-500 mx-auto" />
                        <div className="space-y-1">
                          <h4 className="font-heading font-bold text-base text-[var(--text-color)]">Upload Excel Question Bank (.xlsx)</h4>
                          <p className="text-xs text-slate-400 max-w-sm mx-auto">
                            Uses the 17-column Question Bank schema for 100% structured accuracy.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                          <label className="inline-block px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-2xl cursor-pointer shadow-md transition-all">
                            <span>{parsingBilingualPdf ? 'Parsing Excel File...' : 'Select Excel File (.xlsx)'}</span>
                            <input
                              type="file"
                              accept=".xlsx,.xls"
                              disabled={parsingBilingualPdf}
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setParsingBilingualPdf(true);
                                setBilingualParseErrors([]);
                                try {
                                  const res = await db.parseExcel(file);
                                  if (res && res.success && res.report) {
                                    if (res.report.errors && res.report.errors.length > 0) {
                                      setBilingualParseErrors(res.report.errors);
                                    }
                                    setBilingualReport(res.report);
                                    if (!bilingualQuizTitle) {
                                      setBilingualQuizTitle(file.name.replace(/\.xlsx$/i, '').replace(/_/g, ' '));
                                    }
                                  } else {
                                    setBilingualParseErrors([res?.error || 'Failed parsing Excel file.']);
                                  }
                                } catch (err: any) {
                                  setBilingualParseErrors([err.message || 'Error uploading Excel file.']);
                                } finally {
                                  setParsingBilingualPdf(false);
                                }
                              }}
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() => db.downloadExcelTemplate()}
                            className="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-2xl transition-all border border-slate-200 dark:border-slate-700 flex items-center gap-2 cursor-pointer shadow-xs"
                          >
                            <span>📥 Download Excel Template</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Validation Metrics & Preview Screen */}
              {bilingualReport && (
                <div className="space-y-6">

                  {/* Validation Summary Pill */}
                  <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 text-xs font-bold ${bilingualReport?.isValid !== false ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                    }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{bilingualReport?.isValid !== false ? '✓' : '⚠️'}</span>
                      <div>
                        <span className="font-extrabold uppercase tracking-wider block">
                          Bilingual Validation Status: {bilingualReport?.isValid !== false ? 'VALID' : 'INVALID'}
                        </span>
                        <span className="text-[10px] font-medium opacity-90">
                          {bilingualReport?.isValid !== false
                            ? '1:1 Question mapping & answer key agreement verified across all logical sections.'
                            : `${(bilingualReport?.errors || []).length} validation errors detected. Import blocked.`}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => { setBilingualReport(null); setBilingualParseErrors([]); }}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer shrink-0 transition-colors"
                    >
                      ← Re-upload / Edit Input
                    </button>
                  </div>

                  {/* Validation Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs font-bold">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] rounded-2xl">
                      <span className="text-amber-500 text-lg font-black block">{bilingualReport?.mappedQuestionsCount || bilingualReport?.totalDetected || (parsedBulkQuestions || []).length || 0}</span>
                      <span className="text-[10px] text-slate-400 uppercase">Mapped Questions</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] rounded-2xl">
                      <span className="text-slate-400 text-lg font-black block">{bilingualReport?.totalQuestionsEn || (parsedBulkQuestions || []).length} / {bilingualReport?.totalQuestionsHi || (parsedBulkQuestions || []).filter((q: any) => q.questionTextHi).length}</span>
                      <span className="text-[10px] text-slate-400 uppercase">En Qs / Hi Qs</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] rounded-2xl">
                      <span className="text-slate-400 text-lg font-black block">{bilingualReport?.totalAnswersEn || (parsedBulkQuestions || []).length} / {bilingualReport?.totalAnswersHi || (parsedBulkQuestions || []).length}</span>
                      <span className="text-[10px] text-slate-400 uppercase">En Ans / Hi Ans</span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] rounded-2xl">
                      <span className="text-slate-400 text-lg font-black block">{bilingualReport?.totalExplanationsEn || (parsedBulkQuestions || []).length} / {bilingualReport?.totalExplanationsHi || 0}</span>
                      <span className="text-[10px] text-slate-400 uppercase">Explanations</span>
                    </div>
                  </div>

                  {/* Validation Errors Breakdown */}
                  {Array.isArray(bilingualReport?.errors) && bilingualReport.errors.length > 0 && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl space-y-2 text-xs text-red-500 font-medium">
                      <span className="font-extrabold uppercase tracking-wider block text-red-600 dark:text-red-400">
                        Validation Errors ({bilingualReport.errors.length}):
                      </span>
                      <ul className="list-disc pl-5 space-y-1 text-[11px] max-h-36 overflow-y-auto">
                        {bilingualReport.errors.map((err: string, i: number) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Question Preview Side-by-Side Inspector */}
                  {bilingualReport.questionsPreview && bilingualReport.questionsPreview.length > 0 && (
                    <div className="space-y-4 border-t border-[var(--card-border)] pt-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs font-black uppercase text-amber-500 tracking-wider">
                          Question Preview ({previewQuestionIndex + 1} of {bilingualReport.questionsPreview.length})
                        </span>

                        <div className="flex items-center gap-2">
                          <select
                            value={previewQuestionIndex}
                            onChange={e => setPreviewQuestionIndex(Number(e.target.value))}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-[var(--card-border)] text-[var(--text-color)] rounded-xl text-xs font-bold outline-none cursor-pointer"
                          >
                            {bilingualReport.questionsPreview.map((q: any, idx: number) => (
                              <option key={idx} value={idx}>
                                Jump to Q{q.questionNumber || idx + 1}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            disabled={previewQuestionIndex === 0}
                            onClick={() => setPreviewQuestionIndex(prev => Math.max(0, prev - 1))}
                            className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold disabled:opacity-30 cursor-pointer transition-colors"
                          >
                            ← Prev Q
                          </button>
                          <button
                            type="button"
                            disabled={previewQuestionIndex >= bilingualReport.questionsPreview.length - 1}
                            onClick={() => setPreviewQuestionIndex(prev => Math.min(bilingualReport.questionsPreview.length - 1, prev + 1))}
                            className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold disabled:opacity-30 cursor-pointer transition-colors"
                          >
                            Next Q →
                          </button>
                        </div>
                      </div>

                      {/* Side by Side Preview Card */}
                      {(() => {
                        const curQ = bilingualReport.questionsPreview[previewQuestionIndex];
                        if (!curQ) return null;

                        return (
                          <div className="bg-slate-50 dark:bg-slate-900/80 border border-[var(--card-border)] rounded-2xl p-5 space-y-5 text-xs shadow-inner">
                            {/* Header Bar */}
                            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3 font-bold">
                              <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-amber-500/20 text-amber-500 font-black text-sm rounded-xl border border-amber-500/30">
                                  Q{curQ.questionNumber}
                                </span>
                                {curQ.questionType && (
                                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                    Type: {curQ.questionType}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-slate-400 font-medium">Answer Key:</span>
                                <span className="px-3 py-1 bg-emerald-500/15 text-emerald-500 rounded-xl font-mono font-black text-xs border border-emerald-500/30">
                                  ({curQ.correctAnswer})
                                </span>
                              </div>
                            </div>

                            {/* Side-by-Side Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                              {/* English Column */}
                              <div className="space-y-4 lg:border-r border-[var(--card-border)] lg:pr-6">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded-md">ENGLISH</span>
                                </div>

                                <div className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium text-xs">
                                  {renderMarkdownContent(curQ.questionText)}
                                </div>

                                <div className="space-y-2 pt-2">
                                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Options</span>
                                  {[
                                    { key: 'A', text: curQ.optionA },
                                    { key: 'B', text: curQ.optionB },
                                    { key: 'C', text: curQ.optionC },
                                    { key: 'D', text: curQ.optionD },
                                    ...(curQ.optionE ? [{ key: 'E', text: curQ.optionE }] : [])
                                  ].map(opt => {
                                    const isCorrect = curQ.correctAnswer === opt.key;
                                    return (
                                      <div
                                        key={opt.key}
                                        className={`p-2.5 rounded-xl border flex items-start gap-2.5 text-xs font-medium transition-colors ${
                                          isCorrect
                                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-300 font-bold'
                                            : 'bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                                        }`}
                                      >
                                        <span className={`w-5 h-5 shrink-0 rounded-lg flex items-center justify-center font-extrabold text-[11px] ${
                                          isCorrect
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                        }`}>
                                          {opt.key}
                                        </span>
                                        <span className="leading-snug break-words flex-1">{stripOptionPrefix(opt.text)}</span>
                                      </div>
                                    );
                                  })}
                                </div>

                                {curQ.explanation && (
                                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                                    <span className="font-extrabold uppercase tracking-wider text-[10px] text-amber-500 block">Explanation</span>
                                    <p className="leading-relaxed">{curQ.explanation}</p>
                                  </div>
                                )}
                              </div>

                              {/* Hindi Column */}
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-md">HINDI (हिन्दी)</span>
                                </div>

                                <div className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium text-xs">
                                  {renderMarkdownContent(curQ.questionTextHi || curQ.questionText)}
                                </div>

                                <div className="space-y-2 pt-2">
                                  <span className="text-[10px] font-extrabold text-amber-500/80 uppercase tracking-wider block mb-1">विकल्प (Options)</span>
                                  {[
                                    { key: 'A', text: curQ.optionAHi || curQ.optionA },
                                    { key: 'B', text: curQ.optionBHi || curQ.optionB },
                                    { key: 'C', text: curQ.optionCHi || curQ.optionC },
                                    { key: 'D', text: curQ.optionDHi || curQ.optionD },
                                    ...((curQ.optionEHi || curQ.optionE) ? [{ key: 'E', text: curQ.optionEHi || curQ.optionE }] : [])
                                  ].map(opt => {
                                    const isCorrect = curQ.correctAnswer === opt.key;
                                    return (
                                      <div
                                        key={opt.key}
                                        className={`p-2.5 rounded-xl border flex items-start gap-2.5 text-xs font-medium transition-colors ${
                                          isCorrect
                                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-300 font-bold'
                                            : 'bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                                        }`}
                                      >
                                        <span className={`w-5 h-5 shrink-0 rounded-lg flex items-center justify-center font-extrabold text-[11px] ${
                                          isCorrect
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-amber-500/20 text-amber-500 dark:bg-amber-500/30'
                                        }`}>
                                          {opt.key}
                                        </span>
                                        <span className="leading-snug break-words flex-1">{stripOptionPrefix(opt.text)}</span>
                                      </div>
                                    );
                                  })}
                                </div>

                                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                                  <span className="font-extrabold uppercase tracking-wider text-[10px] text-amber-500 block">व्याख्या (Explanation)</span>
                                  <p className="leading-relaxed">{curQ.explanationHi || curQ.explanation || 'व्याख्या उपलब्ध नहीं है।'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Import Configuration Form */}
                  {bilingualReport.isValid && (
                    <div className="space-y-4 border-t border-[var(--card-border)] pt-4 text-xs font-bold">
                      <div>
                        <label className="block text-slate-400 mb-1">Quiz Paper Title *</label>
                        <input
                          type="text"
                          required
                          value={bilingualQuizTitle}
                          onChange={e => setBilingualQuizTitle(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] text-[var(--text-color)] rounded-xl outline-none font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">Quiz Paper Instructions / Description</label>
                        <textarea
                          rows={2}
                          value={bilingualQuizDescription}
                          onChange={e => setBilingualQuizDescription(e.target.value)}
                          placeholder="Official bilingual mock test paper instructions..."
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-[var(--card-border)] text-[var(--text-color)] rounded-xl outline-none font-medium"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="replaceQuizCheck"
                          checked={replaceExistingQuizConfirm}
                          onChange={e => setReplaceExistingQuizConfirm(e.target.checked)}
                          className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                        />
                        <label htmlFor="replaceQuizCheck" className="text-slate-400 cursor-pointer">
                          If a quiz paper with the same ID exists, overwrite and replace it.
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer (Fixed Bottom) */}
            {bilingualReport && (
              <div className="shrink-0 border-t border-[var(--card-border)] px-6 py-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <button
                  type="button"
                  onClick={() => setShowBilingualPdfModal(false)}
                  className="px-5 py-2.5 border border-[var(--card-border)] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 text-xs font-bold rounded-2xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={!bilingualReport.isValid || importingBilingualQuiz}
                  onClick={async () => {
                    if (!bilingualQuizTitle.trim()) {
                      alert('Please enter a Quiz Paper Title.');
                      return;
                    }
                    setImportingBilingualQuiz(true);
                    try {
                      const res = await db.importBilingualQuiz({
                        title: bilingualQuizTitle.trim(),
                        courseId: selectedSeriesId || 'bpsc-foundation',
                        description: bilingualQuizDescription.trim(),
                        questions: bilingualReport.questionsPreview || parsedBulkQuestions || [],
                        replaceExisting: replaceExistingQuizConfirm
                      });

                      if (res && res.success) {
                        const createdQuiz = res.data?.quiz || { id: res.quizId || bilingualQuizTitle.toLowerCase().replace(/\s+/g, '-') };
                        const createdQs = res.data?.questions || [];

                        // Save to local storage cache so UI reflects immediately
                        if (typeof window !== 'undefined' && selectedSeriesId) {
                          try {
                            const storedQuizzes = localStorage.getItem(`finalattempt_quizzes_${selectedSeriesId}`);
                            const currentQuizzes: any[] = storedQuizzes ? JSON.parse(storedQuizzes) : [];
                            const nextQuizzes = [...currentQuizzes.filter(q => q.id !== createdQuiz.id), createdQuiz];
                            localStorage.setItem(`finalattempt_quizzes_${selectedSeriesId}`, JSON.stringify(nextQuizzes));

                            if (createdQs.length > 0) {
                              localStorage.setItem(`finalattempt_questions_${createdQuiz.id}`, JSON.stringify(createdQs));
                            }
                          } catch (_) { }
                        }

                        alert(`🎉 Successfully imported ${res.data?.importedQuestionsCount || res.committedCount || bilingualReport.mappedQuestionsCount} 1:1 bilingual questions with authored English & Hindi content into LMS Database!`);
                        setShowBilingualPdfModal(false);
                        setBilingualReport(null);
                        setBilingualPastedText('');
                        setBilingualQuizTitle('');
                        setBilingualQuizDescription('');
                        loadSeries();
                        if (selectedSeriesId) {
                          const updatedQuizzes = await db.getTestSeriesQuizzes(selectedSeriesId);
                          setQuizzes(updatedQuizzes || []);
                        }
                      } else {
                        alert(`❌ LMS Commit Failed: ${res?.error || 'Unknown database error'}`);
                      }
                    } catch (err: any) {
                      alert(`❌ LMS Commit Error: ${err.message || 'Network failure'}`);
                    } finally {
                      setImportingBilingualQuiz(false);
                    }
                  }}
                  className="px-8 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-slate-950 font-black text-xs rounded-2xl cursor-pointer shadow-md transition-all flex items-center gap-2"
                >
                  {importingBilingualQuiz ? (
                    <span>Committing to Database...</span>
                  ) : (
                    <span>Commit & Save Quiz Paper ({bilingualReport.mappedQuestionsCount || bilingualReport.totalDetected || (parsedBulkQuestions || []).length} Questions) →</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ADMIN SET PAPER & SOLUTION EXPLANATION KEY INSPECTOR MODAL ── */}
      {inspectingSetQuiz && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div id="set-key-print-container" className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto text-slate-900 dark:text-white">
            {(() => {
              const rawQuestions = quizQuestions[inspectingSetQuiz.id] || [];
              const setQuestions = (() => {
                if (rawQuestions.length === 0) return [];
                if (inspectingSetCode === 'SET-A') {
                  return rawQuestions.map((q: any) => ({ ...q, mappedCorrectKey: q.correctAnswer }));
                }
                const seed = `seed-${inspectingSetQuiz.id}-${inspectingSetCode}`;
                const shuffledQs = shuffleArraySeeded(rawQuestions, `${seed}-q`);
                return shuffledQs.map((q: any) => {
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
                    optionE: shuffledOpts[4]?.text || '',
                    optionAHi: shuffledOpts[0]?.textHi || null,
                    optionBHi: shuffledOpts[1]?.textHi || null,
                    optionCHi: shuffledOpts[2]?.textHi || null,
                    optionDHi: shuffledOpts[3]?.textHi || null,
                    optionEHi: shuffledOpts[4]?.textHi || null,
                    mappedCorrectKey
                  };
                });
              })();

              const handleDownloadCleanSetPdf = () => {
                if (!setQuestions || setQuestions.length === 0) {
                  alert('No questions available in this SET paper.');
                  return;
                }

                const printWin = window.open('', '_blank');
                if (!printWin) {
                  alert('Pop-up blocked. Please allow pop-ups to generate PDF.');
                  return;
                }

                const htmlContent = `
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <title>${inspectingSetQuiz.title} - ${inspectingSetCode} Key Sheet</title>
                      <style>
                        @page {
                          size: A4;
                          margin: 15mm;
                        }
                        body {
                          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
                          color: #0f172a;
                          background: #ffffff;
                          line-height: 1.5;
                          font-size: 13px;
                          margin: 0;
                          padding: 0;
                        }
                        .header-banner {
                          border-bottom: 2px solid #0f172a;
                          padding-bottom: 10px;
                          margin-bottom: 20px;
                        }
                        .header-banner h1 {
                          font-size: 18px;
                          font-weight: 800;
                          margin: 0 0 6px 0;
                          color: #0f172a;
                          text-transform: uppercase;
                          letter-spacing: 0.5px;
                        }
                        .header-banner .meta {
                          font-size: 12px;
                          font-weight: 700;
                          color: #d97706;
                          display: flex;
                          justify-content: space-between;
                        }
                        .q-card {
                          border: 1px solid #cbd5e1;
                          border-radius: 8px;
                          padding: 12px 14px;
                          margin-bottom: 14px;
                          page-break-inside: avoid;
                          break-inside: avoid;
                          background: #ffffff;
                        }
                        .q-title {
                          font-size: 13px;
                          font-weight: 700;
                          color: #0f172a;
                          margin: 0 0 3px 0;
                        }
                        .q-title-hi {
                          font-size: 12px;
                          font-weight: 500;
                          color: #475569;
                          margin: 0 0 8px 0;
                        }
                        .key-badge {
                          display: inline-block;
                          background: #dcfce7;
                          border: 1px solid #86efac;
                          color: #15803d;
                          font-weight: 800;
                          font-size: 11px;
                          padding: 2px 8px;
                          border-radius: 6px;
                          margin-bottom: 8px;
                          text-transform: uppercase;
                        }
                        .options-grid {
                          display: grid;
                          grid-template-columns: 1fr 1fr;
                          gap: 6px;
                          margin-bottom: 8px;
                        }
                        .opt-item {
                          padding: 6px 10px;
                          border: 1px solid #e2e8f0;
                          border-radius: 6px;
                          font-size: 12px;
                          color: #334155;
                        }
                        .opt-item.correct {
                          background: #f0fdf4;
                          border-color: #86efac;
                          color: #166534;
                          font-weight: 700;
                        }
                        .explanation-box {
                          background: #fffbeb;
                          border: 1px solid #fde68a;
                          border-radius: 6px;
                          padding: 8px 10px;
                          font-size: 11.5px;
                          color: #92400e;
                          margin-top: 6px;
                        }
                        .explanation-box strong {
                          color: #b45309;
                          display: block;
                          margin-bottom: 2px;
                          font-size: 10.5px;
                          text-transform: uppercase;
                          letter-spacing: 0.5px;
                        }
                      </style>
                    </head>
                    <body>
                      <div class="header-banner">
                        <h1>${inspectingSetQuiz.title}</h1>
                        <div class="meta">
                          <span>PAPER SET VARIANT: <strong>${inspectingSetCode}</strong></span>
                          <span>TOTAL QUESTIONS: <strong>${setQuestions.length} Qs</strong></span>
                        </div>
                      </div>

                      <div class="questions-list">
                        ${setQuestions.map((q, idx) => {
                  const correctKey = q.mappedCorrectKey || q.correctAnswer;
                  const options = [
                    { key: 'A', text: q.optionA, textHi: q.optionAHi },
                    { key: 'B', text: q.optionB, textHi: q.optionBHi },
                    { key: 'C', text: q.optionC, textHi: q.optionCHi },
                    { key: 'D', text: q.optionD, textHi: q.optionDHi },
                    { key: 'E', text: q.optionE, textHi: q.optionEHi },
                  ].filter(o => o.text || o.textHi);

                  return `
                            <div class="q-card">
                              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
                                <div style="flex: 1;">
                                  <div class="q-title">${idx + 1}. ${q.questionText || ''}</div>
                                  ${q.questionTextHi ? `<div class="q-title-hi">${q.questionTextHi}</div>` : ''}
                                </div>
                                <div class="key-badge">Key: Option ${correctKey}</div>
                              </div>

                              <div class="options-grid">
                                ${options.map(opt => {
                    const isCorrect = opt.key === correctKey;
                    return `
                                    <div class="opt-item ${isCorrect ? 'correct' : ''}">
                                      (${opt.key}) ${opt.text || ''} ${opt.textHi ? `/ ${opt.textHi}` : ''} ${isCorrect ? '✓' : ''}
                                    </div>
                                  `;
                  }).join('')}
                              </div>

                              ${(q.explanation || q.explanationHi) ? `
                                <div class="explanation-box">
                                  <strong>Official Explanation / Solution:</strong>
                                  ${q.explanation ? `<div>${q.explanation}</div>` : ''}
                                  ${q.explanationHi ? `<div style="color: #a16207; margin-top: 4px;">${q.explanationHi}</div>` : ''}
                                </div>
                              ` : ''}
                            </div>
                          `;
                }).join('')}
                      </div>

                      <script>
                        window.onload = function() {
                          setTimeout(function() {
                            window.print();
                          }, 300);
                        };
                      </script>
                    </body>
                  </html>
                `;

                printWin.document.open();
                printWin.document.write(htmlContent);
                printWin.document.close();
              };

              return (
                <>
                  {/* Modal Header */}
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div>
                      <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Official Admin SET Paper Inspector & Key Sheet</span>
                      <h3 className="font-heading font-black text-xl text-slate-900 dark:text-white mt-0.5">
                        {inspectingSetQuiz.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Inspect randomized SET paper layouts (SET-A, SET-B, SET-C, SET-D), question order, option keys, & solutions.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInspectingSetQuiz(null)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* SET Code Navigation Tabs & PDF Export Button */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-2 uppercase">Select SET Paper:</span>
                      {(['SET-A', 'SET-B', 'SET-C', 'SET-D'] as const).map((setCode) => (
                        <button
                          key={setCode}
                          type="button"
                          onClick={() => setInspectingSetCode(setCode)}
                          className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${inspectingSetCode === setCode
                              ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
                              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-500'
                            }`}
                        >
                          {setCode}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleDownloadCleanSetPdf}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2 uppercase tracking-wider"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Print / Download SET PDF Key</span>
                    </button>
                  </div>

                  {/* SET Paper & Question Explanations List */}
                  {setQuestions.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-xs font-bold space-y-2">
                      <p>No questions found in this quiz bank.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                        <span>Paper SET Variant: <strong className="text-amber-500 font-mono text-sm">{inspectingSetCode}</strong></span>
                        <span>Total Paper Questions: <strong className="text-slate-900 dark:text-white font-black">{setQuestions.length} Qs</strong></span>
                      </div>

                      {setQuestions.map((q: any, idx: number) => (
                        <div key={q.id || idx} className="p-4 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 text-xs shadow-xs">
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1 flex-1">
                              <p className="font-bold text-slate-900 dark:text-white text-sm">{idx + 1}. {q.questionText}</p>
                              {q.questionTextHi && (
                                <p className="font-medium text-slate-600 dark:text-slate-400 text-xs">{q.questionTextHi}</p>
                              )}
                            </div>
                            <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-black text-xs rounded-lg uppercase shrink-0">
                              KEY: OPTION {q.mappedCorrectKey || q.correctAnswer}
                            </span>
                          </div>

                          {/* Options Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium pt-1">
                            {['A', 'B', 'C', 'D'].map((optKey) => {
                              const isCorrect = (q.mappedCorrectKey || q.correctAnswer) === optKey;
                              const optText = q[`option${optKey}`];
                              const optTextHi = q[`option${optKey}Hi`];
                              return (
                                <div
                                  key={optKey}
                                  className={`p-2.5 rounded-xl border flex items-center justify-between ${isCorrect
                                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold'
                                      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                                    }`}
                                >
                                  <span>({optKey}) {optText} {optTextHi ? ` / ${optTextHi}` : ''}</span>
                                  {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-1" />}
                                </div>
                              );
                            })}
                          </div>

                          {/* Explanation Section */}
                          {(q.explanation || q.explanationHi) && (
                            <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs space-y-1 text-slate-800 dark:text-slate-200">
                              <span className="font-black text-amber-600 dark:text-amber-400 uppercase text-[10px] block tracking-wider">Official Explanation Solution:</span>
                              <p className="leading-relaxed">{q.explanation}</p>
                              {q.explanationHi && <p className="leading-relaxed text-slate-600 dark:text-slate-400">{q.explanationHi}</p>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
}


