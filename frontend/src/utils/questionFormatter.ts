/**
 * Auto-formats "Match List-I with List-II" (and Hindi सूची-I, सूची-II / Match the following)
 * text blocks into clean, responsive side-by-side 2-column HTML Tables.
 */
export function formatMatchListsInText(input: string): string {
  if (!input) return '';
  if (input.includes('<table') || input.includes('class="match-list-container"')) return input;

  const hasMatchKeyword = /(?:Match|मिलान|जोड़ी|Column|सूची|List)/i.test(input);
  const hasRomanItems = /(?:^|\n)[ \t]*(?:[I|V|X]+|\d+)[\.\:\)\-–—]+[ \t]+/i.test(input);
  const hasAlphaItems = /(?:^|\n)[ \t]*[A-Ea-eक-ङ][\.\:\)\-–—]+[ \t]+/i.test(input);

  const hasList1 = /List[\s\-_]*I\b|List[\s\-_]*1\b|Column[\s\-_]*A\b|सूची[\s\-_]*I\b|सूची[\s\-_]*1\b/i.test(input);
  const hasList2 = /List[\s\-_]*II\b|List[\s\-_]*2\b|Column[\s\-_]*B\b|सूची[\s\-_]*II\b|सूची[\s\-_]*2\b/i.test(input);

  if (!hasList1 && !hasList2 && (!hasMatchKeyword || (!hasRomanItems && !hasAlphaItems))) {
    return input;
  }

  const rawLines = input.split('\n');
  const promptLines: string[] = [];
  const leftItems: string[] = [];
  const rightItems: string[] = [];
  let headerLeft = '';
  let headerRight = '';
  let codesHeader = '';

  const cleanCellText = (text: string): string => {
    if (!text) return '';
    return text
      .replace(/^[\|\:\-\s]+$/, '')
      .replace(/^\|+/, '')
      .replace(/\|+$/, '')
      .trim();
  };

  let activeListSection: 'none' | 'left' | 'right' = 'none';

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line) continue;

    // Filter out Markdown separator lines like "| :--- | :--- |"
    if (/^\s*\|?\s*\:?\-{2,}\:?\s*\|\s*\:?\-{2,}\:?\s*\|?\s*$/.test(line)) {
      continue;
    }

    // Check if line is a sentence prompt (contains instructions like "with", "select", "को", "से", "सुमेलित", "कीजिए", "चुनिए", "उत्तर")
    const isPromptInstruction = /(?:with|select|using|given|below|को|से|सुमेलित|कीजिए|चुनिए|उत्तर|प्रयोग|दीजिये|मिलाएं|करें)/i.test(line) &&
                                !/^[A-Ea-e1-5I|V|X][\.\:\)\-–—]/i.test(line);

    if (isPromptInstruction && leftItems.length === 0 && rightItems.length === 0 && !headerLeft) {
      promptLines.push(cleanCellText(line));
      continue;
    }

    // Code header/footer check e.g. "Code: A B C D" or "कूट: I II III" or "ूट: I II III" or "कोड:"
    const isCodeHead = /^(?:Code|Codes|Koot|Kut|कूट|कुट|ूट|कोड)[\:\-\s]*/i.test(line) ||
                       /^(?:Code|Codes|Koot|Kut|कूट|कुट|ूट|कोड)\s*[\:\-\s]/i.test(line) ||
                       /^[A-D]\s+[B-E]\s+[C-F]\s+[D-G]$/i.test(line);
    if (isCodeHead) {
      codesHeader = (codesHeader ? codesHeader + ' ' : '') + cleanCellText(line);
      activeListSection = 'none';
      continue;
    }

    // Check line containing pipe '|' splitting Left and Right columns
    if (line.includes('|')) {
      const parts = line.split('|').map(s => cleanCellText(s)).filter(Boolean);
      if (parts.length >= 2) {
        // If line is header line (contains List-I or सूची-I)
        if (/List[\s\-_]*I|Column[\s\-_]*A|सूची[\s\-_]*I|सूची[\s\-_]*1/i.test(parts[0])) {
          headerLeft = parts[0];
          headerRight = parts[1];
        } else {
          leftItems.push(parts[0]);
          rightItems.push(parts[1]);
        }
        continue;
      }
    }

    // Side-by-side header line without pipes e.g. "List-I (Items...)   List-II (Taken...)"
    const isSideBySideHeader = /^(?:List[\s\-_]*I|List[\s\-_]*1|Column[\s\-_]*A|सूची[\s\-_]*I|सूची[\s\-_]*1).*?\s{2,}(?:List[\s\-_]*II|List[\s\-_]*2|Column[\s\-_]*B|सूची[\s\-_]*II|सूची[\s\-_]*2).*$/i.test(line);
    if (isSideBySideHeader) {
      const parts = line.split(/\s{2,}|\t/).map(s => cleanCellText(s)).filter(Boolean);
      if (parts.length >= 2) {
        headerLeft = parts[0];
        headerRight = parts[1];
      }
      continue;
    }

    // Stacked section headers e.g. "List-I" or "सूची-1"
    const isList1Head = /^(?:List[\s\-_]*I|List[\s\-_]*1|Column[\s\-_]*A|सूची[\s\-_]*I|सूची[\s\-_]*1)\b/i.test(line);
    const isList2Head = /^(?:List[\s\-_]*II|List[\s\-_]*2|Column[\s\-_]*B|सूची[\s\-_]*II|सूची[\s\-_]*2)\b/i.test(line);

    if (isList1Head) {
      headerLeft = cleanCellText(line);
      activeListSection = 'left';
      continue;
    }
    if (isList2Head) {
      headerRight = cleanCellText(line);
      activeListSection = 'right';
      continue;
    }

    // Side-by-side data row check without pipes e.g. "I. Union List   A. 97 entries" or "A. Linen   1. Coconut plant"
    const sideBySideMatch = line.match(/^([A-Ea-eक-ङ\dI|V|X]+[\.\:\)\-–—]+[^\t\n]+?)\s{2,}([A-Ea-eक-ङ\dI|V|X]+[\.\:\)\-–—]+.+)$/i);
    if (sideBySideMatch && !line.includes('Match') && !line.includes('मिलान') && !line.includes('सुमेलित')) {
      leftItems.push(cleanCellText(sideBySideMatch[1]));
      rightItems.push(cleanCellText(sideBySideMatch[2]));
      continue;
    }

    // Item prefix check
    const isLeftItem = /^[ \t]*(?:[I|V|X]+|\d+)[\.\:\)\-–—]+/i.test(line);
    const isRightItem = /^[ \t]*[A-Ea-eक-ङ][\.\:\)\-–—]+/i.test(line);

    if (activeListSection === 'left') {
      leftItems.push(cleanCellText(line));
    } else if (activeListSection === 'right') {
      rightItems.push(cleanCellText(line));
    } else if (isLeftItem) {
      leftItems.push(cleanCellText(line));
    } else if (isRightItem) {
      rightItems.push(cleanCellText(line));
    } else {
      if (leftItems.length === 0 && rightItems.length === 0 && !headerLeft) {
        promptLines.push(cleanCellText(line));
      } else {
        codesHeader += (codesHeader ? ' ' : '') + cleanCellText(line);
      }
    }
  }

  const maxRows = Math.max(leftItems.length, rightItems.length);
  // Matching table requires both Left List items and Right List items
  if (leftItems.length === 0 || rightItems.length === 0) return input;

  headerLeft = headerLeft || 'List-I';
  headerRight = headerRight || 'List-II';

  let tableHtml = `<div class="match-list-container my-3 overflow-x-auto">`;
  if (promptLines.length > 0) {
    tableHtml += `<p class="mb-2 font-bold text-[var(--text-color)] leading-relaxed">${promptLines.join('<br/>')}</p>`;
  }
  tableHtml += `<table class="w-full text-xs sm:text-sm border-collapse rounded-xl overflow-hidden border border-[var(--card-border)] my-2">`;
  tableHtml += `<thead><tr class="border-b border-[var(--card-border)] text-[var(--text-color)] font-bold">`;
  tableHtml += `<th class="p-2.5 sm:p-3 text-left border-r border-[var(--card-border)] w-1/2">${headerLeft}</th>`;
  tableHtml += `<th class="p-2.5 sm:p-3 text-left w-1/2">${headerRight}</th>`;
  tableHtml += `</tr></thead><tbody class="divide-y divide-[var(--card-border)] text-[var(--text-color)]">`;

  for (let r = 0; r < maxRows; r++) {
    const lText = leftItems[r] || '';
    const rText = rightItems[r] || '';
    tableHtml += `<tr>`;
    tableHtml += `<td class="p-2.5 sm:p-3 border-r border-[var(--card-border)] font-medium align-top dark:text-white">${lText}</td>`;
    tableHtml += `<td class="p-2.5 sm:p-3 font-medium align-top dark:text-white">${rText}</td>`;
    tableHtml += `</tr>`;
  }

  tableHtml += `</tbody></table>`;
  if (codesHeader) {
    tableHtml += `<p class="font-mono font-bold text-xs tracking-wider text-amber-500 mt-2.5 pl-1">${codesHeader}</p>`;
  }
  tableHtml += `</div>`;

  return tableHtml;
}

/**
 * Sanitizes and repairs questions where List-I / List-II or option codes (a) (b) (c) (d)
 * were jumbled into option fields during import.
 */
export function sanitizeAndRepairQuestion(q: any, activeLang: 'en' | 'hi' = 'en'): any {
  if (!q) return q;

  const isHi = activeLang === 'hi';
  const rawQText = (isHi && q.questionTextHi ? q.questionTextHi : q.questionText) || '';

  // Fallback: Format standard Match List tables if questionText contains List-I & List-II
  const formattedQText = formatMatchListsInText(rawQText);
  return {
    ...q,
    [isHi ? 'questionTextHi' : 'questionText']: formattedQText
  };
}
