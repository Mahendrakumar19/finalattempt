'use client';

import { useState, useEffect } from 'react';
import { Award, Users, Sparkles } from 'lucide-react';
import { db, SiteSettings } from '@/services/db';
import { useTranslation } from '@/context/LocaleContext';

interface FacultyMember {
  id: string;
  name: string;
  role: string;
  experience: string;
  avatar: string;
  bio: string;
}

interface ResultTopper {
  id: string;
  name: string;
  rank: string;
  exam: string;
  service: string;
  district: string;
  photo: string;
  image?: string;
  year: number;
}

export default function AboutPage() {
  const { t, locale } = useTranslation();
  const [faculty, setFaculty] = useState<FacultyMember[]>([]);
  const [results, setResults] = useState<ResultTopper[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [facData, resData, setRes] = await Promise.all([
          db.getFaculty(),
          db.getResults(),
          db.getSettings()
        ]);
        setFaculty(facData || []);
        setResults(resData || []);
        setSettings(setRes || null);
      } catch (err) {
        console.error('Failed loading about page dynamic parameters:', err);
      }
    };
    loadData();
  }, []);

  const displayTitle = locale === 'hi'
    ? ((settings as any)?.aboutTitle_hi || (settings?.aboutTitle && !settings.aboutTitle.includes('Final Attempt') ? settings.aboutTitle : 'फाइनल एटेम्पट'))
    : (settings?.aboutTitle || t('aboutPage.mainTitle', 'One Mentor. One Strategy. One Final Attempt.'));

  const displaySubtitle = (settings?.aboutSubtitle && settings.aboutSubtitle.trim() !== '')
    ? settings.aboutSubtitle
    : t('aboutPage.mainSubtitle', "Final Attempt is BPSC's premium prep ecosystem designed by civil servants and leading experts to deliver strategic mentorship and personalized micro-scheduling.");

  const displayMission = (settings?.aboutMission && settings.aboutMission.trim() !== '')
    ? settings.aboutMission
    : t('aboutPage.ourMissionDesc', 'To democratize civil services coaching in Bihar by providing senior administrative officer mentorship, structured syllabus micro-targets, and local language accessibility.');

  const displayVision = (settings?.aboutVision && settings.aboutVision.trim() !== '')
    ? settings.aboutVision
    : t('aboutPage.ourVisionDesc', "To be recognized as Bihar's most trusted and outcome-oriented gateway for administrative leadership, shaping civil servants who drive regional development.");

  const displayValues = (settings?.aboutValues && settings.aboutValues.trim() !== '')
    ? settings.aboutValues
    : t('aboutPage.coreValuesDesc', 'Upholding transparency in feedback, data-driven diagnostic dashboards, strict study schedules, and unyielding support for economically backward learners.');

  const defaultMethodology = [
    { title: t('aboutPage.microScheduling', 'Micro-Scheduling'), desc: t('aboutPage.microSchedulingDesc', 'Dividing massive GS books into weekly targeted syllabus schedules.') },
    { title: t('aboutPage.dailyEvaluation', 'Daily Evaluation'), desc: t('aboutPage.dailyEvaluationDesc', 'Mandatory daily answer writing checks by experienced evaluators.') },
    { title: t('aboutPage.biharFocus', 'Bihar Focus'), desc: t('aboutPage.biharFocusDesc', 'Extensive state geography, budget digests, and economic statistics.') },
    { title: t('aboutPage.officerMentorship', 'Officer Mentorship'), desc: t('aboutPage.officerMentorshipDesc', 'Direct workshops and feedback sessions with selected public administrators.') }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20 bg-[var(--bg-color)]">
      {/* 1. Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl uppercase tracking-widest inline-block">
          {t('aboutPage.whoWeAre', 'Who We Are')}
        </span>
        <h1 className="text-4xl sm:text-5xl font-heading font-black text-[var(--text-color)] tracking-tight leading-tight">
          <span>{displayTitle}</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
          {displaySubtitle}
        </p>
      </div>

      {/* 2. Core Pillars: Mission, Vision, Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-[var(--card-bg)] p-8 rounded-3xl border border-[var(--card-border)] space-y-4 shadow-3xs hover-lift">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-extrabold text-lg text-[var(--text-color)]">{t('aboutPage.ourMission', 'Our Mission')}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {displayMission}
          </p>
        </div>

        <div className="bg-[var(--card-bg)] p-8 rounded-3xl border border-[var(--card-border)] space-y-4 shadow-3xs hover-lift">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-extrabold text-lg text-[var(--text-color)]">{t('aboutPage.ourVision', 'Our Vision')}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {displayVision}
          </p>
        </div>

        <div className="bg-[var(--card-bg)] p-8 rounded-3xl border border-[var(--card-border)] space-y-4 shadow-3xs hover-lift">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-extrabold text-lg text-[var(--text-color)]">{t('aboutPage.coreValues', 'Core Values')}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {displayValues}
          </p>
        </div>
      </div>

      {/* 3. Methodology & Our Approach */}
      <div className="bg-[var(--card-bg)] rounded-3xl p-8 sm:p-12 border border-[var(--card-border)] shadow-3xs space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">{t('aboutPage.methodology', 'Methodology')}</span>
          <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-[var(--text-color)]">{t('aboutPage.strategicApproach', 'Our Core Strategic Approach')}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('aboutPage.strategicApproachDesc', 'How we achieve high BPSC success rates year after year.')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
          {defaultMethodology.map((step: { title: string; desc?: string; description?: string }, idx: number) => (
            <div key={idx} className="space-y-2">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center font-black text-xs mx-auto mb-2">
                0{idx + 1}
              </div>
              <h4 className="font-heading font-bold text-sm text-[var(--text-color)]">{step.title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc || step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Results Highlight Grid */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">{t('aboutPage.hallOfFame', 'Hall of Fame')}</span>
          <h3 className="text-3xl font-heading font-black text-[var(--text-color)]">{t('aboutPage.bpscOfficers', 'BPSC Officers & Achievers')}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('aboutPage.bpscOfficersDesc', 'A look at some of our selected toppers who realized their administrative dreams.')}</p>
        </div>

        {results.length === 0 ? (
          <p className="text-xs text-slate-400 text-center">{t('aboutPage.loadingToppers', 'Loading toppers records...')}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {results.slice(0, 8).map((topper, idx) => (
              <div key={topper.id ? `topper-${topper.id}-${idx}` : `topper-idx-${idx}`} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden shadow-3xs p-4 text-center space-y-2 hover-lift">
                <div className="w-24 h-24 rounded-full overflow-hidden mx-auto bg-slate-100 border border-slate-200 shadow-sm">
                  <img
                    src={topper.image || topper.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                    alt={topper.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-heading font-extrabold text-sm text-[var(--text-color)]">{topper.name}</h4>
                  <p className="text-[10px] text-amber-600 font-black uppercase tracking-wider">{topper.rank} ({topper.exam})</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">{topper.service}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Faculty Profile Cards */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">{t('aboutPage.mentorshipBoard', 'Mentorship Board')}</span>
          <h3 className="text-3xl font-heading font-black text-[var(--text-color)]">{t('aboutPage.facultyPanel', 'Expert Faculty Panel')}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('aboutPage.facultyPanelDesc', 'Learn from seasoned educators and former civil service administrators.')}</p>
        </div>

        {faculty.length === 0 ? (
          <p className="text-xs text-slate-400 text-center">{t('aboutPage.loadingFaculty', 'Loading faculty profiles...')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {faculty.map((mentor, idx) => (
              <div key={mentor.id ? `mentor-${mentor.id}-${idx}` : `mentor-idx-${idx}`} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 shadow-3xs space-y-4 hover-lift">
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                    <img src={mentor.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200'} alt={mentor.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-heading font-extrabold text-sm text-[var(--text-color)]">{mentor.name}</h4>
                    <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">{mentor.role}</p>
                    <p className="text-[9px] text-slate-400 font-semibold">{mentor.experience} Exp</p>
                  </div>
                </div>
                <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">{mentor.bio}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
