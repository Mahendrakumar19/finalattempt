export type BlockType =
  | 'DOCUMENT_TITLE'
  | 'HEADING'
  | 'SUBHEADING'
  | 'PARAGRAPH'
  | 'QUESTION_CANDIDATE'
  | 'OPTION_CANDIDATE'
  | 'ANSWER_CANDIDATE'
  | 'EXPLANATION_CANDIDATE'
  | 'TABLE'
  | 'LIST'
  | 'HEADER'
  | 'FOOTER'
  | 'NOISE'
  | 'UNKNOWN';

export type QuestionType =
  | 'MCQ'
  | 'MULTI_SELECT'
  | 'TRUE_FALSE'
  | 'MATCHING'
  | 'STATEMENT_BASED'
  | 'ASSERTION_REASON'
  | 'NUMERICAL'
  | 'UNKNOWN';

export type ImportStatus =
  | 'PENDING'
  | 'UPLOADING'
  | 'ANALYZING'
  | 'EXTRACTING'
  | 'OCR_PROCESSING'
  | 'PARSING'
  | 'ALIGNING'
  | 'VALIDATING'
  | 'REVIEW_READY'
  | 'IMPORTING'
  | 'COMPLETED'
  | 'FAILED';

export type ValidationStatus =
  | 'PASS'
  | 'WARNING'
  | 'REVIEW_REQUIRED'
  | 'ERROR';

export type AnswerSourceLocation =
  | 'IMMEDIATE'
  | 'END_OF_SECTION'
  | 'END_OF_DOCUMENT'
  | 'ANSWER_KEY_PAGE'
  | 'EMBEDDED_EXPLANATION';
