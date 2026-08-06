import { useState, useEffect, useCallback } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Download,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Fingerprint,
  GraduationCap,
  Headphones,
  KeyRound,
  Layers,
  LayoutDashboard,
  ListChecks,
  LockKeyhole,
  Mail,
  Megaphone,
  PenLine,
  Phone,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Static content (unchanged from the previous homepage - same copy/data, just
// presented inside the single-screen dashboard layout below).
// ---------------------------------------------------------------------------

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

const heroHighlights = [
  ["Secure Access", "OTP login + digital signature", ShieldCheck],
  ["Two Boards", "BOME & BOEN, one portal", Building2],
  ["DigiLocker", "Signed marks sheets delivered", FileCheck2],
];

const announcements = [
  "Colleges can enter student basic and education details and upload supporting documents.",
  "Student and education-details Excel templates are available for download.",
  "Examination schedules are published per college, course, and term.",
];

const commandActions = [
  ["Register Student", "Basic & education details", UserPlus, "register", "#0f766e", "#ddf6f2"],
  ["Download Templates", "Excel formats", Download, "downloads", "#0f4c9a", "#eff6ff"],
  ["Track Verification", "Maker-checker status", FileCheck2, "tracker", "#d97706", "#fef3c7"],
  ["Department Login", "Open dashboard", KeyRound, "login", "#7c3aed", "#ede9fe"],
];

const moduleCards = [
  ["Student Module", "Basic & education details, document upload, and maker-checker-approver verification with unique registration numbers.", GraduationCap, "#0f766e", "#ddf6f2"],
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

const securityControls = [
  ["OTP Authentication", "Portal login secured with OTP-based authentication for staff and officials.", KeyRound],
  ["Digital Signature", "Student approvals and marks sheets carry digital signature certificates.", ShieldCheck],
  ["DigiLocker Integration", "Approved marks sheets are made available to students through DigiLocker.", FileCheck2],
  ["Audit Trail", "Attendance, marks, and approval changes are tracked with a full correction trail.", Fingerprint],
];

const processPath = ["Maker submits data", "Checker verifies records", "Approver signs off"];

const stats = [
  ["5", "Core Modules", "Student, Examination, Marks, Admin, MIS"],
  ["34", "Requirements", "Functional requirements in the DPR"],
  ["2", "Boards", "BOME and BOEN"],
  ["5", "Months", "Study, build, test & deploy"],
];

const downloadLinks = [
  ["Student Details Excel Template", FileSpreadsheet, "#0f4c9a", "#eff6ff"],
  ["Education Details Excel Template", FileText, "#0f766e", "#ddf6f2"],
  ["Examination Schedule", CalendarCheck, "#d97706", "#fef3c7"],
  ["Document Upload Checklist", ListChecks, "#7c3aed", "#ede9fe"],
  ["Marks Sheet (via DigiLocker)", FileCheck2, "#059669", "#d1fae5"],
  ["Helpdesk Contact", Headphones, "#475569", "#f1f5f9"],
];

const NAV_TABS = [
  ["Modules", LayoutDashboard],
  ["Workflow", ShieldCheck],
  ["Security", Fingerprint],
  ["Downloads", Download],
  ["Notices", Megaphone],
  ["Helpdesk", Headphones],
];

const TAB_META = {
  Modules: "Five DPR-aligned modules covering the full examination lifecycle.",
  Workflow: "From data entry to a DigiLocker-delivered, signed marks sheet.",
  Security: "Maker–checker–approver controls built for board operations.",
  Downloads: "Common EMS templates and official references.",
  Notices: "Latest portal announcements for colleges and officials.",
  Helpdesk: "Reach the EMS support desk during working hours.",
};

// ---------------------------------------------------------------------------

export default function HomePage({ onLoginClick }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTab, setActiveTab] = useState("Modules");

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleQuickAction = useCallback(
    (action) => {
      if (action === "login" || action === "register") return onLoginClick();
      if (action === "downloads") return setActiveTab("Downloads");
      if (action === "tracker") return setActiveTab("Workflow");
      return setActiveTab("Modules");
    },
    [onLoginClick],
  );

  return (
    <div className="ems-home">
      <TopHeader activeTab={activeTab} onTabChange={setActiveTab} onLoginClick={onLoginClick} />
      <Ticker />

      <main className="ems-stage">
        <Hero
          slide={carouselSlides[activeSlide]}
          activeSlide={activeSlide}
          onSlideChange={setActiveSlide}
          onLoginClick={onLoginClick}
          onExplore={() => setActiveTab("Modules")}
        />

        <aside className="ems-rail">
          <QuickActions onAction={handleQuickAction} />
          <ContentPanel activeTab={activeTab} onLoginClick={onLoginClick} />
          <StatStrip />
        </aside>
      </main>

      <FooterBar />
      <MobileBar onLoginClick={onLoginClick} onTabChange={setActiveTab} />
    </div>
  );
}

// ---------------------------------------------------------------------------

function TopHeader({ activeTab, onTabChange, onLoginClick }) {
  return (
    <header className="ems-top">
      <div className="ems-brand">
        <span className="ems-logo-pair">
          <img src="/images/govt_puducherry.png" alt="Government of Puducherry emblem" />
          <img src="/images/institute_seal.png" alt="MTPG&RIHS institute seal" />
        </span>
        <div className="ems-brand-text">
          <strong>Examination Marks System</strong>
          <span>BOME &amp; BOEN · Government of Puducherry</span>
        </div>
      </div>

      <nav className="ems-nav" aria-label="Portal sections">
        {NAV_TABS.map(([label, Icon]) => (
          <button
            key={label}
            type="button"
            className={activeTab === label ? "active" : ""}
            aria-pressed={activeTab === label}
            onClick={() => onTabChange(label)}
          >
            <Icon size={15} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="ems-top-actions">
        <label className="ems-search" aria-label="Search EMS services">
          <Search size={15} />
          <input placeholder="Search services…" />
        </label>
        <span className="ems-live" title="Portal status">
          <span className="ems-live-dot" />
          Active
        </span>
        <button className="ems-login-btn" type="button" onClick={onLoginClick}>
          <ArrowRight size={16} />
          Department Login
        </button>
      </div>
    </header>
  );
}

function Ticker() {
  const items = [...announcements, ...announcements, ...announcements];
  return (
    <div className="ems-ticker" aria-label="Latest notices">
      <span className="ems-ticker-label">
        <Megaphone size={13} />
        Notices
      </span>
      <div className="ems-ticker-view">
        <div className="ems-ticker-track">
          {items.map((text, i) => (
            <span key={i} className="ems-ticker-item">
              <span className="ems-ticker-dot" />
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Hero({ slide, activeSlide, onSlideChange, onLoginClick, onExplore }) {
  const count = carouselSlides.length;
  const go = (dir) => onSlideChange((activeSlide + dir + count) % count);

  return (
    <section
      className="ems-hero"
      aria-label="Portal highlights"
      style={{
        backgroundImage:
          `linear-gradient(180deg, rgba(4,10,28,0.18) 0%, rgba(4,10,28,0.06) 30%, rgba(3,8,22,0.86) 100%),` +
          `linear-gradient(102deg, rgba(6,16,40,0.92) 0%, rgba(6,14,36,0.6) 46%, rgba(4,10,28,0.28) 100%),` +
          `url(${slide.image})`,
      }}
    >
      <div className="ems-hero-top">
        <span className="ems-hero-badge">
          <span className="ems-hero-badge-dot" />
          {slide.badge} · Official Portal
        </span>
        <span className="ems-hero-count" aria-hidden="true">
          {String(activeSlide + 1).padStart(2, "0")}
          <i>/</i>
          {String(count).padStart(2, "0")}
        </span>
      </div>

      <div key={activeSlide} className="ems-hero-body">
        <h1>{slide.title}</h1>
        <p>{slide.subtitle}</p>

        <div className="ems-hero-cta">
          <button className="ems-btn-gold" type="button" onClick={onLoginClick}>
            <UserPlus size={17} />
            Register Now
          </button>
          <button className="ems-btn-ghost" type="button" onClick={onExplore}>
            Explore Modules
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="ems-hero-trust">
          <span><CheckCircle2 size={13} /> Maker–Checker–Approver</span>
          <span><ShieldCheck size={13} /> OTP Verification</span>
          <span><Fingerprint size={13} /> Digital Signature</span>
        </div>
      </div>

      <div className="ems-hero-foot">
        <div className="ems-hero-highlights">
          {heroHighlights.map(([title, detail, Icon]) => (
            <div key={title} className="ems-hero-hl">
              <span className="ems-hero-hl-icon"><Icon size={16} /></span>
              <span className="ems-hero-hl-text">
                <strong>{title}</strong>
                <small>{detail}</small>
              </span>
            </div>
          ))}
        </div>

        <div className="ems-hero-controls">
          <div className="ems-hero-dots" role="tablist" aria-label="Slides">
            {carouselSlides.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={activeSlide === index ? "active" : ""}
                aria-label={`Slide ${index + 1}`}
                aria-selected={activeSlide === index}
                onClick={() => onSlideChange(index)}
              />
            ))}
          </div>
          <div className="ems-hero-arrows">
            <button type="button" onClick={() => go(-1)} aria-label="Previous slide"><ChevronLeft size={18} /></button>
            <button type="button" onClick={() => go(1)} aria-label="Next slide"><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>
    </section>
  );
}

function QuickActions({ onAction }) {
  return (
    <div className="ems-quick" aria-label="Quick actions">
      {commandActions.map(([title, detail, Icon, action, color, bg]) => (
        <button key={title} type="button" className="ems-quick-card" onClick={() => onAction(action)}>
          <span className="ems-quick-icon" style={{ background: bg, color }}>
            <Icon size={18} />
          </span>
          <span className="ems-quick-text">
            <strong>{title}</strong>
            <small>{detail}</small>
          </span>
          <ArrowUpRight size={15} className="ems-quick-arrow" />
        </button>
      ))}
    </div>
  );
}

function ContentPanel({ activeTab, onLoginClick }) {
  return (
    <section className="ems-panel" aria-live="polite">
      <header className="ems-panel-head">
        <div>
          <span className="ems-panel-eyebrow">{activeTab}</span>
          <p>{TAB_META[activeTab]}</p>
        </div>
      </header>
      <div className="ems-panel-scroll">
        <PanelContent activeTab={activeTab} onLoginClick={onLoginClick} />
      </div>
    </section>
  );
}

function PanelContent({ activeTab, onLoginClick }) {
  if (activeTab === "Modules") {
    return (
      <div className="ems-module-grid">
        {moduleCards.map(([title, detail, Icon, accent, iconBg]) => (
          <article key={title} className="ems-module-card" style={{ "--accent": accent }}>
            <span className="ems-module-icon" style={{ background: iconBg, color: accent }}>
              <Icon size={18} />
            </span>
            <strong>{title}</strong>
            <p>{detail}</p>
          </article>
        ))}
      </div>
    );
  }

  if (activeTab === "Workflow") {
    return (
      <ol className="ems-flow">
        {workflowSteps.map(([title, detail, Icon], index) => (
          <li key={title} className="ems-flow-step">
            <span className="ems-flow-num">{index + 1}</span>
            <span className="ems-flow-icon"><Icon size={16} /></span>
            <div>
              <strong>{title}</strong>
              <p>{detail}</p>
            </div>
          </li>
        ))}
      </ol>
    );
  }

  if (activeTab === "Security") {
    return (
      <div className="ems-security">
        <div className="ems-security-path">
          {processPath.map((item, i) => (
            <div key={item} className="ems-security-node">
              <span>{i + 1}</span>
              {item}
            </div>
          ))}
        </div>
        <div className="ems-security-grid">
          {securityControls.map(([title, detail, Icon]) => (
            <article key={title} className="ems-security-card">
              <span className="ems-security-icon"><Icon size={17} /></span>
              <strong>{title}</strong>
              <p>{detail}</p>
            </article>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === "Downloads") {
    return (
      <div className="ems-dl-grid">
        {downloadLinks.map(([label, Icon, color, bg]) => (
          <button key={label} type="button" className="ems-dl-card">
            <span className="ems-dl-icon" style={{ background: bg, color }}>
              <Icon size={17} />
            </span>
            <span className="ems-dl-label">{label}</span>
            <Download size={15} className="ems-dl-action" />
          </button>
        ))}
      </div>
    );
  }

  if (activeTab === "Notices") {
    return (
      <ul className="ems-notice-list">
        {announcements.map((text, i) => (
          <li key={i} className="ems-notice-item">
            <span className="ems-notice-dot" />
            <p>{text}</p>
          </li>
        ))}
      </ul>
    );
  }

  // Helpdesk
  return (
    <div className="ems-help">
      <div className="ems-help-row">
        <span className="ems-help-icon"><Phone size={17} /></span>
        <div><small>Helpdesk</small><strong>0413-0000000</strong></div>
      </div>
      <div className="ems-help-row">
        <span className="ems-help-icon"><Mail size={17} /></span>
        <div><small>Email</small><strong>helpdesk@mtpg-rihs.py.gov.in</strong></div>
      </div>
      <div className="ems-help-row">
        <span className="ems-help-icon"><Clock size={17} /></span>
        <div><small>Working hours</small><strong>10:00 AM – 5:00 PM</strong></div>
      </div>
      <button className="ems-btn-gold ems-help-cta" type="button" onClick={onLoginClick}>
        <LockKeyhole size={16} />
        Department Login
      </button>
    </div>
  );
}

function StatStrip() {
  return (
    <div className="ems-stats" aria-label="Project scope">
      {stats.map(([value, label, detail]) => (
        <div key={label} className="ems-stat" title={detail}>
          <strong>{value}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

function FooterBar() {
  return (
    <footer className="ems-foot">
      <span className="ems-foot-left">
        <ShieldCheck size={13} />
        © 2026 Government of Puducherry — Directorate of Information Technology
      </span>
      <span className="ems-foot-right">
        <span><Phone size={12} /> 0413-0000000</span>
        <span><Mail size={12} /> helpdesk@mtpg-rihs.py.gov.in</span>
      </span>
    </footer>
  );
}

function MobileBar({ onLoginClick, onTabChange }) {
  return (
    <nav className="ems-mobile" aria-label="Mobile actions">
      <button type="button" onClick={onLoginClick}><KeyRound size={16} /><span>Login</span></button>
      <button type="button" onClick={() => onTabChange("Modules")}><LayoutDashboard size={16} /><span>Modules</span></button>
      <button type="button" onClick={() => onTabChange("Downloads")}><Download size={16} /><span>Downloads</span></button>
      <button type="button" onClick={() => onTabChange("Helpdesk")}><Headphones size={16} /><span>Helpdesk</span></button>
    </nav>
  );
}
