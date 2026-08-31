import { DocumentBlock } from '../core/NormalizedDocument';
import { BlockType } from '../core/Constants';
import { BoundaryDetector } from './BoundaryDetector';

export function isHeaderFooterNoise(text: string): boolean {
  const t = text.trim();
  if (!t) return true;

  // Page Numbers / Pagination Footers
  if (/^--\s*\d+\s*of\s*\d+\s*--$/i.test(t)) return true;
  if (/^page\s*\d+(?:\s*of\s*\d+)?$/i.test(t)) return true;
  if (/^\d+\s*of\s*\d+$/i.test(t)) return true;
  if (/^-\s*\d+\s*-$/i.test(t)) return true;
  if (/^\d+\s*\/\s*\d+$/i.test(t)) return true;
  if (/^--\s*\d+\s*--$/i.test(t)) return true;

  // Generic Book / Header / Footer / Watermark / Document Title Noise (Universal across ALL subjects & documents)
  if (/^(?:[A-Z0-9\s]+(?:BOOK|MANUAL|MODULE|NOTES|GUIDE|SERIES|PAPER|MOCK|TEST|SET|QUIZ|EXAM|QUESTION\s+BANK)\b(?:\s+[A-Z0-9\s]+(?:BOOK|MANUAL|MODULE|NOTES|GUIDE|SERIES|PAPER|MOCK|TEST|SET|QUIZ|EXAM|QUESTION\s+BANK)\b)*)$/i.test(t) && !/\?|\b\d{1,4}[\.\:\)]/i.test(t)) return true;
  if (/^(?:ALL\s+RIGHTS\s+RESERVED|COPYRIGHT|WWW\.[A-Z0-9\.\-]+\.[A-Z]{2,}|PAGE\s+\d+)$/i.test(t)) return true;

  return false;
}

export class BlockClassifier {
  /**
   * Classifies a document block using multiple structural, syntactic, and contextual signals
   */
  static classifyBlock(
    block: DocumentBlock,
    previousBlock: DocumentBlock | null,
    nextBlocks: DocumentBlock[],
    expectedQNum: number | null
  ): BlockType {
    const text = block.text.trim();
    if (!text || isHeaderFooterNoise(text)) return 'NOISE';

    // Signal 1: Table blocks
    if (block.type === 'TABLE' || block.tableData) {
      return 'TABLE';
    }

    // Signal 2: Heading / Section Candidate check
    const isExamCitationOrList = /(?:B\.?P\.?S\.?C|C\.?D\.?P\.?O|P\.?C\.?S|U\.?P\.?S\.?C|B\.?P\.?C\.?S|S\.?S\.?C|R\.?A\.?I\.?L|PRE|RE-?EXAM|MAINS|CDPO|\b20\d{2}\b|\b19\d{2}\b)/i.test(text) ||
      /^(?:[I|V|X]+\.|\([a-eA-E]\)|[a-eA-E]\.)[ \t]+/i.test(text);

    const isAllCapsTitle =
      text.length >= 3 &&
      text.length <= 120 &&
      /[A-Z]/.test(text) && // Must contain Latin uppercase letters
      text === text.toUpperCase() &&
      !text.includes('?') &&
      !isExamCitationOrList &&
      !/^(?:Q|Question|Question\s+No\.|Q\.|प्र\.|प्रश्न)[ \t]*$/i.test(text) &&
      !/^(?:Q|Question|Question\s+No\.|Q\.|प्र\.|प्रश्न)?[ \t]*\d+/i.test(text) &&
      !/^(?:Ans|Answer|Explanation|Sol|Code|List)[\s\:]/i.test(text) &&
      !isHeaderFooterNoise(text);

    const isKnownTopicHeading =
      /^(?:CHAPTER|SECTION|PART|UNIT|TOPIC|SUBJECT|LESSON|MODULE|भाग|अध्याय|खंड|इकाई|विषय)[\s\:\-\d]/i.test(text) ||
      /^(?:HISTORY|GEOGRAPHY|POLITY|ECONOMY|ECONOMICS|SCIENCE|ENVIRONMENT|ECOLOGY|ETHICS|APTITUDE|REASONING|ENGLISH|HINDI|CURRENT\s+AFFAIRS|GENERAL\s+STUDIES|GENERAL\s+KNOWLEDGE|BIHAR\s+SPECIAL|UP\s+SPECIAL|MP\s+SPECIAL|RAJASTHAN\s+SPECIAL|ANCIENT\s+HISTORY|MEDIEVAL\s+HISTORY|MODERN\s+HISTORY|ART\s+AND\s+CULTURE|INDIAN\s+POLITY|PHYSICAL\s+GEOGRAPHY|INDIAN\s+GEOGRAPHY|WORLD\s+GEOGRAPHY|GENERAL\s+SCIENCE|PHYSICS|CHEMISTRY|BIOLOGY|TECHNOLOGY|HISTORY\s+OF\s+INDIA|INDIAN\s+NATIONAL\s+MOVEMENT|INDIAN\s+ECONOMY|GOVERNANCE|CONSTITUTION|SOURCE\s+OF\s+CONSTITUTION|CONSTITUENT\s+ASSEMBLY|PREAMBLE|MAJOR\s+COMMITTEES|FUNDAMENTAL\s+RIGHTS|DIRECTIVE\s+PRINCIPLES|FUNDAMENTAL\s+DUTIES|UNION\s+EXECUTIVE|PARLIAMENT|SUPREME\s+COURT|HIGH\s+COURT|GOVERNOR|STATE\s+LEGISLATURE|PANCHAYATI\s+RAJ|AMENDMENTS?|EMERGENCY\s+PROVISIONS|CONSTITUTIONAL\s+BODIES|इतिहास|भूगोल|राजव्यवस्था|अर्थव्यवस्था|विज्ञान|पर्यावरण|करंट\s+अफेयर्स|सामान्य\s+ज्ञान|बिहार\s+विशेष)$/i.test(text) ||
      /^(?:संविधान\s+के?\s+स्रोत|संविधान\s+सभा|संविधान\s+निर्माण\s+प्रक्रिया|उद्देशिका|प्रस्तावना|मूल\s+अधिकार|मौलिक\s+अधिकार|राज्य\s+के\s+नीति\s+निदेशक\s+तत्व|मूल\s+कर्तव्य|संसद|उच्चतम\s+न्यायालय|उच्च\s+न्यायालय|कार्यपालिका|राष्ट्रपति|राज्यपाल|पंचायती\s+राज|संविधान\s+संशोधन|आपात\s+उपबंध|संवैधानिक\s+निकाय)$/i.test(text);

    if (
      block.type === 'HEADING' ||
      block.type === 'SUBHEADING' ||
      isKnownTopicHeading ||
      isAllCapsTitle
    ) {
      return 'HEADING';
    }

    // Signal 3: Answer Key candidate check
    // e.g. "Answer: A", "Ans: B", "Correct Answer: C", "Key: D", "1-A", "Q1. B"
    if (
      /^(?:Answer|Ans|Correct\s*Answer|Key|उत्तर)[\s\:\-\=]*[A-Ea-eक-ङ]\b/i.test(text) ||
      /^(?:Q|Question|Q\.)?\d{1,4}[\.\:\-\=\s]+[A-Ea-eक-ङ]\b$/i.test(text)
    ) {
      return 'ANSWER_CANDIDATE';
    }

    // Signal 4: Explanation candidate check
    // e.g. "Explanation:", "Solution:", "Sol:", "Detailed Explanation:", "व्याख्या:"
    if (/^(?:Explanation|Solution|Sol|Detailed\s*Explanation|व्याख्या|समाधान)[\s\:\-]/i.test(text)) {
      return 'EXPLANATION_CANDIDATE';
    }

    // Signal 5: Option Candidate check
    // e.g. "(a)", "A.", "A)", "1.", "(क)", "क."
    const optMatch = /^[ \t]*(?:\(([abcdeABCDEक-ङकखगघङ])\)|\b([abcdeABCDEक-ङकखगघङ])\b[\.\:\)\-–—]+)[ \t]+/i.exec(text);
    if (optMatch) {
      const afterText = text.substring(optMatch[0].length).trim();
      if (!/^[A-Z]\./i.test(afterText) && !/^\.[A-Z]\./i.test(afterText)) {
        return 'OPTION_CANDIDATE';
      }
    }

    // Signal 6: Question Boundary candidate evaluation
    const boundary = BoundaryDetector.evaluate(block, previousBlock, nextBlocks, expectedQNum);
    if (boundary.isQuestionBoundary) {
      return 'QUESTION_CANDIDATE';
    }

    return 'PARAGRAPH';
  }
}
