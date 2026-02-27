import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { NiteroiScene } from '../scenes/NiteroiScene';
import type { PageKey } from '../App';
import styles from './Landing.module.css';

interface Props {
  onEnterGame: () => void;
  onOpenPage: (key: PageKey) => void;
}

type Mode = 'game' | 'pro';

export function Landing({ onEnterGame, onOpenPage }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef      = useRef<Phaser.Game | null>(null);
  const [mode, setMode] = useState<Mode>('game');

  // Boot Phaser scene (Niterói background)
  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      backgroundColor: '#0a0818',
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: window.innerWidth,
        height: window.innerHeight,
      },
      scene: [NiteroiScene],
    });

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  const NAV_ITEMS: { key: PageKey; label: string; icon: string }[] = [
    { key: 'home',       label: 'About',    icon: '🏠' },
    { key: 'devlab',     label: 'Projects', icon: '💻' },
    { key: 'studio',     label: 'Design',   icon: '🎨' },
    { key: 'innovation', label: 'Startups', icon: '🌱' },
    { key: 'library',    label: 'Resume',   icon: '📜' },
    { key: 'townhall',   label: 'Contact',  icon: '📬' },
  ];

  return (
    <div className={styles.root}>
      {/* Phaser canvas */}
      <div ref={containerRef} className={styles.canvas} />

      {/* Scanline overlay */}
      <div className={styles.scanlines} />

      {/* UI overlay */}
      <div className={styles.ui}>
        <p className={styles.eyebrow}>A PORTFOLIO EXPERIENCE</p>
        <h1 className={styles.title}>MARIAH<br />VALLEY</h1>
        <p className={styles.sub}>FULL-STACK ENGINEER &nbsp;·&nbsp; V3.0</p>

        {/* Mode selector */}
        <div className={styles.modeRow}>
          <button
            className={`${styles.modeBtn} ${mode === 'game' ? styles.modeBtnGame : ''}`}
            onClick={() => setMode('game')}
          >
            🎮 &nbsp;GAME MODE
          </button>
          <button
            className={`${styles.modeBtn} ${mode === 'pro' ? styles.modeBtnPro : ''}`}
            onClick={() => setMode('pro')}
          >
            📋 &nbsp;PROFESSIONAL
          </button>
        </div>

        {/* Pro nav links */}
        <div className={`${styles.proNav} ${mode === 'pro' ? styles.proNavVisible : ''}`}>
          {NAV_ITEMS.map(({ key, label, icon }) => (
            <button
              key={key}
              className={styles.proLink}
              onClick={() => onOpenPage(key)}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* CTA */}
        {mode === 'game' ? (
          <button className={styles.ctaGame} onClick={onEnterGame}>
            ▶ &nbsp;ENTER WORLD
          </button>
        ) : (
          <button className={styles.ctaPro} onClick={() => onOpenPage('home')}>
            → &nbsp;VIEW ABOUT ME
          </button>
        )}
      </div>

      <div className={styles.version}>MARIAH VALLEY · V3.0 · 2025</div>
      <div className={styles.location}>📍 NITERÓI, RJ</div>
    </div>
  );
}
