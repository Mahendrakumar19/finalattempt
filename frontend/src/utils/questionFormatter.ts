/**
 * Auto-formats "Match List-I with List-II" (and Hindi सूची-I, सूची-II / Match the following)
 * text blocks into clean, responsive side-by-side 2-column HTML Tables.
 */
export function formatMatchListsInText(input: string): string {
  if (!input) return '';

  let textToParse = input;
  if (textToParse.includes('<table') || textToParse.includes('class="match-list-container"')) {
    // If the HTML table already contains non-empty <td> or <tbody> data rows, preserve as-is
    if (/<td[^>]*>[\s\S]*?<\/td>/i.test(textToParse) || /<tbody[^>]*>[\s\S]*?<\/tbody>/i.test(textToParse)) {
      return input;
    }
    // Otherwise, strip out incomplete table markup to allow full re-parsing
    textToParse = textToParse
      .replace(/<div class="match-list-container"[^>]*>[\s\S]*?<\/div>/gi, '')
      .replace(/<table[^>]*>[\s\S]*?<\/table>/gi, '')
      .trim();
  }

  const hasMatchKeyword = /(?:Match|मिलान|जोड़ी|Column|सूची|List)/i.test(textToParse);
  const hasRomanItems = /(?:^|\n)[ \t]*(?:[I|V|X]+|\d+)[\.\:\)\-–—]+[ \t]+/i.test(textToParse);
  const hasAlphaItems = /(?:^|\n)[ \t]*[A-Ea-eक-ङ][\.\:\)\-–—]+[ \t]+/i.test(textToParse);

  const hasList1 = /List[\s\-_]*I\b|List[\s\-_]*1\b|Column[\s\-_]*A\b|सूची[\s\-_]*I\b|सूची[\s\-_]*1\b/i.test(textToParse);
  const hasList2 = /List[\s\-_]*II\b|List[\s\-_]*2\b|Column[\s\-_]*B\b|सूची[\s\-_]*II\b|सूची[\s\-_]*2\b/i.test(textToParse);

  if (!hasList1 && !hasList2 && (!hasMatchKeyword || (!hasRomanItems && !hasAlphaItems)) && !textToParse.includes('|')) {
    return input;
  }

  const rawLines = textToParse.split('\n');
  const promptLines: string[] = [];
  const leftItems: string[] = [];
  const rightItems: string[] = [];
  const footerLines: string[] = [];
  let headerLeft = '';
  let headerRight = '';

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
    if (/^\s*\|?\s*(?::?-+:?\s*\|)+\s*(?::?-+:?\s*)?\|?\s*$/.test(line) || /^\s*\|?\s*\:?\-{2,}\:?\s*\|\s*\:?\-{2,}\:?\s*\|?\s*$/.test(line)) {
      continue;
    }

    // Check if line is a sentence prompt before table items (contains instructions like "with", "select", "सुमेलित", "कीजिए", "चुनिए", "उत्तर")
    const isPromptInstruction = /(?:with|select|using|given|below|सुमेलित|कीजिए|चुनिए|उत्तर|प्रयोग|दीजिये|मिलाएं|करें)/i.test(line) &&
                                !/^\s*\|?\s*[A-Ea-e1-5I|V|Xक-ङ][\.\:\)\-–—]/i.test(line);

    if (isPromptInstruction && leftItems.length === 0 && rightItems.length === 0 && !headerLeft) {
      promptLines.push(cleanCellText(line));
      continue;
    }

    // Check line containing pipe '|' splitting Left and Right columns
    if (line.includes('|')) {
      const pipeMatch = line.match(/^\s*\|(.*)\|\s*$/);
      const rawParts = pipeMatch
        ? pipeMatch[1].split('|').map(s => cleanCellText(s))
        : line.split('|').map(s => cleanCellText(s));

      if (rawParts.length >= 2) {
        if (/List[\s\-_]*I|Column[\s\-_]*A|सूची[\s\-_]*I|सूची[\s\-_]*1/i.test(rawParts[0])) {
          headerLeft = rawParts[0];
          headerRight = rawParts[1];
        } else {
          leftItems.push(rawParts[0]);
          rightItems.push(rawParts[1]);
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

    // Side-by-side data row check e.g. "I. Union List A. 97 entries" or "A. Dharwar 1. Oldest Archaean" or "A. धारवाड़ 1. सबसे पुरानी"
    const sideBySideExtract = line.match(/^[ \t]*([IVX]+|[A-Ea-e1-5क-ङ])[\.\:\)\-–—]+[ \t]+(.+?)[ \t]+([ABCDEa-e1-5क-ङ]|[IVX]+)[\.\:\)\-–—]+[ \t]+(.+)$/i);
    if (sideBySideExtract && !line.includes('Match') && !line.includes('मिलान') && !line.includes('सुमेलित') && !line.includes('नीचे') && !line.includes('प्रयोग') && !line.includes('ूट')) {
      leftItems.push(cleanCellText(`${sideBySideExtract[1]}. ${sideBySideExtract[2]}`));
      rightItems.push(cleanCellText(`${sideBySideExtract[3]}. ${sideBySideExtract[4]}`));
      continue;
    }

    // Item prefix check: detect option choice lines e.g. "(a)\t 3 4 1 2\n(b)\t1 2 3 4" or "(a) A C B"
    const isOptionChoice = /(?:^[ \t]*[\(\[]?[a-dA-D1-4][\)\.\:\s\t]+|(?:\n|\s+)\([a-eA-Eक-ङ]\))/i.test(line) &&
                           (/(?:\([b-dB-D]\)|[b-dB-D][\)\.\:\t]+|\t)/i.test(line) || line.includes('(b)') || line.includes('(B)'));
    const isLeftAlphaItem = /^[ \t]*\|?[ \t]*(?:[A-Ea-eक-घI|V|X])[\.\:\)\-–—]+/i.test(line);
    const isRightNumItem = /^[ \t]*\|?[ \t]*(?:[1-5])[\.\:\)\-–—]+/i.test(line);

    if (isOptionChoice) {
      // Do not append option choice lines into table or footer
      continue;
    } else if (activeListSection === 'left') {
      leftItems.push(cleanCellText(line));
    } else if (activeListSection === 'right') {
      rightItems.push(cleanCellText(line));
    } else if (isLeftAlphaItem && !line.includes('ूट') && !line.includes('Code') && !line.includes('नीचे')) {
      leftItems.push(cleanCellText(line));
    } else if (isRightNumItem && !line.includes('ूट') && !line.includes('Code') && !line.includes('नीचे')) {
      rightItems.push(cleanCellText(line));
    } else {
      if (leftItems.length === 0 && rightItems.length === 0 && !headerLeft) {
        promptLines.push(cleanCellText(line));
      } else {
        footerLines.push(cleanCellText(line));
      }
    }
  }

  // If items were collected sequentially (e.g. A., B., C., D. followed by 1., 2., 3., 4.)
  if (leftItems.length >= 2 && rightItems.length === 0) {
    const half = Math.floor(leftItems.length / 2);
    const firstHalfIsAlpha = leftItems.slice(0, half).every(item => /^[ \t]*[A-Ea-eक-घ]/i.test(item));
    const secondHalfIsNum = leftItems.slice(half).every(item => /^[ \t]*[1-5I|V|X]/i.test(item));
    if (firstHalfIsAlpha && secondHalfIsNum) {
      const realLeft = leftItems.slice(0, half);
      const realRight = leftItems.slice(half);
      leftItems.length = 0;
      leftItems.push(...realLeft);
      rightItems.push(...realRight);
    }
  }

  // Normalize column assignment: Ensure Column 1 (leftItems) receives Alpha (A, B, C, D) items and Column 2 (rightItems) receives Numeric (1, 2, 3, 4) items
  if (rightItems.length >= 2 && rightItems.every(item => /^[ \t]*[A-Ea-eक-घ]/i.test(item)) && leftItems.every(item => /^[ \t]*[1-5I|V|X]/i.test(item))) {
    const temp = [...leftItems];
    leftItems.length = 0;
    leftItems.push(...rightItems);
    rightItems.length = 0;
    rightItems.push(...temp);
  }

  const maxRows = Math.max(leftItems.length, rightItems.length);
  if (leftItems.length === 0 || rightItems.length === 0) return input;

  headerLeft = headerLeft || 'LIST-I';
  headerRight = headerRight || 'LIST-II';

  let tableHtml = `<div class="match-list-container my-3 overflow-x-auto">`;
  if (promptLines.length > 0) {
    tableHtml += `<p class="mb-2 font-bold text-[var(--text-color)] leading-relaxed">${promptLines.join('<br/>')}</p>`;
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

  if (footerLines.length > 0) {
    tableHtml += `<div class="p-3 bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl my-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-relaxed space-y-1">`;
    for (const fLine of footerLines) {
      if (/^[A-D]\s+[B-E]\s+[C-F]\s+[D-G]$/i.test(fLine) || /^[A-E]\s+[A-E\s]{3,}$/i.test(fLine)) {
        tableHtml += `<div class="font-mono tracking-widest font-black text-center py-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg my-1 text-slate-900 dark:text-white">${fLine}</div>`;
      } else {
        tableHtml += `<div>${fLine}</div>`;
      }
    }
    tableHtml += `</div>`;
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
