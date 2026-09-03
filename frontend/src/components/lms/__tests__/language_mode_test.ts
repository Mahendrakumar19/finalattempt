function detectQuizLanguageMode(quizObj: any, questions: any[]) {
  const langMode = (quizObj?.languageMode || quizObj?.medium || quizObj?.language || quizObj?.language_mode || '').toLowerCase();

  let hasEngContent = false;
  let hasHiContent = false;
  const devanagariRegex = /[\u0900-\u097F]/;
  const latinRegex = /[a-zA-Z]/;

  for (const q of questions) {
    const txt = (q.questionText || '') + (q.optionA || '');
    const txtHi = (q.questionTextHi || '') + (q.optionAHi || '');

    if (devanagariRegex.test(txt) || devanagariRegex.test(txtHi)) {
      hasHiContent = true;
    }
    if ((latinRegex.test(txt) && !devanagariRegex.test(txt)) || (latinRegex.test(txtHi) && !devanagariRegex.test(txtHi))) {
      hasEngContent = true;
    }
  }

  const isHindiOnly = langMode.includes('hindi') || langMode === 'hi' || (hasHiContent && !hasEngContent);
  const isEnglishOnly = langMode.includes('english') || langMode === 'en' || (hasEngContent && !hasHiContent);

  if (isHindiOnly) return 'HINDI_ONLY';
  if (isEnglishOnly) return 'ENGLISH_ONLY';
  return 'BILINGUAL';
}

function runLanguageModeTests() {
  console.log('============================================================');
  console.log('   QUIZ ENGINE LANGUAGE SWITCHER VISIBILITY TEST');
  console.log('============================================================\n');

  // Test 1: Hindi Quiz (Questions stored in Hindi script)
  const hindiQuizObj = { title: 'CDPO Hindi PYQ Test', medium: 'Hindi' };
  const hindiQuestions = [
    { questionText: 'जनहित याचिका की धारणा किस देश से उत्पन्न हुई? CDPO', optionA: 'यूनाइटेड किंगडम' }
  ];
  const mode1 = detectQuizLanguageMode(hindiQuizObj, hindiQuestions);
  console.log(`Test 1 (Hindi Quiz): Expected HINDI_ONLY | Got: ${mode1} -> ${mode1 === 'HINDI_ONLY' ? '✅ PASS' : '❌ FAIL'}`);

  // Test 2: English Quiz
  const engQuizObj = { title: 'General Studies English Test', medium: 'English' };
  const engQuestions = [
    { questionText: 'Which country originated PIL?', optionA: 'United Kingdom' }
  ];
  const mode2 = detectQuizLanguageMode(engQuizObj, engQuestions);
  console.log(`Test 2 (English Quiz): Expected ENGLISH_ONLY | Got: ${mode2} -> ${mode2 === 'ENGLISH_ONLY' ? '✅ PASS' : '❌ FAIL'}`);

  // Test 3: Bilingual Quiz
  const bilingualQuizObj = { title: 'Bilingual UPSC Mock Test', medium: 'Bilingual' };
  const bilingualQuestions = [
    { questionText: 'Which country originated PIL?', questionTextHi: 'जनहित याचिका की धारणा किस देश से उत्पन्न हुई?', optionA: 'USA', optionAHi: 'अमरीका' }
  ];
  const mode3 = detectQuizLanguageMode(bilingualQuizObj, bilingualQuestions);
  console.log(`Test 3 (Bilingual Quiz): Expected BILINGUAL | Got: ${mode3} -> ${mode3 === 'BILINGUAL' ? '✅ PASS' : '❌ FAIL'}`);

  if (mode1 === 'HINDI_ONLY' && mode2 === 'ENGLISH_ONLY' && mode3 === 'BILINGUAL') {
    console.log('\n✅ ALL LANGUAGE SWITCHER VISIBILITY TESTS PASSED!');
  } else {
    console.error('\n❌ LANGUAGE SWITCHER VISIBILITY TESTS FAILED!');
    process.exit(1);
  }
}

runLanguageModeTests();
