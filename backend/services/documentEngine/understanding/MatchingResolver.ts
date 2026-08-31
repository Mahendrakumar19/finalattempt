import { MatchingStructure, MatchingListItem } from '../core/ExtractedQnA';
import { TableData, TableCell } from '../core/NormalizedDocument';
import { LanguageDetector } from '../alignment/LanguageDetector';

export interface MatchingParseResult {
  matching: MatchingStructure;
  textBeforeMatching: string;
  textAfterMatching: string;
}

export class MatchingResolver {
  private static readonly MATCHING_HEADER_REGEX =
    /(?:Match[ \t]+(?:List|Column|the[ \t]+pairs|the[ \t]+following)|List[\s\-_]*I\b|List[\s\-_]*1\b|Column[\s\-_]*A\b|सूची[\s\-_]*I\b|सूची[\s\-_]*1\b)/i;

  /**
   * Main entry point: Parses matching table structure from question cluster text
   */
  static parseMatching(fullClusterText: string): MatchingParseResult | null {
    if (!fullClusterText) return null;

    const matchHeader = this.MATCHING_HEADER_REGEX.exec(fullClusterText);
    if (!matchHeader) return null;

    const headerIndex = matchHeader.index;
    const textBeforeMatching = fullClusterText.substring(0, headerIndex).trim();
    const matchingSectionText = fullClusterText.substring(headerIndex);

    // Look for coded option section start (e.g. "(a) A-1, B-2", "A. A-1", "Options:", "विकल्प:")
    const codedOptIdx = matchingSectionText.search(
      /(?:\n[ \t]*(?:Options|विकल्प)[\s\:]*|\n[ \t]*(?:\([abcdeABCDEक-ङ]\)|[abcdeABCDEक-ङ][\.\:\)\-–—]+)[ \t]+[A-Da-d1-4क-घ][\-\=\:\s\d]+)/i
    );

    let matchingBodyText = matchingSectionText;
    let textAfterMatching = '';

    if (codedOptIdx > 0) {
      matchingBodyText = matchingSectionText.substring(0, codedOptIdx);
      textAfterMatching = matchingSectionText.substring(codedOptIdx);
    }

    const lines = matchingBodyText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    let headerLeft = 'List-I';
    let headerRight = 'List-II';
    const leftList: MatchingListItem[] = [];
    const rightList: MatchingListItem[] = [];

    // Parse headers if present
    for (const line of lines) {
      if (/List[\s\-_]*I|Column[\s\-_]*A|सूची[\s\-_]*I/i.test(line) && /List[\s\-_]*II|Column[\s\-_]*B|सूची[\s\-_]*II/i.test(line)) {
        const parts = line.split(/\s{2,}|\t|\|/).map(s => s.trim()).filter(Boolean);
        if (parts.length >= 2) {
          headerLeft = parts[0];
          headerRight = parts[1];
        }
      }
    }

    // Extract Left List (A, B, C, D or I, II, III) and Right List (1, 2, 3, 4 or A, B, C)
    const leftItemRegex = /^[ \t]*([ABCDEक-ङ]|[I|V|X]+)[\.\:\)\-–—]+[ \t]+([^\n\t]+)/i;
    const rightItemRegex = /^[ \t]*([1-5]|[ABCDEक-ङ]|[I|V|X]+)[\.\:\)\-–—]+[ \t]+([^\n\t]+)/i;

    for (const line of lines) {
      // Side-by-side check (e.g. "A. State Policy ...  1. Australia" or "I. Federal List  A. 97 entries")
      const sideBySideParts = line.split(/\s{2,}|\t|\|/).map(s => s.trim()).filter(Boolean);

      if (sideBySideParts.length >= 2) {
        const lMatch = leftItemRegex.exec(sideBySideParts[0]);
        const rMatch = rightItemRegex.exec(sideBySideParts[1]);

        if (lMatch) {
          let label = lMatch[1].toUpperCase();
          if (label === 'क') label = 'A';
          else if (label === 'ख') label = 'B';
          else if (label === 'ग') label = 'C';
          else if (label === 'घ') label = 'D';

          const text = lMatch[2].trim();
          if (!leftList.some(item => item.label === label)) {
            leftList.push({
              label,
              versions: [{ language: LanguageDetector.detectLanguage(text), text, confidence: 0.95 }]
            });
          }
        }

        if (rMatch) {
          let label = rMatch[1].toUpperCase();
          const text = rMatch[2].trim();
          if (!rightList.some(item => item.label === label)) {
            rightList.push({
              label,
              versions: [{ language: LanguageDetector.detectLanguage(text), text, confidence: 0.95 }]
            });
          }
        }
      } else {
        // Stacked check
        const lMatch = leftItemRegex.exec(line);
        if (lMatch) {
          let label = lMatch[1].toUpperCase();
          if (label === 'क') label = 'A';
          else if (label === 'ख') label = 'B';
          else if (label === 'ग') label = 'C';
          else if (label === 'घ') label = 'D';

          const text = lMatch[2].trim();

          // If label is number 1-5 or right-list style while left list is full, place in right list
          if (/^\d+$/.test(label) && leftList.length > 0) {
            if (!rightList.some(item => item.label === label)) {
              rightList.push({
                label,
                versions: [{ language: LanguageDetector.detectLanguage(text), text, confidence: 0.95 }]
              });
            }
          } else if (!leftList.some(item => item.label === label)) {
            leftList.push({
              label,
              versions: [{ language: LanguageDetector.detectLanguage(text), text, confidence: 0.95 }]
            });
          }
          continue;
        }

        const rMatch = rightItemRegex.exec(line);
        if (rMatch) {
          const label = rMatch[1].toUpperCase();
          const text = rMatch[2].trim();
          if (!rightList.some(item => item.label === label)) {
            rightList.push({
              label,
              versions: [{ language: LanguageDetector.detectLanguage(text), text, confidence: 0.95 }]
            });
          }
        }
      }
    }

    if (leftList.length === 0 || rightList.length === 0) return null;

    // Construct TableData
    const tableCells: TableCell[][] = [];
    const maxRows = Math.max(leftList.length, rightList.length);

    for (let r = 0; r < maxRows; r++) {
      const leftCellText = leftList[r] ? `${leftList[r].label}. ${leftList[r].versions[0]?.text || ''}` : '';
      const rightCellText = rightList[r] ? `${rightList[r].label}. ${rightList[r].versions[0]?.text || ''}` : '';

      tableCells.push([
        { rowIndex: r, colIndex: 0, text: leftCellText },
        { rowIndex: r, colIndex: 1, text: rightCellText }
      ]);
    }

    const tableData: TableData = {
      rowsCount: tableCells.length,
      colsCount: 2,
      headers: [headerLeft, headerRight],
      cells: tableCells
    };

    return {
      matching: {
        headerLeft,
        headerRight,
        leftList,
        rightList,
        tableData
      },
      textBeforeMatching,
      textAfterMatching: textAfterMatching || matchingSectionText
    };
  }
}
