# Final Attempt IAS Platform — Master Administrator Operations Manual & System Reference Guide

> [!IMPORTANT]
> **Zero Code Modification Paradigm**: The Final Attempt IAS Web Architecture operates on a **100% Dynamic Content Management Paradigm**. Every section of the application—including Homepage Hero Banners, Announcements, Course Catalogs, Test Series Ingestion Engines, Daily Current Affairs Multi-Tier Compilations, PYQs, NCERTs, Book Order Pipelines, Mains Answer Evaluations, Live Chat, and Feature Flags—is controlled dynamically from the Admin CMS Interface (`/admin`) without needing code changes, database migrations, or server restarts.

---

## 📑 Master Table of Contents
- [1. Executive System Architecture & Security Model](#1-executive-system-architecture--security-model)
  - [1.1 Admin Portal Entry & Authentication Matrix](#11-admin-portal-entry--authentication-matrix)
  - [1.2 Session State Persistence & Tab Routing](#12-session-state-persistence--tab-routing)
  - [1.3 Multi-Theme & Indic Language Subsystem](#13-multi-theme--indic-language-subsystem)
- [2. System Dashboard & Disaster Recovery Console](#2-system-dashboard--disaster-recovery-console)
  - [2.1 Real-Time Analytics & Operational KPI Cards](#21-real-time-analytics--operational-kpi-cards)
  - [2.2 Health Subsystem & Offline Resilience Engine](#22-health-subsystem--offline-resilience-engine)
  - [2.3 One-Click Database Backup, Export & Restoration](#23-one-click-database-backup-export--restoration)
  - [2.4 YouTube Automated Channel Video Sync Engine](#24-youtube-automated-channel-video-sync-engine)
- [3. Global Branding, Homepage & Site Configuration CMS](#3-global-branding-homepage--site-configuration-cms)
  - [3.1 Homepage Hero Banner & Slider Management](#31-homepage-hero-banner--slider-management)
  - [3.2 Ticker Bar & Announcement Marquee System](#32-ticker-bar--announcement-marquee-system)
  - [3.3 About Us, Vision, Mission & Methodology CMS](#33-about-us-vision-mission--methodology-cms)
  - [3.4 Contact Information, Maps & Social Channels](#34-contact-information-maps--social-channels)
- [4. Courses & LMS Program Management](#4-courses--lms-program-management)
  - [4.1 Course Catalog Architecture & Fields](#41-course-catalog-architecture--fields)
  - [4.2 Creating, Modifying & Publishing Courses](#42-creating-modifying--publishing-courses)
  - [4.3 Course Deletion & Archival Protocols](#43-course-deletion--archival-protocols)
  - [4.4 Student Enrollment & Payment Inspection Console](#44-student-enrollment--payment-inspection-console)
- [5. Test Series & Mock Exam Engine](#5-test-series--mock-exam-engine)
  - [5.1 Program Structure: Series ➔ Test Papers ➔ Questions](#51-program-structure-series--test-papers--questions)
  - [5.2 Creating & Configuring Test Papers (Prelims / Mains)](#52-creating--configuring-test-papers-prelims--mains)
  - [5.3 Universal AI Copy-Paste Ingestion Engine](#53-universal-ai-copy-paste-ingestion-engine)
  - [5.4 PDF & Document Parser Integration](#54-pdf--document-parser-integration)
  - [5.5 Question Formatting: Match Lists, Tables & Indic Text](#55-question-formatting-match-lists-tables--indic-text)
  - [5.6 Question Editor & Manual Override Controls](#56-question-editor--manual-override-controls)
- [6. Daily Quiz CMS](#6-daily-quiz-cms)
  - [6.1 Daily Practice MCQ Creation Pipeline](#61-daily-practice-mcq-creation-pipeline)
  - [6.2 Managing Explanations & Answer Verification](#62-managing-explanations--answer-verification)
  - [6.3 Student Performance & Attempt Analytics](#63-student-performance--attempt-analytics)
- [7. Current Affairs Engine (Daily ➔ Weekly ➔ Monthly ➔ Yearly)](#7-current-affairs-engine-daily--weekly--monthly--yearly)
  - [7.1 Daily Edition Creation & Multi-Category Categorization](#71-daily-edition-creation--multi-category-categorization)
  - [7.2 Article Creation: WYSIWYG, Context & Exam Relevance](#72-article-creation-wysiwyg-context--exam-relevance)
  - [7.3 Automated Search Engine Optimization (SEO) Subsystem](#73-automated-search-engine-optimization-seo-subsystem)
  - [7.4 One-Click Automated Aggregation Matrix](#74-one-click-automated-aggregation-matrix)
- [8. PYQs (Previous Year Questions) Manager CMS](#8-pyqs-previous-year-questions-manager-cms)
  - [8.1 Subject & Exam Categorization Matrix](#81-subject--exam-categorization-matrix)
  - [8.2 Adding & Editing PYQ Papers with Solutions](#82-adding--editing-pyq-papers-with-solutions)
- [9. NCERT Books & Resource Subsystem CMS](#9-ncert-books--resource-subsystem-cms)
  - [9.1 Class 6th to 12th Book Chapter Structuring](#91-class-6th-to-12th-book-chapter-structuring)
  - [9.2 Linking PDF Assets & Direct Media Uploads](#92-linking-pdf-assets--direct-media-uploads)
- [10. Publications Store & Book Orders CMS](#10-publications-store--book-orders-cms)
  - [10.1 Hardcopy Book Catalog Management](#101-hardcopy-book-catalog-management)
  - [10.2 Order Fulfillment Pipeline (Pending ➔ Delivered)](#102-order-fulfillment-pipeline-pending--delivered)
  - [10.3 Dispatch Tracking & SMS/Email Notification Triggers](#103-dispatch-tracking--smsemail-notification-triggers)
- [11. Blogs, Editorial Articles & Content CMS](#11-blogs-editorial-articles--content-cms)
  - [11.1 Authoring Rich-Text Articles with Media Embeds](#111-authoring-rich-text-articles-with-media-embeds)
  - [11.2 Multilingual Metadata (English & Hindi)](#112-multilingual-metadata-english--hindi)
  - [11.3 Granular SEO Parameters & Canonical Tags](#113-granular-seo-parameters--canonical-tags)
- [12. Useful Documents, Rapid Revision & Toppers Copies](#12-useful-documents-rapid-revision--toppers-copies)
  - [12.1 High-Yield Value Addition Notes Management](#121-high-yield-value-addition-notes-management)
  - [12.2 Topper Evaluated Answer Scripts Subsystem](#122-topper-evaluated-answer-scripts-subsystem)
- [13. Mains Answer Evaluation CMS](#13-mains-answer-evaluation-cms)
  - [13.1 Student Answer Submission Queue](#131-student-answer-submission-queue)
  - [13.2 Faculty Allocation & Copy Evaluation Workflow](#132-faculty-allocation--copy-evaluation-workflow)
  - [13.3 Feedback, Rubrics & Score Release Pipeline](#133-feedback-rubrics--score-release-pipeline)
- [14. Live Student Support & 1-on-1 Chat Panel](#14-live-student-support--1-on-1-chat-panel)
  - [14.1 Messaging Interface & Student Context Inspection](#141-messaging-interface--student-context-inspection)
  - [14.2 Real-time Message Dispatch & Attachment Transfer](#142-real-time-message-dispatch--attachment-transfer)
- [15. User Accounts, Faculty & Lead Management](#15-user-accounts-faculty--lead-management)
  - [15.1 User Role Management (Student ➔ Faculty ➔ Admin)](#151-user-role-management-student--faculty--admin)
  - [15.2 Account Deactivation & Access Revocation](#152-account-deactivation--access-revocation)
  - [15.3 Lead Tracking Pipeline & CSV Export Console](#153-lead-tracking-pipeline--csv-export-console)
- [16. Cloud Media Library & Asset Manager](#16-cloud-media-library--asset-manager)
  - [16.1 Uploading, Cropping & Image Optimization](#161-uploading-cropping--image-optimization)
  - [16.2 Document Storage & Permanent CDN URL Generation](#162-document-storage--permanent-cdn-url-generation)
- [17. Custom Landing Pages CMS](#17-custom-landing-pages-cms)
  - [17.1 Custom Route Generation (`/p/[slug]`)](#171-custom-route-generation-pslug)
  - [17.2 Dynamic HTML/Markdown Layout Engine](#172-dynamic-htmlmarkdown-layout-engine)
- [18. Super Admin Console & Dynamic Feature Flags](#18-super-admin-console--dynamic-feature-flags)
  - [18.1 Master Privileges & Security Tokens](#181-master-privileges--security-tokens)
  - [18.2 Real-Time Module Feature Flag Toggles](#182-real-time-module-feature-flag-toggles)
- [19. Operational Summary & Quick Reference Matrix](#19-operational-summary--quick-reference-matrix)

---

## 1. Executive System Architecture & Security Model

The **Final Attempt IAS** administration suite (`/admin`) is an enterprise-grade control center designed to grant complete dynamic control over all database entities, content items, media uploads, and student interactions.

### 1.1 Admin Portal Entry & Authentication Matrix

To access the Admin Portal, open any modern web browser and navigate to:
`https://your-domain.com/admin`

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FINAL ATTEMPT IAS ADMIN CMS                     │
│                                                                        │
│   Email Address:    [ admin@finalattempt.com                         ] │
│   Password:         [ ••••••••••••••••                               ] │
│                                                                        │
│   [  SIGN IN TO ADMIN CONSOLE  ]                                       │
│                                                                        │
│   * Mode 1: Standard Admin (Email: admin@finalattempt.com)            │
│   * Mode 2: Super Admin Master Access (Email: superadmin@...)          │
└────────────────────────────────────────────────────────────────────────┘
```

The system employs a dual-tiered role-based authentication matrix:

| Access Role | Login Email | Password | Privileges & Scope |
| :--- | :--- | :--- | :--- |
| **Standard Administrator** | `admin@finalattempt.com` | `Password123` | Full CMS operational control: Courses, Test Series, Current Affairs, Blogs, Daily Quizzes, PYQs, NCERTs, Books, Orders, Chats, Leads, and Media Library. |
| **Super Administrator** | `superadmin@finalattempt.com` | `SuperAdminSecret#2026` | Everything in Standard Admin + **Master Console Access**, **Feature Flag Toggles**, Database Maintenance, User Privilege Elevation, and System Logs. |

> [!NOTE]
> Upon successful login, the application sets secure authorization tokens in browser storage:
> - Standard Token: `admin_token = finalattempt-admin-token-secure-hash`
> - Super Admin Token: `admin_token = finalattempt-superadmin-master-access-key-999` & `is_super_admin = true`.

---

### 1.2 Session State Persistence & Tab Routing

To prevent workflow disruption when refreshing pages or navigating away, the Admin Portal incorporates automatic tab state synchronization:

- **State Persistence**: Whenever an administrator switches tabs (e.g., from *Courses* to *Test Series*), the active tab key is stored in browser `localStorage` under `admin_active_tab`.
- **URL Query Synchronization**: The portal updates the URL query string dynamically (e.g., `https://your-domain.com/admin?tab=Current+Affairs`).
- **Tab Restore Mechanism**: On page reload or opening a bookmarked admin link, the system reads `urlParams` first, falls back to `localStorage`, and restores the exact working workspace.

---

### 1.3 Multi-Theme & Indic Language Subsystem

Located at the top-right header of the Admin Navigation bar are two global context controls:

1. 🌙 / ☀️ **Theme Toggle**: Switch dynamically between **Dark Mode** (slate background with high-contrast amber/emerald accents) and **Light Mode** (clean white/gray layout).
2. 🌐 **Locale Switcher**: Toggle the interface context between **English** (`en`) and **Hindi** (`hi`). This forces preview cards, form inputs, and system prompts to render in the selected language.

---

## 2. System Dashboard & Disaster Recovery Console

The **Dashboard** tab (`activeTab === 'Dashboard'`) is the centralized monitoring station for key business metrics, system diagnostics, automated channel sync, and full-database backup operations.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SYSTEM METRICS DASHBOARD                        │
├──────────────┬──────────────┬──────────────┬──────────────┬────────────┤
│ TOTAL        │ ACTIVE       │ TEST SERIES  │ PENDING      │ DAILY      │
│ STUDENTS     │ COURSES      │ PROGRAMS     │ LEADS        │ QUIZZES    │
│   14,250     │     18       │     32       │    142       │    450     │
└──────────────┴──────────────┴──────────────┴──────────────┴────────────┘
```

### 2.1 Real-Time Analytics & Operational KPI Cards

The top metric ribbon renders 5 live metric counters fetched from the backend database APIs:
- **Total Students**: Total registered user accounts with `role === 'student'`.
- **Active Courses**: Number of LMS courses published and open for public enrollment (`isPublished === true`).
- **Test Series Programs**: Number of active Prelims & Mains test series programs.
- **Pending Leads**: Unassigned prospective student inquiries captured from contact forms.
- **Daily Quizzes**: Total count of published daily practice MCQ sets.

---

### 2.2 Health Subsystem & Offline Resilience Engine

The portal maintains a continuous health check query targeting `/api/settings`.
- **Normal Operation**: When the Node.js/Express backend API is online, data is live-synced to PostgreSQL/SQLite stores.
- **Offline / Standalone Fallback**: If the server becomes temporarily unreachable due to network maintenance, an emergency banner appears:
  > [!WARNING]
  > **Backend Offline Mode (Running with local mock storage)**  
  > The CMS will automatically read and persist temporary edits in local browser IndexedDB/LocalStorage state until connection is restored.

---

### 2.3 One-Click Database Backup, Export & Restoration

The platform includes a robust **Disaster Recovery Subsystem** that serializes all database tables into a single JSON file.

#### Step-by-Step Procedure: Exporting a Database Backup
1. Navigate to the **Dashboard** tab in the Admin sidebar.
2. Locate the card titled **Database Backup & Disaster Recovery**.
3. Click the button labeled **Export Database Backup (.JSON)**.
4. The system will compile all database tables (`settings`, `courses`, `test_programs`, `questions`, `current_affairs`, `blogs`, `users`, `leads`, `orders`, `resources`, `pyqs`, `ncerts`) into a timestamped file:
   `finalattempt_db_backup_2026-09-16.json`
5. Save this file to a secure off-site cloud folder or local external storage.

#### Step-by-Step Procedure: Restoring a Database Backup
1. In the **Database Backup & Disaster Recovery** card, locate the **Restore Database Backup** input.
2. Click **Choose File** and select a valid `.json` backup file.
3. A confirmation dialog will appear:
   `"Are you sure you want to restore database from backup file 'finalattempt_db_backup_...json'? This will restore all CMS records."`
4. Click **OK**.
5. The system parses the JSON structure, overwrites local database stores, re-indexes relations, and reloads the CMS view with fresh data.

> [!CAUTION]
> Restoring a backup JSON file will overwrite current database records with the contents of the backup file. Always export a fresh backup before performing a restore!

---

### 2.4 YouTube Automated Channel Video Sync Engine

The platform automatically integrates video content from the official YouTube Channel for syllabus strategies, topper interviews, and daily news analyses.

- **Automated Sync**: Background cron jobs sync the latest channel videos periodically.
- **Manual Force Sync Procedure**:
  1. Go to the **Dashboard** tab.
  2. Locate the **YouTube Channel Sync Console**.
  3. Inspect **Last Sync Status** (e.g., *Status: IDLE | Synced Videos: 124 | Last Sync: 2026-09-15 18:30*).
  4. Click **Sync YouTube Videos Now**.
  5. The backend calls YouTube Data API v3, pulls new video uploads, thumbnails, and descriptions, and updates the public Video Gallery.

---

## 3. Global Branding, Homepage & Site Configuration CMS

Global website text, hero slider banners, announcements ticker, About Us content, and contact links are managed across the **Home**, **About**, and **Contact** tabs.

```
┌────────────────────────────────────────────────────────────────────────┐
│                      HOMEPAGE HERO BANNER CMS EDITOR                   │
├────────────────────────────────────────────────────────────────────────┤
│ Hero Main Title:   [ 72nd BPSC Preparation Starts Here              ] │
│ Hero Subtitle:     [ Personalized mentorship, smart study tools...  ] │
│ Tagline:           [ One Mentor. One Strategy. One Final Attempt.   ] │
│ Hero Image URLs:   [ https://cdn.finalattempt.com/banners/hero1.jpg ] │
│                    [ [ Pick from Media Library ]                    ] │
│                                                                        │
│ [ SAVE HOMEPAGE SETTINGS ]                                             │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Homepage Hero Banner & Slider Management

1. Click the **Home** tab in the sidebar.
2. Update the Hero Configuration fields:
   - **Hero Main Title**: The primary `<h1>` text rendered on the homepage (e.g., *72nd BPSC Preparation Starts Here*).
   - **Hero Subtitle**: Sub-heading paragraph describing the program value proposition.
   - **Tagline**: Brand slogan (e.g., *One Mentor. One Strategy. One Final Attempt.*).
   - **Hero Image URLs**: Comma-separated image URLs for the homepage slider. Click **Pick from Media Library** to select images visually.
3. Click **Save Homepage Settings**. Changes take effect on the live website immediately.

---

### 3.2 Ticker Bar & Announcement Marquee System

The top announcement ticker marquee scrolls critical notices across all public pages (e.g., *New Batch for 72nd BPSC Prelims Starting from 25th Sept!*).

#### Step-by-Step Procedure: Adding a Marquee Announcement
1. Go to the **Home** tab and scroll to **Announcement Marquee Settings**.
2. Click **+ Add Announcement Line**.
3. Fill in fields:
   - **Date**: e.g., `16 Sep 2026`.
   - **Announcement Text**: Headline notice text.
   - **Target Link (Optional)**: Internal route (e.g., `/courses/72nd-bpsc-foundation`) or external URL.
   - **Highlight Badge**: Check **Highlight as NEW** to display a glowing amber badge next to the notice.
4. Click **Save Settings**.

#### Step-by-Step Procedure: Deleting an Announcement
1. Click the **Trash Icon** next to any announcement entry in the list.
2. Click **Save Settings**.

---

### 3.3 About Us, Vision, Mission & Methodology CMS

1. Click the **About** tab in the sidebar.
2. Edit content fields:
   - **About Page Main Title**: e.g., *Empowering Bihar's Future Civil Servants*.
   - **Subtitle**: Subheading snippet.
   - **Mission Statement**: Core institutional mission narrative.
   - **Vision Statement**: Long-term organizational vision.
   - **Core Values**: Bulleted foundational principles.
3. **Teaching Methodology Cards**:
   - Each card represents a pillar on the About Us page (e.g., *Pillar 1: Daily Answer Evaluation*, *Pillar 2: Standard Textbook Deconstruction*).
   - Click **+ Add Methodology Pillar** or edit existing Title & Description.
4. Click **Save About Us Content**.

---

### 3.4 Contact Information, Maps & Social Channels

1. Click the **Contact** tab.
2. Update corporate contact parameters:
   - **Office Address**: Physical headquarters address.
   - **Phone Number**: Primary helpline contact number (e.g., `+91 99999 99999`).
   - **Support Email**: Official inquiry email (e.g., `contact@finalattemptias.com`).
   - **Working Hours**: e.g., *Monday to Saturday: 9:00 AM – 7:00 PM*.
   - **WhatsApp Link**: Deep-link URL (e.g., `https://wa.me/919999999999?text=Hi%20Final%20Attempt`).
   - **Telegram Channel Link**: Official community link (`https://t.me/finalattemptias`).
   - **Google Maps Embed URL**: Embed URL from Google Maps `<iframe>` src tag.
3. Click **Save Contact Information**.

---

## 4. Courses & LMS Program Management

The **Courses** tab controls all paid and free course offerings, batch schedules, fees, discounts, and enrollment verification.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        COURSE CATALOG CMS ENGINE                       │
├────────────────────────────────────────────────────────────────────────┤
│ [ + ADD NEW COURSE ]                           Search: [ BPSC        ] │
│                                                                        │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ 72nd BPSC Prelims + Mains Integrated Foundation Batch 2026         │ │
│ │ Category: Foundation Batch | Exam: BPSC | Fee: ₹14,999 (Was ₹24,999)│ │
│ │ Status: [ PUBLISHED ] | Duration: 12 Months                        │ │
│ │ Action: [ EDIT ] [ VIEW ENROLLMENTS ] [ DELETE ]                   │ │
│ └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Course Catalog Architecture & Fields

Each Course record contains the following metadata fields:

| Field Name | Type | Description | Example / Allowed Values |
| :--- | :--- | :--- | :--- |
| `title` | String | Full public course title | *72nd BPSC Prelims + Mains Foundation 2026* |
| `exam` | String | Target competitive exam tag | `BPSC`, `UPSC`, `State PCS` |
| `category` | String | Course classification group | `Foundation Batch`, `Mains Special`, `Crash Course` |
| `description` | HTML/Text | Detailed syllabus & features overview | Rich HTML content with bullet points |
| `fee` | Number | Current selling price in INR | `14999` |
| `originalPrice` | Number | Original strike-through price | `24999` |
| `discount` | String | Auto-calculated discount badge | `40% OFF` |
| `duration` | String | Total validity / course duration | `12 Months` |
| `schedule` | String | Weekly class timings & days | `Mon-Sat (8:00 AM - 11:00 AM)` |
| `isPublished` | Boolean | Public catalog visibility status | `true` (Published) / `false` (Draft/Hidden) |

---

### 4.2 Creating, Modifying & Publishing Courses

#### Creating a Course:
1. Navigate to the **Courses** tab.
2. Click the **+ Add New Course** button.
3. Fill out the course modal form with all required parameters.
4. Ensure **Publish Status** toggle is switched **ON** if you want the course to appear immediately on the student store.
5. Click **Save Course**.

#### Modifying a Course:
1. Locate the course card in the list or use the search bar.
2. Click the **Edit** (pencil) button.
3. Update any field (e.g., change fee, extend schedule, or revise course description).
4. Click **Save Changes**.

---

### 4.3 Course Deletion & Archival Protocols

1. Locate the course card in the **Courses** list.
2. Click **Delete** (trash icon).
3. A safety confirmation modal appears:
   `"Are you sure you want to delete this course? Enrolled students will retain access to historical materials, but public enrollment will end."`
4. Confirm deletion. The course is removed from the public store catalog.

---

### 4.4 Student Enrollment & Payment Inspection Console

1. On any course card, click **View Course Details / Enrollments** (or navigate to `/admin/courses/[courseId]`).
2. The **Enrollment Roster Console** displays:
   - **Student Full Name**, **Email Address**, **Mobile Number**.
   - **Payment Order ID** (Razorpay / Gateway Transaction ID).
   - **Payment Status**: `SUCCESS` (Green) or `PENDING` (Amber).
   - **Amount Paid**: Exact fee transaction value.
   - **Enrollment Date & Time Stamp**.

---

## 5. Test Series & Mock Exam Engine

The **Test Series** CMS (`TestSeriesAdmin.tsx`) is a specialized assessment platform supporting complex Prelims MCQs, Mains Descriptive Papers, Universal AI Copy-Paste Text Ingestion, OCR Document Processing, and automatic bilingual side-by-side table formatting.

```
┌────────────────────────────────────────────────────────────────────────┐
│                    TEST SERIES MOCK EXAM ENGINE                        │
├────────────────────────────────────────────────────────────────────────┤
│ PROGRAM: 72nd BPSC Prelims Master Test Series 2026                     │
│ TEST PAPER: Full Length Mock Test - 01 (General Studies)                │
│ TOTAL QUESTIONS: 150 | DURATION: 120 Mins | MARKS: 150 (+1.0 / -0.33)  │
├────────────────────────────────────────────────────────────────────────┤
│ INGESTION TOOLS:                                                       │
│ [ 📋 BULK COPY-PASTE TEXT INGESTION ]  [ 📄 UPLOAD PDF / DOCX FILE ]   │
└────────────────────────────────────────────────────────────────────────┘
```

### 5.1 Program Structure: Series ➔ Test Papers ➔ Questions

The test engine organizes content hierarchically:
```
Test Program (e.g., 72nd BPSC Prelims Test Series)
 ├── Test Paper 01 (Full Length Mock 1 - 150 Questions)
 │    ├── Q1 (Bilingual Text + Match Table + Option A-E + Solution)
 │    ├── Q2 ...
 │    └── Q150
 └── Test Paper 02 (Subject Wise: Polity & History)
```

---

### 5.2 Creating & Configuring Test Papers (Prelims / Mains)

1. Click **Test Series** tab in the sidebar.
2. Click **+ Create New Test Program** ➔ Enter Program Title, Target Exam, Price, and Banner Image ➔ Click **Save Program**.
3. Click on the newly created Program card to open its **Test Papers Console**.
4. Click **+ Add New Test Paper** and configure test parameters:
   - **Test Title**: e.g., *Full Length Mock Test - 01 (General Studies)*.
   - **Test Type**: Select `Prelims MCQ` or `Mains Descriptive`.
   - **Total Duration (Minutes)**: e.g., `120`.
   - **Total Questions**: e.g., `150`.
   - **Total Marks**: e.g., `150`.
   - **Positive Marking per Question**: e.g., `1.0`.
   - **Negative Marking per Question**: e.g., `0.33`.
5. Click **Create Test Paper**.

---

### 5.3 Universal AI Copy-Paste Ingestion Engine

Administrators can copy-paste an entire 150-question document directly into the system. The parser automatically detects question boundaries, options, answers, and explanations regardless of formatting variations!

#### Step-by-Step Procedure: Using Copy-Paste Ingestion
1. Open the target Test Paper in **Test Series Admin**.
2. Click **Bulk Copy-Paste Text Ingestion**.
3. Paste raw document text into the ingestion textarea.
4. Click **Parse & Preview Questions**.
5. The system executes high-speed boundary classification:
   - **Section Splitting**: Automatically handles 4-section format (Section 1: English Questions, Section 2: Hindi Questions, Section 3: English Answers, Section 4: Hindi Answers) OR 2-section format (Questions -> Solutions).
   - **Regex Boundary Robustness**: Handles complex header patterns such as `21. इस प्रश्न का सही उत्तर (b)` and `74. सही उत्तर चूना पत्थर (Limestone) होता है` without losing explanation text or skipping questions.
6. Inspect the **Live Ingestion Preview Table**.
7. If all 150 questions display correctly with options and answers mapped, click **Save All Questions to Test Paper**.

---

### 5.4 PDF & Document Parser Integration

1. In the Test Paper Manager, click **Upload Document (PDF/Docx)**.
2. Select a PDF file from your local disk.
3. The backend document engine runs OCR font normalization (`cleanText`), strips non-printable control bytes, segments QnA blocks, aligns bilingual versions, and displays the preview grid.
4. Click **Confirm & Import Questions**.

---

### 5.5 Question Formatting: Match Lists, Tables & Indic Text

The platform includes automatic text formatters in `questionFormatter.ts`:

- **Match List-I & List-II Tables**: Questions containing matching pairs (e.g., *Match List-I with List-II* or *सूची-I को सूची-II से सुमेलित कीजिए*) are automatically reformatted into clean, responsive HTML side-by-side tables.
- **Markdown Table Support**: Markdown pipe tables (`| Column 1 | Column 2 |`) are parsed into interactive web tables.
- **Indic Text Normalization**: Hindi Unicode text is normalized (`NFC`), repairing broken font glyphs and jumbled complex conjuncts.

---

### 5.6 Question Editor & Manual Override Controls

- **Manual Edit**: Click **Edit Question** next to any parsed question to manually revise Question Text (English/Hindi), Options A–E, Correct Answer (`A`/`B`/`C`/`D`/`E`), or Explanation Text.
- **Reorder Questions**: Drag or change Question Numbers (`questionNumber`) to re-sequence test papers.
- **Delete Question**: Click **Delete** to remove a specific question.

---

## 6. Daily Quiz CMS

The **Daily Quiz** tab manages daily Prelims practice MCQ sets for students.

```
┌────────────────────────────────────────────────────────────────────────┐
│                           DAILY QUIZ CMS                               │
├────────────────────────────────────────────────────────────────────────┤
│ [ + ADD DAILY QUIZ ]                           Filter: [ 2026-09-16  ] │
│                                                                        │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ Date: 16 Sep 2026 | Topic: Indian Polity - Executive Powers       │ │
│ │ Target: BPSC / UPSC | Total Questions: 10 | Language: Bilingual     │ │
│ │ Action: [ EDIT QUESTIONS ] [ VIEW STATS ] [ DELETE ]               │ │
│ └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### 6.1 Daily Practice MCQ Creation Pipeline

1. Click **Daily Quiz** tab in the sidebar.
2. Click **+ Add Daily Quiz**.
3. Configure Quiz Metadata:
   - **Publication Date**: e.g., `2026-09-16`.
   - **Subject / Topic Title**: e.g., *Indian Polity - Constitutional Bodies & Commissions*.
   - **Target Exam Tag**: `BPSC`, `UPSC`, `State PCS`.
   - **Language**: `English`, `Hindi`, or `Bilingual`.
4. Click **Save Quiz Metadata & Add Questions**.

---

### 6.2 Managing Explanations & Answer Verification

1. In the Quiz Questions modal, add questions sequentially.
2. For each question, fill in:
   - **Question Text** (English & Hindi).
   - **Option A, B, C, D, E** (English & Hindi).
   - **Correct Answer**: Select `Option A`, `Option B`, `Option C`, `Option D`, or `Option E`.
   - **Detailed Explanation**: Comprehensive solution rationale.
3. Click **Publish Daily Quiz**.

---

### 6.3 Student Performance & Attempt Analytics

Click **View Stats** on any Daily Quiz card to inspect student attempt analytics:
- **Total Student Attempts**.
- **Average Test Score (%)**.
- **Hardest Question Identification**: Percentage of students who selected incorrect choices per question.

---

## 7. Current Affairs Engine (Daily ➔ Weekly ➔ Monthly ➔ Yearly)

The **Current Affairs** CMS is a multi-tiered news publishing and compilation system.

```
┌────────────────────────────────────────────────────────────────────────┐
│                     CURRENT AFFAIRS NEWS ENGINE                        │
├────────────────────────────────────────────────────────────────────────┤
│ [ DAILY EDITIONS ]   [ COMPILATIONS & AUTOMATED AGGREGATION MATRIX ]    │
│                                                                        │
│ Select Date Range for Weekly Compilation:                              │
│ From: [ 2026-09-01 ]   To: [ 2026-09-07 ]   [ PREVIEW ] [ COMBINE NOW ]  │
│                                                                        │
│ Select Month for Monthly Magazine Compilation:                         │
│ Year: [ 2026 ]   Month: [ September (09) ]   [ PREVIEW ] [ COMBINE NOW ] │
└────────────────────────────────────────────────────────────────────────┘
```

### 7.1 Daily Edition Creation & Multi-Category Categorization

1. Click **Current Affairs** tab ➔ Click **+ Create Daily Edition**.
2. Set **Edition Date** (e.g., `2026-09-16`) ➔ Click **Create Edition**.
3. Add articles under 4 dedicated categories:
   - 🇮🇳 **NATIONAL**: National Policy, Governance, Economy, Environment.
   - 🌐 **INTERNATIONAL**: International Relations, Summits, Global Treaties.
   - 🏞️ **BIHAR SPECIAL**: State Current Affairs, Bihar Budget, Schemes.
   - ⛰️ **ARUNACHAL SPECIAL**: Northeast Development & State PCS Special.

---

### 7.2 Article Creation: WYSIWYG, Context & Exam Relevance

Click **+ Add Article** under any category and complete the article fields:
- **Article Title**: Main headline.
- **Summary**: 2-line summary for mobile cards.
- **Full Content**: Use the Rich Text Editor to format structured body text.
- **Why in News? / Context**: News background explanation.
- **Key Highlights & Analysis**: In-depth analytical points.
- **Exam Relevance**: GS Paper I/II/III relevance tags.
- **Mains Practice Question**: Practice question box for student response writing.

---

### 7.3 Automated Search Engine Optimization (SEO) Subsystem

The Current Affairs engine features an **Automated SEO Generator**:
- If SEO fields are left blank, the system automatically builds:
  - `seoTitle`: `${Article Title} | Final Attempt IAS`
  - `canonicalUrl`: `https://finalattemptias.com/current-affairs/daily/${date}/${category}/${slug}`
  - `seoKeywords`: Auto-extracted keywords from headline, category, and subjects.
  - `seoDescription`: Auto-truncated 155-character meta summary snippet.

---

### 7.4 One-Click Automated Aggregation Matrix

You can compile Daily Editions into Weekly, Monthly, and Yearly compilations without any manual copy-pasting!

```
Daily Editions (Sept 1 - Sept 7)
    │
    ├──► [ PREVIEW WEEKLY ] ──► Validates article count & category coverage
    │
    └──► [ COMBINE WEEKLY NOW ] ──► Auto-generates Weekly Compilation Issue!
```

#### Executing Weekly Aggregation:
1. Go to the **Compilations & Aggregation** sub-tab.
2. Under **Weekly Compilation**, select **From Date** and **To Date**.
3. Click **Preview Weekly**. Review article counts per category.
4. Click **Execute Weekly Combine**. The system builds a unified Weekly Current Affairs Digest issue!

#### Executing Monthly Aggregation:
1. Under **Monthly Compilation**, select **Year** (e.g., `2026`) and **Month** (e.g., `September (09)`).
2. Click **Preview Monthly** ➔ Click **Execute Monthly Combine**.

#### Executing Yearly Aggregation:
1. Under **Yearly Compilation**, select **Year** (e.g., `2026`).
2. Click **Execute Yearly Combine**.

---

## 8. PYQs (Previous Year Questions) Manager CMS

The **PYQ** tab (`PYQsManagerCMS.tsx`) organizes subject-wise and year-wise solved Previous Year Question papers.

### 8.1 Subject & Exam Categorization Matrix

PYQs are categorized along 3 key axes:
- **Target Exam**: `BPSC Prelims`, `BPSC Mains`, `UPSC CSE`, `State PCS`.
- **Exam Year**: `2025`, `2024`, `2023`, `2022`, etc.
- **Subject**: *Modern Indian History*, *Indian Polity*, *Geography & Environment*, *General Science*, *Bihar Special*.

---

### 8.2 Adding & Editing PYQ Papers with Solutions

1. Click **PYQ** tab in the sidebar.
2. Click **+ Add New PYQ Paper**.
3. Enter Details:
   - **Paper Name**: e.g., *70th BPSC Prelims General Studies Solved Paper (2024)*.
   - **Year**: `2024`.
   - **Subject**: *Full Paper / General Studies*.
   - **PDF Download URL**: Link to solved PDF.
4. Add questions with options, correct answer keys, and detailed solutions.
5. Click **Save PYQ Paper**.

---

## 9. NCERT Books & Resource Subsystem CMS

Manage Class 6th through 12th NCERT textbook chapter PDFs and summary notes in the **NCERT** tab (`NCERTBooksManagerCMS.tsx`).

### 9.1 Class 6th to 12th Book Chapter Structuring

1. Click **NCERT** tab.
2. Click **+ Add NCERT Book/Chapter**.
3. Select dropdown filters:
   - **Class**: `Class 6th` to `Class 12th`.
   - **Subject**: *History*, *Geography*, *Polity*, *Economics*, *Science*, *Environment*.
   - **Book Title**: e.g., *Our Pasts - III (Class 8 History)*.
   - **Chapter Title**: e.g., *Chapter 02 - From Trade to Territory*.
   - **Language**: `English` or `Hindi`.

---

### 9.2 Linking PDF Assets & Direct Media Uploads

- **PDF File URL**: Click **Pick from Media Library** to select a PDF uploaded to cloud media storage, or paste an external URL.
- Click **Save NCERT Resource**.

---

## 10. Publications Store & Book Orders CMS

Manage physical books, revision booklets, pricing, stock levels, and student shipping dispatch in the **Publications** and **Book Orders** tabs (`BookOrdersCMS.tsx`).

```
┌────────────────────────────────────────────────────────────────────────┐
│                     PUBLICATIONS & BOOK ORDERS CMS                     │
├────────────────────────────────────────────────────────────────────────┤
│ ORDER ID: ORD-2026-8841 | DATE: 15 Sep 2026                           │
│ STUDENT: Rahul Kumar | PHONE: +91 98765 43210                          │
│ BOOK: BPSC Mains GS Paper-I & II Master Guide (Qty: 1)                 │
│ ADDRESS: Flat 402, Shanti Complex, Boring Road, Patna, Bihar - 800001  │
│ STATUS: [ PENDING ▾ ]  ➔  UPDATE TO: [ SHIPPED ]                       │
│ COURIER: [ Delhivery      ]   TRACKING NO: [ DEL123456789IN          ] │
│                                                                        │
│ [ SAVE ORDER SHIPPING UPDATE ]                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### 10.1 Hardcopy Book Catalog Management

1. Click **Publications** tab ➔ Click **+ Add New Book**.
2. Configure Book details:
   - **Book Title**: e.g., *BPSC Mains GS Paper I & II Model Solved Answers*.
   - **Author / Publisher**: *Final Attempt Editorial Team*.
   - **Selling Price (₹)**: e.g., `499`.
   - **Original Price (₹)**: e.g., `799`.
   - **Delivery Charge (₹)**: e.g., `50`.
   - **Cover Image URL**: Pick from Media Library.
   - **Sample PDF Preview URL**: Chapter 1 sample PDF link.
   - **In Stock Status**: Toggle `In Stock` / `Out of Stock`.
3. Click **Save Book**.

---

### 10.2 Order Fulfillment Pipeline (Pending ➔ Delivered)

Incoming student orders progress through 4 fulfillment stages:
```
[ PENDING ] ──► [ PROCESSING ] ──► [ SHIPPED ] ──► [ DELIVERED ]
```

1. Click **Book Orders** tab.
2. Locate the student order in the orders grid.
3. Review Student Shipping Address, Pincode, Book Title, and Payment Verification (`PAID`).

---

### 10.3 Dispatch Tracking & SMS/Email Notification Triggers

1. Click **Update Order Status** on the target order row.
2. Select status **SHIPPED**.
3. Input **Courier Partner Name** (e.g., *Delhivery*, *India Post*, *BlueDart*).
4. Input **Tracking AWB Number** (e.g., *DEL987654321IN*).
5. Click **Save Order Shipping Update**.
6. The system sends an automated dispatch update notification to the student's phone and email!

---

## 11. Blogs, Editorial Articles & Content CMS

Publish SEO-optimized strategy blogs, syllabus guides, and toppers' insights in the **Blogs** tab.

### 11.1 Authoring Rich-Text Articles with Media Embeds

1. Click **Blogs** tab ➔ Click **+ Add New Blog Post**.
2. Complete post fields:
   - **Blog Title**: Headline.
   - **Category**: *Strategy*, *BPSC Updates*, *Mains Answer Writing*, *Exam Analysis*.
   - **Author Name**: e.g., *Mahendra Kumar (Founder)*.
   - **Read Time**: e.g., *6 min read*.
   - **Cover Image**: Upload or pick cover image from Media Library.
   - **Content**: Format text using the built-in **WYSIWYG Rich Text Editor** (supports headings `h2`/`h3`, blockquotes, code blocks, images, and tables).

---

### 11.2 Multilingual Metadata (English & Hindi)

- **English Fields**: `title`, `content`, `blurb`.
- **Hindi Fields**: `title_hi`, `content_hi`, `blurb_hi`.
- Toggle language preview tabs in the editor to inspect how the blog renders for English and Hindi readers.

---

### 11.3 Granular SEO Parameters & Canonical Tags

- **SEO Title**: Meta title tag (max 60 characters).
- **Meta Description**: Search snippet description (max 155 characters).
- **Keywords**: Comma-separated search tags (e.g., `bpsc preparation, 72nd bpsc syllabus`).
- **Canonical URL**: Self-referential or master source link.
- Click **Publish Blog Post**.

---

## 12. Useful Documents, Rapid Revision & Toppers Copies

Manage downloadable PDF notes, rapid revision booklets, and toppers' evaluated answer scripts across **Useful Documents**, **Rapid Revision**, **Value Addition**, and **Toppers Copies** tabs.

### 12.1 High-Yield Value Addition Notes Management

1. Click **Useful Documents** or **Value Addition** tab.
2. Click **+ Add New Document**.
3. Input **Document Title**, **Category** (e.g., *Bihar Budget Summary*, *Economic Survey Notes*), **File Size** (e.g., `3.5 MB`), and **PDF Cloud Link**.
4. Click **Save Document**.

---

### 12.2 Topper Evaluated Answer Scripts Subsystem

1. Click **Toppers Copies** tab ➔ Click **+ Add Topper Copy**.
2. Input fields:
   - **Topper Name**: e.g., *Anjali Sharma*.
   - **Rank & Exam**: *Rank 04 (69th BPSC)*.
   - **Exam Year**: `2024`.
   - **Subject / Paper**: *GS Paper I - History & Culture*.
   - **Evaluated PDF Link**: URL to copy PDF.
3. Click **Save Topper Copy**.

---

## 13. Mains Answer Evaluation CMS

The **Mains Evaluation** CMS (`MainsEvaluationCMS.tsx`) manages student Mains answer sheet uploads, faculty copy allocations, feedback rubrics, and marks release.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MAINS ANSWER EVALUATION CMS                     │
├────────────────────────────────────────────────────────────────────────┤
│ SUBMISSION ID: SUB-2026-4410 | DATE: 15 Sep 2026                        │
│ STUDENT: Vikram Singh | TEST: BPSC Mains GS-1 Full Length Mock         │
│ SUBMITTED FILE: [ 📄 Download Student Raw Copy.pdf ]                   │
│ STATUS: [ UNDER EVALUATION ]                                           │
├────────────────────────────────────────────────────────────────────────┤
│ FACULTY EVALUATION FORM:                                               │
│ Upload Evaluated Copy: [ 📄 Upload Annotated Copy with Corrections ]   │
│ Marks Awarded:         [ 185 ] / 300                                   │
│ Detailed Feedback:     [ Strong coverage of Modern History. Structure  ] │
│                        [ of Q3 requires clearer headings...          ] │
│                                                                        │
│ [ SUBMIT EVALUATION & RELEASE SCORE TO STUDENT ]                       │
└────────────────────────────────────────────────────────────────────────┘
```

### 13.1 Student Answer Submission Queue

1. Click **Mains Evaluation** tab in the sidebar.
2. Inspect the **Submissions Queue**:
   - **Submission ID**, **Student Name**, **Target Mock Test**, **Submission Timestamp**, and **Status** (`SUBMITTED` / `UNDER_EVALUATION` / `EVALUATED`).

---

### 13.2 Faculty Allocation & Copy Evaluation Workflow

1. Click **Evaluate Copy** on any pending submission row.
2. Click **Download Student Raw Copy.pdf** to download the student's submitted answer manuscript.
3. Faculty evaluates the manuscript offline or on a tablet and adds corrections/annotations.

---

### 13.3 Feedback, Rubrics & Score Release Pipeline

1. In the Evaluation Panel:
   - Click **Upload Annotated Copy** to attach the marked PDF script.
   - Input **Marks Awarded** (e.g., `185` out of `300`).
   - Input **Detailed Feedback & Evaluation Remarks**:
     - *Introduction & Context Alignment*
     - *Body Paragraphs & Diagrams/Maps Usage*
     - *Conclusion & Way Forward Quality*
2. Click **Submit Evaluation & Release Score**.
3. The evaluation status changes to `EVALUATED`, and the student receives a notification to download their evaluated copy from their dashboard.

---

## 14. Live Student Support & 1-on-1 Chat Panel

The **Student Chats** panel (`AdminChatPanel.tsx`) enables real-time 1-on-1 chat support between administrators/faculty and enrolled students.

### 14.1 Messaging Interface & Student Context Inspection

1. Click **Student Chats** tab in the sidebar.
2. **Left Panel (Student List)**: Displays active conversation threads sorted by recent message timestamps.
3. **Right Sidebar (Student Details)**: Clicking on a student conversation displays their profile snapshot:
   - Enrolled Courses & Test Series.
   - Target Exam (`BPSC`, `UPSC`).
   - Registration Date & Contact Info.

---

### 14.2 Real-time Message Dispatch & Attachment Transfer

1. Type your reply in the bottom message field.
2. Click **Attachment Icon** to upload PDF study notes, schedules, or image explanations.
3. Press **Enter** or click **Send**. Messages are delivered instantly to the student's mobile app and web dashboard via WebSocket/Realtime messaging channels.

---

## 15. User Accounts, Faculty & Lead Management

Manage registered student accounts, faculty privileges, prospective counselor leads, and access revocations from the **Users** and **Leads** tabs.

### 15.1 User Role Management (Student ➔ Faculty ➔ Admin)

1. Click **Users** tab.
2. Filter user accounts by role: `All`, `Student`, `Faculty`, `Admin`.
3. Search by Name, Mobile Number, or Email.
4. Click **View / Edit User Profile**:
   - Change **Role**: Elevate user from `student` to `faculty` or `admin`.
5. Click **Save Profile**.

---

### 15.2 Account Deactivation & Access Revocation

1. In the User Profile modal, locate **Account Status**.
2. Switch toggle from **Active** to **Inactive**.
3. Click **Save Profile**. The deactivated user is immediately logged out and blocked from accessing paid courses or test series.

---

### 15.3 Lead Tracking Pipeline & CSV Export Console

1. Click **Leads** tab.
2. View leads captured from public website inquiry forms.
3. Update Lead Status: `NEW` ➔ `CONTACTED` ➔ `COUNSELED` ➔ `ENROLLED`.
4. Click **Export Leads to CSV**. A `.csv` file downloads containing lead contact info for tele-counseling teams.

---

## 16. Cloud Media Library & Asset Manager

The **Media Library** (`MediaDashboard.tsx` & `MediaPicker.tsx`) is the central cloud storage repository for image banners, PDF documents, avatars, and assets.

### 16.1 Uploading, Cropping & Image Optimization

1. Click **Media Library** tab ➔ Click **Upload New Asset**.
2. Select files (`.jpg`, `.png`, `.webp`, `.pdf`).
3. The server automatically compresses images, generates WebP variants, crops standard thumbnail ratios, and uploads to cloud storage.

---

### 16.2 Document Storage & Permanent CDN URL Generation

- Hover over any media file card in the grid.
- Click **Copy URL**. The permanent CDN URL (e.g., `https://cdn.finalattempt.com/uploads/bpsc_banner_2026.webp`) is copied to your clipboard.
- Paste this URL into Course Banners, Hero Sliders, Blog Cover Images, or PDF Download links.

---

## 17. Custom Landing Pages CMS

Create dynamic landing pages (e.g., `https://your-domain.com/p/bpsc-mains-mentorship-2026`) without code changes using **Custom Pages CMS** (`CustomPagesCMS.tsx`).

### 17.1 Custom Route Generation (`/p/[slug]`)

1. Click **Custom Pages** module in the sidebar.
2. Click **+ Create Custom Page**.
3. Input:
   - **Page Title**: e.g., *Special BPSC Mains Mentorship Program 2026*.
   - **Page Slug**: e.g., `bpsc-mains-mentorship-2026`.

---

### 17.2 Dynamic HTML/Markdown Layout Engine

- Use the built-in HTML/Markdown editor to construct custom landing page layouts, pricing tables, hero sections, and FAQ accordions.
- Set custom **SEO Title** and **Meta Description**.
- Click **Publish Custom Page**. The page is immediately live at `/p/bpsc-mains-mentorship-2026`.

---

## 18. Super Admin Console & Dynamic Feature Flags

Exclusive to Super Administrators logged in with master credentials (`superadmin@finalattempt.com`).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SUPER ADMIN MASTER CONSOLE                      │
├────────────────────────────────────────────────────────────────────────┤
│ DYNAMIC FEATURE FLAGS & SYSTEM MODULE SWITCHES:                        │
│                                                                        │
│ [ ON  ] Enable Mains Evaluation Engine Subsystem                       │
│ [ ON  ] Enable 1-on-1 Live Student Support Chat                        │
│ [ ON  ] Enable Book Orders Cart & Shipping Checkout                    │
│ [ ON  ] Enable Rapid Revision Section Module                           │
│ [ OFF ] Enable Maintenance Mode Banner                                 │
│                                                                        │
│ SYSTEM DATABASE AUDIT:                                                 │
│ Total Tables: 14 | Storage Size: 42.8 MB | Cache Status: CLEAN        │
└────────────────────────────────────────────────────────────────────────┘
```

### 18.1 Master Privileges & Security Tokens

Super Admins hold master control over platform infrastructure, API keys, database vacuuming, and system feature flags.

---

### 18.2 Real-Time Module Feature Flag Toggles

Super Admins can turn website features ON or OFF in real time without restarting servers or writing code:

- **Enable Mains Evaluation Subsystem**: Toggle `ON` / `OFF`.
- **Enable Live Student Support Chat**: Toggle `ON` / `OFF`.
- **Enable Book Orders Shipping Checkout**: Toggle `ON` / `OFF`.
- **Enable Rapid Revision Section**: Toggle `ON` / `OFF`.
- **Enable Maintenance Mode**: Switch `ON` to display a temporary maintenance landing page to public visitors while performing admin tasks.

---

## 19. Operational Summary & Quick Reference Matrix

| Administrative Task | Target CMS Tab | Step-by-Step Procedure |
| :--- | :--- | :--- |
| **Update Homepage Banner & Slogan** | `Home` | Go to `Home` ➔ Edit Hero Title & Subtitle ➔ Pick Hero Images ➔ Click `Save Homepage Settings`. |
| **Add Announcement Ticker Notice** | `Home` | Go to `Home` ➔ Scroll to Announcement Marquee ➔ Click `+ Add Announcement` ➔ Enter Text & Target Link ➔ Check `Highlight as NEW` ➔ Click `Save Settings`. |
| **Create New Course Batch** | `Courses` | Go to `Courses` ➔ Click `+ Add New Course` ➔ Enter Fee, Schedule, & Description ➔ Toggle `Published: ON` ➔ Click `Save Course`. |
| **Import 150 Qs Test Paper** | `Test Series` | Go to `Test Series` ➔ Open Test Paper ➔ Click `Bulk Copy-Paste Ingestion` ➔ Paste raw text ➔ Click `Parse & Preview` ➔ Click `Save All Questions`. |
| **Add Daily Current Affairs Article** | `Current Affairs` | Go to `Current Affairs` ➔ Click `+ Create Daily Edition` ➔ Select Date ➔ Add Article under Category (National/International/Bihar/Arunachal) ➔ Save. |
| **Execute Monthly News Compilation** | `Current Affairs` | Go to `Current Affairs` ➔ Open `Compilations` sub-tab ➔ Select Year & Month ➔ Click `Preview Monthly` ➔ Click `Execute Monthly Combine`. |
| **Process Book Order Shipping** | `Book Orders` | Go to `Book Orders` ➔ Select Order ➔ Click `Update Order Status` ➔ Set to `SHIPPED` ➔ Input Courier & Tracking AWB ➔ Click `Save Order Shipping Update`. |
| **Evaluate Student Mains Script** | `Mains Evaluation` | Go to `Mains Evaluation` ➔ Select Student Copy ➔ Download Raw PDF ➔ Upload Faculty Annotated PDF + Award Marks & Feedback ➔ Click `Submit Evaluation`. |
| **Publish Blog Article** | `Blogs` | Go to `Blogs` ➔ Click `+ Add New Blog Post` ➔ Use WYSIWYG Editor ➔ Set Cover Image & Auto SEO ➔ Click `Publish Blog Post`. |
| **Full System Database Backup** | `Dashboard` | Go to `Dashboard` ➔ Scroll to `Database Backup & Disaster Recovery` ➔ Click `Export Database Backup (.JSON)`. |
| **Restore System from Backup** | `Dashboard` | Go to `Dashboard` ➔ Under `Restore Database Backup`, select `.JSON` file ➔ Confirm Dialog ➔ Database restores automatically. |

---

> [!TIP]
> **Administrative Best Practice**: Always export a fresh database backup from the **Dashboard** tab before importing new 150-question test series or altering course pricing structure. This guarantees a instant 1-click restore point!
