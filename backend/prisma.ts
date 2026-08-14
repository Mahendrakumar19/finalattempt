import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Auto-ensure translation_cache table exists in connected MySQL database
(async () => {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS translation_cache (
        id VARCHAR(255) PRIMARY KEY,
        entityType VARCHAR(100) NOT NULL,
        entityId VARCHAR(255) NOT NULL,
        fieldName VARCHAR(100) NOT NULL,
        sourceLanguage VARCHAR(10) NOT NULL DEFAULT 'en',
        targetLanguage VARCHAR(10) NOT NULL DEFAULT 'hi',
        sourceHash VARCHAR(64) NOT NULL,
        translatedText LONGTEXT NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY entityType_entityId_fieldName_sourceLanguage_targetLanguage (entityType, entityId, fieldName, sourceLanguage, targetLanguage),
        INDEX idx_entity (entityType, entityId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('[Prisma] ✅ translation_cache table verified in MySQL database.');
  } catch (err: any) {
    console.warn('[Prisma] Warning verifying translation_cache table:', err?.message || err);
  }
})();

