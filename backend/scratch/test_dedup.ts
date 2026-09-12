import { lmsDB } from '../db';

async function main() {
  const students = await lmsDB.getTestSeriesEnrolledStudents('ts-1788523894202');
  console.log(`TOTAL ENROLLED STUDENTS COUNT: ${students.length}`);
  console.log('STUDENTS LIST:');
  students.forEach((s, idx) => {
    console.log(`${idx + 1}. ${s.fullName} (${s.email}) | Plan: ${s.planName} | Payment: ${s.paymentOrderId} | Amount: ₹${s.amountPaid}`);
  });
}

main().catch(console.error).finally(() => process.exit(0));
