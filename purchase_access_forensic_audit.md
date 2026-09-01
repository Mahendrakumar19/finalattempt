# READ-ONLY FORENSIC AUDIT: TEST SERIES PURCHASE & ACCESS MODEL

**Document Version**: 1.0.0  
**Audit Type**: Forensic Read-Only Technical & Architecture Audit  
**Target Architecture**: Cumulative Tiers (Mini = 16 Qs/Tests, Half = 28 Qs/Tests, Full = 40 Qs/Tests) + Individual Test Purchases + Upgrade Safety  
**Audit Execution Date**: 2026-09-01  

---

## 1. EXECUTIVE SUMMARY

This forensic audit evaluates the **FinalAttempt LMS Platform**'s existing database schema, payment routes, access enforcement middleware, admin management interfaces, and student purchase flows against a proposed multi-tier, cumulative entitlement model. 

### Key Findings
1. **Binary All-or-Nothing Access Model**: Currently, test series entitlement is strictly binary (`isEnrolled(userId, courseId)`). A single row in `lms_enrollments` grants access to **all** tests attached to a `courseId` or `testSeriesId`. The system currently has **no concept** of access tiers (`MINI`, `HALF`, `FULL`), test indexing/order bounds, or individual test entitlements.
2. **Missing Granular Pricing & Test Classification**: Pricing exists only as a single flat integer (`price`, `discountedPrice`) on `TestSeries` or `lms_courses`. Individual tests (`lms_quizzes`) have no price column, no individual purchase endpoints, and no category/tier tag (`MINI`, `HALF_LENGTH`, `FULL_LENGTH`).
3. **No Line-Item Order Engine**: Payments create an order directly for a whole `courseId` or `testSeriesId`. There is no `Order` / `OrderItem` schema to support multi-test cart bundles, differential upgrade pricing, or granular line-item tracking.
4. **Feasibility of Target Model**: The system can be safely transitioned to the cumulative tier and individual test access model by introducing an **Entitlement Engine** (`user_entitlements`) and an **Order Line-Item Engine** (`orders` / `order_items`) without breaking existing user enrollments or past attempt histories.

---

## 2. CURRENT ARCHITECTURE

The application is built on a Next.js (App Router) frontend and a Node.js / Express backend with a dual persistence architecture (MySQL via Prisma & mysql2 with a local JSON store fallback `database_store.json`).

```
                              ┌──────────────────────────────┐
                              │     Student / Admin UX       │
                              └──────────────┬───────────────┘
                                             │
                                   REST APIs (JWT Auth)
                                             │
                              ┌──────────────▼───────────────┐
                              │     Express API Gateway      │
                              └──────────────┬───────────────┘
                                             │
                 ┌───────────────────────────┼───────────────────────────┐
                 │                           │                           │
      ┌──────────▼──────────┐     ┌──────────▼──────────┐     ┌──────────▼──────────┐
      │ /api/payments/*     │     │ /api/quizzes/*      │     │ /api/lms/*          │
      │ Order Creation &    │     │ Quiz Attempts &     │     │ Enrollment Checks & │
      │ Razorpay Signature  │     │ Paywall Guards      │     │ Test Series Admin   │
      └──────────┬──────────┘     └──────────┬──────────┘     └──────────┬──────────┘
                 │                           │                           │
                 └───────────────────────────┼───────────────────────────┘
                                             │
                              ┌──────────────▼───────────────┐
                              │   lmsDB (MySQL / JSON DB)    │
                              │   - isEnrolled(userId, cid)  │
                              └──────────────────────────────┘
```

---

## 3. CURRENT DATABASE MODEL

### Prisma Models Audited ([schema.prisma](file:///d:/FinalAttempt/backend/schema.prisma))

1. **`TestSeries` Model**
   - **Primary Key**: `id` (`UUID`)
   - **Fields**: `examId`, `stageId`, `title`, `slug` (unique), `category`, `language`, `status`, `price`, `discountedPrice`, `totalTests`, `totalQuestions`, `duration`, `description`, `highlights` (`Json`), `syllabus` (`Json`), `faq` (`Json`), `batchStartDate`, `enrolledCount`, `validityDays`, `isPublished`, `displayOrder`.
   - **Gaps**: No package tier definitions, no per-test pricing, no cumulative access rules.

2. **`lms_quizzes` / `lms_questions` Model**
   - **Primary Key**: `id` (`VARCHAR(100)`)
   - **Foreign Keys**: `courseId` (`VARCHAR(100)` -> links to `lms_courses.id` or `TestSeries.id`), `lessonId`
   - **Fields**: `title`, `description`, `timeLimitMins`, `passingScore`, `isPublished`, `isFree`, `isFirstTestFree`.
   - **Gaps**: No `orderIndex` / sequence number on `lms_quizzes` (only on `lms_questions`), no `testTier` column (`MINI` | `HALF` | `FULL`), no individual price field (`price`).

3. **`lms_enrollments` Model**
   - **Primary Key**: `id` (`VARCHAR(36)`)
   - **Unique Constraint**: `@@unique([userId, courseId])`
   - **Fields**: `userId`, `courseId`, `paymentOrderId`, `paymentStatus` (`pending` | `paid` | `free`), `amountPaid`, `enrolledAt`.
   - **Gaps**: Binary access only. Contains no tier metadata, no individual test entitlement IDs, no expiration tracking.

4. **`lms_quiz_attempts` Model**
   - **Primary Key**: `id` (`VARCHAR(36)`)
   - **Indexes**: `idx_attempt_user` (`userId`), `idx_attempt_quiz` (`quizId`)
   - **Fields**: `userId`, `quizId`, `answers` (`JSON`), `score`, `maxScore`, `passed`, `timeTakenSecs`, `setCode`, `seed`, `status`, `startedAt`, `expiresAt`, `submittedAt`.

---

## 4. CURRENT PURCHASE FLOW

The existing purchase flow handles only whole-course or whole-test-series enrollments:

```
Student UI (EnrollmentCard.tsx / TestSeriesDetailPage)
  │
  ├─► 1. POST /api/payments/create-order
  │     └─ Payload: { courseId: "ts-123" }
  │     └─ Backend looks up TestSeries price, calls Razorpay orders.create({ amount: price * 100 })
  │     └─ Returns { order_id: "order_ts_99812", amount, key }
  │
  ├─► 2. Razorpay Modal Opens in Browser
  │     └─ Student enters payment details & completes transaction
  │
  └─► 3. POST /api/payments/verify
        └─ Payload: { razorpayOrderId, razorpayPaymentId, razorpaySignature, courseId }
        └─ Backend verifies HMAC-SHA256 signature
        └─ Checks `lmsDB.isEnrolled(userId, courseId)`
        └─ If not enrolled: executes `lmsDB.createEnrollment(userId, courseId, orderId, amount)`
        └─ Returns `{ success: true, message: "Payment verified and enrollment successful." }`
```

---

## 5. CURRENT PAYMENT FLOW

### Webhook & Idempotency Audit ([payments.ts](file:///d:/FinalAttempt/backend/routes/payments.ts))
- **Gateway**: Razorpay Standard Checkout (`checkout.js`).
- **Signature Verification**: Verified server-side in `POST /api/payments/verify` using HMAC-SHA256 signature calculated from `razorpayOrderId + '|' + razorpayPaymentId` against `RAZORPAY_KEY_SECRET`.
- **Idempotency**: `POST /api/payments/verify` executes `lmsDB.isEnrolled(userId, courseId)`. If a record already exists, it returns `{ success: true, message: 'Already enrolled in this program.' }` without throwing error or duplicating database records.
- **Payment Metadata Gaps**: Razorpay order notes currently do not encode `packageType`, `selectedQuizIds`, or `upgradeFromOrderId`.

---

## 6. CURRENT ACCESS-CHECK FLOW

Access verification is enforced in `POST /api/quizzes/:quizId/start` and `POST /api/quizzes/:quizId/submit` ([quizzes.ts:L761-775](file:///d:/FinalAttempt/backend/routes/quizzes.ts#L761-L775)):

```
Student Clicks "Attempt Test"
  │
  ▼
GET /api/quizzes/:quizId/start
  │
  ├─► Check 1: Is user admin/faculty? ──► ALLOW
  │
  ├─► Check 2: Is `quiz.isFree` === true? ──► ALLOW
  │
  └─► Check 3: Check Paywall:
        targetCourseId = quiz.courseId
        isEnrolled = await lmsDB.isEnrolled(userId, targetCourseId)
        │
        ├─► isEnrolled === true ──► ALLOW & generate PRNG seed + questions
        └─► isEnrolled === false ──► DENY (403 Forbidden - Code: QUIZ_003)
```

### Critical Security Observation
- The paywall check relies **entirely** on whether `userId` has an entry in `lms_enrollments` for `quiz.courseId`.
- If a user is enrolled in `courseId`, they gain access to **every single quiz** where `quiz.courseId` matches that test series ID.

---

## 7. CURRENT TEST-SERIES → TEST RELATIONSHIP

- **Association**: Quizzes belong to a test series via `lms_quizzes.courseId = TestSeries.id`.
- **Ordering**: Quizzes inside a series currently rely on insertion order or `createdAt`. There is **no explicit `sequenceNumber` or `testOrder` column** on `lms_quizzes`.
- **Test Classification**: No classification exists on `lms_quizzes` (e.g., whether a test is test #1, #16, #28, or #40).
- **Multi-Series Membership**: A quiz can currently only belong to a single `courseId`.

---

## 8. CURRENT PRICING MODEL

- **Storage Location**: Stored on `TestSeries` (`price: Int`, `discountedPrice: Int?`) and `lms_courses` (`fee`, `discountedFee`).
- **Granularity**: Flat pricing per entire series.
- **Missing Capabilities**:
  - No Individual Test Price (`quiz.price`).
  - No Package Pricing (`miniPrice`, `halfPrice`, `fullPrice`).
  - No Upgrade Differential Pricing.
  - No Cart / Multi-Test Bundle Pricing calculations.

---

## 9. CURRENT ADMIN CAPABILITIES

- **Admin UI** ([TestSeriesAdmin.tsx](file:///d:/FinalAttempt/frontend/src/components/admin/TestSeriesAdmin.tsx)): Admins can create/edit Test Series metadata (title, exam, price, validity), upload/import PDF & Excel question banks, edit questions/answers, and delete tests.
- **Gaps**: Admin UI currently has no inputs to:
  - Configure package tier pricing (`Mini`, `Half`, `Full`).
  - Set sequence order numbers (`testSequenceNumber`) for quizzes.
  - Define individual test prices.
  - View or manage student individual entitlements.

---

## 10. CURRENT STUDENT UX

- **Listing & Details** ([program/[slug]/page.tsx](file:///d:/FinalAttempt/frontend/src/app/test-series/program/%5Bslug%5D/page.tsx)): Displays overall series title, banner, price, and total test count.
- **Unenrolled View**: Displays a prompt `Enrollment Required to Access CBT Mock Papers` with a single `Enroll Now` button that opens a full series checkout form.
- **Enrolled View**: Unlocks all tests attached to the series.
- **Missing Controls**: No individual `[ Buy This Test ]` buttons, no multi-test checkboxes, no `[ Mini Series ]` / `[ Half Series ]` tier selection cards.

---

## 11. EXISTING USER / DATA SAFETY ANALYSIS

- **Data Audit Counts**:
  - `lms_quizzes`: 7 active quizzes.
  - `lms_questions`: 109 questions.
  - `lms_enrollments`: 1 active enrollment.
  - `users`: 3 active user accounts.
- **Safety Guarantee**: Existing users who purchased a Test Series have records in `lms_enrollments`. In the target model, existing enrollments can be automatically mapped to a `FULL` / `COMPLETE_SERIES` entitlement, ensuring zero disruption to past purchasers or active test attempts.

---

## 12. SECURITY FINDINGS

1. **Server-Side Enforcement**: Paywall checks are enforced on the backend (`quizzes.ts:L768`). Frontend unlock state cannot bypass backend 403 responses.
2. **Current Vulnerability**: Since backend checks `isEnrolled(userId, quiz.courseId)`, any active enrollment unlocks all quizzes. Without backend tier checking, a user with a Mini subscription could attempt test #40 if the backend is not updated to check entitlement boundaries.
3. **Price Manipulation Guard**: Backend currently re-verifies price from `lmsDB.getTestSeriesById` or `lmsDB.getCourseById` during order creation, preventing client-side amount tampering.

---

## 13. PERFORMANCE FINDINGS

1. **Query Pattern**: `lmsDB.isEnrolled` executes `SELECT id FROM lms_enrollments WHERE userId = ? AND courseId = ? LIMIT 1`. This query is indexed by `unique_enrollment (userId, courseId)` and runs in `<1ms`.
2. **Future Indexing**: Introducing `user_entitlements` will require indexes on `(userId, testSeriesId, entitlementType)` and `(userId, quizId)` to prevent `N+1` queries when rendering the student test list.

---

## 14. EDGE CASE FINDINGS

| Edge Case | Current Behavior | Required Target Behavior |
| :--- | :--- | :--- |
| **A. User buys same test twice** | N/A (Individual test purchase not supported) | Prevent duplicate order; auto-unlock if entitlement exists. |
| **B. User buys Mini, then upgrades to Half** | Entire series repurchased at full price | Charge only upgrade differential; unlock tests 17–28. |
| **C. User owns individual tests 3 & 7, buys Full** | Full series repurchased at full price | Grant FULL entitlement covering all 40 tests; preserve history. |
| **D. Payment succeeds, DB write fails** | Razorpay verified, but enrollment write fails | Implement Webhook listener & idempotent retry worker. |
| **E. Webhook arrives twice** | `isEnrolled` returns `Already enrolled` cleanly | Retain idempotency guard in `user_entitlements`. |

---

## 15. GAP ANALYSIS

```
                                  GAP ANALYSIS SUMMARY
 ┌──────────────────────────────────────┬──────────────────────────────────────┐
 │          CURRENT CAPABILITY          │          REQUIRED TARGET MODEL       │
 ├──────────────────────────────────────┼──────────────────────────────────────┤
 │ Binary enrollment (All-or-Nothing)   │ Multi-tier (Mini 16, Half 28, Full) │
 │ Single flat series price             │ Tier & Individual Test pricing       │
 │ CourseId-to-Quiz 1:N mapping         │ Sequence-ordered Quiz membership     │
 │ Direct enrollment write on verify    │ Order -> OrderItems -> Entitlements  │
 │ Whole series checkout modal          │ Multi-test selection & cart checkout │
 └──────────────────────────────────────┴──────────────────────────────────────┘
```

---

## 16. TARGET ARCHITECTURE RECOMMENDATION

We recommend implementing a **Declarative Entitlement Engine** backed by Order Line-Items:

```
                                 ┌──────────────┐
                                 │    users     │
                                 └──────┬───────┘
                                        │
                         ┌──────────────┴──────────────┐
                         │      user_entitlements      │
                         └──────────────┬──────────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           │                            │                            │
 ┌─────────▼──────────┐       ┌─────────▼──────────┐       ┌─────────▼──────────┐
 │  COMPLETE_SERIES   │       │   PACKAGE_TIER     │       │  INDIVIDUAL_QUIZ   │
 │  (All 40 Tests)    │       │ (MINI/HALF/FULL)   │       │  (Specific Quiz)   │
 └────────────────────┘       └────────────────────┘       └────────────────────┘
```

### Effective Access Function Logic
For a given `userId` and `quizId` (which belongs to `testSeriesId` at `testSequenceNumber`):

$$\text{Access Granted} \iff \begin{cases} 
\text{quiz.isFree} = \text{true} \\
\text{OR } \exists \text{ Entitlement}(\text{userId}, \text{COMPLETE\_SERIES}, \text{testSeriesId}) \\
\text{OR } \exists \text{ Entitlement}(\text{userId}, \text{FULL}, \text{testSeriesId}) \\
\text{OR } \exists \text{ Entitlement}(\text{userId}, \text{HALF}, \text{testSeriesId}) \text{ AND } \text{sequenceNumber} \le 28 \\
\text{OR } \exists \text{ Entitlement}(\text{userId}, \text{MINI}, \text{testSeriesId}) \text{ AND } \text{sequenceNumber} \le 16 \\
\text{OR } \exists \text{ Entitlement}(\text{userId}, \text{INDIVIDUAL\_QUIZ}, \text{quizId})
\end{cases}$$

---

## 17. REQUIRED DATABASE CHANGES (Conceptual Only)

### New Tables Proposed

#### 1. `test_series_packages`
```sql
CREATE TABLE test_series_packages (
  id VARCHAR(36) PRIMARY KEY,
  testSeriesId VARCHAR(36) NOT NULL,
  tierType ENUM('MINI', 'HALF', 'FULL') NOT NULL,
  title VARCHAR(255) NOT NULL,
  maxSequenceNumber INT NOT NULL, -- 16 for MINI, 28 for HALF, 40 for FULL
  price INT NOT NULL,
  discountedPrice INT,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (testSeriesId) REFERENCES TestSeries(id) ON DELETE CASCADE
);
```

#### 2. `user_entitlements`
```sql
CREATE TABLE user_entitlements (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  testSeriesId VARCHAR(36),
  quizId VARCHAR(36),
  entitlementType ENUM('COMPLETE_SERIES', 'MINI', 'HALF', 'FULL', 'INDIVIDUAL_QUIZ') NOT NULL,
  maxSequenceNumber INT, -- Null for INDIVIDUAL_QUIZ
  grantedViaOrderId VARCHAR(255),
  expiresAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_quiz (userId, quizId),
  INDEX idx_user_series (userId, testSeriesId)
);
```

#### 3. `orders` & `order_items`
```sql
CREATE TABLE orders (
  id VARCHAR(36) PRIMARY KEY,
  orderNumber VARCHAR(100) UNIQUE NOT NULL,
  userId VARCHAR(36) NOT NULL,
  totalAmount INT NOT NULL,
  discountAmount INT DEFAULT 0,
  payableAmount INT NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
  razorpayOrderId VARCHAR(255),
  razorpayPaymentId VARCHAR(255),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
  id VARCHAR(36) PRIMARY KEY,
  orderId VARCHAR(36) NOT NULL,
  itemType ENUM('PACKAGE', 'INDIVIDUAL_QUIZ', 'COURSE') NOT NULL,
  testSeriesId VARCHAR(36),
  packageId VARCHAR(36),
  quizId VARCHAR(36),
  unitPrice INT NOT NULL,
  discountAmount INT DEFAULT 0,
  finalPrice INT NOT NULL,
  FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
);
```

---

## 18. REQUIRED BACKEND CHANGES (Conceptual Only)

1. **Entitlement Service (`services/entitlementService.ts`)**:
   - `hasQuizAccess(userId, quizId)`: Executes the effective access function logic.
   - `grantEntitlementsFromOrder(orderId)`: Idempotently writes rows to `user_entitlements`.
2. **Pricing & Cart Calculator (`services/pricingService.ts`)**:
   - Computes cart totals and applies upgrade credit if user owns existing tests or lower tier.
3. **Updated Paywall Middleware ([quizzes.ts](file:///d:/FinalAttempt/backend/routes/quizzes.ts))**:
   - Replaces `lmsDB.isEnrolled(userId, courseId)` with `entitlementService.hasQuizAccess(userId, quizId)`.

---

## 19. REQUIRED FRONTEND CHANGES (Conceptual Only)

1. **Interactive Test List Item Component**:
   - Shows badge: `[ Unlocked ]`, `[ Lock - Buy Individual ₹99 ]`, `[ Lock - Upgrade to Mini ]`.
2. **Multi-Test Cart Drawer**:
   - Allows checking multiple tests and purchasing them in a single Razorpay order.
3. **Package Tier Selection Cards**:
   - Shows Mini (1-16), Half (1-28), Full (1-40) option cards with upgrade pricing banners.

---

## 20. REQUIRED ADMIN CHANGES (Conceptual Only)

1. **Package Tier Configuration**:
   - Admin UI in `TestSeriesAdmin.tsx` to configure prices and bounds for Mini, Half, Full tiers.
2. **Quiz Sequence Manager**:
   - Drag-and-drop or numerical input to set `testSequenceNumber` on quizzes.
3. **Individual Test Price Input**:
   - Field to set standalone price on individual quizzes.

---

## 21. PAYMENT / ORDER CHANGES (Conceptual Only)

- Order payload passed to Razorpay order creation will contain an internal `orderId` linked to `orders` and `order_items` in state before opening the gateway.
- Payment verification endpoint `POST /api/payments/verify` will verify signature, update `orders.status = PAID`, and call `grantEntitlementsFromOrder(orderId)`.

---

## 22. MIGRATION / BACKWARD COMPATIBILITY PLAN (Conceptual Only)

```
Existing `lms_enrollments` Records
              │
              ▼ (One-Time Background Script)
Create `user_entitlements` Rows:
  - userId = enrollment.userId
  - testSeriesId = enrollment.courseId
  - entitlementType = 'COMPLETE_SERIES'
  - maxSequenceNumber = 9999
              │
              ▼
  Existing Users Retain 100% Full Access
```

---

## 23. IMPLEMENTATION PHASE PLAN

```
 ┌──────────────────────────────────────────────────────────────────────────┐
 │ PHASE 1: Schema & Data Layer (Entitlements, Packages, Orders)            │
 ├──────────────────────────────────────────────────────────────────────────┤
 │ PHASE 2: Backend Entitlement & Pricing Services                          │
 ├──────────────────────────────────────────────────────────────────────────┤
 │ PHASE 3: Admin Package & Sequence Configuration UI                       │
 ├──────────────────────────────────────────────────────────────────────────┤
 │ PHASE 4: Student UX (Tier Selector & Individual Test Checkboxes)         │
 ├──────────────────────────────────────────────────────────────────────────┤
 │ PHASE 5: Verification & Backward Compatibility Backfill                  │
 └──────────────────────────────────────────────────────────────────────────┘
```

---

## 24. RISKS

1. **Risk**: Paywall Mismatch between list API and quiz start API.
   - **Mitigation**: Shared `entitlementService.hasQuizAccess()` used across all endpoints.
2. **Risk**: Webhook Latency / Double Submit.
   - **Mitigation**: Unique constraint `(userId, quizId)` on `user_entitlements` and `orders.status` state machine checks.

---

## 25. GO / NO-GO RECOMMENDATION

### **VERDICT: GO** (Architecture Upgrade Recommended)

The existing system provides a clean foundation. Introducing the entitlement model requires zero breaking changes to existing data structures and can be deployed with 100% backward compatibility.

---

## FILE-BY-FILE CHANGE MAP

| Component | File | Current Responsibility | Why It Must Change | Future Change |
| :--- | :--- | :--- | :--- | :--- |
| **Database** | `schema.prisma` | Defines DB models | Needs tier, order line-items & entitlement models | Add `user_entitlements`, `orders`, `order_items`, `test_series_packages` |
| **Backend** | `db.ts` | Data helper & JSON store fallback | Needs helper queries for entitlements & line items | Implement `lmsDB.getUserEntitlements` & `hasQuizAccess` |
| **Backend** | `routes/payments.ts` | Order creation & verification | Needs multi-item and tier payload support | Update `create-order` & `verify` to process line items |
| **Backend** | `routes/quizzes.ts` | Paywall guard & quiz attempts | Checks binary enrollment | Replace `isEnrolled` with `hasQuizAccess(userId, quizId)` |
| **Admin** | `TestSeriesAdmin.tsx` | Series & quiz administration | Lacks tier pricing & sequence configuration | Add Mini/Half/Full pricing form & quiz ordering |
| **Frontend** | `program/[slug]/page.tsx` | Student test series detail page | Whole-series purchase button only | Add Tier cards, individual test purchase & multi-select cart |
| **Frontend** | `services/auth.ts` | Auth & payment helpers | Calls binary payment verification | Add line-item payload parameters to order creation |

---

## DATABASE CHANGE MAP

| CURRENT TABLE | REQUIRED CHANGE | REASON |
| :--- | :--- | :--- |
| `lms_enrollments` | **Retain (Read-Only Legacy)** | Preserved for 100% backward compatibility with past purchases. |
| `lms_quizzes` | **ADD COLUMN `sequenceNumber` INT, `testTier` ENUM, `price` INT** | Required to order tests, assign cumulative tier bounds, and set individual prices. |
| `TestSeries` | **ADD COLUMN `miniMaxSeq` INT DEFAULT 16, `halfMaxSeq` INT DEFAULT 28** | Admin-configurable test sequence cutoffs per series. |
| `user_entitlements` | **NEW TABLE** | Core entitlement engine storing user access grants for series, tiers, or individual tests. |
| `orders` | **NEW TABLE** | Line-item order ledger tracking payments, discounts, and Razorpay order IDs. |
| `order_items` | **NEW TABLE** | Tracks individual tests or packages purchased in a single transaction. |

---

## FINAL VERDICT SUMMARY TABLE

```
CURRENT SYSTEM:
    Binary enrollment model via `lms_enrollments`. Access granted for all quizzes in a series.

TARGET MODEL:
    Mini = 16 (Cumulative)
    Half = 28 (Cumulative)
    Full = 40 (Cumulative)

INDIVIDUAL PURCHASE:
    Supported via `user_entitlements` (INDIVIDUAL_QUIZ)

MULTI-TEST PURCHASE:
    Supported via `orders` and `order_items` cart bundle checkout

UPGRADE:
    Supported (Differential price calculation & cumulative tier expansion)

DUPLICATE PURCHASE PROTECTION:
    Supported (Idempotent signature verification & entitlement unique constraints)

BACKWARD COMPATIBILITY:
    Safe (Automatic backfill of existing `lms_enrollments` to `COMPLETE_SERIES` entitlements)

PAYMENT SAFETY:
    Safe (Server-side HMAC verification & price calculation)

RECOMMENDED IMPLEMENTATION:
    Proceed with Phase 1–5 implementation plan.
```
