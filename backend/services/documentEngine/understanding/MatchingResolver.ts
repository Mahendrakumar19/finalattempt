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
    /(?:Match[ \t]+(?:List|Column|the[ \t]+pairs|the[ \t]+following)|List[\s\-_]*I\b|List[\s\-_]*1\b|Column[\s\-_]*A\b|सूची[\s\-_]*I\b|सूची[\s\-_]*1\b|मिलान[ \t]+कीजिए|सुमेलित[ \t]+कीजिए|कूट[ \t]+का[ \t]+प्रयोग|सही[ \t]+उत्तर[ \t]+चुनिए)/i;

  /**
   * Main entry point: Parses matching table structure from question cluster text
   */
  static parseMatching(fullClusterText: string): MatchingParseResult | null {
    const matchHeader = this.MATCHING_HEADER_REGEX.exec(fullClusterText);
    if (!matchHeader) return null;

    // Find index where table list items or table header actually start (e.g. List-I, List-1, or item "A. धारवाड़")
    const listHeadMatch = /(?:^|\n)[ \t]*(?:List[\s\-_]*I\b|List[\s\-_]*1\b|Column[\s\-_]*A\b|सूची[\s\-_]*I\b|सूची[\s\-_]*1\b)/i.exec(fullClusterText);
    const itemMarkerMatch = /(?:^|\n)[ \t]*(?:\(?[ABCDEक-ङI|V|X]+\)?[\.\:\)\-–—]+)[ \t]+[^\n]+/i.exec(fullClusterText);

    let tableIndex = matchHeader.index;
    if (listHeadMatch) {
      tableIndex = listHeadMatch.index;
    } else if (itemMarkerMatch && itemMarkerMatch.index > matchHeader.index) {
      tableIndex = itemMarkerMatch.index;
    }

    const textBeforeMatching = fullClusterText.substring(0, tableIndex).trim();
    const matchingSectionText = fullClusterText.substring(tableIndex).trim();

    // Look for coded option section start (e.g. "(a) A-1, B-2", "(a) 4 3 1 2", "C A B", "4 3 1 2", "Options:", "विकल्प:", "नीचे दिए गए कूट")
    const codedOptIdx = matchingSectionText.search(
      /(?:\n[ \t]*(?:Options|विकल्प|नीचे[ \t]+दिए|कूट)[\s\:\-\w\u0900-\u097F]*|\n[ \t]*(?:\([abcdeABCDEक-ङ]\)|[abcdeABCDEक-ङ][\.\:\)\-–—]+)[ \t]+(?:[A-Da-d1-4क-घ][\-\=\:\s\d]+|\d[\s\d,\-]{1,15})|\n[ \t]*[A-E1-5क-ङ](?:[\s,\-–—]+[A-E1-5क-ङ]){2,4}[ \t]*$)/im
    );

    let matchingBodyText = matchingSectionText;
    let textAfterMatching = '';

    if (codedOptIdx > 0) {
      matchingBodyText = matchingSectionText.substring(0, codedOptIdx);
      textAfterMatching = matchingSectionText.substring(codedOptIdx);
    }

    // Extract any codes header / instruction text above options (e.g. "नीचे दिए गए कूट का प्रयोग कर सही उत्तर चुनिए:\n A B C D")
    let codesHeader = '';
    const firstOptMarkerMatch = /(?:\n|^)[ \t]*(?:\(([abcdeABCDEक-ङ])\)|[abcdeABCDEक-ङ][\.\:\)\-–—]+)[ \t]+/i.exec(textAfterMatching);
    if (firstOptMarkerMatch && firstOptMarkerMatch.index > 0) {
      codesHeader = textAfterMatching.substring(0, firstOptMarkerMatch.index).trim();
    }

    // Pre-pass: Break inline item markers (e.g. "I. Federal List A. 97 entries II. State list") onto newlines
    const formattedMatchingBody = matchingBodyText
      .replace(/([^\n])\s+([I|V|X]{1,4}|[A-Ea-e1-5])[\.\:\)\-–—]+\s+/g, '$1\n$2. ');

    const lines = formattedMatchingBody.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    let headerLeft = 'LIST-I';
    let headerRight = 'LIST-II';
    const leftList: MatchingListItem[] = [];
    const rightList: MatchingListItem[] = [];

    // Parse stacked or side-by-side headers & codes
    for (const line of lines) {
      if (/List[\s\-_]*I(?![I\w])|Column[\s\-_]*A|सूची[\s\-_]*I(?![I\w])|सूची[\s\-_]*1/i.test(line) && /List[\s\-_]*II|Column[\s\-_]*B|सूची[\s\-_]*II|सूची[\s\-_]*2/i.test(line)) {
        const parts = line.split(/\s{2,}|\t|\|/).map(s => s.trim()).filter(Boolean);
        if (parts.length >= 2) {
          headerLeft = parts[0];
          headerRight = parts[1];
        } else {
          headerLeft = line;
        }
      } else if (/^(?:List[\s\-_]*II|List[\s\-_]*2|Column[\s\-_]*B|सूची[\s\-_]*II|सूची[\s\-_]*2)\b/i.test(line)) {
        headerRight = line;
      } else if (/^(?:List[\s\-_]*I(?![I\w])|List[\s\-_]*1|Column[\s\-_]*A|सूची[\s\-_]*I(?![I\w])|सूची[\s\-_]*1)\b/i.test(line)) {
        headerLeft = line;
      } else if (/^(?:Code|Codes|Koot|ूट|ूट|कूट)[\:\-\s]*/i.test(line) || /^[A-D]\s+[B-E]\s+[C-F]\s+[D-G]$/i.test(line)) {
        codesHeader = line;
      }
    }

    // Extract Left List (A, B, C, D or I, II, III) and Right List (1, 2, 3, 4 or A, B, C)
    const leftItemRegex = /^[ \t]*([ABCDEक-ङ]|[I|V|X]+)[\.\:\)\-–—]+[ \t]+([^\n\t]+)/i;
    const rightItemRegex = /^[ \t]*([1-5]|[ABCDEक-ङ]|[I|V|X]+)[\.\:\)\-–—]+[ \t]+([^\n\t]+)/i;
    const inlineBothRegex = /^[ \t]*([ABCDEक-ङ]|[I|V|X]+)[\.\:\)\-–—]+[ \t]+(.+?)[ \t]+([1-5]|[ABCDEक-ङ]|[I|V|X]+)[\.\:\)\-–—]+[ \t]+(.+)$/i;

    for (const line of lines) {
      // Ignore option code choice lines like "C A B", "4 3 1 2", "A B C"
      if (/^[ \t]*(?:\([a-eA-E1-5क-ङ]\)[ \t]*)?[A-E1-5क-ङ](?:[\s,\-–—]+[A-E1-5क-ङ]){2,4}[ \t]*$/i.test(line)) {
        continue;
      }

      // Check inline both regex first (e.g. "A. Item1 1. Item2")
      const bothMatch = inlineBothRegex.exec(line);
      if (bothMatch) {
        let lLabel = bothMatch[1].toUpperCase();
        if (lLabel === 'क') lLabel = 'A';
        else if (lLabel === 'ख') lLabel = 'B';
        else if (lLabel === 'ग') lLabel = 'C';
        else if (lLabel === 'घ') lLabel = 'D';

        const lText = bothMatch[2].replace(/^[\| \t]+|[\| \t]+$/g, '').trim();
        const rLabel = bothMatch[3].toUpperCase();
        const rText = bothMatch[4].replace(/^[\| \t]+|[\| \t]+$/g, '').trim();

        if (!leftList.some(item => item.label === lLabel)) {
          leftList.push({
            label: lLabel,
            versions: [{ language: LanguageDetector.detectLanguage(lText), text: lText, confidence: 0.95 }]
          });
        }
        if (!rightList.some(item => item.label === rLabel)) {
          rightList.push({
            label: rLabel,
            versions: [{ language: LanguageDetector.detectLanguage(rText), text: rText, confidence: 0.95 }]
          });
        }
        continue;
      }

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

          const lText = lMatch[2].replace(/^[\| \t]+|[\| \t]+$/g, '').trim();
          if (!leftList.some(item => item.label === label)) {
            leftList.push({
              label,
              versions: [{ language: LanguageDetector.detectLanguage(lText), text: lText, confidence: 0.95 }]
            });
          }
        }

        if (rMatch) {
          let label = rMatch[1].toUpperCase();
          const rText = rMatch[2].replace(/^[\| \t]+|[\| \t]+$/g, '').trim();
          if (!rightList.some(item => item.label === label)) {
            rightList.push({
              label,
              versions: [{ language: LanguageDetector.detectLanguage(rText), text: rText, confidence: 0.95 }]
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

          const text = lMatch[2].replace(/^[\| \t]+|[\| \t]+$/g, '').trim();

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
          const text = rMatch[2].replace(/^[\| \t]+|[\| \t]+$/g, '').trim();
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
        codesHeader,
        tableData
      },
      textBeforeMatching,
      textAfterMatching: textAfterMatching || matchingSectionText
    };
  }
}
