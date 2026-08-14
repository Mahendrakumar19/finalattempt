import { translationProvider } from '../backend/services/translationProvider';
import { ContentLocalizer } from '../backend/services/contentLocalizer';

async function test() {
  console.log('Testing translateText...');
  const textRes = await translationProvider.translateText(
    'India is strengthening its Cultural Diplomacy',
    'en',
    'hi'
  );
  console.log('Text Result:', textRes);

  console.log('\nTesting translateHtml...');
  const htmlRes = await translationProvider.translateHtml(
    '<h2>Initiatives taken to promote Cultural Diplomacy</h2><p>Cultural Diplomacy refers to use of culture as a strategic instrument.</p>',
    'en',
    'hi'
  );
  console.log('HTML Result:', htmlRes);

  console.log('\nTesting ContentLocalizer.resolveLocalizedContent...');
  const res = await ContentLocalizer.resolveLocalizedContent(
    'test_article',
    '123',
    'title',
    'India is strengthening its Cultural Diplomacy',
    'en',
    'hi',
    false
  );
  console.log('ContentLocalizer Result:', res);
}

test().catch(err => console.error('Test error:', err));
