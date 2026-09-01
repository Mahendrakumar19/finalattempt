import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// Auto-ensure translation_cache & entitlement tables exist in connected MySQL database
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

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS test_series_plans (
        id VARCHAR(36) PRIMARY KEY,
        series_id VARCHAR(100) NOT NULL,
        plan_code ENUM('MINI', 'HALF', 'FULL') NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        sequence_start_number INT NOT NULL DEFAULT 1,
        sequence_end_number INT NOT NULL,
        price INT NOT NULL DEFAULT 0,
        discounted_price INT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_series_plan_code (series_id, plan_code),
        INDEX idx_series (series_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(36) PRIMARY KEY,
        order_number VARCHAR(64) UNIQUE NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        series_id VARCHAR(100) NOT NULL,
        status ENUM('CREATED', 'PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'CREATED',
        currency VARCHAR(10) NOT NULL DEFAULT 'INR',
        gross_amount INT NOT NULL DEFAULT 0,
        upgrade_credit_amount INT NOT NULL DEFAULT 0,
        discount_amount INT NOT NULL DEFAULT 0,
        net_amount INT NOT NULL DEFAULT 0,
        payment_provider VARCHAR(50) NULL,
        gateway_order_id VARCHAR(255) UNIQUE NULL,
        payment_reference_id VARCHAR(255) NULL,
        idempotency_key VARCHAR(255) UNIQUE NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        paid_at DATETIME NULL,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_status (user_id, status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS order_items (
        id VARCHAR(36) PRIMARY KEY,
        order_id VARCHAR(36) NOT NULL,
        item_type ENUM('PACKAGE_PLAN', 'INDIVIDUAL_TEST', 'UPGRADE_PLAN') NOT NULL,
        plan_id VARCHAR(36) NULL,
        quiz_id VARCHAR(100) NULL,
        from_plan_id VARCHAR(36) NULL,
        item_title VARCHAR(255) NOT NULL,
        unit_price INT NOT NULL DEFAULT 0,
        snapshot_sequence_number INT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_order (order_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS user_entitlements (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        series_id VARCHAR(100) NOT NULL,
        entitlement_type ENUM('INDIVIDUAL_TEST', 'MINI', 'HALF', 'FULL', 'LEGACY_ENROLLMENT') NOT NULL,
        quiz_id VARCHAR(100) NULL,
        max_sequence_number INT NULL,
        snapshot_max_sequence INT NULL,
        source_order_id VARCHAR(36) NULL,
        status ENUM('ACTIVE', 'EXPIRED', 'REVOKED', 'SUPERSEDED') NOT NULL DEFAULT 'ACTIVE',
        granted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NULL,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_series_status (user_id, series_id, status),
        INDEX idx_user_quiz_status (user_id, quiz_id, status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    try { await prisma.$executeRawUnsafe(`ALTER TABLE lms_quizzes ADD COLUMN sequence_number INT NULL;`); } catch (_) {}
    try { await prisma.$executeRawUnsafe(`ALTER TABLE lms_quizzes ADD COLUMN is_standalone_purchasable TINYINT(1) DEFAULT 0;`); } catch (_) {}
    try { await prisma.$executeRawUnsafe(`ALTER TABLE lms_quizzes ADD COLUMN individual_price INT DEFAULT 0;`); } catch (_) {}
    try { await prisma.$executeRawUnsafe(`ALTER TABLE lms_quizzes ADD COLUMN test_tier_category VARCHAR(50) DEFAULT 'FULL';`); } catch (_) {}

    console.log('[Prisma] ✅ Entitlement system tables & columns verified in MySQL database.');
  } catch (err: any) {
    console.warn('[Prisma] Warning verifying entitlement tables:', err?.message || err);
  }
})();

