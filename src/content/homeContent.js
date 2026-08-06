// ---------------------------------------------------------------------------
// Single source of truth for every piece of copy, link, image and icon shown on
// the public homepage. `src/pages/HomePage.jsx` renders *only* what it reads
// from here - nothing is written inline in the JSX - so the site can be
// re-worded, re-ordered or swapped for a CMS/API payload by editing this file
// alone (same convention `src/routes.js` uses for the signed-in app).
// ---------------------------------------------------------------------------

import {
  Award,
  Bell,
  Building2,
  Calendar,
  ClipboardCheck,
  Download,
  ExternalLink,
  Facebook,
  FileCheck2,
  FileSpreadsheet,
  Fingerprint,
  Globe,
  GraduationCap,
  Headphones,
  Info,
  KeyRound,
  Layers,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  Twitter,
  Users,
  Youtube,
} from "lucide-react";

/* -- Brand / identity ----------------------------------------------------- */

export const SITE = {
  boardName: "Board of Medical Education (BOME)",
  boardNameSecondary: "Board of Examinations in Nursing (BOEN)",
  department: "Government of Puducherry — Department of Health & Family Welfare",
  // Rendered as unbreakable phrases so a narrow viewport wraps at the dash,
  // never mid-phrase ("…Health & Family / Welfare").
  departmentParts: ["Government of Puducherry", "Department of Health & Family Welfare"],
  productName: "Examination Marks System",
  emblems: [
    { src: "/images/govt_puducherry.png", alt: "Government of Puducherry emblem" },
    { src: "/images/institute_seal.png", alt: "MTPG & RIHS institute seal" },
  ],
  copyright: `© ${new Date().getFullYear()} BOME / BOEN — Government of Puducherry. All rights reserved.`,
  credit: "Directorate of Information Technology, Government of Puducherry",
  intro:
    "Regulating and administering medical, nursing and allied health science education across the Union Territory of Puducherry.",
  // GIGW Quality guideline 11: this must come from the CMS, not be hardcoded.
  // Wire it to the content/build system; the ISO date here is only a stand-in.
  lastUpdated: "2025-05-20",
};

// GIGW Quality guideline 18(3): a plain-language "About the organisation"
// statement of main activities and functions, surfaced on the homepage itself.
export const ABOUT_STATEMENT = {
  eyebrow: "About the Organisation",
  title: "What we do",
  body:
    "The Board of Medical Education (BOME) and the Board of Examinations in Nursing (BOEN) are autonomous bodies under the Health & Family Welfare Department, Government of Puducherry. They regulate admissions, conduct examinations, and issue certification for diploma courses in Medical, Nursing, Paramedical and Allied Health Sciences across affiliated institutions in the Union Territory.",
  functions: [
    "Register students and issue unique registration numbers.",
    "Publish examination schedules and conduct term examinations.",
    "Verify and approve marks through a maker–checker–approver workflow.",
    "Issue digitally signed marks sheets delivered via DigiLocker.",
  ],
};

/* -- Utility bar ---------------------------------------------------------- */

// Text-size / contrast controls are provided by the UX4G accessibility widget
// (loaded in index.html), so the utility bar carries only identity + the
// National Portal link.
export const UTILITY_BAR = {
  labelParts: ["Government of Puducherry", "Department of Health & Family Welfare"],
};

/* -- Primary navigation --------------------------------------------------- */
// `id` must match the id of the matching <section> rendered on the page; the
// scroll-spy in HomePage derives the active tab from these ids.

export const NAV_LINKS = [
  { id: "home", label: "Home" },
  { id: "about", label: "About Us" },
  { id: "services", label: "Services" },
  { id: "glance", label: "At a Glance" },
  { id: "news", label: "Announcements" },
  { id: "gallery", label: "Gallery" },
  { id: "resources", label: "Downloads & Links" },
  { id: "feedback", label: "Feedback" },
  { id: "contact", label: "Contact Us" },
];

/* -- Hero carousel -------------------------------------------------------- */

export const HERO_SLIDES = [
  {
    id: "welcome",
    eyebrow: "Government of Puducherry",
    titleTop: "Welcome to",
    titleMain: "BOME / BOEN",
    body:
      "Ensuring excellence in Medical, Nursing and Allied Health Science education across the Union Territory of Puducherry.",
    image: "/images/carousel_2.jpg",
  },
  {
    id: "futures",
    eyebrow: "Health & Family Welfare Department",
    titleTop: "Empowering",
    titleMain: "Healthcare Futures",
    body:
      "Regulating examinations and certification of diploma courses in Nursing and Paramedical Sciences on a single secure platform.",
    image: "/images/carousel_1.jpg",
  },
  {
    id: "digilocker",
    eyebrow: "Examination Marks System",
    titleTop: "Digitally Signed",
    titleMain: "Marks Sheets",
    body:
      "Maker–checker–approver verification, digital signature certificates and marks sheets delivered to students through DigiLocker.",
    image: "/images/carousel_2.jpg",
  },
];

// `action: "login"` is handled by HomePage (routes into the portal); anything
// with `target` scrolls to that section id.
export const HERO_ACTIONS = [
  { id: "portal", label: "Department Login", variant: "primary", action: "login" },
  { id: "services", label: "Our Services", variant: "accent", target: "services" },
  { id: "downloads", label: "Downloads", variant: "ghost", target: "resources" },
  { id: "contact", label: "Contact Us", variant: "ghost", target: "contact" },
];

export const HERO_TRUST = [
  { id: "mca", label: "Maker–Checker–Approver", icon: ShieldCheck },
  { id: "otp", label: "OTP Verified Login", icon: KeyRound },
  { id: "dsc", label: "Digital Signature", icon: Fingerprint },
];

/* -- Scrolling notice ticker ---------------------------------------------- */

export const TICKER_LABEL = "Latest";

export const TICKER_ITEMS = [
  { id: "t1", text: "Notification for the April / May examinations has been published." },
  { id: "t2", text: "Examination time table for all affiliated institutions is now available." },
  { id: "t3", text: "Colleges may download the student and education details Excel templates." },
  { id: "t4", text: "Circular — submission of student data by all affiliated institutions." },
  { id: "t5", text: "Approved marks sheets are issued to students through DigiLocker." },
];

/* -- Services ------------------------------------------------------------- */

export const SERVICES_SECTION = {
  eyebrow: "Quick Access",
  title: "Our Services",
  linkLabel: "All services",
  linkTarget: "resources",
};

export const SERVICES = [
  {
    id: "schedule",
    label: "Examination Schedule",
    desc: "Term-wise exam dates and time tables published per college and course.",
    icon: Calendar,
    accent: "#0F4C9A",
    target: "news",
  },
  {
    id: "downloads",
    label: "Downloads",
    desc: "Excel templates, application forms and official documents.",
    icon: Download,
    accent: "#D97706",
    target: "resources",
  },
  {
    id: "notifications",
    label: "Notifications",
    desc: "Latest circulars, results and announcements from the boards.",
    icon: Bell,
    accent: "#C0333D",
    target: "news",
  },
  {
    id: "institutions",
    label: "Affiliated Institutions",
    desc: "Colleges and institutions registered under BOME and BOEN.",
    icon: Building2,
    accent: "#0B1F3A",
    target: "glance",
  },
];

/* -- Statistics ----------------------------------------------------------- */
// `source` names the live counter that HomePage fetches from the Flask API —
// when the backend answers, the real count always wins. `approx` is the
// stand-in shown until then, flagged with `approxNote` in the UI so it is
// never mistaken for an official figure. DEPARTMENT: review these values;
// `regions: 4` is factual (Puducherry, Karaikal, Mahe, Yanam), the rest are
// estimates.

export const STATS_SECTION = {
  eyebrow: "At a Glance",
  title: "Our Impact in Numbers",
  fallbackNote: "To be updated",
  approxNote: "Approximate figure",
};

export const STATS = [
  { id: "institutions", label: "Affiliated Institutions", icon: Building2, source: "institutions", approx: 25, suffix: "+" },
  { id: "courses", label: "Courses Offered", icon: GraduationCap, source: "courses", approx: 15, suffix: "+" },
  { id: "subjects", label: "Subjects Mapped", icon: ClipboardCheck, source: "subjects", approx: 120, suffix: "+" },
  { id: "regions", label: "Regions Covered", icon: Award, source: "regions", approx: 4, suffix: "" },
];

/* -- Announcements + About ------------------------------------------------ */

export const NEWS_SECTION = {
  eyebrow: "Announcements",
  title: "Latest News",
  emptyLabel: "No announcements match your search.",
};

export const NEWS = [
  {
    id: "n1",
    badge: "New",
    category: "Examinations",
    title: "Notification for April / May examinations",
    date: "2025-05-20",
  },
  {
    id: "n2",
    badge: "New",
    category: "Time Table",
    title: "Publication of examination time table – April / May",
    date: "2025-05-19",
  },
  {
    id: "n3",
    badge: "New",
    category: "Results",
    title: "Results declared for diploma courses – March",
    date: "2025-05-15",
  },
  {
    id: "n4",
    category: "Circular",
    title: "Circular – submission of student data by all affiliated institutions",
    date: "2025-05-12",
  },
  {
    id: "n5",
    category: "Tender",
    title: "Invitation of tenders – evaluation work",
    date: "2025-05-08",
  },
];

export const ABOUT_CARD = {
  eyebrow: "About Us",
  title: "About BOME / BOEN",
  image: "/images/carousel_1.jpg",
  body:
    "Autonomous bodies under the Health & Family Welfare Department, Government of Puducherry, responsible for regulating examinations and certification across Nursing, Paramedical and Allied Health Sciences.",
  points: [
    { id: "a1", text: "Student enrolment with unique registration numbers", icon: Users },
    { id: "a2", text: "Verified, digitally signed marks sheets", icon: FileCheck2 },
    { id: "a3", text: "Consolidated reporting for both boards", icon: Layers },
  ],
  ctaLabel: "Department Login",
  ctaAction: "login",
};

/* -- Gallery -------------------------------------------------------------- */

export const GALLERY_SECTION = {
  eyebrow: "Photo Gallery",
  title: "Events & Activities",
};

export const GALLERY = [
  { id: "g1", src: "/images/carousel_1.jpg", label: "Convocation ceremony", span: "tall" },
  { id: "g2", src: "/images/carousel_2.jpg", label: "Clinical training" },
  { id: "g3", src: "/images/carousel_1.jpg", label: "Nursing programme" },
  { id: "g4", src: "/images/carousel_2.jpg", label: "Practical session", span: "wide" },
];

/* -- Downloads + external links ------------------------------------------- */

export const RESOURCES_SECTION = {
  eyebrow: "Resources",
  title: "Downloads & Important Links",
  downloadsTitle: "Downloads",
  linksTitle: "Important Links",
};

// GIGW Quality guideline 12: every downloadable file states its title, format,
// size and a usage instruction. `href` is a department content dependency - the
// files themselves must be supplied and the paths pointed here.
export const DOWNLOADS = [
  { id: "d1", label: "Student Details Excel Template", format: "XLSX", size: "48 KB", note: "Opens in a new window · requires a spreadsheet reader", href: null, icon: FileSpreadsheet },
  { id: "d2", label: "Education Details Excel Template", format: "XLSX", size: "52 KB", note: "Opens in a new window · requires a spreadsheet reader", href: null, icon: FileSpreadsheet },
  { id: "d3", label: "Examination Schedule", format: "PDF", size: "1.2 MB", note: "Opens in a new window · requires a PDF reader", href: null, icon: Calendar },
  { id: "d4", label: "Document Upload Checklist", format: "PDF", size: "220 KB", note: "Opens in a new window · requires a PDF reader", href: null, icon: ClipboardCheck },
  { id: "d5", label: "Marks Sheet Guide (DigiLocker)", format: "PDF", size: "640 KB", note: "Opens in a new window · requires a PDF reader", href: null, icon: FileCheck2 },
  { id: "d6", label: "Helpdesk Contact Sheet", format: "PDF", size: "90 KB", note: "Opens in a new window · requires a PDF reader", href: null, icon: Headphones },
];

export const EXTERNAL_LINKS = [
  { id: "l1", label: "Government of Puducherry", href: "https://www.py.gov.in/", icon: ExternalLink },
  { id: "l2", label: "Health Department, Puducherry", href: "https://health.py.gov.in/", icon: ExternalLink },
  { id: "l3", label: "National Medical Commission", href: "https://www.nmc.org.in/", icon: ExternalLink },
  { id: "l4", label: "Indian Nursing Council", href: "https://www.indiannursingcouncil.org/", icon: ExternalLink },
  { id: "l5", label: "Pharmacy Council of India", href: "https://www.pci.nic.in/", icon: ExternalLink },
  { id: "l6", label: "Higher & Technical Education", href: "https://dhte.py.gov.in/", icon: ExternalLink },
];

// GIGW Quality guideline 18(8) + integration guidance: prominent, always-new-tab
// links to national e-governance platforms.
export const NATIONAL_PORTAL = {
  label: "National Portal of India",
  short: "india.gov.in",
  href: "https://www.india.gov.in/",
};

export const GOV_PLATFORMS = [
  { id: "digilocker", label: "DigiLocker", href: "https://www.digilocker.gov.in/" },
  { id: "mygov", label: "MyGov", href: "https://www.mygov.in/" },
  { id: "myscheme", label: "MyScheme", href: "https://www.myscheme.gov.in/" },
  { id: "meripehchaan", label: "MeriPehchaan (SSO)", href: "https://meripehchaan.gov.in/" },
];

// GIGW Quality guideline 22: two-way social media - links out to official
// handles. Replace the placeholder hrefs with the department's real accounts.
export const SOCIAL_LINKS = [
  { id: "tw", label: "X (Twitter)", href: "https://twitter.com/", icon: Twitter },
  { id: "fb", label: "Facebook", href: "https://www.facebook.com/", icon: Facebook },
  { id: "yt", label: "YouTube", href: "https://www.youtube.com/", icon: Youtube },
];

/* -- Contact -------------------------------------------------------------- */

export const CONTACT_SECTION = {
  eyebrow: "Get in Touch",
  title: "Board of Medical Education / BOEN",
  address: "IGGGH & PGI Campus, Puducherry – 605 001",
  hours: "Working hours: 10:00 AM – 5:00 PM (Mon – Fri)",
};

export const CONTACT_CHANNELS = [
  { id: "c1", label: "0413 – 2238306", href: "tel:04132238306", icon: Phone },
  { id: "c2", label: "0413 – 2230756", href: "tel:04132230756", icon: Phone },
  { id: "c3", label: "helpdesk@mtpg-rihs.py.gov.in", href: "mailto:helpdesk@mtpg-rihs.py.gov.in", icon: Mail },
  { id: "c4", label: "IGGGH & PGI Campus, Puducherry", href: "#contact", icon: MapPin },
];

/* -- Footer --------------------------------------------------------------- */

// GIGW Quality guideline 18 + subsequent-page requirements: the standard
// footer policy set every government site must carry. Targets are content
// dependencies - each should point to its own policy page once authored.
export const FOOTER_POLICY_LINKS = [
  { id: "p1", label: "Terms & Conditions", href: "#contact" },
  { id: "p2", label: "Privacy Policy", href: "#contact" },
  { id: "p3", label: "Copyright Policy", href: "#contact" },
  { id: "p4", label: "Hyperlinking Policy", href: "#contact" },
  { id: "p5", label: "Accessibility Statement", href: "#contact" },
  { id: "p6", label: "Disclaimer", href: "#contact" },
  { id: "p7", label: "Website Policies", href: "#contact" },
  { id: "p8", label: "Help", href: "#contact" },
  { id: "p9", label: "Archive", href: "#contact" },
  { id: "p10", label: "Sitemap", href: "#contact" },
];

// GIGW Quality guideline 18(3,6,7): About / Contact / Feedback must be directly
// reachable from the homepage. These sit in the masthead quick bar.
export const PRIMARY_SERVICE_LINKS = [
  { id: "about", label: "About Us", target: "about", icon: Info },
  { id: "contact", label: "Contact Us", target: "contact", icon: Phone },
  { id: "feedback", label: "Feedback", target: "contact", icon: MessageSquare },
  { id: "help", label: "Help", target: "contact", icon: Headphones },
];

export const FEEDBACK = {
  eyebrow: "Feedback",
  title: "Tell us how we can improve",
  note: "Your feedback is acknowledged on screen and reviewed by the EMS helpdesk within three working days.",
  fields: [
    { id: "name", label: "Full name", type: "text", autoComplete: "name", required: true },
    { id: "email", label: "Email address", type: "email", autoComplete: "email", required: true },
    { id: "category", label: "Category", type: "select", required: true, options: ["General", "Examinations", "Marks / Results", "Technical issue"] },
    { id: "message", label: "Your message", type: "textarea", autoComplete: "off", required: true },
  ],
  submitLabel: "Submit feedback",
  successTitle: "Thank you — your feedback has been received.",
  successBody: "A reference will be sent to your email. The EMS helpdesk reviews every submission within three working days.",
  // GIGW 55 / WCAG 3.3.1 + 3.3.3: errors must be identified in text with a
  // correction suggestion. `{label}` is substituted at render time.
  errors: {
    required: "{label} is required.",
    email: "Enter a valid email address, for example name@example.com.",
    summary: "Your feedback was not sent. Please correct the highlighted fields.",
  },
};

export const FOOTER_BADGE = { label: "Secure Government Portal", icon: Globe };

/* -- Interface strings ----------------------------------------------------- */
// Chrome/affordance text and accessible names. Kept here with the rest of the
// copy so the page has exactly one translatable surface — nothing user-facing
// is written inline in HomePage.jsx.

export const UI_TEXT = {
  skipToContent: "Skip to main content",
  login: "Login",
  departmentLogin: "Department Login",
  menu: "Menu",
  learnMore: "Learn more",
  loading: "Loading…",
  selectPlaceholder: "Select…",
  lastUpdated: "Last updated:",
  alsoOn: "Also on",
  quickLinksTitle: "Quick Links",
  externalLinksTitle: "External Links",
  newTabSuffix: "(opens in a new tab)",
  pendingFileTitle: "File will be available shortly",

  search: {
    placeholder: "Search this site…",
    label: "Search this site",
    clear: "Clear search",
    // `{query}` is substituted at render time.
    empty: "No matches for “{query}”.",
    groups: { service: "Service", download: "Download", link: "Link", page: "Page" },
  },

  hero: {
    region: "Highlights",
    prevSlide: "Previous slide",
    nextSlide: "Next slide",
    chooseSlide: "Choose slide",
  },

  ticker: { pause: "Pause notices", play: "Play notices" },

  gallery: { view: "View {label}", close: "Close image" },

  landmarks: {
    primaryNav: "Primary",
    quickLinksNav: "About, contact and feedback",
    footerSections: "Site sections",
    footerExternal: "External links",
    socialNav: "Official social media",
    govPlatforms: "National e-governance platforms",
  },

  backToTop: "Back to top",
};

/** Fills `{token}` placeholders in a UI_TEXT string. */
export function formatText(template, values) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, value),
    template,
  );
}
