import { useEffect } from 'react';
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
    { label: 'Backend Engineering',    pct: 90, color: 'var(--accent)' },
    { label: 'Frontend & Design',       pct: 80, color: 'var(--mint)' },
    { label: 'Systems Architecture',    pct: 85, color: 'var(--lav)' },
    { label: 'DevOps / Infrastructure', pct: 75, color: 'var(--gold)' },
  ];
  return (
    <div>
      <p className={styles.tag}>// ABOUT ME</p>
      <h1 className={styles.h1}>Hello,<br />I'm <em>Mariah.</em></h1>
      <div className={styles.rule} />
      <p className={styles.lead}>
        I'm a full-stack engineer who builds things that work beautifully and scale gracefully.
        I care about the intersection of engineering rigor and human experience.
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
  { n:'01', t:'Project Nexus',  d:'High-throughput event streaming — 2M events/day, sub-10ms p99.',           tags:['Go','Kafka','PostgreSQL'], c:'var(--accent)' },
  { n:'02', t:'DevKit CLI',     d:'Open-source developer toolkit. 1.2k ★. Scaffolds, secrets, deploys.',      tags:['Go','Cobra','Docker'],     c:'var(--mint)'   },
  { n:'03', t:'Atlas API',      d:'RESTful platform powering 3 consumer apps. Clean architecture.',            tags:['Go','Gin','PostgreSQL'],   c:'var(--lav)'    },
  { n:'04', t:'Synapse ML',     d:'Feature store and model serving layer for production data pipelines.',      tags:['Python','FastAPI','MLflow'], c:'var(--gold)' },
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
const DESIGNS = [
  { n:'01', t:'Valley OS',        d:'Design system for developer tools. Tokens, components, full docs.',      tags:['Figma','Design Tokens','Storybook'], c:'#c8744a' },
  { n:'02', t:'Brand Identity',   d:'Full brand work for a seed-stage startup — logo through motion.',        tags:['Figma','After Effects'],             c:'var(--lav)' },
  { n:'03', t:'Data Dashboards',  d:'Analytics interfaces that make dense data legible and beautiful.',       tags:['Figma','D3.js','Prototyping'],       c:'var(--mint)' },
];

function StudioPage() {
  return (
    <div>
      <p className={styles.tag} style={{ color: '#c8744a' }}>// CREATIVE STUDIO</p>
      <h1 className={`${styles.h1} ${styles.italic}`}>Design<br />Work.</h1>
      <div className={styles.rule} style={{ background: '#c8744a' }} />
      <p className={styles.lead}>The other half of the equation. I design what I build.</p>
      <div className={styles.grid}>
        {DESIGNS.map(p => (
          <div key={p.n} className={`${styles.card} ${styles.cardDesign}`} style={{ '--bar': p.c } as React.CSSProperties}>
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

// ─── INNOVATION ───────────────────────────────────────────────────────────────
const STARTUPS = [
  { n:'01', t:'Consulting Practice', d:'Built and operated a boutique tech consulting practice — 12 clients, full lifecycle.', tags:['Entrepreneurship','Product','Go-to-Market'], c:'var(--gold)' },
  { n:'02', t:'Open Source',         d:'Maintainer of 3 OSS projects with 2k+ combined GitHub stars, active communities.',     tags:['Community','Go','Python'],                   c:'var(--mint)' },
  { n:'03', t:'Impact Initiative',   d:'Led team building tools for underserved communities. 500+ users in 3 months.',         tags:['Social Impact','React','Go'],                c:'var(--lav)' },
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
    { role: 'Senior Software Engineer · Acme Corp', date: '2022 – PRESENT', desc: 'Core platform engineering. Led team of 4. Reduced p99 latency by 40%.', color: 'var(--accent)' },
    { role: 'Software Engineer · Velocity Startup', date: '2020 – 2022',   desc: 'Shipped 40+ features to 50k users. Rebuilt API from monolith to services.', color: 'var(--mint)' },
    { role: 'SWE Intern · Big Tech Co',             date: '2019',           desc: 'Internal tooling used by 200+ engineers. Return offer extended.', color: 'var(--lav)' },
    { role: 'B.S. Computer Science · State University', date: '2016 – 2020', desc: 'Capstone: distributed key-value store in Go.', color: 'var(--gold)' },
  ];
  return (
    <div>
      <p className={styles.tag}>// LIBRARY</p>
      <h1 className={styles.h1}>Resume &<br />Research.</h1>
      <div className={styles.rule} />
      <p className={styles.lead}>The formal record — experience, education, proof of work.</p>
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
        <button className={styles.btnPrimary} onClick={() => alert('PDF coming soon!')}>📄 DOWNLOAD PDF</button>
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
      <p className={styles.lead}>Happy to talk about interesting problems, collaborations, or cool things being built.</p>
      <form className={styles.form} onSubmit={e => { e.preventDefault(); alert('Message sent! (demo)'); }}>
        <input type="text"  placeholder="Your name" required />
        <input type="email" placeholder="Email address" required />
        <input type="text"  placeholder="Company / Role (optional)" />
        <textarea rows={4}  placeholder="What's on your mind?" required />
        <button type="submit" className={styles.btnPrimary}>SEND MESSAGE ▶</button>
      </form>
      <div className={styles.socialRow}>
        {['GitHub', 'LinkedIn', 'Twitter'].map(s => (
          <a key={s} href="#" className={styles.socialLink}>{s} ↗</a>
        ))}
      </div>
    </div>
  );
}
