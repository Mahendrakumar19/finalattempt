 /**
 * Auto-formats "Match List-I with List-II" (and Hindi सूची-I, सूची-II / Match the following)
 * text blocks into clean, responsive side-by-side 2-column HTML Tables.
 */
export function formatMatchListsInText(input: string): string {
  if (!input || typeof input !== 'string') return '';
  if (input.includes('<table') || input.includes('class="match-list-container"')) {
    if (/<td[^>]*>[\s\S]*?<\/td>/i.test(input) || /<tbody[^>]*>[\s\S]*?<\/tbody>/i.test(input)) {
      return input;
    }
  }

  const hasExplicitList1 = /(?:List[\s\-_]*I\b|List[\s\-_]*1\b|Column[\s\-_]*A\b|Column[\s\-_]*I\b|Column[\s\-_]*1\b|सूची[\s\-_]*I\b|सूची[\s\-_]*1\b)/i.test(input);
  const hasExplicitList2 = /(?:List[\s\-_]*II\b|List[\s\-_]*2\b|Column[\s\-_]*B\b|Column[\s\-_]*II\b|Column[\s\-_]*2\b|सूची[\s\-_]*II\b|सूची[\s\-_]*2\b)/i.test(input);
  const hasMatchKeyword = /(?:Match List|Match the following|सुमेलित|मिलान|जोड़ी|Column[\s\-_]*[AB]|सूची[\s\-_]*[I1II2])/i.test(input);
  const hasExplicitHeaders = hasExplicitList1 || hasExplicitList2 || hasMatchKeyword || input.includes('|');

  if (!hasExplicitHeaders && !input.includes('|')) {
    return input;
  }

  const rawLines = input.split('\n').map(l => l.trim()).filter(Boolean);
  const promptLines: string[] = [];
  const leftItems: string[] = [];
  const rightItems: string[] = [];
  let footerText = '';
  let headerLeft = 'List-I';
  let headerRight = 'List-II';

  for (const line of rawLines) {
    if (/^\s*\|?\s*(?::?-+:?\s*\|)+\s*(?::?-+:?\s*)?\|?\s*$/.test(line)) continue;

    if (/^(?:Codes?|ूट|कूट|कोड)\s*[\:\-\s]*/i.test(line)) {
      footerText = line;
      continue;
    }

    const inlinePair = line.match(/^[ \t]*([A-Ea-eक-ङ1-5|IVX]+)[\.\:\)\-–—]+[ \t]+(.+?)[ \t]+([A-Ea-eक-ङ1-5|IVX]+)[\.\:\)\-–—]+[ \t]+(.+)$/i);
    const isLeft = /^[ \t]*([A-Ea-eक-ङ]|[IVX]+)[\.\:\)\-–—]+[ \t]*/i.test(line);
    const isRight = /^[ \t]*([1-5]|[IVX]+|[A-Ea-eक-ङ])[\.\:\)\-–—]+[ \t]*/i.test(line);

    if (inlinePair && !line.startsWith('Code') && !line.startsWith('कोड') && !line.startsWith('कूट') && !line.includes('Match') && !line.includes('सूची-I') && !line.includes('सूची-II') && !line.includes('List-I') && !line.includes('List-II')) {
      leftItems.push(`${inlinePair[1]}. ${inlinePair[2].trim()}`);
      rightItems.push(`${inlinePair[3]}. ${inlinePair[4].trim()}`);
      continue;
    }

    if (!inlinePair && !isLeft && !isRight) {
      const list2Regex = /(?:List[\s\-_]*II\b|List[\s\-_]*2\b|Column[\s\-_]*B\b|Column[\s\-_]*II\b|Column[\s\-_]*2\b|सूची[\s\-_]*II\b|सूची[\s\-_]*2\b)/i;
      const list1Regex = /(?:List[\s\-_]*I\b|List[\s\-_]*1\b|Column[\s\-_]*A\b|Column[\s\-_]*I\b|Column[\s\-_]*1\b|सूची[\s\-_]*I\b|सूची[\s\-_]*1\b)/i;

      const isList1Head = list1Regex.test(line);
      const isList2Head = !isList1Head && list2Regex.test(line);

      if (isList1Head) {
        const list2Match = list2Regex.exec(line);
        if (list2Match && list2Match.index > 0) {
          headerLeft = line.substring(0, list2Match.index).trim().replace(/^\|+|\|+$/g, '');
          headerRight = line.substring(list2Match.index).trim().replace(/^\|+|\|+$/g, '');
        } else {
          headerLeft = line.trim().replace(/^\|+|\|+$/g, '');
        }
        continue;
      }

      if (isList2Head) {
        headerRight = line.trim().replace(/^\|+|\|+$/g, '');
        continue;
      }
    }

    if (line.includes('|')) {
      const parts = line.split('|').map(s => s.trim()).filter(Boolean);
      if (parts.length >= 2) {
        if (/List[\s\-_]*I|सूची[\s\-_]*I/i.test(parts[0])) {
          headerLeft = parts[0];
          headerRight = parts[1];
        } else {
          leftItems.push(parts[0]);
          rightItems.push(parts[1]);
        }
        continue;
      }
    }

    if (isLeft) {
      leftItems.push(line);
    } else if (isRight) {
      rightItems.push(line);
    } else if (leftItems.length === 0 && rightItems.length === 0) {
      promptLines.push(line);
    }
  }

  if (!hasExplicitHeaders) {
    if (leftItems.length === 0 || rightItems.length === 0) {
      return input;
    }
  }

  const maxRows = Math.max(leftItems.length, rightItems.length);
  if (maxRows === 0) return input;

  let tableHtml = `<div class="match-list-container my-3 overflow-x-auto">`;
  if (promptLines.length > 0) {
    tableHtml += `<p class="mb-2 font-bold text-[var(--text-color)] leading-relaxed">${promptLines.join(' ')}</p>`;
  }
  tableHtml += `<table class="w-full text-xs sm:text-sm border-collapse rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 my-2">`;
  tableHtml += `<thead><tr class="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold">`;
  tableHtml += `<th class="p-2.5 sm:p-3 text-left border-r border-slate-300 dark:border-slate-700 w-1/2">${headerLeft}</th>`;
  tableHtml += `<th class="p-2.5 sm:p-3 text-left w-1/2">${headerRight}</th>`;
  tableHtml += `</tr></thead><tbody class="divide-y divide-slate-200 dark:divide-slate-700 text-slate-800 dark:text-slate-200">`;

  for (let r = 0; r < maxRows; r++) {
    const lText = leftItems[r] || '';
    const rText = rightItems[r] || '';
    tableHtml += `<tr>`;
    tableHtml += `<td class="p-2.5 sm:p-3 border-r border-slate-200 dark:border-slate-700 font-medium align-top dark:text-white leading-relaxed">${lText}</td>`;
    tableHtml += `<td class="p-2.5 sm:p-3 font-medium align-top dark:text-white leading-relaxed">${rText}</td>`;
    tableHtml += `</tr>`;
  }

  tableHtml += `</tbody></table>`;

  if (footerText) {
    tableHtml += `<p class="font-mono font-bold text-xs tracking-wider text-slate-600 dark:text-slate-300 mt-2 pl-1">${footerText}</p>`;
  }

  tableHtml += `</div>`;

  return tableHtml;
}

/**
 * Generic Markdown Table parser. Converts raw Markdown tables (| header1 | header2 |\n|---|---|\n| cell1 | cell2 |)
 * into clean, responsive HTML tables.
 */
export function parseMarkdownTables(input: string): string {
  if (!input || typeof input !== 'string') return '';
  if (input.includes('<table') || input.includes('match-list-container')) return input;
  if (!input.includes('|')) return input;

  const lines = input.split('\n');
  const resultLines: string[] = [];
  let inTable = false;
  let tableHeader: string[] = [];
  let tableRows: string[][] = [];

  const flushTable = () => {
    if (tableRows.length === 0 && tableHeader.length === 0) return;
    let html = `<div class="match-list-container my-3 overflow-x-auto">`;
    html += `<table class="w-full text-xs sm:text-sm border-collapse rounded-xl overflow-hidden border border-[var(--card-border)] my-2">`;

    if (tableHeader.length > 0) {
      html += `<thead><tr class="bg-slate-100 dark:bg-slate-800 border-b border-[var(--card-border)] font-bold text-[var(--text-color)]">`;
      tableHeader.forEach((h, idx) => {
        const borderRight = idx < tableHeader.length - 1 ? 'border-r border-[var(--card-border)]' : '';
        html += `<th class="p-2.5 sm:p-3 text-left ${borderRight}">${h}</th>`;
      });
      html += `</tr></thead>`;
    }

    html += `<tbody class="divide-y divide-[var(--card-border)] text-[var(--text-color)]">`;
    tableRows.forEach(row => {
      html += `<tr>`;
      row.forEach((cell, idx) => {
        const borderRight = idx < row.length - 1 ? 'border-r border-[var(--card-border)]' : '';
        html += `<td class="p-2.5 sm:p-3 align-top font-medium ${borderRight}">${cell}</td>`;
      });
      html += `</tr>`;
    });
    html += `</tbody></table></div>`;

    resultLines.push(html);
    tableHeader = [];
    tableRows = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const isPipeLine = trimmed.includes('|');
    const isSeparatorLine = /^\s*\|?\s*(?::?-+:?\s*\|)+\s*(?::?-+:?\s*)?\|?\s*$/.test(trimmed);

    if (isSeparatorLine) {
      continue;
    }

    if (isPipeLine) {
      const parts = trimmed.split('|').map(s => s.trim());
      if (trimmed.startsWith('|')) parts.shift();
      if (trimmed.endsWith('|')) parts.pop();

      if (parts.length >= 2) {
        if (!inTable) {
          inTable = true;
          tableHeader = parts;
        } else {
          tableRows.push(parts);
        }
        continue;
      }
    }

    if (inTable) {
      flushTable();
      inTable = false;
    }

    resultLines.push(line);
  }

  if (inTable) {
    flushTable();
  }

  return resultLines.join('\n');
}

/**
 * Universal helper that formats question text (Match Lists, Markdown Tables, side-by-side lists)
 * and returns whether HTML rendering (dangerouslySetInnerHTML) is needed.
 */
export function renderFormattedQuestionText(input: string): { isHtml: boolean; formatted: string } {
  if (!input) return { isHtml: false, formatted: '' };

  let formatted = input;
  formatted = formatMatchListsInText(formatted);
  formatted = parseMarkdownTables(formatted);

  const isHtml = formatted.includes('<') ||
                 formatted.includes('match-list-container') ||
                 formatted.includes('<table') ||
                 formatted.includes('<div') ||
                 formatted.includes('<p');

  return { isHtml, formatted };
}

/**
 * Sanitizes and repairs questions where List-I / List-II or option codes (a) (b) (c) (d)
 * were jumbled into option fields or left inside questionText during import.
 */
export function sanitizeAndRepairQuestion(q: any, activeLang: 'en' | 'hi' = 'en'): any {
  if (!q) return q;

  // Guard: If question already possesses valid structured options (optionA..optionD) and is not a corrupted legacy record, return as-is
  const hasValidStructuredOptions = !!(q.optionA && q.optionB && q.optionC && q.optionD);
  const isCanonicalOrStructured = q.isCanonical || q.matchingData || q.orderingItems || q.assertionReason || hasValidStructuredOptions;

  if (isCanonicalOrStructured && hasValidStructuredOptions) {
    const rawEn = q.questionText || '';
    const rawHi = q.questionTextHi || '';
    const textEn = rawEn || rawHi;
    const textHi = rawHi || rawEn;

    let formattedQText = formatMatchListsInText(textEn);
    formattedQText = parseMarkdownTables(formattedQText);
    let formattedQTextHi = formatMatchListsInText(textHi);
    formattedQTextHi = parseMarkdownTables(formattedQTextHi);

    return {
      ...q,
      questionText: formattedQText,
      questionTextHi: formattedQTextHi
    };
  }

  let rawQText = q.questionText || '';
  let rawQTextHi = q.questionTextHi || '';

  let optA = q.optionA || q.optionAHi || '';
  let optB = q.optionB || q.optionBHi || '';
  let optC = q.optionC || q.optionCHi || '';
  let optD = q.optionD || q.optionDHi || '';
  let optE = q.optionE || q.optionEHi || '';

  // Multi-line or single-line option choices regex (e.g. "(a) 3 4 1 2 (b) 1 2 3 4 (c) 3 1 2 4 (d) 4 3 2 1")
  const multiLineOptionsRegex = /(?:^|\n|\s*)(?:\(([a-dA-D1-4क-घ])\)|([a-dA-D1-4क-घ])[\)\.\:\t]+)\s*([\s\S]+?)\s*(?:\(([b-eB-E2-5ख-ङ])\)|([b-eB-E2-5ख-ङ])[\)\.\:\t]+)\s*([\s\S]+?)\s*(?:\(([cC3ग])\)|([cC3ग])[\)\.\:\t]+)\s*([\s\S]+?)\s*(?:\(([dD4घ])\)|([dD4घ])[\)\.\:\t]+)\s*([\s\S]+?)(?=\s*(?:\([eE5ङ]\)|[eE5ङ][\)\.\:\t]+|Ans|Answer|Explanation|Sol|Solution|$))/i;

  let extractedOptA = '';
  let extractedOptB = '';
  let extractedOptC = '';
  let extractedOptD = '';
  let extractedOptE = '';
  let foundEmbeddedOptions = false;

  const tryExtractOptions = (str: string) => {
    if (!str) return false;
    const match = multiLineOptionsRegex.exec(str);
    if (match) {
      foundEmbeddedOptions = true;
      extractedOptA = match[3].trim();
      extractedOptB = match[6].trim();
      extractedOptC = match[9].trim();
      let restD = match[12].trim();

      const optEMatch = /(?:\(([eE5ङ])\)|[eE5ङ][\)\.\:\t]+)\s*([\s\S]+?)$/i.exec(restD);
      if (optEMatch) {
        extractedOptE = optEMatch[2].trim().replace(/\s*(?:Ans|Answer|Explanation|Sol|Solution).*$/i, '');
        extractedOptD = restD.substring(0, optEMatch.index).trim();
      } else {
        extractedOptD = restD.replace(/\s*(?:Ans|Answer|Explanation|Sol|Solution).*$/i, '');
      }
      return true;
    }
    return false;
  };

  // Search across option fields (especially optD, optC) and questionText for embedded choices
  tryExtractOptions(optD) ||
  tryExtractOptions(optC) ||
  tryExtractOptions(optB) ||
  tryExtractOptions(optA) ||
  tryExtractOptions(rawQText) ||
  tryExtractOptions(rawQTextHi);

  // Check if option fields contain stolen table rows (pipes '|' or list items)
  const isStolenOptionsTable = (optA.includes('|') || optB.includes('|') || optC.includes('|') || optD.includes('|')) ||
                               (foundEmbeddedOptions && (!optA || !optB || !optC || !optD));

  if (isStolenOptionsTable) {
    const tableFragments: string[] = [];

    [optA, optB, optC, optD, optE].forEach((optStr) => {
      if (!optStr) return;
      // Strip out the embedded option choices block if present
      let cleanFrag = optStr.replace(multiLineOptionsRegex, '').trim();
      cleanFrag = cleanFrag.replace(/^[a-dA-D][\)\.\:]\s*/, '');
      if (cleanFrag) {
        tableFragments.push(cleanFrag);
      }
    });

    if (foundEmbeddedOptions) {
      optA = extractedOptA;
      optB = extractedOptB;
      optC = extractedOptC;
      optD = extractedOptD;
      if (extractedOptE) optE = extractedOptE;

      rawQText = rawQText.replace(multiLineOptionsRegex, '').trim();
      rawQTextHi = rawQTextHi.replace(multiLineOptionsRegex, '').trim();
    }

    if (tableFragments.length > 0) {
      const mergedTableRows = '\n' + tableFragments.join('\n');
      if (rawQText && !rawQText.includes(tableFragments[0])) {
        rawQText += mergedTableRows;
      }
      if (rawQTextHi && !rawQTextHi.includes(tableFragments[0])) {
        rawQTextHi += mergedTableRows;
      }
    }
  }

  // Format standard Match List tables if rawQText / rawQTextHi contains matching patterns
  let formattedQText = formatMatchListsInText(rawQText);
  formattedQText = parseMarkdownTables(formattedQText);

  let formattedQTextHi = rawQTextHi ? formatMatchListsInText(rawQTextHi) : formattedQText;
  formattedQTextHi = parseMarkdownTables(formattedQTextHi);

  return {
    ...q,
    questionText: formattedQText,
    questionTextHi: formattedQTextHi,
    optionA: optA,
    optionB: optB,
    optionC: optC,
    optionD: optD,
    optionE: optE,
    optionAHi: q.optionAHi || optA,
    optionBHi: q.optionBHi || optB,
    optionCHi: q.optionCHi || optC,
    optionDHi: q.optionDHi || optD,
    optionEHi: q.optionEHi || optE,
  };
}
