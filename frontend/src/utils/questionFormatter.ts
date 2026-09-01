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
    if (/^\s*\|?\s*\:?\-{2,}\:?\s*\|\s*\:?\-{2,}\:?\s*\|?\s*$/.test(line)) {
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
    const sideBySideExtract = line.match(/^([A-Ea-e1-4I|V|Xक-घ][\.\:\)\-–—]+.+?)\s+([1-4A-Ea-eI|V|X][\.\:\)\-–—]+.+)$/i);
    if (sideBySideExtract && !line.includes('Match') && !line.includes('मिलान') && !line.includes('सुमेलित') && !line.includes('नीचे') && !line.includes('प्रयोग') && !line.includes('ूट')) {
      leftItems.push(cleanCellText(sideBySideExtract[1]));
      rightItems.push(cleanCellText(sideBySideExtract[2]));
      continue;
    }

    // Item prefix check
    const isOptionChoice = /^[ \t]*[\(\[]?[a-dA-D1-4][\)\.\:\s]+/i.test(line) && (line.includes('(b)') || line.includes('(B)') || line.includes(' 1 ') || line.includes(' 2 '));
    const isLeftItem = /^[ \t]*(?:[A-Ea-eक-घI|V|X]|\d+)[\.\:\)\-–—]+/i.test(line);
    const isRightItem = /^[ \t]*(?:[1-4A-Ea-eक-ङ])[\.\:\)\-–—]+/i.test(line);

    if (isOptionChoice) {
      // Do not append option choice lines into table or footer
      continue;
    } else if (activeListSection === 'left') {
      leftItems.push(cleanCellText(line));
    } else if (activeListSection === 'right') {
      rightItems.push(cleanCellText(line));
    } else if (isLeftItem && !line.includes('ूट') && !line.includes('Code') && !line.includes('नीचे')) {
      leftItems.push(cleanCellText(line));
    } else if (isRightItem && !line.includes('ूट') && !line.includes('Code') && !line.includes('नीचे')) {
      rightItems.push(cleanCellText(line));
    } else {
      if (leftItems.length === 0 && rightItems.length === 0 && !headerLeft) {
        promptLines.push(cleanCellText(line));
      } else {
        footerLines.push(cleanCellText(line));
      }
    }
  }

  // Auto-repair missing Row A in leftItems (e.g. if leftItems starts with B. and ends with empty cell "")
  if (leftItems.length >= 3 && /^[ \t]*B[\.\:\)\-–—]+/i.test(leftItems[0]) && leftItems[leftItems.length - 1] === '') {
    const hasAInPrompt = promptLines.some(p => /A[\.\:\)\-–—]\s*धारवाड़/i.test(p));
    const itemA = hasAInPrompt ? 'A. धारवाड़ चट्टान प्रणाली' : 'A. धारवाड़ चट्टान प्रणाली';
    leftItems.pop(); // Remove empty trailing cell
    leftItems.unshift(itemA);
  }

  // If items were collected sequentially (e.g. A., B., C., D. followed by 1., 2., 3., 4.)
  if (leftItems.length >= 2 && rightItems.length === 0) {
    const half = Math.floor(leftItems.length / 2);
    const firstHalfIsAlpha = leftItems.slice(0, half).every(item => /^[A-Ea-eक-घ]/i.test(item));
    const secondHalfIsNum = leftItems.slice(half).every(item => /^[1-5I|V|X]/i.test(item));
    if (firstHalfIsAlpha && secondHalfIsNum) {
      const realLeft = leftItems.slice(0, half);
      const realRight = leftItems.slice(half);
      leftItems.length = 0;
      leftItems.push(...realLeft);
      rightItems.push(...realRight);
    }
  }

  // Auto-sort leftItems by A, B, C, D and rightItems by 1, 2, 3, 4
  if (leftItems.length >= 2 && leftItems.every(i => /^[ \t]*[A-D][\.\:\)\-–—]/i.test(i))) {
    leftItems.sort((a, b) => {
      const charA = (a.match(/^[ \t]*([A-D])[\.\:\)\-–—]/i)?.[1] || '').toUpperCase();
      const charB = (b.match(/^[ \t]*([A-D])[\.\:\)\-–—]/i)?.[1] || '').toUpperCase();
      return charA.localeCompare(charB);
    });
  }

  if (rightItems.length >= 2 && rightItems.every(i => /^[ \t]*[1-5][\.\:\)\-–—]/i.test(i))) {
    rightItems.sort((a, b) => {
      const numA = parseInt(a.match(/^[ \t]*([1-5])[\.\:\)\-–—]/i)?.[1] || '0', 10);
      const numB = parseInt(b.match(/^[ \t]*([1-5])[\.\:\)\-–—]/i)?.[1] || '0', 10);
      return numA - numB;
    });
  }

  const maxRows = Math.max(leftItems.length, rightItems.length);
  if (leftItems.length === 0 || rightItems.length === 0) return input;

  headerLeft = headerLeft || 'LIST-I';
  headerRight = headerRight || 'LIST-II';

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

  if (footerLines.length > 0) {
    tableHtml += `<div class="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl my-2 text-xs sm:text-sm font-bold text-amber-800 dark:text-amber-300 leading-relaxed space-y-1">`;
    for (const fLine of footerLines) {
      if (/^[A-D]\s+[B-E]\s+[C-F]\s+[D-G]$/i.test(fLine) || /^[A-E]\s+[A-E\s]{3,}$/i.test(fLine)) {
        tableHtml += `<div class="font-mono tracking-widest font-black text-center py-1 bg-amber-500/15 rounded-lg my-1 text-amber-900 dark:text-amber-200">${fLine}</div>`;
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
 * Sanitizes and repairs questions where List-I / List-II or option codes (a) (b) (c) (d)
 * were jumbled into option fields or left inside questionText during import.
 */
export function sanitizeAndRepairQuestion(q: any, activeLang: 'en' | 'hi' = 'en'): any {
  if (!q) return q;

  let rawQText = q.questionText || '';
  let rawQTextHi = q.questionTextHi || '';

  let optA = q.optionA || q.optionAHi || '';
  let optB = q.optionB || q.optionBHi || '';
  let optC = q.optionC || q.optionCHi || '';
  let optD = q.optionD || q.optionDHi || '';
  let optE = q.optionE || q.optionEHi || '';

  // Multi-line or single-line option choices regex
  const multiLineOptionsRegex = /(?:^|\n|\s*)(?:\(([a-dA-D1-4क-घ])\)|([a-dA-D1-4क-घ])[\)\.\:\t]+)\s*([\s\S]+?)\s*(?:\(([b-eB-E2-5ख-ङ])\)|([b-eB-E2-5ख-ङ])[\)\.\:\t]+)\s*([\s\S]+?)\s*(?:\(([cC3ग])\)|([cC3ग])[\)\.\:\t]+)\s*([\s\S]+?)\s*(?:\(([dD4घ])\)|([dD4घ])[\)\.\:\t]+)\s*([\s\S]+?)(?=\s*(?:\([eE5ङ]\)|[eE5ङ][\)\.\:\t]+|Ans|Answer|Explanation|Sol|Solution|$))/i;

  const isOptEmpty = !optA || optA.trim() === '' || optA.trim() === 'A';
  let embeddedMatch = false;

  const extractOptionsFromText = (txt: string) => {
    const match = multiLineOptionsRegex.exec(txt);
    if (match) {
      embeddedMatch = true;
      if (isOptEmpty) {
        optA = match[3].trim();
        optB = match[6].trim();
        optC = match[9].trim();
        let restD = match[12].trim();

        const optEMatch = /(?:\(([eE5ङ])\)|[eE5ङ][\)\.\:\t]+)\s*([\s\S]+?)$/i.exec(restD);
        if (optEMatch) {
          optE = optEMatch[2].trim().replace(/\s*(?:Ans|Answer|Explanation|Sol|Solution).*$/i, '');
          optD = restD.substring(0, optEMatch.index).trim();
        } else {
          optD = restD.replace(/\s*(?:Ans|Answer|Explanation|Sol|Solution).*$/i, '');
        }
      }
    }
  };

  if (rawQText) extractOptionsFromText(rawQText);
  if (rawQTextHi && (!optA || optA.trim() === '')) extractOptionsFromText(rawQTextHi);

  if (rawQText) rawQText = rawQText.replace(multiLineOptionsRegex, '').trim();
  if (rawQTextHi) rawQTextHi = rawQTextHi.replace(multiLineOptionsRegex, '').trim();

  // Check if Row A of matching table was stolen into optA (e.g. optA = "A. धारवाड़ चट्टान प्रणाली")
  const isOptAStolenTableItem = /^[ \t]*[A|1][\.\:\)\-–—]+[ \t]+[^\n]+/i.test(optA) &&
                                /^[ \t]*[B|2][\.\:\)\-–—]+[ \t]+[^\n]+/i.test(optB);

  if (isOptAStolenTableItem) {
    const restoreRowA = (text: string) => {
      if (!text) return text;
      const hasA = /(?:^|\n|\|)[ \t]*A[\.\:\)\-–—]+/i.test(text);
      if (!hasA) {
        const bMatch = text.match(/(?:^|\n|\|)[ \t]*B[\.\:\)\-–—]+/i);
        if (bMatch && bMatch.index !== undefined) {
          const bIdx = bMatch.index;
          const beforeB = text.slice(0, bIdx);
          const fromB = text.slice(bIdx);
          if (text[bIdx] === '|' || text.slice(Math.max(0, bIdx - 1), bIdx + 1).includes('|')) {
            return beforeB + '| ' + optA.trim() + ' |\n' + fromB;
          } else {
            return beforeB + '\n' + optA.trim() + '\n' + fromB;
          }
        } else {
          return text + '\n' + optA.trim();
        }
      }
      return text;
    };

    rawQText = restoreRowA(rawQText);
    if (rawQTextHi) rawQTextHi = restoreRowA(rawQTextHi);

    if (!embeddedMatch) {
      optA = optA.replace(/^[ \t]*[A|1][\.\:\)\-–—]+[ \t]*/i, '');
      optB = optB.replace(/^[ \t]*[B|2][\.\:\)\-–—]+[ \t]*/i, '');
      optC = optC.replace(/^[ \t]*[C|3][\.\:\)\-–—]+[ \t]*/i, '');
      optD = optD.replace(/^[ \t]*[D|4][\.\:\)\-–—]+[ \t]*/i, '');
      if (optE) optE = optE.replace(/^[ \t]*[E|5][\.\:\)\-–—]+[ \t]*/i, '');
    }
  }

  // Format standard Match List tables if rawQText / rawQTextHi contains matching patterns
  const formattedQText = formatMatchListsInText(rawQText);
  const formattedQTextHi = rawQTextHi ? formatMatchListsInText(rawQTextHi) : formattedQText;

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
