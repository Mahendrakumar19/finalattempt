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

export let mysqlPool: mysql.Pool | null = null;

async function initializeMySQLTables(pool: mysql.Pool) {
  try {
    console.log('Initializing MySQL Database tables if they do not exist...');
    
    // 1. Settings
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT PRIMARY KEY DEFAULT 1,
        heroTitle TEXT,
        heroSubtitle TEXT,
        tagline TEXT
      )
    `);
    
    // 2. Leads
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id VARCHAR(255) PRIMARY KEY,
        fullName VARCHAR(255) NOT NULL,
        mobile VARCHAR(50) NOT NULL,
        email VARCHAR(255),
        targetExam VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        createdAt VARCHAR(255) NOT NULL
      )
    `);
    
    // 3. Faculty
    await pool.query(`
      CREATE TABLE IF NOT EXISTS faculty (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(255) NOT NULL,
        experience VARCHAR(255) NOT NULL,
        avatar TEXT,
        bio TEXT,
        demoLectures TEXT
      )
    `);
    
    // 4. Results
    await pool.query(`
      CREATE TABLE IF NOT EXISTS results (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        rank VARCHAR(100) NOT NULL,
        exam VARCHAR(100) NOT NULL,
        course VARCHAR(255) NOT NULL,
        service VARCHAR(255) NOT NULL,
        district VARCHAR(100) NOT NULL,
        photo TEXT,
        year INT NOT NULL,
        story TEXT
      )
    `);
    
    // 5. Current Affairs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS current_affairs (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        publishDate VARCHAR(100) NOT NULL,
        summary TEXT,
        content TEXT
      )
    `);
    
    // 6. Blogs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blogs (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        publishDate VARCHAR(100) NOT NULL,
        readTime VARCHAR(100) NOT NULL,
        category VARCHAR(100) NOT NULL,
        content TEXT
      )
    `);
    
    // 7. Resources
    await pool.query(`
      CREATE TABLE IF NOT EXISTS resources (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        size VARCHAR(100) NOT NULL,
        type VARCHAR(100) NOT NULL,
        downloadCount INT DEFAULT 0,
        url TEXT
      )
    `);
    
    // 8. Course Progress
    await pool.query(`
      CREATE TABLE IF NOT EXISTS course_progress (
        studentId VARCHAR(255),
        courseId VARCHAR(255),
        lessonId VARCHAR(255),
        completed TINYINT(1) DEFAULT 0,
        updatedAt VARCHAR(255),
        PRIMARY KEY (studentId, lessonId)
      )
    `);
    
    // 9. Student Queries
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_queries (
        id VARCHAR(255) PRIMARY KEY,
        studentName VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        text TEXT NOT NULL,
        status VARCHAR(50) NOT NULL,
        replyText TEXT
      )
    `);

    console.log('MySQL Database tables initialized successfully.');
    
    // Seed settings table if empty
    const [settingsRows]: any = await pool.query('SELECT COUNT(*) as count FROM settings');
    if (settingsRows[0].count === 0) {
      await pool.query(
        'INSERT INTO settings (id, heroTitle, heroSubtitle, tagline) VALUES (1, ?, ?, ?)',
        [
          '72nd BPSC Preparation Starts Here',
          'Personalized mentorship, smart study tools, and Bihar-focused content designed to help you clear BPSC with confidence.',
          'One Mentor. One Strategy. One Final Attempt.'
        ]
      );
      console.log('Seeded settings table.');
    }

    // Seed Faculty if empty
    const [facCount]: any = await pool.query('SELECT COUNT(*) as count FROM faculty');
    if (facCount[0].count === 0) {
      for (const f of facultyData) {
        await pool.query(
          'INSERT INTO faculty (id, name, role, experience, avatar, bio, demoLectures) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [f.id, f.name, f.role, f.experience, f.avatar, f.bio, JSON.stringify(f.demoLectures)]
        );
      }
      console.log('Seeded faculty table.');
    }

    // Seed Results if empty
    const [resCount]: any = await pool.query('SELECT COUNT(*) as count FROM results');
    if (resCount[0].count === 0) {
      for (const r of resultData) {
        await pool.query(
          'INSERT INTO results (id, name, rank, exam, course, service, district, photo, year, story) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [r.id, r.name, r.rank, r.exam, r.course, r.service, r.district, r.photo, r.year, r.story]
        );
      }
      console.log('Seeded results table.');
    }

    // Seed Current Affairs if empty
    const [caCount]: any = await pool.query('SELECT COUNT(*) as count FROM current_affairs');
    if (caCount[0].count === 0) {
      for (const ca of currentAffairsData) {
        await pool.query(
          'INSERT INTO current_affairs (id, title, category, publishDate, summary, content) VALUES (?, ?, ?, ?, ?, ?)',
          [ca.id, ca.title, ca.category, ca.publishDate, ca.summary, ca.content]
        );
      }
      console.log('Seeded current affairs table.');
    }

    // Seed Blogs if empty
    const [blogCount]: any = await pool.query('SELECT COUNT(*) as count FROM blogs');
    if (blogCount[0].count === 0) {
      for (const b of blogData) {
        await pool.query(
          'INSERT INTO blogs (id, title, publishDate, readTime, category, content) VALUES (?, ?, ?, ?, ?, ?)',
          [b.id, b.title, b.publishDate, b.readTime, b.category, b.content]
        );
      }
      console.log('Seeded blogs table.');
    }

    // Seed Resources if empty
    const [resourceCount]: any = await pool.query('SELECT COUNT(*) as count FROM resources');
    if (resourceCount[0].count === 0) {
      for (const r of resourceData) {
        await pool.query(
          'INSERT INTO resources (id, title, size, type, downloadCount, url) VALUES (?, ?, ?, ?, ?, ?)',
          [r.id, r.title, r.size, r.type, r.downloadCount, r.url]
        );
      }
      console.log('Seeded resources table.');
    }

  } catch (err) {
    console.error('Failed to initialize MySQL Database tables:', err);
  }
}

if (useRealDB) {
  try {
    const tempPool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000, // 10 seconds delay
      connectTimeout: 3000 // 3 seconds timeout to trigger immediate fallback if port blocked
    });



    // Test connection synchronously during pool startup (with a short timeout fallback check)
    console.log('Testing MySQL Database connection...');
    
    // Asynchronously verify connection and initialize tables
    tempPool.getConnection()
      .then(async (connection) => {
        console.log('MySQL Database connection verified successfully.');
        mysqlPool = tempPool;
        connection.release();
        
        // Run schema tables setup
        await initializeMySQLTables(tempPool);
        await initializeAuthTables(tempPool);
      })
      .catch((err) => {
        console.error('MySQL connection validation failed. Falling back to local store file:', err.message);
        mysqlPool = null;
        tempPool.end().catch(() => {});
      });

  } catch (error: any) {
    console.error('MySQL connection pool setup failed:', error.message);
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

// ═════════════════════════════════════════════════════════════════════════════
//  AUTH DATABASE — users, sessions, OTP verifications
// ═════════════════════════════════════════════════════════════════════════════

interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  mobile?: string;
  passwordHash?: string;
  googleId?: string;
  role: 'student' | 'faculty' | 'admin';
  avatarUrl?: string;
  isEmailVerified: boolean;
  isMobileVerified?: boolean;
  targetExam?: string;
  isActive: boolean;
  createdAt?: string;
  lastLoginAt?: string;
}

interface OTPRecord {
  id: string;
  identifier: string;
  type: 'email' | 'mobile';
  otpHash: string;
  purpose: 'login' | 'register' | 'reset' | 'verify';
  expiresAt: Date | string;
  usedAt?: Date | string | null;
  attempts: number;
}

interface SessionRecord {
  id: string;
  userId: string;
  refreshToken: string;
  expiresAt: Date | string;
}

// In-memory fallback stores for auth (hashed with Password123)
const authLocalUsers: UserRecord[] = [
  {
    id: 'student-local-fallback-id',
    fullName: 'Aarav Kumar',
    email: 'student@finalattempt.com',
    mobile: '9876543210',
    passwordHash: '$2b$10$34jXxZaMx7fRqxmuqE1b9u7b5y1g8nbm890xKxqvKOgwSdZE/MPrm', // bcrypt hash for Password123
    role: 'student',
    targetExam: 'BPSC Foundation Batch',
    isEmailVerified: true,
    isActive: true
  },
  {
    id: 'faculty-local-fallback-id',
    fullName: 'Dr. Anand Kumar',
    email: 'faculty@finalattempt.com',
    mobile: '9876543211',
    passwordHash: '$2b$10$34jXxZaMx7fRqxmuqE1b9u7b5y1g8nbm890xKxqvKOgwSdZE/MPrm',
    role: 'faculty',
    targetExam: '',
    isEmailVerified: true,
    isActive: true
  },
  {
    id: 'admin-local-fallback-id',
    fullName: 'Admin Director',
    email: 'admin@finalattempt.com',
    mobile: '9876543212',
    passwordHash: '$2b$10$34jXxZaMx7fRqxmuqE1b9u7b5y1g8nbm890xKxqvKOgwSdZE/MPrm',
    role: 'admin',
    targetExam: '',
    isEmailVerified: true,
    isActive: true
  }
];

const authLocalSessions: SessionRecord[] = [];
const authLocalOTPs: OTPRecord[] = [];


// Ensure auth/LMS tables exist in MySQL
async function initializeAuthTables(pool: mysql.Pool) {
  try {
    // Users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id               VARCHAR(36)  PRIMARY KEY,
        fullName         VARCHAR(255) NOT NULL,
        email            VARCHAR(255) UNIQUE NOT NULL,
        mobile           VARCHAR(20)  UNIQUE,
        passwordHash     VARCHAR(255),
        googleId         VARCHAR(255) UNIQUE,
        role             ENUM('student','faculty','admin') DEFAULT 'student',
        avatarUrl        TEXT,
        isEmailVerified  TINYINT(1)   DEFAULT 0,
        isMobileVerified TINYINT(1)   DEFAULT 0,
        targetExam       VARCHAR(100),
        isActive         TINYINT(1)   DEFAULT 1,
        createdAt        DATETIME DEFAULT CURRENT_TIMESTAMP,
        lastLoginAt      DATETIME
      )
    `);

    // User Sessions (refresh tokens)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id           VARCHAR(36)  PRIMARY KEY,
        userId       VARCHAR(36)  NOT NULL,
        refreshToken TEXT         NOT NULL,
        expiresAt    DATETIME     NOT NULL,
        createdAt    DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // OTP Verifications
    await pool.query(`
      CREATE TABLE IF NOT EXISTS otp_verifications (
        id         VARCHAR(36)  PRIMARY KEY,
        identifier VARCHAR(255) NOT NULL,
        type       ENUM('email','mobile') NOT NULL,
        otpHash    VARCHAR(255) NOT NULL,
        purpose    ENUM('login','register','reset','verify') NOT NULL,
        expiresAt  DATETIME     NOT NULL,
        usedAt     DATETIME,
        attempts   INT DEFAULT 0,
        createdAt  DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // LMS Courses
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lms_courses (
        id            VARCHAR(100) PRIMARY KEY,
        title         VARCHAR(255) NOT NULL,
        slug          VARCHAR(255) UNIQUE NOT NULL,
        category      VARCHAR(50)  NOT NULL,
        description   TEXT,
        thumbnailUrl  TEXT,
        previewVideoUrl TEXT,
        fee           INT          NOT NULL DEFAULT 0,
        discountedFee INT,
        duration      VARCHAR(100),
        schedule      VARCHAR(255),
        enrolledCount INT DEFAULT 0,
        syllabus      JSON,
        features      JSON,
        faq           JSON,
        isPublished   TINYINT(1)   DEFAULT 1,
        isActive      TINYINT(1)   DEFAULT 1,
        createdAt     DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // LMS Sections (Chapters)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lms_sections (
        id          VARCHAR(100) PRIMARY KEY,
        courseId    VARCHAR(100) NOT NULL,
        title       VARCHAR(255) NOT NULL,
        description TEXT,
        orderIndex  INT          NOT NULL,
        isPublished TINYINT(1)   DEFAULT 1,
        createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (courseId) REFERENCES lms_courses(id) ON DELETE CASCADE
      )
    `);

    // LMS Lessons (Video/PDF/Text)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lms_lessons (
        id            VARCHAR(100) PRIMARY KEY,
        sectionId     VARCHAR(100) NOT NULL,
        courseId      VARCHAR(100) NOT NULL,
        title         VARCHAR(255) NOT NULL,
        type          ENUM('video','pdf','text','quiz','live') DEFAULT 'video',
        videoUrl      TEXT,
        pdfUrl        TEXT,
        textContent   LONGTEXT,
        duration      VARCHAR(50),
        durationSeconds INT,
        orderIndex    INT NOT NULL,
        isFree        TINYINT(1)   DEFAULT 0,
        isPublished   TINYINT(1)   DEFAULT 1,
        createdAt     DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sectionId) REFERENCES lms_sections(id) ON DELETE CASCADE
      )
    `);

    // LMS Enrollments
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lms_enrollments (
        id             VARCHAR(36)  PRIMARY KEY,
        userId         VARCHAR(36)  NOT NULL,
        courseId       VARCHAR(100) NOT NULL,
        paymentOrderId VARCHAR(100),
        paymentStatus  ENUM('pending','paid','free') DEFAULT 'free',
        amountPaid     INT,
        enrolledAt     DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_enrollment (userId, courseId),
        FOREIGN KEY (userId)   REFERENCES users(id)        ON DELETE CASCADE,
        FOREIGN KEY (courseId) REFERENCES lms_courses(id)  ON DELETE CASCADE
      )
    `);

    // LMS Progress (per-lesson)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lms_progress (
        id              VARCHAR(36) PRIMARY KEY,
        userId          VARCHAR(36) NOT NULL,
        courseId        VARCHAR(100) NOT NULL,
        lessonId        VARCHAR(100) NOT NULL,
        completed       TINYINT(1) DEFAULT 0,
        watchedSeconds  INT DEFAULT 0,
        totalSeconds    INT DEFAULT 0,
        lastPosition    INT DEFAULT 0,
        completedAt     DATETIME,
        updatedAt       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_progress (userId, lessonId),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Quizzes Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lms_quizzes (
        id              VARCHAR(100) PRIMARY KEY,
        courseId        VARCHAR(100) NOT NULL,
        title           VARCHAR(255) NOT NULL,
        description     TEXT,
        timeLimitMins   INT DEFAULT 60,
        passingScore    INT DEFAULT 40,
        isPublished     TINYINT(1) DEFAULT 1,
        createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (courseId) REFERENCES lms_courses(id) ON DELETE CASCADE
      )
    `);

    // Quiz Questions Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lms_quiz_questions (
        id              VARCHAR(36) PRIMARY KEY,
        quizId          VARCHAR(100) NOT NULL,
        questionText    TEXT NOT NULL,
        optionA         TEXT,
        optionB         TEXT,
        optionC         TEXT,
        optionD         TEXT,
        correctAnswer   ENUM('A','B','C','D') NOT NULL,
        explanation     TEXT,
        marks           FLOAT DEFAULT 1.0,
        negativeMarks   FLOAT DEFAULT 0.33,
        FOREIGN KEY (quizId) REFERENCES lms_quizzes(id) ON DELETE CASCADE
      )
    `);

    // Quiz Attempts Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lms_quiz_attempts (
        id              VARCHAR(36) PRIMARY KEY,
        userId          VARCHAR(36) NOT NULL,
        quizId          VARCHAR(100) NOT NULL,
        answers         JSON,
        score           FLOAT,
        maxScore        FLOAT,
        passed          TINYINT(1),
        timeTakenSecs   INT,
        submittedAt     DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (quizId) REFERENCES lms_quizzes(id) ON DELETE CASCADE
      )
    `);

    // Chat Rooms Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lms_chat_rooms (
        id            VARCHAR(36) PRIMARY KEY,
        courseId      VARCHAR(100) NOT NULL,
        title         VARCHAR(255) NOT NULL,
        type          ENUM('general','doubts','announcement') DEFAULT 'general',
        createdAt     DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (courseId) REFERENCES lms_courses(id) ON DELETE CASCADE
      )
    `);

    // Chat Messages Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lms_chat_messages (
        id            VARCHAR(36) PRIMARY KEY,
        roomId        VARCHAR(36) NOT NULL,
        senderId      VARCHAR(36) NOT NULL,
        messageText   TEXT NOT NULL,
        createdAt     DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (roomId) REFERENCES lms_chat_rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Seed lms_courses from existing course data if empty
    const [courseCount]: any = await pool.query('SELECT COUNT(*) as count FROM lms_courses');
    if (courseCount[0].count === 0) {
      for (const c of courseData) {
        await pool.query(
          `INSERT INTO lms_courses (id, title, slug, category, description, fee, duration, schedule, enrolledCount, syllabus, features, faq, isPublished)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            c.id, c.title, c.id, c.category,
            c.description,
            parseInt((c.fee || '0').replace(/[^0-9]/g, '')) || 0,
            c.duration, c.schedule, c.enrolledCount,
            JSON.stringify(c.syllabus),
            JSON.stringify(c.features),
            JSON.stringify(c.faq)
          ]
        );
        // Seed sections for this course
        const sections = [
          { id: `sect-${c.id}-1`, title: 'Foundational Concepts & Strategy', orderIndex: 1 },
          { id: `sect-${c.id}-2`, title: 'Core Syllabus Depth Integration', orderIndex: 2 },
          { id: `sect-${c.id}-3`, title: 'Mock Tests & Essay Mentorship', orderIndex: 3 }
        ];
        for (const s of sections) {
          await pool.query(
            'INSERT INTO lms_sections (id, courseId, title, orderIndex) VALUES (?, ?, ?, ?)',
            [s.id, c.id, s.title, s.orderIndex]
          );
          // Seed sample lessons per section
          const lessons = [
            { id: `les-${c.id}-${s.orderIndex}-1`, title: 'Introduction & Micro-Syllabus Analysis', type: 'video', videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4', duration: '45 mins', durationSeconds: 2700, orderIndex: 1, isFree: s.orderIndex === 1 },
            { id: `les-${c.id}-${s.orderIndex}-2`, title: 'Strategic Reading & Current Affairs Integration', type: 'video', videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4', duration: '60 mins', durationSeconds: 3600, orderIndex: 2, isFree: false }
          ];
          for (const l of lessons) {
            await pool.query(
              'INSERT INTO lms_lessons (id, sectionId, courseId, title, type, videoUrl, duration, durationSeconds, orderIndex, isFree) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [l.id, s.id, c.id, l.title, l.type, l.videoUrl, l.duration, l.durationSeconds, l.orderIndex, l.isFree ? 1 : 0]
            );
          }
        }
        // Seed chat rooms for the course
        await pool.query(
          'INSERT INTO lms_chat_rooms (id, courseId, title, type) VALUES (?, ?, ?, ?)',
          [`room-${c.id}-general`, c.id, `${c.title} - General Discussion`, 'general']
        );
        await pool.query(
          'INSERT INTO lms_chat_rooms (id, courseId, title, type) VALUES (?, ?, ?, ?)',
          [`room-${c.id}-doubts`, c.id, `${c.title} - Doubt Portal`, 'doubts']
        );
      }
      // Seed a mock BPSC Foundation quiz
      const bpscQuizId = 'q-bpsc-foundation-1';
      await pool.query(
        'INSERT INTO lms_quizzes (id, courseId, title, description, timeLimitMins, passingScore) VALUES (?, ?, ?, ?, ?, ?)',
        [bpscQuizId, 'bpsc-foundation', 'BPSC Prelims Mini Mock Test', 'A short mock test covering Bihar History and General Mental Ability to evaluate your foundation.', 10, 40]
      );

      const questions = [
        {
          id: 'q-bpsc-1-1',
          questionText: 'Who was the leader of the Santhal Rebellion of 1855-56 in Bihar?',
          optionA: 'Sidhu and Kanhu',
          optionB: 'Birsa Munda',
          optionC: 'Kunwar Singh',
          optionD: 'Bhairav and Chand',
          correctAnswer: 'A',
          explanation: 'The Santhal Rebellion was led by four Murmu brothers: Sidhu, Kanhu, Chand, and Bhairav. Sidhu and Kanhu were the primary leaders.',
        },
        {
          id: 'q-bpsc-1-2',
          questionText: 'Which of the following districts of Bihar has the highest forest cover percentage?',
          optionA: 'Kaimur',
          optionB: 'Jamui',
          optionC: 'West Champaran',
          optionD: 'Gaya',
          correctAnswer: 'A',
          explanation: 'Kaimur (Bhabua) has the highest forest cover percentage in Bihar, followed by Jamui.',
        }
      ];

      for (const q of questions) {
        await pool.query(
          'INSERT INTO lms_quiz_questions (id, quizId, questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [q.id, bpscQuizId, q.questionText, q.optionA, q.optionB, q.optionC, q.optionD, q.correctAnswer, q.explanation]
        );
      }

      console.log('Seeded lms_courses, lms_sections, lms_lessons, quizzes, and questions tables.');
    }

    console.log('Auth & LMS tables initialized.');
  } catch (err) {
    console.error('Failed to initialize auth/LMS tables:', err);
  }
}



// ─────────────────────────── AuthDB Class ────────────────────────────────────

class AuthDB {
  async getUsers(): Promise<UserRecord[]> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query('SELECT * FROM users ORDER BY createdAt DESC');
        return rows.map((r: any) => ({ ...r, isEmailVerified: !!r.isEmailVerified, isActive: !!r.isActive }));
      } catch (err) { console.error('[AuthDB] getUsers MySQL error:', err); }
    }
    return authLocalUsers;
  }

  async updateUserActiveStatus(userId: string, isActive: boolean): Promise<boolean> {
    if (mysqlPool) {
      try {
        await mysqlPool.query('UPDATE users SET isActive = ? WHERE id = ?', [isActive ? 1 : 0, userId]);
        return true;
      } catch (err) { console.error('[AuthDB] updateUserActiveStatus MySQL error:', err); }
    }
    const u = authLocalUsers.find(user => user.id === userId);
    if (u) { u.isActive = isActive; return true; }
    return false;
  }

  async deleteUser(userId: string): Promise<boolean> {
    if (mysqlPool) {
      try {
        await mysqlPool.query('DELETE FROM users WHERE id = ?', [userId]);
        return true;
      } catch (err) { console.error('[AuthDB] deleteUser MySQL error:', err); }
    }
    const idx = authLocalUsers.findIndex(user => user.id === userId);
    if (idx >= 0) { authLocalUsers.splice(idx, 1); return true; }
    return false;
  }

  // ── Users ──────────────────────────────────────────────────────────────────
  async createUser(user: UserRecord): Promise<UserRecord> {

    if (mysqlPool) {
      try {
        await mysqlPool.query(
          `INSERT INTO users (id, fullName, email, mobile, passwordHash, googleId, role, avatarUrl, isEmailVerified, targetExam, isActive)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [user.id, user.fullName, user.email, user.mobile || null, user.passwordHash || null,
           user.googleId || null, user.role, user.avatarUrl || null, user.isEmailVerified ? 1 : 0,
           user.targetExam || null]
        );
        return user;
      } catch (err) { console.error('[AuthDB] createUser MySQL error:', err); }
    }
    authLocalUsers.push(user);
    return user;
  }

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
        if (rows && rows.length > 0) return { ...rows[0], isEmailVerified: !!rows[0].isEmailVerified, isActive: !!rows[0].isActive } as UserRecord;
        return null;
      } catch (err) { console.error('[AuthDB] findUserByEmail MySQL error:', err); }
    }
    return authLocalUsers.find(u => u.email === email) || null;
  }

  async findUserByMobile(mobile: string): Promise<UserRecord | null> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query('SELECT * FROM users WHERE mobile = ? LIMIT 1', [mobile]);
        if (rows && rows.length > 0) return { ...rows[0], isEmailVerified: !!rows[0].isEmailVerified, isActive: !!rows[0].isActive } as UserRecord;
        return null;
      } catch (err) { console.error('[AuthDB] findUserByMobile MySQL error:', err); }
    }
    return authLocalUsers.find(u => u.mobile === mobile) || null;
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
        if (rows && rows.length > 0) return { ...rows[0], isEmailVerified: !!rows[0].isEmailVerified, isActive: !!rows[0].isActive } as UserRecord;
        return null;
      } catch (err) { console.error('[AuthDB] findUserById MySQL error:', err); }
    }
    return authLocalUsers.find(u => u.id === id) || null;
  }

  async verifyUserEmail(userId: string): Promise<void> {
    if (mysqlPool) {
      try {
        await mysqlPool.query('UPDATE users SET isEmailVerified = 1 WHERE id = ?', [userId]);
        return;
      } catch (err) { console.error('[AuthDB] verifyUserEmail MySQL error:', err); }
    }
    const u = authLocalUsers.find(u => u.id === userId);
    if (u) u.isEmailVerified = true;
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    if (mysqlPool) {
      try {
        await mysqlPool.query('UPDATE users SET passwordHash = ? WHERE id = ?', [passwordHash, userId]);
        return;
      } catch (err) { console.error('[AuthDB] updatePassword MySQL error:', err); }
    }
    const u = authLocalUsers.find(u => u.id === userId);
    if (u) u.passwordHash = passwordHash;
  }

  async updateLastLogin(userId: string): Promise<void> {
    if (mysqlPool) {
      try {
        await mysqlPool.query('UPDATE users SET lastLoginAt = NOW() WHERE id = ?', [userId]);
      } catch (err) { /* non-critical */ }
    }
  }

  // ── Sessions ───────────────────────────────────────────────────────────────
  async createSession(userId: string, sessionId: string, refreshToken: string, expiresAt: Date): Promise<void> {
    if (mysqlPool) {
      try {
        await mysqlPool.query(
          'INSERT INTO user_sessions (id, userId, refreshToken, expiresAt) VALUES (?, ?, ?, ?)',
          [sessionId, userId, refreshToken, expiresAt]
        );
        return;
      } catch (err) { console.error('[AuthDB] createSession MySQL error:', err); }
    }
    authLocalSessions.push({ id: sessionId, userId, refreshToken, expiresAt });
  }

  async findSession(userId: string, sessionId: string): Promise<SessionRecord | null> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query(
          'SELECT * FROM user_sessions WHERE id = ? AND userId = ? AND expiresAt > NOW() LIMIT 1',
          [sessionId, userId]
        );
        return rows && rows.length > 0 ? rows[0] : null;
      } catch (err) { console.error('[AuthDB] findSession MySQL error:', err); }
    }
    return authLocalSessions.find(s => s.id === sessionId && s.userId === userId) || null;
  }

  async deleteSession(sessionId: string): Promise<void> {
    if (mysqlPool) {
      try {
        await mysqlPool.query('DELETE FROM user_sessions WHERE id = ?', [sessionId]);
        return;
      } catch (err) { console.error('[AuthDB] deleteSession MySQL error:', err); }
    }
    const idx = authLocalSessions.findIndex(s => s.id === sessionId);
    if (idx >= 0) authLocalSessions.splice(idx, 1);
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    if (mysqlPool) {
      try {
        await mysqlPool.query('DELETE FROM user_sessions WHERE userId = ?', [userId]);
        return;
      } catch (err) { console.error('[AuthDB] deleteAllUserSessions MySQL error:', err); }
    }
    const filtered = authLocalSessions.filter(s => s.userId !== userId);
    authLocalSessions.length = 0;
    authLocalSessions.push(...filtered);
  }

  // ── OTP ────────────────────────────────────────────────────────────────────
  async createOTP(identifier: string, type: 'email' | 'mobile', otpHash: string, purpose: 'login' | 'register' | 'reset' | 'verify', expiresAt: Date): Promise<void> {
    const { v4: uuid } = await import('uuid');
    const id = uuid();
    if (mysqlPool) {
      try {
        await mysqlPool.query(
          'INSERT INTO otp_verifications (id, identifier, type, otpHash, purpose, expiresAt) VALUES (?, ?, ?, ?, ?, ?)',
          [id, identifier, type, otpHash, purpose, expiresAt]
        );
        return;
      } catch (err) { console.error('[AuthDB] createOTP MySQL error:', err); }
    }
    authLocalOTPs.push({ id, identifier, type, otpHash, purpose, expiresAt, attempts: 0, usedAt: null });
  }

  async getLatestOTP(identifier: string, type: 'email' | 'mobile', purpose: 'login' | 'register' | 'reset' | 'verify'): Promise<OTPRecord | null> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query(
          'SELECT * FROM otp_verifications WHERE identifier = ? AND type = ? AND purpose = ? AND usedAt IS NULL ORDER BY createdAt DESC LIMIT 1',
          [identifier, type, purpose]
        );
        return rows && rows.length > 0 ? rows[0] : null;
      } catch (err) { console.error('[AuthDB] getLatestOTP MySQL error:', err); }
    }
    return authLocalOTPs.filter(o => o.identifier === identifier && o.type === type && o.purpose === purpose && !o.usedAt).pop() || null;
  }

  async incrementOTPAttempts(otpId: string): Promise<void> {
    if (mysqlPool) {
      try {
        await mysqlPool.query('UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = ?', [otpId]);
        return;
      } catch (err) { /* non-critical */ }
    }
    const rec = authLocalOTPs.find(o => o.id === otpId);
    if (rec) rec.attempts++;
  }

  async markOTPUsed(otpId: string): Promise<void> {
    if (mysqlPool) {
      try {
        await mysqlPool.query('UPDATE otp_verifications SET usedAt = NOW() WHERE id = ?', [otpId]);
        return;
      } catch (err) { /* non-critical */ }
    }
    const rec = authLocalOTPs.find(o => o.id === otpId);
    if (rec) rec.usedAt = new Date();
  }
}

export const authDB = new AuthDB();

// ═════════════════════════════════════════════════════════════════════════════
//  LMS DATABASE — courses, sections, lessons, enrollments, progress
// ═════════════════════════════════════════════════════════════════════════════

const lmsLocalEnrollments: Array<{ id: string; userId: string; courseId: string; enrolledAt: string }> = [];
const lmsLocalProgress: Array<{ id: string; userId: string; courseId: string; lessonId: string; completed: boolean; watchedSeconds: number; lastPosition: number; updatedAt: string }> = [];

class LmsDB {
  // ── Courses ────────────────────────────────────────────────────────────────
  async getCourses(): Promise<any[]> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query('SELECT * FROM lms_courses WHERE isActive = 1 AND isPublished = 1 ORDER BY enrolledCount DESC');
        return rows.map((r: any) => ({
          ...r,
          syllabus: typeof r.syllabus === 'string' ? JSON.parse(r.syllabus) : r.syllabus,
          features: typeof r.features === 'string' ? JSON.parse(r.features) : r.features,
          faq:      typeof r.faq      === 'string' ? JSON.parse(r.faq)      : r.faq,
          // Format fee back for UI
          fee: `₹${(r.fee / 100 || r.fee).toLocaleString('en-IN')}`
        }));
      } catch (err) { console.error('[LmsDB] getCourses MySQL error:', err); }
    }
    return courseData;
  }

  async getCourseById(id: string): Promise<any | null> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query('SELECT * FROM lms_courses WHERE id = ? LIMIT 1', [id]);
        if (!rows || rows.length === 0) return null;
        const r = rows[0];
        return {
          ...r,
          syllabus: typeof r.syllabus === 'string' ? JSON.parse(r.syllabus) : r.syllabus,
          features: typeof r.features === 'string' ? JSON.parse(r.features) : r.features,
          faq:      typeof r.faq      === 'string' ? JSON.parse(r.faq)      : r.faq,
          fee: `₹${(r.fee).toLocaleString('en-IN')}`
        };
      } catch (err) { console.error('[LmsDB] getCourseById MySQL error:', err); }
    }
    return courseData.find(c => c.id === id) || null;
  }


  async createCourse(data: any): Promise<any> {
    const slug = data.slug || data.title?.toLowerCase()?.replace(/[^a-z0-9]+/g, '-') || `course-${Date.now()}`;
    if (mysqlPool) {
      try {
        await mysqlPool.query(
          `INSERT INTO lms_courses (id, title, slug, category, description, fee, duration, schedule, enrolledCount, syllabus, features, faq, isPublished)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
          [
            data.id, data.title, slug, data.category, data.description,
            data.fee || 0, data.duration || '', data.schedule || '',
            JSON.stringify(data.syllabus || []),
            JSON.stringify(data.features || []),
            JSON.stringify(data.faq || []),
            data.isPublished ? 1 : 0
          ]
        );
        return data;
      } catch (err) {
        console.error('[LmsDB] createCourse MySQL error:', err);
        throw err;
      }
    }

    if (!courseData.some(c => c.id === data.id)) {
      courseData.push({
        ...data,
        syllabus: typeof data.syllabus === 'string' ? JSON.parse(data.syllabus) : data.syllabus || [],
        features: typeof data.features === 'string' ? JSON.parse(data.features) : data.features || [],
        faq: typeof data.faq === 'string' ? JSON.parse(data.faq) : data.faq || []
      });
    }
    return data;
  }

  async updateCourse(id: string, updates: any): Promise<boolean> {
    if (mysqlPool) {
      try {
        const fields: string[] = [];
        const vals: any[] = [];
        if (updates.title !== undefined) { fields.push('title = ?'); vals.push(updates.title); }
        if (updates.description !== undefined) { fields.push('description = ?'); vals.push(updates.description); }
        if (updates.category !== undefined) { fields.push('category = ?'); vals.push(updates.category); }
        if (updates.fee !== undefined) { fields.push('fee = ?'); vals.push(updates.fee); }
        if (updates.duration !== undefined) { fields.push('duration = ?'); vals.push(updates.duration); }
        if (updates.schedule !== undefined) { fields.push('schedule = ?'); vals.push(updates.schedule); }
        if (updates.isPublished !== undefined) { fields.push('isPublished = ?'); vals.push(updates.isPublished ? 1 : 0); }
        if (fields.length === 0) return true;
        vals.push(id);
        await mysqlPool.query(`UPDATE lms_courses SET ${fields.join(', ')} WHERE id = ?`, vals);
        return true;
      } catch (err) {
        console.error('[LmsDB] updateCourse MySQL error:', err);
        throw err;
      }
    }
    const idx = courseData.findIndex(c => c.id === id);
    if (idx >= 0) {
      courseData[idx] = { ...courseData[idx], ...updates };
      return true;
    }
    return false;
  }

  async deleteCourse(id: string): Promise<boolean> {
    if (mysqlPool) {
      try {
        await mysqlPool.query('DELETE FROM lms_courses WHERE id = ?', [id]);
        return true;
      } catch (err) {
        console.error('[LmsDB] deleteCourse MySQL error:', err);
        throw err;
      }
    }
    const idx = courseData.findIndex(c => c.id === id);
    if (idx >= 0) {
      courseData.splice(idx, 1);
      return true;
    }
    return false;
  }

  // ── Sections ───────────────────────────────────────────────────────────────
  async createSection(data: { id: string; courseId: string; title: string; orderIndex: number }): Promise<any> {
    if (mysqlPool) {
      try {
        await mysqlPool.query(
          'INSERT INTO lms_sections (id, courseId, title, orderIndex, isPublished) VALUES (?, ?, ?, ?, 1)',
          [data.id, data.courseId, data.title, data.orderIndex]
        );
        return data;
      } catch (err) {
        console.error('[LmsDB] createSection MySQL error:', err);
        throw err;
      }
    }
    return data;
  }

  async updateSection(id: string, title: string): Promise<boolean> {
    if (mysqlPool) {
      try {
        await mysqlPool.query('UPDATE lms_sections SET title = ? WHERE id = ?', [title, id]);
        return true;
      } catch (err) {
        console.error('[LmsDB] updateSection MySQL error:', err);
        throw err;
      }
    }
    return true;
  }

  async deleteSection(id: string): Promise<boolean> {
    if (mysqlPool) {
      try {
        await mysqlPool.query('DELETE FROM lms_sections WHERE id = ?', [id]);
        return true;
      } catch (err) {
        console.error('[LmsDB] deleteSection MySQL error:', err);
        throw err;
      }
    }
    return true;
  }



  // ── Sections ───────────────────────────────────────────────────────────────
  async getSectionsByCourseId(courseId: string): Promise<any[]> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query(
          'SELECT * FROM lms_sections WHERE courseId = ? AND isPublished = 1 ORDER BY orderIndex ASC', [courseId]
        );
        return rows;
      } catch (err) { console.error('[LmsDB] getSections MySQL error:', err); }
    }
    return [
      { id: `sect-${courseId}-1`, courseId, title: 'Foundational Concepts & Strategy', orderIndex: 1 },
      { id: `sect-${courseId}-2`, courseId, title: 'Core Syllabus Depth Integration', orderIndex: 2 },
      { id: `sect-${courseId}-3`, courseId, title: 'Mock Tests & Essay Mentorship', orderIndex: 3 }
    ];
  }

  // ── Lessons ────────────────────────────────────────────────────────────────
  async getLessonsBySectionId(sectionId: string): Promise<any[]> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query(
          'SELECT * FROM lms_lessons WHERE sectionId = ? AND isPublished = 1 ORDER BY orderIndex ASC', [sectionId]
        );
        return rows.map((r: any) => ({ ...r, isFree: !!r.isFree }));
      } catch (err) { console.error('[LmsDB] getLessons MySQL error:', err); }
    }
    // Fallback mock lessons
    const parts = sectionId.split('-');
    const order = parts[parts.length - 1];
    const courseId = parts.slice(1, -1).join('-');
    return [
      { id: `les-${courseId}-${order}-1`, sectionId, title: 'Introduction & Micro-Syllabus Analysis', type: 'video', videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4', duration: '45 mins', durationSeconds: 2700, orderIndex: 1, isFree: order === '1' },
      { id: `les-${courseId}-${order}-2`, sectionId, title: 'Strategic Reading of Newspapers', type: 'video', videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4', duration: '60 mins', durationSeconds: 3600, orderIndex: 2, isFree: false }
    ];
  }

  async createLesson(data: { id: string; sectionId: string; courseId: string; title: string; type: string; videoUrl: string; duration: string; durationSeconds: number; orderIndex: number; isFree: number; isPublished: number }): Promise<any> {
    if (mysqlPool) {
      try {
        await mysqlPool.query(
          `INSERT INTO lms_lessons (id, sectionId, courseId, title, type, videoUrl, duration, durationSeconds, orderIndex, isFree, isPublished)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            data.id, data.sectionId, data.courseId, data.title, data.type,
            data.videoUrl, data.duration, data.durationSeconds, data.orderIndex,
            data.isFree, data.isPublished
          ]
        );
        return data;
      } catch (err) {
        console.error('[LmsDB] createLesson MySQL error:', err);
        throw err;
      }
    }
    return data;
  }

  async deleteLesson(id: string): Promise<boolean> {
    if (mysqlPool) {
      try {
        await mysqlPool.query('DELETE FROM lms_lessons WHERE id = ?', [id]);
        return true;
      } catch (err) {
        console.error('[LmsDB] deleteLesson MySQL error:', err);
        throw err;
      }
    }
    return true;
  }

  // ── Enrollments ────────────────────────────────────────────────────────────
  async isEnrolled(userId: string, courseId: string): Promise<boolean> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query(
          'SELECT id FROM lms_enrollments WHERE userId = ? AND courseId = ? LIMIT 1', [userId, courseId]
        );
        return rows && rows.length > 0;
      } catch (err) { console.error('[LmsDB] isEnrolled MySQL error:', err); }
    }
    return lmsLocalEnrollments.some(e => e.userId === userId && e.courseId === courseId);
  }

  async createEnrollment(userId: string, courseId: string, paymentOrderId?: string, amountPaid?: number): Promise<any> {
    const { v4: uuid } = await import('uuid');
    const enrollment = {
      id: uuid(),
      userId,
      courseId,
      paymentOrderId: paymentOrderId || null,
      paymentStatus: amountPaid ? 'paid' : 'free',
      amountPaid: amountPaid || 0,
      enrolledAt: new Date().toISOString()
    };
    if (mysqlPool) {
      try {
        await mysqlPool.query(
          'INSERT INTO lms_enrollments (id, userId, courseId, paymentOrderId, paymentStatus, amountPaid) VALUES (?, ?, ?, ?, ?, ?)',
          [enrollment.id, userId, courseId, enrollment.paymentOrderId, enrollment.paymentStatus, enrollment.amountPaid]
        );
        // Update enrolled count
        await mysqlPool.query('UPDATE lms_courses SET enrolledCount = enrolledCount + 1 WHERE id = ?', [courseId]);
        return enrollment;
      } catch (err) { console.error('[LmsDB] createEnrollment MySQL error:', err); }
    }
    lmsLocalEnrollments.push({ id: enrollment.id, userId, courseId, enrolledAt: enrollment.enrolledAt });
    return enrollment;
  }

  async getUserEnrollments(userId: string): Promise<any[]> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query(
          `SELECT e.*, c.title, c.category, c.thumbnailUrl, c.duration
           FROM lms_enrollments e
           JOIN lms_courses c ON c.id = e.courseId
           WHERE e.userId = ?
           ORDER BY e.enrolledAt DESC`,
          [userId]
        );
        return rows;
      } catch (err) { console.error('[LmsDB] getUserEnrollments MySQL error:', err); }
    }
    return lmsLocalEnrollments.filter(e => e.userId === userId);
  }

  // ── Progress ───────────────────────────────────────────────────────────────
  async getUserProgress(userId: string, courseId: string): Promise<any[]> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query(
          'SELECT * FROM lms_progress WHERE userId = ? AND courseId = ?', [userId, courseId]
        );
        return rows.map((r: any) => ({ ...r, completed: !!r.completed }));
      } catch (err) { console.error('[LmsDB] getUserProgress MySQL error:', err); }
    }
    return lmsLocalProgress.filter(p => p.userId === userId && p.courseId === courseId);
  }

  async saveProgress(userId: string, data: { courseId: string; lessonId: string; completed?: boolean; watchedSeconds?: number; totalSeconds?: number; lastPosition?: number }): Promise<boolean> {
    const { v4: uuid } = await import('uuid');
    if (mysqlPool) {
      try {
        await mysqlPool.query(
          `INSERT INTO lms_progress (id, userId, courseId, lessonId, completed, watchedSeconds, totalSeconds, lastPosition, completedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             completed = IF(VALUES(completed) = 1, 1, completed),
             watchedSeconds = GREATEST(watchedSeconds, VALUES(watchedSeconds)),
             lastPosition = VALUES(lastPosition),
             completedAt = IF(VALUES(completed) = 1 AND completedAt IS NULL, NOW(), completedAt)`,
          [
            uuid(), userId, data.courseId, data.lessonId,
            data.completed ? 1 : 0,
            data.watchedSeconds || 0,
            data.totalSeconds   || 0,
            data.lastPosition   || 0,
            data.completed ? new Date() : null
          ]
        );
        return true;
      } catch (err) { console.error('[LmsDB] saveProgress MySQL error:', err); }
    }
    const idx = lmsLocalProgress.findIndex(p => p.userId === userId && p.lessonId === data.lessonId);
    const entry = {
      id: uuid(), userId,
      courseId: data.courseId,
      lessonId: data.lessonId,
      completed: data.completed || false,
      watchedSeconds: data.watchedSeconds || 0,
      lastPosition: data.lastPosition || 0,
      updatedAt: new Date().toISOString()
    };
    if (idx >= 0) { lmsLocalProgress[idx] = entry; } else { lmsLocalProgress.push(entry); }
    return true;
  }

  // ── Quizzes ────────────────────────────────────────────────────────────────
  async getQuizzesByCourseId(courseId: string): Promise<any[]> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query(
          'SELECT * FROM lms_quizzes WHERE courseId = ? AND isPublished = 1 ORDER BY createdAt DESC', [courseId]
        );
        return rows;
      } catch (err) { console.error('[LmsDB] getQuizzesByCourseId MySQL error:', err); }
    }
    return [];
  }

  async getQuizById(id: string): Promise<any | null> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query('SELECT * FROM lms_quizzes WHERE id = ? LIMIT 1', [id]);
        return rows && rows.length > 0 ? rows[0] : null;
      } catch (err) { console.error('[LmsDB] getQuizById MySQL error:', err); }
    }
    return null;
  }

  async getQuestionsByQuizId(quizId: string): Promise<any[]> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query('SELECT * FROM lms_quiz_questions WHERE quizId = ?', [quizId]);
        return rows;
      } catch (err) { console.error('[LmsDB] getQuestionsByQuizId MySQL error:', err); }
    }
    return [];
  }

  async submitQuizAttempt(userId: string, quizId: string, answers: any, score: number, maxScore: number, passed: boolean, timeTakenSecs: number): Promise<any> {
    const { v4: uuid } = await import('uuid');
    const id = uuid();
    const attempt = {
      id,
      userId,
      quizId,
      answers: JSON.stringify(answers),
      score,
      maxScore,
      passed: passed ? 1 : 0,
      timeTakenSecs,
      submittedAt: new Date()
    };

    if (mysqlPool) {
      try {
        await mysqlPool.query(
          'INSERT INTO lms_quiz_attempts (id, userId, quizId, answers, score, maxScore, passed, timeTakenSecs) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [attempt.id, attempt.userId, attempt.quizId, attempt.answers, attempt.score, attempt.maxScore, attempt.passed, attempt.timeTakenSecs]
        );
        return { ...attempt, passed: !!attempt.passed };
      } catch (err) { console.error('[LmsDB] submitQuizAttempt MySQL error:', err); }
    }
    return attempt;
  }

  async getQuizAttempts(userId: string, quizId: string): Promise<any[]> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query(
          'SELECT * FROM lms_quiz_attempts WHERE userId = ? AND quizId = ? ORDER BY submittedAt DESC', [userId, quizId]
        );
        return rows.map((r: any) => ({ ...r, passed: !!r.passed, answers: typeof r.answers === 'string' ? JSON.parse(r.answers) : r.answers }));
      } catch (err) { console.error('[LmsDB] getQuizAttempts MySQL error:', err); }
    }
    return [];
  }

  async getLeaderboard(quizId: string): Promise<any[]> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query(
          `SELECT a.score, a.timeTakenSecs, a.submittedAt, u.fullName
           FROM lms_quiz_attempts a
           JOIN users u ON u.id = a.userId
           WHERE a.quizId = ?
           ORDER BY a.score DESC, a.timeTakenSecs ASC
           LIMIT 10`,
          [quizId]
        );
        return rows;
      } catch (err) { console.error('[LmsDB] getLeaderboard MySQL error:', err); }
    }
    return [];
  }

  // ── Chat Helpers ───────────────────────────────────────────────────────────
  async getChatRoomsByCourseId(courseId: string): Promise<any[]> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query(
          'SELECT * FROM lms_chat_rooms WHERE courseId = ? ORDER BY type ASC', [courseId]
        );
        return rows;
      } catch (err) { console.error('[LmsDB] getChatRoomsByCourseId MySQL error:', err); }
    }
    return [];
  }

  async getChatMessagesByRoomId(roomId: string, limit = 50): Promise<any[]> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query(
          `SELECT m.*, u.fullName, u.role, u.avatarUrl
           FROM lms_chat_messages m
           JOIN users u ON u.id = m.senderId
           WHERE m.roomId = ?
           ORDER BY m.createdAt ASC
           LIMIT ?`,
          [roomId, limit]
        );
        return rows;
      } catch (err) { console.error('[LmsDB] getChatMessagesByRoomId MySQL error:', err); }
    }
    return [];
  }

  async saveChatMessage(roomId: string, senderId: string, messageText: string): Promise<any> {
    const { v4: uuid } = await import('uuid');
    const msgId = uuid();
    const msg = {
      id: msgId,
      roomId,
      senderId,
      messageText,
      createdAt: new Date().toISOString()
    };

    if (mysqlPool) {
      try {
        await mysqlPool.query(
          'INSERT INTO lms_chat_messages (id, roomId, senderId, messageText) VALUES (?, ?, ?, ?)',
          [msg.id, msg.roomId, msg.senderId, msg.messageText]
        );
        
        // Fetch message sender details for real-time dispatch payloads
        const [userRows]: any = await mysqlPool.query(
          'SELECT fullName, role, avatarUrl FROM users WHERE id = ? LIMIT 1', [senderId]
        );
        
        return {
          ...msg,
          fullName: userRows[0]?.fullName || 'Anonymous',
          role: userRows[0]?.role || 'student',
          avatarUrl: userRows[0]?.avatarUrl || null
        };
      } catch (err) { console.error('[LmsDB] saveChatMessage MySQL error:', err); }
    }
    return msg;
  }

  // ── Analytics & Performance Metrics ────────────────────────────────────────
  async getStudentProgressMetrics(userId: string): Promise<any> {
    if (mysqlPool) {
      try {
        // 1. Total lessons count per course vs completed progress count
        const [progressRows]: any = await mysqlPool.query(
          `SELECT p.courseId, c.title,
                  COUNT(p.id) as completedLessons,
                  (SELECT COUNT(l.id) FROM lms_lessons l WHERE l.courseId = p.courseId AND l.isPublished = 1) as totalLessons
           FROM lms_progress p
           JOIN lms_courses c ON c.id = p.courseId
           WHERE p.userId = ? AND p.completed = 1
           GROUP BY p.courseId`,
          [userId]
        );

        // 2. Average Quiz Scores and passed checks
        const [quizRows]: any = await mysqlPool.query(
          `SELECT quizId,
                  AVG(score) as averageScore,
                  MAX(score) as maxScore,
                  COUNT(id) as attemptsCount,
                  SUM(passed) as passesCount
           FROM lms_quiz_attempts
           WHERE userId = ?
           GROUP BY quizId`,
          [userId]
        );

        return {
          courseCompletion: progressRows.map((r: any) => ({
            courseId: r.courseId,
            title: r.title,
            completedLessons: Number(r.completedLessons),
            totalLessons: Number(r.totalLessons),
            completionPercentage: r.totalLessons > 0 ? (r.completedLessons / r.totalLessons) * 100 : 0
          })),
          quizAnalytics: quizRows.map((q: any) => ({
            quizId: q.quizId,
            averageScore: Number(q.averageScore || 0),
            maxScore: Number(q.maxScore || 0),
            attemptsCount: Number(q.attemptsCount || 0),
            passesCount: Number(q.passesCount || 0)
          }))
        };
      } catch (err) {
        console.error('[LmsDB] getStudentProgressMetrics MySQL error:', err);
      }
    }
    return { courseCompletion: [], quizAnalytics: [] };
  }
}



export const lmsDB = new LmsDB();


