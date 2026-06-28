import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || '3306')
};

async function seedUsers() {
  if (!dbConfig.host || !dbConfig.user || !dbConfig.database) {
    console.error('No database configuration found in environment.');
    process.exit(1);
  }

  const connection = await mysql.createConnection(dbConfig);
  console.log('Connected to MySQL database for seeding users...');

  // Password hashes (default password: "Password123" for all seeded users)
  const passwordHash = await bcrypt.hash('Password123', 12);

  const users = [
    {
      id: uuidv4(),
      fullName: 'Aarav Kumar',
      email: 'student@finalattempt.com',
      mobile: '9876543210',
      role: 'student',
      targetExam: 'BPSC Foundation Batch',
      isEmailVerified: 1,
      isActive: 1
    },
    {
      id: uuidv4(),
      fullName: 'Dr. Anand Kumar',
      email: 'faculty@finalattempt.com',
      mobile: '9876543211',
      role: 'faculty',
      targetExam: '',
      isEmailVerified: 1,
      isActive: 1
    },
    {
      id: uuidv4(),
      fullName: 'Admin Director',
      email: 'admin@finalattempt.com',
      mobile: '9876543212',
      role: 'admin',
      targetExam: '',
      isEmailVerified: 1,
      isActive: 1
    }
  ];

  for (const u of users) {
    try {
      // Check if email already exists
      const [rows]: any = await connection.query('SELECT id FROM users WHERE email = ? LIMIT 1', [u.email]);
      if (rows && rows.length > 0) {
        console.log(`User ${u.email} already exists. Skipping.`);
        continue;
      }

      await connection.query(
        `INSERT INTO users (id, fullName, email, mobile, passwordHash, role, targetExam, isEmailVerified, isActive)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [u.id, u.fullName, u.email, u.mobile, passwordHash, u.role, u.targetExam, u.isEmailVerified, u.isActive]
      );
      console.log(`Seeded user: ${u.fullName} (${u.role})`);

      // Auto-enroll student Aarav in courses
      if (u.role === 'student') {
        const [courseRows]: any = await connection.query('SELECT id FROM lms_courses LIMIT 3');
        for (const course of courseRows) {
          const enrollmentId = uuidv4();
          await connection.query(
            `INSERT INTO lms_enrollments (id, userId, courseId, paymentOrderId, paymentStatus, amountPaid)
             VALUES (?, ?, ?, 'seeding_order_123', 'paid', 500000)
             ON DUPLICATE KEY UPDATE paymentStatus='paid'`,
            [enrollmentId, u.id, course.id]
          );
          console.log(`Enrolled student Aarav in course: ${course.id}`);
        }
      }
    } catch (err) {
      console.error(`Failed to seed user ${u.email}:`, err);
    }
  }

  await connection.end();
  console.log('Seeding finished.');
}

seedUsers().catch(console.error);
