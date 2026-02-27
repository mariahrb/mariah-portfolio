/**
 * NiteroiScene.ts
 *
 * Phaser 3 scene that renders the Niterói dusk panorama:
 *   • Sky bands (indigo → amber dusk gradient)
 *   • Stars with twinkling tweens
 *   • Dusk clouds (pixel-art blocky)
 *   • Corcovado hill + Cristo Redentor silhouette (backlit)
 *   • Guanabara Bay far shore / Rio skyline
 *   • Animated bay water with shimmer & reflection
 *   • Niterói cliffs + MAC Niemeyer flying-saucer museum
 *   • Palm trees, lights, boats, vignette
 *
 * This scene is purely visual — all interactivity lives in React.
 * Hot-reload: edit this file → Vite HMR restarts the Phaser instance.
 */

import Phaser from 'phaser';

export class NiteroiScene extends Phaser.Scene {
  constructor() {
    super({ key: 'NiteroiScene' });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const horizon = H * 0.55;

    this.drawSky(W, H, horizon);
    this.drawStars(W, horizon);
    this.drawClouds(W, horizon);
    this.drawCorcovado(W, H, horizon);
    this.drawRioSkyline(W, H, horizon);
    this.drawBay(W, H, horizon);
    this.drawNiteroi(W, H, horizon);
    this.drawLights(W, H, horizon);
    this.drawVignette(W, H);

    // Restart on resize so everything re-draws at new dimensions
    this.scale.on('resize', () => this.scene.restart());
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SKY — pixel-art horizontal dusk bands
  // ─────────────────────────────────────────────────────────────────────────
  private drawSky(W: number, H: number, horizon: number) {
    const g = this.add.graphics();

    const bands: [number, number][] = [
      [0.00, 0x0a0818],
      [0.08, 0x120e28],
      [0.16, 0x1a1438],
      [0.24, 0x241a48],
      [0.32, 0x2e2258],
      [0.38, 0x3d2e5a],
      [0.44, 0x5a3060],
      [0.48, 0x7a3860],
      [0.51, 0x9a4858],
      [0.53, 0xb85c50],
      [0.55, 0xd47048],
      [0.57, 0xe8884a],
      [0.60, 0xd47840],
      [0.63, 0xb86030],
      [0.66, 0x8c4828],
    ];

    for (let i = 0; i < bands.length - 1; i++) {
      const y0 = bands[i][0]   * H;
      const y1 = bands[i + 1][0] * H;
      g.fillGradientStyle(bands[i][1], bands[i][1], bands[i + 1][1], bands[i + 1][1], 1);
      g.fillRect(0, y0, W, y1 - y0 + 1);
    }

    // Setting sun
    const sunX = W * 0.62;
    const sunY = horizon * 0.92;
    for (let r = 160; r > 0; r -= 8) {
      g.fillStyle(0xffb050, (1 - r / 160) * 0.15);
      g.fillCircle(sunX, sunY, r);
    }
    g.fillStyle(0xffe090, 0.95); g.fillCircle(sunX, sunY, 18);
    g.fillStyle(0xfffff0, 1);    g.fillCircle(sunX, sunY, 10);

    // Sun pillar
    g.fillGradientStyle(0xff9040, 0xff9040, 0xd46820, 0xd46820, 0.35);
    g.fillRect(sunX - 6, sunY, 12, H * 0.12);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STARS
  // ─────────────────────────────────────────────────────────────────────────
  private drawStars(W: number, horizon: number) {
    const g   = this.add.graphics();
    const rng = this.seededRng(77);

    for (let i = 0; i < 180; i++) {
      const x  = rng() * W;
      const y  = rng() * horizon * 0.85;
      const sz = rng() < 0.15 ? 2 : 1;
      const a  = (1 - y / horizon) * (0.4 + rng() * 0.6);

      g.fillStyle(0xffffff, a);
      g.fillRect(Math.floor(x), Math.floor(y), sz, sz);

      if (rng() < 0.3) {
        const star = this.add.rectangle(x, y, sz + 1, sz + 1, 0xffffff, a);
        this.tweens.add({
          targets: star,
          alpha: { from: a, to: 0.05 },
          yoyo: true, repeat: -1,
          duration: 1200 + rng() * 2500,
          ease: 'Sine.easeInOut',
          delay: rng() * 3000,
        });
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CLOUDS
  // ─────────────────────────────────────────────────────────────────────────
  private drawClouds(W: number, horizon: number) {
    const g = this.add.graphics();

    const clouds = [
      { x: W * 0.08, y: horizon * 0.30, w: 120, h: 28, c: 0x9a4858, lit: 0xd07868 },
      { x: W * 0.22, y: horizon * 0.18, w: 180, h: 36, c: 0x7a3050, lit: 0xc06858 },
      { x: W * 0.55, y: horizon * 0.25, w: 140, h: 24, c: 0x8a4060, lit: 0xd08868 },
      { x: W * 0.75, y: horizon * 0.15, w: 200, h: 40, c: 0x6a2848, lit: 0xb86050 },
      { x: W * 0.88, y: horizon * 0.32, w: 110, h: 22, c: 0x7a3858, lit: 0xb87060 },
    ];

    for (const cl of clouds) {
      g.fillStyle(cl.c, 0.85);
      g.fillRect(cl.x,              cl.y + cl.h * 0.4, cl.w,      cl.h * 0.6);
      g.fillRect(cl.x + cl.w * 0.1, cl.y + cl.h * 0.2, cl.w * 0.8, cl.h * 0.5);
      g.fillRect(cl.x + cl.w * 0.2, cl.y,              cl.w * 0.35, cl.h * 0.45);
      g.fillRect(cl.x + cl.w * 0.5, cl.y + cl.h * 0.1, cl.w * 0.3, cl.h * 0.4);
      g.fillStyle(cl.lit, 0.7);
      g.fillRect(cl.x,              cl.y + cl.h * 0.85, cl.w,      cl.h * 0.15);
      g.fillRect(cl.x + cl.w * 0.1, cl.y + cl.h * 0.65, cl.w * 0.8, cl.h * 0.08);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CORCOVADO + CRISTO REDENTOR
  // ─────────────────────────────────────────────────────────────────────────
  private drawCorcovado(W: number, H: number, horizon: number) {
    const g       = this.add.graphics();
    const hillX   = W * 0.60;
    const hillBaseY = horizon + 10;
    const hillPeakY = horizon * 0.38;
    const hillW   = W * 0.28;

    const hillPoints = [
      { x: hillX - hillW * 0.55, y: hillBaseY },
      { x: hillX - hillW * 0.35, y: horizon * 0.72 },
      { x: hillX - hillW * 0.15, y: horizon * 0.55 },
      { x: hillX,                y: hillPeakY },
      { x: hillX + hillW * 0.08, y: horizon * 0.52 },
      { x: hillX + hillW * 0.25, y: horizon * 0.62 },
      { x: hillX + hillW * 0.45, y: horizon * 0.74 },
      { x: hillX + hillW * 0.55, y: hillBaseY },
    ];
    g.fillStyle(0x0e1a10, 1);
    g.fillPoints(hillPoints, true);

    g.fillStyle(0x1e3018, 0.8);
    g.fillPoints([
      { x: hillX - hillW * 0.15, y: horizon * 0.58 },
      { x: hillX,                y: hillPeakY + 4 },
      { x: hillX + hillW * 0.08, y: horizon * 0.55 },
      { x: hillX + hillW * 0.12, y: horizon * 0.60 },
      { x: hillX + hillW * 0.04, y: horizon * 0.56 },
      { x: hillX,                y: hillPeakY + 12 },
      { x: hillX - hillW * 0.10, y: horizon * 0.62 },
    ], true);

    g.fillStyle(0xd46030, 0.18);
    g.fillPoints([
      { x: hillX - hillW * 0.35, y: horizon * 0.72 },
      { x: hillX - hillW * 0.15, y: horizon * 0.55 },
      { x: hillX,                y: hillPeakY },
      { x: hillX - hillW * 0.02, y: hillPeakY + 2 },
      { x: hillX - hillW * 0.17, y: horizon * 0.58 },
      { x: hillX - hillW * 0.37, y: horizon * 0.76 },
    ], true);

    this.drawCristo(g, hillX, hillPeakY, W);
  }

  private drawCristo(g: Phaser.GameObjects.Graphics, cX: number, cBase: number, W: number) {
    const S   = Math.max(0.6, Math.min(1.2, W / 1200));
    const dark = 0x1a1010;
    const rim  = 0xc05028;

    // Pedestal
    g.fillStyle(dark);
    g.fillRect(cX - 5 * S, cBase - 8 * S,  10 * S, 8 * S);
    g.fillRect(cX - 7 * S, cBase,           14 * S, 5 * S);
    g.fillRect(cX - 9 * S, cBase + 5 * S,  18 * S, 4 * S);
    // Body
    g.fillRect(cX - 4 * S, cBase - 44 * S,  8 * S, 36 * S);
    g.fillRect(cX - 6 * S, cBase - 18 * S, 12 * S, 10 * S);
    // Arms
    const armY = cBase - 36 * S;
    const armW = 52 * S;
    g.fillRect(cX - armW / 2, armY, armW, 5 * S);
    g.fillRect(cX - 10 * S, armY - S, 20 * S, 7 * S);
    // Head
    g.fillEllipse(cX, cBase - 48 * S, 9 * S, 10 * S);

    // Rim light
    g.fillStyle(rim, 0.45);
    g.fillRect(cX, armY - 1, armW / 2 + 4 * S, 3 * S);
    g.fillRect(cX + 2 * S, cBase - 44 * S, 3 * S, 36 * S);
    g.fillEllipse(cX + 2 * S, cBase - 48 * S, 5 * S, 8 * S);

    // Backlit halo
    for (let r = 28 * S; r > 0; r -= 4 * S) {
      g.fillStyle(0xff8840, (1 - r / (28 * S)) * 0.12);
      g.fillCircle(cX, cBase - 38 * S, r);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RIO SKYLINE
  // ─────────────────────────────────────────────────────────────────────────
  private drawRioSkyline(W: number, H: number, horizon: number) {
    const g    = this.add.graphics();
    const rng  = this.seededRng(55);
    const city = 0x0c1418;

    // Background hills
    g.fillStyle(0x162010);
    const hillPts: Phaser.Types.Math.Vector2Like[] = [{ x: 0, y: horizon + 8 }];
    for (let x = 0; x <= W * 0.38; x += 8)
      hillPts.push({ x, y: horizon * 0.78 + Math.sin(x * 0.04) * 14 + Math.sin(x * 0.012) * 22 });
    for (let x = W * 0.38; x <= W * 0.48; x += 8)
      hillPts.push({ x, y: horizon - 2 });
    for (let x = W * 0.48; x <= W; x += 8)
      hillPts.push({ x, y: Math.max(horizon * 0.42, horizon * 0.68 + Math.sin(x * 0.035) * 18 + Math.sin(x * 0.009) * 30) });
    hillPts.push({ x: W, y: horizon + 8 });
    g.fillPoints(hillPts, true);

    // Left buildings (Niterói centro)
    for (const b of this.genBuildings(rng, 0, W * 0.32, horizon - 28, horizon + 2, 22, 6, 44)) {
      g.fillStyle(city); g.fillRect(b.x, b.y, b.w, b.h);
      this.drawWindows(g, rng, b);
    }
    // Right buildings (Rio)
    for (const b of this.genBuildings(rng, W * 0.52, W, horizon - 38, horizon + 2, 28, 7, 52)) {
      g.fillStyle(city); g.fillRect(b.x, b.y, b.w, b.h);
      this.drawWindows(g, rng, b);
    }

    // Ponte Rio-Niterói dots
    g.fillStyle(0x1a2830, 0.9);
    for (let x = W * 0.1; x < W * 0.75; x += 18) g.fillRect(x, horizon + 4, 10, 3);
    for (let i = 0; i < 6; i++) {
      const bx = W * 0.18 + i * (W * 0.09);
      g.fillStyle(0x1e2c38, 0.9); g.fillRect(bx - 2, horizon - 14, 4, 18);
    }
  }

  private drawWindows(
    g: Phaser.GameObjects.Graphics,
    rng: () => number,
    b: { x: number; y: number; w: number; h: number }
  ) {
    if (rng() < 0.4) return;
    const rows = Math.floor(b.h / 10);
    const cols = Math.floor(b.w / 6);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (rng() > 0.45) {
          g.fillStyle(rng() > 0.7 ? 0xffe090 : 0xffe8c0, 0.7 + rng() * 0.3);
          g.fillRect(b.x + 2 + c * 6, b.y + 3 + r * 9, 3, 4);
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // GUANABARA BAY
  // ─────────────────────────────────────────────────────────────────────────
  private drawBay(W: number, H: number, waterTop: number) {
    const g = this.add.graphics();

    g.fillGradientStyle(0x1a3040, 0x1a3040, 0x0e1c28, 0x0e1c28, 1);
    g.fillRect(0, waterTop, W, H - waterTop);

    const shimmerColors = [0x2a4858, 0x203848, 0x1a3040, 0x162838];
    for (let y = waterTop; y < H * 0.75; y += 4) {
      g.fillStyle(shimmerColors[Math.floor((y - waterTop) / 4) % shimmerColors.length], 0.6);
      g.fillRect(0, y, W, 2);
    }

    // Sun reflection
    const sunX = W * 0.62;
    g.fillGradientStyle(0xff9040, 0xff9040, 0xc05818, 0xc05818, 0.5);
    g.fillRect(sunX - 40, waterTop, 80, H * 0.08);

    // Animated shimmer lines
    for (let i = 0; i < 24; i++) {
      const ry = waterTop + 12 + i * ((H * 0.3) / 24);
      const rw = 20 + Math.random() * 60;
      const rx = Math.random() * (W - rw);
      const line = this.add.rectangle(rx + rw / 2, ry, rw, 1, 0x4a8aaa, 0.3);
      this.tweens.add({
        targets: line,
        alpha: { from: 0.05, to: 0.5 },
        scaleX: { from: 0.4, to: 1.2 },
        yoyo: true, repeat: -1,
        duration: 800 + Math.random() * 1400,
        ease: 'Sine.easeInOut',
        delay: Math.random() * 2000,
      });
    }

    // Boats
    this.drawBoat(g, W * 0.28, waterTop + (H - waterTop) * 0.18, 1);
    this.drawBoat(g, W * 0.71, waterTop + (H - waterTop) * 0.22, 0.7);
    this.drawBoat(g, W * 0.45, waterTop + (H - waterTop) * 0.28, 0.5);
  }

  private drawBoat(g: Phaser.GameObjects.Graphics, x: number, y: number, s: number) {
    g.fillStyle(0x0a1820, 0.9);
    g.fillRect(x - 12 * s, y, 24 * s, 5 * s);
    g.fillRect(x - 10 * s, y + 5 * s, 20 * s, 3 * s);
    g.fillRect(x - s, y - 14 * s, 2 * s, 14 * s);
    g.fillStyle(0x1a2830, 0.8);
    g.fillTriangle(x, y - 13 * s, x + 9 * s, y, x, y);
    g.fillStyle(0xffe890, 0.8);
    g.fillRect(x - 1, y - 15 * s, 2, 2);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // NITERÓI CLIFFS + MAC MUSEUM
  // ─────────────────────────────────────────────────────────────────────────
  private drawNiteroi(W: number, H: number, waterTop: number) {
    const g          = this.add.graphics();
    const cliffTopY  = waterTop + (H - waterTop) * 0.20;
    const cliffRightX = W * 0.42;

    const cliffPts = [
      { x: 0,               y: H },
      { x: 0,               y: cliffTopY + 20 },
      { x: W * 0.04,        y: cliffTopY + 8 },
      { x: W * 0.10,        y: cliffTopY },
      { x: W * 0.18,        y: cliffTopY - 6 },
      { x: W * 0.26,        y: cliffTopY - 12 },
      { x: W * 0.32,        y: cliffTopY - 14 },
      { x: cliffRightX,     y: cliffTopY + 2 },
      { x: cliffRightX + W * 0.04, y: waterTop + (H - waterTop) * 0.35 },
      { x: cliffRightX + W * 0.06, y: H },
    ];

    g.fillStyle(0x0e1810, 1);
    g.fillPoints(cliffPts, true);

    // Strata
    g.fillStyle(0x162010, 0.7); g.fillRect(0, cliffTopY + 10, W * 0.35, 15);
    g.fillStyle(0x1a2814, 0.5); g.fillRect(0, cliffTopY + 28, W * 0.30, 10);

    // Cliff top vegetation
    g.fillStyle(0x1a3018, 0.9);
    for (let x = 0; x < cliffRightX; x += 6) {
      const h = 4 + Math.abs(Math.sin(x * 0.18)) * 8;
      g.fillRect(x, cliffTopY - h, 5, h + 2);
    }

    // MAC museum
    const macX = W * 0.29;
    const macY = cliffTopY - 55;
    this.drawMAC(g, macX, macY, W);

    // Palm trees
    this.drawPalm(g, W * 0.04, cliffTopY - 2, 0.8);
    this.drawPalm(g, W * 0.10, cliffTopY - 4, 1.0);
    this.drawPalm(g, W * 0.38, cliffTopY - 6, 0.7);
  }

  private drawMAC(g: Phaser.GameObjects.Graphics, cx: number, cy: number, W: number) {
    const S     = Math.max(0.7, Math.min(1.3, W / 1000));
    const stemH = 32 * S, stemW = 14 * S;
    const discW = 110 * S, discH = 30 * S;
    const halfW = discW / 2, halfWb = discW * 0.38;

    // Reflecting pool
    g.fillStyle(0x1e3030, 0.9);
    g.fillEllipse(cx, cy + stemH + discH * 0.4 + 8 * S, discW * 1.4, 22 * S);
    g.fillStyle(0x2a4858, 0.7);
    g.fillEllipse(cx, cy + stemH + discH * 0.4 + 10 * S, discW * 1.25, 16 * S);
    g.fillStyle(0x4a8898, 0.4);
    g.fillEllipse(cx, cy + stemH + discH * 0.4 + 10 * S, discW * 0.7, 6 * S);

    // Base ring
    g.fillStyle(0x1e2820, 0.95);
    g.fillEllipse(cx, cy + stemH + discH * 0.5, discW * 1.05, 18 * S);

    // Stem
    g.fillStyle(0x2a3828, 1);
    g.fillRect(cx - stemW / 2, cy + discH * 0.3, stemW, stemH);
    g.fillStyle(0x0e1810, 0.6);
    g.fillRect(cx + stemW / 4, cy + discH * 0.3, stemW / 4, stemH);

    // Underside
    g.fillStyle(0x243428, 0.95);
    g.fillEllipse(cx, cy + discH * 0.5, discW, discH * 0.5);

    // Main disc
    g.fillStyle(0x2e4030, 1);
    g.fillPoints([
      { x: cx - halfWb, y: cy + discH },
      { x: cx - halfW,  y: cy },
      { x: cx + halfW,  y: cy },
      { x: cx + halfWb, y: cy + discH },
    ], true);

    // Window band
    const winY = cy + discH * 0.22;
    const winH = discH * 0.35;
    g.fillStyle(0x6a8870, 0.5);
    g.fillPoints([
      { x: cx - halfW + 4 * S,  y: winY },
      { x: cx + halfW - 4 * S,  y: winY },
      { x: cx + halfWb - 2 * S, y: winY + winH },
      { x: cx - halfWb + 2 * S, y: winY + winH },
    ], true);
    g.fillStyle(0x8aaa88, 0.3);
    for (let i = 0; i < 10; i++) {
      g.fillRect(cx - halfW + 8 * S + i * ((halfW * 2 - 16 * S) / 10), winY + 2 * S, (halfW * 2 - 16 * S) / 12, winH - 4 * S);
    }

    // Top cap
    g.fillStyle(0x1e2e20, 1);
    g.fillEllipse(cx, cy - 2 * S, discW * 0.85, discH * 0.28);

    // Sun rim
    g.fillStyle(0xd46828, 0.25);
    g.fillPoints([
      { x: cx,                   y: cy - 2 * S },
      { x: cx + halfW,           y: cy },
      { x: cx + halfWb,          y: cy + discH },
      { x: cx + halfWb - 4 * S,  y: cy + discH },
      { x: cx + halfW - 6 * S,   y: cy + 2 * S },
      { x: cx + 2 * S,           y: cy - S },
    ], true);

    // Antenna + blinking light
    g.fillStyle(0x1a2818, 1);
    g.fillRect(cx - 1.5 * S, cy - 16 * S, 3 * S, 14 * S);
    const tip = this.add.circle(cx, cy - 16 * S, 2 * S, 0xff4040, 0.8);
    this.tweens.add({
      targets: tip, alpha: { from: 0.8, to: 0.1 },
      yoyo: true, repeat: -1, duration: 900, ease: 'Sine.easeInOut',
    });
  }

  private drawPalm(g: Phaser.GameObjects.Graphics, x: number, groundY: number, s: number) {
    g.fillStyle(0x1e2e14, 1);
    for (let i = 0; i < 5; i++) g.fillRect(x + i * 0.5 * s - 2 * s, groundY - (i * 8 + 8) * s, 4 * s, 9 * s);
    g.fillStyle(0x1e3a12, 0.9);
    const fx = x + 2 * s, fy = groundY - 40 * s;
    const fronds: [number, number][] = [
      [-24, -8], [-16, -16], [-4, -20], [8, -18], [18, -10],
      [20, 2], [14, 10], [-2, 14], [-14, 8], [-22, 2],
    ];
    for (const [dx, dy] of fronds) {
      g.fillPoints([
        { x: fx,              y: fy },
        { x: fx + dx * s * 0.4, y: fy + dy * s * 0.4 },
        { x: fx + dx * s,     y: fy + dy * s },
        { x: fx + dx * s * 0.6, y: fy + dy * s + 4 * s },
      ], true);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LIGHTS + FIREFLIES
  // ─────────────────────────────────────────────────────────────────────────
  private drawLights(W: number, H: number, horizon: number) {
    const colors = [0xffe090, 0xffcc60, 0xff9040, 0xfff0c0];
    const rng    = this.seededRng(99);

    for (let i = 0; i < 40; i++) {
      const lx = rng() * W;
      const ly = horizon * 0.3 + rng() * (H - horizon * 0.3);
      const lr = 0.8 + rng() * 2;
      const la = 0.2 + rng() * 0.6;
      const dot = this.add.circle(lx, ly, lr, colors[Math.floor(rng() * colors.length)], la);
      this.tweens.add({
        targets: dot,
        alpha: { from: la, to: 0.02 },
        scale: { from: 1, to: 0.3 },
        yoyo: true, repeat: -1,
        duration: 1000 + rng() * 3000,
        ease: 'Sine.easeInOut',
        delay: rng() * 4000,
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIGNETTE
  // ─────────────────────────────────────────────────────────────────────────
  private drawVignette(W: number, H: number) {
    const g = this.add.graphics();
    g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.5, 0, 0.5, 0);
    g.fillRect(0, 0, W * 0.12, H);
    g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0.5, 0, 0.5);
    g.fillRect(W * 0.88, 0, W * 0.12, H);
    g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.3, 0.3, 0, 0);
    g.fillRect(0, 0, W, H * 0.08);
    g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.6, 0.6);
    g.fillRect(0, H * 0.85, W, H * 0.15);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────
  private seededRng(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      return (s >>> 0) / 4294967296;
    };
  }

  private genBuildings(
    rng: () => number,
    x0: number, x1: number,
    minY: number, maxY: number,
    count: number, minW: number, maxW: number,
  ) {
    const out: { x: number; y: number; w: number; h: number }[] = [];
    let x = x0 + rng() * 10;
    for (let i = 0; i < count && x < x1; i++) {
      const w = minW + rng() * (maxW - minW);
      const h = (maxY - minY) * (0.2 + rng() * 0.8);
      out.push({ x, y: maxY - h, w, h });
      x += w + 1 + rng() * 4;
    }
    return out;
  }
}
