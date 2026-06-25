import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load .env from workspace root
dotenv.config({ path: path.join(__dirname, '../.env') });

// Seed Data
import { courseData, facultyData, resultData, currentAffairsData, pyqData, blogData, resourceData } from '../frontend/src/services/seedData';

// Connection details
const dbConfig = {
  host: process.env.DB_HOST || '',
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || '',
  port: Number(process.env.DB_PORT || '3306')
};

const useRealDB = !!(dbConfig.host && dbConfig.user && dbConfig.database);
const JSON_DB_PATH = path.join(__dirname, 'database_store.json');

export interface Lead {
  id: string;
  fullName: string;
  mobile: string;
  email?: string;
  targetExam: string;
  status: string;
  createdAt: string;
}

export interface QueryMsg {
  id: string;
  studentName: string;
  subject: string;
  text: string;
  status: string;
  replyText?: string;
}

export interface FacultyMember {
  id: string;
  name: string;
  role: string;
  experience: string;
  avatar: string;
  bio: string;
  demoLectures: { title: string; duration: string; url: string }[];
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

export interface CurrentAffairArticle {
  id: string;
  title: string;
  category: 'National' | 'International' | 'Economy' | 'Environment' | 'Science' | 'Bihar Special';
  publishDate: string;
  summary: string;
  content: string;
}

export interface BlogItem {
  id: string;
  title: string;
  publishDate: string;
  readTime: string;
  category: string;
  content: string;
}

export interface ResourceDownload {
  id: string;
  title: string;
  size: string;
  type: string;
  downloadCount: number;
  url: string;
}

export interface SiteSettings {
  heroTitle: string;
  heroSubtitle: string;
  tagline: string;
}

interface LocalDBStore {
  leads: Lead[];
  progress: { studentId: string; courseId: string; lessonId: string; completed: boolean; updatedAt: string }[];
  queries: QueryMsg[];
  faculty: FacultyMember[];
  results: ResultTopper[];
  currentAffairs: CurrentAffairArticle[];
  blogs: BlogItem[];
  resources: ResourceDownload[];
  settings: SiteSettings;
}

let mysqlPool: mysql.Pool | null = null;
if (useRealDB) {
  try {
    mysqlPool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    console.log('MySQL Database connection pool initialized successfully.');
  } catch (error) {
    console.error('MySQL connection failed, falling back to local storage file:', error);
    mysqlPool = null;
  }
}

class BackendDB {
  private localStore: LocalDBStore = {
    leads: [
      { id: 'lead-1', fullName: 'Aman Kumar', mobile: '9123456780', targetExam: 'BPSC Target Batch', status: 'New', createdAt: new Date().toISOString() },
      { id: 'lead-2', fullName: 'Priya Singh', mobile: '9876543210', targetExam: 'UPSC Mentorship', status: 'Contacted', createdAt: new Date().toISOString() },
      { id: 'lead-3', fullName: 'Ramesh Pathak', mobile: '8877665544', targetExam: 'Prelims Test Series', status: 'Enrolled', createdAt: new Date().toISOString() }
    ],
    progress: [
      { studentId: 'std-123', courseId: 'bpsc-foundation', lessonId: 'les-bpsc-foundation-1-1', completed: true, updatedAt: new Date().toISOString() }
    ],
    queries: [
      { id: 'q-1', studentName: 'Ritik Kumar', subject: 'Polity Centre-State relations doubt', text: 'Should we quote case laws in Article 356 explanations?', status: 'Unread' }
    ],
    faculty: [...facultyData],
    results: [...resultData],
    currentAffairs: [...currentAffairsData],
    blogs: [...blogData],
    resources: [...resourceData],
    settings: {
      heroTitle: '72nd BPSC Preparation Starts Here',
      heroSubtitle: 'Personalized mentorship, smart study tools, and Bihar-focused content designed to help you clear BPSC with confidence.',
      tagline: 'One Mentor. One Strategy. One Final Attempt.'
    }
  };

  constructor() {
    this.loadLocalData();
  }

  private loadLocalData() {
    if (fs.existsSync(JSON_DB_PATH)) {
      try {
        const raw = fs.readFileSync(JSON_DB_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        this.localStore = {
          ...this.localStore,
          ...parsed
        };
        // Save the merged data back to the file so it becomes complete
        this.saveLocalData();
      } catch (e) {
        console.error('Failed reading database_store.json, creating new file.');
        this.saveLocalData();
      }
    } else {
      this.saveLocalData();
    }
  }

  private saveLocalData() {
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(this.localStore, null, 2), 'utf-8');
  }

  // SETTINGS
  public async getSettings(): Promise<SiteSettings> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query('SELECT * FROM settings LIMIT 1');
        if (rows && rows.length > 0) return rows[0] as SiteSettings;
      } catch (err) {
        console.error('MySQL query error, using local fallback:', err);
      }
    }
    return this.localStore.settings;
  }

  public async updateSettings(settings: SiteSettings): Promise<boolean> {
    if (mysqlPool) {
      try {
        await mysqlPool.query(
          'INSERT INTO settings (id, heroTitle, heroSubtitle, tagline) VALUES (1, ?, ?, ?) ON DUPLICATE KEY UPDATE heroTitle = ?, heroSubtitle = ?, tagline = ?',
          [settings.heroTitle, settings.heroSubtitle, settings.tagline, settings.heroTitle, settings.heroSubtitle, settings.tagline]
        );
        return true;
      } catch (err) {
        console.error('MySQL update error, using local fallback:', err);
      }
    }
    this.localStore.settings = settings;
    this.saveLocalData();
    return true;
  }

  // LEADS
  public async getLeads(): Promise<Lead[]> {
    if (mysqlPool) {
      try {
        const [rows] = await mysqlPool.query('SELECT * FROM leads ORDER BY createdAt DESC');
        return rows as Lead[];
      } catch (err) {
        console.error('MySQL query error, using local fallback:', err);
      }
    }
    return this.localStore.leads;
  }

  public async createLead(fullName: string, mobile: string, targetExam: string, email?: string): Promise<Lead> {
    const lead: Lead = {
      id: `lead-${Date.now()}`,
      fullName,
      mobile,
      email,
      targetExam,
      status: 'New',
      createdAt: new Date().toISOString()
    };
    if (mysqlPool) {
      try {
        await mysqlPool.query(
          'INSERT INTO leads (id, fullName, mobile, email, targetExam, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [lead.id, lead.fullName, lead.mobile, lead.email || null, lead.targetExam, lead.status, lead.createdAt]
        );
        return lead;
      } catch (err) {
        console.error('MySQL insert error, using local fallback:', err);
      }
    }
    this.localStore.leads.unshift(lead);
    this.saveLocalData();
    return lead;
  }

  public async updateLeadStatus(id: string, status: string): Promise<boolean> {
    if (mysqlPool) {
      try {
        const [result]: any = await mysqlPool.query('UPDATE leads SET status = ? WHERE id = ?', [status, id]);
        return result.affectedRows > 0;
      } catch (err) {
        console.error('MySQL update error, using local fallback:', err);
      }
    }
    const lead = this.localStore.leads.find(l => l.id === id);
    if (lead) {
      lead.status = status;
      this.saveLocalData();
      return true;
    }
    return false;
  }

  // FACULTY
  public async getFaculty(): Promise<FacultyMember[]> {
    if (mysqlPool) {
      try {
        const [rows] = await mysqlPool.query('SELECT * FROM faculty');
        return rows as FacultyMember[];
      } catch (err) {
        console.error('MySQL query error, using local fallback:', err);
      }
    }
    return this.localStore.faculty;
  }

  public async createFaculty(member: FacultyMember): Promise<FacultyMember> {
    if (mysqlPool) {
      try {
        await mysqlPool.query(
          'INSERT INTO faculty (id, name, role, experience, avatar, bio, demoLectures) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [member.id, member.name, member.role, member.experience, member.avatar, member.bio, JSON.stringify(member.demoLectures)]
        );
        return member;
      } catch (err) {
        console.error('MySQL insert error, using local fallback:', err);
      }
    }
    this.localStore.faculty.push(member);
    this.saveLocalData();
    return member;
  }

  public async updateFaculty(id: string, updated: FacultyMember): Promise<boolean> {
    if (mysqlPool) {
      try {
        const [result]: any = await mysqlPool.query(
          'UPDATE faculty SET name = ?, role = ?, experience = ?, avatar = ?, bio = ?, demoLectures = ? WHERE id = ?',
          [updated.name, updated.role, updated.experience, updated.avatar, updated.bio, JSON.stringify(updated.demoLectures), id]
        );
        return result.affectedRows > 0;
      } catch (err) {
        console.error('MySQL update error, using local fallback:', err);
      }
    }
    const idx = this.localStore.faculty.findIndex(f => f.id === id);
    if (idx >= 0) {
      this.localStore.faculty[idx] = updated;
      this.saveLocalData();
      return true;
    }
    return false;
  }

  public async deleteFaculty(id: string): Promise<boolean> {
    if (mysqlPool) {
      try {
        const [result]: any = await mysqlPool.query('DELETE FROM faculty WHERE id = ?', [id]);
        return result.affectedRows > 0;
      } catch (err) {
        console.error('MySQL delete error, using local fallback:', err);
      }
    }
    const idx = this.localStore.faculty.findIndex(f => f.id === id);
    if (idx >= 0) {
      this.localStore.faculty.splice(idx, 1);
      this.saveLocalData();
      return true;
    }
    return false;
  }

  // RESULTS
  public async getResults(): Promise<ResultTopper[]> {
    if (mysqlPool) {
      try {
        const [rows] = await mysqlPool.query('SELECT * FROM results');
        return rows as ResultTopper[];
      } catch (err) {
        console.error('MySQL query error, using local fallback:', err);
      }
    }
    return this.localStore.results;
  }

  public async createResult(item: ResultTopper): Promise<ResultTopper> {
    if (mysqlPool) {
      try {
        await mysqlPool.query(
          'INSERT INTO results (id, name, rank, exam, course, service, district, photo, year, story) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [item.id, item.name, item.rank, item.exam, item.course, item.service, item.district, item.photo, item.year, item.story]
        );
        return item;
      } catch (err) {
        console.error('MySQL insert error:', err);
      }
    }
    this.localStore.results.unshift(item);
    this.saveLocalData();
    return item;
  }

  public async updateResult(id: string, updated: ResultTopper): Promise<boolean> {
    if (mysqlPool) {
      try {
        const [result]: any = await mysqlPool.query(
          'UPDATE results SET name = ?, rank = ?, exam = ?, course = ?, service = ?, district = ?, photo = ?, year = ?, story = ? WHERE id = ?',
          [updated.name, updated.rank, updated.exam, updated.course, updated.service, updated.district, updated.photo, updated.year, updated.story, id]
        );
        return result.affectedRows > 0;
      } catch (err) {
        console.error('MySQL update error:', err);
      }
    }
    const idx = this.localStore.results.findIndex(r => r.id === id);
    if (idx >= 0) {
      this.localStore.results[idx] = updated;
      this.saveLocalData();
      return true;
    }
    return false;
  }

  public async deleteResult(id: string): Promise<boolean> {
    if (mysqlPool) {
      try {
        const [result]: any = await mysqlPool.query('DELETE FROM results WHERE id = ?', [id]);
        return result.affectedRows > 0;
      } catch (err) {
        console.error('MySQL delete error:', err);
      }
    }
    const idx = this.localStore.results.findIndex(r => r.id === id);
    if (idx >= 0) {
      this.localStore.results.splice(idx, 1);
      this.saveLocalData();
      return true;
    }
    return false;
  }

  // CURRENT AFFAIRS
  public async getCurrentAffairs(): Promise<CurrentAffairArticle[]> {
    if (mysqlPool) {
      try {
        const [rows] = await mysqlPool.query('SELECT * FROM current_affairs');
        return rows as CurrentAffairArticle[];
      } catch (err) {
        console.error('MySQL query error:', err);
      }
    }
    return this.localStore.currentAffairs;
  }

  public async createCurrentAffair(item: CurrentAffairArticle): Promise<CurrentAffairArticle> {
    if (mysqlPool) {
      try {
        await mysqlPool.query(
          'INSERT INTO current_affairs (id, title, category, publishDate, summary, content) VALUES (?, ?, ?, ?, ?, ?)',
          [item.id, item.title, item.category, item.publishDate, item.summary, item.content]
        );
        return item;
      } catch (err) {
        console.error('MySQL insert error:', err);
      }
    }
    this.localStore.currentAffairs.unshift(item);
    this.saveLocalData();
    return item;
  }

  public async updateCurrentAffair(id: string, updated: CurrentAffairArticle): Promise<boolean> {
    if (mysqlPool) {
      try {
        const [result]: any = await mysqlPool.query(
          'UPDATE current_affairs SET title = ?, category = ?, publishDate = ?, summary = ?, content = ? WHERE id = ?',
          [updated.title, updated.category, updated.publishDate, updated.summary, updated.content, id]
        );
        return result.affectedRows > 0;
      } catch (err) {
        console.error('MySQL update error:', err);
      }
    }
    const idx = this.localStore.currentAffairs.findIndex(c => c.id === id);
    if (idx >= 0) {
      this.localStore.currentAffairs[idx] = updated;
      this.saveLocalData();
      return true;
    }
    return false;
  }

  public async deleteCurrentAffair(id: string): Promise<boolean> {
    if (mysqlPool) {
      try {
        const [result]: any = await mysqlPool.query('DELETE FROM current_affairs WHERE id = ?', [id]);
        return result.affectedRows > 0;
      } catch (err) {
        console.error('MySQL delete error:', err);
      }
    }
    const idx = this.localStore.currentAffairs.findIndex(c => c.id === id);
    if (idx >= 0) {
      this.localStore.currentAffairs.splice(idx, 1);
      this.saveLocalData();
      return true;
    }
    return false;
  }

  // BLOGS
  public async getBlogs(): Promise<BlogItem[]> {
    if (mysqlPool) {
      try {
        const [rows] = await mysqlPool.query('SELECT * FROM blogs');
        return rows as BlogItem[];
      } catch (err) {
        console.error('MySQL query error:', err);
      }
    }
    return this.localStore.blogs;
  }

  public async createBlog(item: BlogItem): Promise<BlogItem> {
    if (mysqlPool) {
      try {
        await mysqlPool.query(
          'INSERT INTO blogs (id, title, publishDate, readTime, category, content) VALUES (?, ?, ?, ?, ?, ?)',
          [item.id, item.title, item.publishDate, item.readTime, item.category, item.content]
        );
        return item;
      } catch (err) {
        console.error('MySQL insert error:', err);
      }
    }
    this.localStore.blogs.unshift(item);
    this.saveLocalData();
    return item;
  }

  public async updateBlog(id: string, updated: BlogItem): Promise<boolean> {
    if (mysqlPool) {
      try {
        const [result]: any = await mysqlPool.query(
          'UPDATE blogs SET title = ?, publishDate = ?, readTime = ?, category = ?, content = ? WHERE id = ?',
          [updated.title, updated.publishDate, updated.readTime, updated.category, updated.content, id]
        );
        return result.affectedRows > 0;
      } catch (err) {
        console.error('MySQL update error:', err);
      }
    }
    const idx = this.localStore.blogs.findIndex(b => b.id === id);
    if (idx >= 0) {
      this.localStore.blogs[idx] = updated;
      this.saveLocalData();
      return true;
    }
    return false;
  }

  public async deleteBlog(id: string): Promise<boolean> {
    if (mysqlPool) {
      try {
        const [result]: any = await mysqlPool.query('DELETE FROM blogs WHERE id = ?', [id]);
        return result.affectedRows > 0;
      } catch (err) {
        console.error('MySQL delete error:', err);
      }
    }
    const idx = this.localStore.blogs.findIndex(b => b.id === id);
    if (idx >= 0) {
      this.localStore.blogs.splice(idx, 1);
      this.saveLocalData();
      return true;
    }
    return false;
  }

  // RESOURCES
  public async getResources(): Promise<ResourceDownload[]> {
    if (mysqlPool) {
      try {
        const [rows] = await mysqlPool.query('SELECT * FROM resources');
        return rows as ResourceDownload[];
      } catch (err) {
        console.error('MySQL query error:', err);
      }
    }
    return this.localStore.resources;
  }

  public async createResource(item: ResourceDownload): Promise<ResourceDownload> {
    if (mysqlPool) {
      try {
        await mysqlPool.query(
          'INSERT INTO resources (id, title, size, type, downloadCount, url) VALUES (?, ?, ?, ?, ?, ?)',
          [item.id, item.title, item.size, item.type, item.downloadCount, item.url]
        );
        return item;
      } catch (err) {
        console.error('MySQL insert error:', err);
      }
    }
    this.localStore.resources.push(item);
    this.saveLocalData();
    return item;
  }

  public async updateResource(id: string, updated: ResourceDownload): Promise<boolean> {
    if (mysqlPool) {
      try {
        const [result]: any = await mysqlPool.query(
          'UPDATE resources SET title = ?, size = ?, type = ?, downloadCount = ?, url = ? WHERE id = ?',
          [updated.title, updated.size, updated.type, updated.downloadCount, updated.url, id]
        );
        return result.affectedRows > 0;
      } catch (err) {
        console.error('MySQL update error:', err);
      }
    }
    const idx = this.localStore.resources.findIndex(r => r.id === id);
    if (idx >= 0) {
      this.localStore.resources[idx] = updated;
      this.saveLocalData();
      return true;
    }
    return false;
  }

  public async deleteResource(id: string): Promise<boolean> {
    if (mysqlPool) {
      try {
        const [result]: any = await mysqlPool.query('DELETE FROM resources WHERE id = ?', [id]);
        return result.affectedRows > 0;
      } catch (err) {
        console.error('MySQL delete error:', err);
      }
    }
    const idx = this.localStore.resources.findIndex(r => r.id === id);
    if (idx >= 0) {
      this.localStore.resources.splice(idx, 1);
      this.saveLocalData();
      return true;
    }
    return false;
  }

  // STUDENT PROGRESS & ATTENDANCE
  public async getStudentProgress(studentId: string) {
    if (mysqlPool) {
      try {
        const [rows] = await mysqlPool.query('SELECT * FROM course_progress WHERE studentId = ?', [studentId]);
        return rows;
      } catch (err) {
        console.error('MySQL progress query error:', err);
      }
    }
    return this.localStore.progress.filter(p => p.studentId === studentId);
  }

  public async saveStudentProgress(studentId: string, courseId: string, lessonId: string, completed: boolean) {
    const updatedAt = new Date().toISOString();
    if (mysqlPool) {
      try {
        await mysqlPool.query(
          'INSERT INTO course_progress (studentId, courseId, lessonId, completed, updatedAt) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE completed = ?, updatedAt = ?',
          [studentId, courseId, lessonId, completed, updatedAt, completed, updatedAt]
        );
        return true;
      } catch (err) {
        console.error('MySQL progress save error:', err);
      }
    }

    const idx = this.localStore.progress.findIndex(p => p.studentId === studentId && p.lessonId === lessonId);
    if (idx >= 0) {
      this.localStore.progress[idx].completed = completed;
      this.localStore.progress[idx].updatedAt = updatedAt;
    } else {
      this.localStore.progress.push({ studentId, courseId, lessonId, completed, updatedAt });
    }
    this.saveLocalData();
    return true;
  }

  // QUERIES
  public async getQueries(): Promise<QueryMsg[]> {
    if (mysqlPool) {
      try {
        const [rows] = await mysqlPool.query('SELECT * FROM student_queries');
        return rows as QueryMsg[];
      } catch (err) {
        console.error('MySQL queries error:', err);
      }
    }
    return this.localStore.queries;
  }

  public async createQuery(studentName: string, subject: string, text: string): Promise<QueryMsg> {
    const q: QueryMsg = {
      id: `q-${Date.now()}`,
      studentName,
      subject,
      text,
      status: 'Unread'
    };

    if (mysqlPool) {
      try {
        await mysqlPool.query(
          'INSERT INTO student_queries (id, studentName, subject, text, status) VALUES (?, ?, ?, ?, ?)',
          [q.id, q.studentName, q.subject, q.text, q.status]
        );
        return q;
      } catch (err) {
        console.error('MySQL query insert error:', err);
      }
    }

    this.localStore.queries.unshift(q);
    this.saveLocalData();
    return q;
  }

  public async replyQuery(id: string, replyText: string): Promise<boolean> {
    if (mysqlPool) {
      try {
        const [result]: any = await mysqlPool.query(
          'UPDATE student_queries SET status = ?, replyText = ? WHERE id = ?',
          ['Replied', replyText, id]
        );
        return result.affectedRows > 0;
      } catch (err) {
        console.error('MySQL reply query error:', err);
      }
    }

    const q = this.localStore.queries.find(item => item.id === id);
    if (q) {
      q.status = 'Replied';
      q.replyText = replyText;
      this.saveLocalData();
      return true;
    }
    return false;
  }
}

export const db = new BackendDB();
