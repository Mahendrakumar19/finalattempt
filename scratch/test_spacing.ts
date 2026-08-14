import { GoogleTranslationProvider } from './backend/services/translationProvider';

async function testSpacing() {
  const provider = new GoogleTranslationProvider();

  const sampleHtml = `<p>Cultural Diplomacy refers to use of culture as a <strong>strategic instrument</strong> to deepen mutual understanding, <strong>people-to-people ties</strong> and international partnerships.</p>`;

  console.log('Original HTML:\n', sampleHtml);

  const translatedHtml = await provider.translateHtml(sampleHtml, 'en', 'hi');

  console.log('\nTranslated HTML:\n', translatedHtml);
}

testSpacing();
