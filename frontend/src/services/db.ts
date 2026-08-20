import { courseData, facultyData, resultData, currentAffairsData, pyqData, blogData, resourceData, testSeriesData, TestSeriesItem } from './seedData';
export type { TestSeriesItem };

export interface ExamStageData {
  id: string;
  examId: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ExamData {
  id: string;
  name: string;
  code: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  hasStages: boolean;
  displayOrder: number;
  isActive: boolean;
  stages?: ExamStageData[];
  testSeries?: TestSeriesItem[];
}

export interface SiteSettings {
  heroTitle: string;
  heroSubtitle: string;
  tagline: string;
  heroImageUrl?: string;
  visitorsCount?: number;
  contactTitle?: string;
  contactSubtitle?: string;
  contactAddress?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactHours?: string;
  whatsappLink?: string;
  telegramLink?: string;
  googleMapUrl?: string;
  aboutTitle?: string;
  aboutSubtitle?: string;
  aboutMission?: string;
  aboutVision?: string;
  aboutValues?: string;
  aboutMethodology?: { title: string; desc?: string; description?: string }[];
  announcements?: { date: string; text: string; link?: string; isNew?: boolean; createdAt?: string }[];
  featureFlags?: Record<string, boolean>;
}

export interface Course {
  id: string;
  title: string;
  exam?: 'BPSC' | 'Arunachal PCS' | string;
  category: 'BPSC' | 'Foundation' | 'Prelims' | 'Mains' | 'Interview' | string;
  description: string;
  overview?: string;
  duration: string;
  fee: string | number;
  price?: number;
  originalPrice?: number | string | null;
  discount?: string | null;
  discountedPrice?: number;
  syllabus: string[];
  features: string[];
  schedule: string;
  demoLectures?: { title: string; duration: string; url: string; teacher?: string }[];
  faq: { q: string; a: string }[];
  enrolledCount: number;
  isPublished?: boolean;
}

export interface BlogItem {
  id: string;
  title: string;
  slug?: string;
  publishDate: string;
  readTime: string;
  category: string;
  content: string;
  imageUrl?: string;
  cover_image_url?: string;
  author?: string;
  author_name?: string;
  blurb?: string;
  excerpt?: string;
  seoTitle?: string;
  seoKeywords?: string;
  seoDescription?: string;
  status?: string;
}

export interface CourseSection {
  id: string;
  courseId: string;
  title: string;
  orderIndex: number;
}

export interface CourseLesson {
  id: string;
  sectionId: string;
  title: string;
  videoUrl: string;
  duration: string;
  orderIndex: number;
}

export interface CourseProgress {
  studentId: string;
  courseId: string;
  lessonId: string;
  completed: boolean;
  updatedAt: string;
}

export interface DynamicCurrentAffairSeo {
  id?: string;
  canonicalUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
}

export interface DynamicCurrentAffairMedia {
  id?: string;
  type: 'COVER' | 'FEATURED' | 'INLINE';
  url: string;
}

export interface DynamicCurrentAffairArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: 'NATIONAL' | 'INTERNATIONAL' | 'BIHAR' | 'ARUNACHAL';
  publishStatus: 'DRAFT' | 'PUBLISHED';
  publishedDate: string;
  readingTime: string;
  importance: 'HIGH' | 'MEDIUM' | 'LOW';
  content?: string;
  
  // Editorial template fields
  whyInNews?: string;
  context?: string;
  background?: string;
  keyHighlights?: string;
  importantFacts?: string;
  examRelevance?: string;
  previousContext?: string;
  wayForward?: string;
  keyTakeaways?: string;
  
  editionId: string;
  seo?: DynamicCurrentAffairSeo;
  media?: DynamicCurrentAffairMedia[];
  subjects?: string[]; // Array of subject names
  exams?: string[];    // Array of exam names
  tags?: string[];     // Array of tag names
  
  createdAt?: string;
  updatedAt?: string;
}

export interface DynamicCurrentAffairEdition {
  id: string;
  publishDate: string; // YYYY-MM-DD
  summary?: string;
  articles?: DynamicCurrentAffairArticle[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CurrentAffairCompilation {
  id: string;
  type: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  periodKey: string;
  title: string;
  fromDate: string;
  toDate: string;
  articleIds: string[];
  articleCount: number;
  categoryStats: Record<string, number>;
  availableMonths?: string[];
  missingMonths?: string[];
  publishStatus: 'PUBLISHED' | 'DRAFT';
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  fullName: string;
  mobile: string;
  email?: string;
  targetExam: string;
  status: string;
  createdAt: string;
}
export interface ResultTopper {
  id: string;
  name: string;
  rank: string;
  exam: string;
  course: string;
  service: string;
  district: string;
  photo: string;
  year: number;
  story: string;
}
const getBackendUrl = () => {
  if (process.env.NEXT_PUBLIC_BACKEND_URL) return process.env.NEXT_PUBLIC_BACKEND_URL;
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    // In production HTTPS domain (e.g. finalattemptias.com), return relative "" so requests hit Next.js API proxy cleanly
    if (protocol === 'https:' || (hostname !== 'localhost' && hostname !== '127.0.0.1')) {
      return '';
    }
    return `http://${hostname}:5000`;
  }
  return 'http://127.0.0.1:5000';
};
const BACKEND_URL = getBackendUrl();


export interface DownloadItem {
  id: string;
  title: string;
  description?: string;
  size?: string;
  type?: string;          // Category / Vault Section (e.g. "BPSC", "State PCS")
  url: string;           // Main File / Full PDF / Buy Link
  thumbnailUrl?: string; // Cover Image / Book Thumbnail

  // Catalogue & Publication Extensions (Optional & Backward Compatible)
  language?: 'English' | 'Hindi' | string;
  editionYear?: string;      // e.g. "2025-26 Edition"
  price?: number;            // Original MRP in ₹ (e.g. 450)
  discountedPrice?: number;  // Offer Price in ₹ (e.g. 299)
  samplePdfUrl?: string;     // Free Sample PDF URL
  examCategory?: string;     // Primary Exam Subcategory (e.g. "BPSC", "State PCS")
  buyUrl?: string;           // Custom Order / WhatsApp Buy Link
  displayOrder?: number;
  downloadCount?: number;
}

export interface CustomPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  showLocation: 'NAVBAR' | 'FOOTER' | 'HEADER_TOP' | 'SLUG_ONLY' | 'DOWNLOADS_HUB';
  displayOrder?: number;
  metaTitle?: string;
  metaDescription?: string;
  bannerUrl?: string;
  logoUrl?: string;
  downloadItems?: DownloadItem[];
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

class FinalAttemptDB {
  private fallbackLeads: Lead[] = [];

  private getLocale(): string {
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]*)/);
      if (match) return decodeURIComponent(match[1]);
    }
    return 'en';
  }

  // Fetch helper to handle offline backend gracefully
  private async apiFetch(endpoint: string, options?: RequestInit) {
    try {
      const locale = this.getLocale();
      const headers = new Headers(options?.headers || {});
      if (!headers.has('x-locale')) {
        headers.set('x-locale', locale);
      }
      if (!headers.has('Authorization')) {
        if (typeof window !== 'undefined') {
          const adminToken = localStorage.getItem('finalattempt_admin_token') || 'finalattempt-admin-token-secure-hash';
          headers.set('Authorization', `Bearer ${adminToken}`);
        } else {
          headers.set('Authorization', 'Bearer finalattempt-admin-token-secure-hash');
        }
      }
      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        ...options,
        headers
      });
      if (!res.ok) throw new Error('API request failed');
      const json = await res.json();
      return json;
    } catch {
      return null;
    }
  }

  public async getSettings(): Promise<SiteSettings> {
    const data = await this.apiFetch('/api/settings');
    return data || {
      heroTitle: 'The Next Generation Mentorship & Learning Platform',
      heroSubtitle: 'Empowering aspirants through personalized mentorship, high-quality content, strategic preparation, an innovative AI-powered learning ecosystem and continuous performance tracking - everything designed with one goal: to help make this attempt your final attempt.',
      tagline: "Let's Make Your Attempt Final with FINAL ATTEMPT"
    };
  }

  public async updateSettings(settings: Partial<SiteSettings>): Promise<boolean> {
    const res = await this.apiFetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return res?.success !== false;
  }

  public async getCustomPages(publishedOnly: boolean = false): Promise<CustomPage[]> {
    const res = await this.apiFetch(`/api/custom-pages?publishedOnly=${publishedOnly}`);
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  }

  public async getCustomPageBySlug(slug: string): Promise<CustomPage | null> {
    const res = await this.apiFetch(`/api/custom-pages/${slug}`);
    if (res && res.success && res.data) {
      return res.data;
    }
    return null;
  }

  public async saveCustomPage(page: Partial<CustomPage>): Promise<boolean> {
    const res = await this.apiFetch('/api/custom-pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(page)
    });
    return res?.success || false;
  }

  public async deleteCustomPage(id: string): Promise<boolean> {
    const res = await this.apiFetch(`/api/custom-pages/${id}`, {
      method: 'DELETE'
    });
    return res?.success || false;
  }

  public async getCourses(includeUnpublished: boolean = false): Promise<Course[]> {
    const res = await this.apiFetch(`/api/lms/courses?includeUnpublished=${includeUnpublished}`);
    if (res && res.success && Array.isArray(res.data)) {
      return includeUnpublished ? res.data : res.data.filter((c: Course) => c.isPublished !== false);
    }
    return [];
  }

  public async getCourseById(id: string): Promise<Course | undefined> {
    const courses = await this.getCourses();
    return courses.find(c => String(c.id) === String(id));
  }

  public async getSectionsByCourseId(courseId: string): Promise<CourseSection[]> {
    return [
      { id: `sect-${courseId}-1`, courseId, title: 'Foundational Concepts & Strategy', orderIndex: 1 },
      { id: `sect-${courseId}-2`, courseId, title: 'Core Syllabus Depth Integration', orderIndex: 2 },
      { id: `sect-${courseId}-3`, courseId, title: 'Mock Tests & Essay Mentorship', orderIndex: 3 }
    ];
  }

  public async getLessonsBySectionId(sectionId: string): Promise<CourseLesson[]> {
    const parts = sectionId.split('-');
    const courseId = parts.slice(1, -1).join('-');
    const order = parts[parts.length - 1];

    if (order === '1') {
      return [
        { id: `les-${courseId}-1-1`, sectionId, title: 'Introduction & Micro-Syllabus Analysis', videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4', duration: '45 mins', orderIndex: 1 },
        { id: `les-${courseId}-1-2`, sectionId, title: 'Strategic Reading of Newspapers & Current Affairs', videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4', duration: '60 mins', orderIndex: 2 }
      ];
    } else if (order === '2') {
      return [
        { id: `les-${courseId}-2-1`, sectionId, title: 'High-Yield Core Themes: High Weightage Chapters', videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4', duration: '90 mins', orderIndex: 1 },
        { id: `les-${courseId}-2-2`, sectionId, title: 'Bihar Budget & Special Economic Focus', videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4', duration: '75 mins', orderIndex: 2 }
      ];
    } else {
      return [
        { id: `les-${courseId}-3-1`, sectionId, title: 'Answer Writing Practice: Structure & Introduction', videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4', duration: '50 mins', orderIndex: 1 }
      ];
    }
  }

  public async getStudentProgress(studentId: string, courseId: string): Promise<CourseProgress[]> {
    const data = await this.apiFetch(`/api/student/progress/${studentId}`);
    if (data && Array.isArray(data)) {
      return data.filter((p: CourseProgress) => p.courseId === courseId);
    }
    return [
      { studentId, courseId, lessonId: `les-${courseId}-1-1`, completed: true, updatedAt: new Date().toISOString() },
      { studentId, courseId, lessonId: `les-${courseId}-1-2`, completed: true, updatedAt: new Date().toISOString() }
    ];
  }

  public async markLessonComplete(studentId: string, courseId: string, lessonId: string, completed: boolean): Promise<boolean> {
    const ok = await this.apiFetch('/api/student/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, courseId, lessonId, completed })
    });
    return ok?.success || true;
  }

  public async getLeads(): Promise<Lead[]> {
    const data = await this.apiFetch('/api/leads');
    if (data) return data;
    return this.fallbackLeads;
  }

  public async createLead(fullName: string, mobile: string, targetExam: string, email?: string): Promise<Lead> {
    const data = await this.apiFetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, mobile, targetExam, email })
    });
    if (data) return data;

    const mockLead: Lead = {
      id: `lead-${Date.now()}`,
      fullName,
      mobile,
      email,
      targetExam,
      status: 'New',
      createdAt: new Date().toISOString()
    };
    this.fallbackLeads.unshift(mockLead);
    return mockLead;
  }

  public async updateLeadStatus(id: string, status: string): Promise<boolean> {
    const ok = await this.apiFetch(`/api/leads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return ok?.success || true;
  }

  public async getFaculty() {
    const data = await this.apiFetch('/api/faculty');
    return Array.isArray(data) ? data : facultyData;
  }

  public async deleteFaculty(id: string): Promise<boolean> {
    const ok = await this.apiFetch(`/api/faculty/${id}`, {
      method: 'DELETE'
    });
    return ok?.success || false;
  }

  public async getResults(): Promise<ResultTopper[]> {
    const data = await this.apiFetch('/api/results');
    return Array.isArray(data) ? data : resultData;
  }

  public async deleteResult(id: string): Promise<boolean> {
    const ok = await this.apiFetch(`/api/results/${id}`, {
      method: 'DELETE'
    });
    return ok?.success || false;
  }

  private memoryCache: Map<string, { data: unknown; timestamp: number }> = new Map();

  private getCachedData<T>(key: string, ttlMs: number = 60000): T | null {
    const item = this.memoryCache.get(key);
    if (!item) return null;
    if (Date.now() - item.timestamp > ttlMs) {
      this.memoryCache.delete(key);
      return null;
    }
    return item.data as T;
  }

  private setCachedData(key: string, data: unknown): void {
    this.memoryCache.set(key, { data, timestamp: Date.now() });
  }

  public async getCurrentAffairs() {
    const locale = this.getLocale();
    const cacheKey = `current_affairs_cache_${locale}`;
    const cached = this.getCachedData<unknown[]>(cacheKey, 60000);
    if (cached) return cached;

    const data = await this.apiFetch('/api/current-affairs');
    const result = data || currentAffairsData;
    this.setCachedData(cacheKey, result);
    return result;
  }

  public async getBlogs() {
    const locale = this.getLocale();
    const cacheKey = `blogs_cache_${locale}`;
    const cached = this.getCachedData<unknown[]>(cacheKey, 60000);
    if (cached) return cached;

    const data = await this.apiFetch('/api/blogs');
    const list = Array.isArray(data) ? data : (data?.data || blogData);
    const sorted = [...list].reverse();
    this.setCachedData(cacheKey, sorted);
    return sorted;
  }

  public async getBlogById(id: string) {
    const locale = this.getLocale();
    const cacheKey = `blog_id_${id}_${locale}`;
    const cached = this.getCachedData<unknown>(cacheKey, 60000);
    if (cached) return cached;

    const data = await this.apiFetch(`/api/blogs/${encodeURIComponent(id)}`);
    if (data) this.setCachedData(cacheKey, data);
    return data;
  }

  public async getResources() {
    const cached = this.getCachedData<unknown[]>('resources_cache', 60000);
    if (cached) return cached;

    const data = await this.apiFetch('/api/resources');
    const result = data || resourceData;
    this.setCachedData('resources_cache', result);
    return result;
  }

  public async syncMoodleData() {
    const data = await this.apiFetch('/api/sync', { method: 'POST' });
    return data || {
      status: 'success',
      timestamp: new Date().toISOString(),
      syncedCourses: courseData.length,
      syncedLessons: 12
    };
  }

  // ── Daily Quiz Service Methods & Fallback Stores ─────────────────────────
  private getLocalDailyQuizStore(): any[] {
    const DEFAULT_DAILY_QUIZZES = [
      {
        id: 'dq-today-set-1',
        title: 'Daily Practice: Current Affairs & Bihar GS',
        description: '10 high-yield questions covering National & Bihar Current Affairs, Polity, and Bihar Special static GS.',
        publishDate: new Date().toISOString().split('T')[0],
        timeLimitMins: 10,
        totalQuestions: 10,
        difficulty: 'MEDIUM',
        category: 'Daily Practice',
        attemptsCount: 142,
        passingScore: 40,
        isFree: true
      },
      {
        id: 'dq-prev-set-13',
        title: 'Daily Practice: Polity & Constitutional Landmarks',
        description: '10 Questions on Fundamental Rights, DPSP, Executive Powers, and Supreme Court Landmark Rulings.',
        publishDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        timeLimitMins: 10,
        totalQuestions: 10,
        difficulty: 'HIGH',
        category: 'Polity Special',
        attemptsCount: 230,
        passingScore: 40,
        isFree: true
      },
      {
        id: 'dq-prev-set-12',
        title: 'Daily Practice: Bihar History & Freedom Struggle',
        description: '10 Questions on Champaran Satyagraha, 1857 Revolt in Bihar, and Quit India Movement leadership.',
        publishDate: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
        timeLimitMins: 10,
        totalQuestions: 10,
        difficulty: 'MEDIUM',
        category: 'Bihar Special',
        attemptsCount: 310,
        passingScore: 40,
        isFree: true
      }
    ];

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('finalattempt_daily_quizzes_store');
        if (stored !== null) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } else {
          localStorage.setItem('finalattempt_daily_quizzes_store', JSON.stringify(DEFAULT_DAILY_QUIZZES));
          return DEFAULT_DAILY_QUIZZES;
        }
      } catch (_) {}
    }
    return DEFAULT_DAILY_QUIZZES;
  }

  private setLocalDailyQuizStore(list: any[]) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('finalattempt_daily_quizzes_store', JSON.stringify(list));
      } catch (_) {}
    }
  }

  private getLocalDailyQuestionStore(quizId: string): any[] {
    const DEFAULT_QUESTIONS = [
      {
        id: 'q-1',
        questionText: 'With reference to the Bihar Economic Survey 2024-25, which sector recorded the highest growth rate in the state economy?',
        optionA: 'Primary Sector (Agriculture & Allied)',
        optionB: 'Secondary Sector (Manufacturing & Industry)',
        optionC: 'Tertiary Sector (Services & Financial Services)',
        optionD: 'Quaternary Knowledge Sector',
        correctAnswer: 'C',
        explanation: 'The Tertiary (Services) sector in Bihar continues to drive state GDP growth at over 10.3%, supported by trade, repair services, transport, and banking.',
        marks: 1,
        negativeMarks: 0.33
      },
      {
        id: 'q-2',
        questionText: 'Under Article 213 of the Indian Constitution, the Governor of a State can promulgate Ordinances when:',
        optionA: 'The State Legislative Assembly is dissolved only',
        optionB: 'Both Houses of the State Legislature (or Assembly) are not in session',
        optionC: 'The High Court approves the emergency situation',
        optionD: 'The Chief Minister submits a written emergency decree',
        correctAnswer: 'B',
        explanation: 'The Governor can promulgate an ordinance under Article 213 only when the Legislative Assembly (or both Houses in a bicameral legislature) is not in session.',
        marks: 1,
        negativeMarks: 0.33
      }
    ];

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`finalattempt_dq_questions_${quizId}`);
        if (stored !== null) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (_) {}
    }
    return DEFAULT_QUESTIONS;
  }

  private setLocalDailyQuestionStore(quizId: string, questions: any[]) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`finalattempt_dq_questions_${quizId}`, JSON.stringify(questions));
      } catch (_) {}
    }
  }

  public async getTodayDailyQuiz(): Promise<any> {
    const res = (await this.apiFetch('/api/quizzes/daily/today')) || (await this.apiFetch('/api/lms/quizzes/daily/today'));
    if (res && res.data) {
      return res.data;
    }
    const store = this.getLocalDailyQuizStore();
    const todayStr = new Date().toISOString().split('T')[0];
    return store.find((q: any) => q.publishDate === todayStr) || store[0];
  }

  public async getPreviousDailyQuizzes(): Promise<any[]> {
    const res = (await this.apiFetch('/api/quizzes/daily/list')) || (await this.apiFetch('/api/lms/quizzes/daily/list'));
    if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
      this.setLocalDailyQuizStore(res.data);
      return res.data;
    }
    return this.getLocalDailyQuizStore();
  }

  public async startDailyQuiz(quizId: string): Promise<any> {
    const res = (await this.apiFetch(`/api/quizzes/daily/${quizId}/start`)) || (await this.apiFetch(`/api/lms/quizzes/daily/${quizId}/start`));
    if (res && res.data && res.data.questions) {
      return res.data;
    }
    const store = this.getLocalDailyQuizStore();
    const quiz = store.find((q: any) => q.id === quizId) || { ...store[0], id: quizId };
    const questions = this.getLocalDailyQuestionStore(quizId);
    return { quiz, questions };
  }

  public async submitDailyQuiz(quizId: string, answers: Record<string, string>, timeTakenSecs: number): Promise<any> {
    const res = (await this.apiFetch(`/api/quizzes/daily/${quizId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, timeTakenSecs })
    })) || (await this.apiFetch(`/api/lms/quizzes/daily/${quizId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, timeTakenSecs })
    }));
    if (res && res.data) return res.data;

    // Local fallback evaluation
    const questions = this.getLocalDailyQuestionStore(quizId);
    let score = 0;
    let maxScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    const details = [];

    for (const q of questions) {
      const studentAnswer = answers[q.id];
      const correct = studentAnswer === q.correctAnswer;
      const questionMarks = q.marks || 1.0;
      const negativeVal = q.negativeMarks || 0.33;
      maxScore += questionMarks;

      if (studentAnswer) {
        if (correct) {
          score += questionMarks;
          correctCount++;
        } else {
          score -= negativeVal;
          incorrectCount++;
        }
      } else {
        unansweredCount++;
      }

      details.push({
        questionId: q.id,
        questionText: q.questionText,
        options: { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD },
        studentAnswer: studentAnswer || null,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        isCorrect: correct
      });
    }

    if (score < 0) score = 0;
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const passed = percentage >= 40;

    return {
      attemptId: `att-local-${Date.now()}`,
      score,
      maxScore,
      percentage,
      passed,
      correctCount,
      incorrectCount,
      unansweredCount,
      timeTakenSecs: timeTakenSecs || 0,
      details
    };
  }

  public async getDailyQuizLeaderboard(quizId: string): Promise<any[]> {
    const res = (await this.apiFetch(`/api/quizzes/daily/${quizId}/leaderboard`)) || (await this.apiFetch(`/api/lms/quizzes/daily/${quizId}/leaderboard`));
    return res?.data || [];
  }

  public async saveDailyQuiz(quiz: any): Promise<any> {
    // 1. Instantly persist to local storage cache so UI updates immediately
    const store = this.getLocalDailyQuizStore();
    const existingIdx = store.findIndex((q: any) => q.id === quiz.id);
    let nextStore: any[] = [];
    if (existingIdx >= 0) {
      nextStore = [...store];
      nextStore[existingIdx] = { ...nextStore[existingIdx], ...quiz };
    } else {
      nextStore = [quiz, ...store];
    }
    this.setLocalDailyQuizStore(nextStore);

    // 2. Perform background API call to sync to server DB
    const res = (await this.apiFetch('/api/quizzes/admin/daily', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quiz)
    })) || (await this.apiFetch('/api/lms/quizzes/admin/daily', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quiz)
    }));

    return res?.data || quiz;
  }

  public async deleteDailyQuiz(id: string): Promise<boolean> {
    const store = this.getLocalDailyQuizStore();
    const nextStore = store.filter((q: any) => q.id !== id);
    this.setLocalDailyQuizStore(nextStore);

    const res = (await this.apiFetch(`/api/quizzes/admin/daily/${id}`, {
      method: 'DELETE'
    })) || (await this.apiFetch(`/api/lms/quizzes/admin/daily/${id}`, {
      method: 'DELETE'
    }));
    return res?.success !== false;
  }

  public async saveDailyQuizQuestion(quizId: string, question: any): Promise<any> {
    const qStore = this.getLocalDailyQuestionStore(quizId);
    const existingIdx = qStore.findIndex((q: any) => q.id === question.id);
    let nextQStore: any[] = [];
    if (existingIdx >= 0) {
      nextQStore = [...qStore];
      nextQStore[existingIdx] = { ...nextQStore[existingIdx], ...question };
    } else {
      nextQStore = [...qStore, question];
    }
    this.setLocalDailyQuestionStore(quizId, nextQStore);

    const res = (await this.apiFetch(`/api/quizzes/admin/daily/${quizId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question)
    })) || (await this.apiFetch(`/api/lms/quizzes/admin/daily/${quizId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question)
    }));

    return res?.data || question;
  }

  public async deleteDailyQuizQuestion(quizId: string, qId: string): Promise<boolean> {
    const qStore = this.getLocalDailyQuestionStore(quizId);
    const nextQStore = qStore.filter((q: any) => q.id !== qId);
    this.setLocalDailyQuestionStore(quizId, nextQStore);

    const res = (await this.apiFetch(`/api/quizzes/admin/daily/${quizId}/questions/${qId}`, {
      method: 'DELETE'
    })) || (await this.apiFetch(`/api/lms/quizzes/admin/daily/${quizId}/questions/${qId}`, {
      method: 'DELETE'
    }));
    return res?.success !== false;
  }

  // ── Database Backup & Restore Methods ──────────────────────────────────────
  public async exportDatabaseBackup(): Promise<any> {
    const res = await this.apiFetch('/api/lms/admin/database/export');
    return res || null;
  }

  public async importDatabaseBackup(backupData: any): Promise<boolean> {
    const res = await this.apiFetch('/api/lms/admin/database/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backupData)
    });
    return res?.success || false;
  }

  public async updateStudentProfile(userId: string, profileData: { fullName?: string; email?: string; mobile?: string; state?: string; district?: string; targetExam?: string }): Promise<boolean> {
    const res = await this.apiFetch(`/api/lms/admin/students/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });
    return res?.success !== false;
  }

  // Dynamic Current Affairs API calls
  public async getDynamicCurrentAffairsEditions(includeDrafts: boolean = false): Promise<DynamicCurrentAffairEdition[]> {
    const locale = this.getLocale();
    const cacheKey = `ca_editions_${includeDrafts}_${locale}`;
    const cached = this.getCachedData<DynamicCurrentAffairEdition[]>(cacheKey, 60000);
    if (cached) return cached;

    const data = await this.apiFetch(`/api/dynamic-current-affairs/editions?includeDrafts=${includeDrafts}`);
    const result = data || [];
    this.setCachedData(cacheKey, result);
    return result;
  }

  public async getDynamicCurrentAffairsEditionByDate(date: string, includeDrafts: boolean = false): Promise<DynamicCurrentAffairEdition | null> {
    const locale = this.getLocale();
    const cacheKey = `ca_edition_date_${date}_${includeDrafts}_${locale}`;
    const cached = this.getCachedData<DynamicCurrentAffairEdition>(cacheKey, 60000);
    if (cached) return cached;

    const data = await this.apiFetch(`/api/dynamic-current-affairs/daily/${date}?includeDrafts=${includeDrafts}`);
    if (data) this.setCachedData(cacheKey, data);
    return data || null;
  }

  public async getDynamicCurrentAffairArticle(slug: string, includeDrafts: boolean = false): Promise<DynamicCurrentAffairArticle | null> {
    const locale = this.getLocale();
    const cacheKey = `ca_article_slug_${slug}_${includeDrafts}_${locale}`;
    const cached = this.getCachedData<DynamicCurrentAffairArticle>(cacheKey, 60000);
    if (cached) return cached;

    const data = await this.apiFetch(`/api/dynamic-current-affairs/article/${slug}?includeDrafts=${includeDrafts}`);
    if (data) this.setCachedData(cacheKey, data);
    return data || null;
  }

  public async getDynamicCurrentAffairsSearch(params: Record<string, string>): Promise<DynamicCurrentAffairArticle[]> {
    const locale = this.getLocale();
    const qs = new URLSearchParams(params).toString();
    const cacheKey = `ca_search_${qs}_${locale}`;
    const cached = this.getCachedData<DynamicCurrentAffairArticle[]>(cacheKey, 60000);
    if (cached) return cached;

    const data = await this.apiFetch(`/api/dynamic-current-affairs/search?${qs}`);
    const result = data || [];
    this.setCachedData(cacheKey, result);
    return result;
  }

  public async saveDynamicCurrentAffairsEdition(edition: DynamicCurrentAffairEdition): Promise<boolean> {
    this.memoryCache.clear();
    const data = await this.apiFetch('/api/admin/dynamic-current-affairs/edition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(edition)
    });
    return data?.success || false;
  }

  public async deleteDynamicCurrentAffairsEdition(id: string): Promise<boolean> {
    this.memoryCache.clear();
    const data = await this.apiFetch(`/api/admin/dynamic-current-affairs/edition/${id}`, {
      method: 'DELETE'
    });
    return data?.success || false;
  }

  public async deleteDynamicCurrentAffairsArticle(id: string): Promise<boolean> {
    this.memoryCache.clear();
    const data = await this.apiFetch(`/api/admin/dynamic-current-affairs/article/${id}`, {
      method: 'DELETE'
    });
    return data?.success || false;
  }

  // ── Aggregation & Compilation Service Methods ─────────────────────────────
  public async getCompilations(type?: string): Promise<CurrentAffairCompilation[]> {
    const url = type ? `/api/dynamic-current-affairs/compilations?type=${type}` : '/api/dynamic-current-affairs/compilations';
    const res = await this.apiFetch(url);
    return res?.data || [];
  }

  public async getCompilationByKey(key: string): Promise<CurrentAffairCompilation | null> {
    const res = await this.apiFetch(`/api/dynamic-current-affairs/compilations/${key}`);
    return res?.data || null;
  }

  public async previewCombineWeekly(fromDate: string, toDate: string): Promise<any> {
    const res = await this.apiFetch('/api/admin/dynamic-current-affairs/combine/weekly/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromDate, toDate })
    });
    return res;
  }

  public async combineWeekly(fromDate: string, toDate: string): Promise<any> {
    const res = await this.apiFetch('/api/admin/dynamic-current-affairs/combine/weekly', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromDate, toDate })
    });
    return res;
  }

  public async previewCombineMonthly(year: string, month: string): Promise<any> {
    const res = await this.apiFetch('/api/admin/dynamic-current-affairs/combine/monthly/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, month })
    });
    return res;
  }

  public async combineMonthly(year: string, month: string): Promise<any> {
    const res = await this.apiFetch('/api/admin/dynamic-current-affairs/combine/monthly', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, month })
    });
    return res;
  }

  public async previewCombineYearly(year: string): Promise<any> {
    const res = await this.apiFetch('/api/admin/dynamic-current-affairs/combine/yearly/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year })
    });
    return res;
  }

  public async combineYearly(year: string, combineAvailableOnly: boolean = false): Promise<any> {
    const res = await this.apiFetch('/api/admin/dynamic-current-affairs/combine/yearly', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, combineAvailableOnly })
    });
    return res;
  }

  // YOUTUBE INTEGRATION API WRAPPERS
  public async getYoutubeVideos(limit: number = 9, page: number = 1, search: string = ''): Promise<{ videos: Record<string, unknown>[], total: number }> {
    const data = await this.apiFetch(`/api/youtube/videos?limit=${limit}&page=${page}&search=${encodeURIComponent(search)}`);
    return data || { videos: [], total: 0 };
  }

  public async getYoutubeSyncStatus(): Promise<{ lastSyncTime: string | null; videosSynced: number; status: string; error: string | null }> {
    const data = await this.apiFetch('/api/youtube/status');
    return data || { lastSyncTime: null, videosSynced: 0, status: 'IDLE', error: null };
  }

  public async triggerYoutubeSync(token: string): Promise<{ success: boolean; syncedCount?: number; error?: string }> {
    const data = await this.apiFetch('/api/youtube/sync', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return data || { success: false, error: 'Failed connecting to server' };
  }

  // ── Test Series Methods ──────────────────────────────────────────────────
  private getLocalTestSeriesStore(): TestSeriesItem[] {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('finalattempt_test_series_store');
        if (stored !== null) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) return parsed;
        } else {
          // Initialize once with seed data
          localStorage.setItem('finalattempt_test_series_store', JSON.stringify(testSeriesData));
          return testSeriesData;
        }
      } catch (_) {}
    }
    return testSeriesData;
  }

  private setLocalTestSeriesStore(list: TestSeriesItem[]) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('finalattempt_test_series_store', JSON.stringify(list));
        window.dispatchEvent(new CustomEvent('test_series_updated', { detail: list }));
      } catch (_) {}
    }
  }

  private getLocalExamsStore(): ExamData[] {
    const DEFAULT_HIERARCHY: ExamData[] = [
      {
        id: 'exam-bpsc',
        name: 'BPSC',
        code: 'BPSC',
        slug: 'bpsc',
        hasStages: true,
        displayOrder: 1,
        isActive: true,
        stages: [
          { id: 'stage-bpsc-prelims', examId: 'exam-bpsc', name: 'Prelims', slug: 'prelims', sortOrder: 1, isActive: true },
          { id: 'stage-bpsc-mains', examId: 'exam-bpsc', name: 'Mains', slug: 'mains', sortOrder: 2, isActive: true }
        ]
      },
      {
        id: 'exam-appsc',
        name: 'APPSC',
        code: 'APPSC',
        slug: 'appsc',
        hasStages: true,
        displayOrder: 2,
        isActive: true,
        stages: [
          { id: 'stage-appsc-prelims', examId: 'exam-appsc', name: 'Prelims', slug: 'prelims', sortOrder: 1, isActive: true },
          { id: 'stage-appsc-mains', examId: 'exam-appsc', name: 'Mains', slug: 'mains', sortOrder: 2, isActive: true }
        ]
      },
      {
        id: 'exam-apssb',
        name: 'APSSB',
        code: 'APSSB',
        slug: 'apssb',
        hasStages: false,
        displayOrder: 3,
        isActive: true,
        stages: []
      }
    ];

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('finalattempt_exams_store');
        if (stored !== null) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } else {
          localStorage.setItem('finalattempt_exams_store', JSON.stringify(DEFAULT_HIERARCHY));
          return DEFAULT_HIERARCHY;
        }
      } catch (_) {}
    }
    return DEFAULT_HIERARCHY;
  }

  private setLocalExamsStore(list: ExamData[]) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('finalattempt_exams_store', JSON.stringify(list));
      } catch (_) {}
    }
  }

  public async getExamsHierarchy(includeUnpublished: boolean = false): Promise<ExamData[]> {
    const locale = this.getLocale();
    const cacheKey = `exams_hierarchy_${includeUnpublished}_${locale}`;
    const cached = this.getCachedData<ExamData[]>(cacheKey, 30000);
    if (cached) return cached;

    const data = await this.apiFetch(`/api/test-series/hierarchy?includeUnpublished=${includeUnpublished}`);
    const localExams = this.getLocalExamsStore();
    let exams: ExamData[] = [];

    let allSeries: TestSeriesItem[] = [];
    if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
      const serverMap = new Map<string, ExamData>();
      data.data.forEach((e: ExamData) => {
        const key = (e.code || e.slug || e.name || e.id).toLowerCase().trim();
        if (!serverMap.has(key)) {
          serverMap.set(key, e);
        }
      });
      localExams.forEach(e => {
        const key = (e.code || e.slug || e.name || e.id).toLowerCase().trim();
        if (!serverMap.has(key)) {
          serverMap.set(key, e);
        }
      });
      exams = Array.from(serverMap.values());
      this.setLocalExamsStore(exams);
      allSeries = exams.flatMap(e => e.testSeries || []);
    } else {
      const uniqueMap = new Map<string, ExamData>();
      localExams.forEach(e => {
        const key = (e.code || e.slug || e.name || e.id).toLowerCase().trim();
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, e);
        }
      });
      exams = Array.from(uniqueMap.values());
      allSeries = await this.getTestSeries(includeUnpublished);
    }

    const result = exams.map((ex) => {
      const examKey = (ex.code || ex.name || ex.id || '').toLowerCase();
      const matchedSeries = (ex.testSeries && ex.testSeries.length > 0) ? ex.testSeries : allSeries.filter((s) => {
        const seriesExam = (s.exam || s.examId || s.category || s.title || '').toLowerCase();
        return (
          s.examId === ex.id ||
          seriesExam.includes(examKey) ||
          (examKey.includes('bpsc') && seriesExam.includes('bpsc')) ||
          ((examKey.includes('appsc') || examKey.includes('appcs')) && (seriesExam.includes('appsc') || seriesExam.includes('appcs'))) ||
          (examKey.includes('apssb') && seriesExam.includes('apssb'))
        );
      });

      // Ensure stage-wise exams have default Prelims and Mains stages if empty
      let resolvedStages = ex.stages || [];
      if (ex.hasStages && resolvedStages.length === 0) {
        resolvedStages = [
          { id: `stage-${ex.id}-prelims`, examId: ex.id, name: 'Prelims', slug: 'prelims', sortOrder: 1, isActive: true },
          { id: `stage-${ex.id}-mains`, examId: ex.id, name: 'Mains', slug: 'mains', sortOrder: 2, isActive: true }
        ];
      }

      return {
        ...ex,
        stages: resolvedStages,
        testSeries: matchedSeries
      };
    }).sort((a, b) => {
      const orderA = Number(a.displayOrder ?? 999);
      const orderB = Number(b.displayOrder ?? 999);
      if (orderA !== orderB) return orderA - orderB;
      return (a.code || '').localeCompare(b.code || '', undefined, { numeric: true, sensitivity: 'base' });
    });

    this.setCachedData(cacheKey, result);
    return result;
  }

  public async getTestSeries(includeUnpublished: boolean = false): Promise<TestSeriesItem[]> {
    const locale = this.getLocale();
    const cacheKey = `test_series_all_${includeUnpublished}_${locale}`;
    const cached = this.getCachedData<TestSeriesItem[]>(cacheKey, 30000);
    if (cached) return cached;

    const data = await this.apiFetch(`/api/test-series?includeUnpublished=${includeUnpublished}`);
    const localStore = this.getLocalTestSeriesStore();
    let combined: TestSeriesItem[] = [];

    if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
      const serverMap = new Map<string, TestSeriesItem>(data.data.map((item: TestSeriesItem) => [item.id, item]));
      localStore.forEach(item => {
        if (!serverMap.has(item.id)) {
          serverMap.set(item.id, item);
        }
      });
      combined = Array.from(serverMap.values());
      this.setLocalTestSeriesStore(combined);
    } else {
      combined = localStore;
    }

    const finalResult = includeUnpublished ? combined : combined.filter(s => s.isPublished !== false);
    this.setCachedData(cacheKey, finalResult);
    return finalResult;
  }

  public async getTestSeriesBySlug(slug: string): Promise<TestSeriesItem | null> {
    const data = await this.apiFetch(`/api/test-series/${slug}`);
    if (data && data.success && data.data) {
      return data.data;
    }
    const list = this.getLocalTestSeriesStore();
    const found = list.find(s => s.slug === slug || s.id === slug);
    if (found) return found;

    // Fallback: check exams hierarchy
    const hierarchy = await this.getExamsHierarchy(true);
    for (const ex of hierarchy) {
      const item = (ex.testSeries || []).find(s => s.slug === slug || s.id === slug);
      if (item) return item;
    }
    return null;
  }

  public async getTestSeriesById(idOrSlug: string): Promise<TestSeriesItem | null> {
    return this.getTestSeriesBySlug(idOrSlug);
  }

  public async saveTestSeries(series: Partial<TestSeriesItem>): Promise<boolean> {
    const currentList = this.getLocalTestSeriesStore();
    const existingIdx = currentList.findIndex(s => s.id === series.id);
    let nextList: TestSeriesItem[] = [];

    if (existingIdx >= 0) {
      nextList = [...currentList];
      nextList[existingIdx] = { ...nextList[existingIdx], ...series } as TestSeriesItem;
    } else {
      nextList = [series as TestSeriesItem, ...currentList];
    }

    this.setLocalTestSeriesStore(nextList);

    const res = await this.apiFetch('/api/admin/test-series', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(series)
    });
    return res?.success || true;
  }

  public async deleteTestSeries(id: string): Promise<boolean> {
    const currentList = this.getLocalTestSeriesStore();
    const nextList = currentList.filter(s => s.id !== id);
    this.setLocalTestSeriesStore(nextList);

    const res = await this.apiFetch(`/api/admin/test-series/${id}`, {
      method: 'DELETE'
    });
    return res?.success || true;
  }

  public async saveExam(exam: Partial<ExamData>): Promise<boolean> {
    const currentList = this.getLocalExamsStore();
    const existingIdx = currentList.findIndex(e => e.id === exam.id);
    let nextList: ExamData[] = [];
    if (existingIdx >= 0) {
      nextList = [...currentList];
      nextList[existingIdx] = { ...nextList[existingIdx], ...exam } as ExamData;
    } else {
      nextList = [...currentList, exam as ExamData];
    }
    this.setLocalExamsStore(nextList);

    const res = await this.apiFetch('/api/admin/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exam)
    });
    return res?.success || true;
  }

  public async deleteExam(id: string): Promise<boolean> {
    const currentList = this.getLocalExamsStore();
    const nextList = currentList.filter(e => e.id !== id);
    this.setLocalExamsStore(nextList);

    const res = await this.apiFetch(`/api/admin/exams/${id}`, {
      method: 'DELETE'
    });
    return res?.success || true;
  }

  public async getTestSeriesQuizzes(seriesId: string): Promise<any[]> {
    const data = await this.apiFetch(`/api/lms/courses/${seriesId}/quizzes`);
    if (data && data.success && Array.isArray(data.data)) {
      // Filter out any stale synthetic IDs if present
      return data.data.filter((q: any) => !q.id?.includes('-default'));
    }
    return [];
  }

  public async saveQuiz(quiz: any): Promise<boolean> {
    const res = await this.apiFetch(`/api/lms/courses/${quiz.courseId}/quizzes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quiz)
    });
    if (res && (res.success || res.data)) {
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem(`finalattempt_quizzes_${quiz.courseId}`);
          const current: any[] = stored ? JSON.parse(stored) : [];
          const idx = current.findIndex(q => q.id === quiz.id);
          let next: any[] = [];
          if (idx >= 0) {
            next = [...current];
            next[idx] = { ...next[idx], ...quiz };
          } else {
            next = [...current, quiz];
          }
          localStorage.setItem(`finalattempt_quizzes_${quiz.courseId}`, JSON.stringify(next));
        } catch (_) {}
      }
      return true;
    }
    return false;
  }

  public async deleteQuiz(quizId: string, seriesId: string): Promise<boolean> {
    const res = await this.apiFetch(`/api/lms/quizzes/${quizId}`, {
      method: 'DELETE'
    });
    if (res && res.success) {
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem(`finalattempt_quizzes_${seriesId}`);
          if (stored) {
            const current: any[] = JSON.parse(stored);
            const next = current.filter(q => q.id !== quizId);
            localStorage.setItem(`finalattempt_quizzes_${seriesId}`, JSON.stringify(next));
          }
        } catch (_) {}
      }
      return true;
    }
    return false;
  }

  public async getQuizQuestions(quizId: string): Promise<any[]> {
    const data = await this.apiFetch(`/api/lms/quizzes/${quizId}/questions`);
    if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
      return data.data;
    }
    return [];
  }

  public async saveQuestion(question: any): Promise<boolean> {
    const res = await this.apiFetch(`/api/lms/quizzes/${question.quizId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question)
    });
    if (res && (res.success || res.data)) {
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem(`finalattempt_questions_${question.quizId}`);
          const current: any[] = stored ? JSON.parse(stored) : [];
          const idx = current.findIndex(q => q.id === question.id);
          let next: any[] = [];
          if (idx >= 0) {
            next = [...current];
            next[idx] = { ...next[idx], ...question };
          } else {
            next = [...current, question];
          }
          localStorage.setItem(`finalattempt_questions_${question.quizId}`, JSON.stringify(next));
        } catch (_) {}
      }
      return true;
    }
    return false;
  }

  public async saveBulkQuestions(quizId: string, questions: any[]): Promise<boolean> {
    let allSuccess = true;
    for (const q of questions) {
      const res = await this.apiFetch(`/api/lms/quizzes/${quizId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(q)
      });
      if (!res || (!res.success && !res.data)) {
        allSuccess = false;
        break;
      }
    }
    if (allSuccess && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`finalattempt_questions_${quizId}`);
        const current: any[] = stored ? JSON.parse(stored) : [];
        const next = [...current, ...questions];
        localStorage.setItem(`finalattempt_questions_${quizId}`, JSON.stringify(next));
      } catch (_) {}
    }
    return allSuccess;
  }

  public async deleteQuestion(questionId: string, quizId: string): Promise<boolean> {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`finalattempt_questions_${quizId}`);
        if (stored) {
          const current: any[] = JSON.parse(stored);
          const next = current.filter(q => q.id !== questionId);
          localStorage.setItem(`finalattempt_questions_${quizId}`, JSON.stringify(next));
        }
      } catch (_) {}
    }

    const res = await this.apiFetch(`/api/lms/questions/${questionId}`, {
      method: 'DELETE'
    });
    return res?.success || true;
  }

  async parseBilingualPdf(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.apiFetch('/api/quizzes/admin/parse-bilingual-pdf', {
      method: 'POST',
      body: formData
    });
  }

  async parseBilingualText(text: string): Promise<any> {
    return this.apiFetch('/api/quizzes/admin/parse-bilingual-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
  }

  async importBilingualQuiz(payload: {
    quizId?: string;
    title: string;
    courseId?: string;
    description?: string;
    questions: any[];
    replaceExisting?: boolean;
  }): Promise<any> {
    return this.apiFetch('/api/quizzes/admin/import-bilingual-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  async getTestSeriesEnrolledStudents(testSeriesId: string): Promise<any[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    const res = await this.apiFetch(`/api/lms/admin/test-series/${testSeriesId}/students`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    return res?.data || [];
  }

  async addStudentToTestSeries(testSeriesId: string, userId: string): Promise<boolean> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    const res = await this.apiFetch(`/api/lms/admin/test-series/${testSeriesId}/enroll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ userId })
    });
    return res?.success || false;
  }

  async removeStudentFromTestSeries(testSeriesId: string, userId: string): Promise<boolean> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    const res = await this.apiFetch(`/api/lms/admin/test-series/${testSeriesId}/enroll/${userId}`, {
      method: 'DELETE',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    return res?.success || false;
  }

  async getStudentQuizAttempts(userId: string): Promise<any[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    const res = await this.apiFetch(`/api/lms/admin/students/${userId}/attempts`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    return res?.data || [];
  }

}


export const db = new FinalAttemptDB();
export const pyqs = pyqData;
export const fallbackFaculty = facultyData;
export const fallbackResults = resultData;
export const fallbackCurrentAffairs = currentAffairsData;
export const fallbackBlogs = blogData;
export const fallbackResources = resourceData;
