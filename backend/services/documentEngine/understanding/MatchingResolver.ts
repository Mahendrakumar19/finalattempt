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
    /(?:Match[ \t]+(?:List|Column|the[ \t]+pairs|the[ \t]+following)|List[\s\-_]*I\b|List[\s\-_]*1\b|Column[\s\-_]*A\b|\u0938\u0942\u091a\u0940[\s\-_]*I\b|\u0938\u0942\u091a\u0940[\s\-_]*1\b|\u092e\u093f\u0932\u093e\u0928[ \t]+\u0915\u0940\u091c\u093f\u090f|\u0938\u0941\u092e\u0947\u0932\u093f\u0924[ \t]+\u0915\u0940\u091c\u093f\u090f|\u0915\u0942\u091f[ \t]+\u0915\u093e[ \t]+\u092a\u094d\u0930\u092f\u094b\u0917|\u0938\u0939\u0940[ \t]+\u090d\u0924\u094d\u0924\u0930[ \t]+\u091a\u0941\u0928\u093f\u090f)/i;

  static parseMatching(fullClusterText: string): MatchingParseResult | null {
    const matchHeader = this.MATCHING_HEADER_REGEX.exec(fullClusterText);
    if (!matchHeader) return null;

    const listHeadMatch = /(?:^|\n)[ \t]*(?:List[\s\-_]*I\b|List[\s\-_]*1\b|Column[\s\-_]*A\b|\u0938\u0942\u091a\u0940[\s\-_]*I\b|\u0938\u0942\u091a\u0940[\s\-_]*1\b)/i.exec(fullClusterText);
    const itemMarkerMatch = /(?:^|\n)[ \t]*(?:\(?[ABCDE\u0915-\u0919I|V|X]+\)?[\.\:\)\-–—]+)[ \t]+[^\n]+/i.exec(fullClusterText);

    let tableIndex = matchHeader.index;
    if (listHeadMatch) {
      tableIndex = listHeadMatch.index;
    } else if (itemMarkerMatch && itemMarkerMatch.index > matchHeader.index) {
      tableIndex = itemMarkerMatch.index;
    }

    const textBeforeMatching = fullClusterText.substring(0, tableIndex).trim();
    const matchingSectionText = fullClusterText.substring(tableIndex).trim();

    const codedOptMatch = /(?:^|\n)[ \t]*(?:(?:Options|\u0935\u093f\u0915\u0932\u094d\u092a|\u0928\u0940\u091a\u0947[ \t]+\u0926\u093f\u090f|\u0926\u093f\u090f[ \t]+\u0917\u090f|\u0915\u0942\u091f|Codes?)[\s\:\-\w\u0900-\u097F]*|(?:\([abcdeABCDE\u0915-\u0919]\)|[abcdeABCDE\u0915-\u0919][\.\:\)\-–—]+)[ \t]+(?:[A-Da-d1-4\u0915-\u0918\d][\-\=\:\s\t\d\.\,]+|\d.*))/im.exec(matchingSectionText);
    const codedOptIdx = codedOptMatch ? codedOptMatch.index : -1;

    let matchingBodyText = matchingSectionText;
    let textAfterMatching = '';

    if (codedOptIdx >= 0) {
      matchingBodyText = matchingSectionText.substring(0, codedOptIdx);
      textAfterMatching = matchingSectionText.substring(codedOptIdx);
    }

    let codesHeader = '';
    const firstOptMarkerMatch = /(?:\n|^)[ \t]*(?:\(([abcdeABCDE\u0915-\u0919])\)|[abcdeABCDE\u0915-\u0919][\.\:\)\-–—]+)[ \t]+/i.exec(textAfterMatching);
    if (firstOptMarkerMatch && firstOptMarkerMatch.index > 0) {
      codesHeader = textAfterMatching.substring(0, firstOptMarkerMatch.index).trim();
    }

    // Pre-pass: Break inline item markers (e.g. "I. Federal List A. 97 entries II. State list") onto newlines (DO NOT break markdown pipe lines)
    const formattedMatchingBody = matchingBodyText.includes('|')
      ? matchingBodyText
      : matchingBodyText.replace(/([^\n])\s+([IVX]{1,4}|[A-Ea-e1-5])[\.\:\)\-–—]+\s+/g, '$1\n$2. ');

    const lines = formattedMatchingBody.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    let headerLeft = 'LIST-I';
    let headerRight = 'LIST-II';
    const leftList: MatchingListItem[] = [];
    const rightList: MatchingListItem[] = [];

    // Parse stacked or side-by-side headers & codes
    for (const line of lines) {
      if (/List[\s\-_]*I(?![I\w])|Column[\s\-_]*A|\u0938\u0942\u091a\u0940[\s\-_]*I(?![I\w])|\u0938\u0942\u091a\u0940[\s\-_]*1/i.test(line) && /List[\s\-_]*II|Column[\s\-_]*B|\u0938\u0942\u091a\u0940[\s\-_]*II|\u0938\u0942\u091a\u0940[\s\-_]*2/i.test(line)) {
        const parts = line.split(/\s{2,}|\t|\|/).map(s => s.trim()).filter(Boolean);
        if (parts.length >= 2) {
          headerLeft = parts[0];
          headerRight = parts[1];
        } else {
          headerLeft = line;
        }
      } else if (/^(?:List[\s\-_]*II|List[\s\-_]*2|Column[\s\-_]*B|\u0938\u0942\u091a\u0940[\s\-_]*II|\u0938\u0942\u091a\u0940[\s\-_]*2)\b/i.test(line)) {
        headerRight = line;
      } else if (/^(?:List[\s\-_]*I(?![I\w])|List[\s\-_]*1|Column[\s\-_]*A|\u0938\u0942\u091a\u0940[\s\-_]*I(?![I\w])|\u0938\u0942\u091a\u0940[\s\-_]*1)\b/i.test(line)) {
        headerLeft = line;
      } else if (/^(?:Code|Codes|Koot|\u0915\u0942\u091f)[\:\-\s]*/i.test(line) || /^[A-D]\s+[B-E]\s+[C-F]\s+[D-G]$/i.test(line)) {
        codesHeader = line;
      }
    }

    // Extract Left List (A, B, C, D or I, II, III) and Right List (1, 2, 3, 4 or A, B, C)
    const inlineBothRegex = /^[ \t]*([ABCDE\u0915-\u0919]|[IVX]+)[\.\:\)\-–—]+[ \t]+(.+?)[ \t]+([1-5]|[ABCDE\u0915-\u0919]|[IVX]+)[\.\:\)\-–—]+[ \t]+(.+)$/i;

    for (const line of lines) {
      // Ignore option code choice lines like "C A B", "4 3 1 2", "A B C"
      if (/^[ \t]*(?:\([a-eA-E1-5\u0915-\u0919]\)[ \t]*)?[A-E1-5\u0915-\u0919](?:[\s,\-–—]+[A-E1-5\u0915-\u0919]){2,4}[ \t]*$/i.test(line)) {
        continue;
      }

      // Check pipe table line e.g. "| A. National Park | 1. Bihar |"
      if (line.includes('|')) {
        const parts = line.split('|').map(s => s.trim().replace(/^[\:\-]+$/, '')).filter(Boolean);
        if (parts.length >= 2) {
          if (!/List[\s\-_]*I|Column[\s\-_]*A|\u0938\u0942\u091a\u0940[\s\-_]*I|\u0938\u0942\u091a\u0940[\s\-_]*1/i.test(parts[0])) {
            const lMatch = parts[0].match(/^([A-Ea-e\u0915-\u0919]|[IVX]+)[\.\:\)\-–—]+[ \t]+(.+)$/i);
            const rMatch = parts[1].match(/^([1-5]|[ABCDE\u0915-\u0919]|[IVX]+)[\.\:\)\-–—]+[ \t]+(.+)$/i);

            let lLabel = lMatch ? lMatch[1].toUpperCase() : 'A';
            if (lLabel === '\u0915') lLabel = 'A';
            const lText = lMatch ? lMatch[2].trim() : parts[0];

            let rLabel = rMatch ? rMatch[1].toUpperCase() : '1';
            const rText = rMatch ? rMatch[2].trim() : parts[1];

            leftList.push({
              label: lLabel,
              versions: [{ language: LanguageDetector.detectLanguage(lText), text: lText, confidence: 0.95 }]
            });
            rightList.push({
              label: rLabel,
              versions: [{ language: LanguageDetector.detectLanguage(rText), text: rText, confidence: 0.95 }]
            });
            continue;
          }
        }
      }

      const bothMatch = inlineBothRegex.exec(line);
      if (bothMatch) {
        let lLabel = bothMatch[1].toUpperCase();
        if (lLabel === '\u0915') lLabel = 'A';
        else if (lLabel === '\u0916') lLabel = 'B';
        else if (lLabel === '\u0917') lLabel = 'C';
        else if (lLabel === '\u0918') lLabel = 'D';

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

      const sideBySideMatch = line.match(/^[ \t]*([IVX]+|[A-Ea-e1-5\u0915-\u0919])[\.\:\)\-–—]+[ \t]+(.+?)[ \t]+([ABCDEa-e1-5\u0915-\u0919]|[IVX]+)[\.\:\)\-–—]+[ \t]+(.+)$/i);
      if (sideBySideMatch) {
        const lLabel = sideBySideMatch[1].toUpperCase();
        const lText = sideBySideMatch[2].replace(/^[\| \t]+|[\| \t]+$/g, '').trim();
        const rLabel = sideBySideMatch[3].toUpperCase();
        const rText = sideBySideMatch[4].replace(/^[\| \t]+|[\| \t]+$/g, '').trim();

        leftList.push({
          label: lLabel,
          versions: [{ language: LanguageDetector.detectLanguage(lText), text: lText, confidence: 0.95 }]
        });
        rightList.push({
          label: rLabel,
          versions: [{ language: LanguageDetector.detectLanguage(rText), text: rText, confidence: 0.95 }]
        });
        continue;
      }

      // Stacked check for Left (Alpha / Roman) vs Right (Numeric) items
      const itemMatch = /^[ 	]*([IVX]+|[A-Ea-e1-5\u0915-\u0919])[\.\:\)\-–—]+[ \t]+([^\n\t]+)/i.exec(line);
      if (itemMatch) {
        const rawLabel = itemMatch[1].toUpperCase();
        let label = rawLabel;
        if (rawLabel === '\u0915') label = 'A';
        else if (rawLabel === '\u0916') label = 'B';
        else if (rawLabel === '\u0917') label = 'C';
        else if (rawLabel === '\u0918') label = 'D';

        const text = itemMatch[2].replace(/^[\| \t]+|[\| \t]+$/g, '').trim();

        const isAlphaOrRoman = /^[A-E\u0915-\u0919IVX]$/i.test(label) || /^[IVX]+$/i.test(label);
        const isNumeric = /^[1-5]$/.test(label);

        if (isAlphaOrRoman && !isNumeric) {
          leftList.push({
            label,
            versions: [{ language: LanguageDetector.detectLanguage(text), text, confidence: 0.95 }]
          });
        } else if (isNumeric) {
          rightList.push({
            label,
            versions: [{ language: LanguageDetector.detectLanguage(text), text, confidence: 0.95 }]
          });
        } else {
          if (leftList.length <= rightList.length) {
            leftList.push({
              label,
              versions: [{ language: LanguageDetector.detectLanguage(text), text, confidence: 0.95 }]
            });
          } else {
            rightList.push({
              label,
              versions: [{ language: LanguageDetector.detectLanguage(text), text, confidence: 0.95 }]
            });
          }
        }
        continue;
      }
    }

    if (leftList.length === 0 || rightList.length === 0) return null;

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
      headers: [headerLeft, headerRight],
      rowsCount: maxRows,
      colsCount: 2,
      cells: tableCells
    };

    return {
      matching: {
        headerLeft,
        headerRight,
        leftList,
        rightList,
        tableData,
        codesHeader
      },
      textBeforeMatching,
      textAfterMatching
    };
  }
}
