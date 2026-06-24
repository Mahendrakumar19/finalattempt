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

// Local JSON Store fallback
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

interface LocalDBStore {
  leads: Lead[];
  progress: { studentId: string; courseId: string; lessonId: string; completed: boolean; updatedAt: string }[];
  queries: QueryMsg[];
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
    ]
  };

  constructor() {
    this.loadLocalData();
  }

  private loadLocalData() {
    if (fs.existsSync(JSON_DB_PATH)) {
      try {
        const raw = fs.readFileSync(JSON_DB_PATH, 'utf-8');
        this.localStore = JSON.parse(raw);
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

  // PROGRESS
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
export const seedCourses = courseData;
export const seedFaculty = facultyData;
export const seedResults = resultData;
export const seedCurrentAffairs = currentAffairsData;
export const seedPyqs = pyqData;
export const seedBlogs = blogData;
export const seedResources = resourceData;
