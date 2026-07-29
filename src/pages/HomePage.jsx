import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowUp,
  Bell,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  KeyRound,
  Maximize2,
  Menu,
  Pause,
  Play,
  Search,
  X,
} from "lucide-react";

import "../styles/home.css";
import { useHomeStats } from "../hooks/useHomeStats.js";
import {
  ABOUT_CARD,
  ABOUT_STATEMENT,
  CONTACT_CHANNELS,
  CONTACT_SECTION,
  DOWNLOADS,
  EXTERNAL_LINKS,
  FEEDBACK,
  FOOTER_BADGE,
  FOOTER_POLICY_LINKS,
  GALLERY,
  GALLERY_SECTION,
  GOV_PLATFORMS,
  HERO_ACTIONS,
  HERO_SLIDES,
  HERO_TRUST,
  NATIONAL_PORTAL,
  NAV_LINKS,
  NEWS,
  NEWS_SECTION,
  PRIMARY_SERVICE_LINKS,
  RESOURCES_SECTION,
  SERVICES,
  SERVICES_SECTION,
  SITE,
  SOCIAL_LINKS,
  STATS,
  STATS_SECTION,
  TICKER_ITEMS,
  TICKER_LABEL,
  UI_TEXT,
  UTILITY_BAR,
  formatText,
} from "../content/homeContent.js";

// ---------------------------------------------------------------------------
// Every string, link, image and icon below comes from `content/homeContent.js`
// and every number in the "At a Glance" band comes from the live API - this
// file only decides how those values are laid out and behave.
// ---------------------------------------------------------------------------

const SLIDE_INTERVAL_MS = 6500;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function scrollToSection(id) {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
}

/**
 * Renders a phrase list where each phrase is unbreakable, so narrow screens
 * wrap between phrases (after the separator) instead of mid-phrase. The plain
 * space BETWEEN the spans is the one break opportunity — the separator itself
 * stays glued to the preceding phrase inside its nowrap span.
 */
function Phrases({ parts, separator = "—" }) {
  return parts.map((part, index) => {
    const last = index === parts.length - 1;
    return (
      <Fragment key={part}>
        <span className="pub-phrase">
          {part}
          {last ? "" : ` ${separator}`}
        </span>
        {last ? "" : " "}
      </Fragment>
    );
  });
}

function formatLongDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "long", year: "numeric" }).format(date);
}

/** Highlights the nav item whose section is currently on screen. */
function useSectionSpy(ids) {
  const [activeId, setActiveId] = useState(ids[0]);

  useEffect(() => {
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (sections.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [ids]);

  return activeId;
}

/** Auto-advancing hero carousel that pauses on hover, focus and tab-hide. */
function useCarousel(length, intervalMs) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback((step) => setIndex((prev) => (prev + step + length) % length), [length]);

  useEffect(() => {
    if (paused || length < 2 || prefersReducedMotion()) return undefined;
    const timer = setInterval(() => setIndex((prev) => (prev + 1) % length), intervalMs);
    return () => clearInterval(timer);
  }, [paused, length, intervalMs]);

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return { index, setIndex, go, paused, setPaused };
}

function formatNewsDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { day: "--", rest: "" };
  return {
    day: new Intl.DateTimeFormat(undefined, { day: "2-digit" }).format(date),
    rest: new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }).format(date),
  };
}

// ---------------------------------------------------------------------------

export default function HomePage({ onLoginClick }) {
  const navIds = useMemo(() => NAV_LINKS.map((link) => link.id), []);
  const activeSection = useSectionSpy(navIds);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavigate = useCallback((id) => {
    setMenuOpen(false);
    scrollToSection(id);
  }, []);

  // Hero buttons, service tiles and about card all describe themselves as
  // either "open the portal" or "jump to this section" - resolved here.
  const runAction = useCallback(
    (item) => {
      if (item.action === "login") return onLoginClick();
      if (item.target) return handleNavigate(item.target);
      return undefined;
    },
    [handleNavigate, onLoginClick],
  );

  return (
    <div className="pub-page">
      <a className="pub-skip" href="#main">
        {UI_TEXT.skipToContent}
      </a>

      <UtilityBar />
      <Masthead onNavigate={handleNavigate} onLoginClick={onLoginClick} />
      <PrimaryNav
        activeSection={activeSection}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((open) => !open)}
        onNavigate={handleNavigate}
        onLoginClick={onLoginClick}
      />

      <main id="main">
        <Hero onAction={runAction} />
        <Ticker />
        <About />
        <Services onSelect={runAction} onSectionLink={handleNavigate} />
        <Stats />
        <NewsAndAbout onLoginClick={onLoginClick} onAction={runAction} />
        <Gallery onOpen={setLightbox} />
        <Resources />
        <Feedback />
        <Contact />
      </main>

      <Footer onNavigate={handleNavigate} />

      {lightbox ? <Lightbox item={lightbox} onClose={() => setLightbox(null)} /> : null}
      {showTop ? (
        <button
          type="button"
          className="pub-totop"
          aria-label={UI_TEXT.backToTop}
          onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" })}
        >
          <ArrowUp size={18} />
        </button>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------

function UtilityBar() {
  return (
    <div className="pub-utility">
      <div className="pub-shell">
        <span>
          <Phrases parts={UTILITY_BAR.labelParts} separator="|" />
        </span>
        <div className="pub-utility-tools">
          {/* Text-size / contrast controls live in the UX4G accessibility
              widget loaded in index.html — no duplicate controls here. */}
          {/* GIGW 18(8): National Portal link, always a new tab. */}
          <a className="pub-utility-portal" href={NATIONAL_PORTAL.href} target="_blank" rel="noopener noreferrer">
            {NATIONAL_PORTAL.label}
            <ExternalLink size={11} aria-hidden="true" />
            <span className="pub-sr-only"> {UI_TEXT.newTabSuffix}</span>
          </a>
        </div>
      </div>
    </div>
  );
}

function Masthead({ onNavigate, onLoginClick }) {
  return (
    <header className="pub-masthead">
      <div className="pub-shell">
        <div className="pub-brand">
          <span className="pub-emblems">
            {SITE.emblems.map((emblem) => (
              <img key={emblem.src} src={emblem.src} alt={emblem.alt} />
            ))}
          </span>
          <div className="pub-brand-text">
            <h1>
              <span className="pub-brand-primary">{SITE.boardName}</span>
              <span className="pub-brand-secondary">{SITE.boardNameSecondary}</span>
            </h1>
            <p className="pub-brand-dept">
              <Phrases parts={SITE.departmentParts} />
            </p>
            <div className="pub-brand-contact">
              {CONTACT_CHANNELS.map(({ id, label, href, icon: Icon }) => (
                <a key={id} href={href}>
                  <Icon size={12} />
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="pub-masthead-aside">
          <nav className="pub-quicklinks" aria-label={UI_TEXT.landmarks.quickLinksNav}>
            {PRIMARY_SERVICE_LINKS.map(({ id, label, target, icon: Icon }) => (
              <button key={id} type="button" onClick={() => onNavigate(target)}>
                <Icon size={13} aria-hidden="true" />
                {label}
              </button>
            ))}
            <button type="button" className="pub-quicklinks-login" onClick={onLoginClick}>
              <KeyRound size={13} aria-hidden="true" />
              {UI_TEXT.login}
            </button>
          </nav>
          <SiteSearch onNavigate={onNavigate} />
        </div>
      </div>
    </header>
  );
}

/**
 * Search across the same content the page renders, so it can never drift out
 * of sync with what is on screen. Picking a result scrolls to its section
 * (or opens the external link).
 */
function SiteSearch({ onNavigate }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  const index = useMemo(
    () => [
      ...SERVICES.map((item) => ({ id: `s-${item.id}`, label: item.label, group: UI_TEXT.search.groups.service, target: item.target })),
      ...NEWS.map((item) => ({ id: `n-${item.id}`, label: item.title, group: item.category, target: "news" })),
      ...DOWNLOADS.map((item) => ({ id: `d-${item.id}`, label: item.label, group: UI_TEXT.search.groups.download, target: "resources" })),
      ...EXTERNAL_LINKS.map((item) => ({ id: `l-${item.id}`, label: item.label, group: UI_TEXT.search.groups.link, href: item.href })),
      ...NAV_LINKS.map((item) => ({ id: `p-${item.id}`, label: item.label, group: UI_TEXT.search.groups.page, target: item.id })),
    ],
    [],
  );

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return index.filter((entry) => entry.label.toLowerCase().includes(term)).slice(0, 8);
  }, [index, query]);

  useEffect(() => {
    const onClickAway = (event) => {
      if (boxRef.current && !boxRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, []);

  function choose(entry) {
    setOpen(false);
    setQuery("");
    if (entry.href) {
      window.open(entry.href, "_blank", "noopener,noreferrer");
      return;
    }
    onNavigate(entry.target);
  }

  const showResults = open && query.trim().length > 0;

  return (
    <div className="pub-search" ref={boxRef}>
      <div className="pub-search-field">
        <Search size={15} aria-hidden="true" />
        {/* Combobox semantics so screen readers are told results appeared —
            without these the dropdown is silent to assistive tech. */}
        <input
          type="search"
          value={query}
          placeholder={UI_TEXT.search.placeholder}
          aria-label={UI_TEXT.search.label}
          role="combobox"
          aria-expanded={showResults}
          aria-controls="pub-search-listbox"
          aria-autocomplete="list"
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
            if (event.key === "Enter" && matches.length > 0) choose(matches[0]);
          }}
        />
        {query ? (
          <button type="button" className="pub-search-clear" aria-label={UI_TEXT.search.clear} onClick={() => setQuery("")}>
            <X size={14} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {showResults ? (
        matches.length > 0 ? (
          <ul className="pub-search-results" id="pub-search-listbox" role="listbox" aria-label={UI_TEXT.search.label}>
            {matches.map((entry) => (
              <li key={entry.id} role="option" aria-selected="false">
                <button type="button" onClick={() => choose(entry)}>
                  <strong>{entry.label}</strong>
                  <small>{entry.group}</small>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="pub-search-results" id="pub-search-listbox">
            <p className="pub-search-empty" role="status">
              {formatText(UI_TEXT.search.empty, { query: query.trim() })}
            </p>
          </div>
        )
      ) : null}
    </div>
  );
}

function PrimaryNav({ activeSection, menuOpen, onToggleMenu, onNavigate, onLoginClick }) {
  return (
    <nav className="pub-nav" aria-label={UI_TEXT.landmarks.primaryNav}>
      <div className="pub-shell">
        <button
          type="button"
          className="pub-nav-toggle"
          aria-expanded={menuOpen}
          aria-controls="pub-nav-drawer"
          onClick={onToggleMenu}
        >
          {menuOpen ? <X size={16} aria-hidden="true" /> : <Menu size={16} aria-hidden="true" />}
          {UI_TEXT.menu}
        </button>

        <div className="pub-nav-links">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              aria-current={activeSection === link.id}
              onClick={() => onNavigate(link.id)}
            >
              {link.label}
            </button>
          ))}
        </div>

        <button type="button" className="pub-nav-login" onClick={onLoginClick}>
          <KeyRound size={15} aria-hidden="true" />
          {UI_TEXT.departmentLogin}
        </button>
      </div>

      {menuOpen ? (
        <div className="pub-nav-drawer" id="pub-nav-drawer">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              aria-current={activeSection === link.id}
              onClick={() => onNavigate(link.id)}
            >
              {link.label}
            </button>
          ))}
        </div>
      ) : null}
    </nav>
  );
}

function Hero({ onAction }) {
  const { index, setIndex, go, setPaused } = useCarousel(HERO_SLIDES.length, SLIDE_INTERVAL_MS);
  const slide = HERO_SLIDES[index];

  return (
    <section
      id="home"
      className="pub-hero"
      aria-label={UI_TEXT.hero.region}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") go(1);
        if (event.key === "ArrowLeft") go(-1);
      }}
    >
      {HERO_SLIDES.map((item, position) => (
        <div
          key={item.id}
          className={`pub-hero-media${position === index ? " is-active" : ""}`}
          style={{ backgroundImage: `url(${item.image})` }}
          aria-hidden="true"
        />
      ))}
      <div className="pub-hero-scrim" aria-hidden="true" />
      <div className="pub-hero-rule" aria-hidden="true" />

      <div className="pub-shell">
        <div className="pub-hero-copy" key={slide.id}>
          <p className="pub-eyebrow on-dark">{slide.eyebrow}</p>
          <h2>
            <span className="pub-hero-top">{slide.titleTop}</span>
            <span className="pub-hero-main">{slide.titleMain}</span>
          </h2>
          <p>{slide.body}</p>

          <div className="pub-hero-actions">
            {HERO_ACTIONS.map((action) => (
              <button
                key={action.id}
                type="button"
                className={`pub-btn pub-btn-${action.variant}`}
                onClick={() => onAction(action)}
              >
                {action.label}
                {action.variant === "primary" ? <ArrowRight size={15} /> : null}
              </button>
            ))}
          </div>

          <div className="pub-hero-trust">
            {HERO_TRUST.map(({ id, label, icon: Icon }) => (
              <span key={id}>
                <Icon size={14} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="pub-hero-controls">
        <span className="pub-hero-count">
          <b>{String(index + 1).padStart(2, "0")}</b> / {String(HERO_SLIDES.length).padStart(2, "0")}
        </span>
        <button type="button" className="pub-hero-arrow" aria-label={UI_TEXT.hero.prevSlide} onClick={() => go(-1)}>
          <ChevronLeft size={16} />
        </button>
        <button type="button" className="pub-hero-arrow" aria-label={UI_TEXT.hero.nextSlide} onClick={() => go(1)}>
          <ChevronRight size={16} />
        </button>
        <div className="pub-hero-dots" role="tablist" aria-label={UI_TEXT.hero.chooseSlide}>
          {HERO_SLIDES.map((item, position) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={position === index}
              aria-label={`${item.titleTop} ${item.titleMain}`}
              onClick={() => setIndex(position)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function Ticker() {
  const [running, setRunning] = useState(true);
  const loop = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="pub-ticker">
      <span className="pub-ticker-label">
        <Bell size={12} />
        {TICKER_LABEL}
      </span>
      <div className="pub-ticker-viewport">
        <div className="pub-ticker-track" style={running ? undefined : { animationPlayState: "paused" }}>
          {loop.map((item, position) => (
            <span className="pub-ticker-item" key={`${item.id}-${position}`} aria-hidden={position >= TICKER_ITEMS.length}>
              {item.text}
            </span>
          ))}
        </div>
      </div>
      <button
        type="button"
        className="pub-ticker-pause"
        aria-label={running ? UI_TEXT.ticker.pause : UI_TEXT.ticker.play}
        onClick={() => setRunning((value) => !value)}
      >
        {running ? <Pause size={13} /> : <Play size={13} />}
      </button>
    </div>
  );
}

function About() {
  return (
    <section id="about" className="pub-about-band" aria-labelledby="about-title">
      <div className="pub-shell">
        <div className="pub-about-band-head">
          <p className="pub-eyebrow">{ABOUT_STATEMENT.eyebrow}</p>
          <h2 className="pub-title" id="about-title">
            {ABOUT_STATEMENT.title}
          </h2>
        </div>
        <div className="pub-about-band-grid">
          <p className="pub-about-band-lead">{ABOUT_STATEMENT.body}</p>
          <ul className="pub-about-band-list">
            {ABOUT_STATEMENT.functions.map((text) => (
              <li key={text}>
                <CheckCircle2 size={16} aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Services({ onSelect, onSectionLink }) {
  return (
    <section id="services" className="pub-services" aria-labelledby="services-title">
      <div className="pub-shell">
        <div className="pub-section-head">
          <div>
            <p className="pub-eyebrow">{SERVICES_SECTION.eyebrow}</p>
            <h2 className="pub-title" id="services-title">
              {SERVICES_SECTION.title}
            </h2>
          </div>
          <button
            type="button"
            className="pub-section-link"
            onClick={() => onSectionLink(SERVICES_SECTION.linkTarget)}
          >
            {SERVICES_SECTION.linkLabel}
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="pub-services-grid">
          {SERVICES.map((service, position) => {
            const { id, label, desc, icon: Icon, accent } = service;
            return (
              <button
                key={id}
                type="button"
                className="pub-service"
                style={{ "--accent": accent }}
                aria-label={`${label} — ${desc}`}
                onClick={() => onSelect(service)}
              >
                <span className="pub-service-index" aria-hidden="true">
                  {String(position + 1).padStart(2, "0")}
                </span>
                <span className="pub-service-icon" aria-hidden="true">
                  <Icon size={22} />
                </span>
                <h3>{label}</h3>
                <p>{desc}</p>
                <span className="pub-service-more" aria-hidden="true">
                  {UI_TEXT.learnMore}
                  <ArrowRight size={12} />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const { counts, status } = useHomeStats(STATS);

  return (
    <section id="glance" className="pub-stats" aria-labelledby="stats-title">
      <div className="pub-shell">
        <div className="pub-stats-head">
          <p className="pub-eyebrow on-dark">{STATS_SECTION.eyebrow}</p>
          <h2 className="pub-title on-dark" id="stats-title">
            {STATS_SECTION.title}
          </h2>
        </div>

        <div className="pub-stats-grid">
          {STATS.map(({ id, label, icon: Icon, source, approx, suffix }) => {
            // Live API count always wins; the content module's approximate
            // figure stands in until it arrives (and is labelled as such).
            const live = counts[source];
            const hasLive = typeof live === "number";
            const value = hasLive ? live : approx;
            const pending = typeof value !== "number";
            const note = hasLive
              ? null
              : pending
                ? status === "loading"
                  ? UI_TEXT.loading
                  : STATS_SECTION.fallbackNote
                : STATS_SECTION.approxNote;
            return (
              <div className="pub-stat" key={id}>
                <span className="pub-stat-icon">
                  <Icon size={22} />
                </span>
                <div>
                  <CountUp value={value} pending={pending} suffix={hasLive ? "" : suffix || ""} />
                  {note ? <p className="pub-stat-note">{note}</p> : null}
                  <p className="pub-stat-label">{label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** Counts up to the given figure once, or renders an em dash while pending. */
function CountUp({ value, pending, suffix = "" }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (pending) return undefined;
    if (prefersReducedMotion()) {
      setShown(value);
      return undefined;
    }
    const duration = 900;
    const start = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      setShown(Math.round(value * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(step);
    });
    // rAF never fires while the tab is hidden — make sure the final value
    // lands anyway so a background-loaded page doesn't sit at 0.
    const settle = setTimeout(() => setShown(value), duration + 150);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(settle);
    };
  }, [value, pending]);

  return (
    <p className={`pub-stat-value${pending ? " is-pending" : ""}`}>
      {pending ? "—" : `${shown.toLocaleString()}${suffix}`}
    </p>
  );
}

function NewsAndAbout({ onLoginClick, onAction }) {
  return (
    <section id="news" className="pub-news" aria-labelledby="news-title">
      <div className="pub-shell">
        {/* Heading spans the full width so the news list and the About card
            below start on the same line. */}
        <div className="pub-section-head">
          <div>
            <p className="pub-eyebrow">{NEWS_SECTION.eyebrow}</p>
            <h2 className="pub-title" id="news-title">
              {NEWS_SECTION.title}
            </h2>
          </div>
        </div>

        <div className="pub-news-layout">
          <ul className="pub-news-list">
              {NEWS.map((item) => {
                const { day, rest } = formatNewsDate(item.date);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="pub-news-item"
                      aria-label={`${item.title} — ${item.category}, ${formatLongDate(item.date)}`}
                      onClick={() => onAction({ target: "resources" })}
                    >
                      <span className="pub-news-date" aria-hidden="true">
                        <span className="pub-news-day">{day}</span>
                        <span className="pub-news-month">{rest}</span>
                      </span>
                      <span className="pub-news-body">
                        <span className="pub-news-tags" aria-hidden="true">
                          {item.badge ? <span className="pub-tag pub-tag-new">{item.badge}</span> : null}
                          <span className="pub-tag pub-tag-cat">{item.category}</span>
                        </span>
                        <span className="pub-news-title">{item.title}</span>
                      </span>
                      <ChevronRight size={16} className="pub-news-chevron" aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
          </ul>

          <aside className="pub-about" aria-label={ABOUT_CARD.title}>
            <div className="pub-about-media" style={{ backgroundImage: `url(${ABOUT_CARD.image})` }}>
              <span className="pub-tag">{ABOUT_CARD.eyebrow}</span>
            </div>
            <div className="pub-about-body">
              <h3>{ABOUT_CARD.title}</h3>
              <p>{ABOUT_CARD.body}</p>
              <ul className="pub-about-points">
                {ABOUT_CARD.points.map(({ id, text, icon: Icon }) => (
                  <li key={id}>
                    <Icon size={15} />
                    {text}
                  </li>
                ))}
              </ul>
              <button type="button" className="pub-btn pub-btn-navy" onClick={onLoginClick}>
                {ABOUT_CARD.ctaLabel}
                <ArrowRight size={14} />
              </button>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function Gallery({ onOpen }) {
  return (
    <section id="gallery" className="pub-gallery" aria-labelledby="gallery-title">
      <div className="pub-shell">
        <div className="pub-section-head">
          <div>
            <p className="pub-eyebrow">{GALLERY_SECTION.eyebrow}</p>
            <h2 className="pub-title" id="gallery-title">
              {GALLERY_SECTION.title}
            </h2>
          </div>
        </div>

        <div className="pub-gallery-grid">
          {GALLERY.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`pub-gallery-tile${item.span ? ` span-${item.span}` : ""}`}
              onClick={() => onOpen(item)}
              aria-label={formatText(UI_TEXT.gallery.view, { label: item.label })}
            >
              <img src={item.src} alt={item.label} loading="lazy" />
              <span className="pub-gallery-caption">
                <Maximize2 size={13} />
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function Lightbox({ item, onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    // Remember what opened the dialog so focus can go back there on close —
    // without this a keyboard user is dumped on <body> and loses their place.
    const opener = document.activeElement;
    closeRef.current?.focus();

    const onKey = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      // Keep Tab inside the dialog (WCAG 2.4.3): the only focusable control
      // here is the close button, so any Tab returns to it.
      if (event.key === "Tab") {
        event.preventDefault();
        closeRef.current?.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, [onClose]);

  return (
    <div
      className="pub-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={item.label}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <button type="button" className="pub-lightbox-close" ref={closeRef} aria-label={UI_TEXT.gallery.close} onClick={onClose}>
        <X size={18} />
      </button>
      <figure>
        <img src={item.src} alt={item.label} />
        <figcaption>{item.label}</figcaption>
      </figure>
    </div>
  );
}

function Resources() {
  return (
    <section id="resources" className="pub-resources" aria-labelledby="resources-title">
      <div className="pub-shell">
        <div className="pub-section-head">
          <div>
            <p className="pub-eyebrow">{RESOURCES_SECTION.eyebrow}</p>
            <h2 className="pub-title" id="resources-title">
              {RESOURCES_SECTION.title}
            </h2>
          </div>
        </div>

        <div className="pub-resources-layout">
          <div>
            <h3 className="pub-subtitle" id="downloads-title">
              {RESOURCES_SECTION.downloadsTitle}
            </h3>
            {/* GIGW 12: each item announces title, format, size and a usage note.
                When href is null the file is a pending department upload. */}
            <ul className="pub-card-list" aria-labelledby="downloads-title">
              {DOWNLOADS.map(({ id, label, format, size, note, href, icon: Icon }) => {
                const meta = `${format} · ${size}`;
                const content = (
                  <>
                    <span className="pub-card-icon" aria-hidden="true">
                      <Icon size={17} />
                    </span>
                    <span className="pub-card-text">
                      <strong>{label}</strong>
                      <small>
                        {meta} — {note}
                      </small>
                    </span>
                    <Download size={15} className="pub-card-action" aria-hidden="true" />
                  </>
                );
                const ariaLabel = `${label}. ${format} file, ${size}. ${note}.`;
                return (
                  <li key={id}>
                    {href ? (
                      <a className="pub-card" href={href} target="_blank" rel="noopener noreferrer" aria-label={`${ariaLabel} Opens in a new tab.`}>
                        {content}
                      </a>
                    ) : (
                      <button type="button" className="pub-card" aria-label={ariaLabel} title={UI_TEXT.pendingFileTitle}>
                        {content}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h3 className="pub-subtitle" id="links-title">
              {RESOURCES_SECTION.linksTitle}
            </h3>
            <ul className="pub-card-list" aria-labelledby="links-title">
              {EXTERNAL_LINKS.map(({ id, label, href, icon: Icon }) => (
                <li key={id}>
                  <a
                    className="pub-card"
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${label} ${UI_TEXT.newTabSuffix}`}
                  >
                    <span className="pub-card-icon" aria-hidden="true">
                      <Icon size={17} />
                    </span>
                    <span className="pub-card-text">
                      <strong>{label}</strong>
                      <small>{href.replace(/^https?:\/\//, "").replace(/\/$/, "")}</small>
                    </span>
                    <ArrowUpRight size={15} className="pub-card-action" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pub-gov-strip" aria-label={UI_TEXT.landmarks.govPlatforms}>
          <span className="pub-gov-strip-label">{UI_TEXT.alsoOn}</span>
          <a className="pub-gov-chip pub-gov-chip-portal" href={NATIONAL_PORTAL.href} target="_blank" rel="noopener noreferrer">
            {NATIONAL_PORTAL.label}
            <ExternalLink size={12} aria-hidden="true" />
            <span className="pub-sr-only"> {UI_TEXT.newTabSuffix}</span>
          </a>
          {GOV_PLATFORMS.map(({ id, label, href }) => (
            <a key={id} className="pub-gov-chip" href={href} target="_blank" rel="noopener noreferrer">
              {label}
              <ExternalLink size={11} aria-hidden="true" />
              <span className="pub-sr-only"> {UI_TEXT.newTabSuffix}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Feedback() {
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  function handleSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const found = {};

    // Validated here rather than relying on the browser: `noValidate` is set so
    // the messages are real on-screen text (GIGW 55 / WCAG 3.3.1, 3.3.3)
    // instead of transient native bubbles.
    FEEDBACK.fields.forEach((field) => {
      const value = String(data.get(field.id) || "").trim();
      if (field.required && !value) {
        found[field.id] = formatText(FEEDBACK.errors.required, { label: field.label });
      } else if (value && field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        found[field.id] = FEEDBACK.errors.email;
      }
    });

    setErrors(found);

    if (Object.keys(found).length > 0) {
      // Send focus to the first field in error so keyboard and screen-reader
      // users land on the problem rather than hunting for it.
      const firstBad = FEEDBACK.fields.find((field) => found[field.id]);
      document.getElementById(`fb-${firstBad.id}`)?.focus();
      return;
    }

    // GIGW 19: on-screen acknowledgement. Wiring the POST to a backend inbox is
    // a department dependency; this confirms receipt to the user meanwhile.
    setSubmitted(true);
  }

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <section id="feedback" className="pub-feedback" aria-labelledby="feedback-title">
      <div className="pub-shell">
        <div className="pub-section-head">
          <div>
            <p className="pub-eyebrow">{FEEDBACK.eyebrow}</p>
            <h2 className="pub-title" id="feedback-title">
              {FEEDBACK.title}
            </h2>
          </div>
        </div>

        {submitted ? (
          <div className="pub-feedback-done" role="status">
            <CheckCircle2 size={22} aria-hidden="true" />
            <div>
              <strong>{FEEDBACK.successTitle}</strong>
              <p>{FEEDBACK.successBody}</p>
            </div>
          </div>
        ) : (
          <form className="pub-feedback-form" onSubmit={handleSubmit} noValidate>
            <p className="pub-feedback-note">{FEEDBACK.note}</p>

            {hasErrors ? (
              <p className="pub-form-summary" role="alert">
                {FEEDBACK.errors.summary}
              </p>
            ) : null}

            <div className="pub-feedback-grid">
              {FEEDBACK.fields.map((field) => {
                const error = errors[field.id];
                const errorId = `fb-${field.id}-error`;
                // Shared wiring so every control reports its error the same way.
                const a11y = {
                  id: `fb-${field.id}`,
                  name: field.id,
                  required: field.required,
                  "aria-invalid": error ? true : undefined,
                  "aria-describedby": error ? errorId : undefined,
                };
                return (
                  <div
                    key={field.id}
                    className={`pub-field${field.type === "textarea" ? " pub-field-full" : ""}${
                      error ? " has-error" : ""
                    }`}
                  >
                    <label htmlFor={`fb-${field.id}`}>
                      {field.label}
                      {field.required ? <span aria-hidden="true"> *</span> : null}
                    </label>
                    {field.type === "textarea" ? (
                      <textarea {...a11y} rows={4} autoComplete={field.autoComplete} />
                    ) : field.type === "select" ? (
                      <select {...a11y} defaultValue="">
                        <option value="" disabled>
                          {UI_TEXT.selectPlaceholder}
                        </option>
                        {field.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input {...a11y} type={field.type} autoComplete={field.autoComplete} />
                    )}
                    {error ? (
                      <span className="pub-field-error" id={errorId}>
                        {error}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <button type="submit" className="pub-btn pub-btn-primary">
              {FEEDBACK.submitLabel}
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function Contact() {
  const [primary] = CONTACT_CHANNELS;
  const PrimaryIcon = primary.icon;

  return (
    <section id="contact" className="pub-contact" aria-labelledby="contact-title">
      <div className="pub-shell">
        <div className="pub-contact-id">
          <span className="pub-contact-icon">
            <PrimaryIcon size={22} />
          </span>
          <div>
            <p className="pub-eyebrow">{CONTACT_SECTION.eyebrow}</p>
            <h2 id="contact-title">{CONTACT_SECTION.title}</h2>
            <p>{CONTACT_SECTION.address}</p>
            <p>{CONTACT_SECTION.hours}</p>
          </div>
        </div>

        <div className="pub-contact-channels">
          {CONTACT_CHANNELS.map(({ id, label, href, icon: Icon }) => (
            <a key={id} href={href}>
              <Icon size={14} />
              {label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer({ onNavigate }) {
  const BadgeIcon = FOOTER_BADGE.icon;

  return (
    <footer className="pub-footer">
      <div className="pub-shell">
        <div className="pub-footer-grid">
          <div>
            <div className="pub-footer-brand">
              <img src={SITE.emblems[0].src} alt="" aria-hidden="true" />
              <div>
                <strong>{SITE.productName}</strong>
                <span>
                  <Phrases parts={SITE.departmentParts} />
                </span>
              </div>
            </div>
            <p>{SITE.intro}</p>
            <span className="pub-footer-badge">
              <BadgeIcon size={12} aria-hidden="true" />
              {FOOTER_BADGE.label}
            </span>
            <div className="pub-footer-social" aria-label={UI_TEXT.landmarks.socialNav}>
              {SOCIAL_LINKS.map(({ id, label, href, icon: Icon }) => (
                <a key={id} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} ${UI_TEXT.newTabSuffix}`}>
                  <Icon size={16} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          <nav className="pub-footer-col" aria-label={UI_TEXT.landmarks.footerSections}>
            <h3>{UI_TEXT.quickLinksTitle}</h3>
            <ul className="pub-footer-links two-col">
              {NAV_LINKS.map((link) => (
                <li key={link.id}>
                  <button type="button" onClick={() => onNavigate(link.id)}>
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="pub-footer-col" aria-label={UI_TEXT.landmarks.footerExternal}>
            <h3>{UI_TEXT.externalLinksTitle}</h3>
            <ul className="pub-footer-links">
              {EXTERNAL_LINKS.map(({ id, label, href }) => (
                <li key={id}>
                  <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} ${UI_TEXT.newTabSuffix}`}>
                    <ChevronRight size={11} aria-hidden="true" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="pub-footer-bottom">
          <div className="pub-footer-policies">
            {FOOTER_POLICY_LINKS.map(({ id, label, href }) => (
              <a key={id} href={href}>
                {label}
              </a>
            ))}
          </div>
          <p className="pub-footer-meta">
            <span className="pub-footer-copy">{SITE.copyright}</span>
            <span>{SITE.credit}</span>
            <span className="pub-footer-updated">
              {UI_TEXT.lastUpdated}{" "}
              <time dateTime={SITE.lastUpdated}>{formatLongDate(SITE.lastUpdated)}</time>
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
