import { BilingualPdfParser } from '../services/bilingualPdfParser';

const testInputText = `
SECTION 1: ENGLISH QUESTIONS
Q1. Which of the following is not a feature of the Government of India Act, 1935? 70th BPSC
(a) Evaluation of the 1935 Act
(b) Union of India proposal
(c) Reconstitution of the Governor General's Executive Council
(d) Provincial autonomy

Q2. On which date was the Indian National Flag adopted by the Constituent Assembly? 70th BPSC
(a) January 26, 1950
(b) July 22, 1947
(c) November 26, 1950
(d) January 24, 1950

Q3. How long did it take to make the Indian Constitution? 68th BPSC
(a) 2 years 11 months and 18 days
(b) 1 year 10 months and 12 days
(c) 2 years 10 months and 5 days
(d) More than one of the above
(e) None of the above

Q4. When did the Constituent Assembly first meet? 66th BPSC
(a) 9 December 1946
(b) August 15 1947
(c) 26 November 1949
(d) 26 January 1946
(e) None of the above / More than one of the above

Q5. Indian Constitution Day is celebrated on? 60-62nd BPSC
(a) 26 October
(b) 26 November
(c) 26 January
(d) August 15
(e) None of the above / More than one of the above

SECTION 2: HINDI QUESTIONS
Q1. निम्नलिखित में से कौन भारत सरकार अधिनियम,1935 की एक विशेषताओं में नहीं है? 70th BPSC
(a) 1935 के अधिनियम का मूल्यांकन
(b) भारत के संघ का प्रस्ताव
(c) गवर्नर जनरल के कार्यकारिणी परिषद का पुनर्गठन
(d) प्रान्तीय स्वायत्तता

Q2. संविधान सभा द्वारा भारतीय राष्ट्रीय ध्वज किस तिथि को अपनाया गया? 70th BPSC
(a) 26 जनवरी, 1950
(b) 22 जुलाई, 1947
(c) 26 नवम्बर, 1950
(d) 24 जनवरी, 1950

Q3. भारतीय संविधान को बनाने में कितना समय लगा? 68th BPSC
(a) 2 वर्ष 11माह और 18 दिन
(b) 1 वर्ष 10माह और 12 दिन
(c) 2 वर्ष 10माह और 5 दिन
(d) उपर्युक्त में से एक से अधिक
(e) उपर्युक्त में से कोई भी नहीं

Q4. संविधान सभा की प्रथम बैठक कब हुई? 66th BPSC
(a) 9 दिसंबर 1946
(b) 15 अगस्त 1947
(c) 26 नवंबर 1949
(d) 26 जनवरी 1946
(e) उपर्युक्त में से कोई नहीं / उपर्युक्त में से एक से अधिक

Q5. भारतीय संविधान दिवस मनाया जाता है? 60-62nd BPSC
(a) 26 अक्टूबर
(b) 26 नवंबर
(c) 26 जनवरी
(d) 15 अगस्त
(e) उपर्युक्त में से कोई नहीं / उपर्युक्त में से एक से अधिक

SECTION 3: ENGLISH ANSWERS & EXPLANATIONS
Q1. A
The Government of India Act, 1935 provided for provincial autonomy.

Q2. B
The Constituent Assembly officially adopted the National Flag of India on July 22, 1947.

Q3. A
The Constituent Assembly took 2 years, 11 months, and 18 days.

Q4. A
The first official meeting took place on December 9, 1946.

Q5. B
Constitution Day is observed annually on November 26.

SECTION 4: HINDI ANSWERS & EXPLANATIONS
Q1. A
भारत सरकार अधिनियम, 1935 में प्रान्तीय स्वायत्तता के प्रावधान थे।

Q2. B
22 जुलाई 1947 को संविधान सभा ने भारतीय राष्ट्रीय ध्वज को अपनाया था।

Q3. A
भारतीय संविधान के निर्माण में कुल 2 वर्ष, 11 माह और 18 दिन का समय लगा था।

Q4. A
संविधान सभा की प्रथम बैठक 9 दिसंबर 1946 को आयोजित की गई थी।

Q5. B
26 नवंबर 1949 को संविधान अपनाए जाने के उपलक्ष्य में संविधान दिवस मनाया जाता है।
`;

async function testImport() {
  const result = BilingualPdfParser.parseText(testInputText);
  console.log('Parsed total questions:', result.questionsPreview.length);
  console.log('Sample Q3 (5-option check):', result.questionsPreview[2]);
  console.log('Sample Q4 (5-option check):', result.questionsPreview[3]);
  if (result.questionsPreview.length === 5 && result.questionsPreview[2].optionE) {
    console.log('✅ Option E 5-Option parsing SUCCESS!');
  } else {
    console.error('❌ Option E parsing failed!');
  }
}

testImport();
