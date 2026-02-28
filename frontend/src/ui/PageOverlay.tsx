import { useEffect, useRef, useState } from 'react';
import type { PageKey, PageSource } from '../App';
import styles from './PageOverlay.module.css';

const PAGE_ORDER: PageKey[] = ['home', 'devlab', 'studio', 'innovation', 'library', 'townhall'];
const PAGE_LABELS: Record<NonNullable<PageKey>, string> = {
  home: '🏠 About', devlab: '💻 Projects', studio: '🎨 Design',
  innovation: '🌱 Startups', library: '📜 Resume', townhall: '📬 Contact',
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

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={`${styles.overlay} ${styles[type]}`}>
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
          </div>
        </div>

        {/* Page content */}
        <PageContent pageKey={pageKey} isDark={isDark} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

// ─── Individual page content ─────────────────────────────────────────────────

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
  const skills = [
    { label: 'Go / Python / SQL',             pct: 92, color: 'var(--accent)' },
    { label: 'Data & Automation Workflows',   pct: 90, color: 'var(--mint)' },
    { label: 'Backend System Design',         pct: 86, color: 'var(--lav)' },
    { label: 'Cloud / CI-CD / Observability', pct: 82, color: 'var(--gold)' },
  ];
  return (
    <div>
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
              <div className={styles.skillFill} style={{ width: `${s.pct}%`, background: s.color }} />
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
const PROJECTS = [
  { n:'01', t:'Jeeves Internship', d:'Developed Go-based integrations and automation workflows, saving 10+ hours/week and supporting faster strategic decisions.', tags:['Go','Python','Google Colab'], c:'var(--accent)' },
  { n:'02', t:'Stone Co Internship', d:'Built a Go-based Cronjob with REST APIs to automate government financial reports and cut delivery time from days to hours.', tags:['Go','REST APIs','BigQuery'], c:'var(--mint)'   },
  { n:'03', t:'Genetic Variants Research', d:'Performed Python-based analysis for GWAS and predicted links between genetic variants and disease severity.', tags:['Python','Data Analysis','Research'], c:'var(--lav)'    },
  { n:'04', t:'Smart Farming System', d:'Built an IoT + ML system and reduced nutrient runoff by 71% with predictive analytics.', tags:['Machine Learning','IoT','Python'], c:'var(--gold)' },
];

function DevLabPage() {
  return (
    <div>
      <p className={styles.tag}>// DEV LAB</p>
      <h1 className={styles.h1}>Engineering<br />Projects.</h1>
      <div className={styles.rule} />
      <p className={styles.lead}>Real systems. Real users. Real impact.</p>
      <div className={styles.grid}>
        {PROJECTS.map(p => (
          <div key={p.n} className={styles.card} style={{ '--bar': p.c } as React.CSSProperties}>
            <div className={styles.cardNum} style={{ color: p.c }}>{p.n}</div>
            <div className={styles.cardTitle}>{p.t}</div>
            <div className={styles.cardBody}>{p.d}</div>
            <div className={styles.tags}>{p.tags.map(t => <span key={t} className={styles.tag2}>{t}</span>)}</div>
          </div>
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
    t: 'App Design 1',
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
    n: '03',
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
      { label: 'Explainer 17', src: '/studio/17.png' },
    ],
  },
  {
    n: '04',
    t: 'Document Design · Brazil Conference',
    d: 'Document layout and visual communication pieces for Brazil Conference initiatives.',
    tags: ['Canva', 'Figma (5+ years)', 'Document Design'],
    focus: [
      'Professional formatting for stakeholder-ready communication',
      'Improved readability through spacing, contrast, and structure',
    ],
    c: '#c8744a',
    kind: 'single',
    frameMode: 'phone',
    theme: 'paper',
    layout: 'right',
    frames: [{ label: 'Brazil Conference Document' }],
  },
];

function StudioPage() {
  const [zoomFrame, setZoomFrame] = useState<ZoomFrame | null>(null);
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
        {PORTFOLIO_SECTIONS.map((p) => (
          <section
            key={p.n}
            className={[
              styles.designStrip,
              p.layout === 'right' ? styles.designStripAlt : '',
              p.frameMode === 'wide' ? styles.designStripWide : '',
              p.frameMode === 'meta' ? styles.designStripMeta : '',
              styles[`theme_${p.theme}`],
            ].filter(Boolean).join(' ')}
          >
            <div className={styles.designMeta}>
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
                <div className={styles.singleShowcase}>
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
      {frame.src && (
        <button
          type="button"
          className={styles.zoomHitArea}
          onClick={() => onZoom(frame)}
          aria-label={`Zoom ${frame.label}`}
        />
      )}
    </div>
  );
}

// ─── INNOVATION ───────────────────────────────────────────────────────────────
const STARTUPS = [
  { n:'01', t:'Vice President · Brazil Conference', d:'Led social impact programs, including AI4Good, a 5-week mentorship supporting AI solutions for climate and disaster management.', tags:['Leadership','AI4Good','Programs'], c:'var(--gold)' },
  { n:'02', t:'Operations Leadership', d:'Oversaw program logistics and operations across initiatives, engaging thousands of participants nationwide.', tags:['Operations','Execution','Scale'], c:'var(--mint)' },
  { n:'03', t:'Student-Led Impact', d:'Enabled top participants to present at Brazil’s largest student-led international conference.', tags:['Community','Public Service','Education'], c:'var(--lav)' },
];

function InnovationPage() {
  return (
    <div>
      <p className={`${styles.tag} ${styles.tagGold}`}>// INNOVATION CENTER</p>
      <h1 className={`${styles.h1} ${styles.h1Light}`}>Startup &<br />Impact.</h1>
      <div className={`${styles.rule} ${styles.ruleGold}`} />
      <p className={`${styles.lead} ${styles.leadLight}`}>Ideas turned into real things. Some shipped. All worth building.</p>
      <div className={styles.grid}>
        {STARTUPS.map(p => (
          <div key={p.n} className={`${styles.card} ${styles.cardDark}`} style={{ '--bar': p.c } as React.CSSProperties}>
            <div className={styles.cardNum} style={{ color: p.c }}>{p.n}</div>
            <div className={`${styles.cardTitle} ${styles.cardTitleLight}`}>{p.t}</div>
            <div className={`${styles.cardBody} ${styles.cardBodyLight}`}>{p.d}</div>
            <div className={styles.tags}>{p.tags.map(t => <span key={t} className={`${styles.tag2} ${styles.tag2Dark}`}>{t}</span>)}</div>
          </div>
        ))}
      </div>
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
  return (
    <div>
      <p className={styles.tag}>// LIBRARY</p>
      <h1 className={styles.h1}>Resume &<br />Research.</h1>
      <div className={styles.rule} />
      <p className={styles.lead}>Experience, education, projects, leadership, and technical skills from my resume.</p>
      <div className={styles.timeline}>
        {exp.map(e => (
          <div key={e.role} className={styles.tlItem} style={{ borderColor: e.color }}>
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
  return (
    <div>
      <p className={styles.tag}>// TOWN HALL</p>
      <h1 className={styles.h1}>Let's<br />Connect.</h1>
      <div className={styles.rule} />
      <p className={styles.lead}>Tampa, FL · Open to internships, backend engineering, and data-focused opportunities.</p>
      <form className={styles.form} onSubmit={e => { e.preventDefault(); alert('Message sent! (demo)'); }}>
        <input type="text"  placeholder="Your name" required />
        <input type="email" placeholder="Email address" required />
        <input type="text"  placeholder="Company / Role (optional)" />
        <textarea rows={4}  placeholder="What's on your mind?" required />
        <button type="submit" className={styles.btnPrimary}>SEND MESSAGE ▶</button>
      </form>
      <div className={styles.socialRow}>
        <a href="mailto:mariahrangelbarreto@gmail.com" className={styles.socialLink}>mariahrangelbarreto@gmail.com ↗</a>
        <a href="https://linkedin.com/mariahbarreto" target="_blank" rel="noreferrer" className={styles.socialLink}>linkedin.com/mariahbarreto ↗</a>
        <a href="tel:+16562126623" className={styles.socialLink}>+1 (656) 212-6623 ↗</a>
      </div>
    </div>
  );
}
