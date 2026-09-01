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

/**
 * Detects standalone generic document headings / section labels that should be
 * excluded from question/option/explanation fields.
 *
 * Signals used:
 * - Short standalone text (typically 1-4 words)
 * - No question marker prefix
 * - No option marker prefix
 * - No answer/explanation marker prefix
 * - Devanagari or Latin script
 * - Position: often precedes a question cluster
 */
function isStandaloneDocumentHeading(text: string, previousBlock: DocumentBlock | null, nextBlocks: DocumentBlock[]): boolean {
  const t = text.trim();
  if (!t || t.length > 80) return false;

  const hasQuestionMarker = /^(?:Q|Question|Question\s+No\.|Q\.|प्र\.|प्रश्न)/i.test(t);
  const hasOptionMarker = /^[ \t]*(?:\([a-eA-Eक-ङकखगघङ]\)|[a-eA-Eक-ङकखगघङ][\.\:\)\-–—]+)/i.test(t);
  const hasAnswerMarker = /^(?:Answer|Ans|Correct\s*Answer|Key|उत्तर)[\s\:\-\=]*[A-Ea-eक-ङ]/i.test(t);
  const hasExplanationMarker = /^(?:Explanation|Solution|Sol|व्याख्या|समाधान)[\s\:\-]/i.test(t);
  const hasNumberPrefix = /^\d+[\.\:\)\-–—]/.test(t);

  if (hasQuestionMarker || hasOptionMarker || hasAnswerMarker || hasExplanationMarker || hasNumberPrefix) {
    return false;
  }

  // Known heading keywords (English + Hindi)
  const knownHeadingPrefixes =
    /^(?:CHAPTER|SECTION|PART|UNIT|TOPIC|SUBJECT|LESSON|MODULE|भाग|अध्याय|खंड|इकाई|विषय|अनुच्छेद|प्रकरण|प्रश्न|सूचना|परिचय|विषय\s+वस्तु|निर्देश|अवधारणा|प्रयोजन|सिद्धांत|विधि|कार्य|लक्षण|विशेषता|सीमा|की\s+समस्याएं|अवलोकन|परिचर्चा|निष्कर्ष|संदर्भ|सन्दर्भ|उदाहरण|प्रयोग|अभ्यास|मूल्यांकन|परिक्षण|अनुभव|जानकारी|विवरण|वारंटी|शर्तें|नियम|धारणा|अनुमान|सूत्र|तालिका|आकृति|चित्र|डायग्राम|मानचित्र|नक्शा|ज्ञान|बोध|सूचना|तकनीक|प्रौद्योगिकी|विग्यान|विज्ञान|मानविकी|सामाजिक|अर्थशास्त्र|पूर्वाधार|समर्थन|आधार|मूल|मुख्य|प्रमुख|महत्वपूर्ण|आवश्यक|अनिवार्य|सटीक|पूर्ण|सम्पूर्ण|पर्याप्त|अपर्याप्त|अधिक|कम|बढ़िया|खराब|सही|गलत|सत्य|असत्य|वैध|अवैध|कानूनी|अवैधनिक|राजकीय|साम्राज्य|साम्राज्यवाद|साम्राज्यवादी|अर्थव्यवस्था|व्यवस्था|व्यवस्थापन|शासन|प्रशासन|नगरपालिका|जनपद|जिला|प्रदेश|राज्य|केंद्र|केन्द्र|राष्ट्र|देश|विश्व|जगत्|पृथ्वी|पानी|जल|मिट्टी|भूमि|हवा|वायु|आकाश|सूरज|सूर्य|चंद्र|नक्षत्र|तारा|बादल|बारिश|वर्षा|बर्फ|पहाड़|पहाड़|घाटी|नदी|समुद्र|सागर|झील|तालाब|बंध|पुल|सड़क|पथ|मार्ग|रेल|विमान|जहाज|गाड़ी|वाहन|यात्रा|सफर|खाने|पीने|सोना|जागना|काम|क्रिया|गतिविधि|कार्य|सेवा|उत्पादन|व्यापार|व्यापारी|उद्योग|कृषि|खेती|बागवानी|पशु|पशुपालन|मत्स्य|मच्छी|वन|जंगल|पेड़|पौधा|फूल|फल|सब्जी|अनाज|दाल|मसाले|चीनी|नमक|तेल|घी|दूध|पनीर|मांस|चिकन|मछली|रोटी|चावल|आटा|बिस्कुट|चाय|कॉफी|शहद|मिठाई|खाना|भोजन|आहार|जेवर|डिनर|ब्रेकफास्ट|लंच|स्नैक|रात्रि|दिन|सप्ताह|महिना|साल|वर्ष|युग|काल|समय|घड़ी|मिनट|सेकंड|माइले|किलोमीटर|मीटर|सेंटीमीटर|मिलीमीटर|लीटर|मिलीलीटर|ग्राम|किलोग्राम|मीट्रिक|इंपीरियल|फारेनहाइट|सेल्सियस|डिग्री|प्रतिशत|अंश|भिन्न|दशमलव|पूर्णांक|पूर्ण|अपूर्ण|विचार|धारणा|अवधारणा|सिद्धांत|तत्व|नियम|नियमावली|कानून|विधान|संविधान|अधिनियम|कर|शुल्क|जरिया|राशि|मूल्य|किंमत|भाव|दाम|खर्च|व्यय|आय|वृद्धि|कमी|लाभ|हानि|नुकसान|जोखिम|सुरक्षा|बीमा|सेवा|सुविधा|सुविधा|सुविधा|अवसर|अवसर|सामर्थ्य|क्षमता|योग्यता|सीखना|शिक्षा|विद्या|ज्ञान|विद्वान|पंडित|अभ्यास|रिवाज़|परम्परा|संस्कृति|धर्म|मत|अस्थायी|स्थायी|स्थिर|अस्थिर|सुंदर|बदसूरत|आकर्षक|निराकर्षक|मजबूत|कमजोर|तेज़|धीमा|तेज|सुनहरा|हरा|लाल|नीला|काला|सफेद|पीला|गुलाबी|जैमिनी|सफेद|भूरा|भैंस|गाय|बकरी|भेड़|सूअर|कुत्ता|बिल्ली|घोड़ा|घोड़ा|हाथी|सिंह|बाघ|चीता|हिरण|कबूतर|कौआ|मोर|पंछी|पक्षी|मगर|कछुआ|साँप|सांप|भूंदा|इंसान|आदमी|मर्द|नर|स्त्री|महिला|बच्चा|बालक|बालिका|युवक|युवती|जवान|बूढ़ा|बूढ़ी|पुरुष|आदमी|इंसान|मानव|जाति|धर्म|भाषा|राष्ट्र|देश|विश्व|जगत|पृथ्वी|ग्रह|नक्षत्र|तारा|सूरज|चंद्रमा|सूर्य|अंधकार|प्रकाश|रोशनी|आकाश|अस्मान|वायुमंडल|मौसम|जलवायु|ताप|ठंडा|गर्म|बरफ|बर्फ|बारिश|वर्षा|छाटा|धूप|तेज|हवा|पवन|तूफान|आंधी|भūकंप|ज्वालामुखी|पहाड़|पर्वत|तट|समुद्रतट|ख़ाड़ी|बंध|नहर|नदी|झील|तालाब|कोल|सरोवर|बांध|डैम|जलाशय|जल_पोषण|जलापूर्ति|सिंचाई|खाद|बुवाई|कटाई|फसल|उपज|पैदावार|मंडी|बाज़ार|दुकान|किराना|सप्लाई|डिलीवरी|रास्ता|मार्ग|सड़क|हाईवे|एक्सप्रेसवे|लेन|चौराह|चौक|मोड़|पुल|उपरोक्त|निम्न|लिखित|कथित|अनुमानित|अनुभवित|सूचित|सूचना|सूचक|सूचकांक|सूची|फ़ैसला|निर्णय|विचार|मंथन|चर्चा|वाद|विवाद|टीका|टिप्पणी|राय|अभिप्राय|समझ|बुझ|समझना|बूझना|जानना|सीखना|पढ़ना|लिखना|बोलना|कहना|सुनना|देखना|देख|दृष्टि|नेत्र|कान|कान|नाक|नाक|मुँह|चेहरा|हाथ|पैर|आंट|टांग|सिर|गर्दन|कंधा|पीठ|पेट|दिल|मन|दिमाग|सोच|विचार|क्रिया|गति|विश्राम|नींद|सोना|जागना|उठना|बैठना|खड़ा|चलना|दौड़ना|कूदना|आना|जाना|लाना|ले जाना|देना|लेना|खोलना|बंद|बंद|आरंभ|शुरू|समाप्त|खत्म|पूर्ण|अपूर्ण|सार|मूल|मूल्य|लाभ|हानि|असफलता|सफलता|जीत|हार|खिलाड़ी|टीम|गोल|पॉइंट|स्कोर|गेम|खेल|रंग|रंग|आकार|आकार|बड़ा|छोटा|लंबा|छोटा|ऊंचा|नीचा|गहरा|उथला|मोटा|पतला|भारी|हल्का|कठोर|नरम|तीखा|मीठा|कड़वा|नमकीन|खट्टा|कच्चा|पका|गर्म|ठंडा|सुगंधित|दुर्गंध|साफ|गंदा|साफ़|गंदगी|सूचना|सूचना|सूचना|सूचना|सूचना|सूचना|सूचना|सूचना|सूचना|सूचना|सूचना|सूचना|सूचना|सूचना|सूचना|सूचना)$/i.test(t);

  if (knownHeadingPrefixes) return true;

  // Detect short standalone headings (1-3 words) in Devanagari or Latin that are NOT question/option/answer/explanation
  const words = t.split(/\s+/).filter(w => w.length > 0);
  if (words.length >= 1 && words.length <= 3) {
    // Pure Devanagari short phrases (e.g. "अक्षांशीय सीमा", "मानक समय", "पर्वत शिखर")
    const devanagariRatio = (t.match(/[\u0900-\u097F]/g) || []).length / t.length;
    if (devanagariRatio > 0.7) {
      return true;
    }

    // Pure Latin short phrases (e.g. "Indian Geography", "Physical Features")
    const latinRatio = (t.match(/[a-zA-Z]/g) || []).length / t.length;
    if (latinRatio > 0.7 && t === t.toUpperCase()) {
      return true;
    }
  }

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
      !/^(?:Ans|Answer|Explanation|Sol|Code|List|उत्तर|व्याख्या|समाधान)[\s\:\-\=]/i.test(text) &&
      !isHeaderFooterNoise(text);

    const isKnownTopicHeading =
      /^(?:CHAPTER|SECTION|PART|UNIT|TOPIC|SUBJECT|LESSON|MODULE|भाग|अध्याय|खंड|इकाई|विषय)[\s\:\-\d]/i.test(text) ||
      /^(?:HISTORY|GEOGRAPHY|POLITY|ECONOMY|ECONOMICS|SCIENCE|ENVIRONMENT|ECOLOGY|ETHICS|APTITUDE|REASONING|ENGLISH|HINDI|CURRENT\s+AFFAIRS|GENERAL\s+STUDIES|GENERAL\s+KNOWLEDGE|BIHAR\s+SPECIAL|UP\s+SPECIAL|MP\s+SPECIAL|RAJASTHAN\s+SPECIAL|ANCIENT\s+HISTORY|MEDIEVAL\s+HISTORY|MODERN\s+HISTORY|ART\s+AND\s+CULTURE|INDIAN\s+POLITY|PHYSICAL\s+GEOGRAPHY|INDIAN\s+GEOGRAPHY|WORLD\s+GEOGRAPHY|GENERAL\s+SCIENCE|PHYSICS|CHEMISTRY|BIOLOGY|TECHNOLOGY|HISTORY\s+OF\s+INDIA|INDIAN\s+NATIONAL\s+MOVEMENT|INDIAN\s+ECONOMY|GOVERNANCE|CONSTITUTION|SOURCE\s+OF\s+CONSTITUTION|CONSTITUENT\s+ASSEMBLY|PREAMBLE|MAJOR\s+COMMITTEES|FUNDAMENTAL\s+RIGHTS|DIRECTIVE\s+PRINCIPLES|FUNDAMENTAL\s+DUTIES|UNION\s+EXECUTIVE|PARLIAMENT|SUPREME\s+COURT|HIGH\s+COURT|GOVERNOR|STATE\s+LEGISLATURE|PANCHAYATI\s+RAJ|AMENDMENTS?|EMERGENCY\s+PROVISIONS|CONSTITUTIONAL\s+BODIES|इतिहास|भूगोल|राजव्यवस्था|अर्थव्यवस्था|विज्ञान|पर्यावरण|करंट\s+अफेयर्स|सामान्य\s+ज्ञान|बिहार\s+विशेष)$/i.test(text) ||
      /^(?:संविधान\s+के?\s+स्रोत|संविधान\s+सभा|संविधान\s+निर्माण\s+प्रक्रिया|उद्देशिका|प्रस्तावना|मूल\s+अधिकार|मौलिक\s+अधिकार|राज्य\s+के\s+नीति\s+निदेशक\s+तत्व|मूल\s+कर्तव्य|संसद|उच्चतम\s+न्यायालय|उच्च\s+न्यायालय|कार्यपालिका|राष्ट्रपति|राज्यपाल|पंचायती\s+राज|संविधान\s+संशोधन|आपात\s+उपबंध|संवैधानिक\s+निकाय)$/i.test(text);

    const isDocumentHeading = isStandaloneDocumentHeading(text, previousBlock, nextBlocks);

    if (
      block.type === 'HEADING' ||
      block.type === 'SUBHEADING' ||
      block.type === 'DOCUMENT_HEADING' ||
      isKnownTopicHeading ||
      isAllCapsTitle ||
      isDocumentHeading
    ) {
      return 'DOCUMENT_HEADING';
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
      return 'OPTION_CANDIDATE';
    }

    // Signal 6: Question Boundary candidate evaluation
    const boundary = BoundaryDetector.evaluate(block, previousBlock, nextBlocks, expectedQNum);
    if (boundary.isQuestionBoundary) {
      return 'QUESTION_CANDIDATE';
    }

    return 'PARAGRAPH';
  }
}
