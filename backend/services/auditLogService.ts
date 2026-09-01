import { prisma } from '../prisma';
import crypto from 'crypto';

export interface AuditLogData {
  adminId: string;
  action: 'PLAN_PRICE_CHANGE' | 'PLAN_BOUNDARY_CHANGE' | 'PLAN_ACTIVATION_CHANGE' | 'QUIZ_PRICE_CHANGE' | 'STANDALONE_PURCHASABLE_CHANGE';
  entityType: 'PLAN' | 'QUIZ';
  entityId: string;
  seriesId?: string;
  oldValue?: any;
  newValue?: any;
}

export class AuditLogService {
  /**
   * Initialize audit log table in database if not present
   */
  static async ensureTableExists() {
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS \`admin_audit_logs\` (
          \`id\` VARCHAR(36) NOT NULL,
          \`admin_id\` VARCHAR(36) NOT NULL,
          \`action\` VARCHAR(100) NOT NULL,
          \`entity_type\` VARCHAR(50) NOT NULL,
          \`entity_id\` VARCHAR(100) NOT NULL,
          \`series_id\` VARCHAR(100) NULL,
          \`old_value\` TEXT NULL,
          \`new_value\` TEXT NULL,
          \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          PRIMARY KEY (\`id\`),
          INDEX \`admin_audit_logs_admin_id_idx\` (\`admin_id\`),
          INDEX \`admin_audit_logs_series_id_idx\` (\`series_id\`),
          INDEX \`admin_audit_logs_action_idx\` (\`action\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
    } catch (e) {
      console.warn('[AuditLogService] Table check notice:', e);
    }
  }

  /**
   * Sanitize payload to strip any sensitive attributes (passwords, secrets, keys, PII)
   */
  private static sanitize(value: any): string | null {
    if (value === undefined || value === null) return null;
    if (typeof value !== 'object') return String(value);

    const safeObj = { ...value };
    const sensitiveKeys = ['password', 'passwordHash', 'secret', 'key', 'signature', 'token', 'auth'];
    
    for (const k of Object.keys(safeObj)) {
      if (sensitiveKeys.some(sk => k.toLowerCase().includes(sk))) {
        delete safeObj[k];
      }
    }

    return JSON.stringify(safeObj);
  }

  /**
   * Persist a commercial audit log record safely
   */
  static async log(data: AuditLogData, tx?: any): Promise<void> {
    await this.ensureTableExists();

    const id = `audit_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const oldStr = this.sanitize(data.oldValue);
    const newStr = this.sanitize(data.newValue);

    const executor = tx || prisma;

    try {
      await executor.$executeRawUnsafe(
        `INSERT INTO \`admin_audit_logs\` 
         (\`id\`, \`admin_id\`, \`action\`, \`entity_type\`, \`entity_id\`, \`series_id\`, \`old_value\`, \`new_value\`, \`created_at\`) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(3))`,
        id,
        data.adminId,
        data.action,
        data.entityType,
        data.entityId,
        data.seriesId || null,
        oldStr,
        newStr
      );
      console.log(`[COMMERCIAL AUDIT LOG PERSISTED] ID=${id} Action=${data.action} Admin=${data.adminId} Series=${data.seriesId}`);
    } catch (err) {
      console.error('[AuditLogService] Failed to persist commercial audit log:', err);
      throw new Error(`Commercial configuration update aborted because audit log persistence failed: ${err}`);
    }
  }
}
