import { QuestionType, ValidationStatus, AnswerSourceLocation } from './Constants';
import { BoundingBox, TableData } from './NormalizedDocument';

export interface LocalizedText {
  language: 'en' | 'hi' | 'mixed' | string;
  text: string;
  confidence: number;
  sourceBlockIds?: string[];
  formattedHtml?: string;
  interpretedText?: string; // OCR normalized text for review
}

export interface StatementItem {
  number: number;
  versions: LocalizedText[];
}

export interface MatchingListItem {
  label: string; // 'A', 'B', 'C' or '1', '2', '3'
  versions: LocalizedText[];
}

export interface MatchingStructure {
  headerLeft?: string;
  headerRight?: string;
  leftList: MatchingListItem[];
  rightList: MatchingListItem[];
  tableData?: TableData;
}

export interface ExtractedOption {
  label: string; // Canonical label 'A', 'B', 'C', 'D', 'E'
  rawMarker?: string; // '(a)', 'A.', '1.', '(क)', etc.
  versions: LocalizedText[];
}

export interface ExtractedAnswer {
  type: 'single' | 'multiple' | 'numerical';
  values: string[]; // ['A'] or ['A', 'C']
  rawKeyText?: string;
  sourceLocation: AnswerSourceLocation;
  confidence: number;
  hasConflict?: boolean;
  conflictDetails?: string;
}

export interface QnaConfidenceScore {
  question: number;
  options: number;
  answer: number;
  explanation: number;
  bilingualAlignment: number | null;
  overall: number;
}

export interface ExtractedQnA {
  id: string;
  stagingId?: string;
  documentId: string;
  questionNumber: number;
  questionType: QuestionType;

  metadata: {
    subject?: string;
    topic?: string;
    chapter?: string;
    exam?: string;
    year?: string;
    sectionHeader?: string;
    assertionText?: string;
    reasonText?: string;
  };

  question: {
    versions: LocalizedText[];
    statements?: StatementItem[];
    matching?: MatchingStructure;
    tableData?: TableData;
    imageUrl?: string;
    images?: { url: string; caption?: string }[];
  };

  options: ExtractedOption[];

  answer: ExtractedAnswer;

  explanation: {
    versions: LocalizedText[];
  };

  confidence: QnaConfidenceScore;

  source: {
    pages: number[];
    blockIds: string[];
    boundingBoxes?: BoundingBox[];
  };

  validation: {
    status: ValidationStatus;
    warnings: string[];
    errors: string[];
    conflicts?: string[];
  };

  isHumanApproved?: boolean;
  isDuplicateCandidate?: boolean;
  duplicateMatchId?: string;
  duplicateSimilarityScore?: number;
}
