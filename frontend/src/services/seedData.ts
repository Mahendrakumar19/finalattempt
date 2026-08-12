export const courseData = [
  {
    id: 'bpsc-foundation',
    title: 'BPSC Foundation Batch',
    category: 'Foundation' as const,
    description: 'Complete coverage of Prelims & Mains syllabus with Bihar-specific modules.',
    duration: '12 Months',
    fee: '₹24,999',
    syllabus: [
      'General Studies Paper I (History, Art & Culture, International Relations)',
      'General Studies Paper II (Polity, Economy & Geography, Science & Technology)',
      'Bihar Special GK (History, Geography, Economy, Polity, and Budget)',
      'Essay Writing & Hindi Language Qualifying Paper',
      'Daily Mains Answer Writing Practice with Detailed Mentorship Feedback'
    ],
    features: [
      'Personalized 1-on-1 Strategy Session',
      'Daily Current Affairs Integration',
      'Weekly Answer Evaluation by Selected Mentors',
      'High-Yield Mind Maps & Summary Notes'
    ],
    schedule: 'Mon - Fri, 2 Hours Daily Classes (Recorded/Live)',
    faq: [
      { q: 'Is this batch suitable for absolute beginners?', a: 'Yes, it starts from basic NCERT concepts and builds up to advanced Mains topics.' },
      { q: 'Will study material be provided in Hindi medium?', a: 'Yes, study material is provided in bilingual formats (both English & Hindi).' }
    ],
    enrolledCount: 420
  },
  {
    id: 'bpsc-target',
    title: 'BPSC Target Batch (Prelims + Mains)',
    category: 'BPSC' as const,
    description: 'Comprehensive high-speed batch for serious aspirants preparing for the upcoming exam.',
    duration: '18 Months',
    fee: '₹39,999',
    syllabus: [
      'Comprehensive GS I & II Coverage',
      'Intense Prelims Crash Course & Topic Tests',
      'Mains Answer Writing & Evaluation Sessions',
      'Bihar Budget & Economy Special Focus Sessions'
    ],
    features: [
      'Personalized tracking',
      'Weekly Doubt Clearing Classes',
      'Comprehensive test analysis'
    ],
    schedule: 'Mon - Sat, 3 Hours Daily Classes',
    faq: [
      { q: 'Can working professionals attend?', a: 'Yes, classes are held in evening hours and recordings are available 24/7.' }
    ],
    enrolledCount: 280
  },
  {
    id: 'prelims-test-series',
    title: 'Prelims Test Series 2025',
    category: 'Prelims' as const,
    description: 'Sectional + Full Length Mock Tests with micro-level performance analysis.',
    duration: '40+ Tests',
    fee: '₹4,999',
    syllabus: [
      '20 Sectional Tests covering History, Geography, Polity, Science, Economy',
      '10 Bihar Special GK Exclusive Mock Tests',
      '10 Full Length Mock Tests simulating the exact BPSC pattern'
    ],
    features: [
      'Detailed Video Solutions',
      'All India Rank Dashboard',
      'Weak Areas Diagnostic Analytics'
    ],
    schedule: 'Every Sunday Morning 10:00 AM',
    faq: [
      { q: 'Do the tests have negative marking?', a: 'Yes, the tests use the exact official negative marking scheme.' }
    ],
    enrolledCount: 1500
  },
  {
    id: 'mains-answer-writing',
    title: 'Mains Answer Writing Program',
    category: 'Mains' as const,
    description: 'Answer writing practice with detailed evaluation, structure hints, and modal answers.',
    duration: '3 Months',
    fee: '₹6,999',
    syllabus: [
      'Daily 2 Question Writing Challenges',
      'Comprehensive Modal Answers for GS I & II',
      'Bespoke Feedback on Intro, Body, Conclusion & Flow'
    ],
    features: [
      'Personal evaluation within 48 hours',
      'Topper copy analysis webinar',
      'One-on-one call with evaluator',
      '10 Full Length Mock Tests simulating the exact BPSC pattern'
    ],
    schedule: 'Daily Self-paced submissions',
    faq: [
      { q: 'Who evaluates the answers?', a: 'Answers are evaluated by selected BPSC officers and experienced senior mentors.' }
    ],
    enrolledCount: 310
  },
  {
    id: 'interview-guidance',
    title: 'Interview Guidance Program',
    category: 'Interview' as const,
    description: 'Mock interviews with retired board members, DAF analysis & personality sessions.',
    duration: '5+ Mock Sessions',
    fee: '₹8,999',
    syllabus: [
      'Detailed Application Form (DAF) Analysis',
      'Bihar State Current Affairs & Issues Briefing',
      'Simulated Panel Mock Interviews with Retd. Officers'
    ],
    features: [
      'Video recordings of mock interviews',
      'Personalized body language & delivery tips',
      'Current affairs booklet'
    ],
    schedule: 'Flexible weekend slots',
    faq: [
      { q: 'Where are mock interviews held?', a: 'Both Offline in Patna/Delhi and Online via premium interactive interface.' }
    ],
    enrolledCount: 120
  },
  {
    id: 'bpsc-mentorship',
    title: 'BPSC Mentorship Program',
    category: 'Foundation' as const,
    description: 'Personalized strategy and mentorship for BPSC Civil Services aspirants.',
    duration: '12 Months',
    fee: '₹14,999',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop',
    highlights: [
      'Micro-scheduling of GS Syllabus & Optional Subject',
      'Regular performance audits & weekly milestone tracker',
      'Prelims CSAT + GS Mock strategy guidance'
    ],
    features: [
      'Direct WhatsApp access to selected mentor',
      'Weekly group brainstorming sessions',
      'High-yield study guides'
    ],
    schedule: 'Weekly scheduled 1-on-1 mentorship call',
    faq: [
      { q: 'Is this mentorship program class-based?', a: 'No, this is strategy and audit based to complement self-study or online coaching.' }
    ],
    enrolledCount: 190
  }
];

export const facultyData = [
  {
    id: 'praveen-sir',
    name: 'Praveen Sir',
    role: 'Polity & Governance',
    experience: '12+ Years',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400',
    bio: 'Renowned expert in Indian Constitution and Public Administration. Mentored over 500+ successful civil servants.',
    demoLectures: [
      { title: 'Federal Structure & Centre-State Relations', duration: '45 mins', url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4' },
      { title: 'Basic Structure Doctrine of the Constitution', duration: '60 mins', url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4' }
    ]
  },
  {
    id: 'vikash-sir',
    name: 'Vikash Sir',
    role: 'History & Culture',
    experience: '10+ Years',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400',
    bio: 'Specialist in Ancient India, Modern Indian National Movement, and Art & Culture with a visual storytelling style.',
    demoLectures: [
      { title: 'Revolt of 1857: Role of Kunwar Singh in Bihar', duration: '50 mins', url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4' }
    ]
  },
  {
    id: 'garima-mam',
    name: 'Garima Ma\'am',
    role: 'Geography & Environment',
    experience: '9+ Years',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    bio: 'IIT Graduate and geography analyst. Expert in climatology, biogeography, and map marking techniques.',
    demoLectures: [
      { title: 'Monsoon Patterns & Agriculture in Bihar', duration: '40 mins', url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4' }
    ]
  },
  {
    id: 'amit-sir',
    name: 'Amit Sir',
    role: 'Economics & Budget',
    experience: '8+ Years',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400',
    bio: 'Advisor on state economics. Breaks down complex financial concepts, economic surveys, and budgets with simplicity.',
    demoLectures: [
      { title: 'Key Highlights of Bihar Budget 2025-26', duration: '55 mins', url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4' }
    ]
  }
];

export const resultData = [
  { id: '1', name: 'Ankita Kumari', rank: 'AIR 23', exam: 'BPSC 69th', course: 'Mentorship Program', service: 'Deputy Collector', district: 'Patna', photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300', year: 2024, story: 'Studied with structured daily targets. Cleared in her final attempt with dedicated focus on writing.' },
  { id: '2', name: 'Rohit Verma', rank: 'Rank 45', exam: 'BPSC 69th', course: 'Foundation Batch', service: 'SDM', district: 'Gaya', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300', year: 2024, story: 'Balanced his work routine with evening recorded lectures and solved all 40 prelims mock test series.' },
  { id: '3', name: 'Shreya Sinha', rank: 'Rank 98', exam: 'BPSC 68th', course: 'Target Batch', service: 'DSP', district: 'Muzaffarpur', photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300', year: 2023, story: 'Focused entirely on Bihar Special GK and Science & Tech mock sessions. Cleared DSP in second attempt.' },
  { id: '4', name: 'Vikash Kumar', rank: 'Rank 156', exam: 'BPSC 68th', course: 'Mains Test Series', service: 'BDSO', district: 'Darbhanga', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300', year: 2023, story: 'Improved answer structure by integrating maps and flowcharts. Raised his GS II score by 35 marks.' },
  { id: '5', name: 'Pooja Priya', rank: 'Rank 215', exam: 'BPSC 68th', course: 'Mentorship Program', service: 'CO', district: 'Bhagalpur', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300', year: 2023, story: 'From a Hindi Medium background, Pooja utilized customized summaries and continuous answer mentorship.' }
];

export const currentAffairsData = [
  {
    id: 'ca-1',
    title: 'Supreme Court on Governor\'s Role in State Bills',
    category: 'National' as const,
    publishDate: '24 May 2025',
    summary: 'An analytical review of the Constitutional limits under Article 200 and the recent directions regarding delay in giving assent to assembly bills.',
    content: 'The Supreme Court of India recently re-emphasized that the Governor must return a bill to the legislature as soon as possible if they do not wish to give assent. Under Article 200 of the Constitution, the Governor cannot indefinitely keep a bill pending, as it hampers the democratic legislative process...'
  },
  {
    id: 'ca-2',
    title: 'RBI Monetary Policy Highlights - May 2025',
    category: 'Economy' as const,
    publishDate: '24 May 2025',
    summary: 'Detailed explanation of repo rate changes, inflation targeting strategies, and economic implications for BPSC Prelims.',
    content: 'The Monetary Policy Committee (MPC) maintained a focus on withdrawal of accommodation to ensure that inflation aligns with the target. While GDP growth remains strong at 7%, key supply side pressures in food inflation are keeping the central bank alert...'
  },
  {
    id: 'ca-3',
    title: 'Bihar Budget 2025-26: Key Highlights',
    category: 'Bihar Special' as const,
    publishDate: '23 May 2025',
    summary: 'A complete breakdown of capital expenditure allocation, education scheme boosts, and industrial growth initiatives in Bihar.',
    content: 'The Finance Minister of Bihar presented a growth-oriented budget emphasizing infrastructure, rural connectivity, and technical education. A record layout has been allocated to the Ganga water lift project and the expansion of medical colleges across districts...'
  },
  {
    id: 'ca-4',
    title: 'Global Biodiversity Outlook 2025 Released',
    category: 'Environment' as const,
    publishDate: '23 May 2025',
    summary: 'Key findings of the UN-backed report on species extinction rates, policy actions, and targets for international environment studies.',
    content: 'The report highlights that ecosystem degradation remains rapid, though localized restoration initiatives are showing success. For exams, remember the Kunming-Montreal Global Biodiversity Framework targets and India\'s national actions...'
  },
  {
    id: 'ca-5',
    title: 'India-UK FTA: Opportunities and Challenges',
    category: 'International' as const,
    publishDate: '23 May 2025',
    summary: 'Tracing the major bottlenecks in intellectual property rights, rules of origin, and service sectors, and the path forward.',
    content: 'Trade negotiations have reached a critical stage as both nations negotiate on services and mobility. The deal will have significant impacts on whiskey tariffs, automobile access, and IT professional movement...'
  }
];

export const pyqData = [
  { id: 'pyq-1', year: 2024, exam: 'BPSC Prelims', subject: 'Polity', question: 'Under which Article of the Constitution can the Governor reserve a Bill for the consideration of the President?', options: ['Article 200', 'Article 201', 'Article 72', 'Article 356'], answer: 'Article 200', explanation: 'Article 200 deals with the assent to Bills passed by the State Legislature and reservation of bills by the Governor.' },
  { id: 'pyq-2', year: 2023, exam: 'BPSC Mains', subject: 'History', question: 'Analyze the role of Kunwar Singh in the Revolt of 1857 in Bihar. What was the impact of this struggle?', options: [], answer: 'Written/Mains Question', explanation: 'Refer to key focus areas: Jagdishpur uprising, leadership qualities, coordination with other leaders like Nana Sahib, and inspiring national consciousness.' },
  { id: 'pyq-3', year: 2024, exam: 'BPSC Prelims', subject: 'Economy', question: 'With reference to the Indian economy, consider the Open Market Operations (OMO). What does it imply?', options: ['Buying and selling of government securities by RBI', 'Lending by commercial banks', 'Foreign exchange transactions', 'Corporate bond issues'], answer: 'Buying and selling of government securities by RBI', explanation: 'Open Market Operations (OMO) refers to the central bank\'s buying and selling of government securities in the open market to regulate liquidity.' }
];

export const blogData = [
  { id: 'blog-1', title: 'How to Master Bihar Special GK for BPSC Prelims & Mains', publishDate: '20 May 2025', readTime: '5 min read', category: 'Strategy', imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800', content: 'Bihar Special GK contributes over 25-30 questions in BPSC Prelims. Focus on: 1. Modern History of Bihar (Peasant movements, Congress sessions). 2. Physical Geography (Rivers, Soils). 3. Economic Survey...' },
  { id: 'blog-2', title: 'A working professional’s guide to cracking Civil Services', publishDate: '15 May 2025', readTime: '7 min read', category: 'Mentorship', imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800', content: 'Time is the biggest asset. Working professionals should design a clean 4-hour daily block: 2 hours in the morning for newspaper + GS, and 2 hours in the evening for answer writing and quizzes...' }
];

export const resourceData = [
  { id: 'res-1', title: 'Bihar Budget 2025-26 Summary PDF', size: '2.4 MB', type: 'PDF', downloadCount: 3400, url: '#' },
  { id: 'res-2', title: 'Modern Indian History Mind Map', size: '5.1 MB', type: 'Mind Map', downloadCount: 4500, url: '#' },
  { id: 'res-3', title: 'GS II Mains Model Answer Booklet', size: '3.8 MB', type: 'PDF', downloadCount: 1900, url: '#' }
];

export interface TestSeriesItem {
  id: string;
  examId?: string;
  stageId?: string | null;
  title: string;
  slug: string;
  category?: 'Prelims' | 'Mains' | 'PYQ' | 'Interview' | string | null;
  exam: string;
  language: 'English' | 'Hindi' | string;
  status: 'active' | 'coming_soon' | 'archived' | string;
  thumbnailUrl?: string;
  bannerUrl?: string;
  price: number;
  discountedPrice?: number;
  totalTests: number;
  totalQuestions: number;
  duration: string;
  description: string;
  highlights: string[];
  syllabus: { subject: string; topics: string[] }[];
  faq: { q: string; a: string }[];
  batchStartDate?: string;
  enrolledCount: number;
  validityDays: number;
  isPublished: boolean;
  displayOrder: number;
  // Comparison & Schedule Table Extension Fields
  moduleCode?: string;
  medium?: 'English' | 'Hindi' | string;
  programDetails?: string;
  schedulePdfUrl?: string;
}

export const testSeriesData: TestSeriesItem[] = [
  {
    id: 'bpsc-71st-prelims-mock-vault',
    title: '71st BPSC Prelims All India Standard Test Series 2025-26',
    slug: 'bpsc-71st-prelims-mock-vault',
    category: 'Prelims',
    exam: 'BPSC 71st CCE',
    language: 'English',
    status: 'active',
    thumbnailUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600',
    bannerUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200',
    price: 4999,
    discountedPrice: 2499,
    totalTests: 45,
    totalQuestions: 6750,
    duration: '6 Months Validity',
    description: 'Comprehensive 45-Test Series engineered strictly according to the latest 71st BPSC micro-pattern with negative marking diagnostic analytics, video explanations & Patna center offline option.',
    highlights: [
      '20 Subject-Wise Micro Sectional Tests (History, Polity, Economy, Sci-Tech, Geo)',
      '10 Bihar Special Exclusive Mock Tests (Bihar Economic Survey & Budget 2025-26)',
      '15 Full Length Grand Mock Papers with All India Rank Diagnostic Radar',
      'Instant Answer Keys with Subject Specialist Video Explanations',
      'Downloadable PDF Solution Booklets with High-Yield Extra Notes'
    ],
    syllabus: [
      { subject: 'History of India & Bihar Special', topics: ['Ancient & Medieval Bihar', '1857 Revolt & Veer Kunwar Singh', 'Freedom Struggle & Peasant Movements'] },
      { subject: 'General Science & Tech', topics: ['Physics Core Concepts', 'Chemistry Everyday Applications', 'Biology & Modern Biotechnology'] },
      { subject: 'Geography of India & Bihar', topics: ['Physical Features & River Systems', 'Soil & Vegetation Patterns', 'Mineral & Industrial Belts'] },
      { subject: 'Indian Polity & Governance', topics: ['Constitutional Framework & Articles', 'Panchayati Raj in Bihar', 'Judiciary & Statutory Bodies'] },
      { subject: 'Economy & Bihar Budget 2025-26', topics: ['Bihar Economic Survey Indicators', 'Inflation, Banking & Macroeconomy', 'State Welfare Schemes'] }
    ],
    faq: [
      { q: 'Can I attempt tests anytime or is there a fixed time window?', a: 'You can attempt tests anytime 24/7 once unlocked, as per your own revision schedule.' },
      { q: 'Are questions available in English?', a: 'Yes, every question paper and answer key is available in English.' },
      { q: 'Is offline test series available in Patna center?', a: 'Yes, enrolled online students can also take mock tests offline at Boring Road Patna center.' }
    ],
    batchStartDate: '09 August 2026',
    enrolledCount: 1840,
    validityDays: 180,
    isPublished: true,
    displayOrder: 1,
    moduleCode: '4186',
    medium: 'English',
    programDetails: '45 Tests'
  },
  {
    id: 'bpsc-70th-mains-evaluator-workbench',
    title: '70th Daily Answer Evaluation & Grand Mock Series',
    slug: 'bpsc-70th-mains-evaluator-workbench',
    category: 'Mains',
    exam: 'BPSC 70th Mains',
    examId: 'bpsc',
    language: 'English',
    status: 'active',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=600',
    bannerUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1200',
    price: 8999,
    discountedPrice: 4499,
    totalTests: 24,
    totalQuestions: 192,
    duration: 'Until Mains Exam',
    description: 'Expert evaluation by selected BPSC officers within 48 hours. Includes GS Paper I, GS Paper II, Essay paper mocks & 1-on-1 feedback calls.',
    highlights: [
      '8 Full Length GS Paper I Mocks + 8 Full Length GS Paper II Mocks',
      '4 Dedicated Essay Paper Mocks tailored to Bihar themes',
      'Personalized copy correction with line-by-line mark breakdown'
    ],
    syllabus: [],
    faq: [],
    batchStartDate: '09 August 2026',
    enrolledCount: 650,
    validityDays: 180,
    isPublished: true,
    displayOrder: 2,
    moduleCode: '4187',
    medium: 'English',
    programDetails: '24 Tests'
  },
  {
    id: 'appcs-cee-prelims-mock',
    title: 'CEE Prelims GS & CSAT Standard Mock Series',
    slug: 'appcs-cee-prelims-mock',
    category: 'Prelims',
    exam: 'APPCS CEE Prelims',
    examId: 'appcs',
    language: 'English',
    status: 'active',
    thumbnailUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=600',
    bannerUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=1200',
    price: 3999,
    discountedPrice: 1999,
    totalTests: 25,
    totalQuestions: 3750,
    duration: '6 Months Validity',
    description: 'State PSC examination practice series with comprehensive coverage of General Studies and CSAT papers.',
    highlights: [
      '15 GS Sectional & Full Length Tests',
      '10 CSAT Practice Test Papers with detailed solutions'
    ],
    syllabus: [],
    faq: [],
    batchStartDate: '09 August 2026',
    enrolledCount: 420,
    validityDays: 180,
    isPublished: true,
    displayOrder: 3,
    moduleCode: '4188',
    medium: 'English',
    programDetails: '25 Tests'
  },
  {
    id: 'apssb-gcr-practice-series',
    title: 'General Combined Recruitment Practice Series 2025',
    slug: 'apssb-gcr-practice-series',
    category: 'Prelims',
    exam: 'APSSB Combined Recruitment',
    examId: 'apssb',
    language: 'English',
    status: 'active',
    thumbnailUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600',
    bannerUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200',
    price: 1999,
    discountedPrice: 999,
    totalTests: 30,
    totalQuestions: 3000,
    duration: '6 Months Validity',
    description: 'Targeted practice papers for Staff Selection Board Combined Recruitment Examinations.',
    highlights: [
      'Comprehensive Coverage of General English, GK & Elementary Math',
      'Instant Diagnostic Rank Radar & Answer Keys'
    ],
    syllabus: [],
    faq: [],
    batchStartDate: '09 August 2026',
    enrolledCount: 890,
    validityDays: 180,
    isPublished: true,
    displayOrder: 4,
    moduleCode: '4189',
    medium: 'English',
    programDetails: '30 Tests'
  }
];

