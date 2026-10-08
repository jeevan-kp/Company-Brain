// ============================================================================
// server/src/services/onboardingPolicies.js
// 30 Complete HR, Workplace, Governance, and Working Procedure Documents
// AutoNova Group — Enterprise Company Brain Wiki & Employee Knowledge Base
// ============================================================================

const ONBOARDING_DOCUMENTS = [
  {
    id: 'DOC-HR-POL-01',
    title: 'Global Hybrid & Remote Work (WFH) Policy 2026',
    category: 'Workplace & Flexibility',
    effective_date: '2026-01-01',
    owner: 'Julia Neumann (People & Culture Director)',
    summary: 'AutoNova 3:2 Hybrid model (3 days in office, up to 2 days remote weekly). Core collaboration hours 10:00 - 15:00 CET. Home office ergonomics stipend up to €750.',
    tags: ['WFH', 'Remote Work', 'Hybrid', 'Working Hours', 'Ergonomics'],
    content_text: `# AutoNova Global Hybrid & Remote Work Policy (2026)

## 1. Overview & Guiding Principles
AutoNova operates on a collaborative **3:2 Hybrid Working Model**. Employees whose roles do not require physical plant or laboratory presence may work remotely up to two (2) days per week, with three (3) days on campus (Stuttgart HQ, Munich R&D, or regional development hubs).

## 2. Core Collaboration Hours
To facilitate effective cross-domain collaboration across Engineering, Finance, and Cyber Security:
- **Core Hours:** 10:00 AM – 3:00 PM CET (Monday through Thursday).
- During core hours, employees are expected to be available for sprint standups, architectural reviews, and stakeholder communications via Microsoft Teams.
- Friday is designated as a "Focus Day" with minimal cross-team meetings.

## 3. Remote Work Eligibility
- All full-time and part-time salaried employees who have completed their initial onboarding ramp (first 30 days) are eligible.
- Remote work outside of Germany / domicile country: Up to twenty (20) working days per calendar year within the EU/EEA, subject to manager pre-approval and tax compliance check in Workday.

## 4. Equipment & Home Office Stipend
- Each employee receives a one-time **€750 home office setup stipend** via the corporate expense system (Navan) for ergonomic desk, chair, or lighting.
- High-spec IT equipment (MacBook Pro / ThinkPad, 4K monitors) is provided separately by Enterprise IT.

## 5. Security & Confidentiality
- All remote connections must route through the **Zscaler Private Access (ZPA)** zero-trust network.
- Visual privacy: Confidential automotive design data and customer financial records must not be accessed in public transit without a privacy screen filter.`,
    url: 'https://autonova.sharepoint.com/sites/hr-policies/DOC-HR-POL-01-Hybrid-Work.pdf'
  },
  {
    id: 'DOC-HR-POL-02',
    title: 'Annual Leave, Vacation & Public Holidays Directive',
    category: 'Leave & Absences',
    effective_date: '2026-01-01',
    owner: 'Marcus Bauer (Head of HR Operations)',
    summary: '30 standard paid vacation days per calendar year. Up to 5 carryover days permitted until March 31. Booking via Workday HR portal with 2 weeks notice for leaves > 5 days.',
    tags: ['Vacation', 'Annual Leave', 'Holidays', 'Workday', 'Carryover'],
    content_text: `# Annual Leave, Vacation & Public Holidays Directive

## 1. Annual Leave Entitlement
- All standard full-time employees are entitled to **30 working days of paid annual vacation** per calendar year (based on a 5-day work week).
- Part-time employees receive pro-rata leave proportional to their contractual working hours.
- Entitlement accrues on a monthly basis from January 1 to December 31.

## 2. Request & Approval Workflow
- Requests must be submitted via the **Workday HR Portal** (Menu -> Time Off & Leave).
- Leaves of five (5) or more consecutive working days require at least two (2) weeks advance notice to ensure sprint continuity and critical on-call coverage.
- Managers are required to respond within three (3) business days.

## 3. Carryover Policy
- Employees are encouraged to take all 30 vacation days within the calendar year to ensure work-life balance and mental rejuvenation.
- Up to **5 unused vacation days** may be automatically carried over into the following calendar year, and must be taken before **March 31**. Any unspent carryover days expire on April 1 unless formal medical deferral was granted.

## 4. Statutory Public Holidays
- Public holidays are granted according to the employee's official contract location (e.g., Baden-Württemberg public holidays for Stuttgart HQ, Bavaria for Munich R&D).`,
    url: 'https://autonova.sharepoint.com/sites/hr-policies/DOC-HR-POL-02-Annual-Leave.pdf'
  },
  {
    id: 'DOC-HR-POL-03',
    title: 'Global Payroll Schedule, Cut-Off Dates & Salary Disbursements',
    category: 'Payroll & Compensation',
    effective_date: '2026-01-01',
    owner: 'Thomas Keller (CFO) & Sandra Meyer (Payroll Lead)',
    summary: 'Monthly payroll processed on the 24th of each month (disbursed on 25th or nearest prior business day). Cut-off for expense reports and overtime approvals is the 18th of the month.',
    tags: ['Payroll', 'Salary', 'Cut-Off Dates', 'Payslip', 'Banking'],
    content_text: `# Global Payroll Schedule, Cut-Off Dates & Salary Disbursements

## 1. Salary Payment Dates
- Monthly salary is processed and disbursed on the **25th day of each calendar month**.
- If the 25th falls on a weekend or German bank holiday, funds will be deposited into employee bank accounts on the **immediately preceding business day**.

## 2. Monthly Cut-Off Deadlines
To ensure accurate processing of monthly compensation adjustments:
- **Variable compensation, bonuses & overtime hours:** Must be approved in Workday by **18:00 CET on the 18th of the month**.
- **Business travel expenses & mileage reimbursements:** Must be submitted and manager-approved in Navan by **18:00 CET on the 18th**.
- **Bank account changes or tax class updates:** Must be finalized in Workday by the **15th of the month** for the change to take effect in the current cycle.

## 3. Accessing Digital Payslips
- Payslips (Entgeltabrechnung) are published digitally on the **AutoNova Employee Payroll Portal** (https://payroll.autonova.internal) on the 23rd of each month.
- Two-factor authentication (Microsoft Authenticator) is required to access tax summaries and payslip PDFs. Digital payslips remain archived for ten (10) years.`,
    url: 'https://payroll.autonova.internal/docs/payroll-schedule-2026.pdf'
  },
  {
    id: 'DOC-HR-POL-04',
    title: 'Parental, Maternity & Paternity Leave Framework',
    category: 'Leave & Absences',
    effective_date: '2026-01-01',
    owner: 'Julia Neumann (People & Culture Director)',
    summary: '16 weeks fully paid maternity leave, 6 weeks fully paid paternity / secondary caregiver leave. Flexible return-to-work part-time schemes up to child\'s 3rd year.',
    tags: ['Parental Leave', 'Maternity', 'Paternity', 'Childcare', 'Elternzeit'],
    content_text: `# Parental, Maternity & Paternity Leave Framework

## 1. Maternity Protection & Paid Leave
- Expectant mothers receive **16 weeks of fully paid maternity leave** (6 weeks prior to expected delivery date and 10 weeks postpartum).
- AutoNova supplements statutory health insurance maternity allowance to ensure 100% net salary replacement during this statutory protection period.

## 2. Secondary Caregiver & Paternity Leave
- Partners, secondary caregivers, and adoptive parents are entitled to **six (6) weeks of fully paid parental bonding leave**, taken consecutively or in two tranches within the first twelve (12) months following birth or adoption.

## 3. Statutory Parental Leave (Elternzeit)
- In addition to paid employer leave, employees are entitled to statutory Elternzeit up to their child's third birthday.
- AutoNova provides guaranteed job retention and equivalent grade level upon return.
- "Welcome Back" ramp program: Returning parents may elect a phased return (60% or 80% hours) for the first three months with flexible core hours.`,
    url: 'https://autonova.sharepoint.com/sites/hr-policies/DOC-HR-POL-04-Parental-Leave.pdf'
  },
  {
    id: 'DOC-HR-POL-05',
    title: 'Employee Health Insurance & Comprehensive Wellness Benefits',
    category: 'Benefits & Health',
    effective_date: '2026-01-01',
    owner: 'Dr. Florian Becker (Corporate Health Director)',
    summary: 'Premium private supplementary health, dental, and vision insurance with Allianz Care. 100% employer contribution for employee, optional family addition.',
    tags: ['Health Insurance', 'Dental', 'Vision', 'Allianz', 'Wellness', 'Benefits'],
    content_text: `# Employee Health Insurance & Comprehensive Wellness Benefits

## 1. Supplementary Corporate Health Plan (bKV)
- AutoNova partners with **Allianz Care** to provide a premier corporate supplementary health insurance plan (betriebliche Krankenversicherung) for all permanent staff.
- **100% Employer Funded:** No deductions from monthly salary for base employee coverage.
- Scope includes:
  - Dental prophylaxis and implants up to €2,000 annually.
  - Vision care: Annual allowance of €400 for prescription glasses or contact lenses.
  - Premium hospital care: Private two-bed room and chief physician (Chefarzt) treatment.

## 2. Corporate Fitness & Gym Subsidies
- All staff receive subsidized membership to **Urban Sports Club (M-Package or higher)** or **EGYM Wellpass** with over 6,000 participating gym, swimming, and yoga locations across Germany. AutoNova subsidizes €45/month directly.

## 3. Annual Preventive Health Check-Ups
- Free on-site medical check-ups at Stuttgart and Munich campus medical centers, including cardiovascular screening, ergonomic spinal checks, and seasonal influenza / COVID booster vaccinations.`,
    url: 'https://autonova.sharepoint.com/sites/hr-policies/DOC-HR-POL-05-Health-Benefits.pdf'
  },
  {
    id: 'DOC-HR-POL-06',
    title: 'IT Equipment Provisioning, Laptop Refresh & Shadow IT Guidelines',
    category: 'IT & Security',
    effective_date: '2026-01-01',
    owner: 'Dr. Elena Rostova (Group CTO) & Dirk Holzer (IT Operations Lead)',
    summary: 'Standard issue: Apple MacBook Pro 16" M3 Max or Lenovo ThinkPad P1 Gen 6 with dual 4K monitors. Refresh cycle every 36 months. Unapproved cloud tools strictly prohibited.',
    tags: ['IT Equipment', 'MacBook', 'ThinkPad', 'Hardware Refresh', 'Shadow IT'],
    content_text: `# IT Equipment Provisioning, Laptop Refresh & Shadow IT Guidelines

## 1. Hardware Standard Issue
New joiners select their primary engineering or business workstation via the **ServiceNow Hardware Catalog**:
- **Engineering / Architecture Track:** Apple MacBook Pro 16" (Apple M3 Max, 36GB Unified RAM, 1TB SSD) or Lenovo ThinkPad P1 Gen 6 (Intel i9, 32GB RAM, NVIDIA RTX 4070, Ubuntu/Windows).
- **Business / Management Track:** Apple MacBook Pro 14" (M3 Pro) or Lenovo ThinkPad X1 Carbon Gen 12.
- **Peripherals:** Dual 27" Dell UltraSharp 4K USB-C monitors, mechanical keyboard, wireless mouse, and Jabra Evolve2 noise-canceling headset.

## 2. Equipment Refresh Cadence
- Workstations are refreshed automatically every **36 months**.
- Employees receive notification 60 days prior to eligibility to configure their replacement machine.
- At refresh, employees may elect to purchase their retired device for fair market scrap value (€150).

## 3. Strict Shadow IT Prohibition
- Storing corporate code, financial records, or vehicle telematics in unapproved personal cloud accounts (Dropbox, Google Drive, personal GitHub, ChatGPT Plus) constitutes a critical security policy violation and triggers immediate disciplinary review.
- Approved enterprise tools: AutoNova GitHub Enterprise, Azure DevOps, Microsoft 365, Confluence, and Company Brain AI Assistant.`,
    url: 'https://itsm.autonova.internal/catalog/hardware-provisioning.pdf'
  },
  {
    id: 'DOC-HR-POL-07',
    title: 'Employee Code of Conduct, Ethics & Anti-Corruption Policy',
    category: 'Governance & Ethics',
    effective_date: '2026-01-01',
    owner: 'Dr. Matthias Brandt (Chief Compliance Officer)',
    summary: 'Zero tolerance for bribery, conflicts of interest, discrimination, or harassment. Mandatory annual compliance certification.',
    tags: ['Code of Conduct', 'Ethics', 'Compliance', 'Anti-Corruption', 'Integrity'],
    content_text: `# Employee Code of Conduct, Ethics & Anti-Corruption Policy

## 1. Fundamental Commitment
AutoNova operates on the principles of integrity, transparency, and accountability. Every employee, contractor, and executive represents the brand and must uphold ethical standards when interacting with customers, suppliers, dealers, and public authorities.

## 2. Fair Competition & Antitrust
- We strictly adhere to EU and global antitrust regulations. Employees must never engage in price fixing, market allocation, or unlawful exchange of commercially sensitive data with competitors.
- Sourcing decisions must be based strictly on merit, technical capability, and price transparency.

## 3. Anti-Bribery & Corruption
- AutoNova maintains zero tolerance for bribery, kickbacks, or facilitation payments to public officials or commercial partners.
- Gifts or hospitality exceeding €35 require disclosure and VP approval in the Compliance Portal.

## 4. Respectful Workplace & Harassment
- We cultivate an inclusive workplace free of harassment, intimidation, and discrimination based on race, gender, sexual orientation, disability, age, or religion.
- Violations result in immediate disciplinary action up to termination of employment.`,
    url: 'https://compliance.autonova.internal/policies/code-of-conduct-2026.pdf'
  },
  {
    id: 'DOC-HR-POL-08',
    title: 'Business Travel & Expense Reimbursement Policy',
    category: 'Payroll & Expenses',
    effective_date: '2026-01-01',
    owner: 'Thomas Keller (CFO) & Navan Admin Team',
    summary: 'Travel booked via Navan/SAP Concur. Rail travel preferred for domestic journeys under 4 hours. Daily per diem: €48 Germany, €65 international. Receipt required within 30 days.',
    tags: ['Travel', 'Expenses', 'Reimbursement', 'Navan', 'Per Diem'],
    content_text: `# Business Travel & Expense Reimbursement Policy

## 1. Booking Channels & Sustainability
- All domestic and international business flights, hotels, and train tickets must be booked through the corporate **Navan Travel Portal** (https://travel.autonova.internal).
- **Green Rail Priority:** For travel within Germany and Austria where rail travel time is under 4.5 hours (e.g., Stuttgart to Munich or Frankfurt), Deutsche Bahn ICE 1st Class is mandatory instead of domestic flights.

## 2. Daily Per Diem (Verpflegungsmehraufwand)
- Germany domestic travel (> 24 hours): €48 per calendar day.
- Partial travel days (> 8 hours): €24.
- International travel: Varies by destination country (€65/day for UK/France/US).

## 3. Expense Submissions & Receipts
- Expenses must be submitted in Navan within **30 days** of incurring the cost.
- Itemized VAT receipts (Bewirtungsbeleg for business dinners) must be attached.
- Reimbursements are settled via the monthly payroll cycle or processed via direct weekly bank wire for sums exceeding €500.`,
    url: 'https://travel.autonova.internal/policies/travel-policy-2026.pdf'
  },
  {
    id: 'DOC-HR-POL-09',
    title: 'Annual Performance Review, OKRs & Promotion Cycle',
    category: 'Career & Growth',
    effective_date: '2026-01-01',
    owner: 'Marcus Bauer (Head of HR Operations)',
    summary: 'Bi-annual review cycles (Mid-year in June, Year-end in November). Calibrations in December, salary adjustments and bonuses effective April 1.',
    tags: ['Performance', 'Promotion', 'OKRs', 'Career Growth', 'Bonus'],
    content_text: `# Annual Performance Review, OKRs & Promotion Cycle

## 1. Review Rhythm & Milestones
- **Q1 (January):** Objective & Key Results (OKR) goal setting aligned with corporate mission.
- **Q2 (June):** Mid-Year Check-in & feedback calibration (informal review, course correction).
- **Q4 (November):** Annual Year-End Self-Evaluation & Manager Review in Workday.
- **December:** Leadership calibration committee (peer calibration across engineering tiers E1 to E5).
- **April 1:** Merit salary adjustments, promotional title advancements, and annual performance bonuses take financial effect.

## 2. Career Ladder Progression
- Levels: Associate Engineer -> Engineer -> Senior Engineer / Specialist -> Principal Engineer / GM (E4) -> Director / VP (E2/E3).
- Dual Track: Equal compensation ceilings for Individual Contributors (Principal Architect) and People Management (Engineering Manager / Director).`,
    url: 'https://autonova.sharepoint.com/sites/hr-policies/DOC-HR-POL-09-Performance-Review.pdf'
  },
  {
    id: 'DOC-HR-POL-10',
    title: 'Professional Development, Training Budget & Certification Reimbursement',
    category: 'Career & Growth',
    effective_date: '2026-01-01',
    owner: 'Karin Lindner (Head of People Development)',
    summary: '€2,500 annual personal development budget per employee. 100% coverage for cloud certs (Azure, AWS, CISA, PMP) and German/English language classes.',
    tags: ['Training', 'Budget', 'Certifications', 'Azure', 'AWS', 'Learning'],
    content_text: `# Professional Development & Training Budget Policy

## 1. Annual Individual Learning Envelope
- Every permanent employee is allocated **€2,500 annually** for self-directed professional education, technical conferences, textbooks, and training workshops.
- Unused balance does not roll over to subsequent years.

## 2. Professional Certifications (100% Reimbursed)
The company fully reimburses exam fees and prep materials for approved industry certifications, outside the personal training allowance:
- Cloud & Architecture: Microsoft Certified Azure Solutions Architect Expert, AWS Certified Solutions Architect Professional, CKA (Certified Kubernetes Administrator).
- Security & Audit: CISSP, CISM, TISAX Lead Auditor, ISO 27001 Lead Implementer.
- Agile: Certified Scrum Master (CSM), SAFe Practice Consultant.

## 3. Language Training
- AutoNova offers complimentary German and English corporate classes via Babbel for Business and weekly Berlitz live tutoring sessions.`,
    url: 'https://autonova.sharepoint.com/sites/hr-policies/DOC-HR-POL-10-Training-Budget.pdf'
  },
  {
    id: 'DOC-HR-POL-11',
    title: 'Information Security & Data Protection Classification Standard',
    category: 'IT & Security',
    effective_date: '2026-01-01',
    owner: 'Stefan Mueller (Head of CISO Office)',
    summary: 'TISAX AL3 and GDPR compliance. Four classifications: Public, Internal, Confidential, Restricted. Encryption mandatory for all customer & telematics data.',
    tags: ['Security', 'TISAX', 'GDPR', 'Data Classification', 'Encryption'],
    content_text: `# Information Security & Data Protection Classification Standard

## 1. Compliance Baseline
All information assets at AutoNova are governed by **TISAX Assessment Level 3 (AL3)** and EU General Data Protection Regulation (GDPR) requirements.

## 2. Four-Tier Classification Schema
1. **Public:** Freely disclosable corporate press releases, published vehicle marketing brochures.
2. **Internal:** General intra-company intranet pages, sprint retrospectives, organization directories.
3. **Confidential:** Sourcing supplier pricing, project budgets, non-public source code repositories, sprint roadmaps. Requires role-based access control (RBAC).
4. **Restricted:** Customer PII, vehicle CAN-bus telematics, financial general ledger journals, cryptographic root keys. Requires Multi-Factor Authentication (MFA), customer data masking, and full access logging.

## 3. Encryption & Transmission Rules
- All Restricted and Confidential data must be encrypted in transit using TLS 1.3 and at rest with AES-256 Customer Managed Encryption Keys (CMEK).`,
    url: 'https://security.autonova.internal/standards/data-classification-standard.pdf'
  },
  {
    id: 'DOC-HR-POL-12',
    title: 'Workplace Ergonomics, Equipment Stipend & Health Support',
    category: 'Benefits & Health',
    effective_date: '2026-01-01',
    owner: 'Dr. Florian Becker (Corporate Health Director)',
    summary: 'One-time €750 home office equipment stipend. Free annual ergonomic chair & desk assessments by Corporate Health & Safety.',
    tags: ['Ergonomics', 'Health', 'Desk Setup', 'Stipend', 'Safety'],
    content_text: `# Workplace Ergonomics, Equipment Stipend & Health Support

## 1. Campus Ergonomics Standards
- Every workstation across AutoNova campuses is equipped with an electrically height-adjustable sit-stand desk (Stehpult) and an ergonomically certified Herman Miller / Steelcase task chair.
- On-site employees may request custom ergonomic trackball mice, split mechanical keyboards, and monitor riser arms through ServiceNow.

## 2. Home Office Equipment Stipend
- Permanent employees working on the 3:2 hybrid schedule receive a **one-time reimbursement of up to €750** for ergonomic office furnishings.
- Eligible items: Certified ergonomic office chairs, sit-stand converter desks, desk lamps with circadian daylight simulation, and footrests. Submit invoices in Navan under "Category: Home Office Ergonomics".

## 3. Free Ergonomic Assessment
- Corporate Safety Specialists offer 30-minute virtual and on-site ergonomics consultations to inspect monitor eye-level alignment, posture, and seating posture.`,
    url: 'https://autonova.sharepoint.com/sites/hr-policies/DOC-HR-POL-12-Ergonomics-Policy.pdf'
  },
  {
    id: 'DOC-HR-POL-13',
    title: 'Employee Mental Health & Employee Assistance Program (EAP)',
    category: 'Benefits & Health',
    effective_date: '2026-01-01',
    owner: 'Dr. Florian Becker (Corporate Health Director)',
    summary: '24/7 confidential counseling services via Modern Health / Workplace Options. Up to 8 free therapy sessions per year per family member.',
    tags: ['Mental Health', 'EAP', 'Counseling', 'Wellbeing', 'Confidential'],
    content_text: `# Employee Mental Health & Employee Assistance Program (EAP)

## 1. Confidential Support Overview
AutoNova provides a comprehensive, 100% confidential Employee Assistance Program (EAP) in partnership with **Modern Health** and **Workplace Options**. The service is accessible 24 hours a day, 365 days a year, for employees and immediate household family members.

## 2. Scope of Services
- **Psychological Support:** Work-related stress, anxiety, grief, relationship challenges, and burnout prevention.
- **Family & Life Assistance:** Eldercare navigation, child behavioral counseling, crisis mediation.
- **Legal & Financial Guidance:** Certified initial legal counsel and financial planning consultations.

## 3. Free Therapy & Coaching Sessions
- Each employee and dependent is entitled to up to **eight (8) free professional sessions per calendar year** with a licensed therapist or certified behavioral coach.
- Total Confidentiality: AutoNova receives only aggregate, anonymized utilization statistics. Zero personal identity or diagnostic data is shared with HR or management.
- Emergency 24/7 Crisis Hotline: +49 800 664-9122 (Toll-Free Germany).`,
    url: 'https://autonova.sharepoint.com/sites/hr-policies/DOC-HR-POL-13-Mental-Health-EAP.pdf'
  },
  {
    id: 'DOC-HR-POL-14',
    title: 'Company Vehicle & Sustainable Mobility Budget (Mobility Card)',
    category: 'Benefits & Health',
    effective_date: '2026-01-01',
    owner: 'Thomas Keller (CFO) & Fleet Services Team',
    summary: '€350/month green mobility budget (Deutsche Bahn JobTicket, bike lease JobRad, public transit) or company EV lease for Senior Specialists & Managers (E4+).',
    tags: ['Mobility', 'JobTicket', 'JobRad', 'Company Car', 'EV', 'Green Transit'],
    content_text: `# Company Vehicle & Sustainable Mobility Budget

## 1. The AutoNova Green Mobility Budget
AutoNova is committed to carbon-neutral commute solutions. Employees can choose between:
- **Option A: Green Mobility Allowance (€350/month):** Stored on a corporate digital Mobility Card. Can be used for Deutsche Bahn ICE JobTicket, local transit passes (Deutschlandticket), e-scooters, and bike-sharing apps.
- **Option B: JobRad Bicycle Leasing:** Pre-tax salary sacrifice leasing for up to two premium e-bikes, gravel bikes, or road bikes, fully covered by comprehensive theft and repair insurance.

## 2. Executive & Senior Management EV Program (E4, E3, E2, E1)
- General Managers (E4), Directors (E2), and VPs (E3) are eligible for a 100% electric company vehicle (e.g., Porsche Taycan, Audi e-tron, BMW i5, Mercedes EQE) with free charging across all AutoNova campus chargers and complimentary home wallbox installation.`,
    url: 'https://autonova.sharepoint.com/sites/hr-policies/DOC-HR-POL-14-Mobility-Policy.pdf'
  },
  {
    id: 'DOC-HR-POL-15',
    title: 'Company Pension Scheme & Retirement Matching (bAV)',
    category: 'Payroll & Compensation',
    effective_date: '2026-01-01',
    owner: 'Thomas Keller (CFO) & Sandra Meyer (Payroll Lead)',
    summary: 'AutoNova matches employee pension contributions up to 6% of gross base salary with Allianz Pensionskasse. Immediate vesting after 12 months service.',
    tags: ['Pension', 'Retirement', 'bAV', 'Allianz', 'Matching', 'Savings'],
    content_text: `# Company Pension Scheme & Retirement Matching (bAV)

## 1. Company Pension Scheme (betriebliche Altersversorgung)
To ensure long-term financial security for employees after retirement, AutoNova sponsors a tax-advantaged direct insurance pension model (Direktversicherung) managed by **Allianz Pensionskasse AG**.

## 2. Employer Matching Scale
- **Base Employer Contribution:** AutoNova contributes an automatic 2% of annual gross salary into the pension fund for all employees after 6 months of service, regardless of individual employee contributions.
- **Matching Incentive:** If the employee elects a pre-tax salary conversion (Entgeltumwandlung), AutoNova matches euro-for-euro up to an additional **4% of gross salary**.
- Total combined annual corporate contribution: Up to **6% of annual salary**.

## 3. Portability & Vesting
- Unconditional immediate vesting rights occur after twelve (12) months of continuous corporate service. Existing pensions from prior German employers can be transferred into the plan fee-free.`,
    url: 'https://autonova.sharepoint.com/sites/hr-policies/DOC-HR-POL-15-Pension-Scheme.pdf'
  },
  {
    id: 'DOC-HR-POL-16',
    title: 'Employee Stock Purchase Plan (ESPP) & Long-Term Incentives',
    category: 'Payroll & Compensation',
    effective_date: '2026-01-01',
    owner: 'Thomas Keller (CFO) & Investor Relations',
    summary: 'Employees can contribute up to 10% of gross salary with a 15% discount on AutoNova Group shares. 12-month holding period.',
    tags: ['ESPP', 'Stocks', 'Equity', 'Shares', 'Incentives', 'Investment'],
    content_text: `# Employee Stock Purchase Plan (ESPP) & Long-Term Incentives

## 1. Program Intent
The AutoNova ESPP enables employees to share directly in the long-term capital appreciation and strategic commercial success of the group.

## 2. Enrollment Windows & Contribution Limits
- Enrollment occurs semi-annually in **May** and **November** via Computershare Investor Center.
- Employees may designate between 1% and 10% of monthly gross salary to purchase shares through payroll deductions.

## 3. Preferred Discount & Holding Period
- Purchase Price: Shares are acquired at a **15% discount** off the closing market price on the purchase date (last business day of June and December).
- **Holding Period:** Acquired shares are subject to a minimum 12-month holding restriction to promote long-term organizational stewardship. Dividends paid during the holding period are disbursed directly to employee accounts.`,
    url: 'https://investors.autonova.internal/espp-guidelines-2026.pdf'
  },
  {
    id: 'DOC-HR-POL-17',
    title: 'Whistleblower Protection & Anonymous Incident Reporting',
    category: 'Governance & Ethics',
    effective_date: '2026-01-01',
    owner: 'Dr. Matthias Brandt (Chief Compliance Officer)',
    summary: 'Independent confidential whistleblower hotline operated by external ombudsman. Legal protection under EU Whistleblower Directive 2019/1937.',
    tags: ['Whistleblower', 'Reporting', 'Ethics', 'Compliance', 'Ombudsman'],
    content_text: `# Whistleblower Protection & Anonymous Incident Reporting

## 1. Whistleblower Protection Guarantee
AutoNova guarantees full legal, professional, and disciplinary protection for any employee reporting bona fide violations of laws, safety regulations, accounting standards, or ethical codes in accordance with the **EU Whistleblower Directive (2019/1937)** and the German Hinweisgeberschutzgesetz (HinSchG). Retaliation in any form is unlawful and grounds for immediate dismissal.

## 2. External Ombudsman Channels
To maintain absolute neutrality, reports can be submitted through our external legal ombudsman:
- **Digital Portal (BKMS System):** https://integrity.autonova.internal (accessible from external internet, SSL-encrypted, IP addresses not logged).
- **External Attorney Ombudsman:** Dr. Hans-Peter Wagner, Rechtsanwalt (Stuttgart) — Toll-Free: +49 800 994-3320.
- Reports may be submitted completely anonymously with an encrypted pin to receive case status updates.`,
    url: 'https://integrity.autonova.internal/whistleblower-guidelines.pdf'
  },
  {
    id: 'DOC-HR-POL-18',
    title: 'Sick Leave, Medical Certification & Sickness Allowance',
    category: 'Leave & Absences',
    effective_date: '2026-01-01',
    owner: 'Marcus Bauer (Head of HR Operations)',
    summary: 'Medical certificate (Arbeitsunfähigkeitsbescheinigung / eAU) required from Day 3 of illness. Full base salary paid up to 6 weeks per illness.',
    tags: ['Sick Leave', 'Medical Certificate', 'eAU', 'Illness', 'Doctor'],
    content_text: `# Sick Leave, Medical Certification & Sickness Allowance

## 1. Notification Protocol
- In case of incapacity to work due to illness, the employee must notify their direct manager via Teams or email and record the absence in Workday **before 9:00 AM CET** on the first morning of absence.

## 2. Medical Certificate (eAU)
- For absences exceeding two (2) calendar days, a statutory electronic medical certificate of incapacity (elektronische Arbeitsunfähigkeitsbescheinigung - eAU) from an authorized physician is required by **Day 3**.
- AutoNova retrieves the eAU electronically from German statutory health insurance funds (Krankenkassen). Employees visiting private physicians must upload a digital scan to Workday within 5 business days.

## 3. Continued Salary Payment (Entgeltfortzahlung)
- AutoNova continues to pay **100% of regular net base salary** for up to six (6) weeks for the same illness in accordance with German statutory regulations. After 6 weeks, statutory sick pay (Krankengeld) is provided by the employee's health insurer.`,
    url: 'https://autonova.sharepoint.com/sites/hr-policies/DOC-HR-POL-18-Sick-Leave.pdf'
  },
  {
    id: 'DOC-HR-POL-19',
    title: 'Compassionate, Caregiver & Special Emergency Leave',
    category: 'Leave & Absences',
    effective_date: '2026-01-01',
    owner: 'Julia Neumann (People & Culture Director)',
    summary: 'Up to 5 days paid leave for bereavement (first-degree relatives), 3 days for marriage, up to 10 days unpaid/paid statutory leave for acute relative care.',
    tags: ['Compassionate Leave', 'Bereavement', 'Marriage', 'Special Leave', 'Caregiver'],
    content_text: `# Compassionate, Caregiver & Special Emergency Leave

## 1. Special Paid Leave Events (Sonderurlaub)
AutoNova grants fully paid special leave days for extraordinary personal life milestones:
- **Death of immediate family member (spouse, child, parent):** Five (5) working days paid leave.
- **Death of secondary relative (grandparent, sibling):** Two (2) working days.
- **Personal Marriage / Civil Partnership:** Three (3) working days.
- **Birth of employee's child (for non-birthing parent):** In addition to statutory bonding leave, two (2) immediate emergency days.
- **Relocation for business purposes:** Two (2) working days.

## 2. Acute Family Caregiver Leave (Pflegezeit)
- Employees experiencing a sudden, acute family health emergency of a close relative are entitled to up to ten (10) working days of care leave to organize emergency home care, supported by statutory Pflegeunterstützungsgeld.`,
    url: 'https://autonova.sharepoint.com/sites/hr-policies/DOC-HR-POL-19-Special-Leave.pdf'
  },
  {
    id: 'DOC-HR-POL-20',
    title: 'Intellectual Property, Inventions & Patent Incentive Rewards',
    category: 'Career & Growth',
    effective_date: '2026-01-01',
    owner: 'Dr. Elena Rostova (Group CTO) & Legal IP Team',
    summary: 'Employee Invention Act compliance. €1,500 reward on patent filing, €3,000 additional upon patent grant.',
    tags: ['Patents', 'Intellectual Property', 'Inventions', 'Bounty', 'Engineering'],
    content_text: `# Intellectual Property, Inventions & Patent Incentive Rewards

## 1. Innovation Stewardship
AutoNova pioneers breakthrough engineering across autonomous vehicle telematics, battery charging algorithms, and cloud security architecture. Employees who create novel technological inventions are governed by the German Employee Invention Act (Arbeitnehmererfindungsgesetz - ArbnErfG).

## 2. Invention Disclosure Workflow
- Inventions must be submitted via the **IP Portal** (https://patent.autonova.internal) using the standard Employee Invention Notification template.
- The Patent Committee reviews disclosures within sixty (60) days to determine whether to file European (EPO) and international (USPTO) patent applications.

## 3. Financial Incentive Schedule
- **Patent Filing Incentive:** **€1,500 cash bonus** paid to the inventor(s) upon formal submission of the patent application to the patent office.
- **Patent Grant Incentive:** Additional **€3,000 cash bonus** upon official grant and publication of the patent.
- **Commercial Exploitation Royalty:** Inventors receive statutory annual compensation where inventions are integrated into commercial vehicle production series.`,
    url: 'https://patent.autonova.internal/guidelines/patent-incentives-2026.pdf'
  },
  {
    id: 'DOC-HR-POL-21',
    title: 'Diversity, Equity, Inclusion & Anti-Harassment Standards',
    category: 'Governance & Ethics',
    effective_date: '2026-01-01',
    owner: 'Julia Neumann (People & Culture Director)',
    summary: 'Commitments to equal pay, gender diversity on leadership boards (min 40% target), neurodiversity accommodations, and employee resource groups (ERGs).',
    tags: ['Diversity', 'Equity', 'Inclusion', 'DEI', 'Equal Pay', 'Belonging'],
    content_text: `# Diversity, Equity, Inclusion & Anti-Harassment Standards

## 1. Vision & Core Principles
At AutoNova, exceptional technological innovation stems from diverse perspectives. We champion an inclusive, merit-based culture where talent thrives regardless of nationality, gender identity, neurodivergence, sexual orientation, disability, or religious belief.

## 2. Gender Parity & Equal Pay Commitment
- We actively track zero gender pay gap across equivalent engineering and managerial grades (audited bi-annually by external HR telemetry).
- Target: Minimum 40% female representation in leadership positions (E1 to E4) across software engineering and finance by 2028.

## 3. Employee Resource Groups (ERGs)
AutoNova sponsors fully funded, employee-led affinity groups:
- **Women in Automotive Tech (WAT)**
- **Pride@AutoNova (LGBTQ+ & Allies)**
- **Neurodiversity Works (Workplace accommodations & focus spaces)**
- **Global Citizens Network (Expat & international integration)**
Each ERG receives an annual operational budget of €15,000 to host events, mentoring circles, and guest keynotes.`,
    url: 'https://autonova.sharepoint.com/sites/hr-policies/DOC-HR-POL-21-DEI-Standards.pdf'
  },
  {
    id: 'DOC-HR-POL-22',
    title: 'Internal Job Mobility, Secondments & Talent Transfers',
    category: 'Career & Growth',
    effective_date: '2026-01-01',
    owner: 'Karin Lindner (Head of People Development)',
    summary: 'Employees eligible to apply for internal openings after 12 months in current role without prior manager sign-off for initial application.',
    tags: ['Internal Mobility', 'Transfers', 'Career', 'Jobs', 'Secondments'],
    content_text: `# Internal Job Mobility, Secondments & Talent Transfers

## 1. Internal Talent Priority
AutoNova prioritizes internal promotions and cross-domain transfers before engaging external recruiting agencies. All open roles are posted on the **Company Brain Talent Marketplace** and Workday Internal Careers site for a minimum of ten (10) business days.

## 2. Eligibility & Application Guidelines
- Employees with at least **twelve (12) months continuous service** in their current role and meeting performance expectations are eligible to apply for any internal vacancy.
- **Confidential Applications:** Employees are NOT required to notify their current manager when submitting an initial application or participating in early round interviews. Current managers are notified only once a formal offer is extended.

## 3. Transfer Transition Notice
- Once an internal offer is accepted, the releasing manager and receiving manager agree on a transition timeline. Maximum transition duration is **six (6) weeks**, ensuring orderly knowledge handover.`,
    url: 'https://autonova.sharepoint.com/sites/hr-policies/DOC-HR-POL-22-Internal-Mobility.pdf'
  },
  {
    id: 'DOC-HR-POL-23',
    title: 'Overtime, On-Call Duty (Rufbereitschaft) & Weekend SRE Allowance',
    category: 'Payroll & Compensation',
    effective_date: '2026-01-01',
    owner: 'Dr. Elena Rostova (Group CTO) & Sandra Meyer (Payroll Lead)',
    summary: 'On-call standby allowance: €45/weekday, €95/weekend day. Active incident paging compensated at 1.5x hourly rate (min 1 hour billed).',
    tags: ['On-Call', 'SRE', 'Overtime', 'Rufbereitschaft', 'Allowance'],
    content_text: `# Overtime, On-Call Duty (Rufbereitschaft) & Weekend SRE Allowance

## 1. Scope & Eligible Roles
To maintain 99.95% uptime across Tier-1 production services (SIEM, Connected Vehicle Gateway, SAP S/4HANA Finance), designated SREs, software engineers, and cloud architects participate in scheduled on-call rotations (Rufbereitschaft).

## 2. Standby Compensation
- **Weekday Standby (17:00 – 09:00 CET):** **€45 gross per shift**.
- **Weekend Standby (Saturday or Sunday 24h):** **€95 gross per shift**.
- **Public Holiday Standby:** **€130 gross per shift**.

## 3. Active Incident Engagement
- When an on-call engineer is paged via PagerDuty / ServiceNow for a P1 or P2 production outage:
  - Working time is compensated at **1.5x the employee\'s contractual hourly rate** (2.0x for Sundays and holidays).
  - Minimum billing increments: Any page resulting in active triage is billed at a minimum of **one (1) hour**, regardless of actual resolution duration.
- Mandatory 11-hour rest periods under German Working Time Act (ArbZG) are strictly enforced following night-time interventions.`,
    url: 'https://autonova.sharepoint.com/sites/hr-policies/DOC-HR-POL-23-On-Call-Policy.pdf'
  },
  {
    id: 'DOC-HR-POL-24',
    title: 'Sabbatical & Extended Unpaid Career Break Policy',
    category: 'Leave & Absences',
    effective_date: '2026-01-01',
    owner: 'Julia Neumann (People & Culture Director)',
    summary: '3 to 12 months sabbatical available after 3 years continuous tenure. Social security continuation via deferred compensation model.',
    tags: ['Sabbatical', 'Career Break', 'Unpaid Leave', 'Time Out'],
    content_text: `# Sabbatical & Extended Unpaid Career Break Policy

## 1. Purpose & Tenure Eligibility
AutoNova supports employees seeking time for personal research, philanthropic endeavors, round-the-world travel, or extended family projects.
- Eligibility: Employees who have completed at least **three (3) years of continuous tenure** with satisfactory performance.

## 2. Duration & Models
- Sabbaticals may span between **three (3) and twelve (12) calendar months**.
- **Working Time Account Model (Wertguthaben):** Employees can fund their sabbatical in advance by banking overtime, vacation days, or deferring salary (e.g., working 100% for 2 years at 80% salary, allowing a fully paid 6-month sabbatical with continuous social insurance coverage).
- Guaranteed Return: Employees are guaranteed return to their previous or equivalent role and grade upon conclusion.`,
    url: 'https://autonova.sharepoint.com/sites/hr-policies/DOC-HR-POL-24-Sabbatical-Policy.pdf'
  },
  {
    id: 'DOC-HR-POL-25',
    title: 'Office Badge Access, Visitor Escort & Facility Security',
    category: 'Workplace & Flexibility',
    effective_date: '2026-01-01',
    owner: 'Stefan Mueller (Head of CISO Office) & Campus Facility Management',
    summary: 'Smart RFID badges required at all AutoNova campuses. Badges must not be shared. Tailgating strictly prohibited. Clean desk policy for paper and whiteboards.',
    tags: ['Badge Access', 'Security', 'Facility', 'Visitors', 'Clean Desk'],
    content_text: `# Office Badge Access, Visitor Escort & Facility Security

## 1. Badge Access & Identification
- All personnel must display their AutoNova RFID smart badge visibly on corporate campus premises at all times.
- **Strict Prohibition on Tailgating:** Every individual must scan their own badge at access turnstiles and security airlocks. Holding doors open for unbadged personnel is a security infraction.
- Lost badges must be reported immediately to Security Operations (+49 711 988-110) for instant deactivation.

## 2. Visitor Management & Escort Protocol
- External visitors, contractors, and guests must be pre-registered in the **ServiceNow Visitor Management Portal** at least 24 hours in advance.
- Visitors must sign non-disclosure agreements (NDAs) and wear red visitor passes. Visitors must be escorted by their host employee at all times.

## 3. Clean Desk & Clean Screen Directive
- All confidential vehicle blueprints, financial papers, and sticky notes containing credentials must be locked away in desk pedestals before leaving workstations.
- Workstations must be locked (Windows Key + L or Command + Control + Q) whenever stepping away.`,
    url: 'https://facilities.autonova.internal/security/badge-facility-policy.pdf'
  },
  {
    id: 'DOC-HR-POL-26',
    title: 'Emergency Evacuation, Fire Safety & First Aid Contacts',
    category: 'Workplace & Flexibility',
    effective_date: '2026-01-01',
    owner: 'Corporate Safety & Environmental Protection (EHS)',
    summary: 'Stuttgart HQ Emergency: +49 711 988-112. Fire wardens and first aiders listed per floor. Evacuation drills twice annually.',
    tags: ['Emergency', 'Fire Safety', 'First Aid', 'Evacuation', 'Contacts'],
    content_text: `# Emergency Evacuation, Fire Safety & First Aid Contacts

## 1. Emergency Telephone Hotlines
- **AutoNova Campus Emergency Command Center (24/7):** **+49 711 988-112** (Internal: Dial 112).
- **Public Emergency Services (Police / Fire / Ambulance):** **112 / 110**.
- **Campus Medical First Response Station:** Building A, Level 1, Room 104 (+49 711 988-114).

## 2. Fire Alarm & Evacuation Protocol
- When fire alarm sirens sound:
  - Immediately cease work, shut down laboratory equipment if safe to do so.
  - Do NOT use passenger or freight elevators under any circumstance.
  - Follow illuminated green emergency exit signs to the nearest stairwell.
  - Proceed directly to the designated **Assembly Point (Sammelplatz): Campus Courtyard East (Parkplatz P3)**.
  - Report to your floor Fire Warden (Brandschutzhelfer). Do not leave the assembly area until the all-clear is declared.`,
    url: 'https://facilities.autonova.internal/safety/emergency-fire-protocols.pdf'
  },
  {
    id: 'DOC-HR-POL-27',
    title: 'Relocation & Global Mobility Support Guidelines',
    category: 'Payroll & Compensation',
    effective_date: '2026-01-01',
    owner: 'Julia Neumann (People & Culture Director)',
    summary: 'Relocation lump-sum up to €8,000 for domestic, up to €15,000 international. 30 days temporary corporate housing and tax advisory support.',
    tags: ['Relocation', 'Mobility', 'Housing', 'Expat', 'Moving'],
    content_text: `# Relocation & Global Mobility Support Guidelines

## 1. Relocation Assistance Eligibility
New hires or transferred employees relocating more than 80 kilometers to join an AutoNova office location (e.g., Stuttgart, Munich, Frankfurt) are eligible for corporate relocation packages.

## 2. Relocation Financial Allowances
- **Domestic Relocation (within Germany):** Lump sum relocation allowance of up to **€8,000 net** for moving van services, lease deposits, and transit expenses.
- **International Relocation (EU / Non-EU):** Up to **€15,000 net** encompassing flight tickets, shipping of personal effects, customs clearance, and visa/residence permit processing.

## 3. Settling-In Support & Corporate Housing
- Up to **30 days complimentary stay in fully furnished AutoNova corporate apartments** while searching for permanent residential housing.
- Professional destination services provided through our relocation partner (Crown Relocations), including German city registration (Anmeldung), bank account setup, and school enrollment assistance.`,
    url: 'https://autonova.sharepoint.com/sites/hr-policies/DOC-HR-POL-27-Relocation-Policy.pdf'
  },
  {
    id: 'DOC-HR-POL-28',
    title: 'Vendor Gifts, Hospitality & Anti-Bribery Compliance',
    category: 'Governance & Ethics',
    effective_date: '2026-01-01',
    owner: 'Dr. Matthias Brandt (Chief Compliance Officer)',
    summary: 'Gifts valued above €35 must be declared and declined or raffled. Hospitality exceeding €75 requires direct VP approval in Compliance Portal.',
    tags: ['Vendor Gifts', 'Hospitality', 'Anti-Bribery', 'Compliance', 'Gifts'],
    content_text: `# Vendor Gifts, Hospitality & Anti-Bribery Compliance

## 1. Gift Acceptance Thresholds
To ensure procurement integrity and maintain objective commercial judgment:
- **Token Gifts (Under €35):** Modest branded items (pens, notebooks, desk calendars) may be accepted without disclosure.
- **Gifts Between €35 and €100:** Must be registered in the **Compliance Gift Register** within five business days. Such gifts are typically pooled for the annual Christmas charity raffle.
- **Gifts Exceeding €100:** Strictly prohibited. Must be politely declined and returned to the vendor.

## 2. Business Meals & Hospitality
- Business invitations to working lunches or dinners are acceptable only if directly tied to genuine business discussions.
- Meals exceeding **€75 per attendee** require prior written approval from the respective Domain Director or VP (E2/E3) in the Compliance Portal.
- Event tickets (sports tournaments, opera, golf events) offered by vendors may NOT be accepted under any circumstances.`,
    url: 'https://compliance.autonova.internal/policies/gift-hospitality-policy.pdf'
  },
  {
    id: 'DOC-HR-POL-29',
    title: 'Software Tooling, AI Coding Assistant & GitHub Copilot Usage',
    category: 'IT & Security',
    effective_date: '2026-01-01',
    owner: 'Dr. Elena Rostova (Group CTO) & Stefan Mueller (Head of CISO Office)',
    summary: 'Approved enterprise LLMs: Company Brain AI Assistant, GitHub Copilot Enterprise on AutoNova tenant. Pasting proprietary source code into public LLMs strictly prohibited.',
    tags: ['AI Policy', 'GitHub Copilot', 'LLM', 'Company Brain', 'Tooling'],
    content_text: `# Software Tooling, AI Coding Assistant & GitHub Copilot Usage

## 1. Enterprise AI Productivity Endorsement
AutoNova embraces generative AI to accelerate software delivery and architectural intelligence. However, strict technical safeguards must prevent proprietary automotive software and intellectual property leaks.

## 2. Approved Enterprise AI Runtimes
- **Company Brain AI Assistant:** Fully approved for querying internal corporate documentation, architecture dependencies, Jira boards, and financial metrics.
- **GitHub Copilot Enterprise:** Approved for use exclusively within corporate Visual Studio Code / IntelliJ JetBrains installations configured with the AutoNova enterprise license (telemetry opt-out enabled).
- **Azure OpenAI Service:** Corporate private instances deployed in West Europe landing zone.

## 3. Strict Prohibitions
- Pasting unreleased source code, CAN-bus protocols, customer credit applications, or commercial contract terms into consumer AI tools (public ChatGPT, Claude, Gemini web interfaces) is strictly prohibited and monitored via Zscaler DLP.`,
    url: 'https://security.autonova.internal/policies/ai-usage-standard-2026.pdf'
  },
  {
    id: 'DOC-HR-POL-30',
    title: 'Offboarding, Knowledge Transition & Asset Return Protocol',
    category: 'Workplace & Flexibility',
    effective_date: '2026-01-01',
    owner: 'Marcus Bauer (Head of HR Operations) & IT Security Team',
    summary: '2-week mandatory knowledge transition plan in Confluence. Handover of Git repositories, AWS/Azure access revocation, physical asset return on last day.',
    tags: ['Offboarding', 'Transition', 'Asset Return', 'Handover', 'Exit'],
    content_text: `# Offboarding, Knowledge Transition & Asset Return Protocol

## 1. Orderly Departure Process
When an employee or contractor resigns or transitions:
- The direct manager initiates the **ServiceNow Offboarding Lifecycle Workflow**.
- A mandatory **two-week knowledge handover period** is established, documenting active sprint tasks, technical runbooks, and ongoing project architectural decisions in Confluence.

## 2. Access Revocation & Code Handover
- Primary Git branch permissions, Azure subscription administrative privileges, and corporate VPN access are automatically scheduled for revocation at **18:00 CET on the employee\'s final working day**.
- All pending PRs must be merged or reassigned to a designated tech lead.

## 3. Physical Asset Return
- IT equipment (MacBook/ThinkPad, monitors, security badges) must be returned to Campus IT Service Desk (Stuttgart Building C or Munich Ground Floor) on or before the final day.
- Remote employees receive a prepaid DHL express return kit with insured tracking.`,
    url: 'https://itsm.autonova.internal/lifecycle/offboarding-procedure.pdf'
  }
];

module.exports = {
  ONBOARDING_DOCUMENTS
};
