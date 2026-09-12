const mysql = require('mysql2/promise');

async function checkQuizAttempt() {
  const conn = await mysql.createConnection({
    host: '194.59.164.75',
    user: 'u963801592_finalA_user',
    password: 'Final@202606',
    database: 'u963801592_finalAttemptDB',
    port: 3306
  });

  const quizId = 'quiz-1788534091106';

  const [attempts] = await conn.query(
    'SELECT a.id, a.userId, u.email, u.fullName, a.quizId, a.status, a.submittedAt FROM lms_quiz_attempts a JOIN users u ON u.id = a.userId WHERE a.quizId = ?',
    [quizId]
  );

  console.log(`--- ATTEMPTS FOR QUIZ: ${quizId} ---`);
  console.log(attempts);

  await conn.end();
}

checkQuizAttempt();
