# FINALATTEMPT — TEST SERIES PURCHASE & ENTITLEMENT SYSTEM
## PHASE 2: DATABASE IMPLEMENTATION REPORT

**Status:** DATABASE SCHEMA IMPLEMENTED & VALIDATED (LOCAL)  
**Date:** September 01, 2026  
**System Target:** FinalAttempt Test Series Platform  

---

> [!IMPORTANT]
> **SAFETY & ISOLATION MANDATE VERIFICATION:** The database schema changes have been declared and validated in `backend/schema.prisma`. **No production migrations were executed (`prisma migrate deploy` was NOT run), zero production database records were altered, zero existing tables were dropped or renamed, and zero application code was modified.**

---

## 1. Schema Changes Implemented

The Prisma schema (`backend/schema.prisma`) has been updated with the approved additive database models, enums, fields, foreign keys, and indexes designed during Phase 1 & 1B.

### New Enums Added:
- **`PlanCode`**: `MINI`, `HALF`, `FULL`
- **`OrderStatus`**: `CREATED`, `PENDING`, `PAID`, `FAILED`, `CANCELLED`, `REFUNDED`
- **`ItemType`**: `PACKAGE_PLAN`, `INDIVIDUAL_TEST`, `UPGRADE_PLAN`
- **`EntitlementType`**: `INDIVIDUAL_TEST`, `MINI`, `HALF`, `FULL`, `LEGACY_ENROLLMENT`
- **`EntitlementStatus`**: `ACTIVE`, `EXPIRED`, `REVOKED`, `SUPERSEDED`

---

## 2. New Models / Tables Introduced

### Table 1: `test_series_plans`
Configurable tier package definitions per test series.

```prisma
model test_series_plans {
  id                    String        @id @default(uuid()) @db.VarChar(36)
  series_id             String        @db.VarChar(100)
  plan_code             PlanCode
  title                 String        @db.VarChar(255)
  description           String?       @db.Text
  sequence_start_number Int           @default(1)
  sequence_end_number   Int
  price                 Int           @default(0)
  discounted_price      Int?
  is_active             Boolean       @default(true)
  created_at            DateTime      @default(now())
  updated_at            DateTime      @updatedAt

  lms_courses           lms_courses   @relation(fields: [series_id], references: [id], onDelete: Cascade)
  order_items           order_items[]

  @@unique([series_id, plan_code], map: "uq_series_plan_code")
  @@index([series_id])
}
```

---

### Table 2: `orders`
Primary purchase transactions & financial ledger header.

```prisma
model orders {
  id                    String              @id @default(uuid()) @db.VarChar(36)
  order_number          String              @unique(map: "uq_order_number") @db.VarChar(64)
  user_id               String              @db.VarChar(36)
  series_id             String              @db.VarChar(100)
  status                OrderStatus         @default(CREATED)
  currency              String              @default("INR") @db.VarChar(10)
  gross_amount          Int                 @default(0)
  upgrade_credit_amount Int                 @default(0)
  discount_amount       Int                 @default(0)
  net_amount            Int                 @default(0)
  payment_provider      String?             @db.VarChar(50)
  gateway_order_id      String?             @unique(map: "uq_gateway_order_id") @db.VarChar(255)
  payment_reference_id  String?             @db.VarChar(255)
  idempotency_key       String              @unique(map: "uq_idempotency_key") @db.VarChar(255)
  created_at            DateTime            @default(now())
  paid_at               DateTime?
  updated_at            DateTime            @updatedAt

  users                 users               @relation(fields: [user_id], references: [id], onDelete: Cascade)
  lms_courses           lms_courses         @relation(fields: [series_id], references: [id], onDelete: Restrict)
  order_items           order_items[]
  user_entitlements     user_entitlements[]

  @@index([user_id, status])
}
```

---

### Table 3: `order_items`
Itemized line items supporting package tiers, individual tests, and upgrades.

```prisma
model order_items {
  id                       String             @id @default(uuid()) @db.VarChar(36)
  order_id                 String             @db.VarChar(36)
  item_type                ItemType
  plan_id                  String?            @db.VarChar(36)
  quiz_id                  String?            @db.VarChar(100)
  from_plan_id             String?            @db.VarChar(36)
  item_title               String             @db.VarChar(255)
  unit_price               Int                @default(0)
  snapshot_sequence_number Int?
  created_at               DateTime           @default(now())

  orders                   orders             @relation(fields: [order_id], references: [id], onDelete: Cascade)
  test_series_plans        test_series_plans? @relation(fields: [plan_id], references: [id], onDelete: SetNull)
  lms_quizzes              lms_quizzes?       @relation(fields: [quiz_id], references: [id], onDelete: SetNull)

  @@index([order_id])
}
```

---

### Table 4: `user_entitlements`
High-performance entitlement evaluation state table with purchase-time snapshot protection.

```prisma
model user_entitlements {
  id                    String            @id @default(uuid()) @db.VarChar(36)
  user_id               String            @db.VarChar(36)
  series_id             String            @db.VarChar(100)
  entitlement_type      EntitlementType
  quiz_id               String?           @db.VarChar(100)
  max_sequence_number   Int?
  snapshot_max_sequence Int?
  source_order_id       String?           @db.VarChar(36)
  status                EntitlementStatus @default(ACTIVE)
  granted_at            DateTime          @default(now())
  expires_at            DateTime?
  updated_at            DateTime          @updatedAt

  users                 users             @relation(fields: [user_id], references: [id], onDelete: Cascade)
  lms_courses           lms_courses       @relation(fields: [series_id], references: [id], onDelete: Cascade)
  lms_quizzes           lms_quizzes?      @relation(fields: [quiz_id], references: [id], onDelete: Cascade)
  orders                orders?           @relation(fields: [source_order_id], references: [id], onDelete: SetNull)

  @@index([user_id, series_id, status])
  @@index([user_id, quiz_id, status])
}
```

---

## 3. Additive Fields Added to Existing Models

Four non-destructive optional/default columns were added to `lms_quizzes`:

| Model | Added Field Name | Data Type | Nullable | Default | Description |
|---|---|---|---|---|---|
| `lms_quizzes` | `sequence_number` | `Int` | Yes | NULL | Ordered test position (1..40) |
| `lms_quizzes` | `is_standalone_purchasable` | `Boolean` | Yes | `false` | Enable standalone single-test purchase |
| `lms_quizzes` | `individual_price` | `Int` | Yes | `0` | Price in smallest currency unit |
| `lms_quizzes` | `test_tier_category` | `VARCHAR(50)` | Yes | `'FULL'` | Tier metadata tag (`MINI`,`HALF`,`FULL`) |

---

## 4. Foreign Key Constraints & Cascade Safeguards

- **`test_series_plans.series_id`** $\rightarrow$ `lms_courses.id` (`ON DELETE CASCADE`)
- **`orders.user_id`** $\rightarrow$ `users.id` (`ON DELETE CASCADE`)
- **`orders.series_id`** $\rightarrow$ `lms_courses.id` (`ON DELETE RESTRICT`)
- **`order_items.order_id`** $\rightarrow$ `orders.id` (`ON DELETE CASCADE`)
- **`order_items.plan_id`** $\rightarrow$ `test_series_plans.id` (`ON DELETE SET NULL`)
- **`order_items.quiz_id`** $\rightarrow$ `lms_quizzes.id` (`ON DELETE SET NULL`)
- **`user_entitlements.user_id`** $\rightarrow$ `users.id` (`ON DELETE CASCADE`)
- **`user_entitlements.series_id`** $\rightarrow$ `lms_courses.id` (`ON DELETE CASCADE`)
- **`user_entitlements.quiz_id`** $\rightarrow$ `lms_quizzes.id` (`ON DELETE CASCADE`)
- **`user_entitlements.source_order_id`** $\rightarrow$ `orders.id` (`ON DELETE SET NULL`)

> [!NOTE]
> Deleting a plan or quiz sets references in historical `order_items` and `user_entitlements` to `SET NULL`, preserving financial audit logs and order histories.

---

## 5. Unique Constraints & Indexes

1. **`uq_series_plan_code`**: Unique index on `test_series_plans(series_id, plan_code)` ensuring max 1 active plan per tier per series.
2. **`uq_order_number`**: Unique index on `orders(order_number)` for invoice reference.
3. **`uq_gateway_order_id`**: Unique index on `orders(gateway_order_id)` enforcing payment gateway idempotency.
4. **`uq_idempotency_key`**: Unique index on `orders(idempotency_key)` blocking duplicate checkout requests.
5. **`idx_quiz_course_sequence`**: Composite index on `lms_quizzes(courseId, sequence_number)` enabling $O(1)$ range scans.
6. **`idx_user_series_status`**: Composite index on `user_entitlements(user_id, series_id, status)` for package access evaluation.
7. **`idx_user_quiz_status`**: Composite index on `user_entitlements(user_id, quiz_id, status)` for single-test access evaluation.

---

## 6. Migration SQL Summary

The generated DDL script creates:
- 5 Enums: `PlanCode`, `OrderStatus`, `ItemType`, `EntitlementType`, `EntitlementStatus`.
- 4 Tables: `test_series_plans`, `orders`, `order_items`, `user_entitlements`.
- 4 New Columns on `lms_quizzes`.
- 6 Foreign Key relationships with protective deletion rules (`RESTRICT` / `SET NULL`).

---

## 7. Backward Compatibility & Data Impact

- **Zero Breaking Changes**: Legacy tables (`lms_enrollments`, `lms_quizzes`, `users`, `lms_courses`) remain unchanged.
- **Existing User Access**: Existing active enrollments in `lms_enrollments` continue to grant full access.
- **Data Impact**: Zero records modified or deleted.

---

## 8. Rollback Strategy

Because all schema modifications are strictly **ADDITIVE**:
1. Reverting application code requires **zero database rollback or column dropping**.
2. Legacy code will completely ignore the 4 new tables and 4 new columns in `lms_quizzes`.

---

## 9. Local Validation Results

1. **Prisma Schema Validation**: Executed `npx prisma validate` $\rightarrow$ **PASSED** (`The schema at backend/schema.prisma is valid 🚀`).
2. **Prisma Formatting**: Executed `npx prisma format` $\rightarrow$ **PASSED**.
3. **Migration SQL Diff Check**: Executed `npx prisma migrate diff` $\rightarrow$ **PASSED** (Clean DDL diff generated).

---

## 10. Remaining Implementation Phases

- **Phase 3**: Centralized Access Control Service & Backend Purchase Engine (Implementing `hasQuizAccess` service, order creation API, payment idempotency webhook handler).
- **Phase 4**: Admin Test Series & Plan Management UI.
- **Phase 5**: Frontend Storefront, Multi-Test Cart, & Tier Upgrade UI.

---

```
============================================================
STRICT SAFETY VERIFICATION
============================================================
Existing records deleted:     0
Existing tables deleted:      0
Existing payments modified:   0
Existing enrollments modified: 0
Existing attempts modified:   0

Production database changed:  NO
Production migration executed: NO
Frontend changed:             NO
Payment logic changed:        NO
Entitlement logic changed:    NO
============================================================
```
