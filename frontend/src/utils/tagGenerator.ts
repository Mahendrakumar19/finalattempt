/**
 * Intelligent Keyword & Tag Auto-Generation Utility
 * Automatically analyzes content, title, category, and subject context to:
 * 1. Extract high-value, topic-specific keywords and tags without boilerplate duplicates.
 * 2. Suggest contextually relevant tags for Current Affairs and Editorial articles.
 * 3. Fallback dynamically to deep content keyword extraction if no tags are provided.
 */

// Common generic stop words that should never become tags
const STOP_WORDS = new Set([
  'the', 'and', 'for', 'that', 'this', 'with', 'from', 'have', 'been',
  'were', 'will', 'would', 'could', 'should', 'about', 'which', 'their',
  'there', 'these', 'those', 'under', 'after', 'before', 'into', 'over',
  'also', 'more', 'most', 'some', 'such', 'only', 'other', 'very', 'than',
  'then', 'them', 'they', 'what', 'when', 'where', 'while', 'whose', 'your',
  'each', 'both', 'between', 'through', 'during', 'without', 'again', 'further',
  'once', 'here', 'why', 'how', 'any', 'all', 'both', 'half', 'many', 'much',
  'same', 'said', 'says', 'amid', 'onto', 'upon', 'towards', 'daily', 'today',
  'edition', 'news', 'update', 'updates', 'report', 'reports', 'article',
  'current-affairs', 'bpsc-prelims', 'mains-notes', 'final', 'attempt'
]);

// High-value civil services domain vocabulary to prioritize when discovered
const DOMAIN_KEYWORD_PATTERNS = [
  // Governance & Polity
  'constitution', 'parliament', 'judiciary', 'supreme court', 'high court',
  'fundamental rights', 'directive principles', 'panchayat', 'federalism',
  'governance', 'election commission', 'ordinance', 'citizenship', 'amendment',
  'tribunal', 'anti-defection', 'delinquency', 'cbi', 'ed', 'lokpal',
  // Economy & Finance
  'gdp', 'inflation', 'rbi', 'monetary policy', 'fiscal deficit', 'niti aayog',
  'disinvestment', 'fdi', 'forex', 'gst', 'direct tax', 'budget', 'msme',
  'banking', 'npa', 'capital expenditure', 'trade deficit', 'fta', 'export',
  // Environment & Climate
  'biodiversity', 'climate change', 'cop28', 'cop29', 'renewable energy',
  'carbon credit', 'wetland', 'ramsar', 'tiger reserve', 'sanctuary',
  'deforestation', 'green hydrogen', 'pollution', 'groundwater', 'monsoon',
  // Science & Tech
  'artificial intelligence', 'isro', 'chandrayaan', 'gaganyaan', 'semiconductor',
  'quantum computing', 'cybersecurity', 'biotechnology', 'genome', 'drone',
  // International Relations
  'g20', 'brics', 'asean', 'quad', 'shanghai cooperation', 'united nations',
  'bilateral', 'geopolitics', 'wto', 'imf', 'world bank', 'indopacific',
  // State-specific (Bihar & Northeast)
  'bihar', 'patna', 'ganga', 'bpsc', 'arunachal', 'northeast', 'bodoland',
  'brahmaputra', 'nalanda', 'rajgir', 'mithila', 'champaran', 'gaya'
];

/**
 * Strips HTML tags and excessive spacing.
 */
export function cleanText(htmlOrText: string): string {
  if (!htmlOrText) return '';
  return htmlOrText
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes a raw string into a clean, kebab-case or space-normalized tag.
 */
export function formatTag(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9\u0900-\u097F\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Extracts candidate tags and keywords from article text, title, and metadata.
 * Does NOT blindly repeat generic boilerplates like 'current-affairs' or 'mains-notes'.
 */
export function extractContentKeywords(
  title: string,
  contentOrSummary: string,
  options?: {
    category?: string;
    existingTags?: string[];
    maxTags?: number;
  }
): string[] {
  const maxTags = options?.maxTags || 6;
  const combinedText = `${cleanText(title)} ${cleanText(contentOrSummary)}`.toLowerCase();

  const foundTags = new Set<string>();

  // 1. Check for prominent domain keywords matching the specific article topic
  for (const domainKey of DOMAIN_KEYWORD_PATTERNS) {
    if (combinedText.includes(domainKey)) {
      foundTags.add(formatTag(domainKey));
      if (foundTags.size >= maxTags) break;
    }
  }

  // 2. Extract significant words (> 3 chars) from Title first
  const cleanTitle = cleanText(title).toLowerCase().replace(/[^a-z0-9\u0900-\u097F\s]/g, ' ');
  const titleWords = cleanTitle.split(/\s+/).filter(w => w.length > 3 && !STOP_WORDS.has(w));

  for (const word of titleWords) {
    if (foundTags.size >= maxTags) break;
    foundTags.add(formatTag(word));
  }

  // 3. Extract high-frequency significant words from the content/summary if needed
  if (foundTags.size < 4) {
    const rawTokens = combinedText.replace(/[^a-z0-9\u0900-\u097F\s]/g, ' ').split(/\s+/);
    const freqMap: Record<string, number> = {};

    for (const token of rawTokens) {
      if (token.length > 4 && !STOP_WORDS.has(token)) {
        freqMap[token] = (freqMap[token] || 0) + 1;
      }
    }

    const sortedTokens = Object.entries(freqMap)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);

    for (const token of sortedTokens) {
      if (foundTags.size >= maxTags) break;
      foundTags.add(formatTag(token));
    }
  }

  // 4. If category is unique and specific, optionally append category as slug
  if (options?.category) {
    const catFormatted = formatTag(options.category);
    if (catFormatted && !['national', 'general', 'uncategorized'].includes(catFormatted)) {
      foundTags.add(catFormatted);
    }
  }

  return Array.from(foundTags).slice(0, maxTags);
}

/**
 * Resolves the final tags array for saving:
 * If user provided tags, formats and cleans them;
 * If no tags provided, automatically discovers high-value keywords from title & content.
 */
export function resolveAutoTags(
  userTags: string | string[] | undefined,
  title: string,
  contentOrSummary: string,
  category?: string
): string[] {
  let parsed: string[] = [];

  if (Array.isArray(userTags)) {
    parsed = userTags.map(t => formatTag(t)).filter(Boolean);
  } else if (typeof userTags === 'string' && userTags.trim()) {
    parsed = userTags
      .split(',')
      .map(t => formatTag(t))
      .filter(Boolean);
  }

  // Filter out any stale generic hardcoded placeholders
  parsed = parsed.filter(t => !['current-affairs', 'bpsc-prelims', 'mains-notes'].includes(t));

  if (parsed.length > 0) {
    // Return unique cleaned user-provided tags
    return Array.from(new Set(parsed)).slice(0, 8);
  }

  // No tags provided: automatically extract topic-specific keywords from content
  const generated = extractContentKeywords(title, contentOrSummary, { category, maxTags: 5 });
  return generated.length > 0 ? generated : ['general-studies'];
}
