import pool from './config/database';

async function checkQuestion() {
  try {
    const res1 = await pool.query(
      `SELECT id, question_text, question_text_hi, options, options_hi FROM lms_questions WHERE question_text LIKE '%चट्टानी%' OR question_text_hi LIKE '%चट्टानी%' LIMIT 5`
    );
    console.log("=== LMS QUESTIONS ===");
    console.log(JSON.stringify(res1.rows, null, 2));

    const res2 = await pool.query(
      `SELECT id, question_text, options FROM test_questions WHERE question_text LIKE '%चट्टानी%' LIMIT 5`
    );
    console.log("=== TEST QUESTIONS ===");
    console.log(JSON.stringify(res2.rows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

checkQuestion();
