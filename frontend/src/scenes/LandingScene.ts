/**
 * LandingScene.ts — Phaser title screen scene
 *
 * Renders the animated pixel night-sky title screen.
 * Mode selection (Game / Professional) is handled by React overlay,
 * this scene provides the visual backdrop.
 */

import Phaser from 'phaser';

export class LandingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LandingScene' });
  }

  create() {
    const { width: W, height: H } = this.scale;

    // Sky gradient (drawn as overlapping rects)
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x0a0a18, 0x0a0a18, 0x1a1a38, 0x1e3a2a, 1);
    sky.fillRect(0, 0, W, H);

    // Stars
    for (let i = 0; i < 120; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H * 0.7);
      const r = Math.random() * 1.5 + 0.5;
      const star = this.add.circle(x, y, r, 0xffffff, 0.3 + Math.random() * 0.7);

      this.tweens.add({
        targets: star,
        alpha: { from: star.alpha, to: 0.1 },
        yoyo: true,
        repeat: -1,
        duration: 1500 + Math.random() * 3000,
        ease: 'Sine.easeInOut',
        delay: Math.random() * 3000,
      });
    }

    // Ground
    const ground = this.add.graphics();
    ground.fillStyle(0x1e3d2a);
    ground.fillRect(0, H * 0.82, W, H * 0.18);
    ground.fillStyle(0x2a5a3a);
    ground.fillRect(0, H * 0.82, W, 4);

    // Pixel building silhouettes
    this.drawSilhouettes(W, H);

    // Title text
    const title = this.add.text(W / 2, H * 0.32, 'MARIAH\nVALLEY', {
      fontFamily: '"Press Start 2P"',
      fontSize: W < 600 ? '24px' : '48px',
      color: '#f0c040',
      align: 'center',
      shadow: { offsetX: 4, offsetY: 4, color: '#9a6800', fill: true },
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: title,
      alpha: 1,
      y: H * 0.3,
      duration: 800,
      ease: 'Back.easeOut',
      delay: 300,
    });

    // Subtitle
    const sub = this.add.text(W / 2, H * 0.46, 'FULL-STACK ENGINEER  ·  V3.0', {
      fontFamily: '"Press Start 2P"',
      fontSize: W < 600 ? '7px' : '10px',
      color: '#7ec8e3',
      letterSpacing: 4,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: sub, alpha: 1, duration: 600, delay: 900 });

    // Version badge
    this.add.text(W / 2, H - 20, 'MARIAH VALLEY  ·  V3.0  ·  2025', {
      fontFamily: '"Press Start 2P"',
      fontSize: '7px',
      color: 'rgba(255,255,255,0.2)',
    }).setOrigin(0.5);
  }

  private drawSilhouettes(W: number, H: number) {
    const g = this.add.graphics();
    const ground = H * 0.83;

    const buildings = [
      { x: W * 0.05, w: 50, h: 70, rw: 25 },
      { x: W * 0.15, w: 35, h: 50, rw: 18 },
      { x: W * 0.25, w: 80, h: 95, rw: 40 },
      { x: W * 0.38, w: 30, h: 55, rw: 15 },
      { x: W * 0.5,  w: 60, h: 80, rw: 30 },
      { x: W * 0.65, w: 40, h: 60, rw: 20 },
      { x: W * 0.75, w: 70, h: 90, rw: 35 },
      { x: W * 0.88, w: 28, h: 45, rw: 14 },
    ];

    const color = 0x0d1520;
    for (const b of buildings) {
      // Roof triangle
      g.fillStyle(color);
      g.fillTriangle(b.x - 6, ground - b.h + 20, b.x + b.w / 2, ground - b.h, b.x + b.w + 6, ground - b.h + 20);
      // Body
      g.fillRect(b.x, ground - b.h + 20, b.w, b.h - 20);
    }

    // Glowing windows
    for (let i = 0; i < buildings.length; i++) {
      const b = buildings[i];
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 2; col++) {
          if (Math.random() > 0.3) {
            const wx = b.x + 6 + col * (b.w / 2 - 4);
            const wy = ground - b.h + 28 + row * 20;
            const win = this.add.rectangle(wx, wy, 8, 10, 0xffe066, 0.6);

            this.tweens.add({
              targets: win,
              alpha: { from: win.alpha, to: 0.1 },
              yoyo: true,
              repeat: -1,
              duration: 2000 + Math.random() * 3000,
              ease: 'Sine.easeInOut',
              delay: Math.random() * 2000,
            });
          }
        }
      }
    }
  }
}
