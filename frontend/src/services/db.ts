import { courseData, facultyData, resultData, currentAffairsData, pyqData, blogData, resourceData } from './seedData';

export interface Course {
  id: string;
  title: string;
  category: 'UPSC' | 'BPSC' | 'Foundation' | 'Prelims' | 'Mains' | 'Interview';
  description: string;
  duration: string;
  fee: string;
  syllabus: string[];
  features: string[];
  schedule: string;
  faq: { q: string; a: string }[];
  enrolledCount: number;
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
  category: 'NATIONAL' | 'INTERNATIONAL' | 'BIHAR';
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
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';


class FinalAttemptDB {
  private fallbackLeads: Lead[] = [];

  // Fetch helper to handle offline backend gracefully
  private async apiFetch(endpoint: string, options?: RequestInit) {
    try {
      const res = await fetch(`${BACKEND_URL}${endpoint}`, options);
      if (!res.ok) throw new Error('API request failed');
      return await res.json();
    } catch (_) {
      return null;
    }
  }

  public async getSettings() {
    const data = await this.apiFetch('/api/settings');
    return data || {
      heroTitle: '72nd BPSC Preparation Starts Here',
      heroSubtitle: 'Personalized mentorship, smart study tools, and Bihar-focused content designed to help you clear BPSC with confidence.',
      tagline: 'One Mentor. One Strategy. One Final Attempt.'
    };
  }

  public async getCourses(): Promise<Course[]> {
    const res = await this.apiFetch('/api/lms/courses');
    if (res && res.success && Array.isArray(res.data)) {
      return res.data;
    }
    return courseData;
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
    if (data) {
      return data.filter((p: any) => p.courseId === courseId);
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
    return data || facultyData;
  }

  public async getResults(): Promise<ResultTopper[]> {
    const data = await this.apiFetch('/api/results');
    return data || resultData;
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
  public async getYoutubeVideos(limit: number = 9, page: number = 1, search: string = ''): Promise<{ videos: any[], total: number }> {
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
}

export const db = new FinalAttemptDB();
export const pyqs = pyqData;
export const fallbackFaculty = facultyData;
export const fallbackResults = resultData;
export const fallbackCurrentAffairs = currentAffairsData;
export const fallbackBlogs = blogData;
export const fallbackResources = resourceData;
