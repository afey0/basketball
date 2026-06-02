

================================================================================

🏀 BASKETBALL CLUB CRM — FULL APPLICATION PROMPT

================================================================================



Build a full-stack web application (CRM) to manage a basketball training club.

The app manages students (kids), their parents, monthly payments, attendance,

training groups, scheduling, and provides a parent-facing portal.



================================================================================

📐 TECH STACK (Suggested)

================================================================================

\- Frontend     : React.js (or Next.js) + Tailwind CSS + shadcn/ui

\- Backend      : Node.js + Express (or Next.js API routes)

\- Database     : PostgreSQL (or MySQL) with Prisma ORM

\- Auth         : NextAuth.js / JWT-based auth with role-based access

\- Hosting      : Vercel / Railway / any VPS with Docker



================================================================================

👥 USER ROLES \& ACCESS

================================================================================



1\. ADMIN (Club Manager)

&#x20;  - Full access to everything

&#x20;  - Manage students, groups, coaches, payments, schedules

&#x20;  - View reports \& dashboards

&#x20;  - Flag/unflag payment status

&#x20;  - Mark attendance



2\. COACH (Optional role)

&#x20;  - View assigned training groups \& schedules

&#x20;  - Mark attendance for their groups

&#x20;  - View student profiles (read-only)



3\. PARENT (Client Portal)

&#x20;  - Login via unique credentials (email + password)

&#x20;  - View their child's profile

&#x20;  - View payment history \& outstanding balances

&#x20;  - View attendance history \& calendar

&#x20;  - Read-only access (no edit permissions)



================================================================================

🗃️ DATABASE SCHEMA / DATA MODELS

================================================================================



\### 1. Users

| Field          | Type       | Notes                              |

|----------------|------------|------------------------------------|

| id             | UUID / INT | Primary key                        |

| name           | STRING     | Full name                          |

| email          | STRING     | Unique, used for login             |

| password       | STRING     | Hashed                             |

| phone          | STRING     | Contact number                     |

| role           | ENUM       | ADMIN, COACH, PARENT               |

| created\_at     | DATETIME   |                                    |

| updated\_at     | DATETIME   |                                    |



\### 2. Students (Kids)

| Field              | Type       | Notes                           |

|--------------------|------------|---------------------------------|

| id                 | UUID / INT | Primary key                     |

| first\_name         | STRING     |                                 |

| last\_name          | STRING     |                                 |

| date\_of\_birth      | DATE       | Used to auto-calculate age      |

| age                | INT        | Auto-calculated from DOB        |

| gender             | ENUM       | MALE, FEMALE                    |

| age\_group          | STRING     | e.g., U-8, U-10, U-12, U-14, U-16, U-18 |

| training\_group\_id  | FK         | References TrainingGroups       |

| parent\_id          | FK         | References Users (role=PARENT)  |

| profile\_photo      | STRING     | URL to uploaded photo           |

| jersey\_number      | INT        | Optional                        |

| medical\_notes      | TEXT       | Allergies, conditions, etc.     |

| enrollment\_date    | DATE       |                                 |

| status             | ENUM       | ACTIVE, INACTIVE, SUSPENDED     |

| created\_at         | DATETIME   |                                 |



\### 3. Training Groups

| Field          | Type       | Notes                              |

|----------------|------------|------------------------------------|

| id             | UUID / INT | Primary key                        |

| group\_name     | STRING     | e.g., "Eagles", "Junior Stars"     |

| age\_group      | STRING     | e.g., U-10, U-12                   |

| coach\_id       | FK         | References Users (role=COACH)      |

| max\_capacity   | INT        | Max students allowed               |

| description    | TEXT       | Optional                           |

| created\_at     | DATETIME   |                                    |



\### 4. Schedules

| Field            | Type       | Notes                            |

|------------------|------------|----------------------------------|

| id               | UUID / INT | Primary key                      |

| training\_group\_id| FK         | References TrainingGroups        |

| day\_of\_week      | ENUM       | MON, TUE, WED, THU, FRI, SAT, SUN|

| start\_time       | TIME       | e.g., 16:00                      |

| end\_time         | TIME       | e.g., 17:30                      |

| location         | STRING     | Court name or venue              |

| is\_active        | BOOLEAN    | To enable/disable schedules      |



\### 5. Attendance

| Field            | Type       | Notes                            |

|------------------|------------|----------------------------------|

| id               | UUID / INT | Primary key                      |

| student\_id       | FK         | References Students              |

| training\_group\_id| FK         | References TrainingGroups        |

| date             | DATE       | The day of attendance            |

| status           | ENUM       | PRESENT, ABSENT, LATE, EXCUSED   |

| marked\_by        | FK         | References Users (admin/coach)   |

| notes            | TEXT       | Optional                         |

| created\_at       | DATETIME   |                                  |



\### 6. Payments

| Field            | Type       | Notes                            |

|------------------|------------|----------------------------------|

| id               | UUID / INT | Primary key                      |

| student\_id       | FK         | References Students              |

| amount           | DECIMAL    | Payment amount                   |

| currency         | STRING     | Default: "MVR" (Maldivian Rufiyaa)|

| payment\_month    | STRING     | e.g., "2026-06" (YYYY-MM format) |

| payment\_date     | DATE       | Date payment was received        |

| due\_date         | DATE       | When payment was due             |

| status           | ENUM       | PAID, UNPAID, OVERDUE, PARTIAL   |

| payment\_method   | ENUM       | CASH, BANK\_TRANSFER, ONLINE      |

| receipt\_number   | STRING     | Auto-generated                   |

| notes            | TEXT       | Optional                         |

| recorded\_by      | FK         | References Users (admin)         |

| created\_at       | DATETIME   |                                  |



\### 7. Payment Plans (Optional - Monthly Fee Config)

| Field            | Type       | Notes                            |

|------------------|------------|----------------------------------|

| id               | UUID / INT | Primary key                      |

| training\_group\_id| FK         | References TrainingGroups        |

| monthly\_fee      | DECIMAL    | Standard monthly fee             |

| currency         | STRING     | Default: "MVR"                   |



================================================================================

📄 PAGES \& FEATURES — ADMIN DASHBOARD

================================================================================



\### 🏠 1. Dashboard (Home)

\- Total active students count

\- Total groups count

\- Revenue this month vs last month

\- Payment collection rate (% paid vs unpaid)

\- Upcoming sessions today/this week

\- Recent activity feed

\- 🔴 Red-flagged students (unpaid) — quick-access widget

\- Chart: Monthly revenue trend (last 6 months)

\- Chart: Attendance rate by group



\### 👦 2. Students Page

\- Table/list of all students with columns:

&#x20; Name | Age | Age Group | Training Group | Status | Payment Status

\- Search \& filter by: name, age group, training group, payment status

\- Bulk actions: export to CSV/Excel

\- Click on student → Student Detail Page:

&#x20; - Profile info (photo, DOB, age, parent info, medical notes)

&#x20; - Current training group \& schedule

&#x20; - Attendance history (calendar view + list view)

&#x20; - Payment history (table with status badges)

&#x20; - Add/edit student form (modal or separate page)



\### 👨‍👩‍👧 3. Parents Page

\- List all parents with: Name | Email | Phone | Children | Actions

\- Click on parent → see linked children profiles

\- Send payment reminder (optional: email/SMS integration)

\- Create parent account (generates login credentials)



\### 🏀 4. Training Groups Page

\- Card/grid view of all training groups showing:

&#x20; Group Name | Age Group | Coach | Students Count / Capacity

\- Click on group → Group Detail Page:

&#x20; - List of students in this group

&#x20; - Schedule for this group

&#x20; - Attendance overview for this group

&#x20; - Add/remove students from group

\- Create / Edit / Delete groups



\### 📅 5. Schedule Page

\- Weekly calendar view showing all training sessions

\- Filter by group, coach, day

\- Color-coded by training group

\- Create / edit / delete schedule entries

\- Drag-and-drop rescheduling (nice to have)



\### ✅ 6. Attendance Page

\- Select date + training group → shows list of students

\- One-click toggle: Present ✅ / Absent ❌ / Late ⏰ / Excused 📝

\- Bulk mark all as present

\- View attendance history by date range

\- Attendance summary report per student (% attendance)



\### 💰 7. Payments Page

\- Monthly payment overview table:

&#x20; Student Name | Group | Month | Amount | Due Date | Status | Actions

\- Filter by: month, group, payment status (PAID/UNPAID/OVERDUE)

\- 🔴 AUTO-FLAG: Students with UNPAID status past due date get

&#x20; flagged as OVERDUE with red badge

\- Bulk generate monthly invoices for all active students

\- Record payment (mark as paid, enter amount, method, date)

\- Payment receipt generation (printable/PDF)

\- Export payment report to CSV/Excel



\### ⚙️ 8. Settings Page

\- Club profile (name, logo, contact info)

\- Manage age group categories

\- Set default monthly fees per group

\- Manage coaches

\- Payment due date configuration (e.g., 5th of every month)

\- Email notification templates (optional)



================================================================================

📄 PAGES \& FEATURES — PARENT PORTAL (CLIENT-FACING)

================================================================================



Separate login page for parents. Clean, mobile-friendly design.



\### 🏠 1. Parent Dashboard

\- Welcome message with parent name

\- Quick overview cards:

&#x20; - Child's name \& training group

&#x20; - Next training session (date, time, location)

&#x20; - Payment status for current month (PAID ✅ or UNPAID 🔴)

&#x20; - Attendance rate this month



\### 👦 2. Child Profile Page

\- Profile photo, name, DOB, age, age group

\- Training group name \& coach name

\- Jersey number

\- Enrollment date

\- Status (Active/Inactive)



\### 💰 3. Payment History Page

\- Table showing all payment records:

&#x20; Month | Amount | Due Date | Payment Date | Status | Receipt

\- Current month highlighted

\- Download receipt (PDF) for paid months

\- Clear visual indicator for unpaid/overdue months

\- Total outstanding balance displayed at top



\### ✅ 4. Attendance History Page

\- Calendar view with color-coded days:

&#x20; 🟢 Present | 🔴 Absent | 🟡 Late | 🔵 Excused

\- Monthly attendance summary (X/Y sessions attended = Z%)

\- List view toggle option



\### 📅 5. Schedule Page

\- Weekly schedule for their child's training group

\- Day, time, location clearly displayed

\- Highlight today's session



================================================================================

🔔 NOTIFICATIONS \& AUTOMATION

================================================================================



1\. AUTO-FLAG UNPAID:

&#x20;  - Run daily check: if current date > due\_date AND status = UNPAID,

&#x20;    auto-set status to OVERDUE

&#x20;  - Show OVERDUE students with red badge on dashboard



2\. PAYMENT REMINDERS (Optional):

&#x20;  - Send email/SMS reminder 3 days before due date

&#x20;  - Send overdue notice if payment is 7+ days late



3\. MONTHLY INVOICE GENERATION:

&#x20;  - Button to bulk-generate payment records for all active students

&#x20;    at the start of each month based on their group's monthly fee



================================================================================

🎨 UI/UX REQUIREMENTS

================================================================================



\- Modern, clean design with a basketball/sports theme

\- Primary color: Orange (#FF6B00) with dark navy (#1A1A2E) accents

\- Responsive design (mobile-first for parent portal)

\- Admin dashboard optimized for desktop but works on tablet

\- Use cards, badges, and color-coded status indicators

\- Loading states, empty states, and error handling

\- Toast notifications for actions (save, delete, payment recorded)

\- Confirmation modals for destructive actions (delete student, etc.)

\- Dark mode toggle (nice to have)



================================================================================

🔐 SECURITY \& AUTH

================================================================================



\- Password hashing (bcrypt)

\- JWT or session-based authentication

\- Role-based route protection:

&#x20; - /admin/\*  → only ADMIN and COACH roles

&#x20; - /portal/\* → only PARENT role

\- CSRF protection

\- Input validation \& sanitization

\- Rate limiting on login endpoints



================================================================================

📊 REPORTS (Nice to Have)

================================================================================



\- Monthly revenue report

\- Attendance report by group/student

\- Student enrollment trends

\- Payment collection rate over time

\- Export all reports to PDF/Excel



================================================================================

🧪 SAMPLE/SEED DATA

================================================================================



Pre-populate the database with sample data for testing:

\- 3 Training Groups: "Little Dribblers" (U-8), "Rising Stars" (U-12),

&#x20; "Elite Squad" (U-16)

\- 2 Coaches

\- 15 Students spread across groups

\- 3 Parent accounts

\- 2 months of payment records (mix of paid/unpaid)

\- 1 month of attendance records

\- Schedules for each group (2-3 sessions per week)



================================================================================

📁 PROJECT STRUCTURE (Suggested)

================================================================================



/basketball-club-crm

├── /src

│   ├── /app              # Pages \& routes

│   │   ├── /admin        # Admin dashboard pages

│   │   ├── /portal       # Parent portal pages

│   │   ├── /auth         # Login/register pages

│   │   └── layout.tsx

│   ├── /components       # Reusable UI components

│   │   ├── /ui           # shadcn components

│   │   ├── /dashboard    # Dashboard widgets

│   │   ├── /students     # Student-related components

│   │   ├── /payments     # Payment-related components

│   │   └── /attendance   # Attendance components

│   ├── /lib              # Utilities, DB client, helpers

│   ├── /api              # API route handlers

│   └── /types            # TypeScript type definitions

├── /prisma

│   ├── schema.prisma     # Database schema

│   └── seed.ts           # Seed data

├── .env                  # Environment variables

├── package.json

└── README.md



================================================================================

⚡ KEY BUSINESS RULES

================================================================================



1\. A student belongs to exactly ONE training group at a time

2\. A parent can have MULTIPLE children enrolled

3\. Payment is tracked per student per month

4\. Age group is auto-suggested based on DOB but can be overridden

5\. Attendance can only be marked for dates that have a scheduled session

6\. When a student is marked INACTIVE, stop generating monthly invoices

7\. Currency is MVR (Maldivian Rufiyaa) by default

8\. Payment due date defaults to the 5th of each month (configurable)

9\. OVERDUE status is auto-applied when payment is unpaid past due date

10\. Deleting a student should soft-delete (set status=INACTIVE),

&#x20;   preserving all payment and attendance history



================================================================================

🚀 DEVELOPMENT PHASES

================================================================================



PHASE 1 — Core (MVP):

&#x20; ✅ Auth (Admin + Parent login)

&#x20; ✅ Student CRUD

&#x20; ✅ Training Group CRUD

&#x20; ✅ Payment tracking \& flagging

&#x20; ✅ Attendance marking

&#x20; ✅ Parent portal (view-only)

&#x20; ✅ Basic dashboard



PHASE 2 — Enhanced:

&#x20; ✅ Schedule management

&#x20; ✅ Reports \& charts

&#x20; ✅ CSV/Excel export

&#x20; ✅ Receipt PDF generation

&#x20; ✅ Payment reminders



PHASE 3 — Advanced:

&#x20; ✅ Email/SMS notifications

&#x20; ✅ Online payment integration

&#x20; ✅ Coach role \& permissions

&#x20; ✅ Dark mode

&#x20; ✅ Mobile app (React Native)



================================================================================

END OF PROMPT

================================================================================



