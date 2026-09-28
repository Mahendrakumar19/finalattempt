import { Metadata } from 'next';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  Award,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Globe,
  Compass,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Layers,
  ChevronRight,
  Home,
  FileText,
  Clock,
  Zap,
  HelpCircle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'UPPSC Prelims 2026: Complete 10-Year PYQ Analysis & Strategy | Final Attempt IAS',
  description:
    'Data-driven preparation strategy for UPPSC Prelims 2026 based on 10 years (2016-2025) of PYQ trend analysis, subject weightage breakdown, booklists, and time allocation.',
  keywords: [
    'UPPSC Prelims PYQ Analysis',
    'UPPSC 10 Year Question Trend',
    'UPPSC Syllabus Strategy 2026',
    'UPPSC Booklist',
    'PCS Exam Weightage',
    'Final Attempt IAS Strategy',
  ],
};

export default function UppscPyqAnalysisPage() {
  const years = ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'];

  const pyqTableData = [
    { subject: 'History (Ancient)', data: [5, 6, 7, 5, 4, 3, 9, 8, 2, 0], avg: '4.9', trend: 'Declining', trendType: 'down' },
    { subject: 'History (Medieval)', data: [4, 5, 6, 4, 5, 3, 6, 5, 4, 3], avg: '4.5', trend: 'Declining', trendType: 'down' },
    { subject: 'History (Modern)', data: [9, 10, 8, 11, 9, 8, 12, 11, 10, 9], avg: '9.7', trend: 'Stable', trendType: 'stable' },
    { subject: 'TOTAL HISTORY', data: [18, 21, 21, 20, 18, 14, 27, 24, 16, 12], avg: '19.1', trend: 'Declining', trendType: 'down', isTotal: true },
    { subject: 'Indian Polity', data: [22, 24, 20, 15, 27, 18, 19, 21, 23, 20], avg: '20.9', trend: 'Very Stable', trendType: 'up' },
    { subject: 'Geography', data: [18, 16, 21, 24, 19, 23, 19, 20, 22, 21], avg: '20.3', trend: 'Stable', trendType: 'stable' },
    { subject: 'General Science', data: [19, 17, 18, 21, 17, 22, 20, 19, 18, 17], avg: '18.8', trend: 'Moderate', trendType: 'stable' },
    { subject: 'Current Affairs', data: [25, 22, 24, 28, 22, 31, 38, 27, 26, 22], avg: '27.5', trend: 'Volatile', trendType: 'volatile' },
    { subject: 'Economy & Schemes', data: [8, 10, 9, 12, 11, 14, 13, 12, 14, 13], avg: '11.6', trend: 'Increasing', trendType: 'up' },
    { subject: 'Environment & Ecology', data: [6, 7, 5, 8, 9, 10, 9, 8, 10, 9], avg: '8.1', trend: 'Increasing', trendType: 'up' },
    { subject: 'UP Special + Misc', data: [6, 5, 7, 2, 2, 3, 4, 5, 5, 18], avg: '5.7', trend: 'Unpredictable', trendType: 'volatile' },
    { subject: 'TOTAL QUESTIONS', data: [150, 150, 150, 150, 150, 150, 150, 150, 150, 150], avg: '150', trend: '—', trendType: 'none', isGrandTotal: true },
  ];

  const goldResources = [
    {
      subject: 'Indian Polity',
      resource: 'M. Laxmikanth — Indian Polity (6th Edition)',
      coverage: '95%+',
      reason: 'Almost 95% of UPPSC polity questions directly trace back to this book. Constitutional framework, Parliament, Fundamental Rights, Panchayati Raj are all comprehensively covered. Gold standard reference.',
      frequency: 'Daily',
    },
    {
      subject: 'Modern History',
      resource: 'Spectrum — Modern India by Rajiv Ahir / Ramchandra Guha',
      coverage: '90%+',
      reason: 'Covers freedom struggle chronology, Governor-Generals, key movements and organizations. Perfect for understanding cause-effect relationships and remembering dates in correct sequence.',
      frequency: '3x/week',
    },
    {
      subject: 'History (Comprehensive)',
      resource: 'NCERT Class 6-12 (All History Books)',
      coverage: '85%+',
      reason: 'Foundation building is crucial. NCERT provides clear narratives. For Ancient History (Harappan, Mauryan, Gupta), these NCERT books are the safest source. Supplement with R.S. Sharma.',
      frequency: 'Weekly',
    },
    {
      subject: 'Geography (Maps)',
      resource: 'Oxford Student Atlas / Orient Blackswan School Atlas',
      coverage: '100%',
      reason: 'Map-based questions are staple in UPPSC. Rivers, mountains, ports, passes, climate zones — all require visual mapping. Daily atlas practice is non-negotiable for geography scoring.',
      frequency: 'Daily (Practice)',
    },
    {
      subject: 'Geography (Content)',
      resource: 'NCERT Class 9-12 Geography',
      coverage: '85%+',
      reason: 'Provides comprehensive coverage of Indian geography (climate, soils, minerals, crops, rivers) and world geography basics. Combines well with atlas for complete geography preparation.',
      frequency: '3x/week',
    },
    {
      subject: 'Current Affairs',
      resource: 'Ghatnachakra Monthly / Drishti IAS Magazine',
      coverage: '90%+',
      reason: 'Questions come from last 12-18 months events. These publications track news systematically and provide curated summaries. Essential for national events, policies, and appointments.',
      frequency: 'Daily',
    },
    {
      subject: 'General Science',
      resource: 'NCERT Class 9-12 (Biology + Chemistry)',
      coverage: '90%+',
      reason: 'Biology dominates with 7-12 questions per year. Covers human physiology, diseases, plant biology, cell biology. Chemistry covers everyday compounds and reactions. NCERT is sufficient.',
      frequency: '2x/week',
    },
    {
      subject: 'Environment & Ecology',
      resource: 'Shankar IAS Environment + ISFR Report',
      coverage: '85%+',
      reason: 'ISFR data on forest cover by state is asked almost every year. National Parks, Ramsar Sites, Biodiversity Act are recurring. Shankar IAS provides organized content.',
      frequency: 'Weekly',
    },
    {
      subject: 'Economy & Schemes',
      resource: 'NCERT Macro + Micro Economics + Budget Analysis',
      coverage: '80%+',
      reason: 'Growing in importance (8 Qs in 2016 → 13 Qs in 2025). Focus on government schemes, budget provisions, banking basics. Read latest Union Budgets and Economic Surveys.',
      frequency: 'Weekly',
    },
  ];

  const timeDistribution = [
    { subject: 'Current Affairs (News)', percent: 20, color: 'bg-amber-500' },
    { subject: 'History (All Periods)', percent: 18, color: 'bg-blue-600' },
    { subject: 'Indian Polity', percent: 17, color: 'bg-emerald-600' },
    { subject: 'Geography (Maps + Content)', percent: 14, color: 'bg-cyan-600' },
    { subject: 'General Science (Bio/Chem/Phy)', percent: 13, color: 'bg-indigo-600' },
    { subject: 'Economy & Government Schemes', percent: 9, color: 'bg-orange-500' },
    { subject: 'Environment & Ecology', percent: 7, color: 'bg-teal-500' },
    { subject: 'UP Special + Miscellaneous', percent: 2, color: 'bg-rose-500' },
  ];

  const mistakes = [
    {
      title: 'Over-investing in UP Special GK',
      desc: 'Only 1-8 questions appear annually and are highly unpredictable. Allocating 15-20% time here is wasteful. Maximum 2% allocation is optimal.',
    },
    {
      title: 'Ignoring World Geography',
      desc: 'Consistently 9-15 questions from world geography including ports, mountains, lakes, currents. No atlas = guaranteed marks lost. Daily practice is essential.',
    },
    {
      title: 'Deep diving into Chemistry when Biology dominates',
      desc: 'Biology yields 7-12 questions per year, 3x more than Chemistry. If time is limited, prioritize Biology. NCERT Class 9-10 Biology is sufficient for scoring.',
    },
    {
      title: 'Treating Current Affairs as optional',
      desc: 'Ranges from 22-38 questions (widest variance). One year\'s spike can break your cutoff. Daily news tracking without gaps is mandatory.',
    },
    {
      title: 'Not practicing PYQ-based matching questions',
      desc: 'Polity regularly features "match-the-following" questions. Solving actual PYQs for Laxmikanth chapters reveals the exact pattern. Theory alone won\'t work.',
    },
    {
      title: 'Ignoring chronological order in Modern History',
      desc: 'Questions often provide mixed timeline scenarios. Sequence-based trap questions appear regularly. Memorize key dates in correct order.',
    },
  ];

  const comboTopics = [
    {
      icon: '🏘️',
      title: 'Panchayati Raj & Local Governance',
      desc: '73rd and 74th Amendments appear in polity questions AND in governance-related history questions. Complete preparation of this topic guarantees 2-3 additional marks across different question types. Laxmikanth Chapter 8 is comprehensive.',
    },
    {
      icon: '🌳',
      title: 'Forest Cover & Environmental Protection Cluster',
      desc: 'Indian State of Forest Report (ISFR) data, National Parks list, Ramsar Sites, and Biodiversity Act all interconnect. Preparing this cluster systematically yields 3-4 marks from overlapping question patterns. Update data annually before exam.',
    },
    {
      icon: '🏛️',
      title: 'Parliamentary Procedures & Legislative Process',
      desc: 'Bills passage, types of motions (Adjournment, No-Confidence, Privilege), parliamentary committees appear consistently. 3-5 guaranteed questions. Laxmikanth Chapters 18-20 cover everything.',
    },
    {
      icon: '📚',
      title: 'Modern History Timeline & Freedom Struggle Chronology',
      desc: 'Gandhi-era movements, Quit India Movement, Cabinet Missions, and major political events follow a strict chronological sequence. Trap questions mix timelines deliberately. Spectrum provides clear chronology.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Top Breadcrumbs Navigation Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-3.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Link href="/" className="hover:text-amber-500 flex items-center gap-1 font-medium">
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link href="/syllabus-strategy" className="hover:text-amber-500 font-medium">
              Syllabus & Strategy
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-amber-600 dark:text-amber-400 font-bold">UPPSC PYQ Analysis</span>
          </div>

          <Link
            href="/syllabus-strategy"
            className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-amber-500 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            <span>All Strategy Guides</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white py-14 px-4 sm:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 px-3.5 py-1.5 rounded-full text-xs font-extrabold tracking-wider uppercase">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Target UPPSC Prelims 2026</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-heading font-black tracking-tight leading-tight">
            Complete 10-Year PYQ Analysis <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">
              Data-Driven Preparation Strategy
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
            Exhaustive trends analysis from 2016 to 2025 (1,500+ questions analyzed across 8 main subjects). Learn subject weightages, volatile areas, gold standard booklists, and subject priority tiers.
          </p>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-center space-y-1 backdrop-blur-xs">
              <p className="text-3xl font-black text-amber-400">10</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Years of Data</p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-center space-y-1 backdrop-blur-xs">
              <p className="text-3xl font-black text-amber-400">1,500+</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Questions Analyzed</p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-center space-y-1 backdrop-blur-xs">
              <p className="text-3xl font-black text-amber-400">8</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Main Subjects</p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-center space-y-1 backdrop-blur-xs">
              <p className="text-3xl font-black text-amber-400">150</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Questions / Exam</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-14">
        {/* 1. Core Strategic Insights Grid */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-black font-heading text-slate-900 dark:text-white flex items-center gap-2">
              <Flame className="w-6 h-6 text-amber-500" />
              <span>Core Subject Insights & Analysis</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Key takeaways based on 10 years of consistent examination paper patterns.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* History Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-xs hover:border-amber-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-2xl">👑</span>
                <span className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full">
                  24 Qs / Year Avg
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">History Dominates</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                History is consistently the highest weightage subject. Ancient, Medieval, and Modern History all carry significant marks. Requires systematic preparation with Spectrum and NCERT as foundation.
              </p>
            </div>

            {/* Polity Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-xs hover:border-emerald-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-2xl">⚖️</span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                  22 Qs / Year Avg
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Polity is Most Stable</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Most predictable subject across all 10 years. M. Laxmikanth covers 95% of syllabus. Parliament, Constitution, Rights, and Panchayati Raj repeat consistently every year.
              </p>
            </div>

            {/* Current Affairs Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-xs hover:border-rose-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-2xl">⚡</span>
                <span className="text-xs font-black text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full">
                  22-38 Qs Range
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Current Affairs Volatility</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Peaked at 38 questions in 2022, now at 22 in 2025. This unpredictability makes it high-risk if ignored. Quality preparation is essential. Cannot be optional.
              </p>
            </div>

            {/* Geography Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-xs hover:border-cyan-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-2xl">🗺️</span>
                <span className="text-xs font-black text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full">
                  21 Qs / Year Avg
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Geography&apos;s Rising Importance</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Both Indian and World Geography carry significant marks. UP-specific geography (rivers, dams, forests, wildlife) is asked every year. Atlas practice is absolutely mandatory.
              </p>
            </div>

            {/* Science Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-xs hover:border-indigo-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-2xl">🧪</span>
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full">
                  19 Qs / Year Avg
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Science: Biology First</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Biology gives 7-12 questions, significantly more than Chemistry or Physics. Deep dives unnecessary. NCERT Class 9-12 provides complete coverage.
              </p>
            </div>

            {/* UP Special Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-xs hover:border-orange-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-2xl">⚠️</span>
                <span className="text-xs font-black text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full">
                  1-8 Qs / Year
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">UP Special GK: Low Priority</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Highly unpredictable and low-yield. Do not invest 15-20% of preparation time here. Maximum 2% allocation is optimal. Focus on high-return subjects instead.
              </p>
            </div>
          </div>
        </section>

        {/* 2. Subject Priority Matrix — Tier System */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-black font-heading text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-6 h-6 text-amber-500" />
              <span>Subject Priority Matrix — Tier System</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Optimize your study order by focusing on high-return tiers first.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tier 1 */}
            <div className="bg-gradient-to-b from-amber-500/10 to-amber-500/5 border-2 border-amber-500 rounded-3xl p-6 space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full">
                  TIER 1
                </span>
                <span className="text-xs font-bold text-slate-500">Highest Yield</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Start Here (Foundation Subjects)</h3>
              <ul className="space-y-3 text-xs font-medium text-slate-700 dark:text-slate-300">
                <li className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">📚 Current Affairs</span>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400">22-38 Qs</span>
                </li>
                <li className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">📖 History (All Periods)</span>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400">18-28 Qs</span>
                </li>
                <li className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">⚖️ Indian Polity</span>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400">15-27 Qs</span>
                </li>
              </ul>
            </div>

            {/* Tier 2 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">
                  TIER 2
                </span>
                <span className="text-xs font-bold text-slate-500">Support Layer</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Parallel Preparation</h3>
              <ul className="space-y-3 text-xs font-medium text-slate-700 dark:text-slate-300">
                <li className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">🌍 Geography</span>
                  <span className="font-extrabold text-blue-600 dark:text-blue-400">18-24 Qs</span>
                </li>
                <li className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">🔬 General Science</span>
                  <span className="font-extrabold text-blue-600 dark:text-blue-400">17-21 Qs</span>
                </li>
              </ul>
            </div>

            {/* Tier 3 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                  TIER 3
                </span>
                <span className="text-xs font-bold text-slate-500">Specialty Polish</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Final Polish</h3>
              <ul className="space-y-3 text-xs font-medium text-slate-700 dark:text-slate-300">
                <li className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">💰 Economy & Schemes</span>
                  <span className="font-extrabold text-slate-700 dark:text-slate-300">12-15 Qs</span>
                </li>
                <li className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">🌱 Environment & Ecology</span>
                  <span className="font-extrabold text-slate-700 dark:text-slate-300">7-10 Qs</span>
                </li>
                <li className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">🏘️ UP Special & Misc</span>
                  <span className="font-extrabold text-slate-700 dark:text-slate-300">1-8 Qs</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. Detailed Breakdown by Core Subject */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-black font-heading text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-amber-500" />
              <span>Detailed Subject Breakdown</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              In-depth topic trends for History, Polity, and Geography.
            </p>
          </div>

          <div className="space-y-6">
            {/* History */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
              <h3 className="text-lg font-black text-amber-600 dark:text-amber-400 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <span>History — The Scoring Subject</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600 dark:text-slate-400">
                <div className="space-y-2">
                  <p className="font-bold text-slate-900 dark:text-white text-sm">📖 Modern History (7-12 Qs)</p>
                  <p className="leading-relaxed">
                    Covers Gandhi-era movements, roles of various Governor-Generals, INC sessions and resolutions, freedom struggle chronology. Source: Spectrum Modern India + NCERT Class 8-10. Focus on dates and cause-effect relationships.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-slate-900 dark:text-white text-sm">🏛️ Ancient History (5-9 Qs)</p>
                  <p className="leading-relaxed">
                    Zero questions in 2025, but 8-9 questions appeared in 2022-23. Harappan civilization, Mauryan Empire, Gupta period are recurring. Source: NCERT Class 6 + R.S. Sharma for depth.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-slate-900 dark:text-white text-sm">⚔️ Medieval History (4-7 Qs)</p>
                  <p className="leading-relaxed">
                    Delhi Sultanate and Mughal Empire administration. NCERT Class 7-8 provides complete coverage. Less volatile than other history sections, but basic facts must be clear.
                  </p>
                </div>
              </div>
            </div>

            {/* Polity */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
              <h3 className="text-lg font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <span>Polity — The Guaranteed Marks</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600 dark:text-slate-400">
                <div className="space-y-2">
                  <p className="font-bold text-slate-900 dark:text-white text-sm">🏛️ Parliament & Procedures (3-5 Qs)</p>
                  <p className="leading-relaxed">
                    Structure, composition, procedures, committees are consistent every year. Parliamentary questions involve passage of bills, types of motions, and committee functions. Reference: M. Laxmikanth Chapters 18-20.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-slate-900 dark:text-white text-sm">📋 Fundamental Rights & Constitution (2-4 Qs)</p>
                  <p className="leading-relaxed">
                    Part III of Constitution (Fundamental Rights), important amendments, and constitutional provisions. Match-the-following questions are common. Key amendments: 26th, 44th, 73rd, 74th.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-slate-900 dark:text-white text-sm">🏘️ Panchayati Raj & Local Governance (2-3 Qs)</p>
                  <p className="leading-relaxed">
                    73rd and 74th Amendments are almost perennial questions. UP-specific implementation details are frequently asked. Demonstrates how constitutional provisions translate into governance.
                  </p>
                </div>
              </div>
            </div>

            {/* Geography */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
              <h3 className="text-lg font-black text-cyan-600 dark:text-cyan-400 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <span>Geography — Visual Learning Required</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 dark:text-slate-400">
                <div className="space-y-2">
                  <p className="font-bold text-slate-900 dark:text-white text-sm">🇮🇳 Indian Geography (13-15 Qs)</p>
                  <p className="leading-relaxed">
                    River systems, mineral distribution, agricultural zones, soil types, climate patterns. UP-specific questions on dams, forest cover by district, wildlife sanctuaries appear regularly. Requires both textual knowledge (NCERT) and map practice.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-slate-900 dark:text-white text-sm">🌍 World Geography (7-10 Qs)</p>
                  <p className="leading-relaxed">
                    Major lakes and their locations, international ports, mountain ranges, ocean currents, and climatic regions. Oxford or Orient Blackswan Student Atlas is essential. Daily 20-minute atlas practice yields 2-3 guaranteed marks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Subject-Wise Question Distribution (10-Year Table) */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-black font-heading text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-amber-500" />
              <span>Subject-Wise Question Distribution (2016–2025)</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Complete 10-year annual breakdown showing subject weightage trends over time.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3.5 sticky left-0 bg-slate-100 dark:bg-slate-800 min-w-[170px]">Subject</th>
                    {years.map((y) => (
                      <th key={y} className="p-3.5 text-center min-w-[55px]">
                        {y}
                      </th>
                    ))}
                    <th className="p-3.5 text-center min-w-[80px] bg-amber-500/10 text-amber-700 dark:text-amber-300">
                      10-Yr Avg
                    </th>
                    <th className="p-3.5 text-center min-w-[100px]">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                  {pyqTableData.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                        row.isGrandTotal
                          ? 'font-black bg-amber-500/10 dark:bg-amber-500/20 text-slate-900 dark:text-white'
                          : row.isTotal
                          ? 'font-bold bg-slate-100/80 dark:bg-slate-800/60'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <td className="p-3.5 sticky left-0 bg-white dark:bg-slate-900 font-bold border-r border-slate-200 dark:border-slate-800">
                        {row.subject}
                      </td>
                      {row.data.map((val, vIdx) => (
                        <td key={vIdx} className="p-3.5 text-center font-mono">
                          {val}
                        </td>
                      ))}
                      <td className="p-3.5 text-center font-black font-mono text-amber-600 dark:text-amber-400 bg-amber-500/5">
                        {row.avg}
                      </td>
                      <td className="p-3.5 text-center font-semibold">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider ${
                            row.trendType === 'up'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : row.trendType === 'down'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : row.trendType === 'volatile'
                              ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {row.trend}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Badges Bar */}
            <div className="p-6 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-base">🔴</span>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Key Finding: Current Affairs</p>
                  <p className="text-slate-500 dark:text-slate-400">
                    Ranged from 22-38 questions over 10 years. Highest in 2022 (38 Qs), back to 22 in 2025. Mandatory to prepare.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-base">🟢</span>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Most Stable: Polity</p>
                  <p className="text-slate-500 dark:text-slate-400">
                    Consistently 15-27 questions every year (20.9 avg). Highly predictable for planning.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-base">🟠</span>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Trending Up: Economy</p>
                  <p className="text-slate-500 dark:text-slate-400">
                    Increased from 8 questions (2016) to 13 questions (2025). Growing importance in UPPSC.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Gold Standard Resources */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-black font-heading text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-500" />
              <span>Gold Standard Resources for UPPSC Preparation</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Proven resources based on 10 years of question patterns providing 90%+ syllabus coverage.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3.5 min-w-[130px]">Subject</th>
                    <th className="p-3.5 min-w-[200px]">Primary Resource</th>
                    <th className="p-3.5 min-w-[90px] text-center">Coverage</th>
                    <th className="p-3.5 min-w-[280px]">Why Essential?</th>
                    <th className="p-3.5 min-w-[120px] text-center">Frequency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                  {goldResources.map((res, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">{res.subject}</td>
                      <td className="p-3.5 font-semibold text-amber-600 dark:text-amber-400">{res.resource}</td>
                      <td className="p-3.5 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {res.coverage}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400 leading-relaxed">{res.reason}</td>
                      <td className="p-3.5 text-center">
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full font-bold text-slate-700 dark:text-slate-300">
                          {res.frequency}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pro Tips Box */}
            <div className="p-6 bg-amber-500/5 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Pro Tips for Resource Usage</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700 dark:text-slate-300">
                <p>✓ <strong>Laxmikanth Priority:</strong> Read completely once, then revise specific chapters as per question pattern before exam.</p>
                <p>✓ <strong>NCERT Foundation:</strong> Don&apos;t skip NCERT even if it seems basic. 60%+ UPPSC questions are NCERT-level concepts.</p>
                <p>✓ <strong>Atlas Daily Practice:</strong> Spend 20 minutes daily on map identification (+3-5 marks to your geography score).</p>
                <p>✓ <strong>Current Affairs Tracking:</strong> Daily news tracking + monthly revision is the only way.</p>
                <p>✓ <strong>PYQ Analysis:</strong> After reading theory, solve 5-10 PYQs from each topic to reveal actual question patterns.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Recommended Study Time Distribution & Mistakes */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Study Time Allocation (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-md">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                <span>Study Time Distribution</span>
              </h3>
              <p className="text-xs text-slate-500">Based on 10-year question frequency analysis.</p>
            </div>

            <div className="space-y-4">
              {timeDistribution.map((item, index) => (
                <div key={index} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span>{item.subject}</span>
                    <span className="font-mono text-amber-600 dark:text-amber-400">{item.percent}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Common Mistakes (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-md">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" />
                <span>Common Preparation Mistakes — What NOT to Do</span>
              </h3>
              <p className="text-xs text-slate-500">Avoid these 6 critical preparation traps.</p>
            </div>

            <div className="space-y-3">
              {mistakes.map((m, i) => (
                <div key={i} className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl space-y-1">
                  <p className="text-xs font-black text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                    <span>❌</span>
                    <span>{m.title}</span>
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-5">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 7. High-Yield "Combo" Topics */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-black font-heading text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-amber-500" />
              <span>High-Yield &quot;Combo&quot; Topics — Overlapping Coverage</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Prepare these topics once to yield marks across multiple question patterns.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {comboTopics.map((item, index) => (
              <div
                key={index}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-3 shadow-xs hover:border-amber-500/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{item.title}</h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-3xl p-8 sm:p-12 text-slate-950 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-2xl sm:text-3xl font-heading font-black">Ready to Accelerate Your UPPSC 2026 Preparation?</h3>
            <p className="text-xs sm:text-sm font-semibold opacity-90">
              Access official syllabus breakdowns, strategy guides, and practice tests designed for UPPSC & BPSC.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/syllabus-strategy"
              className="px-6 py-3 bg-slate-950 text-white font-extrabold rounded-2xl text-xs flex items-center gap-2 hover:bg-slate-900 transition-all shadow-md"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Explore Official Syllabus</span>
            </Link>

            <Link
              href="/test-series"
              className="px-6 py-3 bg-white text-slate-950 font-extrabold rounded-2xl text-xs flex items-center gap-2 hover:bg-slate-100 transition-all shadow-md"
            >
              <Award className="w-4 h-4 text-amber-600" />
              <span>Explore Test Series</span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
