# Manual QA · start to finish (v2)

Testing the school management system, one real workflow at a time. Every field below was re-verified directly against the current form code and the backend's seed migrations on 2026-07-10 — not carried over from memory, and not guessed. Follow the stages in order: later ones assume the classes, subjects, and people created earlier already exist.

**This is a rewrite of an earlier guide.** Two "known issues" in that version turned out to be wrong once checked against the actual source (see *What changed since the last guide* below) — this version fixes both and adds a few things the earlier pass missed (the Users screen, Bulk Import, a real negative-stock test).

| | |
|---|---|
| URL | `localhost:4200` |
| Username | `SystemAdmin` |
| Password | `Admin@123` |
| Role | `Admin` |

## Before you start

1. Start the backend (`dotnet run --project SRS.Api`) and the frontend (`ng serve`), then open `localhost:4200`.
2. Log in with the seeded admin above. This account is created directly by an EF Core migration (`SeedRolesAndSystemAdmin`) — it always exists, on any database this app has ever migrated.
3. **This guide assumes nothing about what's already in your database.** Out of the box, *nothing* is pre-seeded for Classes, Sections, Sessions, Departments, Designations, Subjects, Bus Routes/Stoppages, or Houses — every one of those tables has zero rows until an admin creates them via Setup. What **is** pre-seeded (confirmed by reading the migrations directly): the 5 roles, all `Tb_Master_Key_Data` lookup values (Gender, Blood Group, Bank Account Type, Medium Type, Admission Scheme, Admission Type, Religion, Attendance Status), the Caste Category list, 227 banks, and 12 payment categories.
4. If you already ran the previous version of this guide against the same database, the names below (school, students, employees, classes) are deliberately different from that pass, so you can run this one on top without colliding with or reusing old rows. If any Setup item below already exists from earlier testing, skip creating it and just use what's there.
5. Read *What changed since the last guide* once before you begin — it corrects two things the previous version got wrong, so you don't waste time chasing them as new bugs.

### What changed since the last guide

- **Pay Modes is not actually blocked.** The previous guide said Bank and Payment Category were empty tables with no way to seed them, and included a manual SQL script as a workaround. That's no longer true (and looking at the migration dates, may never have been true against this database) — `SeedBankMasterData` and `SeedPaymentCategoryMasterData` are committed EF migrations that seed 227 banks and 12 payment categories. **Don't run that SQL script.** Setup → Pay Modes should work with no prep.
- **Caste Category is not always empty.** The previous guide described a Religion→Caste-Category cascade bug. There's no such cascade in the code at all — Caste Category is just a flat, independently-populated dropdown (8 seeded values: General, OBC, SC, ST, Other, EWS, BC-A, BC-B) with zero relation to the Religion field. It should work normally; pick any value.
- Two real, still-open gaps are carried forward (see *Known issues* at the end): there's no screen anywhere to configure per-class tuition amounts, and the Exam Types "Semester" field is a plain number box because no Semester lookup group was ever seeded.

---

## 01 · School setup

Everything else in the app reads from what you configure here — classes, sessions, subjects, and the reference lists every dropdown downstream pulls from.

### School profile

**School Profile** — Admin only. One page, five sections. Only **School Name** and **Contact Number** are required; fill in everything else for a realistic test.

**Basic information**

| Field | Enter |
|---|---|
| School Name | Horizon Public School |
| Alternate / Short Name | HPS |
| Affiliation Board | CBSE |
| Affiliation Regd. Number | CBSE/AFF/2091/2018 |
| School Code | HPS2026 |
| UDISE Code | 09231400891 |
| Contact Number | 0120-7788990 |
| Phone Number | 9810099887 |
| SMS Number | 9810099887 |
| Email | admin@horizonpublicschool.edu.in |
| Website | www.horizonpublicschool.edu.in |
| Principal Name | Dr. Kavita Rao |
| Address | Plot 8, Sector 45, Gurugram, Haryana – 122003 |

**Bank details** (all optional — the Bank dropdown is genuinely populated now, not empty)

| Field | Enter |
|---|---|
| Account Type | Current |
| Bank | STATE BANK OF INDIA (seeded exactly in this uppercase form — pick any of the 227 seeded banks) |
| Account Number | 600987654321 |
| IFSC Code | SBIN0004567 |

**Fees, payroll & notifications**

| Field | Enter |
|---|---|
| Admission/Roll Number Prefix | HPS |
| Deduct EPF | checked, 12 |
| Deduct EPS | checked, 8.33 |
| Charge Late-Fee Fine | checked, from day 10, ₹10/day |
| Enable SMS Notifications | checked |
| Enable WhatsApp Notifications | checked |

**About & policies**

| Field | Enter |
|---|---|
| About School | Horizon Public School has offered CBSE education since 2012, with a focus on academics, sports, and the arts. |
| Terms & Conditions for Students | Fees once paid are non-refundable and non-transferable. Parents are expected to check the school diary daily and attend all PTMs. |
| Declaration | I hereby declare that all information furnished above is true and correct to the best of my knowledge. |

For **Logo** and **Letterhead**, drag in any image you have handy — this is also the right moment to re-test the earlier fix: upload a logo, save, then come back and replace it with a different image. Only one should remain afterward, not two.

### Setup module

**Setup** — Admin only, eleven tabs in this exact order: **Classes & Sections → Sessions → Departments → Designations → Subjects → Assign Subjects → Pay Modes → Exam Types → Bus Routes → Bus Stoppages → Houses**. Work through them top to bottom; several depend on the one before.

#### Classes & Sections tab

| Action | Enter |
|---|---|
| Add Class | Class 6 |
| Add Section (on Class 6) | — no name field, auto-assigns "B" after the default "A" |

There's no field validation on the class name beyond "required" — nothing in the form blocks a purely numeric name like `6`. (The earlier guide claimed numeric-only names get rejected; that's not something the Angular form does, so don't be surprised if it's accepted. If your backend still rejects it, that's a server-side rule, not a client one.) A brand-new class always gets Section A automatically; clicking "Add Section" again just appends the next free letter.

#### Sessions tab

| Field | Enter |
|---|---|
| Start Year | 2026 |

Single year field — the End year is set automatically (the request the frontend sends only carries `start`). If a session is already active from earlier testing, skip this and just note which one it is; otherwise create 2026 and set it active.

#### Departments tab

Generic name-only list (Add → single "Name" field, required).

| Enter |
|---|
| Teaching |
| Accounts |

#### Designations tab

Same generic pattern.

| Enter |
|---|
| PGT |
| Accountant |

#### Subjects tab

Same generic pattern. Subjects are **not** pre-seeded at all — add all five, including Mathematics and English (the earlier guide assumed those two already existed; they don't, out of the box).

| Enter |
|---|
| Mathematics |
| English |
| Science |
| Hindi |
| Social Science |

(Subjects, along with Departments/Designations/Bus Routes, do support a Deactivate action once created — not just Edit.)

#### Assign Subjects tab

Two selects: **Class**, **Subject**. Repeat for each of the five.

| Class | Subject |
|---|---|
| Class 6 | Mathematics |
| Class 6 | English |
| Class 6 | Science |
| Class 6 | Hindi |
| Class 6 | Social Science |

Without this step, Homework, Timetable, and Marks Entry will all show an empty Subject dropdown for Class 6 — easy to mistake for a bug.

#### Pay Modes tab

No blocker this time — Payment Category comes pre-seeded (12 rows, including "Tuition Fee"). Fields: **Category** (select, required), **Type** (free-text field, required — not a dropdown), **Opening Balance** (number, required).

| Category | Type | Opening Balance |
|---|---|---|
| Tuition Fee | Cash | 0 |
| Tuition Fee | UPI | 0 |
| Tuition Fee | Cheque | 0 |

Note: once created, a Pay Mode can only be **edited**, not deactivated — there's no deactivate endpoint wired up for this tab (confirmed by a comment in the component itself).

#### Exam Types tab

Fields: **Type** (text, required), **Code** (text, required), **Report Card?** (Yes/No select, required), **Semester** (plain number box, required — it's a number input rather than a dropdown because no "Semester" lookup group was ever seeded on the backend; type any integer).

| Type | Code | Report Card? | Semester |
|---|---|---|---|
| Unit Test 1 | UT1 | No | 1 |
| Half Yearly Examination | HY | Yes | 1 |

Like Pay Modes, Exam Types can only be edited, not deactivated.

#### Bus Routes tab

Generic name-only list.

| Enter |
|---|
| Green Valley Route |

#### Bus Stoppages tab

| Route | Stoppage Name | Arrival | Dispatch | Distance (km) | Amount |
|---|---|---|---|---|---|
| Green Valley Route | Sector 45 Market | 07:15 | 14:30 | 8 | 1200 |

#### Houses tab

| Name | Color |
|---|---|
| Crimson House | #d32f2f |
| Azure House | #1976d2 |

---

## 02 · People

Two ways to get a student into the system exist side by side — the Enquiry-to-Confirm pipeline, and the direct form. Try both: one student through the pipeline, two straight into the form.

### Admission pipeline — Ishaan Malhotra

**Admission** — Admin only. Same form serves both Enquiry and full Application; which button you press decides which fields are actually required.

1. Add Enquiry. Only **Name** and **Contact Number** are required to save as an enquiry, but enter everything you have. Note: **Source** is a free-text field with placeholder examples (Walk-in / Phone / Website / Referral), not a fixed dropdown — type whichever you like.

   | Field | Enter |
   |---|---|
   | Student Name | Ishaan Malhotra |
   | Father's Name | Rakesh Malhotra |
   | Mother's Name | Sunita Malhotra |
   | Contact Number | 9871234501 |
   | Email | rakesh.malhotra@gmail.com |
   | Date of Birth | 2016-04-12 |
   | Gender | Male |
   | Class Applied For | Class 6 |
   | Admission Scheme | New |
   | Admission Type | Regular |
   | Source | Walk-in |
   | Address | House 14, Sector 40, Gurugram, HR – 122003 |
   | Remarks | Enquired about mid-session admission |

   Attach a Birth Certificate file in the Documents section if you have one handy — it's optional.

2. Click **Submit Application** (not "Save as Enquiry") — this requires Name, Contact Number, DOB, Gender, Class Applied For, **and** Father's Name all filled (verified in the component's submit check), which they already are from above, so it should go straight through and move the record to the **Pending Verification** tab.
3. In **Pending Verification**, click **Approve** on Ishaan's row, confirm the dialog. He moves to **Verified**.
4. In **Verified**, click **Confirm to Student**. This opens a small dialog with two separate selects — pick **Class** (Class 6), then **Section** (A) — and confirm.

> **Capture this.** A "Student login created" dialog should appear with a generated username and password for Ishaan. Copy both somewhere now — the password is never shown again, and you'll want it later to test the Student role (My Books).

### Direct student entry — Diya Kapoor & Arjun Nair

**Students → Add Student** — a 5-step form (Personal / Admission Detail / Address / Family / Documents), steps can be visited in any order. The only fields required across the whole form: **Full Name, Date of Birth, Gender, Class-Section, Session** (5 controls total — confirmed by reading the form builder directly).

**Step 1 — Personal**

| Field | Diya Kapoor | Arjun Nair |
|---|---|---|
| Full Name | Diya Kapoor | Arjun Nair |
| Father's Name | Suresh Kapoor | Manoj Nair |
| Mother's Name | Lakshmi Kapoor | Reema Nair |
| Contact Number | 9822345601 | 9877001100 |
| Date of Birth | 2016-07-22 | 2016-01-30 |
| Gender | Female | Male |
| Medium | English | Hindi |
| Admission Number | HPS2026002 | HPS2026003 |
| Admission Date | 2026-04-01 | 2026-04-01 |
| Roll Number | 2 | 3 |
| Class - Section | Class 6 - A | Class 6 - A |
| Session | 2026 - 2027 | 2026 - 2027 |

Leave SRN Number, Ledger Number, Family Id, AAPR Id, Permanent Education Number, Enrollment School Name, and Opening Balance blank — these are state-specific/internal identifiers not needed for this test.

**Step 2 — Admission Detail**

| Field | Diya Kapoor | Arjun Nair |
|---|---|---|
| Admission Scheme | New | New |
| Admission Type | Regular | RTE |
| Guardian Name | Suresh Kapoor | Manoj Nair |
| Relation | Father | Father |
| Religion | Hinduism | Hinduism |
| Caste Category | General | OBC |
| Blood Group | B+ | O+ |
| Birth Place | Kochi, Kerala | Kozhikode, Kerala |
| House | Crimson House | Azure House |
| Previous School Name | Little Flower School, Kochi | — (first admission) |

Caste Category is a real, working, pre-seeded dropdown now (General/OBC/SC/ST/Other/EWS/BC-A/BC-B) — fill it in rather than skipping it.

**Step 3 — Address**

| Field | Diya Kapoor | Arjun Nair |
|---|---|---|
| Present Address | Flat 302, Sunrise Apartments, Sector 45, Gurugram, HR – 122003 | House 9, Sector 46, Gurugram, HR – 122003 |
| Permanent Address | same as above | same as above |

**Step 4 — Family** (the "Bank & Identity" sub-section is optional — skip it entirely for Arjun to test that it's genuinely optional)

| Field | Diya Kapoor | Arjun Nair |
|---|---|---|
| Father's Contact | 9822345601 | 9877001100 |
| Father's Occupation | Software Engineer | Shopkeeper |
| Mother's Mobile | 9822345602 | — |
| Mother's Occupation | Homemaker | — |
| SMS Mobile Number | 9822345601 | 9877001100 |
| SMS Facility Enabled | checked | checked |

**Step 5 — Documents**: upload a Birth Certificate and a Student Photo for both (any files you have) — you'll use these to test Document Verification in Stage 6. Save each student, and note the generated username/password from the credentials dialog for at least one of them.

### Employees — Priya Sharma & Vikram Singh

**Employees → Add Employee** — one flat page, four sections (Personal Details / Employment Details / Bank & Identity / Documents). Only **Full Name** and **Role** are required.

**Personal Details**

| Field | Priya Sharma | Vikram Singh |
|---|---|---|
| Full Name | Priya Sharma | Vikram Singh |
| Date of Birth | 1990-03-15 | 1985-11-02 |
| Gender | Female | Male |
| Blood Group | A+ | O+ |
| Contact Number | 9900112201 | 9911223300 |
| Email | priya.sharma@horizonpublicschool.edu.in | vikram.singh@horizonpublicschool.edu.in |
| Qualification | M.Sc. Mathematics, B.Ed. | B.Com, M.Com |
| Address | House 5, Sector 30, Gurugram, HR | Flat 12, Sector 55, Gurugram, HR |

**Employment Details**

| Field | Priya Sharma | Vikram Singh |
|---|---|---|
| Role | Teacher | Accountant |
| Department | Teaching | Accounts |
| Designation | PGT | Accountant |
| Joining Date | 2020-06-01 | 2019-01-15 |
| Assigned Class | Class 6 | — |
| Assigned Section | A | — |
| Experience | 6 years | — |
| Salary | 45000 | 38000 |

(Assigned Class/Section are shown for every employee, not just Teachers — leave them blank for Vikram rather than expecting the fields to disappear.)

> **Capture this.** Both saves should open the "Employee login created" dialog. Note Priya's username/password especially — you'll log in as her in Staff Leave and Payroll below.

### Users — reset a password

**Users** — Admin only. This is a plain list of every user with logins (students and employees you've created show up here), with one action: **Reset Password**. There is no create-user form here — logins are only ever created from the Student/Employee save flow.

Pick any row (e.g. Priya Sharma), click **Reset Password**, confirm. A new credentials dialog should appear with a freshly generated password — the old one should stop working.

---

## 03 · Daily operations

All scoped to **Class 6 - Section A**, so the same three students (Ishaan, Diya, Arjun) carry through every task here.

### Attendance

**Attendance → Mark Attendance** — Admin or Teacher. Pick Class 6 - A, leave the date on today. Status options are seeded as Present / Absent / Leave / Holiday / Half Day.

| Student | Status | Remark |
|---|---|---|
| Ishaan Malhotra | Present | — |
| Diya Kapoor | Present | — |
| Arjun Nair | Absent | Informed — fever |

Save, then switch to **Monthly Register** for Class 6 - A and confirm today's marks show up in the grid.

### Homework

**Homework → Add Homework** — Admin or Teacher. Pick Class 6, then Section A (two separate dropdowns) first.

| Field | Enter |
|---|---|
| Subject | Mathematics |
| Title | Chapter 4 – Fractions, Exercise 4.2 |
| Description | Complete all questions in Exercise 4.2. Show full working. |
| Homework Date | today |
| Due Date | two days from today |

### Timetable

**Timetable** — Admin only. Class 6, Section A, click the "+" on Monday. Only **Period #** and **Subject** are required — Teacher and the start/end times are optional, so leave the teacher blank on the second row deliberately to confirm that's really allowed.

| Period # | Subject | Teacher | Start | End |
|---|---|---|---|---|
| 1 | Mathematics | Priya Sharma | 09:00 | 09:45 |
| 2 | English | — (leave blank) | 09:45 | 10:30 |

### Notice board

**Notice Board → Add Notice** — Admin only to create; every logged-in role can read it. There's no audience/role-targeting field at all — confirmed in the form — every notice is visible to everyone.

| Field | Enter |
|---|---|
| Title | Independence Day Celebration – 15th August |
| Body | The school will celebrate Independence Day on 15th August at 8:30 AM in the main assembly ground. All students must wear white uniform and report by 8:00 AM. |
| Published On | today |
| Expiry Date | 2026-08-16 |

### Transport

**Transport → Assign Transport** — Admin only. Pick Class 6 - A, then Ishaan Malhotra, then fill the assign form.

| Field | Enter |
|---|---|
| Bus Route | Green Valley Route |
| Bus Stoppage | Sector 45 Market |

Check the **Roster** tab (filter by route + stoppage) and **Route Summary** tab (no filters, just totals) both reflect the new assignment.

### Staff attendance

**Staff Attendance → Mark Attendance** — Admin only. Department is genuinely optional (there's a real "All Departments" option, not a placeholder) — leave it there, keep today's date.

| Employee | Status |
|---|---|
| Priya Sharma | Present |
| Vikram Singh | Present |

### Staff leave

This one needs two logins — do it as a small role-switch exercise. Leave Type is a fixed 3-option dropdown (Casual Leave / Sick Leave / Earned Leave), not free text.

1. Log out, log back in as Priya Sharma (Role: Teacher) using the credentials you captured earlier.
2. Go to **My Leave → Apply for Leave**:

   | Field | Enter |
   |---|---|
   | Leave Type | Casual Leave |
   | From | tomorrow |
   | To | day after tomorrow |
   | Reason | Family function |

3. Log out, log back in as SystemAdmin. Go to **Leave Approval**, find Priya's request, click **Approve** (plain confirm, no reason needed).
4. Optional: apply for a second leave request (any employee) and this time click **Reject** — a rejection reason is required by the dialog, unlike Approve.

---

## 04 · Assessment

Pass/Fail (`isPass`) comes back from the server already computed — the Angular app just displays whatever boolean it's given, it doesn't calculate a percentage threshold itself. There's no "pass marks" field anywhere in the UI.

### Marks entry

**Exam → Marks Entry** — Admin or Teacher. Class 6 - A, Exam Type "Unit Test 1", Subject Mathematics (the Subject dropdown stays disabled until Class-Section is picked — that's expected). Max Marks defaults to 100 but is editable; set it to 25.

| Student | Marks Obtained | Remark |
|---|---|---|
| Ishaan Malhotra | 22 | Good |
| Diya Kapoor | 24 | Excellent |
| Arjun Nair | 7 | Needs improvement |

7 / 25 is 28% — below the 33% pass line, so Arjun should come out a clear Fail on this subject once you check the report card. Repeat for one more subject (English, say) if you want more than one row on the report card. While you're on this tab, also try the **Notify Exam Results** button — it emails/SMSes parents for the whole class-section + exam type, no extra fields, just a confirm.

### Report card

**Exam → Report Card**. Pick Class 6 - A, then Student, then Exam Type (both Student and Exam Type stay disabled until their prerequisite is chosen). Pick Arjun Nair / Unit Test 1 — confirm the Mathematics row shows Fail and the overall chip shows Fail. Then pick Ishaan or Diya to see a Pass. Click **Print Report Card** on at least one — it opens the dedicated printable route.

---

## 05 · Money

> **Expect ₹0 in "Total Expected."** There's no screen anywhere — School Profile, Setup, or otherwise — to configure how much tuition a class owes per session; that table exists in the database but nothing in the UI writes to it. This is a real, still-open gap, not something new to chase down. You can still collect a payment and print a receipt; the "Due" figure just won't mean anything until that's addressed server-side.

### Collect fee

**Fee → Collect Fee** — Admin or Accountant. Class 6 - A, Ishaan Malhotra. Pay Mode is required; Fee Category is optional (both dropdowns work fine now — no seeding blocker).

| Field | Enter |
|---|---|
| Pay Mode | Cash |
| Fee Category | Tuition Fee |
| Amount | 5000 |
| Fine Amount | 0 |
| Discount Amount | 0 |
| Payment Date | today |
| Remark | April tuition fee |

Collecting redirects straight to the dedicated printable receipt route. Print it, come back, and try **Cancel Receipt** on it too — it requires a typed reason before it'll go through.

### Collection report

**Fee → Collection Report**. Run the report for this month (From/To default to the 1st of the month and today) — you should see Ishaan's ₹5,000 under Cash in both the table and the bar chart. Try **Send Fee Due Reminders** too — it's a plain confirm-and-fire action with no fields, it emails/SMSes every parent with an outstanding balance.

### Payroll

**Payroll** — Admin or Accountant. This is a single Month picker (`YYYY-MM`), no separate year field.

1. Leave the month on the current month, click **Generate Payroll**. Priya and Vikram should both appear with Basic Salary, EPF/EPS deductions (from the School Profile percentages), and Net Salary.
2. Click **Mark Paid** on Priya's row (plain confirm, no fields).
3. Log in as Priya Sharma again, open **My Payslips**, and print her payslip.

---

## 06 · Records & extras

### ID cards & certificates

These three all live behind the **edit** view of a Student/Employee record (the buttons only render once you're editing an existing person, not from the list directly).

- **Student ID Card** — open Ishaan Malhotra's edit page, click **ID Card**, print it.
- **Employee ID Card** — same idea from Priya Sharma's edit page.
- **Bonafide Certificate** — pick Diya Kapoor. It's fully auto-composed; the only input is which student.
- **Transfer Certificate** — destructive: saving it marks the student inactive/left. It's a 24-field form, but only 5 are actually required: **TC Number, TC Date, Name of Pupil, Date of Leaving, Reason for Leaving**. Fill it in for Arjun Nair to see the full layout, but only click **Generate & Print** if you're fine losing him as an active test student afterward (a confirm dialog warns you first: *"Issuing a Transfer Certificate for Arjun Nair will mark this student as inactive/left. Continue?"*). Otherwise fill it in and just navigate away.

### Promote students

**Students → Promote Students**. This needs a source *and* a target session + class-section (4 selects total). Since Class 6 is the only class you've created so far, quickly add a second session and class first if you haven't already: Setup → Sessions → Start Year `2027`, and Setup → Classes & Sections → `Class 7`. Then:

| Field | Enter |
|---|---|
| Source Session | 2026 - 2027 |
| Source Class - Section | Class 6 - A |
| Target Session | 2027 - 2028 |
| Target Class - Section | Class 7 - A |

The roster auto-loads and every student is pre-selected via checkbox (there's a tri-state "select all" too). Click **Promote Selected** and check the result summary.

### Bulk import students

**Students → Bulk Import** — CSV only (no `.xlsx`). Click **Download Template** to get the exact header row, which is:

```
Name, FatherName, MotherName, ContactNumber, DOB, Gender, AdmissionNumber, RollNumber, Class, Section, SessionStart
```

Add one or two rows targeting Class 6 / Section A / SessionStart 2026, try one row with a `dd-MM-yyyy`-style DOB (it should auto-normalize) and one with a `Class`/`Section` value that doesn't exist (it should reject just that row with an inline error, not fail the whole batch). Then **Import**.

### Document verification

**Document Verification** — Admin only. The Birth Certificate and Photo you uploaded for Diya and Arjun earlier should be sitting here as Student-type pending rows (filterable by All/Student/Employee/School). Approve one — plain confirm, no reason. Reject the other with a typed reason — required this time.

### Activity log

**Activity Log** — Admin only. Defaults to the last 7 days; click **Run**. You should see entries for most of what you've done today. Also try the **Type** filter (All / Student / Employee / FeeReceipt / ExamMarks / Attendance) — it filters the already-loaded rows client-side rather than re-querying.

### Library

**Catalog tab — Add Book**

| Field | Enter |
|---|---|
| Title | The Alchemist |
| Author | Paulo Coelho |
| ISBN | 9780061122415 |
| Category | Fiction |
| Publisher | HarperOne |
| Total Copies | 3 |

Switch to **Issue & Returns**, issue it to Ishaan Malhotra (Borrower Type: Student → pick Class 6 - A → pick Ishaan) with a due date (defaults to +14 days). Then click **Return** on that same row to close the loop — it's a plain confirm, no form. If you captured Ishaan's login earlier, sign in as him and check **My Books** too (read-only, no actions there).

### Hostel

**Rooms tab — Add Room**

| Field | Enter |
|---|---|
| Hostel Block | Block B |
| Room Number | 201 |
| Capacity | 2 |

On the **Allocations** tab, filter by Class 6 - A, then allocate that room to Diya Kapoor. Confirm the room's occupied count ticks up to `1/2`. Try **Vacate** afterward (plain confirm) to confirm it drops back to `0/2`.

### Inventory

**Items tab — Add Item**

| Field | Enter |
|---|---|
| Name | Whiteboard Marker |
| Category | Stationery |
| Unit | box |
| Reorder Level | 10 |

Record a Stock In of 50 (remark "Purchased from ABC Stationers" — Remark is genuinely optional here, feel free to leave it blank on one of the transactions), then a Stock Out of 5. Stock should read `45 box` afterward, with no "Reorder" tag yet (45 > 10).

Stock Out again for 40 more, taking it down to 5 — confirm the row now shows a **"Reorder"** tag next to the quantity. This is computed live (`quantityInStock < reorderLevel`) on every load, not a flag set once at creation, so it should appear/disappear purely based on current stock vs. reorder level.

Click **Edit** on the item and drop Reorder Level to 3 — confirm the "Reorder" tag disappears immediately after saving (still 5 in stock, but now above the lowered threshold), proving the comparison is live rather than cached from when the tag first appeared.

Then, deliberately, try a Stock Out of a much larger quantity than what's in stock (say 500) — **there is no client-side guard against this in the Angular form**, so this is an actual open question rather than a confirmed behavior: see whether the backend blocks it, lets it go negative silently, or errors. Whatever happens, that's useful signal, not a given.

Add one more throwaway item (e.g. "Test Chalk Box") just to click **Remove** on it — confirm it disappears from the Items table immediately.

Check **Transaction History** (filterable by item) shows all the rows either way. Two things worth confirming here that aren't obvious from the UI alone: (1) unlike Activity Log's Type filter, which filters an already-loaded client-side list, this item dropdown re-queries the server on every change — switch between "All Items" and a specific item a couple of times to confirm both states actually reload; (2) the item you just removed still has its past transactions visible under "All Items" (the history query isn't scoped to active items) even though it no longer appears as a selectable option in the per-item dropdown.

---

## Known issues

Genuine gaps and quirks found while verifying this guide against the current source — not intentional test cases.

### Still open
- **No per-class fee configuration screen.** Whatever backs "Total Expected" on Collect Fee (something like a per-class tuition/advance-fee table) has no admin UI anywhere to populate it. Expect ₹0 until someone seeds it directly in the database.
- **Exam Types' Semester field is a plain number box**, not a dropdown, because the "Semester" lookup group was never seeded on the backend (only 8 lookup groups exist: Gender, Blood Group, Bank Account Type, Medium Type, Admission Scheme, Admission Type, Religion, Attendance Status — no ninth one for Semester).
- **Pay Modes and Exam Types can't be deactivated** once created, only edited — no deactivate endpoint exists for either. (Departments, Designations, Subjects, Bus Routes, Bus Stoppages, and Houses can all be deactivated.)
- **Document Verification's "School"-type document links are broken** — the id it has for a School-owned document is actually the document-type id, not the school's real id, so the file link can't resolve. Student and Employee document links work fine.

### Fixed since the last guide (don't re-report these)
- Bank and Payment Category dropdowns are pre-seeded (227 banks, 12 categories) — Pay Modes is not blocked.
- Caste Category is a normal, working, pre-seeded flat dropdown — no Religion cascade was ever wired up, so there's nothing to be broken.

### Cosmetic / worth knowing, not blocking
- The seeded Religion list has a duplicate: "Sikhism" appears twice (it looks like one of the two was meant to be a different religion, e.g. Jainism). You'll effectively only have 6 distinct religion choices instead of 7.
- Sections can only get auto-lettered names (A, B, C…) — there's no way to type a custom section name.
- A duplicate Subject name silently updates the existing row instead of erroring.
- Inventory is the opposite case: a duplicate Item name creates a second, separate row instead of updating or erroring — there's no server-side uniqueness check on Item Name at all.
- Nothing in the frontend blocks a purely numeric class name (e.g. `6` with no "Class" prefix) — if you need that blocked, it'd have to be a backend rule.

### By design, not a bug
- The Users screen has no create-user form — logins are only ever generated as a side effect of saving a new Student or Employee; Users only lets you reset an existing login's password.
- Notices have no audience/role targeting — every notice is visible to every logged-in role, always.
- Timetable's Teacher, Start Time, and End Time are all optional on a period — only Period # and Subject are required.

---

## Full checklist

Same order as above, condensed. Tick as you go.

- [ ] School Profile saved, logo replaced once
- [ ] Class 6, Sections A & B created (Class 7 + 2027 session added later for Promote)
- [ ] Departments, Designations added
- [ ] Subjects added (all 5, including Mathematics/English) & assigned to Class 6
- [ ] Pay Modes created (no SQL workaround needed)
- [ ] Exam Types created
- [ ] Bus Route + Stoppage created
- [ ] Houses created
- [ ] Ishaan admitted via Admission pipeline, credentials captured
- [ ] Diya & Arjun added directly, Caste Category actually filled in
- [ ] Priya & Vikram added as employees, credentials captured
- [ ] Reset a password from the Users screen
- [ ] Attendance marked for Class 6 - A
- [ ] Homework posted
- [ ] Timetable period added (one with no teacher, to confirm it's optional)
- [ ] Notice posted
- [ ] Transport assigned to Ishaan
- [ ] Staff attendance marked
- [ ] Staff leave applied, approved, and (optionally) a second one rejected
- [ ] Marks entered, Arjun fails Math; tried Notify Exam Results
- [ ] Report card printed
- [ ] Fee collected, receipt printed, and cancelled with a reason
- [ ] Collection report reviewed; fee due reminders sent
- [ ] Payroll generated & payslip printed
- [ ] ID cards printed (student + employee)
- [ ] Bonafide certificate generated
- [ ] Transfer certificate form exercised (not necessarily saved)
- [ ] Students promoted (source/target session + class-section)
- [ ] Bulk import tried, including a bad-date row and a bad-class row
- [ ] Documents approved/rejected
- [ ] Activity log reviewed with the Type filter
- [ ] Book issued & returned; My Books checked as the student
- [ ] Room allocated & vacated
- [ ] Inventory stock in/out recorded, "Reorder" tag confirmed to appear/disappear live off current stock vs. reorder level
- [ ] Inventory item edited and a throwaway item removed; Transaction History checked (server-refetching item filter, removed item's history still visible under "All")
- [ ] Inventory: deliberate over-withdrawal tried to see what actually happens

Every field, label, and route above was read directly from the current source and the backend's seed migrations — not recalled from memory — so it should match what's on screen exactly. If anything doesn't, that's worth flagging as a real bug.
