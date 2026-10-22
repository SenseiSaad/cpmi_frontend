// Data model and mock content for CPMI Certification Training Academy
// Aligned with Developer Spec and Client Reference UI

export interface Lesson {
  id: string;
  lessonNumber: string;
  title: string;
  duration: string;
  completed: boolean;
  type: "video" | "reading" | "download";
  summary: string;
  content: string;
  videoUrl?: string;
  resources?: Array<{ name: string; size: string; type: string }>;
}

export interface ModuleData {
  id: number;
  code: string;
  title: string;
  shortDesc: string;
  fullDesc: string;
  duration: string;
  lessonsCount: number;
  progress: number;
  status: "completed" | "in-progress" | "not-started";
  lessons: Lesson[];
  regulatoryRef: string;
}

export const modules: ModuleData[] = [
  {
    id: 1,
    code: "M1",
    title: "Introduction to DBE Program",
    shortDesc: "Statutory foundations, legislative background, and federal mandate under 49 CFR Part 26.",
    fullDesc: "Comprehensive orientation to the Disadvantaged Business Enterprise (DBE) program established by USDOT. Understand objectives, statutory requirements, nondiscrimination directives, and agency obligations.",
    duration: "1h 45m",
    lessonsCount: 6,
    progress: 100,
    status: "completed",
    regulatoryRef: "49 CFR § 26.1 - § 26.13",
    lessons: [
      {
        id: "m1-l1",
        lessonNumber: "1.1",
        title: "Program Objectives & Historical Context",
        duration: "15 min",
        completed: true,
        type: "video",
        summary: "Historical rationale, landmark court precedents, and core mission of the USDOT DBE program.",
        content: "The Department of Transportation's Disadvantaged Business Enterprise (DBE) program was established to remedy ongoing discrimination in federally-assisted transportation contracting markets across highways, transit, and airports.",
      },
      {
        id: "m1-l2",
        lessonNumber: "1.2",
        title: "Applicability & Recipient Obligations",
        duration: "20 min",
        completed: true,
        type: "video",
        summary: "Which government agencies are covered and standard requirements for receiving USDOT funds.",
        content: "Any state highway agency, transit authority, or airport sponsor receiving USDOT financial assistance exceeding the statutory threshold must establish and administer a compliant DBE program.",
      },
      {
        id: "m1-l3",
        lessonNumber: "1.3",
        title: "Non-Discrimination Mandates",
        duration: "18 min",
        completed: true,
        type: "reading",
        summary: "Strict prohibition against discrimination and required nondiscrimination contract clauses.",
        content: "Recipients and contractors must incorporate statutory nondiscrimination clauses into every federal-aid contract and agreement.",
      },
      {
        id: "m1-l4",
        lessonNumber: "1.4",
        title: "The DBE Liaison Officer (DBELO) Role",
        duration: "22 min",
        completed: true,
        type: "video",
        summary: "Statutory authority, direct access to leadership, and primary compliance duties of the DBELO.",
        content: "Each recipient agency must designate a DBE Liaison Officer with direct, independent access to the Chief Executive Officer or agency head.",
      },
      {
        id: "m1-l5",
        lessonNumber: "1.5",
        title: "Financial Assistance Thresholds",
        duration: "15 min",
        completed: true,
        type: "reading",
        summary: "Threshold calculations for FTA, FHWA, and FAA recipients requiring formal DBE program submittal.",
        content: "Agencies awarding prime contracts cumulative of $250,000 or more in federal assistance must submit triennial overall goals.",
      },
      {
        id: "m1-l6",
        lessonNumber: "1.6",
        title: "Module 1 Assessment & Review",
        duration: "15 min",
        completed: true,
        type: "reading",
        summary: "Summary of fundamentals and readiness assessment for eligibility standards.",
        content: "Review of key terms, administrative architecture, and regulatory citations before proceeding to certification criteria.",
      },
    ],
  },
  {
    id: 2,
    code: "M2",
    title: "Eligibility Standards & Social/Economic Disadvantage",
    shortDesc: "Social and economic criteria, Personal Net Worth (PNW) caps, and group presumptions.",
    fullDesc: "Detailed analysis of rebuttable presumptions, group definitions, individual showings of disadvantage, and strict calculation of Personal Net Worth (PNW) under recent USDOT regulatory updates.",
    duration: "2h 10m",
    lessonsCount: 7,
    progress: 100,
    status: "completed",
    regulatoryRef: "49 CFR § 26.61 - § 26.67",
    lessons: [
      {
        id: "m2-l1",
        lessonNumber: "2.1",
        title: "Presumptive Disadvantaged Groups",
        duration: "18 min",
        completed: true,
        type: "video",
        summary: "Statutory groups presumed socially and economically disadvantaged under federal law.",
        content: "Federal regulations create a rebuttable presumption of disadvantage for Black Americans, Hispanic Americans, Native Americans, Asian Pacific Americans, Subcontinent Asian Americans, and Women.",
      },
      {
        id: "m2-l2",
        lessonNumber: "2.2",
        title: "Individual Case-by-Case Disadvantage",
        duration: "20 min",
        completed: true,
        type: "reading",
        summary: "Evidentiary standards for individuals who are not members of presumptive groups.",
        content: "Applicants outside presumptive categories may demonstrate disadvantage by a preponderance of the evidence pursuant to Appendix E.",
      },
      {
        id: "m2-l3",
        lessonNumber: "2.3",
        title: "Personal Net Worth (PNW) Regulations",
        duration: "25 min",
        completed: true,
        type: "video",
        summary: "Calculating PNW, allowable exclusions (primary residence, retirement accounts), and asset transfers.",
        content: "Disadvantaged business owners must satisfy the statutory PNW ceiling, excluding equity in the primary residence and the value of the applicant business.",
      },
      {
        id: "m2-l4",
        lessonNumber: "2.4",
        title: "Small Business Size Standards (SBA Limits)",
        duration: "18 min",
        completed: true,
        type: "reading",
        summary: "North American Industry Classification System (NAICS) codes and USDOT statutory revenue caps.",
        content: "A firm must not exceed the Small Business Administration (SBA) size standard for its primary NAICS code and must remain below the USDOT statutory gross receipts cap.",
      },
      {
        id: "m2-l5",
        lessonNumber: "2.5",
        title: "Ownership Criteria: Real, Substantial & At-Risk",
        duration: "22 min",
        completed: true,
        type: "video",
        summary: "51% unconditional ownership, capital contribution, and pro-rata sharing of profits and risks.",
        content: "The disadvantaged owner must demonstrate real, substantial, and ongoing investment of capital acquired independently.",
      },
      {
        id: "m2-l6",
        lessonNumber: "2.6",
        title: "Rebuttal Procedures & Auditing",
        duration: "15 min",
        completed: true,
        type: "reading",
        summary: "Procedures for challenging presumed disadvantage and third-party challenges.",
        content: "Any third party may file a written complaint with reasonable evidence alleging an owner does not meet disadvantage criteria.",
      },
      {
        id: "m2-l7",
        lessonNumber: "2.7",
        title: "Module 2 Examination",
        duration: "12 min",
        completed: true,
        type: "reading",
        summary: "Assessment covering PNW calculation rules, size standards, and ownership thresholds.",
        content: "Comprehensive eligibility testing with scenario-based PNW calculation evaluations.",
      },
    ],
  },
  {
    id: 3,
    code: "M3",
    title: "Uniform Certification Process (UCP) & Reciprocity",
    shortDesc: "Unified statewide certification, mandatory on-site visits, and interstate certification.",
    fullDesc: "Learn how the Unified Certification Program (UCP) eliminates duplicate applications, standardizes on-site reviews, and governs interstate reciprocity pursuant to 49 CFR Part 26 Subpart E.",
    duration: "1h 55m",
    lessonsCount: 6,
    progress: 100,
    status: "completed",
    regulatoryRef: "49 CFR § 26.81 - § 26.89",
    lessons: [
      {
        id: "m3-l1",
        lessonNumber: "3.1",
        title: "Statewide UCP Framework",
        duration: "18 min",
        completed: true,
        type: "video",
        summary: "One-stop certification directory across all USDOT recipients within each state.",
        content: "All recipients in each state participate in a single Unified Certification Program ensuring unified decisions that bind all state recipients.",
      },
      {
        id: "m3-l2",
        lessonNumber: "3.2",
        title: "Application Intake & Completeness Audits",
        duration: "16 min",
        completed: true,
        type: "reading",
        summary: "Initial vetting of the Uniform Certification Application (UCA) and required supporting schedules.",
        content: "Reviewers must evaluate tax filings, corporate bylaws, operating agreements, licenses, and bank signature cards within statutory deadlines.",
      },
      {
        id: "m3-l3",
        lessonNumber: "3.3",
        title: "On-Site Review & Principal Interviews",
        duration: "25 min",
        completed: true,
        type: "video",
        summary: "Conducting the mandatory on-site visit, facility inspection, and questioning of disadvantaged owners.",
        content: "Certifiers must visit the firm's principal place of business, inspect equipment and inventory, and conduct recorded interviews.",
      },
      {
        id: "m3-l4",
        lessonNumber: "3.4",
        title: "Interstate Certification Regulations",
        duration: "20 min",
        completed: true,
        type: "reading",
        summary: "Rules for firms certified in their home state applying to operate in other jurisdictions.",
        content: "A firm certified in State A must provide its complete home state application package when seeking certification in State B.",
      },
      {
        id: "m3-l5",
        lessonNumber: "3.5",
        title: "Decertification & Denial Proceedings",
        duration: "22 min",
        completed: true,
        type: "video",
        summary: "Due process hearings, notice of intent to remove eligibility, and informal hearing requirements.",
        content: "Decertification proceedings require formal notice, administrative hearing separation, and an immutable evidentiary record.",
      },
      {
        id: "m3-l6",
        lessonNumber: "3.6",
        title: "USDOT Appellate Procedures",
        duration: "14 min",
        completed: true,
        type: "reading",
        summary: "Appeals filed with the USDOT Departmental Office of Civil Rights in Washington, D.C.",
        content: "Firms denied certification or decertified may appeal to the USDOT Secretary within 90 days of the final local administrative determination.",
      },
    ],
  },
  {
    id: 4,
    code: "M4",
    title: "DBE Program Requirements & Goal Setting",
    shortDesc: "Step 1 and Step 2 triennial overall goal calculations, race-neutral vs race-conscious targets.",
    fullDesc: "Master the statutory mathematics of establishing triennial overall DBE goals. Understand base figure calculation, census bureau data utilization, local market weighting, and disparity study integration.",
    duration: "2h 30m",
    lessonsCount: 8,
    progress: 60,
    status: "in-progress",
    regulatoryRef: "49 CFR § 26.45 - § 26.55",
    lessons: [
      {
        id: "m4-l1",
        lessonNumber: "4.1",
        title: "Triennial Overall Goal Setting Architecture",
        duration: "15 min",
        completed: true,
        type: "video",
        summary: "Overview of the triennial goal submission cycle to FHWA, FTA, and FAA operating administrations.",
        content: "Recipients must establish overall goals for participation of DBEs in DOT-assisted contracts every three years, calculated based on demonstrable evidence of relative availability.",
      },
      {
        id: "m4-l2",
        lessonNumber: "4.2",
        title: "DBE Program Requirements & Scope",
        duration: "20 min",
        completed: true,
        type: "video",
        summary: "The DBE program ensures federally funded projects include eligible, small disadvantaged businesses.",
        content: "The DBE program ensures that federally funded transportation projects include eligible, small and disadvantaged businesses. This program helps create a level playing field for all qualified businesses across infrastructure and procurement.",
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        resources: [
          { name: "49 CFR Part 26 DBE Program Regulations Guide.pdf", size: "2.4 MB", type: "PDF" },
          { name: "USDOT Official Guidance on Goal Setting & SBLI.pdf", size: "1.8 MB", type: "PDF" },
          { name: "Triennial Goal Setting Worksheet & Template.xlsx", size: "840 KB", type: "XLSX" },
        ],
      },
      {
        id: "m4-l3",
        lessonNumber: "4.3",
        title: "Step 1: Calculating the Relative Availability Base Figure",
        duration: "22 min",
        completed: false,
        type: "video",
        summary: "Determining ready, willing, and able DBEs divided by all businesses in the local contracting market.",
        content: "Step 1 requires compiling Census County Business Patterns (CBP) data matched with UCP directories to compute an empirical availability percentage.",
      },
      {
        id: "m4-l4",
        lessonNumber: "4.4",
        title: "Step 2: Base Figure Adjustments & Disparity Studies",
        duration: "25 min",
        completed: false,
        type: "video",
        summary: "Adjusting base figures using past participation, capacity studies, and disparity research.",
        content: "Recipients must review other relevant evidence, including historical achievement and disparity studies, to adjust the Step 1 figure up or down.",
      },
      {
        id: "m4-l5",
        lessonNumber: "4.5",
        title: "Race-Neutral vs. Race-Conscious Measures",
        duration: "18 min",
        completed: false,
        type: "reading",
        summary: "Maximizing race-neutral methods (outreach, technical assistance, unbundling contracts).",
        content: "Federal law mandates meeting the maximum feasible portion of overall goals through race-neutral means before applying contract-specific goals.",
      },
      {
        id: "m4-l6",
        lessonNumber: "4.6",
        title: "Counting DBE Participation Rules",
        duration: "20 min",
        completed: false,
        type: "video",
        summary: "60% manufacturer vs 100% supplier rules, regular dealers, brokers, and trucking firms.",
        content: "Only work performed by a DBE's own forces and verified supplies count toward DBE contract participation goals.",
      },
      {
        id: "m4-l7",
        lessonNumber: "4.7",
        title: "Public Consultation & Stakeholder Participation",
        duration: "16 min",
        completed: false,
        type: "reading",
        summary: "Mandatory 30-day public notice, minority contractor engagement, and comment incorporation.",
        content: "Recipients must engage minority contractor associations, trade groups, and the public before publishing final triennial submissions.",
      },
      {
        id: "m4-l8",
        lessonNumber: "4.8",
        title: "Module 4 Capstone & Readiness Review",
        duration: "14 min",
        completed: false,
        type: "reading",
        summary: "Review of goal setting equations, counting formulas, and prep for the Module 4 assessment.",
        content: "Practice exercises evaluating supplier counting percentages and contractor goal commitment forms.",
      },
    ],
  },
  {
    id: 5,
    code: "M5",
    title: "Compliance & Monitoring",
    shortDesc: "Commercially Useful Function (CUF) reviews, jobsite inspections, and certified payrolls.",
    fullDesc: "Learn how to conduct legally defensible Commercially Useful Function (CUF) investigations, jobsite audits, equipment lease verifications, and certified payroll checks to ensure genuine participation.",
    duration: "2h 00m",
    lessonsCount: 7,
    progress: 0,
    status: "not-started",
    regulatoryRef: "49 CFR § 26.55(c)",
    lessons: [],
  },
  {
    id: 6,
    code: "M6",
    title: "ACDBE Program for Airport Concessions",
    shortDesc: "Airport concession rules, joint venture structures, and commercial leasing under 49 CFR Part 23.",
    fullDesc: "Specialized focus on Airport Concession Disadvantaged Business Enterprises (ACDBE). Covers retail, dining, rental car concession calculations, joint venture equity splits, and FAA reporting.",
    duration: "1h 50m",
    lessonsCount: 6,
    progress: 0,
    status: "not-started",
    regulatoryRef: "49 CFR Part 23",
    lessons: [],
  },
  {
    id: 7,
    code: "M7",
    title: "Contract Administration & Good Faith Efforts",
    shortDesc: "Evaluating prime contractor Good Faith Efforts (GFE), reconsideration hearings, and bid scoring.",
    fullDesc: "In-depth guide to Appendix A Good Faith Efforts criteria. Master how to document and defend awards when low bidders fail to meet numerical DBE goals but provide documented outreach evidence.",
    duration: "2h 15m",
    lessonsCount: 7,
    progress: 0,
    status: "not-started",
    regulatoryRef: "49 CFR § 26.53 & App. A",
    lessons: [],
  },
  {
    id: 8,
    code: "M8",
    title: "Prompt Payment & Return of Retainage",
    shortDesc: "Statutory 30-day payment flowdown, retainage return, and subcontractor dispute resolution.",
    fullDesc: "Federal prompt payment provisions ensuring prime contractors pay subcontractors within 30 days of invoice approval, and return retainage promptly upon satisfactory completion.",
    duration: "1h 45m",
    lessonsCount: 6,
    progress: 0,
    status: "not-started",
    regulatoryRef: "49 CFR § 26.29",
    lessons: [],
  },
  {
    id: 9,
    code: "M9",
    title: "DBE Utilization Reports & Uniform Reporting",
    shortDesc: "Bi-annual USDOT Uniform Report submission, ongoing contract tracking, and shortfall analysis.",
    fullDesc: "Step-by-step masterclass on compiling the bi-annual USDOT Uniform Report of DBE Awards or Commitments and Payments. Address shortfall analysis requirements when goals are missed.",
    duration: "1h 30m",
    lessonsCount: 5,
    progress: 0,
    status: "not-started",
    regulatoryRef: "49 CFR § 26.11 & § 26.47",
    lessons: [],
  },
  {
    id: 10,
    code: "M10",
    title: "Remedies, Sanctions & Federal Compliance Reviews",
    shortDesc: "Federal program reviews, conciliation agreements, debarment, and withholding of progress payments.",
    fullDesc: "Handling FHWA, FTA, and FAA programmatic audits. Explore progressive sanctions against non-compliant contractors, administrative stop-work orders, liquidated damages, and False Claims Act liability.",
    duration: "2h 00m",
    lessonsCount: 6,
    progress: 0,
    status: "not-started",
    regulatoryRef: "49 CFR § 26.101 - § 26.109",
    lessons: [],
  },
  {
    id: 11,
    code: "M11",
    title: "Best Practices, Case Studies & Final Comprehensive Review",
    shortDesc: "Cross-agency case law, OIG audit findings, fraud prevention, and comprehensive exam preparation.",
    fullDesc: "Synthesis of the entire 11-module curriculum. Examine landmark federal enforcement cases, pass-through front schemes, and prepare for the 50-question Final Comprehensive Certification Exam.",
    duration: "2h 20m",
    lessonsCount: 7,
    progress: 0,
    status: "not-started",
    regulatoryRef: "Federal Case Law & OIG Summaries",
    lessons: [],
  },
];

export const learnerStats = {
  enrolled: 3,
  completed: 1,
  inProgress: 2,
  certificates: 1,
  overallProgress: 42,
  hoursLogged: 14.5,
};

export const learnerCourses = [
  {
    id: 4,
    title: "Module 4: DBE Program Requirements",
    progress: 60,
    totalLessons: 8,
    completedLessons: 4,
    currentLesson: "Lesson 2 of 8 • 20 min",
    nextLessonTitle: "Step 1: Calculating the Relative Availability Base Figure",
    estimatedTime: "50m remaining",
    status: "in-progress",
    thumbnail: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=600&q=80",
  },
  {
    id: 2,
    title: "Module 2: Eligibility Standards",
    progress: 100,
    totalLessons: 7,
    completedLessons: 7,
    currentLesson: "Completed",
    nextLessonTitle: "All Lessons Complete",
    estimatedTime: "Completed",
    status: "completed",
    thumbnail: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80",
  },
  {
    id: 1,
    title: "Module 1: Introduction to DBE Program",
    progress: 100,
    totalLessons: 6,
    completedLessons: 6,
    currentLesson: "Completed",
    nextLessonTitle: "All Lessons Complete",
    estimatedTime: "Completed",
    status: "completed",
    thumbnail: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80",
  },
];

export const upcomingAssessments = [
  {
    id: "m5-quiz",
    moduleId: 5,
    title: "Module 5 Assessment",
    dueDate: "Apr 20, 2026",
    module: "Module 5: Compliance & Monitoring",
    questionsCount: 15,
    durationMinutes: 30,
    status: "upcoming",
  },
  {
    id: "final-exam",
    moduleId: 11,
    title: "Final Comprehensive Exam",
    dueDate: "May 15, 2026",
    module: "All 11 Modules (Comprehensive)",
    questionsCount: 50,
    durationMinutes: 90,
    status: "upcoming",
  },
];

// Interactive Assessment Quiz Data (Aligned with Screen 5)
export interface QuizQuestion {
  id: number;
  question: string;
  options: { id: string; label: string; text: string }[];
  correctOption: string;
  explanation: string;
}

export const sampleQuizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "What is the primary governing federal regulation for the Disadvantaged Business Enterprise (DBE) program in transportation contracting?",
    options: [
      { id: "A", label: "A", text: "23 CFR Part 635" },
      { id: "B", label: "B", text: "49 CFR Part 26" },
      { id: "C", label: "C", text: "48 CFR Federal Acquisition Regulation" },
      { id: "D", label: "D", text: "49 CFR Part 23 only" },
    ],
    correctOption: "B",
    explanation: "49 CFR Part 26 is the primary USDOT regulation governing DBE participation in federally assisted highway, transit, and airport programs.",
  },
  {
    id: 2,
    question: "Which official must each recipient agency designate with direct and independent access to the Chief Executive Officer?",
    options: [
      { id: "A", label: "A", text: "Chief Financial Officer" },
      { id: "B", label: "B", text: "DBE Liaison Officer (DBELO)" },
      { id: "C", label: "C", text: "General Counsel" },
      { id: "D", label: "D", text: "Resident Engineer" },
    ],
    correctOption: "B",
    explanation: "49 CFR § 26.25 mandates that the DBELO must have direct, independent access to the agency head for all DBE policy and compliance matters.",
  },
  {
    id: 3,
    question: "Which of the following is a key requirement for DBE certification?",
    options: [
      { id: "A", label: "A", text: "Minimum 10 years of business operation" },
      { id: "B", label: "B", text: "Ownership and control by socially and economically disadvantaged individuals" },
      { id: "C", label: "C", text: "Annual revenue above $5 million" },
      { id: "D", label: "D", text: "Physical office in a different state" },
    ],
    correctOption: "B",
    explanation: "Under 49 CFR Part 26 Subpart D, the firm must be at least 51% owned and controlled in both operational and managerial matters by socially and economically disadvantaged individuals.",
  },
  {
    id: 4,
    question: "What percentage of a DBE regular dealer's material cost can be counted toward contract goals?",
    options: [
      { id: "A", label: "A", text: "100%" },
      { id: "B", label: "B", text: "60%" },
      { id: "C", label: "C", text: "40%" },
      { id: "D", label: "D", text: "Only broker fee percentage" },
    ],
    correctOption: "B",
    explanation: "Under 49 CFR § 26.55(e)(2)(i), if materials are purchased from a DBE regular dealer, 60% of the cost of the materials or supplies may be counted.",
  },
  {
    id: 5,
    question: "How frequently must recipients submit their overall triennial DBE goals to the USDOT operating administration?",
    options: [
      { id: "A", label: "A", text: "Every calendar quarter" },
      { id: "B", label: "B", text: "Every year by October 1" },
      { id: "C", label: "C", text: "Every three years" },
      { id: "D", label: "D", text: "Every five years" },
    ],
    correctOption: "C",
    explanation: "Under 49 CFR § 26.45(f)(1), recipients must submit their overall goal and methodology every three years on a schedule determined by the operating administration.",
  },
];

// Certificates data matching Screen 6
export const certificates = [
  {
    id: "CPMI-2026-000123",
    recipientName: "Sarah Johnson",
    courseName: "DBE / ACDBE Compliance Training Program",
    issueDate: "April 26, 2026",
    expiryDate: "April 26, 2028",
    module: "11-Module Certification Program",
    verificationStatus: "Verified & Active",
    agency: "Federal Transit Administration",
    signerTitle: "Executive Director, CPMI Academy",
    signatureUrl: "/signatures/director.png",
  },
  {
    id: "CPMI-2026-000089",
    recipientName: "Michael Brown",
    courseName: "DBE / ACDBE Compliance Training Program",
    issueDate: "March 15, 2026",
    expiryDate: "March 15, 2028",
    module: "11-Module Certification Program",
    verificationStatus: "Verified & Active",
    agency: "Texas Department of Transportation",
    signerTitle: "Executive Director, CPMI Academy",
    signatureUrl: "/signatures/director.png",
  },
];

// Super Admin stats matching Screen 7
export const adminStats = {
  totalRevenue: 245680,
  totalLearners: 1248,
  completionRate: 82,
  totalAgencies: 12,
  revenueGrowth: 12,
  learnersGrowth: 18,
  completionChange: 6,
  agenciesChange: 2,
};

export const topAgenciesData = [
  { name: "Texas DOT", shortName: "TxDOT", learners: 342, fill: "#2A5025" },
  { name: "Caltrans", shortName: "Caltrans", learners: 298, fill: "#CFB112" },
  { name: "Florida DOT", shortName: "FDOT", learners: 187, fill: "#738A70" },
  { name: "Michigan DOT", shortName: "MDOT", learners: 146, fill: "#47D64C" },
  { name: "Others (8 Agencies)", shortName: "Others", learners: 275, fill: "#A3B899" },
];

export const revenueData = [
  { month: "Jan", revenue: 16500, enrollments: 68 },
  { month: "Feb", revenue: 18200, enrollments: 75 },
  { month: "Mar", revenue: 17400, enrollments: 70 },
  { month: "Apr", revenue: 23100, enrollments: 95 },
  { month: "May", revenue: 21800, enrollments: 88 },
  { month: "Jun", revenue: 27500, enrollments: 112 },
  { month: "Jul", revenue: 24900, enrollments: 99 },
  { month: "Aug", revenue: 31200, enrollments: 126 },
  { month: "Sep", revenue: 28400, enrollments: 115 },
  { month: "Oct", revenue: 34800, enrollments: 142 },
  { month: "Nov", revenue: 31000, enrollments: 128 },
  { month: "Dec", revenue: 38200, enrollments: 154 },
];

export const agencies = [
  { id: "agc_001", name: "Federal Transit Administration (FTA)", learners: 312, seats: 350, status: "Active", joined: "Jan 2026", contact: "sarah.j@fta.gov" },
  { id: "agc_002", name: "Texas Department of Transportation (TxDOT)", learners: 342, seats: 400, status: "Active", joined: "Mar 2026", contact: "training@txdot.gov" },
  { id: "agc_003", name: "California Department of Transportation (Caltrans)", learners: 298, seats: 350, status: "Active", joined: "Feb 2026", contact: "compliance@dot.ca.gov" },
  { id: "agc_004", name: "Florida Department of Transportation (FDOT)", learners: 187, seats: 200, status: "Active", joined: "Apr 2026", contact: "dbe@fdot.state.fl.us" },
  { id: "agc_005", name: "Michigan Department of Transportation (MDOT)", learners: 146, seats: 160, status: "Active", joined: "Jun 2026", contact: "civilrights@michigan.gov" },
];

// Agency Admin members matching Screen 8
export interface AgencyMember {
  id: string;
  name: string;
  email: string;
  role: string;
  progress: number;
  status: "Active" | "Pending";
  enrolled: string;
  avatar?: string;
}

export const agencyMembers: AgencyMember[] = [
  {
    id: "mem_1",
    name: "Michael Brown",
    email: "michael@agency.com",
    role: "Learner",
    progress: 100,
    status: "Active",
    enrolled: "Jan 12, 2026",
  },
  {
    id: "mem_2",
    name: "Jessica Lee",
    email: "jessica@agency.com",
    role: "Learner",
    progress: 75,
    status: "Active",
    enrolled: "Jan 15, 2026",
  },
  {
    id: "mem_3",
    name: "Daniel Wilson",
    email: "daniel@agency.com",
    role: "Learner",
    progress: 45,
    status: "Active",
    enrolled: "Feb 01, 2026",
  },
  {
    id: "mem_4",
    name: "Emily Davis",
    email: "emily@agency.com",
    role: "Learner",
    progress: 20,
    status: "Active",
    enrolled: "Mar 10, 2026",
  },
  {
    id: "mem_5",
    name: "Robert Taylor",
    email: "robert@agency.com",
    role: "Learner",
    progress: 0,
    status: "Pending",
    enrolled: "Apr 05, 2026",
  },
];
