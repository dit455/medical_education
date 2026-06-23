import { useState, useEffect } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bell,
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Download,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Fingerprint,
  GraduationCap,
  Headphones,
  Home,
  KeyRound,
  Layers,
  LayoutDashboard,
  ListChecks,
  LockKeyhole,
  Megaphone,
  PenLine,
  Phone,
  Search,
  ShieldCheck,
  Upload,
  UserCheck,
  UserPlus,
  UserRoundCheck,
  Users,
} from "lucide-react";

const carouselSlides = [
  {
    id: "web-based",
    title: "A Modern, Web-Based Examination Marks Software",
    subtitle:
      "Replacing the legacy LAN-only system with a secure online platform for BOME and BOEN — for student enrolment, examinations, and marks sheets.",
    image: "/images/carousel_2.jpg",
    badge: "EMS v1.1",
  },
  {
    id: "workflow",
    title: "Maker–Checker–Approver Workflow with Digital Signature",
    subtitle:
      "Colleges enter student and marks data; Board officials verify and approve centrally using digital signature certificates.",
    image: "/images/carousel_1.jpg",
    badge: "Workflow Driven",
  },
  {
    id: "digilocker",
    title: "Digitally Signed Marks Sheets via DigiLocker",
    subtitle:
      "Generate customized marks sheets with unique registration and reference numbers, made available to students through DigiLocker.",
    image: "/images/carousel_2.jpg",
    badge: "DigiLocker Ready",
  },
];

const announcements = [
  ["Colleges can enter student basic and education details and upload supporting documents."],
  ["Student and education-details Excel templates are available for download."],
  ["Examination schedules are published per college, course, and term."],
];

const commandActions = [
  ["Register Student", "Enter basic & education details", UserPlus, "register", "#0f766e", "#ddf6f2"],
  ["Download Templates", "Student & education Excel formats", Download, "downloads", "#0f4c9a", "#eff6ff"],
  ["Track Verification", "Follow maker-checker-approver status", FileCheck2, "tracker", "#d97706", "#fef3c7"],
  ["Department Login", "Open department dashboard", KeyRound, "login", "#7c3aed", "#ede9fe"],
];

const moduleCards = [
  ["Student Module", "Basic details, education details, document upload, and maker-checker-approver verification with unique registration numbers.", GraduationCap, "#0f766e", "#ddf6f2"],
  ["Examination Module", "Term-wise subjects, examination schedules with holiday alerts, and attendance marking.", ClipboardCheck, "#0f4c9a", "#eff6ff"],
  ["Marks Module", "Subject and student marks with pass/fail rules, approvals, and digitally signed marks sheets.", FileCheck2, "#d97706", "#fef3c7"],
  ["Admin Module", "User creation with OTP login, role assignment, office hierarchy mapping, and feature configuration.", Users, "#7c3aed", "#ede9fe"],
  ["MIS Module", "Student, examination, and marks reports for decision-making.", BarChart3, "#059669", "#d1fae5"],
  ["Data Migration", "Meta data consolidation, cleaning, import, and integration from the legacy system.", Layers, "#475569", "#f1f5f9"],
];

const workflowSteps = [
  ["Data Entry", "Colleges enter student, education, and marks data.", PenLine],
  ["Verification", "Board checker verifies records and sends back for correction if needed.", ShieldCheck],
  ["Approval", "Board approver signs off with a digital signature certificate.", BadgeCheck],
  ["Registration No.", "A unique student registration number is generated.", FileSpreadsheet],
  ["Marks Sheet", "Customized, digitally signed marks sheet with a unique reference number.", FileCheck2],
  ["DigiLocker", "Marks sheet delivered to students via DigiLocker.", CheckCircle2],
];

const stats = [
  ["5", "Core Modules", "Student, Examination, Marks, Admin, MIS"],
  ["34", "Requirements", "Functional requirements in the DPR"],
  ["2", "Boards", "BOME and BOEN"],
  ["5", "Months", "Study, development, testing & deployment"],
];

const downloadLinks = [
  ["Student Details Excel Template", FileSpreadsheet, "#0f4c9a", "#eff6ff"],
  ["Education Details Excel Template", FileText, "#0f766e", "#ddf6f2"],
  ["Examination Schedule", CalendarCheck, "#d97706", "#fef3c7"],
  ["Document Upload Checklist", ListChecks, "#7c3aed", "#ede9fe"],
  ["Marks Sheet (via DigiLocker)", FileCheck2, "#059669", "#d1fae5"],
  ["Helpdesk Contact", Headphones, "#475569", "#f1f5f9"],
];

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function HomePage({ onLoginClick }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTab, setActiveTab] = useState("Modules");

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const slide = carouselSlides[activeSlide];

  return (
    <div className="home-shell mtpg-home">
      <PublicTopBar onLoginClick={onLoginClick} />
      <PublicHeader onLoginClick={onLoginClick} />
      <PublicNavbar />

      <HomeCarousel
        slide={slide}
        activeSlide={activeSlide}
        onSlideChange={setActiveSlide}
        onLoginClick={onLoginClick}
      />

      <main>
        <AnnouncementTicker />
        <QuickActionsStrip onLoginClick={onLoginClick} />
        <PortalServicesModules activeTab={activeTab} onTabChange={setActiveTab} />
        <RegisterNowSection onLoginClick={onLoginClick} />
        <StatsSection />
        <DprWorkflowSection />
        <DownloadsQuickLinks />
      </main>

      <MobileBottomActions onLoginClick={onLoginClick} />
      <PublicFooter />
    </div>
  );
}

function PublicTopBar({ onLoginClick }) {
  return (
    <header className="home-header" id="home-top">
      <div className="home-top-strip">
        <div className="home-top-left">
          <span>Government of Puducherry</span>
          <i />
          <strong>BOME &amp; BOEN</strong>
        </div>
        <div className="home-top-right">
          <span className="hp-live-badge"><span />Portal Active</span>
          <span><Phone size={12} /> Helpdesk</span>
          <span>Accessibility</span>
          <span>A- A+</span>
          <button type="button" onClick={onLoginClick}>Department Login</button>
        </div>
      </div>
    </header>
  );
}

function PublicHeader({ onLoginClick }) {
  return (
    <div className="home-header home-header-main">
      <div className="home-brand-row">
        <div className="home-brand-lockup">
          <div className="home-logo-pair">
            <span className="home-logo-shell"><img src="/images/govt_puducherry.png" alt="Government emblem" /></span>
            <span className="home-logo-shell institute"><img src="/images/institute_seal.png" alt="Institute logo" /></span>
          </div>
          <div>
            <strong>BOARD OF MEDICAL EDUCATION (BOME) &amp; BOARD OF EXAMINATION IN NURSING (BOEN)</strong>
            <span>EXAMINATION MARKS SYSTEM (EMS)</span>
            <small>MOTHER THERESA POST GRADUATE AND RESEARCH INSTITUTE OF HEALTH SCIENCES (MTPG&amp;RIHS)</small>
          </div>
        </div>

        <div className="home-header-actions">
          <label className="home-search" aria-label="Search EMS modules">
            <Search size={15} />
            <input placeholder="Search services..." />
          </label>
          <button className="primary-btn home-login-btn" type="button" onClick={onLoginClick}>
            <ArrowRight size={16} />
            Department Login
          </button>
        </div>
      </div>
    </div>
  );
}

function PublicNavbar() {
  const navItems = [
    ["Home", Home, "home-top"],
    ["Modules", LayoutDashboard, "home-services"],
    ["Workflow", ShieldCheck, "home-workflow"],
    ["Downloads", Download, "home-downloads"],
    ["Notices", Bell, "home-notices"],
    ["Helpdesk", Headphones, "home-footer"],
  ];

  return (
    <nav className="home-nav" aria-label="Public navigation">
      {navItems.map(([label, Icon, target], index) => (
        <button
          className={index === 0 ? "active" : ""}
          type="button"
          key={label}
          onClick={() => scrollToSection(target)}
        >
          <Icon size={15} />
          {label}
        </button>
      ))}
    </nav>
  );
}

function HomeCarousel({ slide, activeSlide, onSlideChange, onLoginClick }) {
  return (
    <section
      className="home-hero hp-hero hp-hero-single"
      aria-label="Portal highlights"
      style={{
        backgroundImage: `radial-gradient(130% 130% at 50% 40%, rgba(8,16,42,0.46) 0%, rgba(6,12,36,0.74) 55%, rgba(3,7,22,0.93) 100%), linear-gradient(180deg, rgba(4,9,28,0.58) 0%, rgba(4,9,28,0.10) 26%, rgba(4,9,28,0.22) 62%, rgba(4,9,28,0.82) 100%), url(${slide.image})`,
      }}
    >
      <button
        className="home-hero-arrow left"
        type="button"
        onClick={() => onSlideChange((activeSlide + carouselSlides.length - 1) % carouselSlides.length)}
        aria-label="Previous slide"
      >
        <ChevronLeft size={20} />
      </button>

      <div key={activeSlide} className="home-content home-hero-grid hp-hero-content">
        <div className="home-hero-copy">
          <span className="home-eyebrow">
            <span className="hp-eyebrow-dot" />
            {slide.badge} — BOME &amp; BOEN Official Portal
          </span>
          <h1>{slide.title}</h1>
          <p>{slide.subtitle}</p>
          <div className="home-hero-actions">
            <button className="primary-btn home-gold-btn" type="button" onClick={onLoginClick}>
              <UserPlus size={17} />
              Register Now
            </button>
            <button
              className="secondary-btn home-ghost-btn"
              type="button"
              onClick={() => scrollToSection("home-services")}
            >
              Explore Modules
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="home-trust-row">
            <span><CheckCircle2 size={13} /> Maker–Checker–Approver</span>
            <span><ShieldCheck size={13} /> OTP Verification</span>
            <span><Fingerprint size={13} /> Digital Signature</span>
          </div>
        </div>
      </div>

      <button
        className="home-hero-arrow right"
        type="button"
        onClick={() => onSlideChange((activeSlide + 1) % carouselSlides.length)}
        aria-label="Next slide"
      >
        <ChevronRight size={20} />
      </button>

      <div className="home-slide-dots" aria-label="Hero slides">
        {carouselSlides.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={activeSlide === index ? "active" : ""}
            onClick={() => onSlideChange(index)}
            aria-label={`Show slide ${index + 1}`}
          />
        ))}
      </div>

      <div className="hp-progress-bar">
        <span key={activeSlide} className="hp-progress-fill" />
      </div>
    </section>
  );
}

function AnnouncementTicker() {
  const items = announcements.map(([title]) => title);
  return (
    <div className="hp-ticker-wrap home-content" id="home-notices">
      <span className="hp-ticker-label">
        <Megaphone size={13} />
        Latest Notices
      </span>
      <div className="hp-ticker" aria-label="Scrolling announcements" aria-live="off">
        <div className="hp-ticker-track">
          {[...items, ...items, ...items].map((text, i) => (
            <span key={i} className="hp-ticker-item">
              <span className="hp-ticker-dot" />
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuickActionsStrip({ onLoginClick }) {
  function go(action) {
    if (action === "login" || action === "register") return onLoginClick();
    scrollToSection(
      action === "tracker" ? "home-workflow" : action === "downloads" ? "home-downloads" : "home-services"
    );
  }
  return (
    <section className="hp-cmd-band home-content" aria-label="Quick actions">
      {commandActions.map(([title, detail, Icon, action, color, bg]) => (
        <button key={title} type="button" className="hp-cmd-card" onClick={() => go(action)}>
          <span className="hp-cmd-icon" style={{ background: bg, color }}>
            <Icon size={22} />
          </span>
          <div className="hp-cmd-text">
            <strong>{title}</strong>
            <small>{detail}</small>
          </div>
          <ArrowRight size={16} className="hp-cmd-arrow" />
        </button>
      ))}
    </section>
  );
}

function PortalServicesModules({ activeTab, onTabChange }) {
  const tabs = ["Modules", "Workflow"];
  return (
    <section className="home-section home-content home-service-hub" id="home-services">
      <div className="home-section-head">
        <span>DPR Modules</span>
        <h2>One platform for the full examination lifecycle.</h2>
        <p>From student enrolment to examinations, marks approval, administration, reporting, and migration from the legacy system.</p>
      </div>

      <div className="home-tabs" role="tablist" aria-label="Homepage service views">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => onTabChange(tab)}
          >
            {tab === "Modules" ? "EMS Modules" : "Approval Workflow"}
          </button>
        ))}
      </div>

      {activeTab === "Modules" && (
        <div className="hp-modules-grid">
          {moduleCards.map(([title, detail, Icon, accent, iconBg]) => (
            <article key={title} className="hp-module-card" style={{ borderTopColor: accent }}>
              <div className="hp-module-icon" style={{ background: iconBg, color: accent }}>
                <Icon size={20} />
              </div>
              <strong>{title}</strong>
              <p>{detail}</p>
              <span className="hp-module-badge" style={{ background: `${accent}18`, color: accent }}>DPR aligned</span>
            </article>
          ))}
        </div>
      )}

      {activeTab === "Workflow" && (
        <div className="home-workflow-grid compact-grid">
          {workflowSteps.map(([title, detail, Icon], index) => (
            <article key={title}>
              <small>Step {index + 1}</small>
              <span><Icon size={18} /></span>
              <strong>{title}</strong>
              <p>{detail}</p>
            </article>
          ))}
        </div>
      )}

    </section>
  );
}

function RegisterNowSection({ onLoginClick }) {
  return (
    <section className="home-cta home-content home-register-section">
      <div>
        <span>Official Workflow</span>
        <h2>Move examination work from data entry to approved output.</h2>
        <p>Authorized colleges enter data. Board officials verify, approve, digitally sign, and monitor through MIS.</p>
        <div className="home-register-trust">
          <span><LockKeyhole size={13} /> OTP login ready</span>
          <span><ShieldCheck size={13} /> Board approval</span>
          <span><Fingerprint size={13} /> Audit trail</span>
        </div>
      </div>
      <div className="home-register-actions">
        <button className="primary-btn home-gold-btn" type="button" onClick={onLoginClick}>
          <LockKeyhole size={17} />
          Login Now
        </button>
        <button
          className="secondary-btn home-ghost-btn"
          type="button"
          onClick={() => scrollToSection("home-downloads")}
        >
          <Download size={16} />
          View Downloads
        </button>
      </div>
    </section>
  );
}

function StatsSection() {
  return (
    <section className="hp-stats-strip" id="home-analytics">
      <div className="home-content hp-stats-inner">
        <div className="hp-stats-label">
          <span>Project Scope</span>
          <h3>Clear functional coverage from the DPR.</h3>
          <p>Built to the 34 requirements specified in the Detailed Project Report for Government of Puducherry boards.</p>
        </div>
        <div className="hp-stats-grid">
          {stats.map(([value, label, detail]) => (
            <div key={label} className="hp-stat-item">
              <strong>{value}</strong>
              <span>{label}</span>
              <p>{detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DprWorkflowSection() {
  const controls = [
    ["OTP Authentication", "Portal login secured with OTP-based authentication for staff and officials.", KeyRound],
    ["Digital Signature", "Student approvals and marks sheets carry digital signature certificates.", ShieldCheck],
    ["DigiLocker Integration", "Approved marks sheets are made available to students through DigiLocker.", FileCheck2],
    ["Audit Trail", "Attendance, marks, and approval changes are tracked with a full correction trail.", Fingerprint],
  ];

  return (
    <section className="home-section home-content" id="home-workflow">
      <div className="home-section-head compact">
        <span>Workflow, Security &amp; Compliance</span>
        <h2>Maker–checker–approver, built for controlled board operations.</h2>
      </div>
      <div className="hp-security-layout">
        <div className="hp-process-card">
          <strong>Operational Path</strong>
          {["Maker submits data", "Checker verifies records", "Approver signs off"].map((item, i) => (
            <div key={item} className="hp-process-step">
              <span className="hp-process-num">{i + 1}</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
        <div className="hp-features-grid">
          {controls.map(([title, detail, Icon]) => (
            <article key={title} className="hp-feature-card">
              <div className="hp-feature-icon"><Icon size={20} /></div>
              <strong>{title}</strong>
              <p>{detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function DownloadsQuickLinks() {
  return (
    <section className="home-section home-content" id="home-downloads">
      <div className="home-section-head compact">
        <span>Official Resources</span>
        <h2>Common EMS templates and references.</h2>
      </div>
      <div className="hp-dl-grid">
        {downloadLinks.map(([label, Icon, color, bg]) => (
          <button key={label} type="button" className="hp-dl-card">
            <span className="hp-dl-icon" style={{ background: bg, color }}>
              <Icon size={18} />
            </span>
            <span className="hp-dl-label">{label}</span>
            <span className="hp-dl-action">
              <Download size={15} />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function MobileBottomActions({ onLoginClick }) {
  return (
    <nav className="home-mobile-actions" aria-label="Mobile EMS actions">
      <button type="button" onClick={onLoginClick}><KeyRound size={16} /> Login</button>
      <button type="button" onClick={() => scrollToSection("home-services")}><LayoutDashboard size={16} /> Modules</button>
      <button type="button" onClick={() => scrollToSection("home-footer")}><Headphones size={16} /> Helpdesk</button>
    </nav>
  );
}

function PublicFooter() {
  const quickLinks = [
    "Student Registration",
    "Examination Schedule",
    "Marks Verification",
    "Download Templates",
    "Helpdesk Support",
  ];
  const boards = [
    "BOME Workflow",
    "BOEN Workflow",
    "Role-based Access",
    "DigiLocker Integration",
  ];

  return (
    <footer className="home-footer" id="home-footer">
      <div className="home-content hp-footer-inner">
        <div className="hp-footer-brand">
          <span className="home-logo-shell">
            <img src="/images/institute_seal.png" alt="Institute logo" />
          </span>
          <div>
            <strong>BOME &amp; BOEN Examination Marks Software</strong>
            <p>Official portal for examination, marksheet, approval, and MIS workflows for Government of Puducherry.</p>
            <div className="hp-footer-status">
              <span className="hp-live-badge"><span />Secure Access</span>
              <span>10:00 AM – 5:00 PM</span>
            </div>
          </div>
        </div>

        <div className="hp-footer-col">
          <span>Quick Links</span>
          <ul>
            {quickLinks.map((link) => (
              <li key={link}><ArrowRight size={12} />{link}</li>
            ))}
          </ul>
        </div>

        <div className="hp-footer-col">
          <span>Boards Covered</span>
          <ul>
            {boards.map((b) => (
              <li key={b}><CheckCircle2 size={12} />{b}</li>
            ))}
          </ul>
        </div>

        <div className="hp-footer-col">
          <span>Contact Helpdesk</span>
          <strong className="hp-footer-phone">0413-0000000</strong>
          <p>helpdesk@mtpg-rihs.py.gov.in</p>
          <div className="hp-footer-badge">
            <ShieldCheck size={13} />
            Government of Puducherry Portal
          </div>
        </div>
      </div>

      <div className="hp-footer-bottom">
        <div className="home-content hp-footer-bottom-inner">
          <p>© 2026 Government of Puducherry — Directorate of Information Technology. All rights reserved.</p>
          <p>BOME and BOEN Examination Management System</p>
        </div>
      </div>
    </footer>
  );
}
