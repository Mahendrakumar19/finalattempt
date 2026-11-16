'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  UploadCloud, 
  AlertCircle, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  FileJson, 
  Eye, 
  BookOpen, 
  Calendar, 
  X,
  Globe,
  Tag
} from 'lucide-react';
import { db, DynamicCurrentAffairEdition, DynamicCurrentAffairArticle } from '@/services/db';

interface ClaudeCurrentAffairsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ClaudeCurrentAffairsModal: React.FC<ClaudeCurrentAffairsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedEdition, setParsedEdition] = useState<DynamicCurrentAffairEdition | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeLangTab, setActiveLangTab] = useState<'both' | 'en' | 'hi'>('both');

  const todayIso = new Date().toISOString().split('T')[0];

  const masterPrompt = `You are a senior UPSC/BPSC Current Affairs content creator for "Final Attempt" (a premier Civil Services mentorship portal). 
Generate today's complete bilingual Current Affairs edition for ${todayIso} in the exact JSON format below.

Include 4 to 6 top high-impact news items (covering National, International, Economy, Polity, Science & Tech, Environment, and Bihar Special).

OUTPUT RULES:
1. Provide ONLY valid JSON. Do not write any conversational intro or outro.
2. Provide content in both English and Hindi (rich, exam-oriented).
3. Include Prelims Pointers (facts, constitutional articles, schemes) and Mains Pointers (critical analysis, governance angles).

JSON FORMAT:
{
  "publishDate": "${todayIso}",
  "publish_target": "both",
  "summary": "Concise 2-line English overview of today's key civil services events...",
  "summary_hi": "आज के प्रमुख करेंट अफेयर्स का 2 पंक्तियों का हिंदी सारांश...",
  "articles": [
    {
      "title": "Clear Headline in English",
      "title_hi": "स्पष्ट एवं सटीक शीर्षक हिंदी में",
      "category": "NATIONAL", // One of: "NATIONAL", "INTERNATIONAL", "BIHAR", "ARUNACHAL"
      "importance": "HIGH", // "HIGH", "MEDIUM", or "LOW"
      "readingTime": "4 mins",
      "tags": ["Polity", "Governance", "BPSC", "GS2"],
      "source": "The Hindu / PIB / Indian Express",
      "summary": "Crisp 3-4 sentence English synopsis...",
      "summary_hi": "3-4 वाक्यों का सटीक हिंदी सारांश...",
      "whyInNews": "Why is this topic currently in the news?",
      "keyHighlights": "Key provisions, data points, or policy decisions...",
      "importantFacts": "Prelims pointers: facts, constitutional articles, dates, institutions, reports...",
      "examRelevance": "Mains answer writing dimensions: impacts, challenges, way forward...",
      "content": "Comprehensive markdown article in English with headings...",
      "content_hi": "हिंदी में विस्तृत विश्लेषणात्मक लेख (उपशीर्षकों सहित)..."
    }
  ]
}`;

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(masterPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 3000);
    } catch {
      alert('Could not auto-copy. Please select and copy the prompt text manually.');
    }
  };

  const sanitizeAndParseJson = (raw: string) => {
    setParseError(null);
    if (!raw.trim()) {
      setParsedEdition(null);
      return;
    }

    try {
      // 1. Strip markdown codeblocks like ```json ... ``` or ``` ... ```
      let cleaned = raw.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
      }

      // 2. Locate first '{' and last '}' in case there is chatter
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }

      const parsed = JSON.parse(cleaned);

      // Validate basic structure
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Parsed output is not a valid JSON object.');
      }

      const publishDate = parsed.publishDate || todayIso;
      const publishTarget = (['both', 'english', 'hindi'].includes(parsed.publish_target) 
        ? parsed.publish_target 
        : 'both') as 'both' | 'english' | 'hindi';

      const rawArticles = Array.isArray(parsed.articles) 
        ? parsed.articles 
        : (Array.isArray(parsed) ? parsed : []);

      if (rawArticles.length === 0) {
        throw new Error('No articles found in the provided JSON. Make sure "articles": [ ... ] is present.');
      }

      // Normalize each article safely
      const normalizedArticles: DynamicCurrentAffairArticle[] = rawArticles.map((art: any, idx: number) => {
        const rawCat = String(art.category || '').toUpperCase();
        let cat: 'NATIONAL' | 'INTERNATIONAL' | 'BIHAR' | 'ARUNACHAL' = 'NATIONAL';
        if (rawCat.includes('BIHAR')) cat = 'BIHAR';
        else if (rawCat.includes('ARUNACHAL')) cat = 'ARUNACHAL';
        else if (rawCat.includes('INTER') || rawCat.includes('GLOBAL') || rawCat.includes('WORLD')) cat = 'INTERNATIONAL';

        const rawImp = String(art.importance || '').toUpperCase();
        let importance: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';
        if (rawImp.includes('LOW')) importance = 'LOW';
        else if (rawImp.includes('MED')) importance = 'MEDIUM';

        const artTitle = (art.title || art.title_hi || `Article ${idx + 1}`).trim();
        const artTitleHi = (art.title_hi || art.title || artTitle).trim();
        const artSummary = (art.summary || art.summary_hi || '').trim();
        const artSummaryHi = (art.summary_hi || art.summary || artSummary).trim();

        // Build fallback content if only structured fields exist
        let contentEn = art.content || '';
        if (!contentEn && (art.whyInNews || art.keyHighlights || art.importantFacts)) {
          contentEn = `### Why in News?\n${art.whyInNews || ''}\n\n### Key Highlights\n${art.keyHighlights || ''}\n\n### Prelims Pointers\n${art.importantFacts || ''}\n\n### Mains Perspective\n${art.examRelevance || ''}`;
        }

        let contentHi = art.content_hi || '';
        if (!contentHi && (art.whyInNews || art.keyHighlights || art.importantFacts)) {
          contentHi = `### चर्चा में क्यों?\n${art.whyInNews || ''}\n\n### प्रमुख बिंदु\n${art.keyHighlights || ''}\n\n### प्रारंभिक परीक्षा दृष्टि\n${art.importantFacts || ''}\n\n### मुख्य परीक्षा दृष्टिकोण\n${art.examRelevance || ''}`;
        }

        const tags = Array.isArray(art.tags) 
          ? art.tags.map(String) 
          : (art.tags ? String(art.tags).split(',').map(t => t.trim()) : ['Current Affairs', 'BPSC']);

        const id = art.id || `claude-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
        const slug = art.slug || artTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `article-${Date.now()}-${idx}`;

        return {
          id,
          editionId: parsed.id || `edition-${publishDate}`,
          slug,
          title: artTitle,
          title_hi: artTitleHi,
          summary: artSummary,
          summary_hi: artSummaryHi,
          content: contentEn,
          content_hi: contentHi,
          category: cat,
          publishStatus: 'PUBLISHED',
          publishedDate: publishDate,
          readingTime: art.readingTime || '4 mins',
          importance,
          publish_target: (art.publish_target || publishTarget) as 'both' | 'english' | 'hindi',
          language: (art.language || 'bilingual') as 'en' | 'hi' | 'bilingual',
          whyInNews: art.whyInNews || '',
          keyHighlights: art.keyHighlights || '',
          importantFacts: art.importantFacts || art.prelimsPointer || art.prelimsPointers || '',
          examRelevance: art.examRelevance || art.mainsPointer || art.mainsPointers || '',
          tags,
          sources: art.source ? [String(art.source)] : (Array.isArray(art.sources) ? art.sources : ['The Hindu / PIB'])
        } as DynamicCurrentAffairArticle;
      });

      const edition: DynamicCurrentAffairEdition = {
        id: parsed.id || `edition-${publishDate}`,
        publishDate,
        summary: parsed.summary || `${normalizedArticles.length} key civil services developments for ${publishDate}.`,
        title_hi: parsed.title_hi || parsed.summary_hi || `दैनिक समसामयिकी - ${publishDate}`,
        summary_hi: parsed.summary_hi || `${publishDate} के मुख्य सिविल सेवा समसामयिक घटनाक्रम।`,
        publish_target: publishTarget,
        articles: normalizedArticles
      };

      setParsedEdition(edition);
      setParseError(null);
    } catch (err: any) {
      setParseError(err.message || 'Invalid JSON syntax. Please check the pasted text.');
      setParsedEdition(null);
    }
  };

  const handleRemoveArticle = (index: number) => {
    if (!parsedEdition || !parsedEdition.articles) return;
    const updated = parsedEdition.articles.filter((_, i) => i !== index);
    setParsedEdition({ ...parsedEdition, articles: updated });
  };

  const handlePublish = async () => {
    if (!parsedEdition || !parsedEdition.articles || parsedEdition.articles.length === 0) {
      alert('No valid articles to publish.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await db.saveDynamicCurrentAffairsEdition(parsedEdition);
      if (ok) {
        alert(`🎉 Success! Published ${parsedEdition.articles.length} Current Affairs articles for ${parsedEdition.publishDate}.`);
        setJsonInput('');
        setParsedEdition(null);
        onSuccess();
        onClose();
      } else {
        alert('Failed to save edition. Please check console for backend logs.');
      }
    } catch (err: any) {
      console.error('Claude CA import failed:', err);
      alert(`Upload error: ${err.message || 'Unknown network error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-full max-w-6xl max-h-[92vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-white/10 flex items-center justify-between shrink-0 bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-black text-lg text-slate-900 dark:text-white">
                  Claude AI Current Affairs Smart Importer
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  Zero Error • Live Preview
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Copy the prompt, paste into Claude, and paste Claude&apos;s JSON response below for instant verification & publishing.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* Step 1: Copy Claude Master Prompt */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-200">
                <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">1</span>
                <span>Step 1: Copy Master Prompt for Claude</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-7">
                Includes BPSC syllabus coverage, Prelims/Mains dimensions, bilingual English + Hindi guidelines and strict JSON schema.
              </p>
            </div>
            <button
              onClick={handleCopyPrompt}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all shadow-xs shrink-0 ${
                copiedPrompt
                  ? 'bg-emerald-600 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {copiedPrompt ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Prompt Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Claude Prompt</span>
                </>
              )}
            </button>
          </div>

          {/* Step 2: Paste JSON */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">2</span>
                <span>Step 2: Paste Claude&apos;s Output Below</span>
                <span className="text-[10px] text-slate-400 font-normal">(Markdown code fences like ```json are cleaned automatically)</span>
              </label>
              {jsonInput && (
                <button
                  onClick={() => {
                    setJsonInput('');
                    setParsedEdition(null);
                    setParseError(null);
                  }}
                  className="text-[10px] text-red-500 hover:underline font-bold"
                >
                  Clear Box
                </button>
              )}
            </div>
            <div className="relative">
              <textarea
                value={jsonInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setJsonInput(val);
                  sanitizeAndParseJson(val);
                }}
                rows={6}
                placeholder={`Paste Claude's response here...\nExample:\n{\n  "publishDate": "${todayIso}",\n  "publish_target": "both",\n  "articles": [ ... ]\n}`}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-y"
              />
            </div>

            {/* Error Message */}
            {parseError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span><strong>Parse Error:</strong> {parseError}</span>
              </div>
            )}
          </div>

          {/* Step 3: Live Verification & Preview */}
          {parsedEdition && (
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-white/10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">3</span>
                  <h4 className="font-heading font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Live Verification Preview</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      {parsedEdition.articles?.length || 0} Articles Ready
                    </span>
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  {/* Language Tab Filter for Preview */}
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[10px] font-bold">
                    <button
                      onClick={() => setActiveLangTab('both')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${activeLangTab === 'both' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500'}`}
                    >
                      Bilingual
                    </button>
                    <button
                      onClick={() => setActiveLangTab('en')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${activeLangTab === 'en' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500'}`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => setActiveLangTab('hi')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${activeLangTab === 'hi' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500'}`}
                    >
                      Hindi
                    </button>
                  </div>
                </div>
              </div>

              {/* Edition Meta Bar */}
              <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Publish Date</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-600" />
                    <input
                      type="date"
                      value={parsedEdition.publishDate}
                      onChange={(e) => setParsedEdition({ ...parsedEdition, publishDate: e.target.value })}
                      className="bg-transparent font-bold outline-none cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Destination Hub</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white mt-0.5">
                    <Globe className="w-3.5 h-3.5 text-purple-600" />
                    <select
                      value={parsedEdition.publish_target || 'both'}
                      onChange={(e) => setParsedEdition({ ...parsedEdition, publish_target: e.target.value as any })}
                      className="bg-transparent font-bold outline-none cursor-pointer"
                    >
                      <option value="both">🌐 Both English & Hindi Hubs</option>
                      <option value="english">English Hub Only</option>
                      <option value="hindi">Hindi Hub Only</option>
                    </select>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Summary Highlights</span>
                  <p className="text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5 font-medium">
                    {parsedEdition.summary}
                  </p>
                </div>
              </div>

              {/* Article Cards List */}
              <div className="space-y-3">
                {parsedEdition.articles?.map((art, idx) => {
                  const isExpanded = expandedIndex === idx;

                  const categoryColors: Record<string, string> = {
                    BIHAR: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                    INTERNATIONAL: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
                    NATIONAL: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
                    ARUNACHAL: 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                  };

                  return (
                    <div 
                      key={art.id || idx} 
                      className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5 rounded-2xl space-y-3 transition-all hover:border-purple-500/30"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400">#{idx + 1}</span>
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${categoryColors[art.category] || categoryColors.NATIONAL}`}>
                              {art.category}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {art.importance} IMPORTANCE
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">⏱ {art.readingTime}</span>
                          </div>

                          {/* Titles */}
                          {(activeLangTab === 'both' || activeLangTab === 'en') && (
                            <h5 className="font-heading font-black text-sm text-slate-900 dark:text-white leading-snug">
                              {art.title}
                            </h5>
                          )}
                          {(activeLangTab === 'both' || activeLangTab === 'hi') && (
                            <h5 className="font-heading font-black text-sm text-purple-700 dark:text-purple-300 leading-snug">
                              {art.title_hi || art.title}
                            </h5>
                          )}

                          {/* Summaries */}
                          {(activeLangTab === 'both' || activeLangTab === 'en') && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                              {art.summary}
                            </p>
                          )}
                          {(activeLangTab === 'both' || activeLangTab === 'hi') && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                              {art.summary_hi || art.summary}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                            className="p-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                            title={isExpanded ? 'Collapse' : 'Expand full details'}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveArticle(idx)}
                            className="p-1.5 rounded-xl border border-red-200 dark:border-red-900/50 hover:bg-red-50 text-red-600 dark:text-red-400 transition-colors"
                            title="Remove this article"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Analysis */}
                      {isExpanded && (
                        <div className="pt-3 border-t border-slate-200 dark:border-white/5 space-y-3 text-xs animate-in fade-in duration-150">
                          {art.whyInNews && (
                            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-white/5">
                              <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 block mb-0.5">
                                📌 Why in News?
                              </span>
                              <p className="text-slate-700 dark:text-slate-300">{art.whyInNews}</p>
                            </div>
                          )}

                          {art.importantFacts && (
                            <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
                              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block mb-0.5">
                                🎯 Prelims Pointers
                              </span>
                              <p className="text-slate-700 dark:text-slate-300">{art.importantFacts}</p>
                            </div>
                          )}

                          {art.examRelevance && (
                            <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/20">
                              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block mb-0.5">
                                📝 Mains Answer Writing Dimensions
                              </span>
                              <p className="text-slate-700 dark:text-slate-300">{art.examRelevance}</p>
                            </div>
                          )}

                          {art.tags && art.tags.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              <Tag className="w-3 h-3 text-slate-400" />
                              {art.tags.map((t, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-white/10 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!parsedEdition || !parsedEdition.articles || parsedEdition.articles.length === 0 || isSubmitting}
            onClick={handlePublish}
            className={`px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-md transition-all ${
              !parsedEdition || !parsedEdition.articles || parsedEdition.articles.length === 0 || isSubmitting
                ? 'bg-slate-300 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white hover:scale-102'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>{isSubmitting ? 'Publishing to Database...' : `Publish ${parsedEdition?.articles?.length || 0} Articles Now`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
