import { BilingualPdfParser } from './services/bilingualPdfParser';

console.log('========================================================');
console.log('   ADVERSARIAL OPTION PRESERVATION TEST SUITE          ');
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

async function runAdversarialPreservationTests() {
  const ADVERSARIAL_CASES = [
    {
      id: 1,
      name: 'Kaali Mitti (Black Soil) as Option choice',
      text: `901. किस मिट्टी को रेगुर मिट्टी भी कहा जाता है?\n(a) जलोढ़ मिट्टी (b) लाल मिट्टी (c) काली मिट्टी (d) लैटराइट मिट्टी`,
      expectedOptC: 'काली मिट्टी'
    },
    {
      id: 2,
      name: 'Bharat (India) as Option choice',
      text: `902. क्षेत्रफल की दृष्टि से विश्व का सातवां सबसे बड़ा देश कौन-सा है?\n(a) चीन (b) रूस (c) भारत (d) ब्राजील`,
      expectedOptC: 'भारत'
    },
    {
      id: 3,
      name: 'Bihar & Uttar Pradesh as Option choices',
      text: `903. वाल्मीकि राष्ट्रीय उद्यान किस राज्य में स्थित है?\n(a) बिहार (b) उत्तर प्रदेश (c) मध्य प्रदेश (d) झारखंड`,
      expectedOptA: 'बिहार',
      expectedOptB: 'उत्तर प्रदेश'
    },
    {
      id: 4,
      name: 'Aravali & Himalaya as Option choices',
      text: `904. भारत की सबसे प्राचीन पर्वत श्रृंखला कौन-सी है?\n(a) अरावली (b) हिमालय (c) सतपुड़ा (d) विंध्याचल`,
      expectedOptA: 'अरावली',
      expectedOptB: 'हिमालय'
    },
    {
      id: 5,
      name: 'Bharat Ka Samvidhan & Samvidhan Sabha',
      text: `905. भारत में सर्वोच्च कानून कौन-सा है?\n(a) भारत का संविधान (b) संविधान सभा (c) संसद अधिनियम (d) सुप्रीम कोर्ट निर्णय`,
      expectedOptA: 'भारत का संविधान',
      expectedOptB: 'संविधान सभा'
    },
    {
      id: 6,
      name: 'Lok Sabha & Rajya Sabha',
      text: `906. धन विधेयक सर्वप्रथम किस सदन में पेश किया जाता है?\n(a) लोकसभा (b) राज्यसभा (c) विधान परिषद (d) कैबिनेट`,
      expectedOptA: 'लोकसभा',
      expectedOptB: 'राज्यसभा'
    },
    {
      id: 7,
      name: 'Paris, London, Newton',
      text: `907. Foreign Capital & Scientist choices:\n(a) Paris (b) London (c) Newton (d) Einstein`,
      expectedOptA: 'Paris',
      expectedOptB: 'London',
      expectedOptC: 'Newton'
    },
    {
      id: 8,
      name: 'Arbitrary Real-Looking Section Headings with New Words',
      text: `908. Which particle carries positive charge?\n(a) Electron (b) Proton (c) Neutron (d) Photon\nCHAPTER 99: NOVEL COSMOLOGY ANALYSIS`,
      expectedOptD: 'Photon',
      hasHeadingToStrip: true
    }
  ];

  console.log(`--- AUDITING ${ADVERSARIAL_CASES.length} ADVERSARIAL OPTION PRESERVATION CASES ---`);

  for (const c of ADVERSARIAL_CASES) {
    const report = await BilingualPdfParser.parseTextAsync(c.text);
    const parsed = report.questionsPreview[0];

    assert(!!parsed, `Adversarial Q${c.id} (${c.name}): Parsed into Preview DTO cleanly`);

    if (c.expectedOptA) {
      const optA = (parsed?.optionA || parsed?.optionAHi || '').trim();
      assert(optA === c.expectedOptA, `Adversarial Q${c.id} (${c.name}): Option A is exactly "${c.expectedOptA}"`);
    }

    if (c.expectedOptB) {
      const optB = (parsed?.optionB || parsed?.optionBHi || '').trim();
      assert(optB === c.expectedOptB, `Adversarial Q${c.id} (${c.name}): Option B is exactly "${c.expectedOptB}"`);
    }

    if (c.expectedOptC) {
      const optC = (parsed?.optionC || parsed?.optionCHi || '').trim();
      assert(optC === c.expectedOptC, `Adversarial Q${c.id} (${c.name}): Option C is exactly "${c.expectedOptC}"`);
    }

    if (c.expectedOptD) {
      const optD = (parsed?.optionD || parsed?.optionDHi || '').trim();
      assert(optD === c.expectedOptD, `Adversarial Q${c.id} (${c.name}): Option D is exactly "${c.expectedOptD}"`);
    }

    if (c.hasHeadingToStrip) {
      const optD = (parsed?.optionD || parsed?.optionDHi || '').trim();
      assert(!optD.includes('CHAPTER 99'), `Adversarial Q${c.id} (${c.name}): Section heading "CHAPTER 99:" stripped from Option D`);
    }
  }

  console.log('\n========================================================');
  console.log(`  ADVERSARIAL OPTION PRESERVATION SUITE: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('========================================================\n');

  if (failCount > 0) process.exit(1);
}

runAdversarialPreservationTests().catch(err => {
  console.error('Fatal Adversarial Preservation Test Error:', err);
  process.exit(1);
});
