import { initEnv } from '../bootstrap';
initEnv();

async function testFetch() {
  const { lmsDB } = await import('../db');
  console.log('Waiting 2 seconds for MySQL pool connection...');
  await new Promise(r => setTimeout(r, 2000));

  console.log('Testing getTestSeriesEnrolledStudents for ts-1788523894202...');
  const res = await lmsDB.getTestSeriesEnrolledStudents('ts-1788523894202');
  console.log(`Result count: ${res.length}`);
  console.log('Result data:', JSON.stringify(res, null, 2));
  process.exit(0);
}

testFetch();
