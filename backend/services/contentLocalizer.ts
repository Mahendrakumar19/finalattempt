import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { prisma } from '../prisma';
import { translationProvider } from './translationProvider';

// Local in-memory / JSON store cache fallback when MySQL is offline
const JSON_CACHE_PATH = path.join(__dirname, '../translation_cache_store.json');

let localJsonCacheStore: Record<string, any> | null = null;
let saveTimer: NodeJS.Timeout | null = null;

function getLocalJsonCache(): Record<string, any> {
  if (localJsonCacheStore !== null) return localJsonCacheStore;
  try {
    if (fs.existsSync(JSON_CACHE_PATH)) {
      const data = fs.readFileSync(JSON_CACHE_PATH, 'utf-8');
      localJsonCacheStore = JSON.parse(data);
      return localJsonCacheStore!;
    }
  } catch (err) {
    console.error('[ContentLocalizer] Failed to read JSON cache:', err);
  }
  localJsonCacheStore = {};
  return localJsonCacheStore!;
}

function scheduleSaveLocalJsonCache() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    try {
      if (localJsonCacheStore) {
        fs.writeFileSync(JSON_CACHE_PATH, JSON.stringify(localJsonCacheStore, null, 2), 'utf-8');
      }
    } catch (err) {
      console.error('[ContentLocalizer] Failed to write JSON cache:', err);
    } finally {
      saveTimer = null;
    }
  }, 2000);
}

function saveToLocalJsonCache(entityType: string, entityId: string, fieldName: string, sourceLang: string, targetLang: string, sourceHash: string, translatedText: string) {
  const localStore = getLocalJsonCache();
  const jsonKey = `${entityType}_${entityId}_${fieldName}_${sourceLang}_${targetLang}`;
  localStore[jsonKey] = {
    sourceHash,
    translatedText,
    updatedAt: new Date().toISOString()
  };
  scheduleSaveLocalJsonCache();
}

// In-flight concurrency deduplication map to prevent translation stampedes
const inFlightTranslations = new Map<string, Promise<string>>();

export class ContentLocalizer {
  private static ramCache = new Map<string, string>();

  public static clearCache(entityType?: string) {
    if (entityType) {
      for (const key of this.ramCache.keys()) {
        if (key.startsWith(entityType)) {
          this.ramCache.delete(key);
        }
      }
    } else {
      this.ramCache.clear();
    }
  }

  /**
   * Fast heuristic to detect language of input string.
   */
  static detectLanguage(text: string): string {
    if (!text || !text.trim()) return 'en';
    // Devanagari Unicode Block: U+0900 to U+097F
    const devanagariRegex = /[\u0900-\u097F]/;
    return devanagariRegex.test(text) ? 'hi' : 'en';
  }

  /**
   * Computes lightweight SHA-256 hash of text to track source content revisions.
   */
  static computeSourceHash(text: string): string {
    return crypto.createHash('sha256').update(text || '').digest('hex');
  }

  /**
   * Resolves localized text or HTML content for a specific entity field.
   */
  static async resolveLocalizedContent(
    entityType: string,
    entityId: string,
    fieldName: string,
    sourceText: string | null | undefined,
    explicitSourceLang: string | null | undefined,
    targetLang: string | null | undefined,
    isHtml: boolean = false
  ): Promise<string> {
    if (!sourceText || !sourceText.trim()) {
      return sourceText || '';
    }

    const normalizedTarget = (targetLang || 'en').toLowerCase().trim();
    const sourceLang = (explicitSourceLang || this.detectLanguage(sourceText)).toLowerCase().trim();

    // 1. Same-language request: Return canonical source content immediately (0 translation calls)
    if (sourceLang === normalizedTarget) {
      return sourceText;
    }

    const currentHash = this.computeSourceHash(sourceText);
    const cacheKey = `${entityType}:${entityId}:${fieldName}:${sourceLang}->${normalizedTarget}:${currentHash}`;

    // 0. Check Fast RAM Memory Cache (0.001ms response)
    if (this.ramCache.has(cacheKey)) {
      return this.ramCache.get(cacheKey)!;
    }

    // 2. Check DB / JSON Cache
    try {
      let cachedEntry: { translatedText: string; sourceHash: string } | null = null;

      try {
        const dbCache = await (prisma as any).translation_cache.findFirst({
          where: {
            entityType,
            entityId,
            fieldName,
            sourceLanguage: sourceLang,
            targetLanguage: normalizedTarget
          }
        });
        if (dbCache) {
          cachedEntry = {
            translatedText: dbCache.translatedText,
            sourceHash: dbCache.sourceHash
          };
        }
      } catch (dbErr) {
        // Fallback to local JSON cache store if DB is offline
        const localStore = getLocalJsonCache();
        const jsonKey = `${entityType}_${entityId}_${fieldName}_${sourceLang}_${normalizedTarget}`;
        if (localStore[jsonKey]) {
          cachedEntry = localStore[jsonKey];
        }
      }

      // 3. Cache HIT: Store in RAM & return cached translation if source hash matches
      if (cachedEntry && cachedEntry.sourceHash === currentHash) {
        this.ramCache.set(cacheKey, cachedEntry.translatedText);
        return cachedEntry.translatedText;
      }
    } catch (cacheErr) {
      console.warn('[ContentLocalizer] Cache read warning:', cacheErr);
    }

    // 4. Concurrency Protection (Deduplication Lock)
    if (inFlightTranslations.has(cacheKey)) {
      try {
        return await inFlightTranslations.get(cacheKey)!;
      } catch (lockErr) {
        return sourceText;
      }
    }

    // 5. Cache MISS: Perform Translation Operation
    const translationPromise = (async () => {
      try {
        let translated: string;
        if (isHtml) {
          translated = await translationProvider.translateHtml(sourceText, sourceLang, normalizedTarget);
        } else {
          translated = await translationProvider.translateText(sourceText, sourceLang, normalizedTarget);
        }

        if (!translated || !translated.trim()) {
          translated = sourceText;
        }

        // Store in RAM Cache
        this.ramCache.set(cacheKey, translated);

        // Save Translation to Cache
        try {
          await (prisma as any).translation_cache.upsert({
            where: {
              entityType_entityId_fieldName_sourceLanguage_targetLanguage: {
                entityType,
                entityId,
                fieldName,
                sourceLanguage: sourceLang,
                targetLanguage: normalizedTarget
              }
            },
            update: {
              translatedText: translated,
              sourceHash: currentHash,
              updatedAt: new Date()
            },
            create: {
              id: crypto.randomUUID(),
              entityType,
              entityId,
              fieldName,
              sourceLanguage: sourceLang,
              targetLanguage: normalizedTarget,
              sourceHash: currentHash,
              translatedText: translated
            }
          });
        } catch (saveDbErr) {
          saveToLocalJsonCache(entityType, entityId, fieldName, sourceLang, normalizedTarget, currentHash, translated);
        }

        return translated;
      } catch (err: any) {
        console.error(`[ContentLocalizer] Error localizing ${entityType}.${fieldName}:`, err.message || err);
        return sourceText; // Fallback to original source text
      } finally {
        inFlightTranslations.delete(cacheKey);
      }
    })();

    inFlightTranslations.set(cacheKey, translationPromise);
    return await translationPromise;
  }

  /**
   * Helper to resolve all translatable fields of an entity object.
   */
  static async localizeEntity<T extends Record<string, any>>(
    entityType: string,
    entity: T | null | undefined,
    fields: string[],
    targetLang: string,
    htmlFields: string[] = []
  ): Promise<T | null | undefined> {
    const normalizedTarget = (targetLang || 'en').toLowerCase().trim();
    const explicitLang = entity.language || entity.sourceLanguage;
    
    const localized = { ...entity };

    // Entity types where translations are typed manually by team (Zero machine translation engine calls)
    const MANUAL_ONLY_TYPES = ['current_affair_article', 'current_affairs_compilation', 'blog', 'test_series', 'exam', 'lms_question'];
    const isManualOnly = MANUAL_ONLY_TYPES.includes(entityType);

    if (normalizedTarget === 'hi') {
      // Direct Authored Hindi Content Prioritization (0ms latency, zero translation API call)
      fields.forEach((field) => {
        const hiField = `${field}_hi`;
        const altHiField = `${field}Hi`;
        if (typeof localized[hiField] === 'string' && localized[hiField].trim().length > 0) {
          localized[field as keyof T] = localized[hiField];
        } else if (typeof localized[altHiField] === 'string' && localized[altHiField].trim().length > 0) {
          localized[field as keyof T] = localized[altHiField];
        }
      });
    }

    if (isManualOnly) {
      return localized; // Completely skip auto-translation engine for Current Affairs, Blogs & Test Series
    }

    // Concurrently resolve any remaining un-authored fields using translation engine
    await Promise.all(fields.map(async (field) => {
      // Skip if field was already populated via authored Hindi content
      const hiField = `${field}_hi`;
      const altHiField = `${field}Hi`;
      if (
        normalizedTarget === 'hi' &&
        ((typeof localized[hiField] === 'string' && localized[hiField].trim().length > 0) ||
         (typeof localized[altHiField] === 'string' && localized[altHiField].trim().length > 0))
      ) {
        return;
      }

      if (typeof localized[field] === 'string' && localized[field].trim().length > 0) {
        const isHtml = htmlFields.includes(field);
        localized[field as keyof T] = (await this.resolveLocalizedContent(
          entityType,
          String(entity.id || 'default'),
          field,
          localized[field],
          explicitLang,
          targetLang,
          isHtml
        )) as any;
      }
    }));

    return localized;
  }

  /**
   * Helper to resolve translatable fields across a list of entity objects.
   */
  static async localizeEntityList<T extends Record<string, any>>(
    entityType: string,
    list: T[],
    fields: string[],
    targetLang: string,
    htmlFields: string[] = []
  ): Promise<T[]> {
    if (!Array.isArray(list) || list.length === 0) return list || [];
    return Promise.all(list.map(item => this.localizeEntity(entityType, item, fields, targetLang, htmlFields) as Promise<T>));
  }

  /**
   * Quiz Question Localizer: Translates ONLY questionText, options, and explanation.
   * STRICTLY PRESERVES id, quizId, correctAnswer ('A'|'B'|'C'|'D'), marks, negativeMarks, and orderIndex.
   */
  static async localizeQuizQuestions<T extends Record<string, any>>(
    questions: T[],
    targetLang: string
  ): Promise<T[]> {
    if (!Array.isArray(questions) || questions.length === 0) return questions || [];
    const normalizedTarget = (targetLang || 'en').toLowerCase().trim();

    return Promise.all(questions.map(async (q) => {
      const localized: Record<string, any> = { ...q };

      // Use authored Hindi fields directly when target locale is Hindi (Zero machine translation call)
      if (normalizedTarget === 'hi') {
        if (q.questionTextHi) localized.questionText = q.questionTextHi;
        if (q.optionAHi) localized.optionA = q.optionAHi;
        if (q.optionBHi) localized.optionB = q.optionBHi;
        if (q.optionCHi) localized.optionC = q.optionCHi;
        if (q.optionDHi) localized.optionD = q.optionDHi;
        if (q.optionEHi) localized.optionE = q.optionEHi;
        if (q.explanationHi) localized.explanation = q.explanationHi;
      }

      // CRITICAL: Ensure correctAnswer, id, quizId, marks are completely untouched
      localized.id = q.id;
      localized.quizId = q.quizId;
      localized.correctAnswer = q.correctAnswer;
      localized.marks = q.marks;
      localized.negativeMarks = q.negativeMarks;

      return localized as T;
    }));
  }
}

/**
 * Extracts target language from Express request header (x-locale) or query parameter.
 */
export function getTargetLang(req: any): string {
  const headerLocale = req?.headers?.['x-locale'];
  if (headerLocale && typeof headerLocale === 'string') return headerLocale.toLowerCase().trim();
  const queryLocale = req?.query?.lang || req?.query?.locale;
  if (queryLocale && typeof queryLocale === 'string') return queryLocale.toLowerCase().trim();
  
  // Parse Cookie header fallback (NEXT_LOCALE=hi)
  const rawCookie = req?.headers?.cookie || '';
  const match = rawCookie.match(/(?:^|; )NEXT_LOCALE=([^;]*)/);
  if (match && match[1]) {
    return decodeURIComponent(match[1]).toLowerCase().trim();
  }

  return 'en';
}

