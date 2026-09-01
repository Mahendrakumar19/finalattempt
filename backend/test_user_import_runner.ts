import fs from 'fs';
import path from 'path';
import { TXTAdapter } from './services/documentEngine/adapters/TXTAdapter';
import { QnaExtractor } from './services/documentEngine/extraction/QnaExtractor';

async function run() {
  const filePath = path.join(__dirname, 'test_user_import_text.txt');
  const buffer = fs.readFileSync(filePath);
  
  const adapter = new TXTAdapter();
  const doc = await adapter.processBuffer(buffer, { filename: 'test_user_import_text.txt' });

  const qnas = await QnaExtractor.extractQna(doc);
  console.log(`\n====================================================`);
  console.log(`Total Extracted & Aligned Questions: ${qnas.length}`);
  console.log(`====================================================\n`);

  qnas.forEach((q, idx) => {
    const enText = q.question.versions.find(v => v.language === 'en')?.text || q.question.versions[0]?.text || '';
    const hiText = q.question.versions.find(v => v.language === 'hi')?.text || '';
    console.log(`Q${idx + 1} [qNum=${q.questionNumber}]: EN="${enText.substring(0, 45).replace(/\n/g, ' ')}" | HI="${hiText.substring(0, 45).replace(/\n/g, ' ')}" | Opts=${q.options.length}`);
  });
}

run().catch(console.error);
