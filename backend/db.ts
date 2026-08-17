import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { initEnv } from './bootstrap';

// Ensure .env is deterministically loaded
initEnv();

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

const useRealDB = process.env.USE_LOCAL_DB !== 'true' && !!(dbConfig.host && dbConfig.user && dbConfig.database);

// ── Persistent Storage Location ────────────────────────────────────────────────
const getPersistentDataDir = (): string => {
  if (process.env.PERSISTENT_DATA_DIR) {
    if (!fs.existsSync(process.env.PERSISTENT_DATA_DIR)) {
      try { fs.mkdirSync(process.env.PERSISTENT_DATA_DIR, { recursive: true }); } catch (_) {}
    }
    return process.env.PERSISTENT_DATA_DIR;
  }

  // System-level persistent candidates outside git root:
  const candidates = [
    process.platform === 'win32' ? 'C:\\finalattempt_production_data' : '/var/lib/finalattempt_data',
    path.join(process.env.APPDATA || process.env.HOME || process.cwd(), '.finalattempt_production_data'),
    path.resolve(__dirname, '..', '..', 'finalattempt_persistent_storage')
  ];

  for (const dir of candidates) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      // Verify directory is writable
      const testFile = path.join(dir, '.write_test');
      fs.writeFileSync(testFile, 'ok', 'utf-8');
      fs.unlinkSync(testFile);
      return dir;
    } catch (_) {}
  }

  return __dirname;
};

export const PERSISTENT_DIR = getPersistentDataDir();
const JSON_DB_PATH = path.join(PERSISTENT_DIR, 'database_store.json');
const JSON_DB_BACKUP_PATH = path.join(PERSISTENT_DIR, 'database_store_backup.json');
const LOCAL_REPO_JSON_PATH = path.join(__dirname, 'database_store.json');

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

export interface Course {
  id: string;
  title: string;
  exam?: 'BPSC' | 'Arunachal PCS' | string;
  category: 'Prelims' | 'Mains' | 'Interview' | 'Foundation' | string;
  description: string;
  duration: string;
  fee: string;
  price?: number;
  discountedPrice?: number;
  syllabus: string[];
  features: string[];
  schedule: string;
  faq: { q: string; a: string }[];
  enrolledCount: number;
  isPublished?: boolean;
}

export interface CurrentAffairArticle {
  id: string;
  title: string;
  category: string;
  publishDate: string;
  summary: string;
  content: string;
  relevance?: string;
  context?: string;
  analysis?: string;
  wayForward?: string;
  practiceQuestion?: string;
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

export interface BlogItem {
  id: string;
  title: string;
  slug?: string;
  publishDate: string;
  readTime: string;
  category: string;
  content: string;
  imageUrl?: string;
  excerpt?: string;
  status?: string;
  author_name?: string;
  seoTitle?: string;
  seoKeywords?: string;
  seoDescription?: string;
  blurb?: string;
}

export interface ResourceDownload {
  id: string;
  title: string;
  size: string;
  type: string;
  downloadCount: number;
  url: string;
  category?: string;
  subcategory?: string;
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
  aboutMethodology?: { title: string; desc: string }[];
  announcements?: { date: string; text: string; link?: string; isNew?: boolean }[];
  featureFlags?: Record<string, boolean>;
}

export interface DownloadItem {
  id: string;
  title: string;
  description?: string;
  size?: string;
  type?: string;          // Category / Vault Section (e.g. "BPSC", "State PCS")
  url: string;           // Main File / Full PDF / Buy Link
  thumbnailUrl?: string; // Cover Image / Book Thumbnail

  // Catalogue & Publication Extensions (Optional & Backward Compatible)
  language?: 'English' | 'Hindi' | 'Bilingual' | string;
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
  showLocation: 'NAVBAR' | 'FOOTER' | 'HEADER_TOP' | 'SLUG_ONLY';
  displayOrder?: number;
  metaTitle?: string;
  metaDescription?: string;
  bannerUrl?: string;
  downloadItems?: DownloadItem[];
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
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
  courses: any[];
  sections: any[];
  lessons: any[];
  users?: any[];
  sessions?: any[];
  otps?: any[];
  dynamicCurrentAffairEditions?: DynamicCurrentAffairEdition[];
  youtubeVideos?: any[];
  youtubeSyncLogs?: any[];
  customPages?: CustomPage[];
  exams?: any[];
  chatRooms?: any[];
  chatMessages?: any[];
  lmsQuizzes?: any[];
  lmsQuestions?: any[];
  lmsAttempts?: any[];
  lmsEnrollments?: any[];
}

export let mysqlPool: mysql.Pool | null = null;

export function handlePoolDegrade(err: any) {
  if (err && (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.fatal)) {
    console.warn('[MySQL Pool] Degrading to local store fallback permanently due to query error:', err.code);
    mysqlPool = null;
  }
}

async function initializeMySQLTables(pool: mysql.Pool) {
  try {
    console.log('Initializing MySQL Database tables if they do not exist...');
    
    // 1. Settings
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT PRIMARY KEY DEFAULT 1,
        heroTitle TEXT,
        heroSubtitle TEXT,
        tagline TEXT,
        heroImageUrl TEXT,
        visitorsCount INT DEFAULT 0
      )
    `);
    try {
      await pool.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS heroImageUrl TEXT');
    } catch (_) { /* column already exists */ }
    try {
      await pool.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS visitorsCount INT DEFAULT 0');
    } catch (_) { /* column already exists */ }
    try {
      await pool.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS featureFlags JSON');
    } catch (_) { /* column already exists */ }
    try { await pool.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS contactTitle TEXT'); } catch (_) {}
    try { await pool.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS contactSubtitle TEXT'); } catch (_) {}
    try { await pool.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS contactAddress TEXT'); } catch (_) {}
    try { await pool.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS contactPhone TEXT'); } catch (_) {}
    try { await pool.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS contactEmail TEXT'); } catch (_) {}
    try { await pool.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS contactHours TEXT'); } catch (_) {}
    try { await pool.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS whatsappLink TEXT'); } catch (_) {}
    try { await pool.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS telegramLink TEXT'); } catch (_) {}
    try { await pool.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS googleMapUrl TEXT'); } catch (_) {}
    try { await pool.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS aboutTitle TEXT'); } catch (_) {}
    try { await pool.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS aboutSubtitle TEXT'); } catch (_) {}
    try { await pool.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS aboutMission TEXT'); } catch (_) {}
    try { await pool.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS aboutVision TEXT'); } catch (_) {}
    try { await pool.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS aboutValues TEXT'); } catch (_) {}
    try { await pool.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS aboutMethodology JSON'); } catch (_) {}
    try { await pool.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS announcements JSON'); } catch (_) {}
    
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
        content TEXT,
        relevance TEXT,
        context TEXT,
        analysis TEXT,
        wayForward TEXT,
        practiceQuestion TEXT
      )
    `);
    try {
      await pool.query('ALTER TABLE current_affairs ADD COLUMN IF NOT EXISTS relevance TEXT');
      await pool.query('ALTER TABLE current_affairs ADD COLUMN IF NOT EXISTS context TEXT');
      await pool.query('ALTER TABLE current_affairs ADD COLUMN IF NOT EXISTS analysis TEXT');
      await pool.query('ALTER TABLE current_affairs ADD COLUMN IF NOT EXISTS wayForward TEXT');
      await pool.query('ALTER TABLE current_affairs ADD COLUMN IF NOT EXISTS practiceQuestion TEXT');
    } catch (_) {}

    // 5b. Dynamic Current Affairs System Tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS current_affair_editions (
        id VARCHAR(255) PRIMARY KEY,
        publishDate VARCHAR(100) UNIQUE NOT NULL,
        summary TEXT,
        createdAt VARCHAR(255) NOT NULL,
        updatedAt VARCHAR(255) NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS current_affair_seo (
        id VARCHAR(255) PRIMARY KEY,
        canonicalUrl TEXT,
        seoTitle VARCHAR(255),
        seoDescription TEXT,
        seoKeywords TEXT
      )
    `);

    // Translation Cache Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS translation_cache (
        id VARCHAR(255) PRIMARY KEY,
        entityType VARCHAR(100) NOT NULL,
        entityId VARCHAR(255) NOT NULL,
        fieldName VARCHAR(100) NOT NULL,
        sourceLanguage VARCHAR(10) NOT NULL DEFAULT 'en',
        targetLanguage VARCHAR(10) NOT NULL DEFAULT 'hi',
        sourceHash VARCHAR(64) NOT NULL,
        translatedText LONGTEXT NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY entityType_entityId_fieldName_sourceLanguage_targetLanguage (entityType, entityId, fieldName, sourceLanguage, targetLanguage),
        INDEX idx_entity (entityType, entityId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS current_affair_articles (
        id VARCHAR(255) PRIMARY KEY,
        slug VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        summary TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        publishStatus VARCHAR(50) DEFAULT 'DRAFT',
        publishedDate VARCHAR(100) NOT NULL,
        readingTime VARCHAR(100) DEFAULT '5 min read',
        importance VARCHAR(50) DEFAULT 'MEDIUM',
        whyInNews TEXT,
        context TEXT,
        background TEXT,
        keyHighlights TEXT,
        importantFacts TEXT,
        examRelevance TEXT,
        previousContext TEXT,
        wayForward TEXT,
        keyTakeaways TEXT,
        editionId VARCHAR(255) NOT NULL,
        seoId VARCHAR(255),
        content TEXT,
        createdAt VARCHAR(255) NOT NULL,
        updatedAt VARCHAR(255) NOT NULL,
        FOREIGN KEY (editionId) REFERENCES current_affair_editions(id) ON DELETE CASCADE,
        FOREIGN KEY (seoId) REFERENCES current_affair_seo(id) ON DELETE SET NULL
      )
    `);
    try {
      await pool.query('ALTER TABLE current_affair_articles ADD COLUMN IF NOT EXISTS content TEXT');
    } catch (_) {}

    await pool.query(`
      CREATE TABLE IF NOT EXISTS current_affair_subjects (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS current_affair_exams (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS current_affair_tags (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS current_affair_media (
        id VARCHAR(255) PRIMARY KEY,
        type VARCHAR(100) NOT NULL,
        url TEXT NOT NULL,
        articleId VARCHAR(255) NOT NULL,
        FOREIGN KEY (articleId) REFERENCES current_affair_articles(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS current_affair_article_subjects (
        articleId VARCHAR(255) NOT NULL,
        subjectId VARCHAR(255) NOT NULL,
        PRIMARY KEY (articleId, subjectId),
        FOREIGN KEY (articleId) REFERENCES current_affair_articles(id) ON DELETE CASCADE,
        FOREIGN KEY (subjectId) REFERENCES current_affair_subjects(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS current_affair_article_exams (
        articleId VARCHAR(255) NOT NULL,
        examId VARCHAR(255) NOT NULL,
        PRIMARY KEY (articleId, examId),
        FOREIGN KEY (articleId) REFERENCES current_affair_articles(id) ON DELETE CASCADE,
        FOREIGN KEY (examId) REFERENCES current_affair_exams(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS current_affair_article_tags (
        articleId VARCHAR(255) NOT NULL,
        tagId VARCHAR(255) NOT NULL,
        PRIMARY KEY (articleId, tagId),
        FOREIGN KEY (articleId) REFERENCES current_affair_articles(id) ON DELETE CASCADE,
        FOREIGN KEY (tagId) REFERENCES current_affair_tags(id) ON DELETE CASCADE
      )
    `);

    // Seed default subjects
    const defaultSubjects = ['Polity', 'Economy', 'Geography', 'History', 'Environment', 'Science & Technology', 'Agriculture', 'Culture', 'Governance', 'International Relations'];
    for (const sub of defaultSubjects) {
      try {
        await pool.query('INSERT IGNORE INTO current_affair_subjects (id, name) VALUES (?, ?)', [`sub-${sub.toLowerCase().replace(/[^a-z0-9]/g, '-')}`, sub]);
      } catch (_) {}
    }

    // Seed default exams
    const defaultExams = ['BPSC', 'BSSC', 'SSC', 'Railway'];
    for (const ex of defaultExams) {
      try {
        await pool.query('INSERT IGNORE INTO current_affair_exams (id, name) VALUES (?, ?)', [`ex-${ex.toLowerCase()}`, ex]);
      } catch (_) {}
    }
    
    // 6. Blogs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blogs (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255),
        publishDate VARCHAR(100) NOT NULL,
        readTime VARCHAR(100) NOT NULL,
        category VARCHAR(100) NOT NULL,
        content TEXT,
        imageUrl TEXT,
        excerpt TEXT,
        status VARCHAR(50) DEFAULT 'published',
        author_name VARCHAR(255) DEFAULT 'Admin',
        seoTitle VARCHAR(255),
        seoKeywords TEXT,
        seoDescription TEXT,
        blurb TEXT
      )
    `);
    try {
      await pool.query('ALTER TABLE blogs ADD COLUMN IF NOT EXISTS slug VARCHAR(255)');
      await pool.query('ALTER TABLE blogs ADD COLUMN IF NOT EXISTS imageUrl TEXT');
      await pool.query('ALTER TABLE blogs ADD COLUMN IF NOT EXISTS excerpt TEXT');
      await pool.query('ALTER TABLE blogs ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT "published"');
      await pool.query('ALTER TABLE blogs ADD COLUMN IF NOT EXISTS author_name VARCHAR(255) DEFAULT "Admin"');
      await pool.query('ALTER TABLE blogs ADD COLUMN IF NOT EXISTS seoTitle VARCHAR(255)');
      await pool.query('ALTER TABLE blogs ADD COLUMN IF NOT EXISTS seoKeywords TEXT');
      await pool.query('ALTER TABLE blogs ADD COLUMN IF NOT EXISTS seoDescription TEXT');
      await pool.query('ALTER TABLE blogs ADD COLUMN IF NOT EXISTS blurb TEXT');
    } catch (_) {}
    
    // 7. Resources
    await pool.query(`
      CREATE TABLE IF NOT EXISTS resources (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        size VARCHAR(100) NOT NULL,
        type VARCHAR(100) NOT NULL,
        downloadCount INT DEFAULT 0,
        url TEXT,
        category VARCHAR(100),
        subcategory VARCHAR(100)
      )
    `);
    // Add category/subcategory columns if upgrading existing DB
    try { await pool.query('ALTER TABLE resources ADD COLUMN IF NOT EXISTS category VARCHAR(100)'); } catch (_) {}
    try { await pool.query('ALTER TABLE resources ADD COLUMN IF NOT EXISTS subcategory VARCHAR(100)'); } catch (_) {}
    
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

    // 10. LMS Quizzes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lms_quizzes (
        id VARCHAR(255) PRIMARY KEY,
        courseId VARCHAR(255) NOT NULL,
        lessonId VARCHAR(255),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        timeLimitMins INT DEFAULT 30,
        passingScore DECIMAL(5,2) DEFAULT 40.00,
        isPublished TINYINT(1) DEFAULT 1,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_quiz_course (courseId),
        INDEX idx_quiz_lesson (lessonId)
      )
    `);

    // 11. LMS Questions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lms_questions (
        id VARCHAR(255) PRIMARY KEY,
        quizId VARCHAR(255) NOT NULL,
        questionText TEXT NOT NULL,
        optionA TEXT NOT NULL,
        optionB TEXT NOT NULL,
        optionC TEXT NOT NULL,
        optionD TEXT NOT NULL,
        correctAnswer CHAR(1) NOT NULL,
        explanation TEXT,
        questionTextHi TEXT,
        optionAHi TEXT,
        optionBHi TEXT,
        optionCHi TEXT,
        optionDHi TEXT,
        explanationHi TEXT,
        marks DECIMAL(5,2) DEFAULT 1.00,
        negativeMarks DECIMAL(5,2) DEFAULT 0.33,
        orderIndex INT DEFAULT 1,
        INDEX idx_question_quiz (quizId)
      )
    `);

    // Auto-migrate optional Hindi columns on existing lms_questions table
    try {
      await pool.query('ALTER TABLE lms_questions ADD COLUMN questionTextHi TEXT, ADD COLUMN optionAHi TEXT, ADD COLUMN optionBHi TEXT, ADD COLUMN optionCHi TEXT, ADD COLUMN optionDHi TEXT, ADD COLUMN explanationHi TEXT');
    } catch (_) {}

    // 12. LMS Quiz Attempts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lms_quiz_attempts (
        id VARCHAR(255) PRIMARY KEY,
        userId VARCHAR(255) NOT NULL,
        quizId VARCHAR(255) NOT NULL,
        answers JSON,
        score DECIMAL(8,2) DEFAULT 0,
        maxScore DECIMAL(8,2) DEFAULT 0,
        passed TINYINT(1) DEFAULT 0,
        timeTakenSecs INT DEFAULT 0,
        setCode VARCHAR(20) DEFAULT 'SET-A',
        seed VARCHAR(100) NULL,
        status VARCHAR(50) DEFAULT 'SUBMITTED',
        startedAt TIMESTAMP NULL,
        expiresAt TIMESTAMP NULL,
        submittedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_attempt_user (userId),
        INDEX idx_attempt_quiz (quizId)
      )
    `);
    try {
      await pool.query('ALTER TABLE lms_quiz_attempts ADD COLUMN setCode VARCHAR(20) DEFAULT "SET-A", ADD COLUMN seed VARCHAR(100) NULL, ADD COLUMN status VARCHAR(50) DEFAULT "SUBMITTED", ADD COLUMN startedAt TIMESTAMP NULL, ADD COLUMN expiresAt TIMESTAMP NULL');
    } catch (_) {}

    // 13. LMS Assignments
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lms_assignments (
        id VARCHAR(255) PRIMARY KEY,
        courseId VARCHAR(255) NOT NULL,
        lessonId VARCHAR(255),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        dueDate VARCHAR(100),
        maxMarks INT DEFAULT 100,
        submissionType VARCHAR(50) DEFAULT 'pdf',
        isPublished TINYINT(1) DEFAULT 1,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_assign_course (courseId),
        INDEX idx_assign_lesson (lessonId)
      )
    `);

    // 14. LMS Assignment Submissions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lms_assignment_submissions (
        id VARCHAR(255) PRIMARY KEY,
        userId VARCHAR(255) NOT NULL,
        assignmentId VARCHAR(255) NOT NULL,
        submissionUrl TEXT,
        submissionText TEXT,
        submittedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        grade INT,
        feedback TEXT,
        INDEX idx_submission_user (userId),
        INDEX idx_submission_assignment (assignmentId)
      )
    `);

    // Dynamically ensure new Mains columns exist on lms_assignments & lms_assignment_submissions
    try { await pool.query("ALTER TABLE lms_assignments ADD COLUMN testSeriesId VARCHAR(255) NULL"); } catch (e) {}
    try { await pool.query("ALTER TABLE lms_assignments ADD COLUMN questionPaperUrl TEXT NULL"); } catch (e) {}
    try { await pool.query("ALTER TABLE lms_assignments ADD COLUMN syllabus TEXT NULL"); } catch (e) {}
    try { await pool.query("ALTER TABLE lms_assignment_submissions ADD COLUMN status VARCHAR(50) DEFAULT 'Submitted'"); } catch (e) {}
    try { await pool.query("ALTER TABLE lms_assignment_submissions ADD COLUMN evaluatedCopyUrl TEXT NULL"); } catch (e) {}
    try { await pool.query("ALTER TABLE lms_assignment_submissions ADD COLUMN evaluatedAt TIMESTAMP NULL"); } catch (e) {}

    // 15. YouTube Videos Cached Metadata Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS youtube_videos (
        youtubeVideoId VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        thumbnail TEXT,
        duration VARCHAR(50),
        publishedAt VARCHAR(100) NOT NULL,
        channelTitle VARCHAR(255) NOT NULL,
        createdAt VARCHAR(255) NOT NULL
      )
    `);

    // 16. YouTube Synchronization Execution Logs Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS youtube_sync_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        syncTime VARCHAR(255) NOT NULL,
        videosSynced INT NOT NULL,
        status VARCHAR(50) NOT NULL,
        error TEXT
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS custom_pages (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        content LONGTEXT,
        showLocation VARCHAR(50) DEFAULT 'NAVBAR',
        displayOrder INT DEFAULT 0,
        metaTitle VARCHAR(255),
        metaDescription TEXT,
        bannerUrl TEXT,
        downloadItems JSON,
        isPublished TINYINT(1) DEFAULT 1,
        createdAt VARCHAR(255),
        updatedAt VARCHAR(255)
      )
    `);

    try { await pool.query('ALTER TABLE custom_pages ADD COLUMN bannerUrl TEXT'); } catch (_) {}
    try { await pool.query('ALTER TABLE custom_pages ADD COLUMN downloadItems JSON'); } catch (_) {}

    // LMS Courses column migrations (add exam & schedule columns if not present)
    try { await pool.query("ALTER TABLE lms_courses ADD COLUMN IF NOT EXISTS exam VARCHAR(100) DEFAULT 'BPSC'"); } catch (_) {}
    try { await pool.query("ALTER TABLE lms_courses ADD COLUMN IF NOT EXISTS schedule VARCHAR(255)"); } catch (_) {}

    console.log('MySQL Database tables initialized successfully.');

    
    // Seed settings table if empty
    const [settingsRows]: any = await pool.query('SELECT COUNT(*) as count FROM settings');
    if (settingsRows[0].count === 0) {
      await pool.query(
        'INSERT INTO settings (id, heroTitle, heroSubtitle, tagline) VALUES (1, ?, ?, ?)',
        [
          'The Next Generation Mentorship & Learning Platform',
          'Empowering aspirants through personalized mentorship, high-quality content, strategic preparation, an innovative AI-powered learning ecosystem and continuous performance tracking - everything designed with one goal: to help make this attempt your final attempt.',
          "Let's Make Your Attempt Final with FINAL ATTEMPT"
        ]
      );
      console.log('Seeded settings table.');
    }

  } catch (err) {
    console.error('Failed to initialize MySQL Database tables:', err);
  }
}

// Global safety handlers for unhandled errors/rejections (prevent crashes on remote MySQL dropouts)
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION] Gracefully caught error to prevent server crash:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION] Gracefully caught promise rejection:', reason);
});

if (useRealDB) {
  try {
    const tempPool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 10,                    // Max idle connections
      idleTimeout: 10000,             // Close idle connections after 10s (Hostinger drops them anyway)
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,   // Ping every 10s to keep connection alive
      connectTimeout: 10000,          // 10s connect timeout for remote Hostinger host
      charset: 'utf8mb4'
    });

    // Handle connection pool errors (prevent crash on ECONNRESET / MySQL drops)
    (tempPool as any).on('error', (err: any) => {
      console.warn('[MySQL Pool Error] Connection pool encountered error:', err.code || err.message);
      if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.fatal) {
        console.warn('[MySQL Pool] Degrading to local store fallback permanently for this process run due to connection error.');
        mysqlPool = null;
      }
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

// ═════════════════════════════════════════════════════════════════════════════
//  LMS LOCAL FALLBACK MEMORY ARRAYS (Declared before BackendDB initialization)
// ═════════════════════════════════════════════════════════════════════════════
export const lmsLocalEnrollments: Array<{ id: string; userId: string; courseId: string; enrolledAt: string }> = [];
export const lmsLocalProgress: Array<{ id: string; userId: string; courseId: string; lessonId: string; completed: boolean; watchedSeconds: number; lastPosition: number; updatedAt: string }> = [];
export const lmsLocalQuizzes: any[] = [];
export const lmsLocalQuestions: any[] = [];
export const lmsLocalAttempts: any[] = [];

class BackendDB {
  public localStore: LocalDBStore = {
    leads: [
      { id: 'lead-1', fullName: 'Aman Kumar', mobile: '9123456780', targetExam: 'BPSC Target Batch', status: 'New', createdAt: new Date().toISOString() },
      { id: 'lead-2', fullName: 'Priya Singh', mobile: '9876543210', targetExam: 'BPSC Mentorship', status: 'Contacted', createdAt: new Date().toISOString() },
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
      heroTitle: 'The Next Generation Mentorship & Learning Platform',
      heroSubtitle: 'Empowering aspirants through personalized mentorship, high-quality content, strategic preparation, an innovative AI-powered learning ecosystem and continuous performance tracking - everything designed with one goal: to help make this attempt your final attempt.',
      tagline: "Let's Make Your Attempt Final with FINAL ATTEMPT",
      heroImageUrl: ''
    },
    courses: [...courseData],
    sections: [
      { id: 'sect-bpsc-foundation-1', courseId: 'bpsc-foundation', title: 'Foundational Concepts & Strategy', orderIndex: 1, isPublished: 1 },
      { id: 'sect-bpsc-foundation-2', courseId: 'bpsc-foundation', title: 'Core Syllabus Depth Integration', orderIndex: 2, isPublished: 1 },
      { id: 'sect-bpsc-foundation-3', courseId: 'bpsc-foundation', title: 'Mock Tests & Essay Mentorship', orderIndex: 3, isPublished: 1 }
    ],
    lessons: [
      { id: 'les-bpsc-foundation-1-1', sectionId: 'sect-bpsc-foundation-1', courseId: 'bpsc-foundation', title: 'Introduction & Micro-Syllabus Analysis', type: 'video', videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4', duration: '45 mins', durationSeconds: 2700, orderIndex: 1, isFree: 1, isPublished: 1 },
      { id: 'les-bpsc-foundation-1-2', sectionId: 'sect-bpsc-foundation-1', courseId: 'bpsc-foundation', title: 'Strategic Reading of Newspapers', type: 'video', videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4', duration: '60 mins', durationSeconds: 3600, orderIndex: 2, isFree: 0, isPublished: 1 }
    ],
    users: [],
    sessions: [],
    otps: [],
    dynamicCurrentAffairEditions: [],
    youtubeVideos: [],
    youtubeSyncLogs: []
  };

  constructor() {
    this.loadLocalData();
  }

  private loadLocalData() {
    let loadedData: any = null;

    // 1. Try reading from persistent store
    if (fs.existsSync(JSON_DB_PATH)) {
      try {
        const raw = fs.readFileSync(JSON_DB_PATH, 'utf-8');
        loadedData = JSON.parse(raw);
        console.log('[DB Persistence] Successfully loaded database_store.json from persistent directory:', JSON_DB_PATH);
      } catch (e) {
        console.error('[DB Persistence] Failed reading persistent database_store.json:', e);
      }
    }

    // 2. Try reading from persistent backup store if primary failed
    if (!loadedData && fs.existsSync(JSON_DB_BACKUP_PATH)) {
      try {
        const raw = fs.readFileSync(JSON_DB_BACKUP_PATH, 'utf-8');
        loadedData = JSON.parse(raw);
        console.log('[DB Persistence] Restored database_store.json from persistent BACKUP:', JSON_DB_BACKUP_PATH);
      } catch (e) {
        console.error('[DB Persistence] Failed reading persistent backup database_store.json:', e);
      }
    }

    // 3. Fallback to local repository seed database_store.json if persistent file does not exist yet
    if (!loadedData && fs.existsSync(LOCAL_REPO_JSON_PATH)) {
      try {
        const raw = fs.readFileSync(LOCAL_REPO_JSON_PATH, 'utf-8');
        loadedData = JSON.parse(raw);
        console.log('[DB Persistence] Initialized persistent database_store.json from repository template.');
      } catch (e) {
        console.error('[DB Persistence] Failed reading local repo template database_store.json:', e);
      }
    }

    if (loadedData) {
      this.localStore = {
        ...this.localStore,
        ...loadedData
      };
    }

    if (!this.localStore.users || this.localStore.users.length === 0) {
      this.localStore.users = [...authLocalUsers];
    }
    if (!this.localStore.sessions) this.localStore.sessions = [];
    if (!this.localStore.otps) this.localStore.otps = [];
    if (!this.localStore.lmsQuizzes) this.localStore.lmsQuizzes = [];
    if (!this.localStore.lmsQuestions) this.localStore.lmsQuestions = [];
    if (!this.localStore.lmsAttempts) this.localStore.lmsAttempts = [];
    if (!this.localStore.lmsEnrollments) this.localStore.lmsEnrollments = [];

    // Sync memory arrays with persistent localStore
    lmsLocalQuizzes.length = 0;
    lmsLocalQuizzes.push(...this.localStore.lmsQuizzes);

    lmsLocalQuestions.length = 0;
    lmsLocalQuestions.push(...this.localStore.lmsQuestions);

    lmsLocalAttempts.length = 0;
    lmsLocalAttempts.push(...this.localStore.lmsAttempts);

    lmsLocalEnrollments.length = 0;
    lmsLocalEnrollments.push(...this.localStore.lmsEnrollments);

    // Save back to persistent storage immediately
    this.saveLocalData();
  }

  public saveLocalData() {
    try {
      this.localStore.lmsQuizzes = lmsLocalQuizzes;
      this.localStore.lmsQuestions = lmsLocalQuestions;
      this.localStore.lmsAttempts = lmsLocalAttempts;
      this.localStore.lmsEnrollments = lmsLocalEnrollments;

      const dataStr = JSON.stringify(this.localStore, null, 2);
      fs.writeFileSync(JSON_DB_PATH, dataStr, 'utf-8');
      fs.writeFileSync(JSON_DB_BACKUP_PATH, dataStr, 'utf-8');
      if (fs.existsSync(LOCAL_REPO_JSON_PATH)) {
        try { fs.writeFileSync(LOCAL_REPO_JSON_PATH, dataStr, 'utf-8'); } catch (_) {}
      }
    } catch (err) {
      console.error('[DB Persistence] Error saving persistent database_store.json:', err);
    }
  }

  public exportBackup(): any {
    return this.localStore;
  }

  public importBackup(data: any): boolean {
    if (!data || typeof data !== 'object') return false;
    this.localStore = {
      ...this.localStore,
      ...data
    };
    this.saveLocalData();
    return true;
  }

  // SETTINGS
  public async getSettings(): Promise<SiteSettings> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query('SELECT * FROM settings LIMIT 1');
        if (rows && rows.length > 0) {
          const row = rows[0];
          return {
            ...row,
            aboutMethodology: typeof row.aboutMethodology === 'string' ? JSON.parse(row.aboutMethodology) : (row.aboutMethodology || null),
            announcements: typeof row.announcements === 'string' ? JSON.parse(row.announcements) : (row.announcements || null),
            featureFlags: typeof row.featureFlags === 'string' ? JSON.parse(row.featureFlags) : (row.featureFlags || {})
          } as SiteSettings;
        }
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
          `INSERT INTO settings (id, heroTitle, heroSubtitle, tagline, heroImageUrl, contactTitle, contactSubtitle, contactAddress, contactPhone, contactEmail, contactHours, whatsappLink, telegramLink, googleMapUrl, aboutTitle, aboutSubtitle, aboutMission, aboutVision, aboutValues, aboutMethodology, announcements, featureFlags)
           VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           heroTitle = VALUES(heroTitle),
           heroSubtitle = VALUES(heroSubtitle),
           tagline = VALUES(tagline),
           heroImageUrl = VALUES(heroImageUrl),
           contactTitle = VALUES(contactTitle),
           contactSubtitle = VALUES(contactSubtitle),
           contactAddress = VALUES(contactAddress),
           contactPhone = VALUES(contactPhone),
           contactEmail = VALUES(contactEmail),
           contactHours = VALUES(contactHours),
           whatsappLink = VALUES(whatsappLink),
           telegramLink = VALUES(telegramLink),
           googleMapUrl = VALUES(googleMapUrl),
           aboutTitle = VALUES(aboutTitle),
           aboutSubtitle = VALUES(aboutSubtitle),
           aboutMission = VALUES(aboutMission),
           aboutVision = VALUES(aboutVision),
           aboutValues = VALUES(aboutValues),
           aboutMethodology = VALUES(aboutMethodology),
           announcements = VALUES(announcements),
           featureFlags = VALUES(featureFlags)`,
          [
            settings.heroTitle || '', settings.heroSubtitle || '', settings.tagline || '', settings.heroImageUrl || null,
            settings.contactTitle || null, settings.contactSubtitle || null, settings.contactAddress || null,
            settings.contactPhone || null, settings.contactEmail || null, settings.contactHours || null,
            settings.whatsappLink || null, settings.telegramLink || null, settings.googleMapUrl || null,
            settings.aboutTitle || null, settings.aboutSubtitle || null, settings.aboutMission || null,
            settings.aboutVision || null, settings.aboutValues || null,
            settings.aboutMethodology ? JSON.stringify(settings.aboutMethodology) : null,
            settings.announcements ? JSON.stringify(settings.announcements) : null,
            JSON.stringify(settings.featureFlags || {})
          ]
        );
        return true;
      } catch (err) {
        console.error('MySQL update error, using local fallback:', err);
      }
    }
    this.localStore.settings = {
      ...this.localStore.settings,
      ...settings
    };
    this.saveLocalData();
    return true;
  }

  public async getAndIncrementVisitorCount(): Promise<number> {
    if (mysqlPool) {
      try {
        await mysqlPool.query(
          'INSERT INTO settings (id, heroTitle, heroSubtitle, tagline, visitorsCount) VALUES (1, "", "", "", 1) ON DUPLICATE KEY UPDATE visitorsCount = visitorsCount + 1'
        );
        const [rows]: any = await mysqlPool.query('SELECT visitorsCount FROM settings WHERE id = 1');
        if (rows && rows.length > 0) return Number(rows[0].visitorsCount || 0);
      } catch (err) {
        console.error('[BackendDB] MySQL visitor count error, using local fallback:', err);
      }
    }
    const current = this.localStore.settings.visitorsCount || 0;
    const nextVal = current + 1;
    this.localStore.settings.visitorsCount = nextVal;
    this.saveLocalData();
    return nextVal;
  }

  // YOUTUBE INTEGRATION METHODS
  public async getYoutubeVideos(limit: number = 9, page: number = 1, search: string = ''): Promise<{ videos: any[], total: number }> {
    const offset = (page - 1) * limit;
    if (mysqlPool) {
      try {
        let query = 'SELECT * FROM youtube_videos';
        let countQuery = 'SELECT COUNT(*) as count FROM youtube_videos';
        const params: any[] = [];
        
        if (search) {
          query += ' WHERE title LIKE ? OR description LIKE ?';
          countQuery += ' WHERE title LIKE ? OR description LIKE ?';
          const searchParam = `%${search}%`;
          params.push(searchParam, searchParam);
        }
        
        query += ' ORDER BY publishedAt DESC LIMIT ? OFFSET ?';
        const queryParams = [...params, limit, offset];
        
        const [rows]: any = await mysqlPool.query(query, queryParams);
        const [countRows]: any = await mysqlPool.query(countQuery, params);
        const total = countRows[0]?.count || 0;
        
        return { videos: rows, total };
      } catch (err) {
        console.error('MySQL getYoutubeVideos error:', err);
      }
    }
    
    // Fallback to memory localStore
    if (!this.localStore.youtubeVideos) this.localStore.youtubeVideos = [];
    let filtered = this.localStore.youtubeVideos;
    if (search) {
      const kw = search.toLowerCase();
      filtered = filtered.filter(v => 
        v.title.toLowerCase().includes(kw) || 
        (v.description || '').toLowerCase().includes(kw)
      );
    }
    // Sort by publishedAt DESC
    filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    const total = filtered.length;
    const sliced = filtered.slice(offset, offset + limit);
    return { videos: sliced, total };
  }

  public async upsertYoutubeVideo(video: any): Promise<boolean> {
    const now = new Date().toISOString();
    if (mysqlPool) {
      try {
        await mysqlPool.query(`
          INSERT INTO youtube_videos (youtubeVideoId, title, description, thumbnail, duration, publishedAt, channelTitle, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            description = VALUES(description),
            thumbnail = VALUES(thumbnail),
            duration = VALUES(duration),
            publishedAt = VALUES(publishedAt),
            channelTitle = VALUES(channelTitle)
        `, [
          video.youtubeVideoId, video.title, video.description, video.thumbnail,
          video.duration, video.publishedAt, video.channelTitle, now
        ]);
        return true;
      } catch (err) {
        console.error('MySQL upsertYoutubeVideo error:', err);
      }
    }
    
    // Fallback
    if (!this.localStore.youtubeVideos) this.localStore.youtubeVideos = [];
    const idx = this.localStore.youtubeVideos.findIndex(v => v.youtubeVideoId === video.youtubeVideoId);
    if (idx >= 0) {
      this.localStore.youtubeVideos[idx] = { ...this.localStore.youtubeVideos[idx], ...video };
    } else {
      this.localStore.youtubeVideos.push({ ...video, createdAt: now });
    }
    this.saveLocalData();
    return true;
  }

  public async logYoutubeSync(videosSynced: number, status: string, error: string | null): Promise<boolean> {
    const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    if (mysqlPool) {
      try {
        await mysqlPool.query(`
          INSERT INTO youtube_sync_logs (syncTime, videosSynced, status, error)
          VALUES (?, ?, ?, ?)
        `, [now, videosSynced, status, error]);
        return true;
      } catch (err) {
        console.error('MySQL logYoutubeSync error:', err);
      }
    }
    // Fallback
    if (!this.localStore.youtubeSyncLogs) this.localStore.youtubeSyncLogs = [];
    this.localStore.youtubeSyncLogs.push({ syncTime: now, videosSynced, status, error });
    if (this.localStore.youtubeSyncLogs.length > 50) {
      this.localStore.youtubeSyncLogs.shift();
    }
    this.saveLocalData();
    return true;
  }

  public async getLastSyncLog(): Promise<any | null> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query('SELECT * FROM youtube_sync_logs ORDER BY id DESC LIMIT 1');
        if (rows && rows.length > 0) return rows[0];
        return null;
      } catch (err) {
        console.error('MySQL getLastSyncLog error:', err);
      }
    }
    if (!this.localStore.youtubeSyncLogs || this.localStore.youtubeSyncLogs.length === 0) return null;
    return this.localStore.youtubeSyncLogs[this.localStore.youtubeSyncLogs.length - 1];
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
        const [rows]: any = await mysqlPool.query('SELECT * FROM faculty');
        return rows.map((r: any) => ({
          ...r,
          demoLectures: typeof r.demoLectures === 'string' ? JSON.parse(r.demoLectures) : r.demoLectures || []
        }));
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
    let deletedInMySQL = false;
    if (mysqlPool) {
      try {
        const [result]: any = await mysqlPool.query('DELETE FROM faculty WHERE id = ? OR name = ?', [id, id]);
        deletedInMySQL = result.affectedRows > 0;
      } catch (err) {
        console.error('MySQL delete error, using local fallback:', err);
      }
    }
    const idx = this.localStore.faculty.findIndex(f => f.id === id || f.name === id);
    if (idx >= 0) {
      this.localStore.faculty.splice(idx, 1);
      this.saveLocalData();
      return true;
    }
    return deletedInMySQL;
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
          'UPDATE results SET name = ?, rank = ?, exam = ?, course = ?, service = ?, district = ?, photo = ?, year = ?, story = ? WHERE id = ? OR name = ?',
          [updated.name, updated.rank, updated.exam, updated.course, updated.service, updated.district, updated.photo, updated.year, updated.story, id, id]
        );
        return result.affectedRows > 0;
      } catch (err) {
        console.error('MySQL update error:', err);
      }
    }
    const idx = this.localStore.results.findIndex(r => r.id === id || r.name === id);
    if (idx >= 0) {
      this.localStore.results[idx] = updated;
      this.saveLocalData();
      return true;
    }
    return false;
  }

  public async deleteResult(id: string): Promise<boolean> {
    let deletedInMySQL = false;
    if (mysqlPool) {
      try {
        const [result]: any = await mysqlPool.query('DELETE FROM results WHERE id = ? OR name = ?', [id, id]);
        deletedInMySQL = result.affectedRows > 0;
      } catch (err) {
        console.error('MySQL delete error:', err);
      }
    }
    const idx = this.localStore.results.findIndex(r => r.id === id || r.name === id);
    if (idx >= 0) {
      this.localStore.results.splice(idx, 1);
      this.saveLocalData();
      return true;
    }
    return deletedInMySQL;
  }

  // ── TEST SERIES & EXAM HIERARCHY METHODS ────────────────────────────────────
  public async getExamsHierarchy(includeUnpublished: boolean = false): Promise<any[]> {
    if (mysqlPool) {
      try {
        const [examRows]: any = await mysqlPool.query(
          `SELECT e.id, e.name, e.code, e.slug, e.logoUrl, e.logoMediaId, e.description, e.hasStages, e.displayOrder, e.isActive,
                  m.storagePath AS logoStoragePath
           FROM Exam e
           LEFT JOIN Media m ON m.id = e.logoMediaId
           WHERE e.isActive = 1 ORDER BY e.displayOrder ASC`
        );
        const exams: any[] = [];
        for (const ex of examRows) {
          const [stageRows]: any = await mysqlPool.query(
            `SELECT * FROM ExamStageModel WHERE examId = ? AND isActive = 1 ORDER BY sortOrder ASC`,
            [ex.id]
          );
          
          let seriesQuery = `SELECT * FROM TestSeries WHERE examId = ?`;
          if (!includeUnpublished) seriesQuery += ` AND isPublished = 1`;
          seriesQuery += ` ORDER BY displayOrder ASC`;
          
          const [seriesRows]: any = await mysqlPool.query(seriesQuery, [ex.id]);

          const parsedSeries = seriesRows.map((s: any) => ({
            ...s,
            highlights: typeof s.highlights === 'string' ? JSON.parse(s.highlights) : s.highlights || [],
            syllabus: typeof s.syllabus === 'string' ? JSON.parse(s.syllabus) : s.syllabus || [],
            faq: typeof s.faq === 'string' ? JSON.parse(s.faq) : s.faq || []
          }));

          // Resolve the best logo URL: prefer direct logoUrl, fall back to DAM storagePath
          let rawLogo = ex.logoUrl || ex.logoStoragePath || null;
          if (rawLogo && typeof rawLogo === 'string') {
            rawLogo = rawLogo.trim().replace(/^uploads[\/\\]+/, '');
          }
          const resolvedLogoUrl = rawLogo
            ? (rawLogo.startsWith('http://') || rawLogo.startsWith('https://') || rawLogo.startsWith('/') ? rawLogo : `/uploads/${rawLogo}`)
            : null;

          exams.push({
            ...ex,
            logoUrl: resolvedLogoUrl,
            hasStages: !!ex.hasStages,
            stages: stageRows,
            testSeries: parsedSeries
          });
        }
        exams.sort((a, b) => (a.code || '').localeCompare(b.code || '', undefined, { numeric: true, sensitivity: 'base' }));
        return exams;
      } catch (err: any) {
        console.error('[BackendDB] getExamsHierarchy MySQL error:', err.message || err);
        // Retry query once on ECONNRESET / pool glitch before returning empty or fallback
        try {
          const [retryRows]: any = await mysqlPool.query(
            `SELECT e.id, e.name, e.code, e.slug, e.logoUrl, e.logoMediaId, e.description, e.hasStages, e.displayOrder, e.isActive,
                    m.storagePath AS logoStoragePath
             FROM Exam e
             LEFT JOIN Media m ON m.id = e.logoMediaId
             WHERE e.isActive = 1 ORDER BY e.displayOrder ASC`
          );
          const retryExams: any[] = [];
          for (const ex of retryRows) {
            const [stg]: any = await mysqlPool.query(`SELECT * FROM ExamStageModel WHERE examId = ? AND isActive = 1 ORDER BY sortOrder ASC`, [ex.id]);
            let sQuery = `SELECT * FROM TestSeries WHERE examId = ?`;
            if (!includeUnpublished) sQuery += ` AND isPublished = 1`;
            sQuery += ` ORDER BY displayOrder ASC`;
            const [sRows]: any = await mysqlPool.query(sQuery, [ex.id]);
            const parsed = sRows.map((s: any) => ({
              ...s,
              highlights: typeof s.highlights === 'string' ? JSON.parse(s.highlights) : s.highlights || [],
              syllabus: typeof s.syllabus === 'string' ? JSON.parse(s.syllabus) : s.syllabus || [],
              faq: typeof s.faq === 'string' ? JSON.parse(s.faq) : s.faq || []
            }));
            let rLogo = ex.logoUrl || ex.logoStoragePath || null;
            if (rLogo && typeof rLogo === 'string') rLogo = rLogo.trim().replace(/^uploads[\/\\]+/, '');
            retryExams.push({
              ...ex,
              logoUrl: rLogo ? (rLogo.startsWith('http') || rLogo.startsWith('/') ? rLogo : `/uploads/${rLogo}`) : null,
              hasStages: !!ex.hasStages,
              stages: stg,
              testSeries: parsed
            });
          }
          return retryExams;
        } catch (_) {}
      }
    }
    
    // Return empty array instead of dummy data when database is active
    return [];
  }

  public async getExamBySlug(slug: string): Promise<any | null> {
    const exams = await this.getExamsHierarchy(true);
    return exams.find((e: any) => e.slug.toLowerCase() === slug.toLowerCase() || e.id === slug) || null;
  }

  public async getTestSeriesBySlugOrId(identifier: string): Promise<any | null> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query(
          `SELECT * FROM TestSeries WHERE slug = ? OR id = ? LIMIT 1`,
          [identifier, identifier]
        );
        if (rows && rows.length > 0) {
          const s = rows[0];
          return {
            ...s,
            highlights: typeof s.highlights === 'string' ? JSON.parse(s.highlights) : s.highlights || [],
            syllabus: typeof s.syllabus === 'string' ? JSON.parse(s.syllabus) : s.syllabus || [],
            faq: typeof s.faq === 'string' ? JSON.parse(s.faq) : s.faq || []
          };
        }
      } catch (err) {
        console.error('[BackendDB] getTestSeriesBySlugOrId MySQL error:', err);
      }
    }
    const exams = await this.getExamsHierarchy(true);
    for (const ex of exams) {
      const found = (ex.testSeries || []).find((s: any) => s.slug === identifier || s.id === identifier);
      if (found) return found;
    }
    return null;
  }

  public async saveTestSeriesRecord(item: any): Promise<any> {
    const now = new Date().toISOString();
    const id = item.id || `ts-${Date.now()}`;
    const slug = item.slug || item.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    
    if (mysqlPool) {
      try {
        await mysqlPool.query(
          `INSERT INTO TestSeries (
            id, examId, stageId, title, slug, category, language, status, thumbnailUrl, bannerUrl,
            price, discountedPrice, totalTests, totalQuestions, duration, description, highlights, syllabus, faq,
            batchStartDate, enrolledCount, validityDays, isPublished, displayOrder, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          ON DUPLICATE KEY UPDATE
            examId = VALUES(examId),
            stageId = VALUES(stageId),
            title = VALUES(title),
            slug = VALUES(slug),
            category = VALUES(category),
            language = VALUES(language),
            status = VALUES(status),
            thumbnailUrl = VALUES(thumbnailUrl),
            bannerUrl = VALUES(bannerUrl),
            price = VALUES(price),
            discountedPrice = VALUES(discountedPrice),
            totalTests = VALUES(totalTests),
            totalQuestions = VALUES(totalQuestions),
            duration = VALUES(duration),
            description = VALUES(description),
            highlights = VALUES(highlights),
            syllabus = VALUES(syllabus),
            faq = VALUES(faq),
            batchStartDate = VALUES(batchStartDate),
            enrolledCount = VALUES(enrolledCount),
            validityDays = VALUES(validityDays),
            isPublished = VALUES(isPublished),
            displayOrder = VALUES(displayOrder),
            updatedAt = NOW()`,
          [
            id, item.examId, item.stageId || null, item.title, slug, item.category || null, item.language || 'Bilingual (Hindi & English)',
            item.status || 'active', item.thumbnailUrl || null, item.bannerUrl || null, Number(item.price) || 0,
            item.discountedPrice ? Number(item.discountedPrice) : null, Number(item.totalTests) || 0, Number(item.totalQuestions) || 0,
            item.duration || '6 Months Validity', item.description || null, JSON.stringify(item.highlights || []),
            JSON.stringify(item.syllabus || []), JSON.stringify(item.faq || []), item.batchStartDate || null,
            Number(item.enrolledCount) || 0, Number(item.validityDays) || 180, item.isPublished !== false ? 1 : 0, Number(item.displayOrder) || 1
          ]
        );
        return { ...item, id, slug };
      } catch (err) {
        console.error('[BackendDB] saveTestSeriesRecord MySQL error:', err);
      }
    }

    // Local fallback
    if (!this.localStore.exams) this.seedInitialExamsStore();
    return { ...item, id, slug };
  }

  public async deleteTestSeriesRecord(id: string): Promise<boolean> {
    if (mysqlPool) {
      try {
        const [result]: any = await mysqlPool.query('DELETE FROM TestSeries WHERE id = ? OR slug = ?', [id, id]);
        return result.affectedRows > 0;
      } catch (err) {
        console.error('[BackendDB] deleteTestSeriesRecord MySQL error:', err);
      }
    }
    return true;
  }

  public async saveExamRecord(item: any): Promise<any> {
    if (mysqlPool) {
      try {
        await mysqlPool.query(
          `UPDATE Exam SET 
            name = ?,
            code = ?,
            logoUrl = ?,
            description = ?,
            hasStages = ?,
            displayOrder = ?,
            updatedAt = NOW()
           WHERE id = ? OR slug = ? OR code = ?`,
          [
            item.name, item.code, item.logoUrl || null, item.description || null,
            item.hasStages ? 1 : 0, Number(item.displayOrder) || 1,
            item.id, item.slug || item.id, item.code || item.id
          ]
        );
        return item;
      } catch (err) {
        console.error('[BackendDB] saveExamRecord MySQL error:', err);
      }
    }
    // Update local store fallback
    if (this.localStore.exams) {
      const ex = this.localStore.exams.find((e: any) => e.id === item.id || e.slug === item.slug || e.code === item.code);
      if (ex) {
        ex.logoUrl = item.logoUrl;
        if (item.name) ex.name = item.name;
        if (item.code) ex.code = item.code;
        if (item.description) ex.description = item.description;
      }
    }
    return item;
  }

  private seedInitialExamsStore() {
    this.localStore.exams = [
      {
        id: 'exam-bpsc',
        name: 'BPSC',
        code: 'BPSC',
        slug: 'bpsc',
        description: 'Bihar Public Service Commission Civil Services Examination',
        hasStages: true,
        displayOrder: 1,
        isActive: true,
        stages: [
          { id: 'stage-bpsc-prelims', examId: 'exam-bpsc', name: 'Prelims', slug: 'prelims', sortOrder: 1, isActive: true },
          { id: 'stage-bpsc-mains', examId: 'exam-bpsc', name: 'Mains', slug: 'mains', sortOrder: 2, isActive: true }
        ],
        testSeries: [
          {
            id: 'bpsc-71st-prelims-mock-vault',
            examId: 'exam-bpsc',
            stageId: 'stage-bpsc-prelims',
            title: '71st All India Standard Test Series 2025-26',
            slug: 'bpsc-71st-prelims-mock-vault',
            category: 'Prelims',
            language: 'Bilingual (Hindi & English)',
            status: 'active',
            price: 4999,
            discountedPrice: 2499,
            totalTests: 45,
            totalQuestions: 6750,
            duration: '6 Months Validity',
            description: 'Comprehensive 45-Test Series engineered strictly according to the latest BPSC micro-pattern.',
            highlights: ['20 Micro Sectional Tests', '10 Bihar Special Exclusive Mock Tests', '15 Full Length Grand Mock Papers'],
            syllabus: [{ subject: 'General Studies & Bihar Special', topics: ['History of Bihar', 'Geography & Polity'] }],
            faq: [{ q: 'Can I attempt tests anytime?', a: 'Yes, tests are accessible 24/7 once unlocked.' }],
            isPublished: true,
            displayOrder: 1
          },
          {
            id: 'bpsc-70th-mains-evaluator-workbench',
            examId: 'exam-bpsc',
            stageId: 'stage-bpsc-mains',
            title: '70th Daily Answer Evaluation & Grand Mock Series',
            slug: 'bpsc-70th-mains-evaluator-workbench',
            category: 'Mains',
            language: 'Bilingual (Hindi & English)',
            status: 'active',
            price: 8999,
            discountedPrice: 4499,
            totalTests: 24,
            totalQuestions: 192,
            duration: 'Until Mains Exam',
            description: 'Expert evaluation by selected BPSC officers within 48 hours for GS Paper I, GS Paper II, Essay paper.',
            highlights: ['8 Full Length GS Paper I Mocks', '8 Full Length GS Paper II Mocks', '4 Dedicated Essay Paper Mocks'],
            syllabus: [{ subject: 'GS Paper I & II', topics: ['Modern History & Culture', 'Polity & Economy'] }],
            faq: [{ q: 'How do I submit answers?', a: 'Upload photos/scans of handwritten answer sheets.' }],
            isPublished: true,
            displayOrder: 2
          }
        ]
      },
      {
        id: 'exam-appsc',
        name: 'APPSC',
        code: 'APPSC',
        slug: 'appsc',
        description: 'Arunachal Pradesh Public Service Commission Combined Competitive Examination',
        hasStages: true,
        displayOrder: 2,
        isActive: true,
        stages: [
          { id: 'stage-appsc-prelims', examId: 'exam-appsc', name: 'Prelims', slug: 'prelims', sortOrder: 1, isActive: true },
          { id: 'stage-appsc-mains', examId: 'exam-appsc', name: 'Mains', slug: 'mains', sortOrder: 2, isActive: true }
        ],
        testSeries: [
          {
            id: 'appsc-cee-prelims-standard',
            examId: 'exam-appsc',
            stageId: 'stage-appsc-prelims',
            title: 'CEE Prelims GS & CSAT Standard Mock Series',
            slug: 'appsc-cee-prelims-standard',
            category: 'Prelims',
            language: 'English',
            status: 'active',
            price: 3999,
            discountedPrice: 1999,
            totalTests: 25,
            totalQuestions: 3750,
            duration: '6 Months Validity',
            description: 'Targeted test series for APPSC CEE General Studies Paper I and CSAT Paper II.',
            highlights: ['15 Sectional Tests', '10 Full Length Mock Papers', 'State Specific GS Special Modules'],
            syllabus: [{ subject: 'General Studies Paper I', topics: ['History & Geography of Arunachal Pradesh', 'Indian Polity'] }],
            faq: [{ q: 'Are video solutions provided?', a: 'Yes, detailed solution booklets are provided.' }],
            isPublished: true,
            displayOrder: 1
          }
        ]
      },
      {
        id: 'exam-apssb',
        name: 'APSSB',
        code: 'APSSB',
        slug: 'apssb',
        description: 'Arunachal Pradesh Staff Selection Board Combined Examinations',
        hasStages: false,
        displayOrder: 3,
        isActive: true,
        stages: [],
        testSeries: [
          {
            id: 'apssb-combined-mock-vault',
            examId: 'exam-apssb',
            stageId: null,
            title: 'General Combined Recruitment Practice Series 2025',
            slug: 'apssb-combined-mock-vault',
            category: null,
            language: 'English',
            status: 'active',
            price: 1999,
            discountedPrice: 999,
            totalTests: 30,
            totalQuestions: 4500,
            duration: '1 Year Validity',
            description: 'Comprehensive practice tests for APSSB CGL, CHSL, and General Officers competitive exams.',
            highlights: ['Full Mock Tests', 'General Knowledge & English Language Practice', 'Instant Automated CBT Scorecard'],
            syllabus: [{ subject: 'General Knowledge & English', topics: ['General Awareness', 'Basic Mathematics & Reasoning'] }],
            faq: [{ q: 'Is this test series bilingual?', a: 'Tests are in English medium.' }],
            isPublished: true,
            displayOrder: 1
          }
        ]
      }
    ];
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
          'INSERT INTO current_affairs (id, title, category, publishDate, summary, content, relevance, context, analysis, wayForward, practiceQuestion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            item.id, item.title, item.category, item.publishDate, item.summary, item.content,
            item.relevance ?? null, item.context ?? null, item.analysis ?? null, item.wayForward ?? null, item.practiceQuestion ?? null
          ]
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
          'UPDATE current_affairs SET title = ?, category = ?, publishDate = ?, summary = ?, content = ?, relevance = ?, context = ?, analysis = ?, wayForward = ?, practiceQuestion = ? WHERE id = ?',
          [
            updated.title, updated.category, updated.publishDate, updated.summary, updated.content,
            updated.relevance ?? null, updated.context ?? null, updated.analysis ?? null, updated.wayForward ?? null, updated.practiceQuestion ?? null, id
          ]
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

  // DYNAMIC CURRENT AFFAIRS SYSTEM METHODS
  private editionsCache: { data: DynamicCurrentAffairEdition[]; timestamp: number; includeDrafts: boolean } | null = null;

  public async getDynamicCurrentAffairsEditions(includeDrafts: boolean = false): Promise<DynamicCurrentAffairEdition[]> {
    if (this.editionsCache && this.editionsCache.includeDrafts === includeDrafts && (Date.now() - this.editionsCache.timestamp < 60000)) {
      return this.editionsCache.data;
    }

    let resultEditions: DynamicCurrentAffairEdition[] = [];

    if (mysqlPool) {
      try {
        // 1. Fetch all editions in one query
        const [editionsRows]: any = await mysqlPool.query('SELECT * FROM current_affair_editions ORDER BY publishDate DESC');
        if (!editionsRows || editionsRows.length === 0) {
          resultEditions = [];
        } else {
          const statusFilter = includeDrafts ? '' : "AND publishStatus = 'PUBLISHED'";
          const editionIds = editionsRows.map((e: any) => e.id);

          // 2. Bulk-fetch ALL articles for all editions in ONE query
          const [allArticlesRows]: any = await mysqlPool.query(
            `SELECT * FROM current_affair_articles WHERE editionId IN (?) ${statusFilter} ORDER BY createdAt DESC`,
            [editionIds]
          );

          if (!allArticlesRows || allArticlesRows.length === 0) {
            resultEditions = editionsRows.map((edRow: any) => ({ ...edRow, articles: [] }));
          } else {
            const articleIds = allArticlesRows.map((a: any) => a.id);
            const seoIds = allArticlesRows.map((a: any) => a.seoId).filter(Boolean);

            // 3. Bulk-fetch ALL related data in parallel (5 queries total instead of N*5)
            const [seoRowsAll, subRowsAll, exRowsAll, tagRowsAll, medRowsAll]: any[] = await Promise.all([
              seoIds.length > 0
                ? mysqlPool.query('SELECT * FROM current_affair_seo WHERE id IN (?)', [seoIds]).then(([r]: any) => r)
                : Promise.resolve([]),
              mysqlPool.query(
                'SELECT asub.articleId, s.name FROM current_affair_subjects s JOIN current_affair_article_subjects asub ON s.id = asub.subjectId WHERE asub.articleId IN (?)',
                [articleIds]
              ).then(([r]: any) => r),
              mysqlPool.query(
                'SELECT aex.articleId, e.name FROM current_affair_exams e JOIN current_affair_article_exams aex ON e.id = aex.examId WHERE aex.articleId IN (?)',
                [articleIds]
              ).then(([r]: any) => r),
              mysqlPool.query(
                'SELECT atg.articleId, t.name FROM current_affair_tags t JOIN current_affair_article_tags atg ON t.id = atg.tagId WHERE atg.articleId IN (?)',
                [articleIds]
              ).then(([r]: any) => r),
              mysqlPool.query(
                'SELECT articleId, type, url FROM current_affair_media WHERE articleId IN (?)',
                [articleIds]
              ).then(([r]: any) => r)
            ]);

            // 4. Build lookup maps for O(1) access
            const seoMap = new Map((seoRowsAll as any[]).map((s: any) => [s.id, s]));
            const subMap = new Map<string, string[]>();
            const exMap = new Map<string, string[]>();
            const tagMap = new Map<string, string[]>();
            const medMap = new Map<string, { type: string; url: string }[]>();

            for (const row of (subRowsAll as any[])) {
              if (!subMap.has(row.articleId)) subMap.set(row.articleId, []);
              subMap.get(row.articleId)!.push(row.name);
            }
            for (const row of (exRowsAll as any[])) {
              if (!exMap.has(row.articleId)) exMap.set(row.articleId, []);
              exMap.get(row.articleId)!.push(row.name);
            }
            for (const row of (tagRowsAll as any[])) {
              if (!tagMap.has(row.articleId)) tagMap.set(row.articleId, []);
              tagMap.get(row.articleId)!.push(row.name);
            }
            for (const row of (medRowsAll as any[])) {
              if (!medMap.has(row.articleId)) medMap.set(row.articleId, []);
              medMap.get(row.articleId)!.push({ type: row.type, url: row.url });
            }

            // 5. Group articles by editionId using lookup maps
            const articlesByEdition = new Map<string, DynamicCurrentAffairArticle[]>();
            for (const artRow of (allArticlesRows as any[])) {
              const articleData: DynamicCurrentAffairArticle = {
                ...artRow,
                seo: artRow.seoId ? (seoMap.get(artRow.seoId) || {}) : {},
                media: medMap.get(artRow.id) || [],
                subjects: subMap.get(artRow.id) || [],
                exams: exMap.get(artRow.id) || [],
                tags: tagMap.get(artRow.id) || []
              };
              if (!articlesByEdition.has(artRow.editionId)) articlesByEdition.set(artRow.editionId, []);
              articlesByEdition.get(artRow.editionId)!.push(articleData);
            }

            // 6. Assemble final editions
            resultEditions = editionsRows.map((edRow: any) => ({
              ...edRow,
              articles: articlesByEdition.get(edRow.id) || []
            }));
          }
        }
      } catch (err) {
        console.error('[BackendDB] getDynamicCurrentAffairsEditions error:', err);
      }
    } else {
      // Local Store Fallback
      const storeEditions = this.localStore.dynamicCurrentAffairEditions || [];
      if (includeDrafts) {
        resultEditions = storeEditions;
      } else {
        resultEditions = storeEditions.map(ed => ({
          ...ed,
          articles: (ed.articles || []).filter(a => a.publishStatus === 'PUBLISHED')
        })).filter(ed => (ed.articles || []).length > 0);
      }
    }

    this.editionsCache = { data: resultEditions, timestamp: Date.now(), includeDrafts };
    return resultEditions;
  }

  public async getDynamicCurrentAffairsEditionByDate(date: string, includeDrafts: boolean = false): Promise<DynamicCurrentAffairEdition | null> {
    const editions = await this.getDynamicCurrentAffairsEditions(includeDrafts);
    return editions.find(e => e.publishDate === date) || null;
  }

  public async getDynamicCurrentAffairArticle(slug: string, includeDrafts: boolean = false): Promise<DynamicCurrentAffairArticle | null> {
    const editions = await this.getDynamicCurrentAffairsEditions(includeDrafts);
    for (const ed of editions) {
      if (ed.articles) {
        const found = ed.articles.find(a => a.slug === slug);
        if (found) return found;
      }
    }
    return null;
  }

  public async createOrUpdateDynamicCurrentAffairEdition(edition: DynamicCurrentAffairEdition): Promise<boolean> {
    const timestamp = new Date().toISOString();
    const edId = edition.id || `edition-${Date.now()}`;
    const edDate = edition.publishDate; // YYYY-MM-DD
    
    if (mysqlPool) {
      const conn = await mysqlPool.getConnection();
      try {
        await conn.beginTransaction();
        
        // 1. Insert or update edition
        await conn.query(
          'INSERT INTO current_affair_editions (id, publishDate, summary, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE summary = ?, updatedAt = ?',
          [edId, edDate, edition.summary ?? null, timestamp, timestamp, edition.summary ?? null, timestamp]
        );
        
        if (edition.articles) {
          for (const art of edition.articles) {
            const artId = art.id || `art-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            const artSlug = art.slug || `${edDate}-${art.category.toLowerCase()}-${art.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
            
            // 2. SEO
            let seoId = null;
            if (art.seo) {
              seoId = art.seo.id || `seo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
              await conn.query(
                'INSERT INTO current_affair_seo (id, canonicalUrl, seoTitle, seoDescription, seoKeywords) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE canonicalUrl = ?, seoTitle = ?, seoDescription = ?, seoKeywords = ?',
                [seoId, art.seo.canonicalUrl ?? null, art.seo.seoTitle ?? null, art.seo.seoDescription ?? null, art.seo.seoKeywords ?? null, art.seo.canonicalUrl ?? null, art.seo.seoTitle ?? null, art.seo.seoDescription ?? null, art.seo.seoKeywords ?? null]
              );
            }
            
            // 3. Article
            await conn.query(
              `INSERT INTO current_affair_articles (
                id, slug, title, summary, category, publishStatus, publishedDate, readingTime, importance,
                whyInNews, context, background, keyHighlights, importantFacts, examRelevance, previousContext, wayForward, keyTakeaways,
                editionId, seoId, content, createdAt, updatedAt
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE
                title = ?, summary = ?, category = ?, publishStatus = ?, publishedDate = ?, readingTime = ?, importance = ?,
                whyInNews = ?, context = ?, background = ?, keyHighlights = ?, importantFacts = ?, examRelevance = ?, previousContext = ?, wayForward = ?, keyTakeaways = ?,
                seoId = ?, content = ?, updatedAt = ?`,
              [
                artId, artSlug, art.title, art.summary, art.category, art.publishStatus, art.publishedDate || edDate, art.readingTime, art.importance,
                art.whyInNews ?? null, art.context ?? null, art.background ?? null, art.keyHighlights ?? null, art.importantFacts ?? null, art.examRelevance ?? null, art.previousContext ?? null, art.wayForward ?? null, art.keyTakeaways ?? null,
                edId, seoId, art.content ?? null, timestamp, timestamp,
                art.title, art.summary, art.category, art.publishStatus, art.publishedDate || edDate, art.readingTime, art.importance,
                art.whyInNews ?? null, art.context ?? null, art.background ?? null, art.keyHighlights ?? null, art.importantFacts ?? null, art.examRelevance ?? null, art.previousContext ?? null, art.wayForward ?? null, art.keyTakeaways ?? null,
                seoId, art.content ?? null, timestamp
              ]
            );
            
            // Clear joins
            await conn.query('DELETE FROM current_affair_article_subjects WHERE articleId = ?', [artId]);
            await conn.query('DELETE FROM current_affair_article_exams WHERE articleId = ?', [artId]);
            await conn.query('DELETE FROM current_affair_article_tags WHERE articleId = ?', [artId]);
            await conn.query('DELETE FROM current_affair_media WHERE articleId = ?', [artId]);
            
            // Re-insert subjects
            if (art.subjects) {
              for (const subName of art.subjects) {
                const subId = `sub-${subName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
                await conn.query('INSERT IGNORE INTO current_affair_subjects (id, name) VALUES (?, ?)', [subId, subName]);
                const [subRow]: any = await conn.query('SELECT id FROM current_affair_subjects WHERE name = ?', [subName]);
                if (subRow.length > 0) {
                  await conn.query('INSERT IGNORE INTO current_affair_article_subjects (articleId, subjectId) VALUES (?, ?)', [artId, subRow[0].id]);
                }
              }
            }
            
            // Re-insert exams
            if (art.exams) {
              for (const exName of art.exams) {
                const exId = `ex-${exName.toLowerCase()}`;
                await conn.query('INSERT IGNORE INTO current_affair_exams (id, name) VALUES (?, ?)', [exId, exName]);
                const [exRow]: any = await conn.query('SELECT id FROM current_affair_exams WHERE name = ?', [exName]);
                if (exRow.length > 0) {
                  await conn.query('INSERT IGNORE INTO current_affair_article_exams (articleId, examId) VALUES (?, ?)', [artId, exRow[0].id]);
                }
              }
            }
            
            // Re-insert tags
            if (art.tags) {
              for (const tagName of art.tags) {
                const tagId = `tag-${tagName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
                await conn.query('INSERT IGNORE INTO current_affair_tags (id, name) VALUES (?, ?)', [tagId, tagName]);
                const [tagRow]: any = await conn.query('SELECT id FROM current_affair_tags WHERE name = ?', [tagName]);
                if (tagRow.length > 0) {
                  await conn.query('INSERT IGNORE INTO current_affair_article_tags (articleId, tagId) VALUES (?, ?)', [artId, tagRow[0].id]);
                }
              }
            }
            
            // Re-insert media
            if (art.media) {
              for (const med of art.media) {
                const medId = med.id || `med-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                await conn.query('INSERT INTO current_affair_media (id, type, url, articleId) VALUES (?, ?, ?, ?)', [medId, med.type, med.url, artId]);
              }
            }
          }
        }
        
        await conn.commit();
        conn.release();
        return true;
      } catch (err) {
        await conn.rollback();
        conn.release();
        console.error('[BackendDB] createOrUpdateDynamicCurrentAffairEdition error:', err);
      }
    }
    
    // Local fallback
    if (!this.localStore.dynamicCurrentAffairEditions) this.localStore.dynamicCurrentAffairEditions = [];
    const editions = this.localStore.dynamicCurrentAffairEditions;
    
    const existingEdIdx = editions.findIndex(e => e.id === edId || e.publishDate === edDate);
    
    const newArticles = (edition.articles || []).map(art => {
      const artId = art.id || `art-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const artSlug = art.slug || `${edDate}-${art.category.toLowerCase()}-${art.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      return {
        ...art,
        id: artId,
        slug: artSlug,
        editionId: edId,
        createdAt: art.createdAt || timestamp,
        updatedAt: timestamp
      };
    });
    
    const nextEd: DynamicCurrentAffairEdition = {
      ...edition,
      id: edId,
      publishDate: edDate,
      articles: newArticles,
      createdAt: edition.createdAt || timestamp,
      updatedAt: timestamp
    };
    
    if (existingEdIdx >= 0) {
      editions[existingEdIdx] = nextEd;
    } else {
      editions.unshift(nextEd);
    }
    
    this.editionsCache = null;
    this.saveLocalData();
    return true;
  }

  public async deleteDynamicCurrentAffairArticle(id: string): Promise<boolean> {
    if (mysqlPool) {
      try {
        const [result]: any = await mysqlPool.query('DELETE FROM current_affair_articles WHERE id = ?', [id]);
        return result.affectedRows > 0;
      } catch (err) {
        console.error('[BackendDB] deleteDynamicCurrentAffairArticle error:', err);
      }
    }
    
    const editions = this.localStore.dynamicCurrentAffairEditions || [];
    for (const ed of editions) {
      if (ed.articles) {
        const idx = ed.articles.findIndex(a => a.id === id);
        if (idx >= 0) {
          ed.articles.splice(idx, 1);
          this.saveLocalData();
          return true;
        }
      }
    }
    return false;
  }

  public async deleteDynamicCurrentAffairEdition(id: string): Promise<boolean> {
    if (mysqlPool) {
      try {
        const [result]: any = await mysqlPool.query('DELETE FROM current_affair_editions WHERE id = ?', [id]);
        return result.affectedRows > 0;
      } catch (err) {
        console.error('[BackendDB] deleteDynamicCurrentAffairEdition error:', err);
      }
    }
    
    const editions = this.localStore.dynamicCurrentAffairEditions || [];
    const idx = editions.findIndex(e => e.id === id);
    if (idx >= 0) {
      editions.splice(idx, 1);
      this.saveLocalData();
      return true;
    }
    return false;
  }

  public async getDynamicCurrentAffairsSearch(params: {
    keyword?: string;
    category?: string;
    subject?: string;
    exam?: string;
    month?: string;
    year?: string;
    date?: string;
    tag?: string;
  }): Promise<DynamicCurrentAffairArticle[]> {
    const editions = await this.getDynamicCurrentAffairsEditions(false);
    let allArticles: DynamicCurrentAffairArticle[] = [];
    for (const ed of editions) {
      if (ed.articles) {
        allArticles.push(...ed.articles);
      }
    }
    
    return allArticles.filter(art => {
      if (params.keyword) {
        const kw = params.keyword.toLowerCase();
        const matchesTitle = art.title.toLowerCase().includes(kw);
        const matchesSummary = art.summary.toLowerCase().includes(kw);
        const matchesContent = (art.content || '').toLowerCase().includes(kw);
        const matchesWhy = (art.whyInNews || '').toLowerCase().includes(kw);
        const matchesHighlights = (art.keyHighlights || '').toLowerCase().includes(kw);
        if (!matchesTitle && !matchesSummary && !matchesContent && !matchesWhy && !matchesHighlights) return false;
      }
      
      if (params.category && params.category !== 'All') {
        if (art.category.toUpperCase() !== params.category.toUpperCase()) return false;
      }
      
      if (params.subject && params.subject !== 'All') {
        if (!art.subjects || !art.subjects.includes(params.subject)) return false;
      }
      
      if (params.exam && params.exam !== 'All') {
        if (!art.exams || !art.exams.includes(params.exam)) return false;
      }
      
      if (params.date) {
        if (art.publishedDate !== params.date) return false;
      }
      
      if (params.month) {
        const monthsMap: Record<string, string> = {
          january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
          july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
        };
        const targetMonth = monthsMap[params.month.toLowerCase()];
        if (targetMonth) {
          const parts = art.publishedDate.split('-');
          if (parts[1] !== targetMonth) return false;
        }
      }
      
      if (params.year) {
        const parts = art.publishedDate.split('-');
        if (parts[0] !== params.year) return false;
      }
      
      if (params.tag) {
        if (!art.tags || !art.tags.map(t => t.toLowerCase()).includes(params.tag.toLowerCase())) return false;
      }
      
      return true;
    });
  }

  // ── CURRENT AFFAIRS AGGREGATION & COMPILATIONS ─────────────────────────────

  private async initCompilationsTable() {
    if (mysqlPool) {
      try {
        await mysqlPool.query(`
          CREATE TABLE IF NOT EXISTS current_affair_compilations (
            id VARCHAR(255) PRIMARY KEY,
            type VARCHAR(50) NOT NULL,
            periodKey VARCHAR(100) NOT NULL,
            title VARCHAR(255) NOT NULL,
            fromDate VARCHAR(20) NOT NULL,
            toDate VARCHAR(20) NOT NULL,
            articleIds JSON NOT NULL,
            articleCount INT NOT NULL,
            categoryStats JSON NOT NULL,
            availableMonths JSON,
            missingMonths JSON,
            publishStatus VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED',
            createdAt VARCHAR(50) NOT NULL,
            updatedAt VARCHAR(50) NOT NULL
          )
        `);
      } catch (err) {
        console.error('[BackendDB] initCompilationsTable MySQL error:', err);
      }
    }
  }

  public async getCompilations(type?: string): Promise<CurrentAffairCompilation[]> {
    await this.initCompilationsTable();
    if (mysqlPool) {
      try {
        let query = 'SELECT * FROM current_affair_compilations';
        const params: any[] = [];
        if (type) {
          query += ' WHERE type = ?';
          params.push(type.toUpperCase());
        }
        query += ' ORDER BY fromDate DESC';
        const [rows]: any = await mysqlPool.query(query, params);
        return rows.map((r: any) => ({
          ...r,
          articleIds: typeof r.articleIds === 'string' ? JSON.parse(r.articleIds) : (r.articleIds || []),
          categoryStats: typeof r.categoryStats === 'string' ? JSON.parse(r.categoryStats) : (r.categoryStats || {}),
          availableMonths: typeof r.availableMonths === 'string' ? JSON.parse(r.availableMonths) : (r.availableMonths || []),
          missingMonths: typeof r.missingMonths === 'string' ? JSON.parse(r.missingMonths) : (r.missingMonths || [])
        }));
      } catch (err) {
        console.error('[BackendDB] getCompilations MySQL error:', err);
      }
    }
    const store: CurrentAffairCompilation[] = (this.localStore as any).dynamicCurrentAffairCompilations || [];
    if (!type) return store;
    return store.filter(c => c.type.toUpperCase() === type.toUpperCase());
  }

  public async getCompilationByKey(key: string): Promise<CurrentAffairCompilation | null> {
    const list = await this.getCompilations();
    return list.find(c => c.id === key || c.periodKey === key) || null;
  }

  private async getPublishedArticlesInRange(fromDate: string, toDate: string): Promise<DynamicCurrentAffairArticle[]> {
    const editions = await this.getDynamicCurrentAffairsEditions(false);
    const sortedEditions = editions
      .filter(ed => ed.publishDate >= fromDate && ed.publishDate <= toDate)
      .sort((a, b) => a.publishDate.localeCompare(b.publishDate));

    const articles: DynamicCurrentAffairArticle[] = [];
    for (const ed of sortedEditions) {
      if (ed.articles) {
        for (const art of ed.articles) {
          if (art.publishStatus === 'PUBLISHED') {
            articles.push(art);
          }
        }
      }
    }
    return articles;
  }

  private async saveCompilationRecord(record: CurrentAffairCompilation) {
    await this.initCompilationsTable();
    if (mysqlPool) {
      try {
        await mysqlPool.query(
          `INSERT INTO current_affair_compilations
             (id, type, periodKey, title, fromDate, toDate, articleIds, articleCount, categoryStats, availableMonths, missingMonths, publishStatus, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             title = VALUES(title),
             fromDate = VALUES(fromDate),
             toDate = VALUES(toDate),
             articleIds = VALUES(articleIds),
             articleCount = VALUES(articleCount),
             categoryStats = VALUES(categoryStats),
             availableMonths = VALUES(availableMonths),
             missingMonths = VALUES(missingMonths),
             publishStatus = VALUES(publishStatus),
             updatedAt = VALUES(updatedAt)`,
          [
            record.id,
            record.type,
            record.periodKey,
            record.title,
            record.fromDate,
            record.toDate,
            JSON.stringify(record.articleIds),
            record.articleCount,
            JSON.stringify(record.categoryStats),
            JSON.stringify(record.availableMonths || []),
            JSON.stringify(record.missingMonths || []),
            record.publishStatus,
            record.createdAt,
            record.updatedAt
          ]
        );
        return;
      } catch (err) {
        console.error('[BackendDB] saveCompilationRecord MySQL error:', err);
      }
    }

    if (!(this.localStore as any).dynamicCurrentAffairCompilations) {
      (this.localStore as any).dynamicCurrentAffairCompilations = [];
    }
    const store = (this.localStore as any).dynamicCurrentAffairCompilations;
    const idx = store.findIndex((c: any) => c.id === record.id);
    if (idx >= 0) {
      store[idx] = record;
    } else {
      store.push(record);
    }
    this.saveLocalData();
  }

  public async previewCombineWeekly(fromDate: string, toDate: string) {
    if (!fromDate || !toDate) throw new Error('From Date and To Date are required.');
    if (fromDate > toDate) throw new Error('From Date cannot be later than To Date.');

    const articles = await this.getPublishedArticlesInRange(fromDate, toDate);
    const categoryStats: Record<string, number> = {};
    for (const art of articles) {
      const cat = (art.category || 'OTHER').toUpperCase();
      categoryStats[cat] = (categoryStats[cat] || 0) + 1;
    }

    const key = `weekly-${fromDate}-to-${toDate}`;
    const existing = await this.getCompilationByKey(key);

    return {
      type: 'WEEKLY',
      periodKey: `W-${fromDate}-to-${toDate}`,
      compilationId: key,
      fromDate,
      toDate,
      articleCount: articles.length,
      categoryStats,
      articleIds: articles.map(a => a.id),
      articlesPreview: articles.map(a => ({ id: a.id, title: a.title, category: a.category, publishedDate: a.publishedDate })),
      isUpdate: Boolean(existing),
      existingTitle: existing?.title || null
    };
  }

  public async combineWeekly(fromDate: string, toDate: string) {
    const preview = await this.previewCombineWeekly(fromDate, toDate);
    if (preview.articleCount === 0) {
      throw new Error(`No published daily articles found between ${fromDate} and ${toDate}. Cannot create an empty compilation.`);
    }

    const key = preview.compilationId;
    const title = `Weekly Current Affairs (${fromDate} – ${toDate})`;
    const timestamp = new Date().toISOString();

    const record: CurrentAffairCompilation = {
      id: key,
      type: 'WEEKLY',
      periodKey: preview.periodKey,
      title,
      fromDate,
      toDate,
      articleIds: preview.articleIds,
      articleCount: preview.articleCount,
      categoryStats: preview.categoryStats,
      publishStatus: 'PUBLISHED',
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await this.saveCompilationRecord(record);
    return { success: true, isUpdate: preview.isUpdate, compilation: record };
  }

  public async previewCombineMonthly(year: string, month: string) {
    const mNum = String(month).padStart(2, '0');
    const yrNum = parseInt(year, 10);
    if (isNaN(yrNum) || parseInt(mNum, 10) < 1 || parseInt(mNum, 10) > 12) {
      throw new Error('Invalid Year or Month parameters.');
    }

    const lastDayNum = new Date(yrNum, parseInt(mNum, 10), 0).getDate();
    const fromDate = `${year}-${mNum}-01`;
    const toDate = `${year}-${mNum}-${String(lastDayNum).padStart(2, '0')}`;

    const articles = await this.getPublishedArticlesInRange(fromDate, toDate);
    const categoryStats: Record<string, number> = {};
    for (const art of articles) {
      const cat = (art.category || 'OTHER').toUpperCase();
      categoryStats[cat] = (categoryStats[cat] || 0) + 1;
    }

    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const monthName = monthNames[parseInt(mNum, 10) - 1];

    const key = `monthly-${year}-${mNum}`;
    const existing = await this.getCompilationByKey(key);

    return {
      type: 'MONTHLY',
      periodKey: `${year}-${mNum}`,
      compilationId: key,
      monthName,
      year,
      month: mNum,
      fromDate,
      toDate,
      articleCount: articles.length,
      categoryStats,
      articleIds: articles.map(a => a.id),
      articlesPreview: articles.map(a => ({ id: a.id, title: a.title, category: a.category, publishedDate: a.publishedDate })),
      isUpdate: Boolean(existing),
      existingTitle: existing?.title || null
    };
  }

  public async combineMonthly(year: string, month: string) {
    const preview = await this.previewCombineMonthly(year, month);
    if (preview.articleCount === 0) {
      throw new Error(`No published daily articles found for ${preview.monthName} ${year}. Cannot create an empty compilation.`);
    }

    const key = preview.compilationId;
    const title = `Monthly Current Affairs: ${preview.monthName} ${year}`;
    const timestamp = new Date().toISOString();

    const record: CurrentAffairCompilation = {
      id: key,
      type: 'MONTHLY',
      periodKey: preview.periodKey,
      title,
      fromDate: preview.fromDate,
      toDate: preview.toDate,
      articleIds: preview.articleIds,
      articleCount: preview.articleCount,
      categoryStats: preview.categoryStats,
      publishStatus: 'PUBLISHED',
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await this.saveCompilationRecord(record);
    return { success: true, isUpdate: preview.isUpdate, compilation: record };
  }

  public async previewCombineYearly(year: string) {
    const yrNum = parseInt(year, 10);
    if (isNaN(yrNum)) throw new Error('Invalid Year parameter.');

    const fromDate = `${year}-01-01`;
    const toDate = `${year}-12-31`;

    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const availableMonths: string[] = [];
    const missingMonths: string[] = [];

    const editions = await this.getDynamicCurrentAffairsEditions(false);
    const yrEditions = editions.filter(ed => ed.publishDate.startsWith(`${year}-`));

    for (let i = 1; i <= 12; i++) {
      const mNum = String(i).padStart(2, '0');
      const mName = monthNames[i - 1];
      const hasContent = yrEditions.some(ed => ed.publishDate.split('-')[1] === mNum && (ed.articles || []).length > 0);
      if (hasContent) {
        availableMonths.push(mName);
      } else {
        missingMonths.push(mName);
      }
    }

    const articles = await this.getPublishedArticlesInRange(fromDate, toDate);
    const categoryStats: Record<string, number> = {};
    for (const art of articles) {
      const cat = (art.category || 'OTHER').toUpperCase();
      categoryStats[cat] = (categoryStats[cat] || 0) + 1;
    }

    const key = `yearly-${year}`;
    const existing = await this.getCompilationByKey(key);

    return {
      type: 'YEARLY',
      periodKey: `${year}`,
      compilationId: key,
      year,
      fromDate,
      toDate,
      availableMonths,
      missingMonths,
      availableCount: availableMonths.length,
      missingCount: missingMonths.length,
      articleCount: articles.length,
      categoryStats,
      articleIds: articles.map(a => a.id),
      isUpdate: Boolean(existing),
      existingTitle: existing?.title || null
    };
  }

  public async combineYearly(year: string, combineAvailableOnly: boolean) {
    const preview = await this.previewCombineYearly(year);
    if (preview.missingMonths.length > 0 && !combineAvailableOnly) {
      throw new Error(`Cannot combine incomplete year. Missing content for: ${preview.missingMonths.join(', ')}. Enable "Combine available months" to proceed.`);
    }

    if (preview.articleCount === 0) {
      throw new Error(`No published daily articles found for year ${year}. Cannot create an empty compilation.`);
    }

    const key = preview.compilationId;
    const title = `Yearly Current Affairs Review: ${year}`;
    const timestamp = new Date().toISOString();

    const record: CurrentAffairCompilation = {
      id: key,
      type: 'YEARLY',
      periodKey: preview.periodKey,
      title,
      fromDate: preview.fromDate,
      toDate: preview.toDate,
      articleIds: preview.articleIds,
      articleCount: preview.articleCount,
      categoryStats: preview.categoryStats,
      availableMonths: preview.availableMonths,
      missingMonths: preview.missingMonths,
      publishStatus: 'PUBLISHED',
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await this.saveCompilationRecord(record);
    return { success: true, isUpdate: preview.isUpdate, compilation: record };
  }

  // BLOGS
  public async getBlogs(): Promise<BlogItem[]> {
    if (mysqlPool) {
      try {
        const [rows] = await mysqlPool.query('SELECT * FROM blogs ORDER BY id DESC');
        return rows as BlogItem[];
      } catch (err) {
        console.error('MySQL query error:', err);
      }
    }
    return [...this.localStore.blogs].reverse();
  }

  public async createBlog(item: BlogItem): Promise<BlogItem> {
    if (mysqlPool) {
      try {
        await mysqlPool.query(
          'INSERT INTO blogs (id, title, slug, publishDate, readTime, category, content, imageUrl, excerpt, status, author_name, seoTitle, seoKeywords, seoDescription, blurb) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            item.id, item.title, item.slug ?? null, item.publishDate, item.readTime, item.category, item.content, item.imageUrl ?? null,
            item.excerpt ?? null, item.status ?? 'published', item.author_name ?? 'Admin',
            item.seoTitle ?? null, item.seoKeywords ?? null, item.seoDescription ?? null, item.blurb ?? null
          ]
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
          'UPDATE blogs SET title = ?, slug = ?, publishDate = ?, readTime = ?, category = ?, content = ?, imageUrl = ?, excerpt = ?, status = ?, author_name = ?, seoTitle = ?, seoKeywords = ?, seoDescription = ?, blurb = ? WHERE id = ?',
          [
            updated.title, updated.slug ?? null, updated.publishDate, updated.readTime, updated.category, updated.content, updated.imageUrl ?? null,
            updated.excerpt ?? null, updated.status ?? 'published', updated.author_name ?? 'Admin',
            updated.seoTitle ?? null, updated.seoKeywords ?? null, updated.seoDescription ?? null, updated.blurb ?? null, id
          ]
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
        const [rows] = await mysqlPool.query('SELECT * FROM resources ORDER BY category, subcategory, title');
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
          'INSERT INTO resources (id, title, size, type, downloadCount, url, category, subcategory) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [item.id, item.title, item.size, item.type, item.downloadCount, item.url, item.category ?? null, item.subcategory ?? null]
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
          'UPDATE resources SET title = ?, size = ?, type = ?, downloadCount = ?, url = ?, category = ?, subcategory = ? WHERE id = ?',
          [updated.title, updated.size, updated.type, updated.downloadCount, updated.url, updated.category ?? null, updated.subcategory ?? null, id]
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

  // ── Custom Pages CMS Engine ────────────────────────────────────────────────
  public async getCustomPages(publishedOnly: boolean = false): Promise<CustomPage[]> {
    if (mysqlPool) {
      try {
        const query = publishedOnly
          ? 'SELECT * FROM custom_pages WHERE isPublished = 1 ORDER BY displayOrder ASC, createdAt DESC'
          : 'SELECT * FROM custom_pages ORDER BY displayOrder ASC, createdAt DESC';
        const [rows]: any = await mysqlPool.query(query);
        return rows.map((r: any) => ({
          ...r,
          isPublished: Boolean(r.isPublished),
          downloadItems: typeof r.downloadItems === 'string' ? JSON.parse(r.downloadItems) : (r.downloadItems || [])
        }));
      } catch (err) {
        handlePoolDegrade(err);
      }
    }
    const store = this.localStore;
    const pages = store.customPages || [];
    return publishedOnly ? pages.filter(p => p.isPublished !== false) : pages;
  }

  public async getCustomPageBySlug(slug: string): Promise<CustomPage | null> {
    const cleanSlug = slug.replace(/^\/+|\/+$/g, '');
    const altSlug = cleanSlug.startsWith('downloads/') ? cleanSlug.replace('downloads/', '') : `downloads/${cleanSlug}`;

    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query(
          'SELECT * FROM custom_pages WHERE slug = ? OR slug = ? OR slug = ? OR slug = ? LIMIT 1',
          [slug, cleanSlug, altSlug, `downloads/${altSlug}`]
        );
        if (rows.length > 0) {
          return {
            ...rows[0],
            isPublished: Boolean(rows[0].isPublished),
            downloadItems: typeof rows[0].downloadItems === 'string' ? JSON.parse(rows[0].downloadItems) : (rows[0].downloadItems || [])
          };
        }
      } catch (err) {
        handlePoolDegrade(err);
      }
    }
    const store = this.localStore;
    const pages = store.customPages || [];
    return pages.find(p => p.slug === slug || p.slug === cleanSlug || p.slug === altSlug) || null;
  }

  public async saveCustomPage(pageData: Partial<CustomPage>): Promise<CustomPage> {
    const id = pageData.id || `page-${Date.now()}`;
    const title = pageData.title || 'Untitled Page';
    const slug = (pageData.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/(^-|-$)/g, '');
    const content = pageData.content || '';
    const showLocation = pageData.showLocation || 'NAVBAR';
    const displayOrder = pageData.displayOrder || 0;
    const metaTitle = pageData.metaTitle || title;
    const metaDescription = pageData.metaDescription || '';
    const bannerUrl = pageData.bannerUrl || '';
    const downloadItems = pageData.downloadItems || [];
    const isPublished = pageData.isPublished !== false ? 1 : 0;
    const now = new Date().toISOString();

    if (mysqlPool) {
      try {
        await mysqlPool.query(
          `INSERT INTO custom_pages (id, title, slug, content, showLocation, displayOrder, metaTitle, metaDescription, bannerUrl, downloadItems, isPublished, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             title = VALUES(title),
             slug = VALUES(slug),
             content = VALUES(content),
             showLocation = VALUES(showLocation),
             displayOrder = VALUES(displayOrder),
             metaTitle = VALUES(metaTitle),
             metaDescription = VALUES(metaDescription),
             bannerUrl = VALUES(bannerUrl),
             downloadItems = VALUES(downloadItems),
             isPublished = VALUES(isPublished),
             updatedAt = VALUES(updatedAt)`,
          [id, title, slug, content, showLocation, displayOrder, metaTitle, metaDescription, bannerUrl, JSON.stringify(downloadItems), isPublished, pageData.createdAt || now, now]
        );
      } catch (err) {
        handlePoolDegrade(err);
      }
    }

    const store = this.localStore;
    if (!store.customPages) store.customPages = [];
    const idx = store.customPages.findIndex(p => p.id === id);
    const updatedRecord: CustomPage = {
      id, title, slug, content, showLocation, displayOrder, metaTitle, metaDescription, bannerUrl, downloadItems,
      isPublished: Boolean(isPublished),
      createdAt: pageData.createdAt || now,
      updatedAt: now
    };
    if (idx >= 0) {
      store.customPages[idx] = updatedRecord;
    } else {
      store.customPages.push(updatedRecord);
    }
    this.saveLocalData();
    return updatedRecord;
  }

  public async deleteCustomPage(id: string): Promise<boolean> {
    if (mysqlPool) {
      try {
        await mysqlPool.query('DELETE FROM custom_pages WHERE id = ?', [id]);
      } catch (err) {
        handlePoolDegrade(err);
      }
    }
    const store = this.localStore;
    if (store.customPages) {
      store.customPages = store.customPages.filter(p => p.id !== id);
      this.saveLocalData();
    }
    return true;
  }

  public async deleteExamRecord(id: string): Promise<boolean> {
    if (mysqlPool) {
      try {
        await mysqlPool.query('DELETE FROM exams WHERE id = ?', [id]);
        await mysqlPool.query('DELETE FROM exam_stages WHERE examId = ?', [id]);
      } catch (err) {
        console.error('[DB] deleteExamRecord MySQL error:', err);
      }
    }

    if ((this.localStore as any).exams) {
      (this.localStore as any).exams = (this.localStore as any).exams.filter((e: any) => e.id !== id);
      this.saveLocalData();
    }
    return true;
  }
}


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

    // Seed default users if table is empty
    const [userCount]: any = await pool.query('SELECT COUNT(*) as count FROM users');
    if (userCount[0].count === 0) {
      for (const u of authLocalUsers) {
        await pool.query(
          `INSERT INTO users (id, fullName, email, mobile, passwordHash, role, targetExam, isEmailVerified, isActive)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [u.id, u.fullName, u.email, u.mobile, u.passwordHash, u.role, u.targetExam, u.isEmailVerified ? 1 : 0]
        );
      }
      console.log('Seeded default auth users table.');
    }

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
        id            VARCHAR(255) PRIMARY KEY,
        courseId      VARCHAR(100) NOT NULL,
        title         VARCHAR(255) NOT NULL,
        type          ENUM('general','doubts','announcement') DEFAULT 'general',
        createdAt     DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (courseId) REFERENCES lms_courses(id) ON DELETE CASCADE
      )
    `);

    // Ensure ID length is VARCHAR(255) on existing production tables to avoid truncation of support-${uuid}
    try { await pool.query("ALTER TABLE lms_chat_rooms MODIFY COLUMN id VARCHAR(255)"); } catch (e) {}

    // Chat Messages Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lms_chat_messages (
        id            VARCHAR(255) PRIMARY KEY,
        roomId        VARCHAR(255) NOT NULL,
        senderId      VARCHAR(255) NOT NULL,
        messageText   TEXT NOT NULL,
        createdAt     DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (roomId) REFERENCES lms_chat_rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    try { await pool.query("ALTER TABLE lms_chat_messages MODIFY COLUMN id VARCHAR(255), MODIFY COLUMN roomId VARCHAR(255), MODIFY COLUMN senderId VARCHAR(255)"); } catch (e) {}

    console.log('Auth & LMS tables initialized.');

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
    return db.localStore.users || [];
  }

  async getUsersWithEnrollments(): Promise<any[]> {
    if (mysqlPool) {
      try {
        const [users]: any = await mysqlPool.query('SELECT id, fullName, email, mobile, role, targetExam, isEmailVerified, isActive, createdAt, lastLoginAt FROM users ORDER BY createdAt DESC');
        const [enrollments]: any = await mysqlPool.query(`
          SELECT e.*, c.title as courseTitle, c.category as batchCategory, c.schedule as batchSchedule
          FROM lms_enrollments e
          JOIN lms_courses c ON c.id = e.courseId
        `);

        return users.map((u: any) => {
          const userEnrs = enrollments.filter((e: any) => e.userId === u.id);
          return {
            ...u,
            isEmailVerified: !!u.isEmailVerified,
            isActive: !!u.isActive,
            enrollments: userEnrs.map((e: any) => ({
              id: e.id,
              courseId: e.courseId,
              courseTitle: e.courseTitle,
              batch: e.batchCategory || e.batchSchedule || 'Standard Batch',
              paymentOrderId: e.paymentOrderId || 'N/A',
              paymentStatus: e.paymentStatus || 'free',
              amountPaid: e.amountPaid || 0,
              enrolledAt: e.enrolledAt
            }))
          };
        });
      } catch (err) { console.error('[AuthDB] getUsersWithEnrollments MySQL error:', err); }
    }
    const localUsers = db.localStore.users || [];
    return localUsers.map(u => ({
      ...u,
      enrollments: (lmsLocalEnrollments || []).filter(e => e.userId === u.id)
    }));
  }

  async updateUserActiveStatus(userId: string, isActive: boolean): Promise<boolean> {
    if (mysqlPool) {
      try {
        await mysqlPool.query('UPDATE users SET isActive = ? WHERE id = ?', [isActive ? 1 : 0, userId]);
        return true;
      } catch (err) { console.error('[AuthDB] updateUserActiveStatus MySQL error:', err); }
    }
    const u = (db.localStore.users || []).find(user => user.id === userId);
    if (u) { 
      u.isActive = isActive; 
      db.saveLocalData();
      return true; 
    }
    return false;
  }

  async deleteUser(userId: string): Promise<boolean> {
    if (mysqlPool) {
      try {
        await mysqlPool.query('DELETE FROM users WHERE id = ?', [userId]);
        return true;
      } catch (err) { console.error('[AuthDB] deleteUser MySQL error:', err); }
    }
    const idx = (db.localStore.users || []).findIndex(user => user.id === userId);
    if (idx >= 0) { 
      db.localStore.users!.splice(idx, 1); 
      db.saveLocalData();
      return true; 
    }
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
    if (!db.localStore.users) db.localStore.users = [];
    db.localStore.users.push(user);
    db.saveLocalData();
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
    return (db.localStore.users || []).find(u => u.email === email) || null;
  }

  async findUserByMobile(mobile: string): Promise<UserRecord | null> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query('SELECT * FROM users WHERE mobile = ? LIMIT 1', [mobile]);
        if (rows && rows.length > 0) return { ...rows[0], isEmailVerified: !!rows[0].isEmailVerified, isActive: !!rows[0].isActive } as UserRecord;
        return null;
      } catch (err) { console.error('[AuthDB] findUserByMobile MySQL error:', err); }
    }
    return (db.localStore.users || []).find(u => u.mobile === mobile) || null;
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
        if (rows && rows.length > 0) return { ...rows[0], isEmailVerified: !!rows[0].isEmailVerified, isActive: !!rows[0].isActive } as UserRecord;
        return null;
      } catch (err) { console.error('[AuthDB] findUserById MySQL error:', err); }
    }
    return (db.localStore.users || []).find(u => u.id === id) || null;
  }

  async verifyUserEmail(userId: string): Promise<void> {
    if (mysqlPool) {
      try {
        await mysqlPool.query('UPDATE users SET isEmailVerified = 1 WHERE id = ?', [userId]);
        return;
      } catch (err) { console.error('[AuthDB] verifyUserEmail MySQL error:', err); }
    }
    const u = (db.localStore.users || []).find(u => u.id === userId);
    if (u) {
      u.isEmailVerified = true;
      db.saveLocalData();
    }
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    if (mysqlPool) {
      try {
        await mysqlPool.query('UPDATE users SET passwordHash = ? WHERE id = ?', [passwordHash, userId]);
        return;
      } catch (err) { console.error('[AuthDB] updatePassword MySQL error:', err); }
    }
    const u = (db.localStore.users || []).find(u => u.id === userId);
    if (u) {
      u.passwordHash = passwordHash;
      db.saveLocalData();
    }
  }

  async updateProfile(userId: string, data: { fullName?: string; email?: string; mobile?: string; state?: string; district?: string; targetExam?: string; avatarUrl?: string; role?: 'student' | 'faculty' | 'admin' }): Promise<void> {
    if (mysqlPool) {
      try {
        const setClauses: string[] = [];
        const params: any[] = [];
        if (data.fullName !== undefined) { setClauses.push('fullName = ?'); params.push(data.fullName); }
        if (data.email !== undefined) { setClauses.push('email = ?'); params.push(data.email); }
        if (data.mobile !== undefined) { setClauses.push('mobile = ?'); params.push(data.mobile); }
        if (data.state !== undefined) { setClauses.push('state = ?'); params.push(data.state); }
        if (data.district !== undefined) { setClauses.push('district = ?'); params.push(data.district); }
        if (data.targetExam !== undefined) { setClauses.push('targetExam = ?'); params.push(data.targetExam); }
        if (data.avatarUrl !== undefined) { setClauses.push('avatarUrl = ?'); params.push(data.avatarUrl); }
        if (data.role !== undefined) { setClauses.push('role = ?'); params.push(data.role); }

        if (setClauses.length > 0) {
          params.push(userId);
          await mysqlPool.query(`UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`, params);
        }
        return;
      } catch (err) { console.error('[AuthDB] updateProfile MySQL error:', err); }
    }
    const u = (db.localStore.users || []).find(user => user.id === userId);
    if (u) {
      if (data.fullName !== undefined) u.fullName = data.fullName;
      if (data.email !== undefined) u.email = data.email;
      if (data.mobile !== undefined) u.mobile = data.mobile;
      if (data.state !== undefined) (u as any).state = data.state;
      if (data.district !== undefined) (u as any).district = data.district;
      if (data.targetExam !== undefined) u.targetExam = data.targetExam;
      if (data.avatarUrl !== undefined) u.avatarUrl = data.avatarUrl;
      if (data.role !== undefined) u.role = data.role;
      db.saveLocalData();
    }
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
    if (!db.localStore.sessions) db.localStore.sessions = [];
    db.localStore.sessions.push({ id: sessionId, userId, refreshToken, expiresAt });
    db.saveLocalData();
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
    return (db.localStore.sessions || []).find(s => s.id === sessionId && s.userId === userId) || null;
  }

  async deleteSession(sessionId: string): Promise<void> {
    if (mysqlPool) {
      try {
        await mysqlPool.query('DELETE FROM user_sessions WHERE id = ?', [sessionId]);
        return;
      } catch (err) {
        // ECONNRESET / MySQL dropped — degrade gracefully, do NOT throw
        // This prevents auth refresh from failing mid-rotation
        console.warn('[AuthDB] deleteSession MySQL unavailable, using local fallback:', (err as any).code || (err as any).message);
      }
    }
    // Always clean local store too
    const idx = (db.localStore.sessions || []).findIndex(s => s.id === sessionId);
    if (idx >= 0) {
      db.localStore.sessions!.splice(idx, 1);
      db.saveLocalData();
    }
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    if (mysqlPool) {
      try {
        await mysqlPool.query('DELETE FROM user_sessions WHERE userId = ?', [userId]);
        return;
      } catch (err) { console.error('[AuthDB] deleteAllUserSessions MySQL error:', err); }
    }
    const filtered = (db.localStore.sessions || []).filter(s => s.userId !== userId);
    db.localStore.sessions = filtered;
    db.saveLocalData();
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
    if (!db.localStore.otps) db.localStore.otps = [];
    db.localStore.otps.push({ id, identifier, type, otpHash, purpose, expiresAt, attempts: 0, usedAt: null });
    db.saveLocalData();
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
    return (db.localStore.otps || []).filter(o => o.identifier === identifier && o.type === type && o.purpose === purpose && !o.usedAt).pop() || null;
  }

  async incrementOTPAttempts(otpId: string): Promise<void> {
    if (mysqlPool) {
      try {
        await mysqlPool.query('UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = ?', [otpId]);
        return;
      } catch (err) { /* non-critical */ }
    }
    const rec = (db.localStore.otps || []).find(o => o.id === otpId);
    if (rec) {
      rec.attempts++;
      db.saveLocalData();
    }
  }

  async markOTPUsed(otpId: string): Promise<void> {
    if (mysqlPool) {
      try {
        await mysqlPool.query('UPDATE otp_verifications SET usedAt = NOW() WHERE id = ?', [otpId]);
        return;
      } catch (err) { /* non-critical */ }
    }
    const rec = (db.localStore.otps || []).find(o => o.id === otpId);
    if (rec) {
      rec.usedAt = new Date();
      db.saveLocalData();
    }
  }
}

export const db = new BackendDB();
export const authDB = new AuthDB();

// ═════════════════════════════════════════════════════════════════════════════
//  LMS DATABASE — courses, sections, lessons, enrollments, progress
// ═════════════════════════════════════════════════════════════════════════════

class LmsDB {
  // ── Courses ────────────────────────────────────────────────────────────────
  async getCourses(includeUnpublished: boolean = false): Promise<any[]> {
    if (mysqlPool) {
      try {
        const query = includeUnpublished
          ? 'SELECT * FROM lms_courses WHERE isActive = 1 ORDER BY enrolledCount DESC'
          : 'SELECT * FROM lms_courses WHERE isActive = 1 AND isPublished = 1 ORDER BY enrolledCount DESC';
        const [rows]: any = await mysqlPool.query(query);
        return rows.map((r: any) => ({
          ...r,
          isPublished: Boolean(r.isPublished),
          syllabus: typeof r.syllabus === 'string' ? JSON.parse(r.syllabus) : r.syllabus,
          features: typeof r.features === 'string' ? JSON.parse(r.features) : r.features,
          faq:      typeof r.faq      === 'string' ? JSON.parse(r.faq)      : r.faq,
          faculty:  typeof r.faculty  === 'string' ? JSON.parse(r.faculty)  : r.faculty,
          demoLectures: typeof r.demoLectures === 'string' ? JSON.parse(r.demoLectures) : r.demoLectures,
          fee: r.fee,
          originalPrice: r.originalPrice || null,
          discount: r.discount || null
        }));
      } catch (err) { 
        console.error('[LmsDB] getCourses MySQL error, serving local fallback:', err); 
        handlePoolDegrade(err);
        const courses = db.localStore.courses || [];
        return includeUnpublished ? courses : courses.filter(c => c.isPublished !== false);
      }
    }
    const courses = db.localStore.courses || [];
    return includeUnpublished ? courses : courses.filter(c => c.isPublished !== false);
  }

  async getTestSeriesById(idOrSlug: string): Promise<any | null> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query('SELECT * FROM TestSeries WHERE id = ? OR slug = ? LIMIT 1', [idOrSlug, idOrSlug]);
        if (rows && rows.length > 0) return rows[0];
      } catch (err) {
        console.error('[LmsDB] getTestSeriesById MySQL error:', err);
      }
    }
    return null;
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
          faculty:  typeof r.faculty  === 'string' ? JSON.parse(r.faculty)  : r.faculty,
          demoLectures: typeof r.demoLectures === 'string' ? JSON.parse(r.demoLectures) : r.demoLectures,
          fee: r.fee,
          originalPrice: r.originalPrice || null,
          discount: r.discount || null
        };
      } catch (err) { 
        console.error('[LmsDB] getCourseById MySQL error, serving local fallback:', err); 
        return db.localStore.courses.find(c => c.id === id) || null;
      }
    }
    return db.localStore.courses.find(c => c.id === id) || null;
  }

  async createCourse(data: any): Promise<any> {
    const slug = data.slug || data.title?.toLowerCase()?.replace(/[^a-z0-9]+/g, '-') || `course-${Date.now()}`;
    if (mysqlPool) {
      try {
        await mysqlPool.query(
          `INSERT INTO lms_courses (id, title, slug, exam, category, description, overview, fee, originalPrice, discount, duration, schedule, enrolledCount, syllabus, features, faq, faculty, demoLectures, isPublished)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)`,
          [
            data.id, data.title, slug, data.exam || 'BPSC', data.category || 'Prelims', data.description || '', data.overview || '',
            data.fee || 0, data.originalPrice || null, data.discount || null, data.duration || '', data.schedule || '',
            JSON.stringify(data.syllabus || []),
            JSON.stringify(data.features || []),
            JSON.stringify(data.faq || []),
            JSON.stringify(data.faculty || []),
            JSON.stringify(data.demoLectures || []),
            data.isPublished ? 1 : 0
          ]
        ).catch(async () => {
          // Fallback if extra columns are missing in older MySQL schemas
          await mysqlPool.query(
            `INSERT INTO lms_courses (id, title, slug, exam, category, description, fee, duration, schedule, enrolledCount, syllabus, features, faq, isPublished)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
            [
              data.id, data.title, slug, data.exam || 'BPSC', data.category || 'Prelims', data.description,
              data.fee || 0, data.duration || '', data.schedule || '',
              JSON.stringify(data.syllabus || []),
              JSON.stringify(data.features || []),
              JSON.stringify(data.faq || []),
              data.isPublished ? 1 : 0
            ]
          );
        });
        return data;
      } catch (err) {
        console.error('[LmsDB] createCourse MySQL error:', err);
        throw err;
      }
    }

    if (!db.localStore.courses.some(c => c.id === data.id)) {
      db.localStore.courses.push({
        ...data,
        syllabus: typeof data.syllabus === 'string' ? JSON.parse(data.syllabus) : data.syllabus || [],
        features: typeof data.features === 'string' ? JSON.parse(data.features) : data.features || [],
        faq: typeof data.faq === 'string' ? JSON.parse(data.faq) : data.faq || [],
        faculty: typeof data.faculty === 'string' ? JSON.parse(data.faculty) : data.faculty || [],
        demoLectures: typeof data.demoLectures === 'string' ? JSON.parse(data.demoLectures) : data.demoLectures || []
      });
      db.saveLocalData();
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
        if (updates.overview !== undefined) { fields.push('overview = ?'); vals.push(updates.overview); }
        if (updates.exam !== undefined) { fields.push('exam = ?'); vals.push(updates.exam); }
        if (updates.category !== undefined) { fields.push('category = ?'); vals.push(updates.category); }
        if (updates.fee !== undefined) { fields.push('fee = ?'); vals.push(updates.fee); }
        if (updates.originalPrice !== undefined) { fields.push('originalPrice = ?'); vals.push(updates.originalPrice); }
        if (updates.discount !== undefined) { fields.push('discount = ?'); vals.push(updates.discount); }
        if (updates.duration !== undefined) { fields.push('duration = ?'); vals.push(updates.duration); }
        if (updates.schedule !== undefined) { fields.push('schedule = ?'); vals.push(updates.schedule); }
        if (updates.isPublished !== undefined) { fields.push('isPublished = ?'); vals.push(updates.isPublished ? 1 : 0); }
        if (updates.syllabus !== undefined) { fields.push('syllabus = ?'); vals.push(typeof updates.syllabus === 'string' ? updates.syllabus : JSON.stringify(updates.syllabus)); }
        if (updates.features !== undefined) { fields.push('features = ?'); vals.push(typeof updates.features === 'string' ? updates.features : JSON.stringify(updates.features)); }
        if (updates.faq !== undefined) { fields.push('faq = ?'); vals.push(typeof updates.faq === 'string' ? updates.faq : JSON.stringify(updates.faq)); }
        if (updates.faculty !== undefined) { fields.push('faculty = ?'); vals.push(typeof updates.faculty === 'string' ? updates.faculty : JSON.stringify(updates.faculty)); }
        if (updates.demoLectures !== undefined) { fields.push('demoLectures = ?'); vals.push(typeof updates.demoLectures === 'string' ? updates.demoLectures : JSON.stringify(updates.demoLectures)); }

        if (fields.length === 0) return true;
        vals.push(id);
        await mysqlPool.query(`UPDATE lms_courses SET ${fields.join(', ')} WHERE id = ?`, vals).catch(async (e) => {
          // If optional columns aren't in MySQL schema, fallback to basic updates
          const safeFields: string[] = [];
          const safeVals: any[] = [];
          if (updates.title !== undefined) { safeFields.push('title = ?'); safeVals.push(updates.title); }
          if (updates.description !== undefined) { safeFields.push('description = ?'); safeVals.push(updates.description); }
          if (updates.exam !== undefined) { safeFields.push('exam = ?'); safeVals.push(updates.exam); }
          if (updates.category !== undefined) { safeFields.push('category = ?'); safeVals.push(updates.category); }
          if (updates.fee !== undefined) { safeFields.push('fee = ?'); safeVals.push(updates.fee); }
          if (updates.duration !== undefined) { safeFields.push('duration = ?'); safeVals.push(updates.duration); }
          if (updates.schedule !== undefined) { safeFields.push('schedule = ?'); safeVals.push(updates.schedule); }
          if (updates.isPublished !== undefined) { safeFields.push('isPublished = ?'); safeVals.push(updates.isPublished ? 1 : 0); }
          if (safeFields.length > 0) {
            safeVals.push(id);
            await mysqlPool.query(`UPDATE lms_courses SET ${safeFields.join(', ')} WHERE id = ?`, safeVals);
          }
        });
        return true;
      } catch (err) {
        console.error('[LmsDB] updateCourse MySQL error:', err);
        throw err;
      }
    }
    const idx = db.localStore.courses.findIndex(c => c.id === id);
    if (idx >= 0) {
      db.localStore.courses[idx] = { ...db.localStore.courses[idx], ...updates };
      db.saveLocalData();
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
    const idx = db.localStore.courses.findIndex(c => c.id === id);
    if (idx >= 0) {
      db.localStore.courses.splice(idx, 1);
      db.saveLocalData();
      return true;
    }
    return false;
  }

  async createSection(data: { id: string; courseId: string; title: string; orderIndex: number }): Promise<any> {
    if (mysqlPool) {
      try {
        await mysqlPool.query(
          'INSERT INTO lms_sections (id, courseId, title, orderIndex, isPublished) VALUES (?, ?, ?, ?, 1)',
          [data.id, data.courseId, data.title, data.orderIndex]
        );
        return data;
      } catch (err) {
        console.error('[LmsDB] createSection MySQL error, falling back to local storage:', err);
      }
    }
    db.localStore.sections.push({ ...data, isPublished: 1 });
    db.saveLocalData();
    return data;
  }

  async updateSection(id: string, title: string): Promise<boolean> {
    if (mysqlPool) {
      try {
        await mysqlPool.query('UPDATE lms_sections SET title = ? WHERE id = ?', [title, id]);
        return true;
      } catch (err) {
        console.error('[LmsDB] updateSection MySQL error, falling back to local storage:', err);
      }
    }
    const idx = db.localStore.sections.findIndex(s => s.id === id);
    if (idx >= 0) {
      db.localStore.sections[idx].title = title;
      db.saveLocalData();
      return true;
    }
    return true;
  }

  async deleteSection(id: string): Promise<boolean> {
    if (mysqlPool) {
      try {
        await mysqlPool.query('DELETE FROM lms_sections WHERE id = ?', [id]);
        return true;
      } catch (err) {
        console.error('[LmsDB] deleteSection MySQL error, falling back to local storage:', err);
      }
    }
    const idx = db.localStore.sections.findIndex(s => s.id === id);
    if (idx >= 0) {
      db.localStore.sections.splice(idx, 1);
      db.saveLocalData();
    }
    return true;
  }

  async getSectionsByCourseId(courseId: string): Promise<any[]> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query(
          'SELECT * FROM lms_sections WHERE courseId = ? AND isPublished = 1 ORDER BY orderIndex ASC', [courseId]
        );
        return rows;
      } catch (err) { console.error('[LmsDB] getSections MySQL error:', err); }
    }
    return db.localStore.sections.filter(s => s.courseId === courseId);
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
    return db.localStore.lessons.filter(l => l.sectionId === sectionId);
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
        console.error('[LmsDB] createLesson MySQL error, falling back to local storage:', err);
      }
    }
    db.localStore.lessons.push(data);
    db.saveLocalData();
    return data;
  }

  async deleteLesson(id: string): Promise<boolean> {
    if (mysqlPool) {
      try {
        await mysqlPool.query('DELETE FROM lms_lessons WHERE id = ?', [id]);
        return true;
      } catch (err) {
        console.error('[LmsDB] deleteLesson MySQL error, falling back to local storage:', err);
      }
    }
    const idx = db.localStore.lessons.findIndex(l => l.id === id);
    if (idx >= 0) {
      db.localStore.lessons.splice(idx, 1);
      db.saveLocalData();
    }
    return true;
  }

  async updateLesson(id: string, data: { title: string; videoUrl: string; duration: string }): Promise<boolean> {
    if (mysqlPool) {
      try {
        await mysqlPool.query(
          'UPDATE lms_lessons SET title = ?, videoUrl = ?, duration = ? WHERE id = ?',
          [data.title, data.videoUrl, data.duration, id]
        );
        return true;
      } catch (err) {
        console.error('[LmsDB] updateLesson MySQL error, falling back to local storage:', err);
      }
    }
    const idx = db.localStore.lessons.findIndex(l => l.id === id);
    if (idx >= 0) {
      db.localStore.lessons[idx] = { ...db.localStore.lessons[idx], ...data };
      db.saveLocalData();
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

  async deleteEnrollment(userId: string, courseId: string): Promise<boolean> {
    if (mysqlPool) {
      try {
        const [res]: any = await mysqlPool.query(
          'DELETE FROM lms_enrollments WHERE userId = ? AND courseId = ?',
          [userId, courseId]
        );
        return res.affectedRows > 0;
      } catch (err) { console.error('[LmsDB] deleteEnrollment MySQL error:', err); }
    }
    const idx = lmsLocalEnrollments.findIndex(e => e.userId === userId && e.courseId === courseId);
    if (idx >= 0) {
      lmsLocalEnrollments.splice(idx, 1);
      return true;
    }
    return false;
  }

  async getTestSeriesEnrolledStudents(testSeriesId: string): Promise<any[]> {
    if (mysqlPool) {
      try {
        const [tsRows]: any = await mysqlPool.query('SELECT id, slug FROM TestSeries WHERE id = ? OR slug = ? LIMIT 1', [testSeriesId, testSeriesId]);
        const primaryId = tsRows && tsRows.length > 0 ? tsRows[0].id : testSeriesId;
        const slugId = tsRows && tsRows.length > 0 ? tsRows[0].slug : testSeriesId;

        const [rows]: any = await mysqlPool.query(
          `SELECT e.id as enrollmentId, e.userId, e.paymentOrderId, e.paymentStatus, e.amountPaid, e.enrolledAt,
                  u.fullName, u.email, u.mobile, u.targetExam, u.state, u.district,
                  (SELECT COUNT(a.id) FROM lms_quiz_attempts a JOIN lms_quizzes q ON q.id = a.quizId WHERE a.userId = e.userId AND (q.courseId = ? OR q.courseId = ?)) as totalAttempts,
                  (SELECT a.score FROM lms_quiz_attempts a JOIN lms_quizzes q ON q.id = a.quizId WHERE a.userId = e.userId AND (q.courseId = ? OR q.courseId = ?) ORDER BY a.submittedAt DESC LIMIT 1) as latestScore
           FROM lms_enrollments e
           JOIN users u ON u.id = e.userId
           WHERE e.courseId = ? OR e.courseId = ?
           ORDER BY e.enrolledAt DESC`,
          [primaryId, slugId, primaryId, slugId, primaryId, slugId]
        );
        if (rows && rows.length > 0) return rows;
      } catch (err) {
        console.error('[LmsDB] getTestSeriesEnrolledStudents MySQL error:', err);
      }
    }
    const [tsRows]: any = await (mysqlPool ? mysqlPool.query('SELECT id, slug FROM TestSeries WHERE id = ? OR slug = ? LIMIT 1', [testSeriesId, testSeriesId]) : [[]]);
    const targetIds = tsRows && tsRows.length > 0 ? [tsRows[0].id, tsRows[0].slug] : [testSeriesId];

    const localEnrolled = lmsLocalEnrollments.filter(e => targetIds.includes(e.courseId));
    return localEnrolled.map((e: any) => {
      const u = (db.localStore.users || []).find(user => user.id === e.userId);
      return {
        enrollmentId: e.id,
        userId: e.userId,
        paymentOrderId: e.paymentOrderId || 'ADMIN_MANUAL',
        paymentStatus: 'paid',
        amountPaid: 0,
        enrolledAt: e.enrolledAt || new Date().toISOString(),
        fullName: u?.fullName || 'Enrolled Student',
        email: u?.email || '',
        mobile: u?.mobile || '',
        state: (u as any)?.state || '',
        district: (u as any)?.district || '',
        totalAttempts: 0,
        latestScore: null
      };
    });
  }

  async getUserEnrollments(userId: string): Promise<any[]> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query(
          `SELECT e.*, 
                  COALESCE(c.title, ts.title) as title, 
                  COALESCE(c.category, CONCAT(ts.category, ' • ', ts.exam)) as category, 
                  COALESCE(c.thumbnailUrl, ts.thumbnailUrl) as thumbnailUrl, 
                  COALESCE(c.duration, ts.duration) as duration,
                  ts.slug as testSeriesSlug,
                  (SELECT COUNT(DISTINCT lessonId) FROM lms_progress WHERE userId = e.userId AND courseId = e.courseId AND completed = 1) as completedLessons,
                  (SELECT COUNT(l.id) FROM lms_lessons l WHERE l.courseId = e.courseId AND l.isPublished = 1) as totalLessons
           FROM lms_enrollments e
           LEFT JOIN lms_courses c ON c.id = e.courseId
           LEFT JOIN TestSeries ts ON ts.id = e.courseId OR ts.slug = e.courseId
           WHERE e.userId = ?
           ORDER BY e.enrolledAt DESC`,
          [userId]
        );
        return rows.map((r: any) => ({
          ...r,
          completedLessons: Number(r.completedLessons || 0),
          totalLessons: Number(r.totalLessons || 0),
          completionPercentage: Number(r.totalLessons) > 0 ? Math.round((Number(r.completedLessons) / Number(r.totalLessons)) * 100) : 0
        }));
      } catch (err) { console.error('[LmsDB] getUserEnrollments MySQL error:', err); }
    }
    const userEnrolled = lmsLocalEnrollments.filter(e => e.userId === userId);
    return userEnrolled.map(e => {
      const ts = ((db.localStore as any).testSeries || []).find((t: any) => t.id === e.courseId || t.slug === e.courseId);
      const c = (db.localStore.courses || []).find((crs: any) => crs.id === e.courseId);
      return {
        ...e,
        title: ts?.title || c?.title || 'Enrolled Program',
        category: ts ? `${ts.category || 'Prelims'} • ${ts.exam || 'BPSC'}` : (c?.category || 'General'),
        thumbnailUrl: ts?.thumbnailUrl || c?.thumbnailUrl || '',
        duration: ts?.duration || c?.duration || 'Active Access',
        testSeriesSlug: ts?.slug || null,
        completedLessons: 0,
        totalLessons: 0,
        completionPercentage: 0
      };
    });
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

  // ── Chat Helpers ───────────────────────────────────────────────────────────
  async getOrCreateSupportRoom(studentId: string, studentName?: string): Promise<any> {
    const roomId = `support-${studentId}`;
    const roomTitle = `Direct Chat: ${studentName || 'Student'} & Admin/Mentor`;
    if (mysqlPool) {
      try {
        const [existing]: any = await mysqlPool.query('SELECT * FROM lms_chat_rooms WHERE id = ? LIMIT 1', [roomId]);
        if (existing && existing.length > 0) return existing[0];

        // Get any valid courseId for DB foreign key constraint if required, or null
        const [courses]: any = await mysqlPool.query('SELECT id FROM lms_courses LIMIT 1');
        const courseId = courses && courses.length > 0 ? courses[0].id : 'bpsc-foundation';

        await mysqlPool.query(
          'INSERT IGNORE INTO lms_chat_rooms (id, courseId, title, type) VALUES (?, ?, ?, ?)',
          [roomId, courseId, roomTitle, 'general']
        );

        const [created]: any = await mysqlPool.query('SELECT * FROM lms_chat_rooms WHERE id = ? LIMIT 1', [roomId]);
        if (created && created.length > 0) return created[0];

        return { id: roomId, courseId, title: roomTitle, type: 'general' };
      } catch (err) { console.error('[LmsDB] getOrCreateSupportRoom MySQL error:', err); }
    }
    return { id: roomId, courseId: 'bpsc-foundation', title: roomTitle, type: 'general' };
  }

  async getAllChatRoomsForAdmin(): Promise<any[]> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query(
          `SELECT DISTINCT 
             m.roomId as id,
             COALESCE(r.title, CONCAT('Direct Chat: ', COALESCE(u.fullName, 'Student'))) as title,
             r.type as type,
             (SELECT m2.messageText FROM lms_chat_messages m2 WHERE m2.roomId = m.roomId ORDER BY m2.createdAt DESC LIMIT 1) as lastMessageText,
             (SELECT m2.createdAt FROM lms_chat_messages m2 WHERE m2.roomId = m.roomId ORDER BY m2.createdAt DESC LIMIT 1) as lastMessageTime,
             (SELECT COALESCE(u2.fullName, 'Student') FROM lms_chat_messages m2 LEFT JOIN users u2 ON u2.id = m2.senderId WHERE m2.roomId = m.roomId AND (u2.role = 'student' OR u2.role IS NULL) ORDER BY m2.createdAt DESC LIMIT 1) as studentName
           FROM lms_chat_messages m
           LEFT JOIN lms_chat_rooms r ON r.id = m.roomId
           LEFT JOIN users u ON u.id = m.senderId
           ORDER BY lastMessageTime DESC`
        );
        if (rows && rows.length > 0) return rows;

        // Fallback: query lms_chat_rooms if no messages exist yet
        const [roomRows]: any = await mysqlPool.query('SELECT * FROM lms_chat_rooms ORDER BY createdAt DESC');
        if (roomRows && roomRows.length > 0) return roomRows;
      } catch (err) { console.error('[LmsDB] getAllChatRoomsForAdmin MySQL error:', err); }
    }
    // Local memory fallback
    if (!db.localStore.chatRooms) db.localStore.chatRooms = [];
    return db.localStore.chatRooms;
  }

  async getChatRoomsByCourseId(courseId: string): Promise<any[]> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query(
          'SELECT * FROM lms_chat_rooms WHERE courseId = ? ORDER BY type ASC', [courseId]
        );
        return rows;
      } catch (err) { console.error('[LmsDB] getChatRoomsByCourseId MySQL error:', err); }
    }
    if (!db.localStore.chatRooms) db.localStore.chatRooms = [];
    return db.localStore.chatRooms.filter(r => r.courseId === courseId);
  }

  async getChatMessagesByRoomId(roomId: string, limit = 100): Promise<any[]> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query(
          `SELECT m.*, COALESCE(u.fullName, 'Student') as fullName, COALESCE(u.role, 'student') as role, u.avatarUrl
           FROM lms_chat_messages m
           LEFT JOIN users u ON u.id = m.senderId
           WHERE m.roomId = ?
           ORDER BY m.createdAt ASC
           LIMIT ?`,
          [roomId, limit]
        );
        if (rows && rows.length > 0) return rows;
      } catch (err) { console.error('[LmsDB] getChatMessagesByRoomId MySQL error:', err); }
    }
    if (!db.localStore.chatMessages) db.localStore.chatMessages = [];
    return db.localStore.chatMessages.filter(m => m.roomId === roomId).slice(-limit);
  }

  async saveChatMessage(roomId: string, senderId: string, messageText: string, senderName?: string, senderRole?: string): Promise<any> {
    const { v4: uuid } = await import('uuid');
    const msgId = uuid();
    const msg = {
      id: msgId,
      roomId,
      senderId,
      messageText,
      createdAt: new Date().toISOString(),
      fullName: senderName || 'Student',
      role: senderRole || 'student',
      avatarUrl: null as null | string
    };

    // Always update local memory store for instant fallback availability
    if (!db.localStore.chatMessages) db.localStore.chatMessages = [];
    db.localStore.chatMessages.push(msg);

    if (!db.localStore.chatRooms) db.localStore.chatRooms = [];
    const existingLocalRoom = db.localStore.chatRooms.find(r => r.id === roomId);
    if (!existingLocalRoom) {
      db.localStore.chatRooms.unshift({
        id: roomId,
        courseId: 'bpsc-foundation',
        title: `Direct Chat: ${senderName || 'Student'}`,
        type: 'admin_support',
        lastMessageText: messageText,
        lastMessageTime: msg.createdAt,
        studentName: senderName || 'Student'
      });
    } else {
      existingLocalRoom.lastMessageText = messageText;
      existingLocalRoom.lastMessageTime = msg.createdAt;
      if (senderRole === 'student') {
        existingLocalRoom.studentName = senderName || existingLocalRoom.studentName;
      }
    }
    db.saveLocalData();

    if (mysqlPool) {
      try {
        // Ensure room exists in lms_chat_rooms table so admin queries can join if needed
        await mysqlPool.query(
          'INSERT IGNORE INTO lms_chat_rooms (id, courseId, title, type) VALUES (?, ?, ?, ?)',
          [roomId, 'bpsc-foundation', `Direct Support: ${senderName || 'Student'}`, 'admin_support']
        );

        // INSERT IGNORE: skip FK constraint failures gracefully
        await mysqlPool.query(
          'INSERT IGNORE INTO lms_chat_messages (id, roomId, senderId, messageText) VALUES (?, ?, ?, ?)',
          [msg.id, msg.roomId, msg.senderId, msg.messageText]
        );
        
        // Try to fetch sender details from DB (may not exist for unregistered senderIds)
        try {
          const [userRows]: any = await mysqlPool.query(
            'SELECT fullName, role, avatarUrl FROM users WHERE id = ? LIMIT 1', [senderId]
          );
          if (userRows && userRows.length > 0) {
            msg.fullName = userRows[0].fullName || senderName || 'Student';
            msg.role = userRows[0].role || senderRole || 'student';
            msg.avatarUrl = userRows[0].avatarUrl || null;
          }
        } catch {
          // Sender not in users table — use provided fallback info
        }

        return msg;
      } catch (err) {
        console.error('[LmsDB] saveChatMessage MySQL error:', err);
        return msg;
      }
    }
    return msg;
  }

  async editChatMessage(messageId: string, newMessageText: string, userId?: string, isAdmin?: boolean): Promise<any> {
    if (!db.localStore.chatMessages) db.localStore.chatMessages = [];
    const localMsg = db.localStore.chatMessages.find(m => m.id === messageId);
    if (localMsg) {
      if (!isAdmin && userId && localMsg.senderId !== userId) {
        throw new Error('Unauthorized to edit this message');
      }
      localMsg.messageText = newMessageText;
      localMsg.isEdited = true;
      localMsg.editedAt = new Date().toISOString();
      db.saveLocalData();
    }
    if (mysqlPool) {
      try {
        if (!isAdmin && userId) {
          await mysqlPool.query(
            'UPDATE lms_chat_messages SET messageText = ? WHERE id = ? AND senderId = ?',
            [newMessageText, messageId, userId]
          );
        } else {
          await mysqlPool.query(
            'UPDATE lms_chat_messages SET messageText = ? WHERE id = ?',
            [newMessageText, messageId]
          );
        }
      } catch (err) {
        console.error('[LmsDB] editChatMessage MySQL error:', err);
      }
    }
    return localMsg || { id: messageId, messageText: newMessageText, isEdited: true };
  }

  async deleteChatMessage(messageId: string, userId?: string, isAdmin?: boolean): Promise<boolean> {
    let deleted = false;
    if (!db.localStore.chatMessages) db.localStore.chatMessages = [];
    const idx = db.localStore.chatMessages.findIndex(m => m.id === messageId);
    if (idx >= 0) {
      const msg = db.localStore.chatMessages[idx];
      if (!isAdmin && userId && msg.senderId !== userId) {
        throw new Error('Unauthorized to delete this message');
      }
      db.localStore.chatMessages.splice(idx, 1);
      db.saveLocalData();
      deleted = true;
    }
    if (mysqlPool) {
      try {
        if (!isAdmin && userId) {
          const [res]: any = await mysqlPool.query('DELETE FROM lms_chat_messages WHERE id = ? AND senderId = ?', [messageId, userId]);
          if (res.affectedRows > 0) deleted = true;
        } else {
          const [res]: any = await mysqlPool.query('DELETE FROM lms_chat_messages WHERE id = ?', [messageId]);
          if (res.affectedRows > 0) deleted = true;
        }
      } catch (err) {
        console.error('[LmsDB] deleteChatMessage MySQL error:', err);
      }
    }
    return deleted;
  }

  async deleteChatRoom(roomId: string): Promise<boolean> {
    if (!db.localStore.chatRooms) db.localStore.chatRooms = [];
    db.localStore.chatRooms = db.localStore.chatRooms.filter(r => r.id !== roomId);
    if (db.localStore.chatMessages) {
      db.localStore.chatMessages = db.localStore.chatMessages.filter(m => m.roomId !== roomId);
    }
    db.saveLocalData();
    if (mysqlPool) {
      try {
        await mysqlPool.query('DELETE FROM lms_chat_messages WHERE roomId = ?', [roomId]);
        await mysqlPool.query('DELETE FROM lms_chat_rooms WHERE id = ?', [roomId]);
      } catch (err) {
        console.error('[LmsDB] deleteChatRoom MySQL error:', err);
      }
    }
    return true;
  }

  async blockUser(userId: string, isBlocked: boolean): Promise<boolean> {
    if (!(db.localStore as any).blockedUsers) (db.localStore as any).blockedUsers = [];
    const blockedList: string[] = (db.localStore as any).blockedUsers;
    if (isBlocked) {
      if (!blockedList.includes(userId)) {
        blockedList.push(userId);
      }
    } else {
      (db.localStore as any).blockedUsers = blockedList.filter(id => id !== userId);
    }
    db.saveLocalData();

    if (mysqlPool) {
      try {
        await mysqlPool.query('CREATE TABLE IF NOT EXISTS blocked_users (userId VARCHAR(255) PRIMARY KEY, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
        if (isBlocked) {
          await mysqlPool.query('INSERT IGNORE INTO blocked_users (userId) VALUES (?)', [userId]);
        } else {
          await mysqlPool.query('DELETE FROM blocked_users WHERE userId = ?', [userId]);
        }
      } catch (err) {
        console.error('[LmsDB] blockUser MySQL error:', err);
      }
    }
    return true;
  }

  async isUserBlocked(userId: string): Promise<boolean> {
    const blockedList: string[] = (db.localStore as any).blockedUsers || [];
    if (blockedList.includes(userId)) return true;
    if (mysqlPool) {
      try {
        await mysqlPool.query('CREATE TABLE IF NOT EXISTS blocked_users (userId VARCHAR(255) PRIMARY KEY, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
        const [rows]: any = await mysqlPool.query('SELECT userId FROM blocked_users WHERE userId = ? LIMIT 1', [userId]);
        return rows && rows.length > 0;
      } catch (err) {
        console.error('[LmsDB] isUserBlocked MySQL error:', err);
      }
    }
    return false;
  }

  async getBlockedUsers(): Promise<string[]> {
    const list: string[] = (db.localStore as any).blockedUsers || [];
    if (mysqlPool) {
      try {
        await mysqlPool.query('CREATE TABLE IF NOT EXISTS blocked_users (userId VARCHAR(255) PRIMARY KEY, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
        const [rows]: any = await mysqlPool.query('SELECT userId FROM blocked_users');
        if (rows && rows.length > 0) {
          return rows.map((r: any) => r.userId);
        }
      } catch (err) {
        console.error('[LmsDB] getBlockedUsers MySQL error:', err);
      }
    }
    return list;
  }

  // ── Quiz Methods ──────────────────────────────────────────────────────────
  async createQuiz(data: any): Promise<any> {
    const { v4: uuid } = await import('uuid');
    const id = data.id || `quiz-${Date.now()}`;
    const quiz = {
      id,
      courseId: data.courseId,
      lessonId: data.lessonId || null,
      title: data.title,
      description: data.description || '',
      timeLimitMins: Number(data.timeLimitMins || 30),
      passingScore: Number(data.passingScore || 40.00),
      isPublished: data.isPublished ? 1 : 0,
      createdAt: new Date().toISOString()
    };

    if (mysqlPool) {
      try {
        await mysqlPool.query(
          'INSERT INTO lms_quizzes (id, courseId, lessonId, title, description, timeLimitMins, passingScore, isPublished) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE courseId = VALUES(courseId), title = VALUES(title), description = VALUES(description), timeLimitMins = VALUES(timeLimitMins), passingScore = VALUES(passingScore), isPublished = VALUES(isPublished)',
          [quiz.id, quiz.courseId, quiz.lessonId, quiz.title, quiz.description, quiz.timeLimitMins, quiz.passingScore, quiz.isPublished]
        );
        const idx = lmsLocalQuizzes.findIndex(q => q.id === id);
        if (idx >= 0) lmsLocalQuizzes[idx] = { ...lmsLocalQuizzes[idx], ...quiz };
        else lmsLocalQuizzes.push(quiz);
        db.saveLocalData();
        return quiz;
      } catch (err) {
        console.error('[LmsDB] createQuiz MySQL error:', err);
        throw err;
      }
    }
    const idx = lmsLocalQuizzes.findIndex(q => q.id === id);
    if (idx >= 0) lmsLocalQuizzes[idx] = { ...lmsLocalQuizzes[idx], ...quiz };
    else lmsLocalQuizzes.push(quiz);
    db.saveLocalData();
    return quiz;
  }

  async updateQuiz(id: string, data: any): Promise<boolean> {
    if (mysqlPool) {
      try {
        await mysqlPool.query(
          'UPDATE lms_quizzes SET title = ?, description = ?, timeLimitMins = ?, passingScore = ?, isPublished = ? WHERE id = ?',
          [data.title, data.description, Number(data.timeLimitMins || 30), Number(data.passingScore || 40.00), data.isPublished ? 1 : 0, id]
        );
        const idx = lmsLocalQuizzes.findIndex(q => q.id === id);
        if (idx >= 0) {
          lmsLocalQuizzes[idx] = { ...lmsLocalQuizzes[idx], title: data.title, description: data.description, timeLimitMins: Number(data.timeLimitMins || 30), passingScore: Number(data.passingScore || 40.00), isPublished: data.isPublished ? 1 : 0 };
        }
        db.saveLocalData();
        return true;
      } catch (err) {
        console.error('[LmsDB] updateQuiz MySQL error:', err);
        throw err;
      }
    }
    const idx = lmsLocalQuizzes.findIndex(q => q.id === id);
    if (idx >= 0) {
      lmsLocalQuizzes[idx] = {
        ...lmsLocalQuizzes[idx],
        title: data.title,
        description: data.description,
        timeLimitMins: Number(data.timeLimitMins || 30),
        passingScore: Number(data.passingScore || 40.00),
        isPublished: data.isPublished ? 1 : 0
      };
    }
    db.saveLocalData();
    return true;
  }

  async deleteQuiz(id: string): Promise<boolean> {
    if (mysqlPool) {
      try {
        await mysqlPool.query('DELETE FROM lms_quizzes WHERE id = ?', [id]);
        await mysqlPool.query('DELETE FROM lms_questions WHERE quizId = ?', [id]);
        const qIdx = lmsLocalQuizzes.findIndex(q => q.id === id);
        if (qIdx >= 0) lmsLocalQuizzes.splice(qIdx, 1);
        db.saveLocalData();
        return true;
      } catch (err) {
        console.error('[LmsDB] deleteQuiz MySQL error:', err);
        throw err;
      }
    }
    const qIdx = lmsLocalQuizzes.findIndex(q => q.id === id);
    if (qIdx >= 0) lmsLocalQuizzes.splice(qIdx, 1);
    db.saveLocalData();
    return true;
  }

  async getQuizById(id: string): Promise<any | null> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query('SELECT * FROM lms_quizzes WHERE id = ? LIMIT 1', [id]);
        if (rows && rows.length > 0) return rows[0];
      } catch (err) { console.error('[LmsDB] getQuizById MySQL error:', err); }
    }
    const foundLocal = lmsLocalQuizzes.find(q => q.id === id);
    if (foundLocal) return foundLocal;

    // Search inside testSeries localStore if stored locally
    const allTS = (db.localStore as any)?.testSeries || [];
    for (const ts of allTS) {
      if (ts.quizzes && Array.isArray(ts.quizzes)) {
        const match = ts.quizzes.find((q: any) => q.id === id);
        if (match) return match;
      }
    }
    return null;
  }

  async getQuizzesByCourseId(courseId: string): Promise<any[]> {
    if (mysqlPool) {
      try {
        const [tsRows]: any = await mysqlPool.query('SELECT id, slug FROM TestSeries WHERE id = ? OR slug = ? LIMIT 1', [courseId, courseId]);
        const primaryId = tsRows && tsRows.length > 0 ? tsRows[0].id : courseId;
        const slugId = tsRows && tsRows.length > 0 ? tsRows[0].slug : courseId;

        const [rows]: any = await mysqlPool.query('SELECT * FROM lms_quizzes WHERE courseId = ? OR courseId = ? ORDER BY createdAt DESC', [primaryId, slugId]);
        if (rows) return rows;
      } catch (err) { console.error('[LmsDB] getQuizzesByCourseId MySQL error:', err); }
    }
    const [tsRows]: any = await (mysqlPool ? mysqlPool.query('SELECT id, slug FROM TestSeries WHERE id = ? OR slug = ? LIMIT 1', [courseId, courseId]) : [[]]);
    const targetIds = tsRows && tsRows.length > 0 ? [tsRows[0].id, tsRows[0].slug] : [courseId];
    return lmsLocalQuizzes.filter(q => targetIds.includes(q.courseId));
  }

  // ── Question Methods ──────────────────────────────────────────────────────
  async createQuestion(data: any): Promise<any> {
    const { v4: uuid } = await import('uuid');
    const id = data.id || `q-${Date.now()}`;
    const question = {
      id,
      quizId: data.quizId,
      questionText: data.questionText,
      optionA: data.optionA,
      optionB: data.optionB,
      optionC: data.optionC,
      optionD: data.optionD,
      correctAnswer: data.correctAnswer,
      explanation: data.explanation || '',
      questionTextHi: data.questionTextHi || null,
      optionAHi: data.optionAHi || null,
      optionBHi: data.optionBHi || null,
      optionCHi: data.optionCHi || null,
      optionDHi: data.optionDHi || null,
      explanationHi: data.explanationHi || null,
      marks: Number(data.marks || 1.00),
      negativeMarks: Number(data.negativeMarks || 0.33),
      orderIndex: Number(data.orderIndex || 1)
    };

    if (mysqlPool) {
      try {
        try {
          await mysqlPool.query(
            'INSERT INTO lms_questions (id, quizId, questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation, questionTextHi, optionAHi, optionBHi, optionCHi, optionDHi, explanationHi, marks, negativeMarks, orderIndex) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [question.id, question.quizId, question.questionText, question.optionA, question.optionB, question.optionC, question.optionD, question.correctAnswer, question.explanation, question.questionTextHi, question.optionAHi, question.optionBHi, question.optionCHi, question.optionDHi, question.explanationHi, question.marks, question.negativeMarks, question.orderIndex]
          );
        } catch (colErr) {
          // Fallback if optional Hindi columns are not in MySQL schema
          await mysqlPool.query(
            'INSERT INTO lms_questions (id, quizId, questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation, marks, negativeMarks, orderIndex) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [question.id, question.quizId, question.questionText, question.optionA, question.optionB, question.optionC, question.optionD, question.correctAnswer, question.explanation, question.marks, question.negativeMarks, question.orderIndex]
          );
        }
        const idx = lmsLocalQuestions.findIndex(q => q.id === question.id);
        if (idx >= 0) lmsLocalQuestions[idx] = question;
        else lmsLocalQuestions.push(question);
        return question;
      } catch (err) {
        console.error('[LmsDB] createQuestion MySQL error:', err);
        throw err;
      }
    }
    const idx = lmsLocalQuestions.findIndex(q => q.id === question.id);
    if (idx >= 0) lmsLocalQuestions[idx] = question;
    else lmsLocalQuestions.push(question);
    return question;
  }

  async updateQuestion(id: string, data: any): Promise<boolean> {
    if (mysqlPool) {
      try {
        await mysqlPool.query(
          'UPDATE lms_questions SET questionText = ?, optionA = ?, optionB = ?, optionC = ?, optionD = ?, correctAnswer = ?, explanation = ?, questionTextHi = ?, optionAHi = ?, optionBHi = ?, optionCHi = ?, optionDHi = ?, explanationHi = ?, marks = ?, negativeMarks = ? WHERE id = ?',
          [data.questionText, data.optionA, data.optionB, data.optionC, data.optionD, data.correctAnswer, data.explanation, data.questionTextHi || null, data.optionAHi || null, data.optionBHi || null, data.optionCHi || null, data.optionDHi || null, data.explanationHi || null, Number(data.marks || 1.00), Number(data.negativeMarks || 0.33), id]
        );
        const idx = lmsLocalQuestions.findIndex(q => q.id === id);
        if (idx >= 0) lmsLocalQuestions[idx] = { ...lmsLocalQuestions[idx], ...data };
        return true;
      } catch (err) { console.error('[LmsDB] updateQuestion MySQL error:', err); }
    }
    const idx = lmsLocalQuestions.findIndex(q => q.id === id);
    if (idx >= 0) lmsLocalQuestions[idx] = { ...lmsLocalQuestions[idx], ...data };
    return true;
  }

  async deleteQuestion(id: string): Promise<boolean> {
    if (mysqlPool) {
      try {
        await mysqlPool.query('DELETE FROM lms_questions WHERE id = ?', [id]);
        const qIdx = lmsLocalQuestions.findIndex(q => q.id === id);
        if (qIdx >= 0) lmsLocalQuestions.splice(qIdx, 1);
        return true;
      } catch (err) { console.error('[LmsDB] deleteQuestion MySQL error:', err); }
    }
    const qIdx = lmsLocalQuestions.findIndex(q => q.id === id);
    if (qIdx >= 0) lmsLocalQuestions.splice(qIdx, 1);
    return true;
  }

  async getQuestionsByQuizId(quizId: string): Promise<any[]> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query('SELECT * FROM lms_questions WHERE quizId = ? ORDER BY orderIndex ASC', [quizId]);
        if (rows && rows.length > 0) return rows;
      } catch (err) { console.error('[LmsDB] getQuestionsByQuizId MySQL error:', err); }
    }
    return lmsLocalQuestions.filter(q => q.quizId === quizId);
  }

  // ── Assignment Methods (Mains Tests & Submissions) ────────────────────────────────────
  async createAssignment(data: any): Promise<any> {
    const { v4: uuid } = await import('uuid');
    const id = data.id || `assign-${Date.now()}`;
    const assign = {
      id,
      courseId: data.courseId || null,
      testSeriesId: data.testSeriesId || null,
      lessonId: data.lessonId || null,
      title: data.title,
      description: data.description || '',
      questionPaperUrl: data.questionPaperUrl || '',
      syllabus: data.syllabus || '',
      dueDate: data.dueDate || '',
      maxMarks: Number(data.maxMarks || 100),
      submissionType: data.submissionType || 'pdf',
      isPublished: data.isPublished ? 1 : 0
    };

    if (mysqlPool) {
      try {
        await mysqlPool.query(
          'INSERT INTO lms_assignments (id, courseId, testSeriesId, lessonId, title, description, questionPaperUrl, syllabus, dueDate, maxMarks, submissionType, isPublished) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [assign.id, assign.courseId, assign.testSeriesId, assign.lessonId, assign.title, assign.description, assign.questionPaperUrl, assign.syllabus, assign.dueDate, assign.maxMarks, assign.submissionType, assign.isPublished]
        );
        return assign;
      } catch (err) { console.error('[LmsDB] createAssignment MySQL error:', err); }
    }
    return assign;
  }

  async updateAssignment(id: string, data: any): Promise<boolean> {
    if (mysqlPool) {
      try {
        await mysqlPool.query(
          'UPDATE lms_assignments SET title = ?, description = ?, questionPaperUrl = ?, syllabus = ?, dueDate = ?, maxMarks = ?, submissionType = ?, isPublished = ? WHERE id = ?',
          [data.title, data.description, data.questionPaperUrl || '', data.syllabus || '', data.dueDate, Number(data.maxMarks || 100), data.submissionType, data.isPublished ? 1 : 0, id]
        );
        return true;
      } catch (err) { console.error('[LmsDB] updateAssignment MySQL error:', err); }
    }
    return true;
  }

  async deleteAssignment(id: string): Promise<boolean> {
    if (mysqlPool) {
      try {
        await mysqlPool.query('DELETE FROM lms_assignments WHERE id = ?', [id]);
        await mysqlPool.query('DELETE FROM lms_assignment_submissions WHERE assignmentId = ?', [id]);
        return true;
      } catch (err) { console.error('[LmsDB] deleteAssignment MySQL error:', err); }
    }
    return true;
  }

  async getAssignmentById(id: string): Promise<any | null> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query('SELECT * FROM lms_assignments WHERE id = ? LIMIT 1', [id]);
        return rows && rows.length > 0 ? rows[0] : null;
      } catch (err) { console.error('[LmsDB] getAssignmentById MySQL error:', err); }
    }
    return null;
  }

  async getAssignmentsByCourseId(courseId: string): Promise<any[]> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query('SELECT * FROM lms_assignments WHERE courseId = ? ORDER BY createdAt DESC', [courseId]);
        return rows;
      } catch (err) { console.error('[LmsDB] getAssignmentsByCourseId MySQL error:', err); }
    }
    return [];
  }

  async getAssignmentsByTestSeriesId(testSeriesId: string): Promise<any[]> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query('SELECT * FROM lms_assignments WHERE testSeriesId = ? AND isPublished = 1 ORDER BY createdAt DESC', [testSeriesId]);
        return rows;
      } catch (err) { console.error('[LmsDB] getAssignmentsByTestSeriesId MySQL error:', err); }
    }
    return [];
  }

  async getAllMainsAssignments(): Promise<any[]> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query(
          `SELECT a.*, ts.title as testSeriesTitle, ex.name as examName
           FROM lms_assignments a
           LEFT JOIN TestSeries ts ON ts.id = a.testSeriesId
           LEFT JOIN Exam ex ON ex.id = ts.examId
           WHERE a.isPublished = 1
           ORDER BY a.createdAt DESC`
        );
        return rows;
      } catch (err) { console.error('[LmsDB] getAllMainsAssignments MySQL error:', err); }
    }
    return [];
  }

  async submitAssignmentResponse(userId: string, assignmentId: string, submissionUrl: string, submissionText?: string): Promise<any> {
    const { v4: uuid } = await import('uuid');
    const id = uuid();
    const sub = { id, userId, assignmentId, submissionUrl, submissionText: submissionText || null, submittedAt: new Date(), status: 'Submitted' };
    if (mysqlPool) {
      try {
        await mysqlPool.query(
          'INSERT INTO lms_assignment_submissions (id, userId, assignmentId, submissionUrl, submissionText, status) VALUES (?, ?, ?, ?, ?, ?)',
          [id, userId, assignmentId, submissionUrl || null, submissionText || null, 'Submitted']
        );
        return sub;
      } catch (err) { console.error('[LmsDB] submitAssignmentResponse MySQL error:', err); }
    }
    return sub;
  }

  async getAssignmentSubmissions(assignmentId: string): Promise<any[]> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query(
          `SELECT s.*, u.fullName, u.email
           FROM lms_assignment_submissions s
           JOIN users u ON u.id = s.userId
           WHERE s.assignmentId = ?
           ORDER BY s.submittedAt DESC`,
          [assignmentId]
        );
        return rows;
      } catch (err) { console.error('[LmsDB] getAssignmentSubmissions MySQL error:', err); }
    }
    return [];
  }

  async getStudentMainsSubmissions(userId: string): Promise<any[]> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query(
          `SELECT s.*, a.title as testTitle, a.maxMarks, a.questionPaperUrl, a.syllabus, ts.title as testSeriesTitle, ex.name as examName
           FROM lms_assignment_submissions s
           JOIN lms_assignments a ON a.id = s.assignmentId
           LEFT JOIN TestSeries ts ON ts.id = a.testSeriesId
           LEFT JOIN Exam ex ON ex.id = ts.examId
           WHERE s.userId = ?
           ORDER BY s.submittedAt DESC`,
          [userId]
        );
        return rows;
      } catch (err) { console.error('[LmsDB] getStudentMainsSubmissions MySQL error:', err); }
    }
    return [];
  }

  async getStudentSubmissionForTest(userId: string, assignmentId: string): Promise<any | null> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query(
          'SELECT * FROM lms_assignment_submissions WHERE userId = ? AND assignmentId = ? ORDER BY submittedAt DESC LIMIT 1',
          [userId, assignmentId]
        );
        return rows && rows.length > 0 ? rows[0] : null;
      } catch (err) { console.error('[LmsDB] getStudentSubmissionForTest MySQL error:', err); }
    }
    return null;
  }

  async getAllMainsSubmissionsForAdmin(): Promise<any[]> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query(
          `SELECT s.*, u.fullName as studentName, u.email as studentEmail, a.title as testTitle, a.maxMarks, ts.title as testSeriesTitle
           FROM lms_assignment_submissions s
           JOIN users u ON u.id = s.userId
           JOIN lms_assignments a ON a.id = s.assignmentId
           LEFT JOIN TestSeries ts ON ts.id = a.testSeriesId
           ORDER BY s.submittedAt DESC`
        );
        return rows;
      } catch (err) { console.error('[LmsDB] getAllMainsSubmissionsForAdmin MySQL error:', err); }
    }
    return [];
  }

  async evaluateMainsSubmission(submissionId: string, data: { grade?: number; feedback?: string; evaluatedCopyUrl?: string; status?: string }): Promise<boolean> {
    if (mysqlPool) {
      try {
        const status = data.status || 'Evaluated';
        await mysqlPool.query(
          `UPDATE lms_assignment_submissions 
           SET grade = ?, feedback = ?, evaluatedCopyUrl = ?, status = ?, evaluatedAt = NOW() 
           WHERE id = ?`,
          [data.grade !== undefined ? data.grade : null, data.feedback || '', data.evaluatedCopyUrl || null, status, submissionId]
        );
        return true;
      } catch (err) { console.error('[LmsDB] evaluateMainsSubmission MySQL error:', err); }
    }
    return true;
  }

  async createOrGetQuizSession(userId: string, quizId: string, durationMins: number): Promise<any> {
    const { v4: uuid } = await import('uuid');
    
    // Check if an IN_PROGRESS session already exists
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query(
          'SELECT * FROM lms_quiz_attempts WHERE userId = ? AND quizId = ? AND status = "IN_PROGRESS" LIMIT 1',
          [userId, quizId]
        );
        if (rows && rows.length > 0) {
          const sess = rows[0];
          return {
            id: sess.id,
            userId: sess.userId,
            quizId: sess.quizId,
            setCode: sess.setCode || 'SET-A',
            seed: sess.seed || `seed-${sess.id}`,
            startedAt: sess.startedAt,
            expiresAt: sess.expiresAt,
            status: sess.status,
            answers: typeof sess.answers === 'string' ? JSON.parse(sess.answers || '{}') : (sess.answers || {})
          };
        }
      } catch (err) { console.error('[LmsDB] createOrGetQuizSession select MySQL error:', err); }
    }

    // Create new session
    const id = `att-${uuid()}`;
    const setCodes = ['SET-A', 'SET-B', 'SET-C', 'SET-D'];
    const setCode = setCodes[Math.floor(Math.random() * setCodes.length)];
    const seed = `seed-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (durationMins || 60) * 60 * 1000);

    const session = {
      id,
      userId,
      quizId,
      setCode,
      seed,
      startedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: 'IN_PROGRESS',
      answers: {}
    };

    if (mysqlPool) {
      try {
        await mysqlPool.query(
          'INSERT INTO lms_quiz_attempts (id, userId, quizId, setCode, seed, status, startedAt, expiresAt, answers) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [session.id, session.userId, session.quizId, session.setCode, session.seed, session.status, now, expiresAt, '{}']
        );
      } catch (err) { console.error('[LmsDB] createOrGetQuizSession insert MySQL error:', err); }
    }

    return session;
  }

  async saveQuizAnswer(userId: string, attemptId: string, questionId: string, answer: string): Promise<boolean> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query(
          'SELECT answers, status, expiresAt FROM lms_quiz_attempts WHERE id = ? AND userId = ? LIMIT 1',
          [attemptId, userId]
        );
        if (!rows || rows.length === 0) return false;
        
        const row = rows[0];
        if (row.status === 'SUBMITTED') return false; // Lock submitted attempt

        let currentAnswers: Record<string, string> = {};
        try {
          currentAnswers = typeof row.answers === 'string' ? JSON.parse(row.answers || '{}') : (row.answers || {});
        } catch (_) {}

        currentAnswers[questionId] = answer;
        const answersJson = JSON.stringify(currentAnswers);

        await mysqlPool.query(
          'UPDATE lms_quiz_attempts SET answers = ? WHERE id = ? AND userId = ?',
          [answersJson, attemptId, userId]
        );
        return true;
      } catch (err) { console.error('[LmsDB] saveQuizAnswer MySQL error:', err); }
    }
    return true;
  }

  async submitQuizAttempt(userId: string, quizId: string, answers: any, score: number, maxScore: number, passed: boolean, timeTakenSecs: number, attemptId?: string): Promise<any> {
    const { v4: uuid } = await import('uuid');
    const id = attemptId || uuid();
    const answersJson = JSON.stringify(answers);
    const passedVal = passed ? 1 : 0;
    const now = new Date();

    const attemptObj = { id, userId, quizId, answers, score, maxScore, passed, timeTakenSecs, status: 'SUBMITTED', submittedAt: now.toISOString() };
    const existingIdx = lmsLocalAttempts.findIndex(a => a.id === id || (a.userId === userId && a.quizId === quizId));
    if (existingIdx >= 0) lmsLocalAttempts[existingIdx] = attemptObj;
    else lmsLocalAttempts.push(attemptObj);

    if (mysqlPool) {
      try {
        // Upsert if session was created earlier
        await mysqlPool.query(
          `INSERT INTO lms_quiz_attempts (id, userId, quizId, answers, score, maxScore, passed, timeTakenSecs, status, submittedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', NOW())
           ON DUPLICATE KEY UPDATE
             answers = VALUES(answers),
             score = VALUES(score),
             maxScore = VALUES(maxScore),
             passed = VALUES(passed),
             timeTakenSecs = VALUES(timeTakenSecs),
             status = 'SUBMITTED',
             submittedAt = NOW()`,
          [id, userId, quizId, answersJson, score, maxScore, passedVal, timeTakenSecs]
        );
        return { id, userId, quizId, score, maxScore, passed, timeTakenSecs, submittedAt: now };
      } catch (err) { console.error('[LmsDB] submitQuizAttempt MySQL error:', err); }
    }

    return { id, userId, quizId, score, maxScore, passed, timeTakenSecs, submittedAt: now };
  }

  async getQuizAttempts(userId: string, quizId: string): Promise<any[]> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query(
          'SELECT * FROM lms_quiz_attempts WHERE userId = ? AND quizId = ? ORDER BY submittedAt DESC', [userId, quizId]
        );
        if (rows && rows.length > 0) {
          return rows.map((r: any) => ({ ...r, passed: !!r.passed, answers: typeof r.answers === 'string' ? JSON.parse(r.answers) : r.answers }));
        }
      } catch (err) { console.error('[LmsDB] getQuizAttempts MySQL error:', err); }
    }
    return lmsLocalAttempts.filter(a => a.userId === userId && a.quizId === quizId);
  }

  async getAllStudentQuizAttempts(userId: string): Promise<any[]> {
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query(
          `SELECT a.*, q.title as quizTitle, q.passingScore, q.timeLimitMins, ts.title as testSeriesTitle, ex.name as examName
           FROM lms_quiz_attempts a
           JOIN lms_quizzes q ON q.id = a.quizId
           LEFT JOIN TestSeries ts ON ts.id = q.courseId
           LEFT JOIN Exam ex ON ex.id = ts.examId
           WHERE a.userId = ?
           ORDER BY a.submittedAt DESC`,
          [userId]
        );
        if (rows && rows.length > 0) {
          return rows.map((r: any) => ({
            ...r,
            passed: !!r.passed,
            answers: typeof r.answers === 'string' ? JSON.parse(r.answers) : r.answers
          }));
        }
      } catch (err) { console.error('[LmsDB] getAllStudentQuizAttempts MySQL error:', err); }
    }

    const userAttempts = lmsLocalAttempts.filter(a => a.userId === userId);
    return userAttempts.map(att => {
      const q = lmsLocalQuizzes.find(item => item.id === att.quizId);
      return {
        ...att,
        quizTitle: q?.title || 'Prelims Mock Test',
        passingScore: q?.passingScore || 40,
        timeLimitMins: q?.timeLimitMins || 60,
        testSeriesTitle: 'Prelims Test Series',
        examName: 'Prelims Exam'
      };
    });
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

  // ── Analytics & Performance Metrics ────────────────────────────────────────
  async getStudentProgressMetrics(userId: string): Promise<any> {
    try {
      // 1. Get course completions from user enrollments
      const enrollments = await this.getUserEnrollments(userId);
      const courseCompletion = enrollments.map((e: any) => ({
        courseId: e.courseId,
        title: e.title,
        completedLessons: Number(e.completedLessons || 0),
        totalLessons: Number(e.totalLessons || 0),
        completionPercentage: Number(e.completionPercentage || 0)
      }));

      // 2. Get quiz analytics if quiz_attempts table exists
      let quizAnalytics: any[] = [];
      if (mysqlPool) {
        try {
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
          if (Array.isArray(quizRows)) {
            quizAnalytics = quizRows.map((q: any) => ({
              quizId: q.quizId,
              averageScore: Number(q.averageScore || 0),
              maxScore: Number(q.maxScore || 0),
              attemptsCount: Number(q.attemptsCount || 0),
              passesCount: Number(q.passesCount || 0)
            }));
          }
        } catch (quizErr) {
          // Table doesn't exist yet or query failed — return empty list
        }
      }

      return {
        courseCompletion,
        quizAnalytics
      };
    } catch (err) {
      console.error('[LmsDB] getStudentProgressMetrics error:', err);
      return { courseCompletion: [], quizAnalytics: [] };
    }
  }

  // ── DAILY QUIZ CMS & PERSISTENCE METHODS ────────────────────────────────────

  private async initDailyQuizTables() {
    if (mysqlPool) {
      try {
        await mysqlPool.query(`
          CREATE TABLE IF NOT EXISTS daily_quizzes (
            id VARCHAR(100) PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            publishDate VARCHAR(20) NOT NULL,
            timeLimitMins INT DEFAULT 10,
            totalQuestions INT DEFAULT 10,
            difficulty VARCHAR(50) DEFAULT 'MEDIUM',
            category VARCHAR(100) DEFAULT 'Daily Practice',
            attemptsCount INT DEFAULT 0,
            passingScore INT DEFAULT 40,
            isFree TINYINT(1) DEFAULT 1,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `);

        await mysqlPool.query(`
          CREATE TABLE IF NOT EXISTS daily_quiz_questions (
            id VARCHAR(100) PRIMARY KEY,
            quizId VARCHAR(100) NOT NULL,
            questionText TEXT NOT NULL,
            optionA TEXT NOT NULL,
            optionB TEXT NOT NULL,
            optionC TEXT NOT NULL,
            optionD TEXT NOT NULL,
            correctAnswer ENUM('A','B','C','D') NOT NULL,
            explanation TEXT,
            questionTextHi TEXT,
            optionAHi TEXT,
            optionBHi TEXT,
            optionCHi TEXT,
            optionDHi TEXT,
            explanationHi TEXT,
            marks FLOAT DEFAULT 1.0,
            negativeMarks FLOAT DEFAULT 0.33,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (quizId) REFERENCES daily_quizzes(id) ON DELETE CASCADE
          )
        `);

        try {
          await mysqlPool.query('ALTER TABLE daily_quiz_questions ADD COLUMN questionTextHi TEXT, ADD COLUMN optionAHi TEXT, ADD COLUMN optionBHi TEXT, ADD COLUMN optionCHi TEXT, ADD COLUMN optionDHi TEXT, ADD COLUMN explanationHi TEXT');
        } catch (_) {}
      } catch (err) {
        console.error('[LmsDB] initDailyQuizTables MySQL error:', err);
      }
    }
  }

  public async getAllDailyQuizzes(): Promise<any[]> {
    await this.initDailyQuizTables();
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query('SELECT * FROM daily_quizzes ORDER BY publishDate DESC, createdAt DESC');
        if (Array.isArray(rows) && rows.length > 0) {
          return rows.map((r: any) => ({
            ...r,
            isFree: Boolean(r.isFree)
          }));
        }
      } catch (err) {
        console.error('[LmsDB] getAllDailyQuizzes MySQL error:', err);
      }
    }

    const store = (db.localStore as any).dynamicDailyQuizzes || [];
    return store;
  }

  public async getDailyQuizById(id: string): Promise<any | null> {
    const list = await this.getAllDailyQuizzes();
    return list.find((q: any) => q.id === id) || null;
  }

  public async saveDailyQuiz(quiz: any): Promise<any> {
    await this.initDailyQuizTables();
    const id = quiz.id || `dq-${Date.now()}`;
    const record = {
      id,
      title: quiz.title || 'Daily Practice Quiz',
      description: quiz.description || '',
      publishDate: quiz.publishDate || new Date().toISOString().split('T')[0],
      timeLimitMins: Number(quiz.timeLimitMins || 10),
      totalQuestions: Number(quiz.totalQuestions || 10),
      difficulty: quiz.difficulty || 'MEDIUM',
      category: quiz.category || 'Daily Practice',
      attemptsCount: Number(quiz.attemptsCount || 0),
      passingScore: Number(quiz.passingScore || 40),
      isFree: 1
    };

    if (mysqlPool) {
      try {
        await mysqlPool.query(
          `INSERT INTO daily_quizzes (id, title, description, publishDate, timeLimitMins, totalQuestions, difficulty, category, attemptsCount, passingScore, isFree)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             title = VALUES(title),
             description = VALUES(description),
             publishDate = VALUES(publishDate),
             timeLimitMins = VALUES(timeLimitMins),
             totalQuestions = VALUES(totalQuestions),
             difficulty = VALUES(difficulty),
             category = VALUES(category),
             attemptsCount = VALUES(attemptsCount),
             passingScore = VALUES(passingScore),
             isFree = VALUES(isFree)`,
          [record.id, record.title, record.description, record.publishDate, record.timeLimitMins, record.totalQuestions, record.difficulty, record.category, record.attemptsCount, record.passingScore, record.isFree]
        );
      } catch (err) {
        console.error('[LmsDB] saveDailyQuiz MySQL error:', err);
      }
    }

    if (!(db.localStore as any).dynamicDailyQuizzes) {
      (db.localStore as any).dynamicDailyQuizzes = [];
    }
    const store = (db.localStore as any).dynamicDailyQuizzes;
    const idx = store.findIndex((q: any) => q.id === record.id);
    if (idx >= 0) {
      store[idx] = { ...record, isFree: true };
    } else {
      store.unshift({ ...record, isFree: true });
    }
    db.saveLocalData();
    return { ...record, isFree: true };
  }

  public async deleteDailyQuiz(id: string): Promise<boolean> {
    await this.initDailyQuizTables();
    if (mysqlPool) {
      try {
        await mysqlPool.query('DELETE FROM daily_quizzes WHERE id = ?', [id]);
      } catch (err) {
        console.error('[LmsDB] deleteDailyQuiz MySQL error:', err);
      }
    }

    if ((db.localStore as any).dynamicDailyQuizzes) {
      (db.localStore as any).dynamicDailyQuizzes = (db.localStore as any).dynamicDailyQuizzes.filter((q: any) => q.id !== id);
      db.saveLocalData();
    }
    return true;
  }

  public async getDailyQuizQuestions(quizId: string): Promise<any[]> {
    await this.initDailyQuizTables();
    if (mysqlPool) {
      try {
        const [rows]: any = await mysqlPool.query('SELECT * FROM daily_quiz_questions WHERE quizId = ? ORDER BY createdAt ASC', [quizId]);
        if (Array.isArray(rows) && rows.length > 0) {
          return rows;
        }
      } catch (err) {
        console.error('[LmsDB] getDailyQuizQuestions MySQL error:', err);
      }
    }

    const store = (db.localStore as any).dynamicDailyQuestions || {};
    return store[quizId] || [];
  }

  public async saveDailyQuizQuestion(quizId: string, q: any): Promise<any> {
    await this.initDailyQuizTables();
    const id = q.id || `q-${Date.now()}`;
    const question = {
      id,
      quizId,
      questionText: q.questionText || '',
      optionA: q.optionA || '',
      optionB: q.optionB || '',
      optionC: q.optionC || '',
      optionD: q.optionD || '',
      correctAnswer: q.correctAnswer || 'A',
      explanation: q.explanation || '',
      marks: Number(q.marks || 1.0),
      negativeMarks: Number(q.negativeMarks || 0.33)
    };

    if (mysqlPool) {
      try {
        await mysqlPool.query(
          `INSERT INTO daily_quiz_questions (id, quizId, questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation, marks, negativeMarks)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             questionText = VALUES(questionText),
             optionA = VALUES(optionA),
             optionB = VALUES(optionB),
             optionC = VALUES(optionC),
             optionD = VALUES(optionD),
             correctAnswer = VALUES(correctAnswer),
             explanation = VALUES(explanation),
             marks = VALUES(marks),
             negativeMarks = VALUES(negativeMarks)`,
          [question.id, question.quizId, question.questionText, question.optionA, question.optionB, question.optionC, question.optionD, question.correctAnswer, question.explanation, question.marks, question.negativeMarks]
        );
      } catch (err) {
        console.error('[LmsDB] saveDailyQuizQuestion MySQL error:', err);
      }
    }

    if (!(db.localStore as any).dynamicDailyQuestions) {
      (db.localStore as any).dynamicDailyQuestions = {};
    }
    const store = (db.localStore as any).dynamicDailyQuestions;
    if (!store[quizId]) store[quizId] = [];
    const idx = store[quizId].findIndex((item: any) => item.id === question.id);
    if (idx >= 0) {
      store[quizId][idx] = question;
    } else {
      store[quizId].push(question);
    }
    db.saveLocalData();
    return question;
  }

  public async deleteDailyQuizQuestion(quizId: string, qId: string): Promise<boolean> {
    await this.initDailyQuizTables();
    if (mysqlPool) {
      try {
        await mysqlPool.query('DELETE FROM daily_quiz_questions WHERE id = ?', [qId]);
      } catch (err) {
        console.error('[LmsDB] deleteDailyQuizQuestion MySQL error:', err);
      }
    }

    if ((db.localStore as any).dynamicDailyQuestions && (db.localStore as any).dynamicDailyQuestions[quizId]) {
      (db.localStore as any).dynamicDailyQuestions[quizId] = (db.localStore as any).dynamicDailyQuestions[quizId].filter((item: any) => item.id !== qId);
      db.saveLocalData();
    }
    return true;
  }

  public async exportBackup(): Promise<any> {
    return db.exportBackup();
  }

  public async importBackup(data: any): Promise<boolean> {
    return db.importBackup(data);
  }
}

export const lmsDB = new LmsDB();


