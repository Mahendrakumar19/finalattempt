/**
 * Auto-formats "Match List-I with List-II" (and Hindi सूची-I, सूची-II) text blocks
 * into clean, responsive HTML Tables.
 */
export function formatMatchListsInText(input: string): string {
  if (!input) return '';
  if (input.includes('<table') || input.includes('class="match-list-container"')) return input;

  const hasList1 = /List[\s\-_]*I\b|List[\s\-_]*1\b|सूची[\s\-_]*I\b|सूची[\s\-_]*1\b/i.test(input);
  const hasList2 = /List[\s\-_]*II\b|List[\s\-_]*2\b|सूची[\s\-_]*II\b|सूची[\s\-_]*2\b/i.test(input);

  if (!hasList1 || !hasList2) return input;

  const rawLines = input.split('\n');
  const promptLines: string[] = [];
  const listRows: { left: string; right: string }[] = [];
  let headerLeft = 'List-I';
  let headerRight = 'List-II';
  let codesHeader = '';
  let inListSection = false;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line) continue;

    // Header line detection e.g. "List-I (Items of the Constitution)   List-II (Taken from Countries)"
    const isHeaderLine = /List[\s\-_]*I|List[\s\-_]*1|सूची[\s\-_]*I|सूची[\s\-_]*1/i.test(line) &&
                         /List[\s\-_]*II|List[\s\-_]*2|सूची[\s\-_]*II|सूची[\s\-_]*2/i.test(line);

    if (isHeaderLine) {
      inListSection = true;
      const headerMatch = line.match(/^([^\n\r]*?List[\s\-_]*I[^\n\r]*?)\s{2,}([^\n\r]*?List[\s\-_]*II[^\n\r]*)$/i) ||
                          line.match(/^([^\n\r]*?सूची[\s\-_]*I[^\n\r]*?)\s{2,}([^\n\r]*?सूची[\s\-_]*II[^\n\r]*)$/i) ||
                          line.match(/^([^\n\r]*?List[\s\-_]*I[^\n\r]*?)\s+([^\n\r]*?List[\s\-_]*II[^\n\r]*)$/i);
      if (headerMatch) {
        headerLeft = headerMatch[1].trim();
        headerRight = headerMatch[2].trim();
      } else {
        headerLeft = line;
      }
      continue;
    }

    // Column Codes header e.g. "A B C D" or "Code: A B C D" or "कूट: A B C D"
    if (/^(?:Codes?|कूट|Code\s*[\:\-\s]*)?\s*[\:\-\s]*[A-D\s]{3,15}$/i.test(line) || /^[A-D]\s+[B-E]\s+[C-F]\s+[D-G]$/i.test(line)) {
      codesHeader = line;
      inListSection = false;
      continue;
    }

    if (inListSection) {
      // Split row by right column prefix (e.g. "1. Australia", "2. Canada") or multiple spaces
      const numMatch = line.match(/^(.*?)\s+(\d+[\.\)]\s+.*)$/);
      if (numMatch) {
        listRows.push({ left: numMatch[1].trim(), right: numMatch[2].trim() });
      } else {
        const rowParts = line.split(/\s{2,}|\t|\|/).map(s => s.trim()).filter(Boolean);
        if (rowParts.length >= 2) {
          listRows.push({ left: rowParts[0], right: rowParts[1] });
        } else if (listRows.length > 0) {
          const lastRow = listRows[listRows.length - 1];
          if (/^[1-4A-D][\.\)]/.test(line)) {
            lastRow.right += ' ' + line;
          } else {
            lastRow.left += ' ' + line;
          }
        } else {
          promptLines.push(line);
        }
      }
    } else {
      promptLines.push(line);
    }
  }

  if (listRows.length === 0) return input;

  let tableHtml = `<div class="match-list-container my-3 overflow-x-auto">`;
  if (promptLines.length > 0) {
    tableHtml += `<p class="mb-2 font-semibold text-slate-900 dark:text-white">${promptLines.join(' ')}</p>`;
  }
  tableHtml += `<table class="w-full text-xs sm:text-sm border-collapse rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-xs my-2">`;
  tableHtml += `<thead><tr class="bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10 font-bold">`;
  tableHtml += `<th class="p-2.5 sm:p-3 text-left border-r border-slate-200 dark:border-white/10 w-1/2">${headerLeft}</th>`;
  tableHtml += `<th class="p-2.5 sm:p-3 text-left w-1/2">${headerRight}</th>`;
  tableHtml += `</tr></thead><tbody class="divide-y divide-slate-100 dark:divide-white/5">`;

  listRows.forEach((row, idx) => {
    const bgClass = idx % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-900/30' : '';
    tableHtml += `<tr class="${bgClass}">`;
    tableHtml += `<td class="p-2.5 sm:p-3 border-r border-slate-100 dark:border-white/5 font-medium align-top">${row.left}</td>`;
    tableHtml += `<td class="p-2.5 sm:p-3 font-medium align-top">${row.right}</td>`;
    tableHtml += `</tr>`;
  });

  tableHtml += `</tbody></table>`;
  if (codesHeader) {
    tableHtml += `<p class="font-mono font-bold text-xs tracking-wider text-amber-600 dark:text-amber-400 mt-2 pl-1">${codesHeader}</p>`;
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
  const optA = (isHi && q.optionAHi ? q.optionAHi : q.optionA) || '';
  const optB = (isHi && q.optionBHi ? q.optionBHi : q.optionB) || '';
  const optC = (isHi && q.optionCHi ? q.optionCHi : q.optionC) || '';
  const optD = (isHi && q.optionDHi ? q.optionDHi : q.optionD) || '';

  const fullContent = `${rawQText}\n${optA}\n${optB}\n${optC}\n${optD}`;

  // Detect option codes string like "(a) 4 3 1 2 (b) 3 4 2 1 (c) 4 3 2 1 (d) 3 4 1 2"
  const codesMatch = fullContent.match(/(?:(?:Code|Codes|Koot|कूट)[\:\s\-]*)?[\(\[]?a[\)\]\.]?\s*(\d[\s\d,\-]{1,15})\s*[\(\[]?b[\)\]\.]?\s*(\d[\s\d,\-]{1,15})\s*[\(\[]?c[\)\]\.]?\s*(\d[\s\d,\-]{1,15})\s*[\(\[]?d[\)\]\.]?\s*(\d[\s\d,\-]{1,15})/i);

  const hasMatchHeader = /Match\b|List[\s\-_]*I|सूची[\s\-_]*I|Code\b|Koot\b|कूट\b/i.test(fullContent);

  if (hasMatchHeader && (codesMatch || optA.match(/^[A-D][\.\s]/) || optB.match(/[\(\[]?a[\)\]\.]?\s*\d/i))) {
    let newOptA = optA;
    let newOptB = optB;
    let newOptC = optC;
    let newOptD = optD;

    if (codesMatch) {
      newOptA = `(a) ${codesMatch[1].trim()}`;
      newOptB = `(b) ${codesMatch[2].trim()}`;
      newOptC = `(c) ${codesMatch[3].trim()}`;
      newOptD = `(d) ${codesMatch[4].trim()}`;
    }

    // Reconstruct prompt by gathering List-I and List-II text
    let cleanPrompt = rawQText.replace(/(?:(?:Code|Codes|Koot|कूट)[\:\s\-]*)?[\(\[]?a[\)\]\.]?\s*\d[\s\S]*$/i, '').trim();

    const listItems: string[] = [];
    [optA, optB, optC, optD].forEach(optStr => {
      const cleaned = optStr.replace(/(?:(?:Code|Codes|Koot|कूट)[\:\s\-]*)?[\(\[]?a[\)\]\.]?\s*\d[\s\S]*$/i, '').trim();
      if (cleaned && !cleaned.startsWith('(a)') && !cleaned.startsWith('(b)') && !cleaned.startsWith('(c)') && !cleaned.startsWith('(d)')) {
        listItems.push(cleaned);
      }
    });

    if (listItems.length > 0) {
      cleanPrompt += '\n' + listItems.join('\n');
    }

    const formattedQText = formatMatchListsInText(cleanPrompt);

    return {
      ...q,
      [isHi ? 'questionTextHi' : 'questionText']: formattedQText,
      [isHi ? 'optionAHi' : 'optionA']: newOptA,
      [isHi ? 'optionBHi' : 'optionB']: newOptB,
      [isHi ? 'optionCHi' : 'optionC']: newOptC,
      [isHi ? 'optionDHi' : 'optionD']: newOptD,
    };
  }

  // Fallback: Format standard Match List tables if questionText contains List-I & List-II
  const formattedQText = formatMatchListsInText(rawQText);
  return {
    ...q,
    [isHi ? 'questionTextHi' : 'questionText']: formattedQText
  };
}
