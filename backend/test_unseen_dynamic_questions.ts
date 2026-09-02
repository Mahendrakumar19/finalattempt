import { BilingualPdfParser } from './services/bilingualPdfParser';

console.log('========================================================');
console.log('   UNSEEN DYNAMIC SYNTHETIC QUESTIONS PARSER AUDIT      ');
console.log('========================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    failCount++;
  }
}

async function runUnseenDynamicTests() {
  const NOVEL_UNSEEN_QUESTIONS = [
    {
      id: 1,
      category: 'Matching with tabs',
      text: `801. Match List-I with List-II:\na. Element-X\t1. Catalyst-Alpha\nb. Element-Y\t2. Catalyst-Beta\nc. Element-Z\t3. Catalyst-Gamma\nd. Element-W\t4. Catalyst-Delta\n(a) 3\t4\t1\t2 (b) 1\t2\t3\t4 (c) 2\t1\t4\t3 (d) 4\t3\t2\t1`
    },
    {
      id: 2,
      category: 'Matching with multiple spaces',
      text: `802. Match Column-A with Column-B:\nA. Reactor-A        1. High Pressure\nB. Reactor-B        2. Low Temperature\nC. Reactor-C        3. Plasma State\nD. Reactor-D        4. Vacuum State\n(a) 4 3 2 1 (b) 1 2 3 4 (c) 2 1 4 3 (d) 3 4 1 2`
    },
    {
      id: 3,
      category: 'Matching with 4 coded options',
      text: `803. Match pairs:\n1. Alpha 2. Beta 3. Gamma 4. Delta\nA. Red B. Green C. Blue D. Yellow\n(a) A-1, B-2, C-3, D-4 (b) A-4, B-3, C-2, D-1 (c) A-2, B-1, C-4, D-3 (d) A-3, B-4, C-1, D-2`
    },
    {
      id: 4,
      category: 'Matching with 5 options',
      text: `804. Match List-1 with List-2:\na. Item-1 1. Val-1\nb. Item-2 2. Val-2\nc. Item-3 3. Val-3\nd. Item-4 4. Val-4\n(a) 1 2 3 4 (b) 4 3 2 1 (c) 2 1 4 3 (d) More than one (e) None of the above`
    },
    {
      id: 5,
      category: 'Ordering question',
      text: `805. Arrange the planetary discoveries in chronological sequence:\n1. Discovery of Neptune\n2. Discovery of Uranus\n3. Discovery of Pluto\n4. Discovery of Exoplanet\n(a) 2 1 3 4 (b) 1 2 3 4 (c) 3 4 1 2 (d) 4 3 2 1`
    },
    {
      id: 6,
      category: 'Statement-based question',
      text: `806. Consider the following statements regarding Fusion Energy:\n1. It releases high energy without long-lived radioactive waste.\n2. Deuterium and Tritium are used as primary fuels.\n(a) 1 only (b) 2 only (c) Both 1 and 2 (d) Neither 1 nor 2`
    },
    {
      id: 7,
      category: 'Table-based question',
      text: `807. Table Analysis:\n| Compound | Boiling Point |\n| Water | 100 C |\n| Ethanol | 78 C |\n(a) High (b) Moderate (c) Low (d) Variable`
    },
    {
      id: 8,
      category: 'Assertion/Reason question',
      text: `808. Assertion (A): Superconductors exhibit zero electrical resistance.\nReason (R): Cooper pairs form below critical temperature.\n(a) Both A and R are true and R is correct explanation of A\n(b) Both A and R are true but R is not correct explanation\n(c) A is true but R is false\n(d) A is false but R is true`
    },
    {
      id: 9,
      category: 'Numeric options question',
      text: `809. How many stable isotopes does Tin possess?\n(a) 10 (b) 8 (c) 12 (d) 6`
    },
    {
      id: 10,
      category: 'Decimal values question',
      text: `810. What is the gravitational acceleration constant on Earth at sea level?\n(a) 9.806 m/s2 (b) 9.780 m/s2 (c) 9.832 m/s2 (d) 10.00 m/s2`
    },
    {
      id: 11,
      category: 'Abbreviations question',
      text: `811. UNESCO headquarters is situated in:\n(a) Paris (b) Geneva (c) New York (d) Vienna`
    },
    {
      id: 12,
      category: 'Initials in prompt question',
      text: `812. J. J. Thomson discovered which subatomic particle in 1897?\n(a) Electron (b) Proton (c) Neutron (d) Positron`
    },
    {
      id: 13,
      category: 'Hindi question',
      text: `813. प्रकाश की गति सर्वाधिक किस माध्यम में होती है?\n(a) निर्वात में (b) जल में (c) कांच में (d) वायु में`
    },
    {
      id: 14,
      category: 'English question',
      text: `814. Which layer of the atmosphere contains the ozone layer?\n(a) Stratosphere (b) Troposphere (c) Mesosphere (d) Thermosphere`
    },
    {
      id: 15,
      category: 'Bilingual question',
      text: `815. Which organ produces insulin?\nकिस अंग द्वारा इंसुलिन का उत्पादन होता है?\n(a) Pancreas / अग्न्याशय (b) Liver / यकृत (c) Kidney / वृक्क (d) Thyroid / थायराइड`
    },
    {
      id: 16,
      category: 'Section heading after options',
      text: `816. Which ocean is the largest on Earth?\n(a) Pacific Ocean (b) Atlantic Ocean (c) Indian Ocean (d) Arctic Ocean\nTOPIC: EARTH OCEANOGRAPHY`
    },
    {
      id: 17,
      category: 'Section heading with colon',
      text: `817. Which gas constitutes the majority of Earth atmosphere?\n(a) Nitrogen (b) Oxygen (c) Argon (d) Carbon Dioxide\nCHAPTER 12: ATMOSPHERIC COMPOSITION`
    },
    {
      id: 18,
      category: 'Standard 4-option MCQ',
      text: `818. What is the chemical symbol for Gold?\n(a) Au (b) Ag (c) Fe (d) Cu`
    },
    {
      id: 19,
      category: 'Missing options in source',
      text: `819. Explain the mechanism of CRISPR-Cas9 gene editing.`
    },
    {
      id: 20,
      category: 'Complex multi-part parent question',
      text: `820. Multi-part Question Context: Thermodynamics Laws\n(a) Zeroth Law (b) First Law (c) Second Law (d) Third Law`
    }
  ];

  console.log(`--- AUDITING ALL ${NOVEL_UNSEEN_QUESTIONS.length} NOVEL UNSEEN QUESTIONS ---`);

  for (const q of NOVEL_UNSEEN_QUESTIONS) {
    const report = await BilingualPdfParser.parseTextAsync(q.text);
    const parsed = report.questionsPreview[0];

    assert(!!parsed, `Novel Q${q.id} (${q.category}): Parsed into Preview DTO cleanly`);

    if (q.id === 19) {
      assert(!parsed?.optionA && !parsed?.optionB, `Novel Q19 (Missing Options): No fabricated options generated`);
      continue;
    }

    const optA = (parsed?.optionA || parsed?.optionAHi || '').trim();
    const optB = (parsed?.optionB || parsed?.optionBHi || '').trim();
    assert(!!optA && !!optB, `Novel Q${q.id} (${q.category}): Option A & B present`);

    if (q.id === 17) {
      const optD = (parsed?.optionD || parsed?.optionDHi || '').trim();
      assert(!optD.includes('CHAPTER'), `Novel Q17 (Section heading with colon): Section heading stripped from Option D`);
      continue;
    }

    assert(report.questionsPreview.length === 1, `Novel Q${q.id} (${q.category}): Exactly 1 single question parsed (0 phantom splits)`);
  }

  console.log('\n========================================================');
  console.log(`  20 UNSEEN DYNAMIC SYNTHETIC QUESTIONS SUITE: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('========================================================\n');

  if (failCount > 0) process.exit(1);
}

runUnseenDynamicTests().catch(err => {
  console.error('Fatal Unseen Dynamic Test Error:', err);
  process.exit(1);
});
