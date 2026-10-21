# BoardQuest: MedTech Licensure Review System
## Project Manuscript & Technical Specification Document

**Project Code:** SWU-001  
**Document Version:** 1.0.1  
**Document Date:** October 10, 2026  
**Institution:** Southwestern University PHINMA — College of Medical Technology, Cebu City, Philippines  
**Institutional Partner:** SWU Medtech  

---

### Project Authors & Points of Contact

| Name | Role / Title | Email | Phone Number |
| :--- | :--- | :--- | :--- |
| **Louie Dela Cerna Remotigue, MD** | Dean, College of Medical Technology (Client) | `jdremotigue.swu@phinmaed.com` | +63 919 007 2129 |
| **Berndt Dennis F. Canaya** | Main Programmer | `befa.canayaa.swu@phinmaed.com` | +63 960 631 7196 |
| **Ethan Gabriel T. Rolloque** | Programmer | `etto.rolloque.swu@phinmaed.com` | +63 939 365 4549 |
| **Arl Jacob C. Necesario** | Technical Support | `arca.necesario.swu@phinmaed.com` | +63 915 016 8825 |
| **Lance Keith I. Fajardo** | UI/UX Designer | `lain.fajardo.swu@phinmaed.com` | +63 951 785 3001 |

---

### Revision History

| Version | Date | Change Description | Author(s) |
| :--- | :--- | :--- | :--- |
| **1.0.0** | September 14, 2026 | First draft covering system architecture, user roles, core requirements, and initial governance rules. | Berndt Dennis F. Canaya |
| **1.0.1** | October 10, 2026 | Second draft applying panel review feedback: updated tools to Gemini API and Supabase Storage, added post-launch feedback plan, clarified permissions, and merged project schedule. | Berndt Dennis F. Canaya |

---

## 1. Project & System Overview

### 1.1. Executive Summary
Preparation for the Philippine Medical Technology Licensure Examination (MTLE) at Southwestern University PHINMA requires intense academic focus, with candidates dedicating five to seven hours daily to vast volumes of complex subject matter. Traditional review methodologies primarily rely on repetitive memorization and static practice tests, which induce severe cognitive burnout and test anxiety without cultivating high-level clinical reasoning.

**BoardQuest** modernizes licensure exam preparation by converting exhausting study routines into an adaptive, gamified review journey across all six official laboratory science disciplines:
1. **Clinical Chemistry**
2. **Microbiology**
3. **Hematology**
4. **Clinical Microscopy & Parasitology**
5. **Immunology & Serology and Immunohematology (Blood Banking)**
6. **Histopathology and Medical Technology Laws**

The platform integrates generative artificial intelligence (Google Gemini API via automated workflows) to restructure conventional recall questions into logic-driven clinical case studies. Gamified progression (daily streaks, XP, milestone badges, Expedition levels, and cohort leaderboards) maintains habitual engagement. Real-time diagnostic radar analytics and a simulated Board Readiness Index (modeled strictly on the PRC 75% GWA and 50% minimum discipline threshold) equip examinees and faculty mentors with actionable diagnostic data.

### 1.2. Primary Stakeholders & End Users
- **Primary Client:** Southwestern University PHINMA, College of Medical Technology.
- **End-User Groups:**
  1. **Board Examinees (Aspirants):** Active MedTech students and graduates completing adaptive daily quests, reviewing AI rationale explanations, maintaining study streaks, and analyzing radar charts.
  2. **Review Center Representatives:** External partner coordinators who manage student cohorts, configure mock exams, and distribute digital score summaries.
  3. **Teachers:** Faculty members who author review questions, formulate explanations, and manage academic interventions.
  4. **Team Leads:** Senior faculty overseeing specific laboratory disciplines, conducting editorial reviews, and approving questions.
  5. **Deans:** Academic leaders evaluating curriculum-wide student readiness, reviewing radar analytics, and adjusting institutional review policies.
  6. **Superadmins:** Technical personnel responsible for infrastructure, security enforcement, user permissions, and database operations.

### 1.3. Objectives & Measurable Success Criteria
- **Operational Outcomes:**
  1. Transform static questions into higher-order clinical scenarios using AI.
  2. Eliminate study burnout through structured gamification mechanics.
  3. Deliver personalized daily study recommendations focused on weak sub-topics.
  4. Provide live diagnostic radar analytics and the official Board Readiness Index.
- **Verifiable Benchmarks:**
  - **Educational Impact:** Statistically significant score improvements in comparative pre-test vs. post-test evaluations.
  - **ISO 25010 Standards:** Minimum overall software acceptability rating of **4.0 out of 5.0** across usability and performance efficiency.
  - **Content Validity:** 100% faculty sign-off on active question items and AI-synthesized clinical case studies before student exposure.
  - **Technical Stability:** Sub-second response times, zero session loss during multi-user mock exams, and 99.9% uptime during active review terms.

---

## 2. System Architecture & Technology Stack

The platform is organized as a multi-tier, decoupled web ecosystem:

```
[ User Web Clients: Examinees, Faculty, Admins ]
                      │ (HTTPS / WSS)
                      ▼
               [ Cloudflare DNS & WAF ]
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
[ Vercel Frontend ]         [ Render Central API ]
(React, Vite, Next.js,      (Node.js, Express.js, TypeScript,
 Tailwind CSS, Radix UI)     Prisma ORM, Agenda Job Queue)
                                    │
    ┌───────────────────────────────┼───────────────────────────────┐
    ▼                               ▼                               ▼
[ MongoDB Atlas ]          [ Supabase Storage ]            [ External Integrations ]
(Document Database)        (Laboratory Micrographs,        • Google Gemini API
                            Diagrams, User Avatars)         • Pusher Channels (Realtime)
                                                           • Resend (Transactional Email)
                                                           • n8n (AI Workflows)
```

### Core Architecture Components
- **Hosting & Infrastructure:**
  - **Render:** Central backend application server, background job execution, automated health checks.
  - **Vercel:** Edge CDN deployment for frontend web portals with automated SSL and instant preview builds.
  - **Docker:** Digital containerization ensuring environment parity across local, staging, and production tiers.
  - **Cloudflare:** DNS routing, DDoS protection, and SSL/TLS termination.
- **Database & Persistence:**
  - **MongoDB Atlas:** Highly available clustered document database with automated daily backups.
  - **Prisma:** Type-safe database client and schema blueprint manager.
- **Storage & Services:**
  - **Supabase Storage:** Cloud storage for high-resolution medical micrographs, histology slides, and profile avatars.
  - **Google Gemini API:** AI-driven question synthesizer, clinical paraphraser, and personalized rationale generation.
  - **Pusher Channels:** Low-latency WebSockets for instant leaderboard updates, approval alerts, and notifications.
  - **Resend:** Transactional email delivery for password resets, student invitations, and digital scorecards.
  - **Agenda:** In-memory & database-backed cron queue for daily streak updates, batch processing, and reminders.
  - **Turborepo:** Monorepo orchestration for compilation, linting, and automated testing.

---

## 3. User Feedback & UX Synthesis (MoSCoW Prioritization)

### Pre-Development Findings (52 Student Examinees & 6 Faculty Leads)
- **P1 (Severe Cognitive Stress & Burnout):** Stress mean 4.06/5.0; Volume overload 3.85/5.0.  
  *Action:* Implemented Quest Arena, XP level progression, daily streaks, and achievement badges (**Must Have**).
- **P2 (Rote Memorization Disconnect):** Traditional question banks encouraged memorizing static keys.  
  *Action:* Integrated Google Gemini AI to reformulate static questions into clinical situational scenarios (**Must Have**).
- **P3 (Lack of Mobile-Friendly On-the-Go Tools):** 42.3% of students study in flexible bursts.  
  *Action:* Mobile-first responsive UI built with Tailwind CSS, supporting bite-sized quests (**Must Have**).
- **P4 (Inability to Track Subject Proficiency):** Self-assessment difficulty 3.27/5.0.  
  *Action:* Interactive radar charts and cumulative Board Readiness Index based on MTLE rules (**Must Have**).

### During-Development Findings (Sprint Demos & Pilot Testing)
- **D1 (Mobile Screen Crowding):** Small touch targets on screens < 6 inches.  
  *Action:* Restructured card padding, eliminated text overflow, enlarged touch targets (**Must Have**).
- **D2 (Demand for Dual Quiz Modes):** Need for both practice feedback and realistic exam simulation.  
  *Action:* Built **Learning Mode** (immediate AI tutor rationale after each answer) and **Test Mode** (timed exam simulation with withheld scores) (**Must Have**).
- **D3 (RPG Battle Aesthetic Reception):** 100% positive endorsement of the Quest Arena archipelago theme.  
  *Action:* Retained and polished visual theme with cloud media optimization (**Should Have**).
- **D4 (Review Center Roster & Score Dispatch):** Partner centers required independent management tools.  
  *Action:* Isolated Review Center portal with batch candidate registration and automated Resend email scorecards (**Must Have**).

### Post-Deployment Anticipated Actions
- **A1:** 24-hour turnaround for question error disputes (**Must Have**).
- **A2:** Periodic intake of faculty-validated question items (**Should Have**).
- **A3:** Automated daily email / push study reminders (**Could Have**).
- **A4:** Exportable spreadsheet score summaries for review centers (**Could Have**).

---

## 4. End-to-End Business Flow

1. **User Registration & Access Verification:** Student/faculty signs in via Argon2-hashed credentials and JWT cookies. System verifies role and active cohort permissions.
2. **Question Upload, Review & Approval:** Faculty uploads questions (individually or via Excel `.xlsx` templates). AI synthesizes situational variants. Team Leads and Deans review, critique, request revisions, or formally approve questions.
3. **Diagnostic Assessment & Review Planning:** Examinee inputs target MTLE exam date, completes diagnostic baseline assessment, and receives an automated personalized study plan.
4. **Learning Quests & Simulations:** Students undertake daily quests, practice battles in the Quest Arena (Learning Mode or Test Mode), and encounter AI clinical case studies.
5. **Scoring, Progress Tracking & Diagnostics:** Responses are scored; XP, badges, streaks, radar charts, and the Board Readiness Index are recalculated in real time.
6. **Report Review, Targeted Support & Cycle Completion:** Teachers and Deans review diagnostic reports, assign academic intervention cases (Pending -> In Progress -> Resolved), and guide candidates to licensure completion.

---

## 5. Technical Specifications for End Users

### Desktop / Laptop Systems
- **CPU:** Minimum: Intel Core i3 (8th Gen+), AMD Ryzen 3 (3000 series+), Apple Silicon M1.  
  *Recommended:* Intel Core i5, AMD Ryzen 5, or Apple Silicon M2/M3.
- **RAM:** Minimum: 4 GB. *Recommended:* 8 GB or higher.
- **Storage:** Minimum: 2 GB free disk space. *Recommended:* 5 GB SSD storage.
- **Display Resolution:** Minimum: 1366 × 768. *Recommended:* 1920 × 1080 (Full HD).
- **Operating System:** Windows 10/11 (64-bit), macOS 11 (Big Sur)+, or modern Linux.
- **Supported Browsers:** Google Chrome 110+, Microsoft Edge 110+, Mozilla Firefox 115+, Apple Safari 15.0+.
- **Mandatory Browser Settings:** JavaScript enabled, first-party cookies and LocalStorage enabled, pop-up exceptions allowed for scorecards.

### Mobile & Tablet Devices
- **Android:** Android OS 10.0+ (Recommended: Android 12.0+), Quad-core CPU, 3 GB RAM (Recommended: Octa-core, 4 GB+ RAM).
- **iOS / iPadOS:** iOS 14.0+ / iPadOS 14.0+ (iPhone 8, iPad 6th Gen or newer; Recommended: iOS 16.0+).

### Network Connectivity
- **Minimum:** Stable 3 Mbps download, 1 Mbps upload.
- **Recommended:** 10 Mbps or higher with low latency.
- **Connection Security:** Encrypted WPA2/WPA3 Wi-Fi, Ethernet, or 4G/5G mobile cellular. Public unsecured Wi-Fi requires a trusted VPN.

---

## 6. Software Governance & Engineering Standards

### 6.1. Code Naming Conventions
- **camelCase:** Variables, helper functions, hooks, utilities (`userEmail`, `calculateTax`, `useWindowSize`, `dateUtils.ts`).
- **PascalCase:** React components, TypeScript models, class definitions (`NavigationMenu.tsx`, `UserAccount`).
- **UPPER_SNAKE_CASE:** Immutable constants and configuration globals (`MAX_LOGIN_ATTEMPTS`, `DEFAULT_PAGE_SIZE`).
- **kebab-case:** Folders, routes, asset filenames (`user-profile/`, `order-tracking/`, `site-logo.svg`).
- **Booleans:** Must prefix with `is`, `has`, `can`, or `should` (`isActive`, `hasCompletedRegistration`, `canDeleteRecord`).
- **Event Handlers:** Prefix with `handle` for internal functions (`handleSaveButtonClick`) and `on` for listener props (`onSubmitForm`).
- **Component Props:** Must suffix with `Props` (`UserAvatarProps`).

### 6.2. Code Quality & Formatting
- **Indentation:** Exactly 2 spaces; tab characters strictly prohibited.
- **Line Length:** Kept under 100 characters to prevent horizontal scrolling.
- **Braces & Semicolons:** Opening curly bracket on same line, closing on isolated new line. All statements terminate with a semicolon.
- **Documentation:** JSDoc annotations required for complex functions with `@param`, `@returns`, and `@deprecated` when applicable.
- **Error Handling:** Silent failures strictly prohibited; every catch block must log or report errors.
- **Automated Enforcement:** ESLint, Prettier, and Husky pre-commit hooks enforce compliance before commits are accepted.

### 6.3. Environment Variables & Security
- Stored in local `.env` (git-ignored) and template published as `.env.example`.
- Production and UAT credentials managed via host dashboard secret managers.
- No confidential keys, connection strings, or service tokens may ever be hardcoded into frontend bundles.

### 6.4. Folder Structure (Feature-Driven Architecture)
```
studio/
├── src/
│   ├── app/           # Core application routes, Next.js layouts, API handlers
│   ├── features/      # Encapsulated functional domains (auth, quest, questions, analytics)
│   ├── components/    # Globally shared, feature-agnostic UI elements
│   ├── hooks/         # Shared React hooks
│   ├── stores/        # Global state stores
│   ├── lib/           # Pre-configured 3rd-party clients (Prisma, Supabase, Gemini)
│   ├── config/        # Environment configurations & application constants
│   ├── types/         # Global TypeScript definitions & role blueprints
│   ├── utils/         # Generic reusable helper functions
│   └── assets/        # Static visual assets and emblems
├── public/            # Public static images, sprites, and icons
└── prisma/            # Database schema definitions and migrations
```

### 6.5. Taxonomy & Metadata Standards
- **Database Collections:** Plural lowercase with underscores (`users`, `student_assessments`, `audit_logs`).
- **Columns / Fields:** Singular lowercase with underscores (`first_name`, `created_at`, `user_id`).
- **Primary / Foreign Keys:** `id` for primary keys; `[target]_id` for foreign keys.
- **Indexes:** Suffix with `_idx` (`users_email_idx`).
- **API Response Wrapper:**
  ```json
  {
    "status": "success",
    "data": { ... },
    "message": "Operation completed successfully",
    "pagination": { "total_count": 100, "page_number": 1, "page_size": 20 }
  }
  ```

### 6.6. Deployment & Branching Standards
- **Environments:**
  - `Local Workstation`: Private developer sandbox with synthetic data.
  - `Development / Test`: Shared integration environment.
  - `User Acceptance Testing (UAT)`: Mirror of production for faculty/admin review.
  - `Production`: Live environment at `https://boardquest.online`.
- **Branch Conventions:** Dedicated `feature/*` branches -> `develop` integration branch -> `staging` for UAT -> `main` for production releases.
- **Release Schedule:** Releases strictly prohibited on Friday afternoons and weekends. Immediate automated rollback protocol enabled.

---

## 7. Data Privacy, Security & Compliance

### 7.1. Statutory Alignment (RA 10173)
BoardQuest complies with **Republic Act No. 10173 (Philippine Data Privacy Act of 2012)**. Personal data processing is restricted to legitimate academic and licensure preparation purposes under the principles of transparency, legitimate purpose, and proportionality.

### 7.2. Data Classification Matrix

| Data Item | Privacy Category | Protection Level | Access Controls | Retention Period |
| :--- | :--- | :--- | :--- | :--- |
| **Student Full Name & Contact** | Personal Data | Standard | Student, assigned faculty, leads, admin. Encrypted in transit. | Active enrollment + 5 years |
| **Institutional Email** | Personal Data | Standard | RBAC secured, used for authentication & scorecards. | Active enrollment + 5 years |
| **Avatar, XP, Badges, Ranks** | Public (Internal) | Standard | Visible internally on cohort leaderboards. | Active cohort, archived at semester close |
| **Quiz & Pre/Post Test Scores** | Sensitive Personal Info | High | Encrypted at rest. Visible only to student and faculty mentors. | 5 years post-graduation |
| **Simulated MTLE Readiness Index** | Sensitive Personal Info | High | Restricted to student, subject leads, and Dean. | 5 years post-graduation |
| **Question Banks & Keys** | Academic Content | High | Authoring restricted to faculty; approval by Dean. | Active use + 5 years |
| **Advisory & Mentoring Logs** | Sensitive Personal Info | High | Restricted to assigned mentor, leads, and Dean. | Exam cycle completion + 1 year |
| **System Passwords & Credentials** | Personal Data | Highest | Irreversible Argon2 cryptographic hashing. Never plaintext. | Active lifetime; revoked upon deactivation |
| **System Audit Logs** | Technical Security Record | Highest | Restricted exclusively to Super Admin. Passwords stripped. | 1 calendar year |

### 7.3. Incident Escalation SLA Matrix

| Level | Definition | Response SLA | Resolution SLA | Assigned Tier |
| :--- | :--- | :--- | :--- | :--- |
| **P1** | System-wide outage, exam crash, data breach | < 15 minutes | Within 2 hours | **Tier 3:** Super Admin & Department Dean |
| **P2** | Major feature failure, AI synthesizer error, auth failure | Within 1 hour | Within 4 hours | **Tier 2:** Technical System Administrator |
| **P3** | Content disputes, disputed answer keys, streak display bugs | Within 4 hours | Within 12 hours | **Tier 1:** Subject Teachers & Team Leads |
| **P4** | General questions, minor text typos, cosmetic inquiries | Within 8 hours | Within 24 hours | **Tier 1:** Frontline Support & Teachers |

---

## 8. Budget, Resources & Risk Management

### 8.1. Estimated Project Budget (Table 3 of Manuscript)

| Cost Category | Item or Resource | Estimated Cost (PHP) | Purpose & Value |
| :--- | :--- | :--- | :--- |
| **Software & Hosting** | Web domain registration (1 year) | ₱1,500.00 | Authoritative production domain name |
| **Software & Hosting** | Cloud database & hosting (Render + Atlas) | ₱3,500.00 | 12-month cloud server and database operations |
| **Software & Hosting** | Google Gemini API AI service credits | ₱5,000.00 | Token allocation for question synthesis & clinical reasoning |
| **Research Operations** | Tokens of appreciation for validators | ₱3,000.00 | Research participants and faculty evaluators |
| **Research Operations** | Printing, binding, and survey questionnaires | ₱3,000.00 | Physical documentation and survey instruments |
| **Research Operations** | Internet connectivity & communication load | ₱2,000.00 | High-speed data connectivity for remote testing |
| **Research Operations** | Transportation for consultations | ₱2,000.00 | Departmental visits and stakeholder meetings |
| **Miscellaneous** | Contingency fund & backup storage | ₱3,800.00 | Unexpected technical and storage requirements |
| **TOTAL ESTIMATED COST** | | **₱23,800.00** | *(Approx. ₱449.06 per participant across 52 examinees)* |

### 8.2. Key Project Risks & Mitigations
- **AI Question Inaccuracies:** Mandated faculty validation workflow; unapproved items cannot reach student quizzes.
- **Network Interruptions During Exams:** Auto-saving quiz state to local storage; clear resumed state protocols.
- **Older Device Latency:** Strict asset compression, SVG sprites, and responsive CSS optimizations.
- **Unauthorized Data Access:** Granular RBAC, Argon2 hashing, HTTP-only JWTs, and monthly access privilege audits.
