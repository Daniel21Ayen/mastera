# Mastara Software Requirements Specification

**Version 3.4 — Complete Edition with UI Design Baseline**

**Document ID:** `MASTARA-SRS-001`

**Status:** Draft for product-owner approval

This edition consolidates SRS v3.3 (which merged v3.2, the 27 Oct update sections, and the 28 Oct consolidated requirements), the connectivity verdict (hybrid offline-first / online-first model), and the student-app design sheets (`Auth`, `Home`, `Course`, `Material`, `Notes & Amharic Notes`, `Tests / Quiz 1–3`, `Exams / Mid, Final, Mock`, `COC`, `Progress`, `Profile`, `Store` and `Payment`). Design-driven additions are marked **`[UI]`**; places where the design and the SRS disagree are listed in Section 3.3 for decision.

## Table of Contents

* [0. Document control](#0-document-control)

* [1. Introduction](#1-introduction)

* [2. Product overview](#2-product-overview)

* [3. Authoritative decisions and conflict resolutions](#3-authoritative-decisions-and-conflict-resolutions)

* [4. Roles, permissions and admin rules](#4-roles-permissions-and-admin-rules)

* [5. Student lifecycle and registration](#5-student-lifecycle-and-registration)

* [6. Commerce: products, pricing and eligibility](#6-commerce-products-pricing-and-eligibility)

* [7. Entitlements, expiry and refunds](#7-entitlements-expiry-and-refunds)

* [8. Content access, catalog, sync and downloads](#8-content-access-catalog-sync-and-downloads)

* [9. Student experience and UI design baseline \[UI\]](#9-student-experience-and-ui-design-baseline-ui)

* [10. Admin portal](#10-admin-portal)

* [11. Data model and API](#11-data-model-and-api)

* [12. Non-functional requirements](#12-non-functional-requirements)

* [13. Domain functions and tests](#13-domain-functions-and-tests)

* [14. Security, privacy and content protection](#14-security-privacy-and-content-protection)

* [15. Functional requirement index](#15-functional-requirement-index)

* [16. Quality gates and acceptance criteria](#16-quality-gates-and-acceptance-criteria)

* [17. Implementation roadmap](#17-implementation-roadmap)

* [18. Risks and edge cases](#18-risks-and-edge-cases)

* [19. Decisions and assumptions to approve](#19-decisions-and-assumptions-to-approve)

* [20. Open questions](#20-open-questions)

* [Appendix A. Glossary](#appendix-a-glossary)

* [Appendix B. Final acceptance checklist](#appendix-b-final-acceptance-checklist)

## 0. Document control

| Field | Value | 
| ----- | ----- | 
| **Product** | Mastara — online-first, offline-capable learning app for Ethiopian university freshmen | 
| **Document ID** | `MASTARA-SRS-001` | 
| **Version** | `3.4` (supersedes `3.0`–`3.3`) | 
| **Student app** | React Native with Expo (Android first, iOS supported) | 
| **Admin portal** | Next.js | 
| **Backend / DB** | NestJS (REST) / PostgreSQL / S3-compatible object storage | 
| **Monorepo** | npm workspaces (`@mastara/domain`, `contracts`, `packages/ui-tokens`) | 
| **Account types** | `STUDENT` and `ADMIN` (`Super Admin`, `Academic Admin`, `Operations Admin`) | 
| **Currency** | ETB | 
| **Size gate** | Under $20\text{ MB}$ `arm64` download (hard release gate) | 
| **Normative language** | `MUST` = mandatory; `SHOULD` = recommended; `MAY` = optional | 
| **Priority** | `P0` launch-blocking; `P1` launch-expected; `P2` later | 
| **Precedence** | Consolidated Requirements v1.0 (28 Oct) $>$ Update Sections (27 Oct) $>$ SRS v3.2 $>$ v3.1. This edition adds: UI design sheets refine screen behaviour but never override a server-authority rule. | 

## 1. Introduction

### 1.1 Purpose

This is the single authoritative specification for Mastara. It states what the student app, admin portal, and API must do, how they behave offline and online, who may do what, and how each requirement is verified.

### 1.2 Audience

Product owner (approval), mobile/backend/admin engineers (build), QA (test), UI designers (consistency), operations staff (workflows).

### 1.3 Core principle

The server is authoritative for eligibility, course counts, prices, payment approval, student IDs, entitlements, and expiry. Mobile UI restrictions improve clarity but are never the only enforcement.

### 1.4 Product definition

Mastara helps freshmen find materials, understand them, practise, and sit exams, even on budget phones with unreliable internet. A student sets University, Program, Semester, and Stream, adds courses to My Course List, tries free items, then buys access. Learning uses Modules, Notes, Amharic notes, Quiz 1–3, Mid / Final / Mock exams, and a standalone COC Exam.

### 1.5 In scope

* Local account creation and profile setup that work fully offline; server registration, device binding, and release after the first approved bundle payment.

* A stream-filtered catalog (`Natural`, `Social`, `Common`) cached on the phone and visible offline without loading states.

* Course tabs `Material`, `Tests`, `Exams`; standalone `COC Exam` on Home.

* Online streaming into memory, optional per-course and per-chapter download, delete downloads, answer review with Show / Hide explanations.

* Bundles (batch, semester, full-course), single and extra courses, Full Freshman Package, receipt payment, Admin verification, automatic expiry, refunds.

* Admin portal: catalog, content, Scan to PDF, Questions, Products and Pricing, payments, entitlements, devices, notifications, support, audit, reports, admin account management.

* Screen-capture blocking, light and dark themes, four-colour student design system, one icon family.

### 1.6 Out of scope

GPA calculation; Continue Learning (see `DR-02`); automated payment gateways and automated refund payout; live remote proctoring; AI tutor and recommendations; iOS store billing.

## 2. Product overview

### 2.1 System context

| Component | Responsibility | 
| ----- | ----- | 
| **Student app** (Expo, TypeScript, encrypted SQLite) | Local registration/profile, local catalog, store UI, order submission, claim polling, streaming into memory, downloads, offline entitlement checks, progress | 
| **API** (NestJS) | Eligibility, server-side pricing, receipt/order validation, approval, claim-secret validation, MS number assignment, device binding, entitlements and expiry, JWT, validation, rate limiting | 
| **Database** (PostgreSQL) | Orders, payments, entitlements, pricing configuration, course versions, transactional counters, unique student identity | 
| **Admin portal** (Next.js) | Paid-only student directory, receipt queue, pricing, content authoring, maker-checker publishing, roles | 
| **`@mastara/domain`** | Shared DTOs and pure eligibility/pricing/access functions with unit tests | 
| **Object storage / Redis / Expo push** | Content and receipt files; optional cache; notifications | 

### 2.2 Connectivity model: a hybrid (authoritative definition)

> **Authoritative Hybrid Rule:** Mastara is **offline-first for structure** (what exists, what it is called, what is locked) and **online-first for content bodies** (modules, notes, questions). Money, IDs, prices, entitlements, and expiry are **server-authoritative and need the internet**.

This sentence also appears in Section 8.6. It resolves the wording gap between `OFF-01` ("offline-first architecture") and `D5` ("online-first content").

| Layer | Approach | SRS Basis | 
| ----- | ----- | ----- | 
| **Account, profile, sign-in (before first purchase)** | Offline-first | `D4`, `D21`, `REG-01`, `FR-A05` | 
| **Catalog (titles, chapters, badges, flags)** | Offline-first: local SQLite plus bundled seed, no loading state | `D23`, `8.3`, `NFR-15` | 
| **Content bodies (modules, notes, questions)** | Online-first with optional download | `D5`, `D24`, `8.2` | 
| **Money, IDs, prices, entitlements, expiry** | Server-authoritative, online only | Section 1.3 core principle | 
| **Progress and attempts** | Local first, synced after registration | `OFF-01`, `SYN-02` | 

### 2.3 What needs the internet

| Action | Internet needed? | 
| ----- | ----- | 
| Create account, sign in, edit profile (before purchase) | **No** | 
| Browse catalog lists and badges | **No** | 
| Open a free or entitled item already downloaded | **No** | 
| Stream an item into memory | **Yes** | 
| Download, update, or re-download a course or chapter | **Yes** | 
| Request a quote; submit first bundle order with receipt | **Yes** — this is the first time the server is contacted | 
| Poll for approval; claim the approved account | **Yes** | 
| First sign-in on a new phone | **Yes** | 
| Renewal, revocation, entitlement-token refresh | **Yes** | 
| Sync progress, attempts, outbox | **Yes** (queued until online, only after registration) | 

**Timing clarification:** The server is first contacted when the student submits the first bundle order with a receipt, not when Admin approves it. Approval is what creates the `MS` number; the student becomes `REGISTERED_REMOTE` only after the app claims the account with its `claimSecret` and migrates local data. Submitting the order, polling for approval, and claiming all require internet connectivity, as does signing in for the first time on a new phone.

### 2.4 User classes

| Class | Description | 
| ----- | ----- | 
| **Student (local-only)** | Registered on the phone only; free content and catalog; can submit a bundle order | 
| **Student (payment pending)** | Order submitted, receipt under review; still local-only (`PAYMENT_PENDING` display state) | 
| **Student (registered)** | Approved and claimed (`REGISTERED_REMOTE`); entitlements, sync, device-bound | 
| **Super Admin** | $2$–$3$ trusted people; full platform and commercial control | 
| **Academic Admin** | Content authors/coordinators within assigned university, program, or course scope | 
| **Operations Admin** | Student support and finance staff | 

### 2.5 Operating environment and constraints

* Android first ($2\text{ GB}$ RAM reference phone, budget device), iOS supported without store billing.

* Package under $20\text{ MB}$ (`arm64` from the Android App Bundle); memory under $120\text{ MB}$ on the reference phone; cold start under $3\text{ s}$.

* Bundled seed catalog at most about $150\text{ KB}$ compressed so first launch works offline.

* Content lives in cloud storage, not in the package; content updates need no app release.

* Expo Go and native builds are handled explicitly; hardware-backed encryption limits are documented.

### 2.6 Assumptions and dependencies

Manual payment through bank / mobile-money transfer verified from a receipt image; push notifications via Expo; a native review of Amharic wording (`Q18`); the product owner approves Section 19 and Section 20 items.

## 3. Authoritative decisions and conflict resolutions

### 3.1 Decision register

| \# | Decision | Status | 
| ----- | ----- | ----- | 
| **D1** | Stack: Expo React Native, Next.js admin, NestJS API, PostgreSQL, npm workspaces | Unchanged | 
| **D2** | Release package under $20\text{ MB}$ (`arm64` from AAB) | Unchanged | 
| **D3** | Account types `STUDENT` and `ADMIN`; Admin has subtypes (`D20`) | Changed | 
| **D4** | Local-first account; nothing reaches the server before the first qualifying bundle order | Changed | 
| **D5** | Online-first content bodies with optional download (`D24`) | Changed | 
| **D6** | Continue Learning removed from Home and the specification | Unchanged (see `DR-02`) | 
| **D7** | Home is card-based; COC Exam card uses course-card style | Unchanged | 
| **D8** | Material tabs: `Modules`, `Notes`, `Amharic`. Amharic notes are separate content items; no language toggle inside content | Unchanged | 
| **D9** | Screenshots and screen recording blocked on every content screen | Unchanged | 
| **D10** | Light and dark theme on every screen | Unchanged | 
| **D11** | Scroll-first reading with bottom `Next` button | Unchanged | 
| **D12** | Review Answer after every exam and COC with Show/Hide explanations | Unchanged | 
| **D13** | Exam duration set on the exam set, not on question forms | Unchanged | 
| **D14** | Question forms and lists follow Section 10.5 | Unchanged | 
| **D15** | COC Exam is a standalone Home module | Unchanged | 
| **D16** | GPA is out of scope | Unchanged | 
| **D17** | Payment is a manual receipt screenshot verified by Admin | Confirmed | 
| **D18** | Each course carries a free-trial item count set by Admin | Unchanged | 
| **D19** | Build order: Question Bank first, in small subphases | Unchanged | 
| **D20** | Admin subtypes `Super` / `Academic` / `Operations` with own permissions and scope | New | 
| **D21** | Local account states `LOCAL_ONLY` and `REGISTERED_REMOTE`; only a salted hash on the phone; password re-entered at first purchase | New | 
| **D22** | Student ID `MS` + at least four digits from `MS0001`, allocated in the student-creation transaction; admins never consume numbers | New | 
| **D23** | Every student sees every course, chapter, exam, and test with a badge, instantly and offline | New | 
| **D24** | Opening content needs permission and a source; online students may stream; offline only downloaded | New | 
| **D25** | One access function `canOpen` shared by server and app | New | 
| **D26** | One paywall sheet with fixed wording and a `Purchase Course` button | New | 
| **D27** | Question number restarts at $1$ per exam set or quiz chapter; global identity separate | New | 
| **D28** | Bulk import accepts CSV only, checked by content | New | 
| **D29** | Pagination standard for every admin list | New | 
| **D30** | Real data only; mock data removed from production builds | New | 
| **D31** | One colour source (`packages/ui-tokens`); shared status tones; per-course accent | New | 
| **D32** | Active content tab and active sidebar child share one colour token | New | 
| **D33** | Security baseline (Section 14) | New | 
| **D34** | Refund workflow: request, approval, payout-recorded, entitlement-revoked | New | 
| **D35** | Bundle $\min/\max$ configured separately for batch, semester, and full-course | New | 
| **D36** | Bundle price calculated (course prices minus optional discount) or fixed override | New | 
| **D37** | Extra single courses priced by tier on ordinal position in the order | New | 
| **D38** | Access duration starts at the approval timestamp | New | 
| **D39** | Claim-secret flow and idempotent claim endpoint for first-order registration | New | 
| **D40** | **`[UI]`** Student app follows the single design system in Section 9.16 (four colours, one icon family) | New (v3.4) | 

### 3.2 Conflicts resolved (earlier rule $\rightarrow$ resolved rule)

| Topic | Resolved Rule | 
| ----- | ----- | 
| **Single course before any bundle** | **REPLACED.** First purchase `MUST` be a bundle; single-course orders from local/unregistered students are rejected (`SINGLE_COURSE_BUNDLE_REQUIRED`). | 
| **Existing phone/email** | **REPLACED.** Server `MUST NOT` silently link. Require login or verified OTP, else return `ACCOUNT_EXISTS_LOGIN_REQUIRED`; no new `MS` number; app shows Sign in and Contact Admin. | 
| **Semester bundle size** | $\min/\max$ are Super Admin settings per product type; $7$–$10$ is the default for semester only. Batch limits are not inherited. | 
| **Extra course price** | Admin tier schedule by ordinal within the order; $100/50/40\text{ ETB}$ is illustrative only. | 
| **Bundle price** | Calculated or Fixed mode per product; $200\text{ ETB}$ (semester) and $350\text{ ETB}$ per stream (full package) remain default fixed prices. | 
| **MS number timing** | Assigned only when Operations Admin approves the first qualifying bundle receipt, inside one database transaction. | 
| **Atomic sequence** | Transactional counter row only; a plain PostgreSQL sequence is not allowed (it can leave gaps on rollback). | 
| **Receipt size** | Configured maximum; default $300\text{ KB}$; `JPEG`/`PNG`/`WebP` only. | 
| **Bundle expiry vs singles** | Bundle expiry ends only bundle-provided access; separately bought courses stay until their own expiry. | 
| **Which bundles unlock singles** | Batch, semester, and full-course all qualify unless Super Admin disables a type. | 
| **Payment confirmation** | Manual receipt approval at launch; automated gateway is a later plan. | 
| **Entitlement start** | Approval timestamp, never order submission, claim, or first open. | 

### 3.3 Design reconciliation register (design sheets vs SRS)

The design sheets were compared with the SRS. Each row gives the resolution used in this edition; rows marked **Confirm** need a product-owner decision (Section 20).

| ID | Design shows | SRS says | Resolution used here | 
| ----- | ----- | ----- | ----- | 
| **DR-01** | Four-colour system: Royal Blue, Navy Ink, White, Amber; correct/wrong shown by icon + Blue/Amber, no red or green | 10.8: primary blue, ink, white, danger red; success/warning tones | Student app follows the four-colour design. Admin portal keeps semantic tokens (`success`/`warning`/`danger`). Hex values live only in `packages/ui-tokens`. **Confirm (`Q23`)** | 
| **DR-02** | Home "Recently accessed" list; Progress "Continue Chapter 2" button | `D6`: Continue Learning removed | Both are Continue-Learning-like. Excluded from `P0` until decided. **Confirm (`Q24`)** | 
| **DR-03** | Progress: mastery ring, weekly activity bars, streak chip | Not specified; GPA out of scope | Mastery ring, chapters completed, practice-quiz average, and saved-offline indicators are `P1`. Streak and weekly bars are `P2`. **Confirm (`Q25`)** | 
| **DR-04** | Badges: `Open`, `Free`, `Locked`, `Downloaded`, `Download`, `Included`, `Done`, `Start`, `Resume` | `Free`, `Paid` (with lock), `Downloaded`, `Not available offline` | Two-part vocabulary in Section 9.15: an access badge plus an optional state/action chip. Design wording is kept. | 
| **DR-05** | Quiz chapter rows show "12 questions · 10 min" | `Q13`: quiz Time Allowed optional | Show duration only when set; otherwise show question count only. | 
| **DR-06** | Login has "Forgot password?" | Local accounts have no server; no reset channel before purchase | Before purchase: link opens a notice that a local password cannot be reset and offers re-registration (with data loss warning). After registration: server reset by verified phone/email OTP. **Confirm (`Q26`)** | 
| **DR-07** | Exam result says "answers saved and synced" | Local-only students do not sync | Text is state-aware: "saved on this phone" for `LOCAL_ONLY`; "saved and synced" for `REGISTERED_REMOTE`. | 
| **DR-08** | Amharic tab labelled `Amharic` | `Amharic Note` | UI label is `Amharic`; internal item type remains `Amharic Note`. | 
| **DR-09** | Register screen collects stream (one sheet) vs profile step collects stream (another) | 5.1 / 9.1 | Register: Full name, Email or phone number, Password, Confirm password. Profile Setup (Step 2 of 3): University, Department/Program, Semester, Academic Stream. Step 3: Select Courses. | 
| **DR-10** | Payment screen lists bank/mobile-money accounts, copy buttons, reference field, "image compressed under $300\text{ KB}$" | v3.1 receipt rules | Payment methods are Admin-configured data (Section 9.13). Receipt compression to the configured maximum. | 
| **DR-11** | "Renew bundle · opens in last 14 days" | `Q21` renewal window unset | Default renewal window $14\text{ days}$, Super Admin configurable. | 
| **DR-12** | Download manager with Wi-Fi only toggle, storage used | Mobile-data warning only | Added as `DWN-08`, `DWN-09`. | 
| **DR-13** | Settings: Language English / Amharic (UI language) | Localization in NFR (v3.1) | Added as `UI-SET-01`; does not change `D8` (no language toggle inside content). | 
| **DR-14** | Release-device sheet, Device Locked screen | v3.1 6.9 | Retained and specified in Section 9.12. | 

## 4. Roles, permissions and admin rules

### 4.1 Account types

| Role | Who | Responsibilities | 
| ----- | ----- | ----- | 
| **`STUDENT`** | Learner | Create a local account, choose scope, use free items, submit a bundle order with receipt, learn, sit exams, review answers, download or delete content, release own device. | 
| **`ADMIN`: Super Admin** | Platform owner or trusted administrator ($2$–$3$ people at most) | Manage admin accounts, roles, scopes; create/delete universities, programs, semesters, courses; control content, tests, COC, and publishing; manage products, prices, bundle limits, tiers, durations, system configuration; audit, reports, security; approve refunds. | 
| **`ADMIN`: Academic Admin** | Coordinators, teachers, content managers | Edit course details, chapters, and order within scope; create/edit notes, materials, questions, Quiz 1–3, and COC; Scan to PDF; submit for review; set chapter-level free flags in scope; course-scoped announcements. Cannot change commercial settings. | 
| **`ADMIN`: Operations Admin** | Student support and finance staff | Support and access issues; review purchases, payments, and receipts; approve or reject receipts; handle support; request refunds; operational reports; release device bindings and limited access grants. May view commercial settings. | 

The client never sends a role. A forged role is ignored and logged.

### 4.2 Permission matrix

| Area | Super Admin | Academic Admin | Operations Admin | 
| ----- | ----- | ----- | ----- | 
| Admin accounts, roles, scopes | Full | — | — | 
| Universities, programs, semesters, courses (create/delete) | Full | Edit within scope | View | 
| Chapters, notes, modules, Amharic notes, Scan to PDF | Full | Scoped | — | 
| Questions, Quiz 1–3, Mid, Final, Mock, COC | Full | Scoped | — | 
| Submit for review | Full | Scoped | — | 
| Publish | Full | Reviewer only if granted, never own work | — | 
| Chapter free flag | Full | Scoped | — | 
| Course Free Access, free-trial count | Full | — | — | 
| Products, prices, bundle limits, tiers, durations, single-course toggle | Full | — | View | 
| Payments and receipts (approve/reject) | Full | — | Full | 
| Refunds | Approve | — | Request | 
| Students (profile, status) | Full | — | Full, minimal fields | 
| Device release, manual access grant | Full | — | Limited, reason required | 
| Support tickets | Full | — | Full | 
| Announcements | Full | Course-scoped | Payment and system notices | 
| Reports | Full | Academic only | Operational only | 
| Audit log, security settings | Full | — | Own actions only | 

### 4.3 Admin rules

* **Server authority:** Permissions and scopes are checked on every admin request; list queries are filtered by scope. Hiding a button is never the only control.

* **Maker-checker:** Content moves `Draft` $\rightarrow$ `In Review` $\rightarrow$ `Published`. The publisher `MUST` differ from the author.

* **Revenue controls:** Prices, durations, products, bundle limits, tiers, Free Access, and free-trial counts are Super Admin only.

* **Reasons and limits:** Manual grants, device releases, refunds, and price/duration/count changes require a reason and are audited. Refunds and grants above an Admin-set limit need Super Admin approval.

* **Authentication:** TOTP two-factor authentication is mandatory for Super Admin and Operations Admin. Admin sessions last at most $12\text{ hours}$.

* **Data minimisation:** Academic Admin never sees payments, receipts, or student personal data. Receipt and phone-number views are logged.

* **Safety:** The last active Super Admin cannot be deleted, deactivated, or demoted; no admin can remove their own account.

### 4.4 Server authorization rule

$$
\text{ALLOW} = \text{authenticated} \land \text{role\_permission} \land \text{scope} \land \text{resource\_state} \land \text{business\_rule}
$$

Paid content opens only when the student is authenticated, the device matches, the entitlement is active for the course, and the content status is `PUBLISHED`. Free items open under Section 8.1.

## 5. Student lifecycle and registration

### 5.1 Account states

| State | Meaning | Server data | 
| ----- | ----- | ----- | 
| **`LOCAL_ONLY`** | Registered on this phone; registration, sign-in, and profile edits work offline | None | 
| **`PAYMENT_PENDING`** (display state) | First bundle order submitted; receipt under review; still local-only | Pending order only (no `student` record) | 
| **`REGISTERED_REMOTE`** | First bundle approved and claimed; server account exists | Student, `MS` number, device binding, entitlements, progress | 

### 5.2 Before the first qualifying purchase — local only

* **`REG-01` / `FR-A01` (`P0`):** A student can register, sign in, and edit their profile fully offline (name, password, phone or email as sign-in identifier). Works in airplane mode.

* **`REG-02`, `REG-03`, `FR-A08`:** The registration is stored only on the device with a random UUID `localAccountId`, not an `MS` number. It is the idempotency key of the first order.

* **`FR-A02`:** Password stored only as a salted, iterated hash in secure storage, compared in constant time.

* **`FR-A03`:** Failed sign-ins are limited with growing delays (after $5$ failures: $30\text{ s}$, doubling up to $15\text{ min}$).

* **`FR-A04`:** Accounts saved by older versions with a plain password are upgraded to a hash on next successful sign-in and the plain value erased.

* **`FR-A05`:** Offline sign-in succeeds only with the matching password. The first sign-in on a new phone needs internet.

* **`FR-A06` / `SYN-01`:** Before the first qualifying order, the app sends no student profile, `localAccountId`, password, edits, or progress to the server. A network-spy test proves it. Catalog metadata sync and the anonymous install ID used for free-item rate limiting are allowed because neither identifies a student.

* **`REG-04`:** An unpaid student does not exist on the server and never appears in the Admin Panel.

* **`REG-05` / `FR-A11`:** Registration and Profile show: *"Your account is saved on this phone until you buy a course."* Uninstalling before purchase erases local progress.

* **`REG-06`:** The "Browse Free Content (No Registration)" button is removed.

* **`FR-A10`:** Mock sign-in code is absent from release builds.

* **`FR-A07`:** At first purchase the student verifies a phone number and re-enters the password; it travels only over TLS and is hashed server-side (`bcrypt` or `Argon2id`). The local hash is never uploaded or used as a server credential.

* The server `MUST NOT` expose a registration route that creates a student before an approved purchase.

### 5.3 Order submission and pending state

* The first order `MUST` be a valid batch, semester, or full-course bundle. The API rejects single-course orders from local/unregistered students (`SINGLE_COURSE_BUNDLE_REQUIRED`).

* The app generates a cryptographically secure $32\text{-byte}$ `claimSecret` (URL-safe), stores it securely on the device, and sends only:
  

  $$
  \text{claimSecretHash} = \text{SHA-256}(\text{claimSecret})
  $$

* The order includes `localAccountId`, profile fields, re-entered password over TLS, selected product and courses, receipt metadata, `claimSecretHash`, and quote/order token.

* The server stores pending profile fields and a password hash, never plaintext; never logs it. The order is marked `PENDING`; the student stays local-only with a `Payment pending` status (`REG-14`).

* The public order endpoint `MUST` apply rate limits, strict image validation (`JPEG`/`PNG`/`WebP`, decoded and content-checked), a configured maximum receipt size (default $300\text{ KB}$), EXIF stripping, private storage with signed URLs, and no more than $2$ pending orders per phone number (equivalent controls for email).

* **`REG-10` (Idempotency):** A retry with the same `localAccountId` returns the same pending order/claim result and creates no duplicate order or student.

### 5.4 Approval and claim

* Operations Admin approves or rejects the receipt. Rejection requires a reason; the account stays local; the student may correct and resubmit under pending-order rules.

* On approval of a valid first bundle, **ONE database transaction**:

  1. Creates the `Student` record.

  2. Allocates the next `MS` number.

  3. Creates the device binding (`REG-13`).

  4. Marks the order `APPROVED`.

  5. Creates entitlement records with `starts_at` and `expires_at`.

* `MS` allocation uses a counter row in the same transaction:

  ```
  UPDATE counters SET value = value + 1 WHERE name = 'student_ms_code' RETURNING value;
  
  ```

  A failed transaction rolls back the increment.

* The app polls with exponential backoff and jitter (no fixed-interval high-frequency polling) or receives a push notification, then calls `POST /orders/:orderId/claim` with the original `claimSecret`.

* The API verifies $\text{SHA-256}(\text{claimSecret}) = \text{claim\_secret\_hash}$ (in constant time where practical), then returns `studentCode`, access/refresh tokens, and entitlements. Claim is idempotent.

* The app atomically migrates local SQLite rows and SecureStore references from `localAccountId` to the server student identity (progress, attempts, download mappings), verifies counts/checksums, retries safely on failure, and never duplicates or loses records (`REG-12`). Only after claiming and migrating is the student `REGISTERED_REMOTE` and begins syncing (`SYN-02`).

### 5.5 Existing account and takeover protection

If the phone number or email already belongs to a paid student, the server `MUST NOT` silently link the order. It requires authentication to the existing account or a verified OTP; otherwise it returns `ACCOUNT_EXISTS_LOGIN_REQUIRED`. Linking never creates a new `MS` number. Local data is never blindly merged into a paid account.

### 5.6 Claim secret security

* Never log or expose the plaintext secret; accept it only over HTTPS; reject invalid, expired, or unrelated claims (`CLAIM_SECRET_INVALID`).

* Rate-limit claims, audit suspicious failures, and do not reveal whether an arbitrary order ID exists to unauthenticated callers.

* The device keeps the secret until claim succeeds or the pending order expires or is rejected.

### 5.7 Gapless student ID (MS number)

* **`FR-G45`:** Format: `MS` plus at least four digits (`MS0001` $\dots$ `MS9999`, then `MS10000`).

* **`FR-G46` / `REG-08` / `REG-09`:** Number comes from a `counters` table updated in the student-creation transaction; assigned by the server only. No non-transactional sequence.

* **`FR-G47`:** Admin accounts are stored separately and never consume numbers.

* **`FR-G48` / `ADM-01` / `ADM-02`:** The ID is shown first in the Students list and profile. Local-only students have no ID. Student IDs and counts include only paid students.

### 5.8 Recovery

* **`REG-15`:** An unpaid student who loses the phone or reinstalls loses the local account. Accepted.

* **`REG-16`:** A paid student signs in on the server after reinstalling (requires internet for the first sign-in on a new phone) and recovers purchases, entitlements, progress, and re-downloads courses.

## 6. Commerce: products, pricing and eligibility

Every number is Admin-managed configuration. Changes are audited (actor, timestamp, previous value, new value, reason) and apply to new quotes/orders only.

### 6.1 Products and default values

| Product | Default | Rule | 
| ----- | ----- | ----- | 
| **Semester Bundle** | $200\text{ ETB}$ (fixed default) | $7$–$10$ courses of one semester and stream ($\min/\max$ configurable) | 
| **Batch Bundle** | Admin-defined | Own $\min/\max$ and pricing; never inherits semester limits | 
| **Full Freshman Package** | $350\text{ ETB}$ per stream (fixed default) | All stream courses plus Common courses, both semesters, with COC and exams | 
| **Both Streams** | Admin-defined (default $2 \times 350 = 700\text{ ETB}$) | Natural, Social, or both in one order | 
| **Extra single course** | Tier schedule (Section 6.4) | Only with an active qualifying bundle and single-course sales enabled | 

### 6.2 Admin-controlled configuration

| Setting | Required fields / validation | 
| ----- | ----- | 
| **Semester bundle** | `enabled`; `minCourses`; `maxCourses`; `pricingMode` (`CALCULATED` or `FIXED`); optional `discountPercent`; optional `fixedPriceETB`; `durationDays`; allowed semester/stream scope | 
| **Full-course bundle** | `enabled`; `minCourses`; `maxCourses`; `pricingMode`; `discountPercent` or `fixedPriceETB`; `durationDays`; scope; whether Common/COC/exams are included | 
| **Batch bundle** | `enabled`; own $\min/\max$ and pricing; `durationDays` | 
| **Course price** | ETB price per course with `active`/`inactive` state; API snapshots price at order creation | 
| **Extra-course tiers** | Ordered count ranges with per-course price or discount; no overlap; cover every allowed count | 
| **Single-course sales** | Global `singleCoursesEnabled`; when off, new single-course orders are rejected even with an active bundle | 
| **Qualifying bundle types** | Per type: whether it unlocks single purchases (default: all three) | 
| **Duration** | Positive integer `durationDays` per product; affects new approvals only | 
| **Renewal window** | Days before expiry when Renew opens (default $14\text{ days}$, `DR-11`) | 
| **Payment methods `[UI]`** | Bank/mobile-money entries: provider (e.g., CBE Mobile, CBE Birr, Telebirr, BOA), account name, account number, instructions, `active` flag (`DR-10`) | 

**Validation:** Non-negative prices, positive duration, $\text{minCourses} \ge 1$, $\text{maxCourses} \ge \text{minCourses}$, discount $0$–$100$, non-overlapping and complete tiers. Admin can preview calculated bundle prices for a selected course count.

### 6.3 Bundle size validation

* **Semester bundle:** All courses in the same configured semester and stream unless the product explicitly permits otherwise.

* Unique eligible courses `MUST` be between configured $\min$ and $\max$, inclusive. Duplicate IDs are rejected or deduplicated before pricing.

* Mobile and API both validate; the API is authoritative and returns `BUNDLE_SIZE_INVALID` with accepted $\min/\max$.

* The UI shows selected count, remaining slots, minimum needed, validity, included courses, price breakdown, and discount before receipt submission.

### 6.4 Price formulas

* **Calculated mode:**
  

  $$
  \text{BaseAmount} = \sum_{i=1}^{n} \text{coursePriceETB}_i
  $$

  $$
  \text{DiscountAmount} = \text{roundCurrency}\left(\text{BaseAmount} \times \frac{\text{discountPercent}}{100}\right)
  $$

  $$
  \text{BundlePrice} = \max(0, \text{BaseAmount} - \text{DiscountAmount})
  $$

* **Fixed mode:** $\text{BundlePrice} = \text{fixedPriceETB}$ if scope and count rules pass.

* **Money:** ETB in integer minor units (santim) or consistent decimal arithmetic, never floating point. Client-submitted totals are ignored.

* **Extra-course tiers:** The count is the ordinal position of each extra course within the same order.

| Example tier (illustrative) | Price per course | Applied to | 
| ----- | ----- | ----- | 
| **Extra #1** | $100\text{ ETB}$ | First unique extra course in the order | 
| **Extra #2–#5** | $50\text{ ETB}$ each | Each extra course whose ordinal position falls in $2\dots 5$ | 
| **Extra #6 and above** | $40\text{ ETB}$ each | Each additional course at ordinal position $\ge 6$ | 

**Illustrative calculation for** $7$ **extras:**

$$
7\text{ extras} = (1 \times 100) + (4 \times 50) + (2 \times 40) = 380\text{ ETB}
$$


The app shows each course, tier position, unit price, subtotal, and total before receipt upload; the server stores the breakdown and rejects a differing client total.

### 6.5 Purchase eligibility

| State | Required behaviour | 
| ----- | ----- | 
| **Local-only, first purchase** | Only a valid batch, semester, or full-course bundle; single rejected (`SINGLE_COURSE_BUNDLE_REQUIRED`) | 
| **Bundle receipt pending** | No `MS` number or paid entitlement; student remains local-only with `Payment pending` | 
| **Bundle approved** | Create student and `MS` number once; activate entitlement; bind device; enable sync | 
| **Active bundle, singles on** | May buy eligible courses not already covered | 
| **Active bundle, singles off** | Unavailable; API rejects (`SINGLE_COURSES_DISABLED`); existing entitlements remain valid | 
| **No active bundle** | Cannot buy a new single; locked button with bundle message (`SINGLE_COURSE_BUNDLE_REQUIRED`) | 
| **Course already included** | Show `Included` in Store; no Buy button; server rejects duplicate (`COURSE_ALREADY_INCLUDED`) | 
| **Bundle expires** | Bundle-provided access ends; separately purchased courses continue until their own expiry | 
| **Bundle refunded** | Revoke entitlements created by that bundle order only | 
| **Single-course order refunded** | Revoke the entitlement created by that order | 

* **`PUR-04`:** A single-course payment never creates a student.

* **`PUR-05`:** The API enforces all rules, including rejecting courses already owned.

* **`PUR-06`:** Without a bundle, singles show a locked Buy button: *"Buy a semester or full bundle first to unlock single courses"* (or configured wording).

* **`PUR-07`:** Courses covered by a bundle show `Included` in the Store with no Buy button.

* **`PUR-08` / `ADM-03`:** Super Admin sets bundle prices, single prices, and the single toggle.

* A Full package covers owned courses; no re-buy while actively entitled until the renewal window; singles are not credited to a later bundle unless configured.

### 6.6 Quotes and snapshots

* The API creates a quote from current active settings with an expiry and opaque quote/order ID.

* At order creation store quoted unit prices, discount, count, total, configuration version, and currency (`order_item` rows store each course and applied unit price/tier).

* Later price changes apply to new quotes/orders only. Pending orders keep a valid unexpired quote or require a refreshed one (`PRICE_QUOTE_EXPIRED`).

* Approval validates the order is still eligible and the receipt amount matches the stored expected amount. Admin cannot approve an invalid count or underpriced order by bypassing UI validation.

## 7. Entitlements, expiry and refunds

### 7.1 Entitlement lifecycle

* Every product has `durationDays`. On manual approval:
  

  $$
  \text{starts\_at} = \text{approval\_timestamp}, \quad \text{expires\_at} = \text{starts\_at} + \text{durationDays}
  $$

  
  Duration never starts at order submission, receipt upload, claim, first launch, or first open.

* Each separately bought extra course has its own entitlement and expiry from its own order's approval.

* Server time is authoritative. Device clock changes `MUST NOT` extend access. The app verifies a server-signed, device-bound, expiry-limited entitlement token offline (`GET /entitlements/token`) and keeps the last-seen server time to detect clock rollback.

* When online, renewal and revocation sync. Offline, content stops opening when the locally verifiable entitlement expires or is revoked.

* **`[UI]` Status messages:** `Expiring` shown within the renewal window (default last $14\text{ days}$); `Expired` when past `expires_at`; downloaded paid content is kept on disk but unreadable until renewal.

### 7.2 Refunds

* **States:** `REQUESTED` $\rightarrow$ `APPROVED` or `REJECTED` $\rightarrow$ `PAID_OUT` $\rightarrow$ `ENTITLEMENT_REVOKED`.

* Operations Admin requests with a reason; Super Admin approves or rejects; payout is manual outside the system and recorded with a reference; approval revokes entitlements tied to the refunded order only. Every step is audited. Eligibility policy (who, how long, full/partial) is configurable and open (`Q12`).

* **`PUR-09` (confirmed):** If a bundle expires or is refunded, separately bought singles stay available until their own expiry, but the student cannot buy more singles until an active qualifying bundle exists.

## 8. Content access, catalog, sync and downloads

### 8.1 Free access and `canOpen`

App and server `MUST` use the same `canOpen(student, item)` in this fixed order:

1. Item inactive, unpublished, or deleted $\rightarrow$ **unavailable**.

2. Active entitlement for the item's course $\rightarrow$ **open**.

3. Course has Free Access $\rightarrow$ **open**.

4. Item is free at item level (chapter Free flag, first $N$ free-trial items, free exam set, COC sample set) $\rightarrow$ **open**.

5. Otherwise $\rightarrow$ **locked**.

A source must also exist (online stream or downloaded copy). A free item never creates an entitlement; free items are public, rate-limited, watermarked assets keyed to an anonymous install ID.

### 8.2 Visibility and opening (`ACC-01` to `ACC-06`, `D23`, `D24`)

* Every student sees all listings (courses in scope, books/modules, chapters, exam sets, test sets, COC sets) instantly and offline, each with a badge (`Free`, `Paid` with lock / `Locked`, `Downloaded`, `Not available offline`; `Included` appears in Store and My Courses for bundle-covered courses). Listings come from the local catalog with no loading state and contain no content bodies.

* An unpaid student opens only free content; paid content opens only for students who paid.

* Online entitled students stream content into memory only, so nothing is saved to disk unless they tap `Download`.

* Free items can be downloaded for offline use too (`Q17`).

* Offline students open only previously downloaded, permitted content.

| Student state | Online | Offline | 
| ----- | ----- | ----- | 
| **Local-only / no purchase** | Free content streams into memory | Free content opens only if downloaded (`Q17`) | 
| **Valid entitlement** | Permitted content streams into memory; download optional | Opens only if downloaded and server-signed entitlement token is valid | 
| **No entitlement, paid content** | `LockedContentSheet` paywall | Locked; downloaded file must not bypass entitlement | 
| **Entitlement expired or revoked** | API denies; app updates local state | Downloaded paid content stays on disk but becomes unreadable | 

### 8.3 Catalog on the phone

* **Contents:** Universities, programs, semesters, courses (stream, access flags, accent, `content_version`), books/modules, chapters (title, order, type, free flag, version), exam/quiz/COC sets (name, year, question count, duration, access). No content bodies.

* **Scope:** The student's university, program, semester, and stream plus `Common` courses.

* **Storage:** SQLite tables loaded into memory during splash so the first list draws without a loading state in under $300\text{ ms}$.

* **Seed:** A catalog seed generated at release time and bundled (at most about $150\text{ KB}$ compressed).

* **Sync:** `GET /catalog/snapshot?scope=&since=` is public, versioned, `ETag`-enabled, and compressed.

* **Versions:** The server bumps an item's version when it is published, edited, deactivated, or changed between Free and Paid. Screens never block on the network.

### 8.4 Sync model (`SYN-01` to `SYN-03`, `OFF-01` to `OFF-05`)

| Direction | What flows | When | 
| ----- | ----- | ----- | 
| **Down (Admin** $\rightarrow$ **Student)** | Catalog and `content_version` changes (admin publish, edit, deactivate, Free $\leftrightarrow$ Paid) | On triggers below | 
| **Down (Server** $\rightarrow$ **Student)** | Entitlement renewal / revocation, server-signed entitlement token | When online, on foreground | 
| **Up (Student** $\rightarrow$ **Server)** | Progress, quiz/exam attempts, outbox | After registration only (`SYN-02`, `OFF-05`); queued offline | 

* **Triggers:** Profile saved, app foregrounded, connection restored (debounced), and pull to refresh. There is no fixed-interval polling, only exponential backoff with jitter.

* **Primary storage:** The device is the primary place the app reads from and writes to; the network is used to sync. Pending changes sync automatically when connectivity returns; the outbox flushes only after server registration (`REGISTERED_REMOTE`).

* **Conflicts:** Follow the v3.1 conflict matrix, and the default rule is last change wins.

* **Update available:** Shown when the server's `content_version` is higher than the local one. The replacement is atomic, so a failed update keeps the old copy readable.

* **Edge case (`R15`):** If an item becomes paid while a student has it downloaded, the file stays on disk but will not open until they purchase.

* **Parity (`SYN-03`):** A course created in Admin appears for students and disappears when marked inactive.

### 8.5 Downloads (`DWN-01` to `DWN-09`)

* **`DWN-01`:** States: `not downloaded`, `downloading` (with progress), `downloaded`, `update available`, `failed`. The button toggles `Download` / `Delete`; `Delete` removes files and DB rows and returns to `Download`. Deleting does not revoke the entitlement.

* **`DWN-02`:** Downloads resume after interruption; show progress and file size; work **per course and per chapter** where supported, not only per course.

* **`DWN-03`:** Low-storage and mobile-data warnings.

* **`DWN-04`:** Paid downloads are encrypted and device-bound; free items can be downloaded (`Q17`) using a device key in secure storage; paid items use a key issued after entitlement with a licence expiry verified offline against a server-signed token on open.

* **`DWN-05`:** Expiry, device release, or revocation makes paid downloads stop opening immediately.

* **`DWN-06`:** Each course and chapter has `content_version` (default $1$); replacement on update is atomic.

* **`DWN-07`:** Expo Go vs native builds handled explicitly; encryption reduces risk but cannot stop copying on a rooted device.

* **`DWN-08` `[UI]`:** A Download Manager lists downloaded courses with size, status (`Ready`, `Update`, `Downloading` with percent), total storage used, and free space.

* **`DWN-09` `[UI]`:** A "Download on Wi-Fi only" toggle (default `ON`) blocks mobile-data downloads unless the student overrides per download.

### 8.6 Paywall (`PAY-01` to `PAY-03`) and offline-first definition

* One component, `LockedContentSheet`, appears at every gate: chapter for `Modules`, `Notes`, `Amharic`; `Mid`, `Final`, `Mock` for `Exams`; chapter for `Tests`; exam set for `COC`.

* **English wording:** Title `"Locked Content"`, message `"You cannot access this content."`, buttons `Purchase Course` and `Cancel`. Offline message: `"You're offline. Download this item while online to read it offline."` Amharic wording needs native review (`Q18`).

* `Purchase Course` opens the Store at the correct screen: bundles for a student with no bundle; bundles or singles for a student with an active bundle; course preselected.

* The server returns `403 CONTENT_LOCKED` with a reason; the check is identical online and offline using the locally stored entitlement.

* **Offline-first definition (hybrid):** The app is **offline-first for structure** (what exists, what it is called, what is locked) and **online-first for content bodies** (modules, notes, questions); money, IDs, prices, entitlements, and expiry are server-authoritative (see Section 2.2).

## 9. Student experience and UI design baseline `[UI]`

### 9.1 Entry flow, Auth and Profile Setup (`DR-06`, `DR-09`)

* **Entry flow:** `Install / Launch` $\rightarrow$ `Splash` (loads SQLite catalog into memory) $\rightarrow$ `Login or Register` $\rightarrow$ `Step 2 of 3: Complete profile` $\rightarrow$ `Step 3 of 3: Select courses` $\rightarrow$ `Home`. Returning students with a finished profile skip straight from `Splash` to `Home`.

* **Screen 1 — Login (`Sign in` tab active):**

  * Brand header: `M` badge, `Mastara · ማስታራ`, subtitle `"Ethiopian University Learning Companion"`.

  * Top segmented control: `Sign in` | `Register`.

  * Inputs: `Phone or email` (e.g., `+251 911 022 344`), `Password` (masked), right-aligned link `Forgot password?`.

  * Primary CTA: `Sign in` (Royal Blue); secondary outline CTA: `Create new account`.

  * Offline info card at bottom: *"Works offline. Your account is saved on this phone until you buy a bundle."*

  * **Forgot password behaviour (`DR-06`):** If account state is `LOCAL_ONLY`, tapping `Forgot password?` opens a modal explaining that local-only passwords are stored exclusively on the phone and cannot be recovered remotely, offering an option to reset and create a new local account (with an explicit warning that local progress will be erased). If `REGISTERED_REMOTE`, it initiates a server-side OTP reset flow via verified phone or email.

* **Screen 2 — Register (`Register` tab active):**

  * Inputs: `Full name` (e.g., `Abebe Kebede`), `Email or phone number`, `Password`, `Confirm password`.

  * Primary CTA: `Create local account`.

  * Offline info card: *"Saved on this phone. Server registration happens only after payment."*

* **Screen 3 — Complete Profile (`Step 2 of 3 · Complete profile`):**

  * Header: `"Set up your profile"`.

  * Selectors populated from the bundled/local catalog:

    1. `University` (e.g., `BDU · Bahir Dar University`)

    2. `Department / Program` (e.g., `Freshman Department`)

    3. `Semester` (pill toggle: `Semester 1` | `Semester 2`)

    4. `Academic stream` (pill toggle: `Natural` | `Social`)

  * Info card: *"Next: pick your courses, then you land on Home."*

  * Primary CTA: `Continue to Home` (proceeds through `Step 3 of 3: Select courses` on first launch, where the student picks their initial `My Courses` list from their stream + Common courses).

### 9.2 Navigation and Information Architecture

* **Bottom navigation bar (4 tabs):** `Home`, `Course`, `Progress`, `Profile`. Visible on top-level tabs and main course/exam browse views; hidden inside active timed exam runners to prevent accidental exit.

* **Information hierarchy:**
  

  $$
  \text{University} \rightarrow \text{Program} \rightarrow \text{Semester} \rightarrow \text{Course (Stream / Common)} \rightarrow \text{Material} \mid \text{Tests} \mid \text{Exams}
  $$

  
  `COC Exam` sits beside the course tree as a standalone module launched from its dedicated card on `Home`.

### 9.3 Home Tab, adaptive states and five-card map (`D7`, `DR-02`)

* **Header:** Greeting `"Hello, <First Name>"`, subtitle `"Keep learning, your future is bright"`, connectivity/account status pill, and user avatar initial circle (`A`).

* **Five-card map (one destination each):**

  1. **Learning Status / Hero Card:**

     * *Enrolled / Active state:* Royal Blue card with progress ring (e.g., `60%` Amber arc), `"LEARNING STATUS"`, current course name (`Communicative English`), and chapter progress (`Chapter 2 · 4 of 5 done this week`). Tapping opens the `Progress` tab.

     * *Local-only state:* Dark Navy card `"Unlock your courses — Buy a bundle to open all content"` with full-width Amber CTA `See bundles` (opens Store).

     * *Payment pending state:* Amber-bordered soft card `"Payment pending — Admin is checking your receipt. Free content is open meanwhile."`

     * *Expiring state:* Royal Blue card `"Bundle expires in 7 days — Renew to keep downloads open"` with `Renew` chip.

  2. **Courses mini-card (`My Courses`):** Shows enrolled count (e.g., `4 enrolled`). Tapping opens the `Course` tab (`My Courses`).

  3. **Payment Alerts mini-card (`Payment`):** Shows live order status (`1 pending`, `No order`, `None`). Tapping opens the `Payment Alerts` screen.

  4. **Store Status mini-card (`Store`):** Shows entitlement summary (`Active · 128d`, `No bundle`, `Awaiting`, `Expiring`). Tapping opens the `Subscription and store` screen.

  5. **COC Exam card:** Dark Navy full-width card with Amber trophy icon, title `COC Exam`, subtitle adaptive by state (`"Test your knowledge across all courses"`, `"1 free sample set"`, or `"Downloaded set ready"`). Tapping opens the standalone `COC Exam` module.

* **Offline banner:** When offline, a Dark Navy banner appears above the hero card: `"You are offline. Downloaded items still open."`

* **Recently accessed section (`DR-02`):** Listed on the design sheet below the `COC Exam` card (`See all`, showing recent course chapters/notes). Per `D6` and `DR-02`, this is held out of `P0` pending product-owner confirmation (`Q24`).

### 9.4 Payment Alerts and Store Status screens

* **Payment Alerts screen (`< Payment Alerts`):**

  * Filter pills: `All` | `Orders` | `Expiry`.

  * Chronological alert cards with status icons:

    * `Receipt under review` (e.g., `Semester Bundle · 200 ETB`)

    * `Payment approved` (`Access active for 180 days`)

    * `Bundle expires in 7 days` (`Renew to keep your downloads open`)

    * `Receipt not accepted` (`Photo unclear. Fix and resubmit.`)

  * Push notice banner: *"You will also get a push notification when Admin approves."*

  * Bottom outline CTA: `View order status`.

* **Subscription and Store Status screen (`< Subscription and store`):**

  * **Active Bundle card (Dark Navy):** Shows `ACTIVE BUNDLE`, product title (`Semester Bundle`), `Active` Amber badge, circular countdown ring (`128d`), `"Started on approval · Expires in 128 days · 7 courses covered"`.

  * **Extra courses list:** Lists individually purchased extra single courses with their own independent remaining duration (e.g., `Logic — 38 days left`).

  * **Pending orders indicator:** Shows `Pending orders: none` (or active pending order summary).

  * **Bottom CTAs:**

    * Primary Royal Blue button: `+ Buy extra courses` (enabled when student holds an active qualifying bundle and `singleCoursesEnabled` is true).

    * Secondary button: `Renew bundle · opens in last 14 days` (disabled until remaining duration $\le \text{renewalWindowDays}$, default $14\text{ days}$ per `DR-11`).

### 9.5 My Courses and Course Shell

* **My Courses screen (`Course` tab):**

  * Search input: `Search your courses...` (filters locally in real time).

  * Filter pills: `All` | `Ongoing` | `Completed`.

  * Course cards: Display course title, stream & semester subtitle (e.g., `Natural · Common`, `Natural · Sem 1`, `Common · Sem 1`), and access badge (`Included`, `Free`, `Locked`, `Downloaded`).

  * Bottom dashed button: `+ Add or remove courses` (allows editing the student's selected courses within their scope).

* **Course Shell (`< Course Name`):**

  * Top primary segmented tabs: `Material` | `Tests` | `Exams`.

  * Secondary pill sub-tabs depend on the selected primary tab:

    * Under `Material`: `Modules` | `Notes` | `Amharic` (`DR-08`).

    * Under `Tests`: `Quiz 1` | `Quiz 2` | `Quiz 3`.

    * Under `Exams`: `Mid` | `Final` | `Mock`.

### 9.6 Material Flow: Modules, Notes and Amharic (`D8`, `D11`)

All three Material sub-tabs (`Modules`, `Notes`, `Amharic`) follow a consistent **3-step hierarchy**:

1. **Step 1 — Books / Collections List:**

   * *Modules:* Shows header `"Course Books & Modules — Select a book to view chapters · N books"` and cards such as `M1 Core Curriculum` (`6 Ch`), `M2 Reference & Solved Cases` (`4 Ch`), `M3 Pre-Exam Blueprint` (`3 Ch`).

   * *Notes:* Shows `"Notes for <Course> · tap one to open its chapters"` and cards such as `N1 Lecture Notes` (`4 chapters`, `Open`), `N2 Summary Notes` (`3 chapters`, `Open`), `N3 Exam Notes` (`3 chapters`, `Locked`).

   * *Amharic:* Shows `"Amharic for <Course> · tap one to open its chapters"` and Amharic note collections such as `A1 የትምህርት ማስታወሻ` (`4 chapters`, `Open`), `A2 ማጠቃለያ` (`3 chapters`, `Open`), `A3 የፈተና ማስታወሻ` (`3 chapters`, `Locked`). Amharic items are standalone content entities; there is no in-reader language toggle (`D8`).

2. **Step 2 — Chapters List (`< Back to Books` / `< Notes list` / `< Amharic list`):**

   * Header card with collection title and chapter count (`4 chapters inside · tap a chapter`).

   * Chapter rows numbered $1 \dots N$, each showing chapter title and right-aligned badge/action chip (`Done`, `Open`, `Download`, `Downloaded`, `Locked`).

   * Full-width Amber CTA button at bottom of list (where course-level bulk download is supported): `Download course · 18 MB`.

3. **Step 3 — Scroll-First Reader:**

   * Top bar: `< Course / Collection`, right badge (`Downloaded` or `Ch 1`).

   * Header: Category label, Chapter title (`Chapter 1: Foundations & Course Overview`), intro summary.

   * Body: Scroll-first clean typography, dashed-border formula callout boxes (rendered via shared math renderer per `NFR-18`, e.g., $f'(x) = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}$), and bordered key-idea summary cards.

   * Footer: Reading progress bar and action buttons (`Back to Book` + `Take Quiz` on Modules, or full-width Royal Blue `Next chapter` button on Notes and Amharic Notes).

### 9.7 Tests Flow: Quiz 1, Quiz 2 and Quiz 3 (`DR-05`)

`Quiz 1`, `Quiz 2`, and `Quiz 3` are practice tests with immediate per-question feedback and work identically to Modules/Notes using a **3-step hierarchy**:

1. **Step 1 — Quiz Books List (`1 · Quiz 1/2/3 list`):**

   * Lists quiz books/collections for the selected quiz tab (e.g., `Q1 Quiz Book A — 4 chapters` with `Open` badge, `Q1 Quiz Book B — 3 chapters` with `Open`, `Q1 Quiz Book C — 3 chapters` with `Locked`).

2. **Step 2 — Quiz Chapters List (`2 · Quiz 1/2/3 chapters`):**

   * Lists chapters inside the selected quiz book (`1 Parts of Speech`, `2 Sentence Structure`, `3 Problem Solving`, `4 Advanced Review`).

   * Subtitle shows question count and optional duration (`12 questions · 10 min` when `Time Allowed` is configured on the set, or `10 questions` only when untimed per `DR-05` / `Q13`).

   * Right badge shows `Start`, `Resume`, `Open`, `Download`, `Free`, or `Locked`.

3. **Step 3 — Practice Question Runner (`3 · Chapter questions`):**

   * Header: `< Quiz 1 · Ch 2` and progress pill `3 / 12` with horizontal progress bar.

   * Question stem in bold Navy Ink.

   * Option cards (`A`, `B`, `C`, `D`). When the student taps an option, the selected card highlights with an Amber border and label (`B goes · Your answer`), and an explanation card immediately appears below the options (`"Correct. With she, he or it the verb takes -s."`).

   * Bottom full-width Royal Blue CTA: `Next`.

### 9.8 Exams Flow: Mid, Final and Mock (`D12`, `D13`)

Unlike Material and Quizzes, the `Exams` tab (`Mid` | `Final` | `Mock`) has **no intermediate book or chapter list** — it opens the exam sets list directly:

1. **Step 1 — Exam Sets List:**

   * `Mid` lists university mid-semester exam sets (e.g., `AASTU · Mid 2024 — 20 questions · 40 min` with `Free`, `BDU · Mid 2024` with `Downloaded`/`Open`, `AAU · Mid 2023` with `Locked`).

   * `Final` lists university final exam sets (`AASTU · Final 2023`, `BDU · Final 2023`, `AAU · Final 2023`).

   * `Mock` is not tied to a single university exam; it lists curated mock exam sets (`Mock Exam 1`, `Mock Exam 2`, `Mock Exam 3`).

2. **Step 2 — Start Exam Confirmation Sheet:**

   * Tapping an unlocked exam set raises a bottom confirmation sheet displaying the exam title (`AASTU · Mid`), metadata (`2024 · 20 questions · 40 min · timer starts on Start`), and a full-width Amber CTA button `Start exam`. Tapping a locked exam opens `LockedContentSheet` (`PAY-01`).

3. **Step 3 — Timed Exam Runner:**

   * Top bar: `< Exam Set Title` and dark navy monotonic countdown timer pill (`42:15`).

   * Subtitle: `Question 7 of 20`.

   * Question stem and option cards (`A`, `B`, `C`, `D`). Selecting an option marks it without revealing correctness or explanations during the timed run.

   * Navigation row: `Previous` (outline) and `Next` (Royal Blue).

   * Bottom full-width Amber button: `Submit exam`.

   * Auto-submits when the monotonic timer reaches `00:00`. Following submission, the student is taken to the Exam Result and `Review answers` flow.

### 9.9 Standalone COC Exam Flow (`D15`, `DR-07`)

* **Step 1 — COC Sets List (`< COC Exam`):**

  * Opened exclusively from the `COC Exam` card on `Home`.

  * Subtitle: `"Questions from all courses in one place."`

  * Top mode toggle pills: `Practice` | `Timed exam`.

  * Set cards: `COC Set 1` (`Mixed courses · Downloaded`, `Free sample` Amber badge), `COC Set 2` (`Mixed courses · Tap to download`, `Locked`), `COC Set 3` (`Locked`).

  * Footer notice: `"Unlock all COC sets with a bundle."`

* **Step 2 — COC Timed Exam Runner (`< COC Set 1`):**

  * Top bar with countdown timer pill (`42:15`).

  * Subtitle: `"Question 7 of 20 · timer keeps running if you leave"`.

  * Question card with options (`A`, `B`, `C`, `D`).

  * **All questions palette grid:** Numbered buttons `1` to `N` showing status at a glance using the four-colour system:

    * **Answered:** Solid Royal Blue fill with white text.

    * **Flagged for review:** Amber border/tint.

    * **Open (unanswered):** White surface with subtle border.

  * Bottom controls: `Previous` / `Next` row above full-width Amber `Submit exam` button.

* **Step 3 — COC / Exam Result Screen:**

  * Header `"Exam submitted"`, circular score ring (`16/20`), percentage summary:

    * If `LOCAL_ONLY`: `"80% · answers saved on this phone"` (`DR-07`).

    * If `REGISTERED_REMOTE`: `"80% · answers saved and synced"` (`DR-07`).

  * Three breakdown cards: `Correct` (`16`), `Incorrect` (`3`), `Skipped` (`1`).

  * Improvement chip: e.g., `"+8% better than your last attempt"`.

  * Bottom CTAs: `Review answers` (outline) and `Back to COC` / `Back to Exams` (Royal Blue).

### 9.10 Answer Review (`D12`)

* **Screen (`< Review answers`):**

  * Header bar: `"Explanations"` label on the left, global toggle pill `Hide all` / `Show all` on the right.

  * Scrollable list of all questions from the completed exam or COC attempt:

    * Each card displays the question number and stem (`1. Which word is a noun?`), the student's choice, and the correct answer (`Your answer: happiness · Correct`, or `You: go · Correct: goes` highlighted with an Amber border when incorrect).

    * Each card has an individual `Show explanation` / `Hide explanation` toggle button (or shows the explanation inline when expanded).

  * Bottom full-width Royal Blue button: `Back to Exams` (or `Back to COC`).

### 9.11 Progress Tab (`DR-03`)

* **`P1` scope (`DR-03`):**

  * Overall course mastery ring (percentage of chapters and quiz sets completed across enrolled courses).

  * Per-course progress breakdown: chapters read, practice quiz average score, exam attempts count, and saved-offline status indicators.

* **`P2` scope (`DR-02`, `DR-03`):**

  * Daily study streak chip, weekly activity bar chart, and "Continue Chapter $N$" shortcut button (held until confirmed per `Q24`, `Q25`).

### 9.12 Profile, Settings, Downloads and Device Release (`DR-12`, `DR-13`, `DR-14`)

* **Profile Header:**

  * Shows Student Name, Phone/Email, Academic scope (`University`, `Program`, `Semester`, `Stream`), and Account Status badge:

    * `LOCAL_ONLY`: Shows notice *"Your account is saved on this phone until you buy a course."* (No `MS` ID exists).

    * `PAYMENT_PENDING`: Shows `Payment pending` badge and link to order status.

    * `REGISTERED_REMOTE`: Shows assigned `MS` ID prominently (e.g., `MS0001`), bound device name, and active subscription summary.

* **Download Manager (`DWN-08`, `DWN-09`, `DR-12`):**

  * Displays storage bar (`Storage used` vs `Free space` on device).

  * Toggle: **`Download on Wi-Fi only`** (default `ON`).

  * Lists all downloaded courses and chapters with size in $\text{MB}$, status (`Ready`, `Update available`, `Downloading 45%`), and one-tap `Update` or `Delete` actions.

* **Settings (`UI-SET-01`, `D10`, `DR-13`):**

  * **UI Language:** Toggle between `English` and `Amharic` for app interface labels (`UI-SET-01`). Does not alter content items (`D8`).

  * **Theme:** `Light` / `Dark` / `System` theme selector (`D10`).

* **Device Binding & Release (`DR-14`):**

  * Registered accounts are bound to a single active device (`REG-13`).

  * **Self-release flow:** In Profile $\rightarrow$ Device Management, the student can tap `Release this device` (subject to Admin-configured cooldown/limit) to unbind the current phone before switching phones. Releasing a device immediately invalidates local paid download keys (`DWN-05`).

  * **Device Locked screen:** If a paid student signs in on a second phone while another device is still bound, the app displays the `Device Locked` screen (`DEVICE_MISMATCH_LOCKED`) with instructions to release the old device or tap `Contact Admin` for an Operations Admin device release.

### 9.13 Store and Payment Flow (`DR-10`, `DR-11`)

* **Step 1 — Store Product Selection:**

  * Tabs/cards for `Semester Bundle`, `Full Freshman Package`, `Batch Bundle`, and `Extra Single Courses`.

  * Live course selector for bundles showing selected course count, $\min/\max$ validation, `Included` badges on already covered courses, and real-time server quote breakdown (base price, discount, total in $\text{ETB}$, access duration in days).

  * If the student has no active qualifying bundle, single courses display a locked button with the message: *"Buy a semester or full bundle first to unlock single courses"* (`PUR-06`).

* **Step 2 — Payment Instructions & Receipt Upload (`DR-10`):**

  * Displays Admin-configured bank and mobile-money accounts (e.g., `CBE Mobile`, `CBE Birr`, `Telebirr`) with account name, account number, one-tap `Copy` button, and payment instructions.

  * For a first-time purchase (`LOCAL_ONLY`), prompts the student to verify their phone number and re-enter their password (`FR-A07`).

  * Input for optional/required transaction reference number and receipt image picker (camera or gallery).

  * Client-side image compression automatically scales/compresses the receipt image under the configured limit (default $300\text{ KB}$, `JPEG`/`PNG`/`WebP`) and strips EXIF metadata before upload.

  * Submitting the order transitions the local account display state to `PAYMENT_PENDING`.

### 9.14 Reading, Timers and Content Protection (`D9`, `D11`)

* **Screen-capture protection (`D9`):** Every content reader, quiz runner, exam runner, COC runner, and answer review screen activates OS-level screen-capture and screen-recording blocking (`FLAG_SECURE` on Android, screen-capture observer/blur on iOS).

* **In-memory streaming:** When an online student opens an item that is not downloaded, the payload is decrypted/held in volatile memory only and cleared when leaving the reader; the app `MAY` prefetch the next chapter into memory while reading.

* **Monotonic exam timers:** Timed exams (`Mid`, `Final`, `Mock`, `COC Timed`) use a monotonic clock anchored to start timestamp so backgrounding the app or changing the system clock cannot pause or add time.

### 9.15 Badge and Chip Vocabulary (`DR-04`)

Every catalog row uses a structured two-part badge/chip vocabulary:

1. **Access & Source Badges:**

   * `Free`: Item is accessible without payment (Amber pill).

   * `Locked` (or `Paid` with lock icon): Item requires purchase; tapping opens `LockedContentSheet` (Neutral/Navy pill with lock).

   * `Included`: Course is covered by the student's active bundle (shown in Store and My Courses).

   * `Downloaded`: Content body is stored locally and verified for offline use.

   * `Download`: Content is permitted (`Free` or entitled) and available to download for offline use.

   * `Not available offline`: Shown when the device is offline and the item has not been downloaded.

2. **State & Action Chips (Contextual):**

   * `Open`: Permitted item ready to stream or read.

   * `Start`: Permitted quiz/exam with $0$ prior attempts.

   * `Resume`: Quiz/chapter with an in-progress local attempt.

   * `Done`: Completed chapter or quiz.

### 9.16 Student App Design System: Four-Colour Palette and Typography (`D40`, `DR-01`)

* **Four-Colour Student App Palette (`DR-01`):**
  The student mobile app strictly uses four core colour families defined in `packages/ui-tokens` (plus derived surface/border tints):

  1. **Royal Blue (`primary`):** Primary action buttons, active navigation pills, active tabs, answered question tiles, progress rings, and primary brand headers.

  2. **Navy Ink (`ink`):** Primary typography, high-contrast dark cards (`COC Exam` card, `Active Bundle` card, timer pills, offline banners), and dark-mode surfaces.

  3. **White / Cool Alabaster (`surface`):** Card backgrounds, page canvases, and button contrast text.

  4. **Amber (`accent`):** Primary commercial CTAs (`See bundles`, `Submit exam`, `Start exam`, `Download course`), `Free` / `Included` / `Pending` / `Active` highlights, flagged question tiles, and selected/incorrect option borders in review.

* **No Red or Green in Student App (`DR-01`):** Correct vs incorrect states in the student app are communicated through explicit iconography ($\checkmark$ vs $\times$), typography (`Correct` vs `Incorrect`), and Royal Blue / Amber borders rather than red/green traffic-light fills.

* **Icon System:** A single consistent line/duotone icon family across all student screens.

* **Contrast & Accessibility:** All text/background pairs maintain at least a $4.5:1$ contrast ratio in both Light and Dark themes (`NFR-20`).

## 10. Admin portal

### 10.1 Shell and navigation

Dark navy sidebar, top bar with global search, page header with back link and `Preview as student` button, pill tabs matching sidebar order, white cards, bottom action bar (`Add`, `Reset`, `Save Draft`, `Submit for Review` / `Publish`) on every authoring form.

* **Sidebar order:** `Dashboard`, `Students`, `Courses`, `Content` (`Material`: `Modules`, `Notes`, `Amharic Notes`; `Tests`: `Quiz 1–3`), `Scan to PDF`, `Questions` (`Mid`, `Final`, `Mock`, `COC`), `Payments` (with `Receipts` and `Refunds` tabs), `Pricing`, `Support`, `Announcements`, `Reports`, `Audit Log`, `Admins and Roles` (Super Admin only).

* Sidebar and actions show only what the authenticated admin role may use; forbidden routes return `403` and render a `403 Forbidden` page.

### 10.2 Paid-only Students directory

* Only server-created paid students with an `MS` number appear in `Students` and student KPIs; pending orders and local-only accounts never appear (`ADM-01`, `ADM-02`).

* List and profile show `MS` number first (`MS0001`), account status, bound device, active entitlements, expiry timestamps, and permitted fields. Sensitive receipt and phone-number access is audited.

### 10.3 Receipt queue and approval

* Operations Admin sees pending receipts, order summary, selected courses, count, bundle $\min/\max$ validation, expected total, transaction reference, receipt image (via short-lived signed URL), and status.

* Approval is disabled in UI and rejected server-side if the order is invalid, the quote has expired under policy, the amount mismatches, or receipt checks fail.

* Approval performs student creation, gapless `MS` counter update, device binding, entitlement creation, and order status change atomically in a single transaction (`ADM-04`).

* Rejection requires a reason and notifies the student in `Payment Alerts` and via push notification.

### 10.4 Pricing and product settings

Super Admin configures batch, semester, and full-course products independently:

* `enabled` state, `minCourses`, `maxCourses`, `scope`, `pricingMode` (`CALCULATED` or `FIXED`), `fixedPriceETB` or `discountPercent`, `durationDays`, `renewalWindowDays` (default $14$), `singleCoursesEnabled`, qualifying bundle types, and extra-course tier rows.

* Course prices are editable with a live calculated-price preview.

* Bank and mobile-money payment methods (`provider`, `accountName`, `accountNumber`, `instructions`, `isActive`) are managed here (`DR-10`).

* Validation follows Section 6.2. Every change requires a reason and is recorded in `audit_log`.

### 10.5 Question forms, numbering and content page

* **Content page (list first):** Choose a tab (`Modules`, `Notes`, `Amharic Notes`, `Quiz 1–3`); table with filters, pagination, `Edit`, `Delete`, `Active` toggle; `Add` opens the form.

* **Test set form:** `Program`, `Semester`, `Stream`, `Course`, `Test Set ID`, `Time Allowed` (optional for quiz sets; empty means untimed per `Q13`/`DR-05`), `Access/Permission`.

* **`FR-G11`:** Question number restarts at $1$ in every exam set or quiz chapter; set automatically as the next free number; admin `MAY` change it to an unused whole number in the same set; server validates uniqueness.

* **`FR-G12`:** Global database identity (UUID/ULID) is separate and never shown as the question number.

* **`FR-G13`:** Numbers are allocated transactionally with a counter on the set; existing data is backfilled in creation order.

* **`FR-G14` (`P1`):** Deleting a question renumbers subsequent questions in the set (`Q7`).

### 10.6 Pagination standard (`FR-G40` to `FR-G44`)

* Every list endpoint accepts `page` ($\ge 1$) and `pageSize` ($1$–$100$, default $10$) and returns `{ items, page, pageSize, total, totalPages }`.

* Sorting ends with a unique deterministic tiebreaker (`id`).

* Applies to `students`, `courses`, `universities`, `programs`, `semesters`, `content`, `questions`, `exam_sets`, `payments`, `refunds`, `products`, `devices`, `entitlements`, `audit_log`, `support_tickets`, and `scan_jobs`.

* One shared table component keeps `page` in the URL query string, resets to `page = 1` on filter change, steps back when a delete empties the current page, and displays the total count. Large exports use a dedicated export endpoint (`P1`).

### 10.7 Bulk question import (`FR-G50` to `FR-G55`)

* CSV only, validated by file content bytes rather than file extension or MIME header; content starting with `%PDF` or `PK` (ZIP/XLSX) is rejected with `CSV_INVALID`.

* UTF-8 required, BOM handled cleanly so Amharic script (`ፊደል`) is preserved; header row validated against a downloadable template; every row validated before commit.

* Supports dry-run preview, downloadable row-level error report, and atomic database commit.

* Spreadsheet formula injection prevention: cells starting with `=`, `+`, `-`, or `@` are neutralised.

* Enforces file size and row count limits; every import is audited; automated tests cover Amharic text and inline LaTeX formulas containing commas and quotes.

### 10.8 Design consistency (`D31`, `D32`, `DR-01`)

* Both the student app and admin portal read colours, spacing, radius, and typography from `packages/ui-tokens`; no screen hardcodes a hex value (enforced via ESLint rule and CI check).

* While the student app uses the strict four-colour palette (`Royal Blue`, `Navy Ink`, `White`, `Amber`), the Admin portal retains semantic status tokens (`success`, `warning`, `danger`, `neutral`, `primary`) from `packages/ui-tokens`:

  * `Published`, `Approved`, `Active`, `Downloaded` $\rightarrow$ `success`

  * `Pending`, `In Review`, `Expiring` $\rightarrow$ `warning`

  * `Rejected`, `Expired`, `Failed`, `Revoked` $\rightarrow$ `danger`

  * `Draft`, `Inactive`, `Offline` $\rightarrow$ `neutral`

  * `Free` $\rightarrow$ `primary`

* Each course stores an `accent` name (one of eight token keys) and `icon`; the app falls back deterministically to a token derived from the course ID.

* Active content tab and active sidebar child share one colour token (`D32`). Admin portal supports Light and Dark themes with $\ge 4.5:1$ text contrast.

### 10.9 Admin management (Super Admin)

Screen to create admins, set subtype (`SUPER_ADMIN`, `ACADEMIC_ADMIN`, `OPERATIONS_ADMIN`), assign scopes (`university_id`, `program_id`, or `course_id`), deactivate accounts, reset passwords, and enforce TOTP 2FA; enforces the last-active-Super-Admin protection rule; every change is audited with actor role, scope, and reason.

## 11. Data model and API

### 11.1 Data model

| Entity | Key fields and v3.4 rules | 
| ----- | ----- | 
| **`admin_user`** | `id`, `name`, `email` (unique), `password_hash`, `admin_role` (`SUPER_ADMIN`, `ACADEMIC_ADMIN`, `OPERATIONS_ADMIN`), `totp_secret`, `is_active`, `last_login_at`. Separate table from `student`. | 
| **`admin_scope`** | `id`, `admin_id`, and one of `university_id`, `program_id`, `course_id`. | 
| **`counters`** | `name` (PK), `value` (bigint). Used transactionally for `student_ms_code` and per-set question numbering. | 
| **`student`** | `id`, `student_code` (unique, `MS0001`+ from `counters`), `local_account_id` (UUID, unique idempotency key), `full_name`, `phone`, `email`, `password_hash`, `university_id`, `program_id`, `semester`, `stream`, `bound_device_id`, `created_at`. Paid students only. | 
| **`order`** | `id`, `student_id` (nullable while `PENDING`), `local_account_id`, `claim_secret_hash`, `pending_profile_json`, `pending_password_hash`, `quote_snapshot_json`, `order_type`, `selected_course_ids`, `expected_amount_etb`, `receipt_object_key`, `transaction_reference` (unique when present), `status` (`PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`), `rejection_reason`, timestamps. | 
| **`order_item`** | `id`, `order_id`, `course_id`, `ordinal_position`, `applied_unit_price_etb`, `tier_label`. | 
| **`pricing_config`** | `id`, `version`, product configs (`SEMESTER`, `BATCH`, `FULL_PACKAGE`), `min_courses`, `max_courses`, `pricing_mode` (`CALCULATED`, `FIXED`), `fixed_price_etb`, `discount_percent`, `duration_days`, `renewal_window_days` (default $14$), `qualifies_for_singles`, `single_courses_enabled`, `extra_course_tiers_json`. | 
| **`payment_method`** | `id`, `provider_name`, `account_name`, `account_number`, `instructions`, `display_order`, `is_active` (`DR-10`). | 
| **`entitlement`** | `id`, `student_id`, `order_id`, `product_type`, `course_id`, `starts_at`, `expires_at`, `status` (`ACTIVE`, `EXPIRED`, `REVOKED`), `revoked_reason`, `revoked_at`. | 
| **`course`** | `id`, `code`, `title`, `stream`, `semester`, `price_etb`, `accent`, `icon`, `free_access`, `free_trial_count`, `content_version` (default $1$), `is_active`. | 
| **`content_item`** | `id`, `course_id`, `book_id`, `chapter_order`, `type` (`MODULE`, `NOTE`, `AMHARIC_NOTE`), `title`, `is_free`, `status` (`DRAFT`, `IN_REVIEW`, `PUBLISHED`), `authored_by`, `reviewed_by`, `content_version`, `size_bytes`, `deleted_at`. | 
| **`exam_set` / `quiz_set`** | `id`, `course_id` (nullable for `COC`), `category` (`QUIZ_1`, `QUIZ_2`, `QUIZ_3`, `MID`, `FINAL`, `MOCK`, `COC`), `book_id`, `title`, `exam_year`, `duration_minutes` (nullable for untimed quizzes), `is_free`, `status`, `content_version`, `question_count`. | 
| **`question`** | `id` (UUID), `set_id`, `display_number` (unique per set, restarts at $1$), `stem`, `options_json`, `correct_option`, `explanation`, `authored_by`, `reviewed_by`. | 
| **`refund`** | `id`, `order_id`, `status` (`REQUESTED`, `APPROVED`, `REJECTED`, `PAID_OUT`, `ENTITLEMENT_REVOKED`), `reason`, `requested_by`, `approved_by`, `payout_reference`, `amount_etb`, timestamps. | 
| **`audit_log`** | `id`, `actor_id`, `actor_role`, `actor_scope`, `action`, `target_type`, `target_id`, `previous_value_json`, `new_value_json`, `reason`, `ip_address`, `created_at`. | 

### 11.2 Core contracts (DTOs)

| Contract | Fields and behaviour | 
| ----- | ----- | 
| **`SubmitOrderWithLocalDto`** | `localAccountId`, `profile` (name, phone/email, universityId, programId, semester, stream), `password` (over TLS), `claimSecretHash`, `productType`, `courseIds`, `transactionReference`, `quoteId`, receipt file | 
| **`ClaimOrderDto`** | `claimSecret` (32-byte URL-safe string; accepted only for an `APPROVED` order matching $\text{SHA-256}(\text{claimSecret})$) | 
| **`ClaimOrderResponseDto`** | `studentCode` (`MS0001`+), `accessToken`, `refreshToken`, `entitlementToken`, `entitlements[]`, `migrationChecksum` | 
| **`PaymentSettingsDto`** | `pricingMode`, `prices`, `discounts`, `minMaxCounts`, `coursePrices`, `tierSchedule`, `singleCoursesEnabled`, `durationDays`, `renewalWindowDays`, `paymentMethods[]`, `configVersion` | 
| **`PriceQuoteDto`** | `quoteId`, `productType`, `uniqueCourseCount`, `perCourseBreakdown[]`, `baseAmountETB`, `discountAmountETB`, `totalETB`, `durationDays`, `settingsVersion`, `expiresAt` | 
| **`CatalogSnapshotDto`** | `version`, `generatedAt`, `universities[]`, `programs[]`, `courses[]`, `books[]`, `chapters[]`, `quizSets[]`, `examSets[]`, `cocSets[]`, `deletedIds[]` | 

### 11.3 API enforcement and routes

* Server calculates all amounts; checks bundle type, count range, scope, duplicates, single-course eligibility, active bundle, existing entitlements, and `singleCoursesEnabled`.

* **Key routes:**

  * `GET /catalog/snapshot?scope=&since=`

  * `POST /quotes`

  * `POST /orders`

  * `GET /orders/:orderId/status`

  * `POST /orders/:orderId/claim`

  * `GET /entitlements/token`

  * `POST /sync/up` and `GET /sync/down` (authenticated `REGISTERED_REMOTE` only)

  * `POST /devices/release`

  * `/admin/admins`, `/admin/orders`, `/admin/refunds`, `/admin/pricing`, `/admin/students/:id/devices`, `/admin/questions/import-csv`

* **Standard error codes:**

  * `ACCOUNT_EXISTS_LOGIN_REQUIRED` (replaces `PHONE_ALREADY_REGISTERED`)

  * `BUNDLE_SIZE_INVALID`

  * `SINGLE_COURSE_BUNDLE_REQUIRED`

  * `SINGLE_COURSES_DISABLED`

  * `COURSE_ALREADY_INCLUDED`

  * `PRICE_QUOTE_EXPIRED`

  * `RECEIPT_INVALID`

  * `TRANSACTION_REFERENCE_DUPLICATE`

  * `CLAIM_SECRET_INVALID`

  * `PERMISSION_DENIED`

  * `OUT_OF_SCOPE`

  * `CSV_INVALID`

  * `CONTENT_LOCKED`

  * `ENTITLEMENT_EXPIRED`

  * `DEVICE_MISMATCH_LOCKED`

### 11.4 Real data only (`D30`, `FR-G66`)

Production builds of the admin portal and student app contain no mock data or mock conditional branches. Development mocks run outside application code (e.g., MSW or Prism against shared contracts). A missing API base URL stops the admin portal at startup with a clear error. CI fails if a production bundle references any `mocks` path. Parity tests create a course in Admin and assert it appears for students and disappears when deactivated (`SYN-03`).

## 12. Non-functional requirements

`NFR-01` to `NFR-13` from v3.1 remain in force (package size $< 20\text{ MB}$, memory $< 120\text{ MB}$, local SQLite write performance, security, localization, fonts, accessibility, storage management, observability, data cost, availability, theming). Added or updated requirements for v3.4:

| ID | Area | Requirement | Acceptance Criteria | 
| ----- | ----- | ----- | ----- | 
| **`NFR-01`** | Package size | Android `arm64` download size from AAB $< 20\text{ MB}$ | CI release build size gate | 
| **`NFR-02`** | Memory | Peak RAM $< 120\text{ MB}$ on $2\text{ GB}$ Android reference phone | Android Profiler test across reader & exam runner | 
| **`NFR-04`** | Hybrid model | Structure/listings from local SQLite catalog; content bodies streamed into memory or loaded from encrypted download | Airplane-mode and memory-spy tests per access row | 
| **`NFR-14`** | Startup | Cold start under $3\text{ s}$ on the $2\text{ GB}$ reference phone, release build | Budget Android hardware measurement | 
| **`NFR-15`** | Instant lists | Catalog lists draw from local data in under $300\text{ ms}$ with no loading spinner/skeleton | Timer test; zero blocking network requests | 
| **`NFR-16`** | Online open | Streamed content item readable within $2\text{ s}$ at $\text{p95}$ on typical 3G/4G connection | Throttled-network test | 
| **`NFR-17`** | Battery / data | No fixed-interval polling; event-driven sync with exponential backoff and jitter | Code audit and network trace | 
| **`NFR-18`** | Math rendering | No separate `WebView` per paragraph; one shared renderer or pre-rendered math | Under $120\text{ MB}$ RAM on $2\text{ GB}$ phone on a $30\text{-formula}$ chapter | 
| **`NFR-19`** | Pagination | Every admin list responds in under $500\text{ ms}$ at $\text{p95}$ with $10,000$ rows | `k6` load test | 
| **`NFR-20`** | Design tokens | Zero hardcoded hex colours; contrast ratio $\ge 4.5:1$ in Light and Dark themes; student app uses 4-colour token set | ESLint rule and automated CI contrast check | 

## 13. Domain functions and tests

Pure domain functions are shared through `@mastara/domain` and executed identically by the NestJS API and Expo student app:

| Function / Area | Required behaviour and unit test coverage | 
| ----- | ----- | 
| **`canPurchaseSingleCourse`** | Returns `false` without an active qualifying bundle, if the course is already included/owned, or if `singleCoursesEnabled == false`; returns `true` only when all checks pass. | 
| **`validateBundleSelection`** | Rejects counts $< \text{minCourses}$ or $> \text{maxCourses}$, duplicate course IDs, wrong semester/stream/scope, or inactive courses; accepts exact boundary counts. | 
| **`calculateBundlePrice`** | `CALCULATED` mode sums unique course prices and applies integer-safe discount rounding; `FIXED` mode returns `fixedPriceETB`; handles zero/invalid inputs safely. | 
| **`calculateExtraCoursePrice`** | Applies the correct tier per ordinal position within the order; verifies $7\text{ extras} = 380\text{ ETB}$ under the illustrative schedule. | 
| **Quote / order consistency** | Server ignores client-submitted total; enforces quote expiry; creates auditable snapshot; subsequent price edits do not alter accepted quote/order totals. | 
| **`canOpen` / `resolveContentAccess`** | Enforces the 5-step precedence order (Section 8.1); online streams into memory; offline requires valid download + valid signed entitlement token; expired/revoked locks immediately. | 
| **`hashClaimSecret` / `verifyClaimSecret`** | Valid 32-byte secret passes constant-time hash comparison; wrong, missing, expired, or unapproved order fails; repeated valid claims are idempotent. | 
| **MS counter allocation** | $50$ concurrent approvals allocate unique gapless sequential IDs (`MS0001`–`MS0050`); forced transaction rollback leaves zero gaps; retry creates no second student. | 
| **Takeover protection** | Order with existing paid student's phone/email returns `ACCOUNT_EXISTS_LOGIN_REQUIRED` unless authenticated or OTP-verified. | 
| **Receipt endpoint** | Enforces rate limits, max $2$ pending orders per phone, magic-byte image validation (`JPEG`/`PNG`/`WebP`), max byte size, and EXIF removal. | 
| **Local-to-remote migration** | Atomically migrates SQLite rows and SecureStore keys from `localAccountId` to `MS` student identity; preserves progress, attempts, and download mappings; safe on retry. | 
| **Refund and expiry isolation** | Bundle expiry or refund revokes only entitlements linked to that bundle order; independent single-course entitlements remain active until their own `expires_at`. | 

## 14. Security, privacy and content protection

| Control | Requirement | 
| ----- | ----- | 
| **Secrets** | Token-signing secret $\ge 32$ characters with no fallback default; API refuses to boot with missing/weak secrets; no secrets, uploads, or build artifacts committed to Git; secret scanner runs in pre-commit hook and CI. | 
| **Cross-origin (CORS)** | API allows only explicitly configured origins. | 
| **Rate limits** | Applied on every route. Sign-in and registration: $5\text{ attempts/min}$ per client and identifier. Orders, claims, catalog sync, and free content streaming have dedicated limits. | 
| **Admin authentication** | Strong password policy, mandatory TOTP 2FA for Super Admin and Operations Admin, login throttling, $12\text{-hour}$ max session lifetime, `HttpOnly` + `Secure` + `SameSite` cookies with CSRF protection on mutations. | 
| **Built-in credentials** | Default/hardcoded admin credentials are never accepted; initial seed credentials must be injected via environment configuration and rotated. | 
| **Passwords** | Hashed server-side (`Argon2id` or `bcrypt`); never persisted or logged in plaintext; only a salted iterated hash is stored on the phone for offline sign-in. | 
| **Receipts** | Stored in private S3-compatible bucket, accessed only via short-lived signed URLs, verified by magic bytes, stripped of EXIF metadata, access-logged, with defined retention policy. | 
| **Personal data** | Published privacy policy, documented account/data deletion workflow, and zero transmission of unpaid local student PII to the server (`FR-A06`). | 
| **Content protection** | OS-level screenshot/recording blocking (`D9`), dynamic student watermark on paid content, short-lived signed streaming URLs, device-bound AES encryption for downloads, offline clock-rollback detection via last-seen server time and signed entitlement tokens. | 
| **Audit logging** | Immutable audit log recording role/scope changes, content publishing, price/duration/limit updates, device releases, manual access grants, refund transitions, receipt views, admin sign-ins, and denied sensitive requests. | 
| **Pricing integrity** | Only server-computed quotes are authoritative; all currency math uses integer minor units or fixed-point decimal arithmetic. | 

## 15. Functional requirement index

| ID | Priority | Requirement | Acceptance Criteria | 
| ----- | ----- | ----- | ----- | 
| **`FR-A01`–`FR-A11`, `REG-01`–`REG-16`** | `P0` | Local-first account, offline sign-in/profile, first-bundle order submission, claim-secret flow, atomic SQLite migration (Section 5) | Zero student network requests before first bundle order; airplane-mode registration/sign-in passes; claim + migration preserves all local progress | 
| **`PUR-01`–`PUR-10`** | `P0` | Bundle-first purchase rule, configurable $\min/\max$, calculated/fixed pricing, tiered extra single courses, quote snapshots (Section 6) | Single course rejected without bundle (`SINGLE_COURSE_BUNDLE_REQUIRED`); server ignores client totals | 
| **`ACC-01`–`ACC-06`, `FR-C20`–`FR-C23`** | `P0` | Instant offline catalog, shared `canOpen` function, in-memory online streaming, offline downloaded-only access (Section 8.1–8.3) | Lists render in $< 300\text{ ms}$ in airplane mode; online stream writes no content files to disk | 
| **`PAY-01`–`PAY-03`, `FR-C24`** | `P0` | Single `LockedContentSheet` paywall at Material, Tests, Exams, and COC gates (Section 8.6) | Paywall appears at all 4 gates and routes to Store with course preselected | 
| **`DWN-01`–`DWN-07`, `FR-C25`** | `P0` | Resumable per-course and per-chapter downloads, device-bound encryption, atomic version updates, `Download`/`Delete` toggle (Section 8.5) | Expired/revoked entitlement or R15 Free\$\\rightarrow$Paid transition blocks opening downloaded file offline | 
| **`DWN-08`–`DWN-09`** | `P1` | **`[UI]`** Download Manager screen with storage breakdown and "Download on Wi-Fi only" toggle (Section 8.5, 9.12) | Wi-Fi toggle blocks cellular download until overridden; storage metrics match disk usage | 
| **`SYN-01`–`SYN-03`, `OFF-01`–`OFF-05`** | `P0` | Event-driven bidirectional sync (catalog/versions down; progress/attempts/outbox up after registration) (Section 8.4) | No fixed-interval polling; outbox flushes only when `REGISTERED_REMOTE` | 
| **`UI-SET-01`** | `P1` | **`[UI]`** App UI language toggle (`English` / `Amharic`) in Settings (Section 3.3 `DR-13`, 9.12) | Switches UI chrome labels without altering course content items (`D8`) | 
| **`FR-UI-01`–`FR-UI-10`** | `P0` | **`[UI]`** Student app screen flows (`Auth`, `Home` 5-card map & adaptive states, 3-step `Material` & `Quiz 1–3`, direct `Mid/Final/Mock` exams, standalone `COC` with question palette, `Review answers` with `Show/Hide`) (Section 9) | Matches UI design baseline and Section 3.3 reconciliation rules | 
| **`FR-G11`–`FR-G14`** | `P0` | Per-set question numbering restarting at $1$, separate from global DB ID (Section 10.5) | Concurrent question creations in same set receive unique sequential display numbers | 
| **`FR-G40`–`FR-G44`** | `P0` | Standard pagination envelope across all admin lists (Section 10.6) | Filter changes reset to page $1$; deleting last item on page steps back | 
| **`FR-G45`–`FR-G48`, `ADM-01`–`ADM-04`** | `P0` | Gapless `MS0001`+ student IDs allocated only on first bundle approval; paid-only Admin Students directory (Section 5.7, 10.2) | $50$ concurrent approvals + forced rollback produce zero gaps; unpaid users absent from Admin | 
| **`FR-G50`–`FR-G55`** | `P0` | Content-validated UTF-8 CSV bulk question import with dry run and formula-injection sanitization (Section 10.7) | Renamed `.pdf`/`.xlsx` rejected (`CSV_INVALID`); Amharic and LaTeX import cleanly | 
| **`FR-G60`–`FR-G63`** | `P0` | Three admin subtypes, scope-filtered queries, maker-checker publishing, last-Super-Admin protection (Section 4, 10.9) | Every admin endpoint verified against permission matrix; author cannot publish own item | 
| **`FR-G64`** | `P1` | Refund state machine and order-scoped entitlement revocation (Section 7.2) | Refunding bundle revokes bundle entitlements while preserving independent single courses | 
| **`FR-G65`–`FR-G66`** | `P0` | Shared `packages/ui-tokens` (4-colour student palette, semantic admin tokens) and zero mock data in production (Section 9.16, 10.8, 11.4) | Lint + CI bundle checks pass with zero hardcoded hex values and zero mock imports | 

## 16. Quality gates and acceptance criteria

### 16.1 Release gates

| Gate | Pass condition | 
| ----- | ----- | 
| **Offline account** | Register, sign in, and edit profile in airplane mode; network spy shows zero student data sent; identifier-only sign-in fails (`FR-A01`–`FR-A06`). | 
| **Catalog offline** | With no connection on first launch, every list renders from the bundled seed in $< 300\text{ ms}$ with accurate badges (`NFR-15`). | 
| **Access matrix** | Every row of Section 8.2 behaves as written; online stream leaves zero files on disk; expired entitlement stops downloaded paid items offline. | 
| **Paywall** | `LockedContentSheet` appears at Materials, Exams, Tests, and COC gates; `Purchase Course` opens Store with course preselected. | 
| **UI baseline `[UI]`** | Student app implements the 4-colour system (`Royal Blue`, `Navy Ink`, `White`, `Amber`), 3-step `Modules`/`Notes`/`Amharic`/`Quiz 1–3` flows, direct `Mid`/`Final`/`Mock` lists, standalone `COC` runner, and `Show`/`Hide` answer review. | 
| **Pagination** | Every admin list pages deterministically under filters; deleting the last row on a page steps back cleanly. | 
| **CSV import** | `.pdf`/`.xlsx` renamed to `.csv` is rejected; Amharic and LaTeX with commas/quotes import accurately; dry run mutates nothing. | 
| **Student IDs** | $50$ concurrent approvals produce gapless `MS` IDs; forced transaction failure leaves no gap. | 
| **Question numbers** | Restart at $1$ per exam set or quiz chapter; concurrent creates never duplicate. | 
| **Permissions** | Every admin route called as each role (`Super`, `Academic`, `Operations`); out-of-scope access and self-publishing are rejected with `403`. | 
| **Security** | API refuses to boot without strong secret; unlisted CORS origin rejected; clean secret scan; zero mock code in production bundles. | 
| **Performance & size** | `arm64` download $< 20\text{ MB}$; RAM $< 120\text{ MB}$ on $2\text{ GB}$ reference phone; cold start $< 3\text{ s}$. | 

**Verification tooling:** Playwright (Admin portal E2E); Maestro or Detox on a budget Android reference device; `k6` for payment, sync, and pagination load tests; secret scanner in pre-commit hook and CI.

### 16.2 End-to-end acceptance criteria

 1. Register a student in airplane mode; local UUID (`localAccountId`) exists and zero student profile requests are sent to the API.

 2. Attempt a single-course purchase as a local-only student; UI shows locked state and API returns `SINGLE_COURSE_BUNDLE_REQUIRED`.

 3. Select a bundle below $\min$ and above $\max$; both are rejected by app and API (`BUNDLE_SIZE_INVALID`); boundary counts are accepted.

 4. Change a course price or tier in Admin; a fresh quote uses the new settings while an existing valid quote snapshot remains unchanged.

 5. Submit a valid first bundle order with a receipt; this is the first student contact with the server; student stays local-only (`PAYMENT_PENDING` display state) and absent from Admin `Students` while pending.

 6. Approve the receipt as Operations Admin; one `Student`, one `MS` number, device binding, and entitlement (`starts_at = approval_timestamp`) are created in a single transaction.

 7. Force a transaction failure during approval: no `MS` number gap occurs. Run $50$ concurrent approvals: uniqueness and gapless sequence hold.

 8. Claim the approved order from the app using `claimSecret`; repeated claims return the same `MS` number; wrong secret is rejected (`CLAIM_SECRET_INVALID`).

 9. Submit an order using a phone/email that already belongs to a paid student; server rejects silent linking with `ACCOUNT_EXISTS_LOGIN_REQUIRED`.

10. Verify local SQLite and SecureStore records migrate atomically from `localAccountId` to the server `MS` student identity before `REGISTERED_REMOTE` sync begins.

11. With an active qualifying bundle and singles enabled, purchase $7$ extra courses; ordinal tier calculation matches server quote; already covered courses show `Included` and cannot be bought again (`COURSE_ALREADY_INCLUDED`).

12. Disable `singleCoursesEnabled` in Admin; new extra-course orders fail in app and API (`SINGLE_COURSES_DISABLED`) while existing entitlements remain usable.

13. Open permitted content online without downloading; verify content is streamed into memory only and not written to disk. Tap `Download` (per course or per chapter) and verify it opens in airplane mode.

14. Flip a downloaded free item to Paid in Admin (`R15`) or expire/revoke an entitlement; on next sync or token expiry, the file stays on disk but refuses to open until purchased/renewed.

15. Expire or refund a bundle; bundle-covered access stops immediately, while separately purchased extra courses remain accessible until their own `expires_at`.

16. Publish a new `content_version` in Admin; student app shows `Update available` on foreground/pull-to-refresh; simulate a mid-download failure and verify the previous local copy remains intact and readable.

17. Run the full monorepo unit, integration, and E2E suite: zero failures, zero hardcoded hex colours, and zero mock code in production builds.

## 17. Implementation roadmap

| Phase | Scope | Exit Gate | 
| ----- | ----- | ----- | 
| **Phase 0 — Baseline** | Monorepo baseline assertions; `SyncProvider` performance and test harness fixes | Full monorepo test suite passes with zero failures | 
| **Phase V — Verify** | Re-verify earlier work against Section 16 release gates | Gate checklist green or delta items logged | 
| **Phase 1 — Domain, Contracts & Schema** | `@mastara/domain` pure functions (`canOpen`, pricing, eligibility, claim secret), DTOs, Prisma/SQL migrations (`admin_user`, `admin_scope`, `counters`, `pricing_config`, `payment_method`, `refund`), role/scope guards, 2FA, `packages/ui-tokens` (4-colour student tokens + semantic admin tokens) | $100\%$ unit test pass on domain functions; schema migration & rollback verified; `FR-G60`–`FR-G63`, `FR-G65` pass | 
| **Phase 2 — API, Approval & Claim** | Quote engine, order hardening, receipt validation/EXIF stripping, transactional `MS` counter, atomic approval, idempotent claim endpoint, takeover protection, `/catalog/snapshot`, `/entitlements/token` | Integration tests for pricing, idempotency, counter rollback, claim security, and takeover protection pass | 
| **Phase 3 — Mobile Lifecycle & UI Shell** | Offline-first local registration/sign-in/profile (`Auth and Profile` sheets), 4-colour theme, `Home` 5-card map & adaptive states, local SQLite + seed catalog, Store UI, receipt compression, claim polling, atomic SQLite migration, `LockedContentSheet` | Offline-to-approved-claim flow passes on budget Android build; `FR-C20`–`FR-C24` pass | 
| **Phase 4 — Content, Streaming, Runners & Downloads** | 3-step `Modules`/`Notes`/`Amharic` reader (in-memory streaming + shared math renderer), 3-step `Quiz 1–3` runner, direct `Mid`/`Final`/`Mock` exam runner, standalone `COC` runner with palette, `Show`/`Hide` answer review, resumable encrypted per-course/per-chapter downloads, Download Manager (`DWN-08`, `DWN-09`) | Online memory-only stream, offline encrypted download, clock-rollback check, atomic update, and `R15` tests pass | 
| **Phase 5 — Admin Workflows** | Paid-only `Students` directory, receipt approval queue, independent bundle/tier/payment-method settings, refund workflow, maker-checker review flow, per-set question numbering, content-checked CSV import, universal pagination | Role/permission matrix and Playwright E2E approval/import/pagination tests pass (`FR-G11`–`FR-G55`, `FR-G64`) | 
| **Phase 6 — End-to-End Hardening & Pilot** | Bidirectional sync conflict tests, device self-release & admin release, performance/memory profiling on $2\text{ GB}$ Android phone, AAB size verification ($< 20\text{ MB}$), university freshman pilot | All Section 16.1 & 16.2 gates green; `NFR-01`–`NFR-20` met | 

## 18. Risks and edge cases

| ID | Risk / Edge Case | Mitigation | 
| ----- | ----- | ----- | 
| **`R15`** | A free item becomes paid while a copy is downloaded on a student's phone | Next catalog sync updates the local flag and flips the badge to `Locked`; the file stays on disk but `canOpen` denies access until the student purchases the course. | 
| **`R16`** | Catalog becomes stale after prolonged offline use | Display last-updated timestamp in Profile/Catalog; delta `since` versioning keeps the next sync payload tiny. | 
| **`R17`** | Two phones register the same phone number offline and later submit orders | First approved order claims the identity; subsequent order with the same phone/email is halted with `ACCOUNT_EXISTS_LOGIN_REQUIRED` and prompted to sign in or contact Admin. | 
| **`R18`** | Super Admin account compromise | Mandatory TOTP 2FA, $12\text{-hour}$ session cap, at most $2$–$3$ Super Admin accounts, immutable audit logging, and last-active-Super-Admin deletion lock. | 
| **`R19`** | Receipt images or student PII leak | Private object storage, short-lived signed URLs, EXIF stripping, role-based field minimisation (Academic Admin sees zero PII), and audited views. | 
| **`R20`** | Bundled seed catalog pushes Android download over $20\text{ MB}$ | Seed contains structure metadata only (no content bodies), capped near $150\text{ KB}$ compressed, guarded by CI size gate. | 
| **`R21`** | Chapters with many mathematical formulas exhaust RAM on $2\text{ GB}$ devices | `NFR-18`: forbid per-paragraph `WebView` instances; use a single shared math renderer or pre-rendered SVG/KaTeX layout. | 
| **`R22`** | Manual payment receipt review backlog during semester start | Queue age KPIs on Operations dashboard, rapid side-by-side receipt verification UI, and clean architecture seam for future automated gateway integration. | 
| **`R23`** | Stale or client-manipulated order totals | Server calculates all quotes with expiration timestamps; order snapshots unit prices; client-submitted totals are ignored. | 
| **`R24`** | Unpaid student loses phone or uninstalls app | Accepted behaviour (`REG-15`); explicit warning banner shown on Login, Register, and Profile screens. | 
| **`R25`** | Claim secret brute-force or interception | $256\text{-bit}$ random secret generated on device; only $\text{SHA-256}(\text{claimSecret})$ sent at order creation; TLS-only transport; strict rate limiting and audit on `/claim`. | 
| **`R26`** | Student rolls back device clock offline to extend expired bundle | App records monotonically advancing `lastSeenServerTime` and verifies server-signed entitlement tokens; rollback triggers immediate offline lock until online token refresh. | 

## 19. Decisions and assumptions to approve

| Topic | Recommended Decision in v3.4 | Rationale | 
| ----- | ----- | ----- | 
| **Hybrid connectivity model** | Offline-first for structure (accounts before purchase, catalog, badges); online-first for content bodies (stream to memory, optional download); server-authoritative for money, IDs, entitlements | Resolves `OFF-01` vs `D5` wording and matches low-bandwidth Ethiopian freshman usage | 
| **Payment confirmation** | Manual receipt approval at launch; `MS` number assigned at approval | Prevents unpaid accounts from polluting the server database or consuming `MS` IDs | 
| **Bundles unlocking singles** | Batch, semester, and full-course all qualify unless Super Admin disables a type | Flexible and consistent across universities | 
| **Bundle pricing** | Calculated mode (sum of course prices minus discount) or Fixed mode override | Supports both fixed $200/350\text{ ETB}$ packages and dynamic per-course pricing | 
| **Extra single-course price** | Tiered unit prices by ordinal position within the order | Predictable student preview and auditable server calculation | 
| **Course count limits** | Separate $\min/\max$ settings for batch, semester, and full-course | Avoids forcing semester $7$–$10$ limits onto batch or full packages | 
| **Access start time** | Approval timestamp (`starts_at = approval_timestamp`) | Fair to students when manual review takes time | 
| **Bundle expiry / refund** | Affects only entitlements created by that bundle order | Protects separately purchased extra courses | 
| **Gapless student IDs** | Transactional `counters` table row (`MS0001`+) | Guarantees strict gapless sequence even when transactions roll back | 
| **Student UI colour system** | Four-colour palette (`Royal Blue`, `Navy Ink`, `White`, `Amber`) on student app; semantic tokens on Admin portal (`DR-01`) | Matches completed UI design sheets while preserving admin operational clarity | 

## 20. Open questions

| \#        | Question                                                                                                                                                                                     | Assumption / Default Used in v3.4                                                                                                 |     |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --- |
| **`Q7`**  | When a question is deleted in Admin, renumber subsequent questions or keep the gap?                                                                                                          | Renumber subsequent questions in the set (`FR-G14`).                                                                              |     |
| **`Q11`** | How many Super Admins, and above whatETB threshold do refunds/manual grants require Super Admin approval?                                                                                    | $2$–$3$ Super Admins; threshold configurable by Super Admin.                                                                      |     |
| **`Q12`** | Refund eligibility policy: who is eligible, within what window, full or partial?                                                                                                             | Workflow is built (`Section 7.2`); policy parameters are Super Admin configurable.                                                |     |
| **`Q13`** | Do quiz sets carry `Time Allowed`?                                                                                                                                                           | Optional; when set, shown as `12 questions · 10 min`; when empty, untimed (`DR-05`).                                              |     |
| **`Q14`** | What replaces the legacy Free Content widget on the Admin Students page?                                                                                                                     | Replaced by active entitlements and order history summary (since Admin directory is paid-only).                                   |     |
| **`Q15`** | May a senior Academic Admin publish content, or only Super Admin?                                                                                                                            | Super Admin by default, with optional `Reviewer` permission grant to senior Academic Admins (never for their own authored items). |     |
| **`Q16`** | At what hierarchy levels can an Academic Admin be scoped?                                                                                                                                    | University, Program, or individual Course (`admin_scope`).                                                                        |     |
| **`Q17`** | May unpaid (`LOCAL_ONLY`) students download free items for offline use?                                                                                                                      | **Yes** — free items can be downloaded for offline use (`Section 8.2`, `8.5`).                                                    |     |
| **`Q18`** | Is the Amharic paywall wording approved?                                                                                                                                                     | Pending native linguistic review before release.                                                                                  |     |
| **`Q19`** | Which universities and programs are included in the bundled seed catalog?                                                                                                                    | All published universities, programs, and courses active at release build time.                                                   |     |
| **`Q20`** | Which identifier signs a local account in?                                                                                                                                                   | Either phone number or email address (`DR-09`).                                                                                   |     |
| **`Q21`** | What are the default quote expiry duration and bundle renewal window?                                                                                                                        | Quote expiry configurable (default $24\text{ hours}$); renewal window default $14\text{ days}$ (`DR-11`).                         |     |
| **`Q22`** | Is receipt amount matching automatic (OCR) or visual by Operations Admin?                                                                                                                    | Visual verification by Operations Admin against the stored server quote snapshot at launch.                                       |     |
| **`Q23`** | **`[UI]`** Confirm the four-colour student palette (`Royal Blue`, `Navy Ink`, `White`, `Amber` with no red/green) while keeping semantic tokens in Admin (`DR-01`)?                          | **Used as baseline in v3.4** (Section 9.16 & 10.8).                                                                               |     |
| **`Q24`** | **`[UI]`** Should the Home "Recently accessed" list and Progress "Continue Chapter 2" button shown in the design sheets be included in `P1`/`P2`, or removed permanently per `D6` (`DR-02`)? | Held out of `P0` until confirmed.                                                                                                 |     |
| **`Q25`** | **`[UI]`** Confirm the split of Progress tab widgets (`P1`: mastery ring, chapters done, quiz average, offline indicators; `P2`: streak chip and weekly bars) (`DR-03`)?                     | **Used as baseline in v3.4** (Section 9.11).                                                                                      |     |
| **`Q26`** | **`[UI]`** Confirm the two-mode "Forgot password?" behaviour (offline data-loss reset notice for `LOCAL_ONLY` vs OTP server reset for `REGISTERED_REMOTE`) (`DR-06`)?                        | **Used as baseline in v3.4** (Section 9.1).                                                                                       |     |

## Appendix A. Glossary

| Term | Definition | 
| ----- | ----- | 
| **`LOCAL_ONLY`** | Student account state that exists solely in local device storage before the first bundle order is approved and claimed. | 
| **`PAYMENT_PENDING`** | Display state for a `LOCAL_ONLY` student who has submitted their first bundle order and receipt and is awaiting Operations Admin approval. | 
| **`REGISTERED_REMOTE`** | Student account state after Operations Admin approves the first bundle order and the app claims the account using `claimSecret` and migrates local data. | 
| **`localAccountId`** | Random UUID generated offline on the phone; serves as the local primary key before registration and the idempotency key for the first order. | 
| **`claimSecret` / `claimSecretHash`** | Cryptographically random $256\text{-bit}$ secret kept on the phone and its $\text{SHA-256}$ hash sent with the first order, used to prove ownership and claim the `MS` account after approval. | 
| **`MS` Number (`studentCode`)** | Gapless sequential identifier (`MS0001`, `MS0002`, $\dots$) allocated transactionally when a student's first qualifying bundle order is approved. | 
| **Hybrid Connectivity Model** | Architectural principle wherein Mastara is offline-first for structure (catalog, titles, badges, local account before purchase) and online-first for content bodies (streamed into memory unless downloaded), while money, IDs, prices, entitlements, and expiry are server-authoritative. | 
| **Catalog** | Structural metadata of universities, programs, courses, books, chapters, and quiz/exam/COC sets without content bodies. | 
| **Seed Catalog** | Compressed snapshot ($\le 150\text{ KB}$) of the catalog bundled inside the mobile app binary so first launch works in airplane mode with zero loading states. | 
| **`canOpen`** | Shared pure domain function in `@mastara/domain` used by both client and server to evaluate whether a student can open a given content item. | 
| **Entitlement** | Server-authoritative record granting a student access to a course from `starts_at` (approval timestamp) to `expires_at` (`starts_at + durationDays`). | 
| **Qualifying Bundle** | An active batch, semester, or full-course bundle that registers the student and unlocks the ability to purchase extra single courses. | 
| **Quote** | Server-computed, time-limited price breakdown snapshotted onto an order at submission. | 
| **Scope** | The specific university, program, or course(s) an `Academic Admin` is permitted to view and edit. | 
| **Maker-Checker** | Publishing rule requiring that the admin who publishes a content item or exam set must be a different person from the author who created/edited it. | 

## Appendix B. Final acceptance checklist

* \[ \] Android `arm64` download size under $20\text{ MB}$; peak memory under $120\text{ MB}$ on $2\text{ GB}$ reference phone; cold start under $3\text{ s}$.

* \[ \] Local account creation, sign-in, and profile setup work $100\%$ offline in airplane mode; zero student PII sent to the server before the first bundle order.

* \[ \] First server contact occurs when the student submits the first bundle order with a receipt; `MS` number is created on Admin approval; student becomes `REGISTERED_REMOTE` only after claiming with `claimSecret` and migrating local SQLite data.

* \[ \] All catalog lists render instantly ($< 300\text{ ms}$) and offline from local SQLite + bundled seed with accurate badges (`Free`, `Locked`, `Downloaded`, `Download`, `Included`, `Not available offline`).

* \[ \] Online students stream permitted content bodies into memory only (nothing written to disk unless `Download` is tapped); free and paid items support per-course and per-chapter download.

* \[ \] Paid downloads are encrypted, device-bound, and verified offline via a server-signed token; expired, revoked, or Free\$\\rightarrow$Paid (`R15`) items stay on disk but refuse to open.

* \[ \] Event-driven bidirectional sync (triggers: profile saved, app foregrounded, connection restored debounced, pull to refresh; backoff with jitter, no fixed polling); atomic content version replacement on `Update available`.

* \[ \] Single `LockedContentSheet` paywall component used at all four content gates (`Material`, `Tests`, `Exams`, `COC`) with `Purchase Course` routing to Store.

* \[ \] Server-calculated quotes, configurable bundle $\min/\max$, tiered ordinal extra-course pricing, and single-course purchases gated behind an active qualifying bundle.

* \[ \] Gapless `MS0001`+ student IDs allocated via transactional counter row; Admin directory shows paid students only.

* \[ \] Three admin subtypes (`Super`, `Academic`, `Operations`) with server-enforced permissions, scopes, maker-checker publishing, and mandatory TOTP 2FA for Super and Operations Admins.

* \[ \] Per-set question numbering restarting at $1$; content-validated UTF-8 CSV bulk import; standard pagination envelope on every admin list.

* \[ \] Student app implements the complete v3.4 UI design baseline (four-colour palette in `packages/ui-tokens`, 5-card Home map, 3-step `Modules`/`Notes`/`Amharic`/`Quiz 1–3`, direct `Mid`/`Final`/`Mock` exams, standalone `COC` with question palette, `Show`/`Hide` answer review, Download Manager with Wi-Fi-only toggle).

* \[ \] Zero mock code in production builds; API refuses to boot with weak secrets; pre-commit and CI secret scans pass; Light and Dark themes supported on every screen.