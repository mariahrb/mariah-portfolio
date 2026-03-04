import { useEffect, useRef, useState } from 'react';
import type { PageKey, PageSource } from '../App';
import styles from './PageOverlay.module.css';

const PAGE_ORDER: PageKey[] = ['home', 'devlab', 'studio', 'innovation', 'library', 'townhall'];
const PAGE_LABELS: Record<NonNullable<PageKey>, string> = {
  home: '🏠 About', devlab: '💻 Projects', studio: '🎨 Design',
  innovation: '🌱 Leadership', library: '📜 Resume', townhall: '📬 Contact',
};
const PAGE_TYPE: Record<NonNullable<PageKey>, 'default' | 'design' | 'dark'> = {
  home: 'default', devlab: 'default', studio: 'design',
  innovation: 'dark', library: 'default', townhall: 'default',
};

interface Props {
  pageKey: NonNullable<PageKey>;
  source: PageSource;
  onClose: () => void;
  onNavigate: (key: PageKey) => void;
}

export function PageOverlay({ pageKey, source, onClose, onNavigate }: Props) {
  const type  = PAGE_TYPE[pageKey];
  const isDark = type === 'dark';
  const overlayRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Close on Escape, arrow keys for page navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      const currentIdx = PAGE_ORDER.indexOf(pageKey);
      if (e.key === 'ArrowRight' && currentIdx < PAGE_ORDER.length - 1) {
        onNavigate(PAGE_ORDER[currentIdx + 1]);
      }
      if (e.key === 'ArrowLeft' && currentIdx > 0) {
        onNavigate(PAGE_ORDER[currentIdx - 1]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onNavigate, pageKey]);

  // Focus trap
  useEffect(() => {
    overlayRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!overlayRef.current) return;
    overlayRef.current.scrollTop = 0;
    setScrollProgress(0);
  }, [pageKey]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const max = el.scrollHeight - el.clientHeight;
    setScrollProgress(max > 0 ? el.scrollTop / max : 0);
  };

  return (
    <div
      ref={overlayRef}
      className={`${styles.overlay} ${styles[type]}`}
      role="dialog"
      aria-modal="true"
      aria-label={`${pageKey} page`}
      tabIndex={-1}
      onScroll={handleScroll}
    >
      <div className={styles.scrollProgressTrack} aria-hidden="true">
        <span className={styles.scrollProgressFill} style={{ transform: `scaleX(${scrollProgress})` }} />
      </div>
      <div className={styles.inner}>
        {/* Top bar */}
        <div className={styles.topBar}>
          <button
            className={`${styles.back} ${source === 'game' ? styles.backGame : styles.backLand}`}
            onClick={onClose}
          >
            {source === 'game' ? '◀ BACK TO VALLEY' : '◀ BACK'}
          </button>
          <div className={styles.pills}>
            {PAGE_ORDER.map(k => k && (
              <button
                key={k}
                className={`${styles.pill} ${isDark ? styles.pillDark : ''} ${k === pageKey ? styles.pillActive : ''}`}
                onClick={() => onNavigate(k)}
              >
                {PAGE_LABELS[k]}
              </button>
            ))}
            <span className={styles.keyboardHint}>← → to navigate</span>
          </div>
        </div>

        {/* Page content */}
        <PageContent pageKey={pageKey} isDark={isDark} onNavigate={onNavigate} />
        <footer className={`${styles.overlayFooter} ${isDark ? styles.overlayFooterDark : ''}`} aria-label="Site footer">
          <div className={styles.footerTopRule} />
          <div className={styles.footerRow}>
            <p className={styles.footerText}>Built by Mariah Barreto · Backend, Data, and Design</p>
            <div className={styles.footerLinks}>
              <a href="mailto:mariahrangelbarreto@gmail.com" className={styles.footerLink}>Email</a>
              <a href="https://www.linkedin.com/in/mariah-barreto-7a5706215/" target="_blank" rel="noreferrer" className={styles.footerLink}>LinkedIn</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ─── Individual page content ─────────────────────────────────────────────────
function useScrollReveal<T extends HTMLElement>(count: number, threshold = 0.12) {
  const refs = useRef<(T | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add(styles.revealVisible);
          observer.unobserve(entry.target);
        });
      },
      { threshold, rootMargin: '0px 0px -8% 0px' }
    );

    refs.current.slice(0, count).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [count, threshold]);

  return refs;
}

function PageContent({ pageKey, isDark, onNavigate }: {
  pageKey: NonNullable<PageKey>;
  isDark: boolean;
  onNavigate: (key: PageKey) => void;
}) {
  switch (pageKey) {
    case 'home':       return <HomePage onNavigate={onNavigate} />;
    case 'devlab':     return <DevLabPage />;
    case 'studio':     return <StudioPage />;
    case 'innovation': return <InnovationPage />;
    case 'library':    return <LibraryPage />;
    case 'townhall':   return <TownHallPage />;
    default:           return null;
  }
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function HomePage({ onNavigate }: { onNavigate: (k: PageKey) => void }) {
  const [animate, setAnimate] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimate(true), 120); return () => clearTimeout(t); }, []);

  const skills = [
    { label: 'Go / Python / SQL',             pct: 92, color: 'var(--accent)' },
    { label: 'Data & Automation Workflows',   pct: 90, color: 'var(--mint)' },
    { label: 'Backend System Design',         pct: 86, color: 'var(--lav)' },
    { label: 'Cloud / CI-CD / Observability', pct: 82, color: 'var(--gold)' },
  ];
  return (
    <div>
      <div className={styles.aboutHero}>
        <img src="/portrait.png" alt="Mariah Barreto portrait" className={styles.aboutPortrait} />
      </div>
      <p className={styles.tag}>// ABOUT ME</p>
      <h1 className={styles.h1}>Hello,<br />I'm <em>Mariah.</em></h1>
      <div className={styles.rule} />
      <p className={styles.lead}>
        Computer Engineering student at the University of South Florida (GPA 3.9),
        building backend and data systems with Go, Python, SQL, and cloud tooling.
      </p>
      <div className={styles.skills}>
        {skills.map(s => (
          <div key={s.label} className={styles.skillItem}>
            <div className={styles.skillLabel}><span>{s.label}</span><span>{s.pct}%</span></div>
            <div className={styles.skillBar}>
              <div className={styles.skillFill} style={{ width: animate ? `${s.pct}%` : '0%', background: s.color }} />
            </div>
          </div>
        ))}
      </div>
      <div className={styles.btnRow}>
        <button className={styles.btnPrimary} onClick={() => onNavigate('devlab')}>VIEW PROJECTS ▶</button>
        <button className={styles.btnOutline} onClick={() => onNavigate('townhall')}>GET IN TOUCH</button>
      </div>
    </div>
  );
}

// ─── DEV LAB ──────────────────────────────────────────────────────────────────
type DevLabProject = {
  n: string;
  org: string;
  role: string;
  date: string;
  summary: string;
  highlights: string[];
  tags: string[];
  c: string;
};

const PROJECTS: DevLabProject[] = [
  {
    n: '01',
    org: 'Jeeves',
    role: 'Tech Intern — Strategy & Ops',
    date: 'Internship',
    summary: 'Built internal backend tooling and automation systems supporting global financial operations.',
    highlights: [
      'Reduced 10+ hours/week of manual reporting via reproducible Python (pandas) pipelines.',
      'Developed Go integrations improving financial data consistency and decision speed.',
      'Designed end-to-end HubSpot to n8n automation for document generation and delivery, eliminating manual sales workflows and enabling scalable client communication.',
    ],
    tags: ['Go', 'Python', 'Automation', 'Systems Integration', 'Workflow Orchestration'],
    c: 'var(--accent)',
  },
  {
    n: '02',
    org: 'Stone Co',
    role: 'Software Engineering Intern — Backend',
    date: 'Internship',
    summary: 'Built a production-grade Go service automating government-mandated financial reporting.',
    highlights: [
      'Replaced multi-day manual workflows with compliant reports generated in hours.',
      'Designed REST APIs and BigQuery ETL pipelines for high-volume transactional processing.',
      'Achieved 85%+ test coverage, implemented CI/CD with Argo, and improved observability with Datadog.',
    ],
    tags: ['Go', 'REST APIs', 'BigQuery', 'Clean Architecture', 'CI/CD', 'Observability'],
    c: 'var(--mint)',
  },
  {
    n: '03',
    org: 'Robotics — Human-Robot Interaction Research',
    role: 'Research Project',
    date: 'Academic Research',
    summary: 'Researched how protective behavioral adaptations affect the treatment of female-presenting robots in human-robot interactions.',
    highlights: [
      'Designed and implemented adaptive defensive behaviors for boundary-setting responses.',
      'Evaluated whether those responses reduced mistreatment in controlled interaction studies.',
      'Contributed to research on gender bias and ethical AI system design.',
    ],
    tags: ['Robotics', 'Behavioral Systems', 'Python', 'Experimental Design'],
    c: 'var(--lav)',
  },
  {
    n: '04',
    org: 'Smart Farming System',
    role: 'ML + IoT · NYAS',
    date: 'Applied ML Project',
    summary: 'Designed an end-to-end IoT and ML system for environmental optimization.',
    highlights: [
      'Built real-time sensor ingestion pipelines.',
      'Implemented regression models reducing nutrient runoff by 71%.',
    ],
    tags: ['Python', 'Machine Learning', 'IoT Systems', 'Data Modeling'],
    c: 'var(--gold)',
  },
  {
    n: '05',
    org: 'GWAS Research',
    role: 'Genomics + ML',
    date: 'Research',
    summary: 'Analyzed large-scale genomic datasets to identify disease severity associations.',
    highlights: [
      'Built ML models on high-dimensional biological data.',
      'Applied statistical validation for predictive reliability.',
    ],
    tags: ['Python', 'Data Science', 'ML', 'Statistical Modeling'],
    c: 'var(--accent)',
  },
];

function DevLabPage() {
  const cardRefs = useScrollReveal<HTMLElement>(PROJECTS.length, 0.1);

  return (
    <div>
      <p className={styles.tag}>// DEV LAB</p>
      <h1 className={styles.h1}>Engineering<br />Projects.</h1>
      <div className={styles.rule} />
      <p className={styles.lead}>Production backend, applied ML, and research systems with measurable outcomes.</p>
      <div className={`${styles.grid} ${styles.devLabGrid}`}>
        {PROJECTS.map((p, i) => (
          <article
            key={p.n}
            ref={el => { cardRefs.current[i] = el; }}
            className={`${styles.card} ${styles.devLabCard} ${styles.revealItem}`}
            style={{ '--bar': p.c, '--reveal-delay': `${i * 80}ms` } as React.CSSProperties}
          >
            <div className={styles.devLabCardTop}>
              <div className={styles.cardNum} style={{ color: p.c }}>{p.n}</div>
              <span className={styles.devLabDate}>{p.date}</span>
            </div>
            <div className={styles.cardTitle}>{p.org}</div>
            <div className={styles.devLabRole}>{p.role}</div>
            <div className={styles.cardBody}>{p.summary}</div>
            <ul className={styles.devLabHighlights}>
              {p.highlights.map((h) => <li key={h}>{h}</li>)}
            </ul>
            <div className={styles.tags}>{p.tags.map(t => <span key={t} className={styles.tag2}>{t}</span>)}</div>
          </article>
        ))}
      </div>
    </div>
  );
}

// ─── STUDIO ───────────────────────────────────────────────────────────────────
type StudioFrame = { label: string; src?: string; format?: 'default' | 'a4' | 'landscape' };
type ZoomFrame = { src: string; label: string; isPdf: boolean };

type StudioItem = {
  n: string;
  t: string;
  d: string;
  tags: string[];
  focus: string[];
  c: string;
  kind: 'carousel' | 'single';
  frameMode?: 'phone' | 'phone-sm' | 'wide' | 'meta';
  theme: 'terra' | 'mint' | 'violet' | 'paper';
  layout: 'left' | 'right';
  frames: StudioFrame[];
  extraSingle?: StudioFrame;
};

const PORTFOLIO_SECTIONS: StudioItem[] = [
  {
    n: '01',
    t: 'Endomarketing · Meta Consultoria',
    d: 'Instagram campaign sequence for internal marketing communication and brand consistency.',
    tags: ['Instagram', 'Endomarketing', 'Meta Consultoria', 'Canva'],
    focus: [
      'Clear narrative across all 5 carousel frames',
      'Consistent visual language for internal engagement',
    ],
    c: '#c8744a',
    kind: 'carousel',
    frameMode: 'meta',
    theme: 'terra',
    layout: 'left',
    frames: [
      { label: 'Frame 01', src: '/studio/01.png' },
      { label: 'Frame 02', src: '/studio/02.png' },
      { label: 'Frame 03', src: '/studio/03.png' },
      { label: 'Frame 04', src: '/studio/04.png' },
      { label: 'Frame 05', src: '/studio/05.png' },
    ],
    extraSingle: { label: 'T-shirt Design', src: '/studio/tshirt_img.JPG', format: 'landscape' },
  },
  {
    n: '02',
    t: 'Document Design · Brazil Conference',
    d: 'Document layout and visual communication pieces for Brazil Conference initiatives.',
    tags: ['Canva', 'Figma (5+ years)', 'Document Design', 'AI4GOOD'],
    focus: [
      'Professional formatting for stakeholder-ready communication',
      'Improved readability through spacing, contrast, and structure',
    ],
    c: '#c8744a',
    kind: 'single',
    frameMode: 'phone',
    theme: 'paper',
    layout: 'right',
    frames: [{ label: 'Cartilha do Projetista - AI4GOOD', src: '/studio/Cartilha-do-Projetista-AI4GOOD.pdf', format: 'a4' }],
  },
  {
    n: '03',
    t: 'App Design for Innovation Challenge',
    d: '5-frame app flow carousel: onboarding, dashboard, learning, quiz, and ranking screens.',
    tags: ['Figma (5+ years)', 'UI/UX', 'App Flow Carousel'],
    focus: [
      'Mobile-first flow from first touch to retention loop',
      'Readable hierarchy and gamified feedback patterns',
    ],
    c: 'var(--lav)',
    kind: 'carousel',
    frameMode: 'phone-sm',
    theme: 'violet',
    layout: 'right',
    frames: [
      { label: 'Onboarding', src: '/studio/app1-01.png' },
      { label: 'Dashboard', src: '/studio/app1-02.png' },
      { label: 'Study Home', src: '/studio/app1-03.png' },
      { label: 'Quiz Screen', src: '/studio/app1-04.png' },
      { label: 'Ranking Screen', src: '/studio/app1-05.png' },
    ],
    extraSingle: { label: 'App Design Documentation', src: '/studio/projectsaber.pdf', format: 'a4' },
  },
  {
    n: '04',
    t: 'Explaining Code',
    d: 'I use design to explain complex topics from my previous projects to different audiences, making technical decisions easier to understand.',
    tags: ['Explainable Tech', 'Code Explainers', 'Carousel'],
    focus: [
      'Translate technical choices into clear visual storytelling',
      'Adapt explanations for technical and non-technical audiences',
    ],
    c: 'var(--accent)',
    kind: 'carousel',
    frameMode: 'wide',
    theme: 'mint',
    layout: 'left',
    frames: [
      { label: 'Explainer 13', src: '/studio/13.png' },
      { label: 'Explainer 14', src: '/studio/14.png' },
      { label: 'Explainer 15', src: '/studio/15.png' },
      { label: 'Explainer 16', src: '/studio/16.png' },
    ],
  },
  {
    n: '05',
    t: 'Document Design · Meta Consultoria',
    d: 'Editorial layout for the Academia de Inovacao edital, with structured sections and clear visual hierarchy for applications and program communication.',
    tags: ['Document Design', 'Meta Consultoria', 'Canva', 'Editorial Layout'],
    focus: [
      'Organized long-form content into scan-friendly sections',
      'Balanced typography, spacing, and contrast for readability',
    ],
    c: '#c8744a',
    kind: 'single',
    frameMode: 'phone',
    theme: 'paper',
    layout: 'left',
    frames: [{ label: 'Academia de Inovacao Edital', src: '/studio/Edital-da-Academia-de-Inovacao.pdf', format: 'a4' }],
  },
];

function StudioPage() {
  const [zoomFrame, setZoomFrame] = useState<ZoomFrame | null>(null);
  const sectionRefs = useScrollReveal<HTMLElement>(PORTFOLIO_SECTIONS.length, 0.08);
  const openZoom = (frame?: StudioFrame) => {
    if (!frame?.src) return;
    setZoomFrame({
      src: frame.src,
      label: frame.label,
      isPdf: frame.src.toLowerCase().endsWith('.pdf'),
    });
  };

  return (
    <div>
      <p className={styles.tag} style={{ color: '#c8744a' }}>// CREATIVE STUDIO</p>
      <h1 className={`${styles.h1} ${styles.italic}`}>Portfolio<br />Gallery.</h1>
      <div className={styles.rule} style={{ background: '#c8744a' }} />
      <p className={styles.lead}>
        Scroll through design work with click-controlled carousels.
        Proficient in Canva and 5+ years of experience with Figma, plus documentation and slide design workflows.
      </p>
      <div className={styles.portfolioFlow}>
        {PORTFOLIO_SECTIONS.map((p, i) => (
          <section
            key={p.n}
            ref={el => { sectionRefs.current[i] = el; }}
            className={[
              styles.designStrip,
              p.layout === 'right' ? styles.designStripAlt : '',
              p.frameMode === 'wide' ? styles.designStripWide : '',
              p.frameMode === 'meta' ? styles.designStripMeta : '',
              styles[`theme_${p.theme}`],
              styles.revealItem,
            ].filter(Boolean).join(' ')}
            style={{ '--reveal-delay': `${i * 90}ms` } as React.CSSProperties}
          >
            <div className={`${styles.designMeta} ${['01', '05'].includes(p.n) ? styles.metaDocBlue : ''}`}>
              <div className={styles.cardNum} style={{ color: p.c }}>{p.n}</div>
              <div className={styles.cardTitle}>{p.t}</div>
              <div className={styles.cardBody}>{p.d}</div>
              <ul className={styles.focusList}>
                {p.focus.map((f) => <li key={f}>{f}</li>)}
              </ul>
              {p.extraSingle && (
                <div
                  className={[
                    styles.inlineShowcase,
                    p.extraSingle.format === 'a4' ? styles.inlineShowcaseA4 : '',
                    p.extraSingle.format === 'landscape' ? styles.inlineShowcaseLandscape : '',
                  ].filter(Boolean).join(' ')}
                >
                  <StudioSingle frame={p.extraSingle} onZoom={openZoom} />
                </div>
              )}
              <div className={styles.tags}>{p.tags.map(t => <span key={t} className={styles.tag2}>{t}</span>)}</div>
            </div>
            {p.kind === 'carousel'
              ? <StudioCarousel frames={p.frames} frameMode={p.frameMode ?? 'phone'} onZoom={openZoom} />
              : (
                <div className={`${styles.singleShowcase} ${p.frames[0]?.format === 'a4' ? styles.singleShowcaseA4 : ''}`}>
                  <StudioSingle frame={p.frames[0]} onZoom={openZoom} />
                </div>
              )}
          </section>
        ))}
      </div>
      {zoomFrame && (
        <div className={styles.zoomOverlay} onClick={() => setZoomFrame(null)}>
          <button className={styles.zoomClose} onClick={() => setZoomFrame(null)} aria-label="Close zoom">
            ✕
          </button>
          <div className={styles.zoomDialog} onClick={(e) => e.stopPropagation()}>
            {zoomFrame.isPdf ? (
              <iframe src={zoomFrame.src} title={zoomFrame.label} className={styles.zoomDocFrame} />
            ) : (
              <img src={zoomFrame.src} alt={zoomFrame.label} className={styles.zoomImg} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StudioCarousel({
  frames,
  frameMode,
  onZoom,
}: {
  frames: StudioFrame[];
  frameMode: 'phone' | 'phone-sm' | 'wide' | 'meta';
  onZoom: (frame?: StudioFrame) => void;
}) {
  const [failed, setFailed] = useState<boolean[]>(() => frames.map(() => false));
  const [index, setIndex] = useState(0);
  const [incomingIndex, setIncomingIndex] = useState<number | null>(null);
  const [transitionDir, setTransitionDir] = useState<1 | -1>(1);
  const animTimerRef = useRef<number | null>(null);
  const transitionMs = 460;
  const isMeta = frameMode === 'meta';

  useEffect(() => {
    setFailed(frames.map(() => false));
    setIndex(0);
    setIncomingIndex(null);
  }, [frames]);

  useEffect(() => {
    return () => {
      if (animTimerRef.current !== null) {
        window.clearTimeout(animTimerRef.current);
      }
    };
  }, []);

  const goTo = (target: number, dir: 1 | -1) => {
    if (target === index) return;
    if (!isMeta) {
      setIndex(target);
      return;
    }
    if (incomingIndex !== null) return;
    setTransitionDir(dir);
    setIncomingIndex(target);
    if (animTimerRef.current !== null) {
      window.clearTimeout(animTimerRef.current);
    }
    animTimerRef.current = window.setTimeout(() => {
      setIndex(target);
      setIncomingIndex(null);
    }, transitionMs);
  };

  const prev = () => goTo((index - 1 + frames.length) % frames.length, -1);
  const next = () => goTo((index + 1) % frames.length, 1);
  const frame = frames[index];
  const frameIn = incomingIndex !== null ? frames[incomingIndex] : undefined;
  const visibleIndex = incomingIndex ?? index;

  const renderFrameContent = (targetFrame: StudioFrame, frameIdx: number) => (
    <>
      <span className={styles.carouselDecorA} />
      <span className={styles.carouselDecorB} />
      <span className={styles.popBadge}>LIVE</span>
      <span className={styles.popCard}>{targetFrame.label}</span>
      {targetFrame.src && !failed[frameIdx] ? (
        <img
          src={targetFrame.src}
          alt={targetFrame.label}
          className={`${styles.carouselImg} ${styles.zoomableFrame}`}
          onError={() =>
            setFailed((f) => {
              const nextFailed = [...f];
              nextFailed[frameIdx] = true;
              return nextFailed;
            })
          }
        />
      ) : (
        targetFrame.label
      )}
      {targetFrame.src && (
        <button
          type="button"
          className={styles.zoomHitArea}
          onClick={() => onZoom(targetFrame)}
          aria-label={`Zoom ${targetFrame.label}`}
        />
      )}
    </>
  );

  return (
    <div className={styles.manualCarousel}>
      <button className={styles.carouselBtn} onClick={prev} aria-label="Previous frame">
        <span className={styles.chevronLeft} />
      </button>
      <div
        className={[
          styles.carouselViewport,
          frameMode === 'wide' ? styles.carouselViewportWide : '',
          frameMode === 'phone-sm' ? styles.carouselViewportPhoneSm : '',
          frameMode === 'meta' ? styles.carouselViewportMeta : '',
        ].filter(Boolean).join(' ')}
      >
        {isMeta ? (
          <div className={styles.metaSwipeStack}>
            <div
              className={[
                styles.carouselFrame,
                styles.metaPane,
                frameIn ? (transitionDir === 1 ? styles.metaPaneExitLeft : styles.metaPaneExitRight) : '',
              ].filter(Boolean).join(' ')}
            >
              {renderFrameContent(frame, index)}
            </div>
            {frameIn && incomingIndex !== null && (
              <div
                className={[
                  styles.carouselFrame,
                  styles.metaPane,
                  transitionDir === 1 ? styles.metaPaneEnterRight : styles.metaPaneEnterLeft,
                ].filter(Boolean).join(' ')}
              >
                {renderFrameContent(frameIn, incomingIndex)}
              </div>
            )}
          </div>
        ) : (
          <div className={styles.carouselFrame}>
            {renderFrameContent(frame, index)}
          </div>
        )}
      </div>
      <button className={styles.carouselBtn} onClick={next} aria-label="Next frame">
        <span className={styles.chevronRight} />
      </button>
      <div className={styles.carouselCount}>{visibleIndex + 1} / {frames.length}</div>
      <div className={styles.thumbRail}>
        {frames.map((f, i) => (
          <button
            key={`${f.label}-${i}`}
            className={`${styles.thumbBtn} ${i === visibleIndex ? styles.thumbBtnActive : ''}`}
            onClick={() => goTo(i, i > index ? 1 : -1)}
            aria-label={`Go to frame ${i + 1}`}
          >
            {f.src ? <img src={f.src} alt={f.label} className={styles.thumbImg} /> : <span className={styles.thumbIndex}>{i + 1}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function StudioSingle({ frame, onZoom }: { frame?: StudioFrame; onZoom: (frame?: StudioFrame) => void }) {
  const [failed, setFailed] = useState(false);
  if (!frame) return null;
  const isPdf = Boolean(frame.src && frame.src.toLowerCase().endsWith('.pdf'));

  return (
    <div className={styles.singleShowcaseInner}>
      <span className={styles.popBadge}>FEATURED</span>
      <span className={styles.popCard}>{frame.label}</span>
      {frame.src && !failed ? (
        isPdf ? (
          <iframe
            src={frame.src}
            title={frame.label}
            className={`${styles.docFrame} ${styles.zoomableFrame}`}
            onError={() => setFailed(true)}
          />
        ) : (
          <img
            src={frame.src}
            alt={frame.label}
            className={`${styles.carouselImg} ${styles.zoomableFrame}`}
            onError={() => setFailed(true)}
          />
        )
      ) : (
        frame.label
      )}
      {frame.src && !isPdf && (
        <button
          type="button"
          className={styles.zoomHitArea}
          onClick={() => onZoom(frame)}
          aria-label={`Zoom ${frame.label}`}
        />
      )}
      {frame.src && isPdf && (
        <button
          type="button"
          className={styles.cornerChip}
          onClick={() => onZoom(frame)}
          aria-label={`Zoom ${frame.label}`}
        >
          OPEN ↗
        </button>
      )}
    </div>
  );
}

// ─── INNOVATION ───────────────────────────────────────────────────────────────
type InnovationItem = {
  n: string;
  org: string;
  role: string;
  date: string;
  summary: string;
  highlights: string[];
  tags: string[];
  c: string;
  resource?: {
    label: string;
    href: string;
  };
};

const INNOVATION_PROJECTS: InnovationItem[] = [
  {
    n: '01',
    org: 'Meta Consultoria (Junior Enterprise)',
    role: 'Innovation Manager',
    date: '2023-2024',
    summary: 'Led strategic expansion into renewable energy and startup consulting, driving measurable revenue growth and organizational transformation.',
    highlights: [
      'Positioned photovoltaic consulting services, contributing to 21%+ of total annual revenue.',
      'Built and scaled the company\'s first startup-focused consulting vertical; trained and led a team of 3 analysts.',
      'Revitalized innovation culture through structured internal programming, increasing engagement to 35+ active members weekly.',
    ],
    tags: ['Innovation Strategy', 'Renewable Energy', 'Startup Consulting', 'Team Leadership'],
    c: 'var(--gold)',
    resource: {
      label: 'View Academia de Inovacao Edital',
      href: '/studio/Edital-da-Academia-de-Inovacao.pdf',
    },
  },
  {
    n: '02',
    org: 'Brazil Conference at Harvard & MIT',
    role: 'Vice President',
    date: 'Leadership',
    summary: 'Lead social impact and technology programs at Brazil\'s largest student-led international conference.',
    highlights: [
      'Scaled AI4Good, a 5-week AI mentorship program focused on climate disaster solutions.',
      'Oversee operations and logistics across 6 national initiatives, engaging thousands of participants.',
      'Enable top founders and researchers to present on an international stage.',
    ],
    tags: ['AI4Good', 'Operations', 'Mentorship', 'Tech for Social Impact'],
    c: 'var(--mint)',
  },
  {
    n: '03',
    org: 'THEIA International',
    role: 'Youth for Circular Future',
    date: '2021-2023',
    summary: 'Contributed to global sustainability initiatives under a UNESCO Best Practice partner.',
    highlights: [
      'Collaborated with circular economy leaders to launch environmental awareness campaigns.',
      'Co-led Action for Happy Kids, impacting youth across multiple continents through empowerment programs.',
    ],
    tags: ['Circular Economy', 'Sustainability', 'Global Programs', 'Youth Empowerment'],
    c: 'var(--lav)',
  },
];

const INNOVATION_AWARDS = [
  'Selected as 1 of 20 scholars (1,000+ applicants) for a fully funded Brazil at Silicon Valley program - Fundacao Estudar',
  'Gold Medal - National Science Olympiad',
  'Gold Medal - Brazilian Astronomy & Astrophysics Olympiad',
  '3rd Place - Brazilian Innovation Marathon (Young Scientists Fair)',
];

function InnovationPage() {
  const cardRefs = useScrollReveal<HTMLElement>(INNOVATION_PROJECTS.length, 0.08);
  const awardRefs = useScrollReveal<HTMLElement>(INNOVATION_AWARDS.length, 0.05);

  return (
    <div>
      <p className={`${styles.tag} ${styles.tagGold}`}>// INNOVATION CENTER</p>
      <h1 className={`${styles.h1} ${styles.h1Light}`}>Leadership &<br />Impact.</h1>
      <div className={`${styles.rule} ${styles.ruleGold}`} />
      <p className={`${styles.lead} ${styles.leadLight}`}>Programs, operations, and innovation initiatives with measurable outcomes at scale.</p>
      <div className={`${styles.grid} ${styles.innovationGrid}`}>
        {INNOVATION_PROJECTS.map((p, i) => (
          <article
            key={p.n}
            ref={el => { cardRefs.current[i] = el; }}
            className={`${styles.card} ${styles.cardDark} ${styles.innovationCard} ${styles.revealItem}`}
            style={{ '--bar': p.c, '--reveal-delay': `${i * 100}ms` } as React.CSSProperties}
          >
            <div className={styles.innovationCardTop}>
              <div className={styles.cardNum} style={{ color: p.c }}>{p.n}</div>
              <span className={styles.innovationDate}>{p.date}</span>
            </div>
            <div className={`${styles.cardTitle} ${styles.cardTitleLight}`}>{p.org}</div>
            <div className={styles.innovationRole}>{p.role}</div>
            <div className={`${styles.cardBody} ${styles.cardBodyLight}`}>{p.summary}</div>
            <ul className={styles.innovationHighlights}>
              {p.highlights.map((h) => <li key={h}>{h}</li>)}
            </ul>
            <div className={styles.tags}>{p.tags.map((t) => <span key={t} className={`${styles.tag2} ${styles.tag2Dark}`}>{t}</span>)}</div>
            {p.resource && (
              <a
                href={p.resource.href}
                target="_blank"
                rel="noreferrer"
                className={styles.innovationResource}
              >
                {p.resource.label} ↗
              </a>
            )}
          </article>
        ))}
      </div>
      <section className={styles.awardsSection}>
        <div className={styles.awardsTitleRow}>
          <h2 className={styles.awardsTitle}>Awards</h2>
          <span className={styles.awardsRule} />
        </div>
        <div className={styles.awardsGrid}>
          {INNOVATION_AWARDS.map((award, idx) => (
            <article
              key={award}
              ref={(el) => { awardRefs.current[idx] = el; }}
              className={`${styles.awardCard} ${styles.revealItem}`}
              style={{ '--reveal-delay': `${idx * 70}ms` } as React.CSSProperties}
            >
              <span className={styles.awardBadge}>#{idx + 1}</span>
              <p>{award}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── LIBRARY ──────────────────────────────────────────────────────────────────
function LibraryPage() {
  const exp = [
    { role: 'Tech Intern · Strategic & Operations · Jeeves', date: 'Sep 2025 – Present', desc: 'Oversaw financial operations data with Python and automation; built tracking and integration workflows to improve speed and transparency.', color: 'var(--accent)' },
    { role: 'Software Engineering Intern · Backend · Stone Co', date: 'May 2025 – Aug 2025', desc: 'Built Go Cronjob + REST APIs for reporting automation, developed BigQuery pipelines, and improved reliability/observability.', color: 'var(--mint)' },
    { role: 'B.S. Computer Engineering · University of South Florida', date: 'Expected 2028', desc: 'GPA 3.9 · Judy Genshaft Honors College.', color: 'var(--gold)' },
  ];
  const itemRefs = useScrollReveal<HTMLDivElement>(exp.length, 0.12);
  return (
    <div>
      <p className={styles.tag}>// LIBRARY</p>
      <h1 className={styles.h1}>Resume &<br />Research.</h1>
      <div className={styles.rule} />
      <p className={styles.lead}>Experience, education, projects, leadership, and technical skills from my resume.</p>
      <div className={styles.timeline}>
        {exp.map((e, i) => (
          <div
            key={e.role}
            ref={(el) => { itemRefs.current[i] = el; }}
            className={`${styles.tlItem} ${styles.revealItem}`}
            style={{ borderColor: e.color, '--reveal-delay': `${i * 90}ms` } as React.CSSProperties}
          >
            <div className={styles.tlRole}>{e.role}</div>
            <div className={styles.tlDate}>{e.date}</div>
            <div className={styles.tlDesc}>{e.desc}</div>
          </div>
        ))}
      </div>
      <div className={styles.btnRow} style={{ marginTop: 32 }}>
        <button className={styles.btnPrimary} onClick={() => window.open('/Mariah_Barreto_Resume.pdf', '_blank')}>📄 DOWNLOAD PDF</button>
      </div>
    </div>
  );
}

// ─── TOWN HALL ────────────────────────────────────────────────────────────────
function TownHallPage() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 900);
  };

  return (
    <div>
      <p className={styles.tag}>// TOWN HALL</p>
      <h1 className={styles.h1}>Let's<br />Connect.</h1>
      <div className={styles.rule} />
      <p className={styles.lead}>Tampa, FL · Open to internships, backend engineering, and data-focused opportunities.</p>
      {sent ? (
        <div className={styles.successState}>
          <span className={styles.successIcon}>✓</span>
          <p className={styles.successMsg}>Message sent! I'll get back to you soon.</p>
        </div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit}>
          <input type="text"  placeholder="Your name" required />
          <input type="email" placeholder="Email address" required />
          <input type="text"  placeholder="Company / Role (optional)" />
          <textarea rows={4}  placeholder="What's on your mind?" required />
          <button type="submit" className={styles.btnPrimary} disabled={sending}>
            {sending ? 'SENDING…' : 'SEND MESSAGE ▶'}
          </button>
        </form>
      )}
      <div className={styles.socialRow}>
        <a href="mailto:mariahrangelbarreto@gmail.com" className={styles.socialLink}>mariahrangelbarreto@gmail.com ↗</a>
        <a href="https://www.linkedin.com/in/mariah-barreto-7a5706215/" target="_blank" rel="noreferrer" className={styles.socialLink}>linkedin.com/in/mariah-barreto-7a5706215 ↗</a>
      </div>
    </div>
  );
}
