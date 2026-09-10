import { initEnv } from '../bootstrap';
initEnv();

import { lmsDB } from '../db';

async function testApi() {
  console.log('Testing lmsDB.getTestSeriesEnrolledStudents directly...');
  const students = await lmsDB.getTestSeriesEnrolledStudents('ts-1788523894202');
  console.log(`Found ${students.length} students:`);
  students.forEach((s, i) => {
    console.log(`[#${i + 1}] ${s.fullName} | ${s.email} | Plan: ${s.planName} | Paid: ₹${s.amountPaid} | Ref: ${s.paymentOrderId}`);
  });
  process.exit(0);
}

testApi();
