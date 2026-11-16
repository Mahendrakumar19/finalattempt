import fs from 'fs';
import path from 'path';
import { db, DynamicCurrentAffairEdition, DynamicCurrentAffairArticle } from '../db';

interface RawNewsItem {
  source: string;
  title: string;
  description: string;
  link: string;
}

export class AutoNewsAgent {
  private apiKey: string = '';

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
  }

  public getApiKey(): string {
    if (this.apiKey) return this.apiKey;
    if (process.env.GEMINI_API_KEY) {
      this.apiKey = process.env.GEMINI_API_KEY.trim();
      return this.apiKey;
    }
    // Direct file inspection fallback (ensures VPS works even without pm2 --update-env)
    const candidatePaths = [
      path.resolve(process.cwd(), '.env'),
      path.resolve(process.cwd(), 'backend/.env'),
      path.resolve(__dirname, '.env'),
      path.resolve(__dirname, '../.env'),
      path.resolve(__dirname, '../../.env'),
      '/var/www/finalattempt/backend/.env',
      '/var/www/finalattempt/.env'
    ];
    for (const p of candidatePaths) {
      try {
        if (fs.existsSync(p)) {
          const content = fs.readFileSync(p, 'utf8');
          const match = content.match(/GEMINI_API_KEY\s*=\s*([^\r\n#]+)/);
          if (match && match[1]) {
            this.apiKey = match[1].trim().replace(/^['"]|['"]$/g, '');
            console.log(`[AutoNewsAgent] Loaded GEMINI_API_KEY from file: ${p}`);
            return this.apiKey;
          }
        }
      } catch {}
    }
    return '';
  }

  /**
   * Fetch RSS feeds from The Hindu, Indian Express, and PIB
   */
  public async fetchRawFeeds(): Promise<RawNewsItem[]> {
    const feeds: { source: string; url: string }[] = [
      { source: 'The Hindu (National)', url: 'https://www.thehindu.com/news/national/feeder/default.rss' },
      { source: 'The Hindu (International)', url: 'https://www.thehindu.com/news/international/feeder/default.rss' },
      { source: 'The Hindu (Economy)', url: 'https://www.thehindu.com/business/Economy/feeder/default.rss' },
      { source: 'Indian Express (National)', url: 'https://indianexpress.com/section/india/feed/' },
      { source: 'Indian Express (Explained)', url: 'https://indianexpress.com/section/explained/feed/' },
      { source: 'Dainik Jagran (Bihar Special)', url: 'https://www.jagran.com/rss/bihar.xml' }
    ];

    const rawItems: RawNewsItem[] = [];

    await Promise.allSettled(
      feeds.map(async (feed) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);
          const res = await fetch(feed.url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (!res.ok) return;
          const xml = await res.text();

          const itemRegex = /<item[\s\S]*?<\/item>/gi;
          let match;
          let count = 0;
          while ((match = itemRegex.exec(xml)) !== null && count < 5) {
            const itemStr = match[0];
            const titleMatch = itemStr.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
            const descMatch = itemStr.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
            const linkMatch = itemStr.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);

            if (titleMatch && titleMatch[1]) {
              const cleanTitle = titleMatch[1].replace(/<[^>]+>/g, '').replace(/&#\d+;/g, '').trim();
              const cleanDesc = (descMatch ? descMatch[1] : '').replace(/<[^>]+>/g, '').replace(/&#\d+;/g, '').trim();
              if (cleanTitle.length > 10) {
                rawItems.push({
                  source: feed.source,
                  title: cleanTitle,
                  description: cleanDesc,
                  link: linkMatch ? linkMatch[1].trim() : ''
                });
                count++;
              }
            }
          }
        } catch {
          // Ignore individual feed failures gracefully
        }
      })
    );

    return rawItems;
  }

  /**
   * Run Gemini 3.5 Flash to synthesize news into UPSC/BPSC Current Affairs format
   */
  public async generateDailyEdition(targetDate?: string, asDraft: boolean = true): Promise<DynamicCurrentAffairEdition> {
    const pubDate = targetDate || new Date().toISOString().split('T')[0];
    const rawFeeds = await this.fetchRawFeeds();

    // Prepare prompt with collected news items
    const feedDigest = rawFeeds.map((f, i) => `${i + 1}. [${f.source}] ${f.title}\nSummary: ${f.description}`).join('\n\n');

    const systemPrompt = `You are the Senior Chief Editor & Current Affairs Curator for "Final Attempt" (a premier UPSC & BPSC Civil Services coaching academy).
You are analyzing today's raw news headlines and editorial feeds from The Hindu, Indian Express, PIB, and Bihar News.

Your task:
1. Filter out all non-exam gossip, crime, political blame games, or trivia.
2. Select 4 to 6 top high-priority stories with direct relevance to BPSC / UPSC GS-1, GS-2, GS-3 syllabus (Polity & Governance, Economy, Environment, Sci-Tech, International Relations, and Bihar Special).
3. Structure them into an exam-oriented bilingual (English + Hindi) Current Affairs edition.
4. Output MUST be ONLY valid JSON matching this exact structure:

{
  "publishDate": "${pubDate}",
  "publish_target": "both",
  "summary": "Brief 2-line English summary of key developments of ${pubDate}.",
  "summary_hi": "${pubDate} के प्रमुख सिविल सेवा परीक्षा उपयोगी समसामयिक घटनाक्रम का सार।",
  "articles": [
    {
      "title": "Clear Headline in English",
      "title_hi": "सटीक शीर्षक हिंदी में",
      "category": "NATIONAL", // Strictly one of: "NATIONAL", "INTERNATIONAL", "BIHAR"
      "importance": "HIGH", // "HIGH", "MEDIUM", or "LOW"
      "readingTime": "4 mins",
      "tags": ["Polity", "Governance", "BPSC", "GS2"],
      "source": "The Hindu / PIB / Indian Express",
      "summary": "Crisp 3-sentence summary in English...",
      "summary_hi": "सटीक 3-वाक्यों का हिंदी सारांश...",
      "whyInNews": "Why is this topic in the news today?",
      "keyHighlights": "Key provisions, acts, data points, or policy decisions...",
      "importantFacts": "Prelims pointers: constitutional articles, institutions, dates, rankings, reports...",
      "examRelevance": "Mains perspective: governance issues, critical dimensions, way forward...",
      "content": "Full detailed markdown article in English with subheadings...",
      "content_hi": "हिंदी में विस्तृत विश्लेषणात्मक लेख (उपशीर्षकों सहित)..."
    }
  ]
}

Raw News Feeds for ${pubDate}:
${feedDigest || 'Generate top 5 priority civil services current affairs for today from national and international developments.'}

Return ONLY the raw JSON object. No markdown codeblock fences, no conversational intro or outro.`;

    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is missing. Please ensure GEMINI_API_KEY is defined in backend/.env');
    }

    const modelsToTry = [
      { ver: 'v1beta', name: 'gemini-3.1-flash-lite' },
      { ver: 'v1', name: 'gemini-3.5-flash-lite' },
      { ver: 'v1beta', name: 'gemini-3.5-flash-lite' },
      { ver: 'v1', name: 'gemini-3.1-flash-lite' },
      { ver: 'v1beta', name: 'gemini-3.8-flash' }
    ];
    let geminiResponseText = '';

    for (const m of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/${m.ver}/models/${m.name}:generateContent?key=${apiKey}`;
        const ctrl = new AbortController();
        const timeoutId = setTimeout(() => ctrl.abort(), 45000);

        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 6144,
              responseMimeType: 'application/json'
            }
          }),
          signal: ctrl.signal
        });
        clearTimeout(timeoutId);

        if (resp.ok) {
          const data: any = await resp.json();
          const candidate = data.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text || data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidate) {
            console.log(`[AutoNewsAgent] Successfully generated edition using ${m.ver}/${m.name} (${candidate.length} chars)`);
            geminiResponseText = candidate;
            break;
          }
        } else {
          const errText = await resp.text().catch(() => '');
          console.warn(`[AutoNewsAgent] Model ${m.ver}/${m.name} returned HTTP ${resp.status}:`, errText.slice(0, 180));
        }
      } catch (err: any) {
        console.warn(`[AutoNewsAgent] Model ${m.ver}/${m.name} request failed:`, err.message);
      }
    }

    if (!geminiResponseText) {
      throw new Error('Gemini AI failed to generate current affairs from feeds. Please check logs for API response.');
    }

    // Clean JSON
    let cleaned = geminiResponseText.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    const parsed = JSON.parse(cleaned);

    const editionId = `edition-${pubDate}`;
    const normalizedArticles: DynamicCurrentAffairArticle[] = (parsed.articles || []).map((art: any, idx: number) => {
      const rawCat = String(art.category || '').toUpperCase();
      let cat: 'NATIONAL' | 'INTERNATIONAL' | 'BIHAR' | 'ARUNACHAL' = 'NATIONAL';
      if (rawCat.includes('BIHAR')) cat = 'BIHAR';
      else if (rawCat.includes('ARUNACHAL')) cat = 'ARUNACHAL';
      else if (rawCat.includes('INTER') || rawCat.includes('GLOBAL') || rawCat.includes('WORLD')) cat = 'INTERNATIONAL';

      const artTitle = (art.title || art.title_hi || `Article ${idx + 1}`).trim();
      const artTitleHi = (art.title_hi || art.title || artTitle).trim();
      const artSummary = (art.summary || art.summary_hi || '').trim();
      const artSummaryHi = (art.summary_hi || art.summary || artSummary).trim();

      let contentEn = art.content || '';
      if (!contentEn) {
        contentEn = `### Why in News?\n${art.whyInNews || ''}\n\n### Key Highlights\n${art.keyHighlights || ''}\n\n### Prelims Pointers\n${art.importantFacts || ''}\n\n### Mains Dimensions\n${art.examRelevance || ''}`;
      }

      let contentHi = art.content_hi || '';
      if (!contentHi) {
        contentHi = `### चर्चा में क्यों?\n${art.whyInNews || ''}\n\n### प्रमुख बिंदु\n${art.keyHighlights || ''}\n\n### प्रारंभिक परीक्षा दृष्टि\n${art.importantFacts || ''}\n\n### मुख्य परीक्षा दृष्टिकोण\n${art.examRelevance || ''}`;
      }

      return {
        id: `auto-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        editionId,
        slug: artTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `article-${Date.now()}-${idx}`,
        title: artTitle,
        title_hi: artTitleHi,
        summary: artSummary,
        summary_hi: artSummaryHi,
        content: contentEn,
        content_hi: contentHi,
        category: cat,
        publishStatus: asDraft ? 'DRAFT' : 'PUBLISHED',
        publishedDate: pubDate,
        readingTime: art.readingTime || '4 mins',
        importance: (art.importance || 'HIGH').toUpperCase() as 'HIGH' | 'MEDIUM' | 'LOW',
        publish_target: (art.publish_target || 'both') as 'both' | 'english' | 'hindi',
        language: 'bilingual',
        whyInNews: art.whyInNews || '',
        keyHighlights: art.keyHighlights || '',
        importantFacts: art.importantFacts || '',
        examRelevance: art.examRelevance || '',
        tags: Array.isArray(art.tags) ? art.tags : ['Current Affairs', 'BPSC', 'UPSC'],
        sources: [art.source || 'The Hindu / PIB']
      } as DynamicCurrentAffairArticle;
    });

    const edition: DynamicCurrentAffairEdition = {
      id: editionId,
      publishDate: pubDate,
      summary: parsed.summary || `Daily Civil Services Current Affairs for ${pubDate}`,
      title_hi: parsed.title_hi || `दैनिक समसामयिकी - ${pubDate}`,
      summary_hi: parsed.summary_hi || `${pubDate} के मुख्य सिविल सेवा समसामयिक घटनाक्रम।`,
      publish_target: 'both',
      articles: normalizedArticles
    };

    // Save into database
    await db.createOrUpdateDynamicCurrentAffairEdition(edition);

    return edition;
  }
}

export const autoNewsAgent = new AutoNewsAgent();
