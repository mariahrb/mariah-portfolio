import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { GameScene } from '../scenes/GameScene';
import type { PageKey } from '../App';
import styles from './GameView.module.css';

interface Props {
  onOpenPage: (key: PageKey) => void;
  onExit: () => void;
}

export function GameView({ onOpenPage, onExit }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef      = useRef<Phaser.Game | null>(null);
  const sceneRef     = useRef<GameScene | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const gameScene = new GameScene();
    sceneRef.current = gameScene;

    // Wire the page-open callback before booting
    gameScene.setPageCallback((key: string) => onOpenPage(key as PageKey));

    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      backgroundColor: '#3d6b4a',
      physics: { default: 'arcade', arcade: { debug: false } },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: window.innerWidth,
        height: window.innerHeight,
      },
      scene: [gameScene],
    });

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.root}>
      <div ref={containerRef} className={styles.canvas} />

      {/* HUD bar */}
      <div className={styles.hud}>
        <span className={styles.hudName}>⚡ MARIAH VALLEY</span>
        <div className={styles.hudBtns}>
          <button className={styles.hudBtn} onClick={() => onOpenPage('home')}>🏠 ABOUT</button>
          <button className={styles.hudBtn} onClick={() => onOpenPage('devlab')}>💻 WORK</button>
          <button className={styles.hudBtn} onClick={onExit}>✕ EXIT</button>
        </div>
      </div>

      <div className={styles.controlsHint}>
        ↑↓←→ / WASD &nbsp;MOVE &nbsp;│&nbsp; E &nbsp;INTERACT &nbsp;│&nbsp; ESC &nbsp;CLOSE
      </div>
    </div>
  );
}
