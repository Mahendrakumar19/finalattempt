import { courseData, facultyData, resultData, currentAffairsData, pyqData, blogData, resourceData, testSeriesData, TestSeriesItem } from './seedData';
export type { TestSeriesItem };

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
  announcements?: { date: string; text: string; link?: string; isNew?: boolean }[];
  featureFlags?: Record<string, boolean>;
}

export interface Course {
  id: string;
  title: string;
  exam?: 'BPSC' | 'Arunachal PCS' | string;
  category: 'BPSC' | 'Foundation' | 'Prelims' | 'Mains' | 'Interview' | string;
  description: string;
  duration: string;
  fee: string;
  syllabus: string[];
  features: string[];
  schedule: string;
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
    const hostname = window.location.hostname || 'localhost';
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
  type?: string;
  url: string;
  thumbnailUrl?: string;
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
  downloadItems?: DownloadItem[];
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

class FinalAttemptDB {
  private fallbackLeads: Lead[] = [];

  // Fetch helper to handle offline backend gracefully
  private async apiFetch(endpoint: string, options?: RequestInit) {
    try {
      const res = await fetch(`${BACKEND_URL}${endpoint}`, options);
      if (!res.ok) throw new Error('API request failed');
      return await res.json();
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
    return courses.find(c => c.id === id);
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

  public async getCurrentAffairs() {
    const data = await this.apiFetch('/api/current-affairs');
    return data || currentAffairsData;
  }

  public async getBlogs() {
    const data = await this.apiFetch('/api/blogs');
    return data || blogData;
  }

  public async getResources() {
    const data = await this.apiFetch('/api/resources');
    return data || resourceData;
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

  // Dynamic Current Affairs API calls
  public async getDynamicCurrentAffairsEditions(includeDrafts: boolean = false): Promise<DynamicCurrentAffairEdition[]> {
    const data = await this.apiFetch(`/api/dynamic-current-affairs/editions?includeDrafts=${includeDrafts}`);
    return data || [];
  }

  public async getDynamicCurrentAffairsEditionByDate(date: string, includeDrafts: boolean = false): Promise<DynamicCurrentAffairEdition | null> {
    const data = await this.apiFetch(`/api/dynamic-current-affairs/daily/${date}?includeDrafts=${includeDrafts}`);
    return data || null;
  }

  public async getDynamicCurrentAffairArticle(slug: string, includeDrafts: boolean = false): Promise<DynamicCurrentAffairArticle | null> {
    const data = await this.apiFetch(`/api/dynamic-current-affairs/article/${slug}?includeDrafts=${includeDrafts}`);
    return data || null;
  }

  public async getDynamicCurrentAffairsSearch(params: Record<string, string>): Promise<DynamicCurrentAffairArticle[]> {
    const qs = new URLSearchParams(params).toString();
    const data = await this.apiFetch(`/api/dynamic-current-affairs/search?${qs}`);
    return data || [];
  }

  public async saveDynamicCurrentAffairsEdition(edition: DynamicCurrentAffairEdition): Promise<boolean> {
    const data = await this.apiFetch('/api/admin/dynamic-current-affairs/edition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(edition)
    });
    return data?.success || false;
  }

  public async deleteDynamicCurrentAffairsEdition(id: string): Promise<boolean> {
    const data = await this.apiFetch(`/api/admin/dynamic-current-affairs/edition/${id}`, {
      method: 'DELETE'
    });
    return data?.success || false;
  }

  public async deleteDynamicCurrentAffairsArticle(id: string): Promise<boolean> {
    const data = await this.apiFetch(`/api/admin/dynamic-current-affairs/article/${id}`, {
      method: 'DELETE'
    });
    return data?.success || false;
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

  public async getTestSeries(includeUnpublished: boolean = false): Promise<TestSeriesItem[]> {
    const data = await this.apiFetch(`/api/test-series?includeUnpublished=${includeUnpublished}`);
    let list: TestSeriesItem[] = [];
    if (data && data.success && Array.isArray(data.data)) {
      list = data.data;
    } else {
      list = this.getLocalTestSeriesStore();
    }
    return includeUnpublished ? list : list.filter(s => s.isPublished !== false);
  }

  public async getTestSeriesBySlug(slug: string): Promise<TestSeriesItem | null> {
    const data = await this.apiFetch(`/api/test-series/${slug}`);
    if (data && data.success && data.data) {
      return data.data;
    }
    const list = this.getLocalTestSeriesStore();
    const found = list.find(s => s.slug === slug || s.id === slug);
    return found || null;
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

  // ── Quiz & Question Bank Methods ──────────────────────────────────────────
  public async getTestSeriesQuizzes(seriesId: string): Promise<any[]> {
    const data = await this.apiFetch(`/api/lms/courses/${seriesId}/quizzes`);
    let list: any[] = [];
    if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
      list = data.data;
    } else {
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem(`finalattempt_quizzes_${seriesId}`);
          if (stored) {
            list = JSON.parse(stored);
          }
        } catch (_) {}
      }
    }

    // If no quizzes exist yet, create a default Primary Mock Quiz
    if (!list || list.length === 0) {
      const defaultQuiz = {
        id: `quiz-${seriesId}-default`,
        title: 'Full Length Grand Mock Paper 1',
        courseId: seriesId,
        timeLimitMins: 120,
        passingScore: 40,
        description: 'Official 150-Question Full Length Test paper.'
      };
      list = [defaultQuiz];
      this.saveQuiz(defaultQuiz);
    }

    return list;
  }

  public async saveQuiz(quiz: any): Promise<boolean> {
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

    const res = await this.apiFetch(`/api/lms/courses/${quiz.courseId}/quizzes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quiz)
    });
    return res?.success || true;
  }

  public async deleteQuiz(quizId: string, seriesId: string): Promise<boolean> {
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

    const res = await this.apiFetch(`/api/lms/quizzes/${quizId}`, {
      method: 'DELETE'
    });
    return res?.success || true;
  }

  public async getQuizQuestions(quizId: string): Promise<any[]> {
    const data = await this.apiFetch(`/api/lms/quizzes/${quizId}/questions`);
    if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
      return data.data;
    }
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`finalattempt_questions_${quizId}`);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (_) {}
    }
    return [];
  }

  public async saveQuestion(question: any): Promise<boolean> {
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

    const res = await this.apiFetch(`/api/lms/quizzes/${question.quizId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question)
    });
    return res?.success || true;
  }

  public async saveBulkQuestions(quizId: string, questions: any[]): Promise<boolean> {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`finalattempt_questions_${quizId}`);
        const current: any[] = stored ? JSON.parse(stored) : [];
        const next = [...current, ...questions];
        localStorage.setItem(`finalattempt_questions_${quizId}`, JSON.stringify(next));
      } catch (_) {}
    }

    for (const q of questions) {
      await this.apiFetch(`/api/lms/quizzes/${quizId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(q)
      });
    }
    return true;
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



}


export const db = new FinalAttemptDB();
export const pyqs = pyqData;
export const fallbackFaculty = facultyData;
export const fallbackResults = resultData;
export const fallbackCurrentAffairs = currentAffairsData;
export const fallbackBlogs = blogData;
export const fallbackResources = resourceData;
