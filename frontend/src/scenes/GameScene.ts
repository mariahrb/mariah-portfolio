/**
 * GameScene.ts — Mariah Valley v3 game world
 *
 * Visual design goals:
 *  ✦ Stardew Valley-style pixel-art buildings with:
 *      - Stone/wood foundations, plank walls, pitched roofs with overhang
 *      - Chimney stacks, shuttered windows, flower boxes, lanterns
 *      - Each building has a unique colour palette & rooftop sign
 *  ✦ Rich ground layer:
 *      - Dark-green grass base with lighter green variation
 *      - Stone-cobble path cross with darker edge borders
 *      - Flower clusters + wild grass tufts along path edges
 *      - Dense tree canopy in the four grass quadrants
 *      - Small pond top-right
 *  ✦ Player: pixel-art girl with brunette hair, dress, walking bob
 *  ✦ NPCs with unique outfits, idle bob tweens
 *  ✦ Full dialogue + building-entry transition (all from previous version)
 */

import Phaser from 'phaser';

const API = import.meta.env.VITE_API_URL ?? '/api/v1';

// ── Types ──────────────────────────────────────────────────────────────────────

interface NPCData   { id: string; name: string; x: number; y: number; }
interface DlgChoice { text: string; nextId?: string; action?: string; }
interface DlgLine   { speaker: string; text: string; choices?: DlgChoice[]; }
interface DlgTree   { npcId: string; start: string; lines: Record<string, DlgLine>; }

interface Building {
  id: string; pageKey: string;
  tx: number; ty: number;  // top-left tile coords
  tw: number; th: number;  // width/height in tiles
  label: string;
  wallA: number; wallB: number; // wall gradient colours
  roofA: number; roofB: number; // roof colours
  trim:  number;           // window/door trim accent
  chimney: boolean;
}

// ── World constants ────────────────────────────────────────────────────────────

const T  = 32;               // tile size px
const WW = 50;               // world width  tiles
const WH = 38;               // world height tiles
const DLG_W = 340;
const DLG_H_MIN = 88;
const DLG_H_MAX = 180;
const DLG_PAD_X = 12;
const DLG_PAD_Y = 10;
const PROMPT_H = 22;
const PROMPT_MIN_W = 112;
const PROMPT_MAX_W = 300;

// Pixel colours
const C = {
  // Spring grass ground
  grassDark:    0x3d6f3e,
  grassMid:     0x4f8550,
  grassLight:   0x72a36a,
  soilDark:     0x6e4e2f,
  // Paths (cold cobble)
  pathMain:     0xb59b72,
  pathEdge:     0x8d7553,
  pathStone:    0xd2be9b,
  // Trees
  leafDark:     0x2d5c2e,
  leafMid:      0x3f7a3f,
  leafLight:    0x58a257,
  leafHigh:     0x79c777,
  trunk:        0x6a4020,
  trunkDark:    0x4a2c10,
  // Water
  pondDeep:     0x2d5f9e,
  pondMid:      0x4c86c6,
  pondShallow:  0x7ec3ea,
  pondEdge:     0x5ca8d2,
};

// ── Building definitions (tile coordinates) ────────────────────────────────────

const BUILDINGS: Building[] = [
  {
    id: 'home', pageKey: 'home', label: 'HOME',
    tx: 15, ty: 10, tw: 6, th: 5, // Top-Left
    wallA: 0xf0d5a8, wallB: 0xd7b983, roofA: 0xb3422f, roofB: 0x872d1f,
    trim: 0x8b4c2e, chimney: true,
  },
  {
    id: 'devlab', pageKey: 'devlab', label: 'DEV LAB',
    tx: 29, ty: 10, tw: 7, th: 5, // Top-Right
    wallA: 0xbcd0f6, wallB: 0x90acd9, roofA: 0x4a65a8, roofB: 0x30467f,
    trim: 0x2e3f70, chimney: true,
  },
  {
    id: 'library', pageKey: 'library', label: 'LIBRARY',
    tx: 14, ty: 18, tw: 6, th: 5, // Middle-Left
    wallA: 0xf0e2b5, wallB: 0xd9c789, roofA: 0x8f5e2f, roofB: 0x66411f,
    trim: 0x5a3f25, chimney: true,
  },
  {
    id: 'studio', pageKey: 'studio', label: 'STUDIO',
    tx: 30, ty: 18, tw: 6, th: 5, // Middle-Right
    wallA: 0xe9c6e7, wallB: 0xd3a3cb, roofA: 0xa54b8b, roofB: 0x7a3366,
    trim: 0x5f2d66, chimney: true,
  },
  {
    id: 'innovation', pageKey: 'innovation', label: 'FARM',
    tx: 15, ty: 26, tw: 7, th: 5, // Bottom-Left
    wallA: 0xc5e4b5, wallB: 0x9ec987, roofA: 0x4e8a3e, roofB: 0x35642b,
    trim: 0x3d5b2b, chimney: true,
  },
  {
    id: 'townhall', pageKey: 'townhall', label: 'HALL',
    tx: 28, ty: 26, tw: 7, th: 6, // Bottom-Right
    wallA: 0xd0dde7, wallB: 0xabbed0, roofA: 0x3f5f8f, roofB: 0x2b4469,
    trim: 0x2f4e76, chimney: false,
  },
];
// ── NPC fallback data ──────────────────────────────────────────────────────────

const NPC_FALLBACK: (NPCData & { col: number; hatCol: number; shirtCol: number })[] = [
  { id: 'old-dev',  name: 'Old Dev',  x: 24*T, y: 14*T, col: 0xf0d090, hatCol: 0x604020, shirtCol: 0x7888a0 },
  { id: 'designer', name: 'Pixel',    x: 10*T, y: 17*T, col: 0xf0c8c8, hatCol: 0xd04080, shirtCol: 0xc080c0 },
  { id: 'scout',    name: 'Scout',    x: 39*T, y: 21*T, col: 0xe8d0a0, hatCol: 0x203858, shirtCol: 0x4870a8 },
  { id: 'sage',     name: 'Sage',     x: 24*T, y: 23*T, col: 0xe8e0d8, hatCol: 0x505040, shirtCol: 0x406848 },
];

const DIALOGUES: Record<string, DlgTree> = {
  'old-dev': { npcId:'old-dev', start:'intro', lines: {
    intro:    { speaker:'Old Dev ⚙️', text:"Ah, a visitor! I've watched Mariah build this valley from nothing.", choices:[
      {text:'Tell me about her work', nextId:'projects'},
      {text:'Goodbye!', nextId:''},
    ]},
    projects: { speaker:'Old Dev ⚙️', text:'She built a streaming platform — 2M events a day. Want to see?', choices:[
      {text:'Yes! Take me.', action:'open:devlab'},
      {text:'Maybe later.', nextId:''},
    ]},
  }},
  'designer': { npcId:'designer', start:'intro', lines: {
    intro: { speaker:'Pixel 🎨', text:'Oh hi! Mariah designed this whole valley. Pretty meta, right?', choices:[
      {text:'Show me her design work', action:'open:studio'},
      {text:'Bye!', nextId:''},
    ]},
  }},
  'scout': { npcId:'scout', start:'intro', lines: {
    intro: { speaker:'Scout 🔍', text:"Looking for Mariah's resume? It's in the Library!", choices:[
      {text:'Take me there', action:'open:library'},
      {text:"I'll find it myself", nextId:''},
    ]},
  }},
  'sage': { npcId:'sage', start:'intro', lines: {
    intro: { speaker:'Sage ✨', text:'Every great engineer builds things that outlast them.', choices:[
      {text:'What has she built?', nextId:'oss'},
      {text:'Wise words. Goodbye.', nextId:''},
    ]},
    oss: { speaker:'Sage ✨', text:'2,000 open-source stars and growing. See the Innovation Center.', choices:[
      {text:'Show me', action:'open:innovation'},
      {text:'Thanks.', nextId:''},
    ]},
  }},
};

// ── Scene ──────────────────────────────────────────────────────────────────────

export class GameScene extends Phaser.Scene {
  // Player
  private playerContainer!: Phaser.GameObjects.Container;
  private playerBody!:      Phaser.GameObjects.Graphics;
  private playerPhysics!:   Phaser.GameObjects.Rectangle;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private facing:   'down'|'up'|'left'|'right' = 'down';
  private walkFrame = 0;
  private walkTimer = 0;
  private bobOffset = 0;

  // Dog
  private dog!: Phaser.GameObjects.Container;
  private dogPhysics!: Phaser.GameObjects.Rectangle;

  // Lighting overlay (for day/night cycle)
  private lighting!: Phaser.GameObjects.Rectangle;
  private timeOfDay = 0;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!:    Record<string, Phaser.Input.Keyboard.Key>;

  // State
  private nearBuilding: Building | null = null;
  private nearNPC:      typeof NPC_FALLBACK[0] | null = null;
  private activeDlg:    { tree: DlgTree; lineId: string } | null = null;
  private visited = new Set<string>();
  private talked  = new Set<string>();

  // UI containers
  private dlgBox!:     Phaser.GameObjects.Container;
  private promptBox!:  Phaser.GameObjects.Container;
  private npcContainers = new Map<string, Phaser.GameObjects.Container>();

  // Callback
  private openPage!: (key: string) => void;

  constructor() { super({ key: 'GameScene' }); }

  setPageCallback(cb: (key: string) => void) { this.openPage = cb; }

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  create() {
    this.physics.world.setBounds(0, 0, WW * T, WH * T);
    this.obstacles = this.physics.add.staticGroup();

    // Add buildings as colliders
    for (const b of BUILDINGS) {
      const bx = b.tx * T;
      const by = b.ty * T;
      const bw = b.tw * T;
      const bh = b.th * T;
      const rect = this.add.rectangle(bx + bw/2, by + bh/2, bw, bh, 0xff0000, 0).setOrigin(0.5);
      this.obstacles.add(rect);
    }

    this.paintGround();
    this.paintFountain();
    this.paintPond();
    this.paintTrees();
    this.paintBuildings();
    this.paintPathDecor();   // flowers/bushes on path — drawn ON TOP of path
    this.spawnNPCs();
    this.createPlayer();
    this.createDog();
    this.createLighting();

    this.cameras.main.setBounds(0, 0, WW * T, WH * T);
    this.cameras.main.startFollow(this.playerPhysics, true, 0.08, 0.08);
    this.cameras.main.setZoom(2.2);
    this.physics.add.collider(this.playerPhysics, this.obstacles);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd    = {
      up:    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.input.keyboard!.on('keydown-E',      () => this.interact());
    this.input.keyboard!.on('keydown-ENTER',  () => this.interact());
    this.input.keyboard!.on('keydown-SPACE',  () => this.interact());
    this.input.keyboard!.on('keydown-ESC',    () => this.closeDlg());

    this.buildDlgBox();
    this.buildPrompt();
  }

  update(_time: number, delta: number) {
    this.handleMovement(delta);
    this.updatePlayerSprite();
    this.checkProximity();
    this.updateDog();
    this.updateLighting(delta);
    this.syncUI();
  }

  // ── GROUND ───────────────────────────────────────────────────────────────────

  private paintGround() {
    const g = this.add.graphics();
    const rng = this.rng(7);
    const blocked = this.getBuildingMasks(12);

    // 1. Base spring grass
    g.fillStyle(C.grassDark);
    g.fillRect(0, 0, WW * T, WH * T);

    // 2. Pixel grass speckles (square-only)
    for (let i = 0; i < 260; i++) {
      const x = rng() * WW * T;
      const y = rng() * WH * T;
      const s = 1 + ((rng() * 2) | 0);
      g.fillStyle(C.grassMid, 0.22);
      g.fillRect(x, y, s, s);
      g.fillStyle(C.grassLight, 0.10);
      g.fillRect(x + 2, y - 1, 1, 1);
    }

    // 3. Streets in front of buildings (not under building boxes)
    const px = (WW / 2) * T;
    const streetW = 30;
    const edgeW = 3;
    const streets = [
      { y: 17 * T, x1: 7 * T, x2: 43 * T },
      { y: 25 * T, x1: 7 * T, x2: 43 * T },
      { y: 34 * T, x1: 7 * T, x2: 43 * T },
    ];
    const pathRng = this.rng(42);
    const C_COBBLE = { main: C.pathMain, edge: C.pathEdge, stone: C.pathStone };

    // Horizontal streets main fill
    for (const s of streets) {
      for (let x = s.x1; x <= s.x2; x += 8) {
        const jitter = pathRng() * 2 - 1;
        g.fillStyle(C_COBBLE.main);
        g.fillRect(x, s.y - streetW / 2 + jitter, 8, streetW);
      }
    }

    // Vertical avenue main fill
    for (let y = streets[0].y - T; y <= streets[2].y + T; y += 8) {
      const jitter = pathRng() * 2 - 1;
      g.fillStyle(C_COBBLE.main);
      g.fillRect(px - streetW / 2 + jitter, y, streetW, 8);
    }

    // Draw street borders, but remove borders at intersections
    for (const s of streets) {
      for (let x = s.x1; x <= s.x2; x += 8) {
        const inCross = x > px - streetW / 2 - 8 && x < px + streetW / 2 + 8;
        if (!inCross) {
          g.fillStyle(C_COBBLE.edge);
          g.fillRect(x, s.y - streetW / 2 - edgeW, 8, edgeW);
          g.fillRect(x, s.y + streetW / 2, 8, edgeW);
        }
      }
    }
    for (let y = streets[0].y - T; y <= streets[2].y + T; y += 8) {
      const inCross = streets.some((s) => y > s.y - streetW / 2 - 4 && y < s.y + streetW / 2 + 4);
      if (!inCross) {
        g.fillStyle(C_COBBLE.edge);
        g.fillRect(px - streetW / 2 - edgeW, y, edgeW, 8);
        g.fillRect(px + streetW / 2, y, edgeW, 8);
      }
    }

    // Per-building short walkway from door front to street
    for (const b of BUILDINGS) {
      const bx = b.tx * T;
      const bw = b.tw * T;
      const frontX = bx + bw / 2;
      const frontY = (b.ty + b.th) * T + 8;
      const rowY = b.ty < 14 ? streets[0].y : b.ty < 22 ? streets[1].y : streets[2].y;
      const y1 = Math.min(frontY, rowY);
      const y2 = Math.max(frontY, rowY);

      g.fillStyle(C_COBBLE.edge);
      g.fillRect(frontX - 12, y1 - 2, 24, y2 - y1 + 4);
      g.fillStyle(C_COBBLE.main);
      g.fillRect(frontX - 10, y1, 20, y2 - y1);

      // Porch directly in front of door
      g.fillStyle(C_COBBLE.edge);
      g.fillRect(frontX - 26, frontY - 8, 52, 16);
      g.fillStyle(C_COBBLE.main);
      g.fillRect(frontX - 23, frontY - 6, 46, 12);
    }

    // 4. Cobble details (pixel chips)
    for (const s of streets) {
      for (let x = s.x1 + 10; x <= s.x2 - 10; x += 22) {
        for (let y = s.y - streetW / 2 + 8; y <= s.y + streetW / 2 - 8; y += 12) {
          g.fillStyle(C_COBBLE.stone, 0.35);
          g.fillRect(x, y, 2, 2);
        }
      }
    }
    for (let y = streets[0].y - T + 8; y <= streets[2].y + T - 8; y += 12) {
      for (let x = px - streetW / 2 + 8; x <= px + streetW / 2 - 8; x += 12) {
        g.fillStyle(C_COBBLE.stone, 0.30);
        g.fillRect(x, y, 2, 2);
      }
    }

    // 5. Spring flowers in grass (away from paths + buildings)
    const flowers = [0xff6d8a, 0xffcf4a, 0x9d7cff, 0xffffff, 0xff8f5f];
    for (let i = 0; i < 220; i++) {
      const fx = rng() * WW * T;
      const fy = rng() * WH * T;
      if (
        streets.some((s) => fy > s.y - streetW - 8 && fy < s.y + streetW + 8) ||
        Math.abs(fx - px) < streetW + 8
      ) continue;
      if (blocked.some((b) => fx >= b.x && fx <= b.x + b.w && fy >= b.y && fy <= b.y + b.h)) continue;
      g.fillStyle(0x3f7a3f);
      g.fillRect(fx, fy, 1, 2);
      g.fillStyle(flowers[(rng() * flowers.length) | 0]);
      g.fillRect(fx, fy - 2, 2, 2);
      g.fillRect(fx - 1, fy - 1, 1, 1);
      g.fillRect(fx + 2, fy - 1, 1, 1);
    }

    // Clean mask pass so no path remains under buildings
    for (const m of blocked) {
      g.fillStyle(C.grassDark);
      g.fillRect(m.x, m.y, m.w, m.h);
    }
  }

  // ── POND ─────────────────────────────────────────────────────────────────────

  private paintFountain() {
    const g = this.add.graphics();
    const cx = (WW / 2) * T;
    const cy = 25 * T;

    // Larger square fountain base (no overlay props)
    g.fillStyle(0x000000, 0.18);
    g.fillRect(cx - 72 + 3, cy - 34 + 6, 144, 68);
    g.fillStyle(0x8e93a7);
    g.fillRect(cx - 72, cy - 34, 144, 68);
    g.fillStyle(0xb6bbcc);
    g.fillRect(cx - 64, cy - 28, 128, 56);

    // Inner basin + water only
    g.fillStyle(0x6a7088);
    g.fillRect(cx - 48, cy - 20, 96, 40);
    g.fillStyle(C.pondMid, 0.85);
    g.fillRect(cx - 44, cy - 16, 88, 32);
    g.fillStyle(C.pondShallow, 0.4);
    g.fillRect(cx - 34, cy - 12, 68, 24);

    // Fountain-specific details (stone trim + center column + jet), square-only
    g.fillStyle(0x798095, 0.8);
    g.fillRect(cx - 48, cy - 20, 96, 2);
    g.fillRect(cx - 48, cy + 18, 96, 2);
    g.fillRect(cx - 48, cy - 20, 2, 40);
    g.fillRect(cx + 46, cy - 20, 2, 40);

    g.fillStyle(0x70778c);
    g.fillRect(cx - 9, cy - 28, 18, 12);
    g.fillStyle(0x9ba2b8);
    g.fillRect(cx - 12, cy - 32, 24, 4);
    g.fillStyle(0x5d6378);
    g.fillRect(cx - 7, cy - 16, 14, 3);

    g.fillStyle(0xbde8ff, 0.8);
    g.fillRect(cx - 1, cy - 48, 2, 16);
    g.fillRect(cx - 2, cy - 51, 4, 3);
    g.fillRect(cx - 8, cy - 38, 2, 2);
    g.fillRect(cx + 6, cy - 39, 2, 2);
  }

  // ── POND ─────────────────────────────────────────────────────────────────────

  private paintPond() {
    const g  = this.add.graphics();
    const ox = (WW - 8) * T;
    const oy = 2 * T;
    const pw = 6 * T;
    const ph = 5 * T;

    // Shore
    g.fillStyle(0x4e8f46);
    g.fillEllipse(ox + pw / 2, oy + ph / 2 + 6, pw + 18, ph + 14);
    g.fillStyle(0x3f7a3f, 0.35);
    g.fillEllipse(ox + pw / 2, oy + ph / 2 + 10, pw + 8, ph + 8);

    // Water
    g.fillGradientStyle(C.pondMid, C.pondMid, C.pondDeep, C.pondDeep, 1);
    g.fillEllipse(ox + pw / 2, oy + ph / 2, pw, ph);

    // Shallow edge
    g.fillStyle(C.pondShallow, 0.4);
    g.fillEllipse(ox + pw / 2, oy + ph / 2, pw - 10, ph - 8);

    // Animated shimmer
    for (let i = 0; i < 4; i++) {
      const lw = 18 + Math.random() * 24;
      const sx = ox + 8 + Math.random() * (pw - lw - 16);
      const sy = oy + 8 + i * (ph / 5);
      const line = this.add.rectangle(sx + lw / 2, sy, lw, 1.5, 0xffffff, 0.2);
      this.tweens.add({
        targets: line, alpha: { from: 0.05, to: 0.35 },
        scaleX: { from: 0.5, to: 1.2 },
        yoyo: true, repeat: -1,
        duration: 1000 + Math.random() * 1000,
        ease: 'Sine.easeInOut',
        delay: Math.random() * 2000,
      });
    }

    // Lily pads
    g.fillStyle(0x3a7030, 0.8);
    g.fillEllipse(ox + pw * 0.3, oy + ph * 0.4, 14, 9);
    g.fillEllipse(ox + pw * 0.68, oy + ph * 0.6, 11, 7);

    // Reeds
    g.fillStyle(0x5d6d2f);
    [[ox + 8, oy + ph * 0.3], [ox + pw - 10, oy + ph * 0.55], [ox + pw * 0.5, oy - 4]].forEach(([rx, ry]) => {
      g.fillRect(rx, ry, 3, 22);
      g.fillStyle(0x8b6a34);
      g.fillEllipse(rx + 1.5, ry, 5, 10);
      g.fillStyle(0x5d6d2f);
    });
  }

  // ── TREES ─────────────────────────────────────────────────────────────────────

  private paintTrees() {
    // Place trees in grass quadrants avoiding buildings and path
    const rng = this.rng(31);
    const cx  = WW / 2;
    const cy  = WH / 2;

    // Define safe zones around buildings (in tile coords)
    const noGo = BUILDINGS.map(b => ({
      x1: b.tx - 2, y1: b.ty - 2, x2: b.tx + b.tw + 2, y2: b.ty + b.th + 2,
    }));
    // Pond zone
    noGo.push({ x1: WW - 10, y1: 0, x2: WW, y2: 9 });

    const treePositions: [number, number][] = [];
    for (let i = 0; i < 80; i++) {
      const tx = (rng() * (WW - 2) + 1) | 0;
      const ty = (rng() * (WH - 2) + 1) | 0;
      // Skip path
      if (Math.abs(tx - cx) < 2.5 || Math.abs(ty - cy) < 2.5) continue;
      // Skip no-go zones
      if (noGo.some(z => tx >= z.x1 && tx <= z.x2 && ty >= z.y1 && ty <= z.y2)) continue;
      treePositions.push([tx * T + T / 2, ty * T + T / 2]);
    }

    // Draw back-to-front (sort by Y so nearer trees appear on top)
    treePositions.sort((a, b) => a[1] - b[1]);

    const g = this.add.graphics();
    for (const [tx, ty] of treePositions) {
      this.drawTree(g, tx, ty, 0.8 + rng() * 0.5);
    }
  }

  private drawTree(g: Phaser.GameObjects.Graphics, x: number, y: number, s: number) {
    // Trunk shadow
    g.fillStyle(0x000000, 0.15);
    g.fillEllipse(x + 3, y + 4, 12 * s, 5 * s);

    // Trunk
    g.fillStyle(C.trunkDark);
    g.fillRect(x - 3 * s, y - 2 * s, 6 * s, 18 * s);
    g.fillStyle(C.trunk);
    g.fillRect(x - 2 * s, y - 2 * s, 3 * s, 18 * s);

    // Spring canopy
    g.fillStyle(C.leafDark);
    g.fillEllipse(x, y - 10 * s, 34 * s, 22 * s);
    g.fillStyle(C.leafMid);
    g.fillEllipse(x - 2 * s, y - 16 * s, 28 * s, 20 * s);
    g.fillStyle(C.leafLight);
    g.fillEllipse(x, y - 22 * s, 22 * s, 16 * s);
    g.fillStyle(C.leafHigh, 0.6);
    g.fillEllipse(x - 4 * s, y - 25 * s, 10 * s, 8 * s);
    g.fillStyle(0xf5a3bf, 0.7);
    g.fillCircle(x - 8 * s, y - 14 * s, 2.5 * s);
    g.fillCircle(x + 6 * s, y - 20 * s, 2 * s);
    g.fillCircle(x, y - 24 * s, 1.8 * s);
  }

  // ── BUILDINGS ────────────────────────────────────────────────────────────────

  private paintBuildings() {
    for (const b of BUILDINGS) {
      this.drawBuilding(b);
    }
  }

  private drawBuilding(b: Building) {
    const g  = this.add.graphics();
    const bx = b.tx * T;
    const by = b.ty * T;
    const bw = b.tw * T;
    const bh = b.th * T;
    const accents: Record<string, number> = {
      home: 0xd86a4f,
      devlab: 0x66b5ff,
      library: 0xe7bf54,
      studio: 0xd68ae8,
      innovation: 0x78c468,
      townhall: 0x7da8d8,
    };
    const accent = accents[b.id] ?? 0xe6d6a8;

    // ── Drop shadow ──
    g.fillStyle(0x000000, 0.18);
    g.fillRect(bx + 6, by + bh - 4, bw + 4, 12);

    // ── Foundation (stone base, 8px tall) ──
    const fH = 10;
    g.fillStyle(0x9ca1b3);
    g.fillRect(bx, by + bh - fH, bw, fH);
    // Stone lines
    g.fillStyle(0x6c7286, 0.65);
    for (let sx = bx; sx < bx + bw; sx += 14) {
      g.fillRect(sx, by + bh - fH, 1, fH);
    }
    g.fillRect(bx, by + bh - fH + 5, bw, 1);

    // ── Walls ──
    const wallH = bh - T - fH;   // from roof base to foundation
    g.fillGradientStyle(b.wallA, b.wallA, b.wallB, b.wallB, 1);
    g.fillRect(bx, by + T, bw, wallH);

    // ── Wood plank texture ──
    g.fillStyle(0x000000, 0.08);
    for (let px2 = bx + 10; px2 < bx + bw - 6; px2 += 10) {
      g.fillRect(px2, by + T, 1, wallH);
    }
    g.fillStyle(0xffffff, 0.08);
    for (let py2 = by + T + 8; py2 < by + T + wallH - 4; py2 += 10) {
      g.fillRect(bx + 4, py2, bw - 8, 1);
    }

    // ── Wall shading (right side darker) ──
    g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.14, 0.14);
    g.fillRect(bx + bw - 8, by + T, 8, wallH);
    g.fillStyle(accent, 0.22);
    g.fillRect(bx + 4, by + T + 3, bw - 8, 4);

    // ── Roof base beam ──
    g.fillStyle(b.trim);
    g.fillRect(bx - 4, by + T - 2, bw + 8, 6);

    // ── Pitched roof ──
    const roofMid = bx + bw / 2;
    const roofPeak = by + 2;

    g.fillStyle(b.roofA);
    g.fillTriangle(
      roofMid,     roofPeak,
      bx - 8,      by + T + 2,
      bx + bw + 8, by + T + 2,
    );

    // ── Roof shading: right half darker ──
    g.fillStyle(b.roofB, 0.55);
    g.fillTriangle(
      roofMid,     roofPeak,
      roofMid,     by + T + 2,
      bx + bw + 8, by + T + 2,
    );

    // ── Roof ridge tile ──
    g.fillStyle(b.roofB);
    g.fillRect(roofMid - 3, roofPeak, 6, 14);
    g.fillStyle(0x000000, 0.16);
    const roofBaseY = by + T + 2;
    for (let ry = roofPeak + 5; ry <= roofBaseY; ry += 4) {
      const t = (ry - roofPeak) / (roofBaseY - roofPeak);
      const halfW = (bw / 2 + 8) * t;
      const lx = roofMid - halfW + 1;
      const w = halfW * 2 - 2;
      if (w > 0) g.fillRect(lx, ry, w, 1);
    }
    g.fillStyle(0xffffff, 0.11);
    for (let rx = bx + 4; rx < bx + bw - 4; rx += 12) {
      g.fillRect(rx, by + T - 1, 7, 1);
    }

    // ── Chimney ──
    if (b.chimney) {
      const cxPos = bx + bw * 0.72;
      g.fillStyle(0x888070);
      g.fillRect(cxPos, by - 12, 12, T + 14);
      g.fillStyle(0x707060);
      g.fillRect(cxPos - 2, by - 12, 16, 5);
      g.fillStyle(0x5f5f52, 0.55);
      for (let cy = by - 7; cy < by + T - 2; cy += 6) {
        g.fillRect(cxPos, cy, 12, 1);
      }
      // Smoke puff (morning/day feel)
      const smoke = this.add.circle(cxPos + 6, by - 16, 4, 0xd8d0c8, 0.35);
      this.tweens.add({
        targets: smoke, y: '-=10', alpha: 0,
        duration: 2200, repeat: -1,
        ease: 'Sine.easeIn', delay: Math.random() * 1500,
      });
    }

    // ── Windows ──
    const winCount = b.tw >= 7 ? 3 : 2;
    const winSpacing = bw / (winCount + 1);
    for (let w = 1; w <= winCount; w++) {
      const wx  = bx + w * winSpacing - 10;
      const wy  = by + T + 14;
      const ww2 = 20;
      const wh2 = 18;

      // Shutter
      g.fillStyle(b.trim);
      g.fillRect(wx - 4, wy - 1, 4, wh2 + 2);
      g.fillRect(wx + ww2, wy - 1, 4, wh2 + 2);

      // Window frame
      g.fillStyle(0x2d2230);
      g.fillRect(wx - 1, wy - 1, ww2 + 2, wh2 + 2);

      // Glass
      g.fillStyle(0x8eb2eb);
      g.fillRect(wx, wy, ww2, wh2);

      // Cross pane
      g.fillStyle(0x2d2230, 0.45);
      g.fillRect(wx + ww2 / 2 - 1, wy, 2, wh2);
      g.fillRect(wx, wy + wh2 / 2 - 1, ww2, 2);

      // Window reflection
      g.fillStyle(0xffffff, 0.25);
      g.fillRect(wx + 2, wy + 2, 5, 3);
      g.fillStyle(accent, 0.22);
      g.fillRect(wx + 1, wy + wh2 - 4, ww2 - 2, 3);

    }

    // ── Door ──
    const dx = bx + bw / 2 - 13;
    const dy = by + bh - fH - 32;
    // Door frame
    g.fillStyle(b.trim);
    g.fillRect(dx - 3, dy - 3, 29, 35);
    // Door body
    g.fillStyle(0x55331c);
    g.fillRect(dx, dy, 26, 32);
    // Door panel detail
    g.fillStyle(0x7a4d2a, 0.55);
    g.fillRect(dx + 3, dy + 3, 9, 12);
    g.fillRect(dx + 14, dy + 3, 9, 12);
    g.fillRect(dx + 3, dy + 18, 20, 10);
    // Door knob
    g.fillStyle(0xe0b830);
    g.fillCircle(dx + 20, dy + 16, 3);
    // Door step
    g.fillStyle(0xa1a7b8);
    g.fillRect(dx - 6, dy + 32, 38, 5);
    g.fillStyle(0x6d5438);
    g.fillRect(dx - 8, dy + 37, 42, 3);

    // ── Building sign ──
    this.add.text(bx + bw / 2, by + T + wallH / 2 + 8, b.label, {
      fontFamily: '"Press Start 2P"',
      fontSize:   '5px',
      color:      `#${accent.toString(16).padStart(6, '0')}`,
      backgroundColor: 'rgba(8,10,20,0.62)',
      padding:    { x: 4, y: 2 },
      resolution: 2,
    }).setOrigin(0.5).setDepth(2);
  }

  // ── PATH DECORATIONS ─────────────────────────────────────────────────────────

  private paintPathDecor() {
    const g   = this.add.graphics();
    const rng = this.rng(55);
    const avenueX = (WW / 2) * T;
    const fountain = { x: avenueX - 76, y: 25 * T - 38, w: 152, h: 76 };
    const streets = [17 * T, 25 * T, 34 * T];
    const x1 = 7 * T;
    const x2 = 43 * T;
    const blocked = this.getBuildingMasks(8);

    // ── Flower shrubs along path edges ──
    const flowerCols = [0xff5f85, 0xffd04a, 0xba80ff, 0xffffff, 0xff8a5a];

    // Horizontal street edges
    for (const sy of streets) {
      for (let x = x1; x <= x2; x += 18) {
        for (const ey of [sy - 16, sy + 12]) {
          if (x >= fountain.x && x <= fountain.x + fountain.w && ey >= fountain.y && ey <= fountain.y + fountain.h) continue;
          if (blocked.some((b) => x >= b.x && x <= b.x + b.w && ey >= b.y && ey <= b.y + b.h)) continue;
          if (rng() > 0.45) {
            g.fillStyle(0x2f672f, 0.9);
            g.fillEllipse(x + 4, ey, 14, 10);
            g.fillStyle(0x438643, 0.7);
            g.fillEllipse(x + 2, ey - 2, 10, 8);
            if (rng() > 0.4) {
              const fc = flowerCols[(rng() * flowerCols.length) | 0];
              g.fillStyle(fc);
              g.fillCircle(x + rng() * 10, ey - 3, 2.5);
              g.fillCircle(x + 6 + rng() * 6, ey - 5, 2);
            }
          }
        }
      }
    }

    // Vertical avenue edges
    for (let y = streets[0] - 8; y <= streets[2] + 8; y += 18) {
      for (const ex of [avenueX - 16, avenueX + 12]) {
        if (ex >= fountain.x && ex <= fountain.x + fountain.w && y >= fountain.y && y <= fountain.y + fountain.h) continue;
        if (blocked.some((b) => ex >= b.x && ex <= b.x + b.w && y >= b.y && y <= b.y + b.h)) continue;
        if (rng() > 0.45) {
          g.fillStyle(0x2f672f, 0.9);
          g.fillEllipse(ex, y + 4, 10, 14);
          g.fillStyle(0x438643, 0.7);
          g.fillEllipse(ex - 2, y + 2, 8, 10);
          if (rng() > 0.4) {
            const fc = flowerCols[(rng() * flowerCols.length) | 0];
            g.fillStyle(fc);
            g.fillCircle(ex - 3, y + rng() * 10, 2.5);
          }
        }
      }
    }

    // ── Grass tufts along path edges ──
    const tufts = this.rng(77);
    g.fillStyle(0x65a35f, 0.75);
    for (let i = 0; i < 120; i++) {
      const onH = tufts() > 0.5;
      let tx2: number, ty2: number;
      if (onH) {
        const sy = streets[(tufts() * streets.length) | 0];
        tx2 = x1 + tufts() * (x2 - x1);
        ty2 = sy + (tufts() > 0.5 ? -18 : 14);
      } else {
        tx2 = avenueX + (tufts() > 0.5 ? -18 : 14);
        ty2 = streets[0] + tufts() * (streets[2] - streets[0]);
      }
      if (tx2 >= fountain.x && tx2 <= fountain.x + fountain.w && ty2 >= fountain.y && ty2 <= fountain.y + fountain.h) continue;
      if (blocked.some((b) => tx2 >= b.x && tx2 <= b.x + b.w && ty2 >= b.y && ty2 <= b.y + b.h)) continue;
      // Small V-tuft
      g.fillTriangle(tx2, ty2, tx2 - 3, ty2 + 7, tx2 + 3, ty2 + 7);
      g.fillTriangle(tx2 + 5, ty2 + 1, tx2 + 2, ty2 + 8, tx2 + 8, ty2 + 8);
    }

    // ── Scattered mushrooms ──
    const mushRng = this.rng(111);
    for (let i = 0; i < 18; i++) {
      const mx = mushRng() * WW * T;
      const my = mushRng() * WH * T;
      if (
        streets.some((sy) => my > sy - 20 && my < sy + 20) ||
        Math.abs(mx - avenueX) < 20
      ) continue;
      if (blocked.some((b) => mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h)) continue;
      const isBig = mushRng() > 0.6;
      const ms = isBig ? 1 : 0.6;
      g.fillStyle(0xf0e2cc);
      g.fillRect(mx - 2 * ms, my, 4 * ms, 6 * ms);
      g.fillStyle(mushRng() > 0.5 ? 0xd94a30 : 0xe3b13f);
      g.fillEllipse(mx, my - 1 * ms, 12 * ms, 8 * ms);
      g.fillStyle(0xffffff, 0.8);
      g.fillCircle(mx - 2 * ms, my - 3 * ms, 1.5 * ms);
      g.fillCircle(mx + 1 * ms, my - 4 * ms, 1 * ms);
    }
  }

  // ── PLAYER (brunette girl) ───────────────────────────────────────────────────

  private createPlayer() {
    const sx = (WW / 2) * T;
    const sy = (WH / 2) * T + 80;

    // Invisible physics body
    this.playerPhysics = this.add.rectangle(sx, sy, 10, 8, 0, 0);
    this.physics.add.existing(this.playerPhysics);
    (this.playerPhysics.body as Phaser.Physics.Arcade.Body)
      .setCollideWorldBounds(true)
      .setSize(10, 8);

    // Visual container (offset upward so feet align with physics rect)
    this.playerContainer = this.add.container(sx, sy - 8).setDepth(5);
    this.playerBody = this.add.graphics();
    this.playerContainer.add(this.playerBody);
    this.drawPlayerSprite(this.playerBody, 'down', 0);
  }

  private drawPlayerSprite(g: Phaser.GameObjects.Graphics, dir: string, frame: number) {
    g.clear();
    const bob = Math.sin(frame * 0.35) * 1.5;
    const swing = Math.sin(frame * 0.35) * 1.5;
    const SKIN = 0xf0c8a8;
    const HAIR = 0x3a2a20;
    const HAIR_LIGHT = 0x5a3d2f;
    const DRESS = 0x6f8fd1;
    const DRESS_SHADOW = 0x4b679f;
    const BOOTS = 0x2f2016;

    // ── Shadow ──
    g.fillStyle(0x000000, 0.18);
    g.fillRect(-6, 15, 12, 3);

    // ── Boots ──
    g.fillStyle(BOOTS);
    g.fillRect(-5, 12 + bob, 4, 3);
    g.fillRect(1, 12 + bob, 4, 3);

    // ── Legs ──
    g.fillStyle(0x31456f);
    if (dir === 'left' || dir === 'right') {
      g.fillRect(-4, 6, 3, 7 + swing + bob);
      g.fillRect(1, 6, 3, 7 - swing + bob);
    } else {
      g.fillRect(-4, 6, 3, 8 + bob);
      g.fillRect(1, 6, 3, 8 + bob);
    }

    // ── Body / dress (NPC-like block style) ──
    g.fillStyle(DRESS);
    g.fillRect(-6, -4, 12, 11);
    g.fillStyle(DRESS_SHADOW);
    g.fillRect(-1, -4, 2, 11);
    g.fillStyle(0xded9cc, 0.45);
    g.fillRect(-2, -2, 4, 2);
    g.fillStyle(0x5f472f);
    g.fillRect(-6, 6, 12, 1);

    // ── Arms ──
    g.fillStyle(SKIN);
    if (dir === 'left') {
      g.fillRect(-8, -2 + swing, 3, 9);
      g.fillRect(5, -2, 3, 9);
    } else if (dir === 'right') {
      g.fillRect(-8, -2, 3, 9);
      g.fillRect(5, -2 - swing, 3, 9);
    } else {
      g.fillRect(-8, -2, 3, 9);
      g.fillRect(5, -2, 3, 9);
    }

    // ── Head ──
    g.fillStyle(SKIN);
    g.fillRect(-5, -15, 10, 11);
    g.fillStyle(0xe0b691);
    g.fillRect(-4, -6, 8, 1);

    // ── Hair (same rendering style as NPCs, longer in back) ──
    g.fillStyle(HAIR);
    g.fillRect(-6, -16, 12, 4);
    g.fillRect(-6, -13, 2, 5);
    g.fillRect(4, -13, 2, 5);

    if (dir === 'up') {
      g.fillStyle(HAIR);
      g.fillRect(-6, -8, 12, 10);
      g.fillRect(-7, -2, 4, 4);
      g.fillRect(3, -2, 4, 4);
    } else {
      g.fillStyle(HAIR);
      g.fillRect(-8, -15, 3, 14);
      g.fillRect(5, -15, 3, 14);
      g.fillStyle(HAIR_LIGHT);
      g.fillRect(-5, -15, 1, 8);
      g.fillRect(4, -15, 1, 8);
    }

    // ── Face (square NPC-like) ──
    if (dir !== 'up') {
      g.fillStyle(0x2a1808);
      if (dir === 'right') {
        g.fillRect(2, -12, 2, 2);
        g.fillStyle(0xb06d64);
        g.fillRect(1, -9, 2, 1);
      } else if (dir === 'left') {
        g.fillRect(-4, -12, 2, 2);
        g.fillStyle(0xb06d64);
        g.fillRect(-3, -9, 2, 1);
      } else {
        g.fillRect(-3, -12, 2, 2);
        g.fillRect(1, -12, 2, 2);
        g.fillStyle(0xb06d64);
        g.fillRect(-1, -9, 2, 1);
      }
    }
  }

  private updatePlayerSprite() {
    const moving = !!(
      this.cursors.left.isDown || this.cursors.right.isDown ||
      this.cursors.up.isDown   || this.cursors.down.isDown  ||
      this.wasd.left.isDown    || this.wasd.right.isDown     ||
      this.wasd.up.isDown      || this.wasd.down.isDown
    );

    if (moving) this.walkTimer += 1;
    else         this.walkTimer = 0;
    this.walkFrame = this.walkTimer;

    if (this.playerPhysics) {
      this.playerContainer.x = this.playerPhysics.x;
      this.playerContainer.y = this.playerPhysics.y - 8;
    }

    this.drawPlayerSprite(this.playerBody, this.facing, this.walkFrame);
  }

  // ── NPCs ──────────────────────────────────────────────────────────────────────

  private spawnNPCs() {
    for (const npc of NPC_FALLBACK) {
      const g = this.add.graphics();
      this.drawNPC(g, npc);
      const nameTag = this.add.text(0, -30, npc.name, {
        fontFamily: '"Press Start 2P"', fontSize: '5px',
        color: '#fff', backgroundColor: 'rgba(0,0,0,0.6)',
        padding: { x: 3, y: 2 }, resolution: 2,
      }).setOrigin(0.5);

      const ctr = this.add.container(npc.x, npc.y, [g, nameTag]).setDepth(4);
      const hit = this.add.circle(0, -6, 16, 0xffffff, 0).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => this.startDlg(npc.id));
      ctr.add(hit);
      (ctr as any).npcData = npc;
      this.npcContainers.set(npc.id, ctr);

      this.tweens.add({
        targets: ctr, y: npc.y - 3, yoyo: true, repeat: -1,
        duration: 1100 + Math.random() * 400, ease: 'Sine.easeInOut',
      });
    }
  }

  private drawNPC(g: Phaser.GameObjects.Graphics, npc: typeof NPC_FALLBACK[0]) {
    // Shadow
    g.fillStyle(0x000000, 0.15);
    g.fillRect(-6, 15, 12, 3);

    // Shoes
    g.fillStyle(0x2f2016);
    g.fillRect(-5, 12, 4, 3);
    g.fillRect(1, 12, 4, 3);

    // Legs
    g.fillStyle(0x31364b);
    g.fillRect(-4, 6, 3, 8);
    g.fillRect(1, 6, 3, 8);

    // Torso / jacket
    g.fillStyle(npc.shirtCol);
    g.fillRect(-6, -4, 12, 11);
    g.fillStyle(0x1c1c24, 0.25);
    g.fillRect(-1, -4, 2, 11);
    g.fillStyle(0xd7d3c8, 0.45);
    g.fillRect(-2, -2, 4, 2);
    g.fillStyle(0x6b4f35);
    g.fillRect(-6, 6, 12, 1); // belt

    // Arms
    g.fillStyle(npc.col);
    g.fillRect(-8, -2, 3, 9);
    g.fillRect(5, -2, 3, 9);
    g.fillStyle(npc.shirtCol, 0.6);
    g.fillRect(-8, -2, 1, 6);
    g.fillRect(7, -2, 1, 6);

    // Head
    g.fillStyle(npc.col);
    g.fillRect(-5, -15, 10, 11);
    g.fillStyle(0xd9b48e, 0.5);
    g.fillRect(-4, -6, 8, 1);

    // Hair + hat
    g.fillStyle(0x3a2a20);
    g.fillRect(-6, -16, 12, 4);
    g.fillRect(-6, -13, 2, 5);
    g.fillRect(4, -13, 2, 5);
    g.fillStyle(npc.hatCol);
    g.fillRect(-7, -20, 14, 3);
    g.fillRect(-4, -24, 8, 5);
    g.fillStyle(0xffffff, 0.2);
    g.fillRect(-3, -23, 4, 1);

    // Eyes
    g.fillStyle(0x2a1808);
    g.fillRect(-3, -12, 2, 2);
    g.fillRect(1, -12, 2, 2);
    g.fillStyle(0xb06d64);
    g.fillRect(-1, -9, 2, 1);
  }

  // ── MOVEMENT ─────────────────────────────────────────────────────────────────

  private handleMovement(delta: number) {
    if (this.activeDlg) {
      (this.playerPhysics.body as Phaser.Physics.Arcade.Body).setVelocity(0);
      return;
    }
    const speed = 95;
    const body = this.playerPhysics.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);

    const L = this.cursors.left.isDown  || this.wasd.left.isDown;
    const R = this.cursors.right.isDown || this.wasd.right.isDown;
    const U = this.cursors.up.isDown    || this.wasd.up.isDown;
    const D = this.cursors.down.isDown  || this.wasd.down.isDown;

    if (L) { body.setVelocityX(-speed); this.facing = 'left'; }
    if (R) { body.setVelocityX(speed);  this.facing = 'right'; }
    if (U) { body.setVelocityY(-speed); this.facing = 'up'; }
    if (D) { body.setVelocityY(speed);  this.facing = 'down'; }
    if ((L || R) && (U || D)) body.velocity.scale(0.707);
  }

  // ── PROXIMITY ────────────────────────────────────────────────────────────────

  private checkProximity() {
    if (!this.playerPhysics) return;
    const px = this.playerPhysics.x;
    const py = this.playerPhysics.y;
    const NPC_DIST = 44;
    const BUILDING_DIST_Y = 46;
    const BUILDING_DIST_X_PAD = 2;

    this.nearBuilding = null;
    for (const b of BUILDINGS) {
      const bx = b.tx * T + b.tw * T / 2;
      const by = (b.ty + b.th) * T;
      if (
        Math.abs(px - bx) < b.tw * T / 2 + BUILDING_DIST_X_PAD &&
        Math.abs(py - by) < BUILDING_DIST_Y
      ) {
        this.nearBuilding = b; break;
      }
    }

    this.nearNPC = null;
    for (const npc of NPC_FALLBACK) {
      const ctr = this.npcContainers.get(npc.id);
      const nx = ctr ? ctr.x : npc.x;
      const ny = ctr ? ctr.y : npc.y;
      if (Phaser.Math.Distance.Between(px, py, nx, ny) < NPC_DIST) {
        this.nearNPC = npc; break;
      }
    }

    const has = !!(this.nearBuilding || this.nearNPC);
    this.promptBox.setVisible(has && !this.activeDlg);
    if (has) {
      const label = this.nearNPC
        ? `[ E ] TALK TO ${this.nearNPC.name.toUpperCase()}`
        : `[ E ] ENTER ${this.nearBuilding!.label}`;
      const promptLabel = this.promptBox.getAt(1) as Phaser.GameObjects.Text;
      const promptBg = this.promptBox.getAt(0) as Phaser.GameObjects.Rectangle;
      promptLabel.setText(label);
      const nextW = Phaser.Math.Clamp(
        Math.ceil(promptLabel.width + 18),
        PROMPT_MIN_W,
        PROMPT_MAX_W,
      );
      promptBg.setSize(nextW, PROMPT_H);
      promptBg.setDisplaySize(nextW, PROMPT_H);
      this.anchorUIToPlayer(
        this.promptBox,
        34,
      );
    }
  }

  // Place interaction UI relative to player and clamp to camera view.
  private anchorUIToPlayer(
    ui: Phaser.GameObjects.Container,
    offsetY: number,
  ) {
    if (!this.playerPhysics) return;
    const cam = this.cameras.main;
    const b = ui.getBounds();
    const halfW = Math.max(8, b.width / 2);
    const halfH = Math.max(8, b.height / 2);

    const x = Phaser.Math.Clamp(
      this.playerPhysics.x,
      cam.worldView.x + halfW + 6,
      cam.worldView.right - halfW - 6,
    );
    const y = Phaser.Math.Clamp(
      this.playerPhysics.y + offsetY,
      cam.worldView.y + halfH + 6,
      cam.worldView.bottom - halfH - 6,
    );
    ui.setPosition(x, y);
    ui.setScale(1);
  }

  private syncUI() {
    if (this.promptBox?.visible) {
      this.anchorUIToPlayer(
        this.promptBox,
        34,
      );
    }
    if (this.dlgBox?.visible) {
      this.anchorUIToPlayer(
        this.dlgBox,
        102,
      );
    }
  }


  

  // ── INTERACT ─────────────────────────────────────────────────────────────────

  private interact() {
    if (this.activeDlg) {
      const line = this.activeDlg.tree.lines[this.activeDlg.lineId];
      if (!line || !(line.choices?.length)) this.closeDlg();
      return;
    }
    if (this.nearNPC)      this.startDlg(this.nearNPC.id);
    else if (this.nearBuilding) this.enterBuilding(this.nearBuilding);
  }

  private enterBuilding(b: Building) {
    this.visited.add(b.id);
    this.cameras.main.zoomTo(4.5, 380, 'Sine.easeIn');
    this.time.delayedCall(340, () => this.cameras.main.fadeOut(200, 0, 0, 0));
    this.time.delayedCall(600, () => {
      this.cameras.main.resetFX();
      this.cameras.main.setZoom(2.2);
      if (this.openPage) this.openPage(b.pageKey);
    });
  }

  // ── DIALOGUE ─────────────────────────────────────────────────────────────────

  private startDlg(id: string) {
    const tree = DIALOGUES[id];
    if (!tree) return;
    this.talked.add(id);
    this.activeDlg = { tree, lineId: tree.start };
    try {
      this.renderDlg();
      this.dlgBox.setVisible(true);
      this.promptBox.setVisible(false);
    } catch (err) {
      // Never keep controls locked when dialogue UI fails to render.
      // eslint-disable-next-line no-console
      console.error('Failed to render dialogue UI', err);
      this.activeDlg = null;
      this.dlgBox.setVisible(false);
      this.promptBox.setVisible(false);
    }
  }

  private renderDlg() {
    if (!this.activeDlg) return;
    const line = this.activeDlg.tree.lines[this.activeDlg.lineId];
    if (!line) { this.closeDlg(); return; }

    const box = this.dlgBox;
    this.anchorUIToPlayer(
      box,
      102,
    );
    const sp = box.getAt(1) as Phaser.GameObjects.Text;
    const bd = box.getAt(2) as Phaser.GameObjects.Text;
    const bg = box.getAt(0) as Phaser.GameObjects.Rectangle;
    const innerW = DLG_W - DLG_PAD_X * 2;
    sp.setText(line.speaker);
    bd.setWordWrapWidth(innerW);
    bd.setText(line.text);

    while (box.length > 3) box.removeAt(3, true);

    const choices = line.choices ?? [];
    const interactiveLines: Phaser.GameObjects.Text[] = [];
    const choiceStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: '"Press Start 2P"',
      fontSize: '6px',
      color: '#f0c040',
      align: 'left',
      wordWrap: { width: innerW },
      resolution: 2,
      lineSpacing: 2,
    };

    choices.forEach((ch, i) => {
      const btn = this.add.text(0, 0, `▸ ${ch.text}`, choiceStyle)
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true });
      btn.on('pointerover', () => btn.setColor('#ffffff'));
      btn.on('pointerout',  () => btn.setColor('#f0c040'));
      btn.on('pointerdown', () => this.pickChoice(ch));
      box.add(btn);
      interactiveLines.push(btn);
    });

    let continueBtn: Phaser.GameObjects.Text | null = null;
    if (!choices.length) {
      continueBtn = this.add.text(0, 0, '[ E ] Continue', {
        fontFamily: '"Press Start 2P"',
        fontSize: '6px',
        color: '#666',
        resolution: 2,
        lineSpacing: 2,
      }).setOrigin(0.5, 0).setInteractive();
      continueBtn.on('pointerdown', () => this.closeDlg());
      box.add(continueBtn);
      interactiveLines.push(continueBtn);
    }

    // Resize background height to content so text never spills out.
    const choiceH = interactiveLines.reduce((acc, item, idx) => {
      const gap = idx < interactiveLines.length - 1 ? 5 : 0;
      return acc + item.height + gap;
    }, 0);
    const contentH = sp.height + 6 + bd.height + (interactiveLines.length ? 8 + choiceH : 0);
    const nextH = Phaser.Math.Clamp(
      Math.ceil(contentH + DLG_PAD_Y * 2),
      DLG_H_MIN,
      DLG_H_MAX,
    );

    bg.setSize(DLG_W, nextH);
    bg.setDisplaySize(DLG_W, nextH);

    const left = -DLG_W / 2 + DLG_PAD_X;
    let y = -nextH / 2 + DLG_PAD_Y;

    sp.setPosition(left, y).setOrigin(0, 0);
    y += sp.height + 6;

    bd.setPosition(left, y).setOrigin(0, 0);
    y += bd.height + 8;

    if (continueBtn) {
      continueBtn.setPosition(0, y + 2);
    } else {
      interactiveLines.forEach((item) => {
        item.setPosition(left, y);
        y += item.height + 5;
      });
    }
  }

  private pickChoice(ch: DlgChoice) {
    if (ch.action) {
      this.closeDlg();
      const [type, target] = ch.action.split(':');
      if (type === 'open') this.time.delayedCall(200, () => this.openPage?.(target));
      return;
    }
    if (!ch.nextId) { this.closeDlg(); return; }
    this.activeDlg!.lineId = ch.nextId;
    this.renderDlg();
  }

  private closeDlg() {
    this.activeDlg = null;
    this.dlgBox.setVisible(false);
  }

  // ── UI ────────────────────────────────────────────────────────────────────────

  private buildDlgBox() {
    const W = DLG_W;
    const H = DLG_H_MIN;
    const bg = this.add.rectangle(0, 0, W, H, 0x0e0e1c, 0.96).setStrokeStyle(2, 0xf0c040);
    const sp = this.add.text(0, 0, '', {
      fontFamily: '"Press Start 2P"',
      fontSize: '6px',
      color: '#f0c040',
      resolution: 2,
      lineSpacing: 2,
    }).setOrigin(0, 0);
    const bd = this.add.text(0, 0, '', {
      fontFamily: '"Press Start 2P"',
      fontSize: '6px',
      color: '#fff',
      wordWrap: { width: W - DLG_PAD_X * 2 },
      align: 'left',
      lineSpacing: 2,
      resolution: 2,
    }).setOrigin(0, 0);
    this.dlgBox = this.add.container(0, 0, [bg, sp, bd]);
    this.dlgBox.setDepth(2002).setVisible(false);
  }

  private buildPrompt() {
    const bg = this.add.rectangle(0, 0, 180, PROMPT_H, 0x0e0e1c, 0.9).setStrokeStyle(1.5, 0xf0c040);
    const lb = this.add.text(0, 0, '', {
      fontFamily: '"Press Start 2P"',
      fontSize: '6px',
      color: '#fff',
      resolution: 2,
    }).setOrigin(0.5);
    this.promptBox = this.add.container(0, 0, [bg, lb]);
    this.promptBox.setDepth(2001).setVisible(false);
  }

  // ── HELPERS ───────────────────────────────────────────────────────────────────

  private getBuildingMasks(pad: number) {
    return BUILDINGS.map((b) => ({
      x: b.tx * T - pad,
      y: b.ty * T - pad,
      w: b.tw * T + pad * 2,
      h: b.th * T + pad * 2,
    }));
  }

  private rectsOverlap(
    ax: number, ay: number, aw: number, ah: number,
    bx: number, by: number, bw: number, bh: number,
  ) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  private rng(seed: number): () => number {
    let s = seed | 0;
    return () => {
      s = (s * 1664525 + 1013904223) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  }

  // ── DOG ───────────────────────────────────────────────────────────────────
  private createDog() {
    const px = this.playerPhysics.x - 30;
    const py = this.playerPhysics.y - 10;
    
    // Stardew-style Golden Retriever Palette
    const C_DOG = { base: 0xd9a066, shadow: 0xb5743a, contour: 0x854c30, nose: 0x2a1a0a };

    const g = this.add.graphics();
    
    // 1. Shadow (for grounding) [5, 6]
    const shadow = this.add.ellipse(0, 8, 16, 5, 0x000000, 0.15);

    // 2. Draw Body with Contours [3, 7]
    g.fillStyle(C_DOG.contour);
    g.fillRect(-9, -5, 18, 11); // Outer contour
    g.fillStyle(C_DOG.base);
    g.fillRect(-8, -4, 16, 9);   // Inner fill
    g.fillStyle(C_DOG.shadow, 0.4);
    g.fillRect(-8, 2, 16, 3);    // Underside shading [8]

    // 3. Head & Snout [9]
    g.fillStyle(C_DOG.contour);
    g.fillRect(4, -10, 10, 9);   // Head contour
    g.fillStyle(C_DOG.base);
    g.fillRect(5, -9, 8, 7);     // Head fill
    g.fillStyle(C_DOG.nose);
    g.fillRect(12, -6, 3, 3);    // Snout/Nose

    // 4. Ears (Floppy)
    const ear = this.add.rectangle(6, -8, 5, 6, C_DOG.shadow).setOrigin(0.5, 0);

    // 5. Tail (Detailed)
    const tail = this.add.rectangle(-8, -2, 7, 3, C_DOG.shadow).setOrigin(1, 0.5);

    // Invisible physics body so the dog collides with world obstacles/buildings
    this.dogPhysics = this.add.rectangle(px, py, 12, 8, 0, 0);
    this.physics.add.existing(this.dogPhysics);
    (this.dogPhysics.body as Phaser.Physics.Arcade.Body)
      .setCollideWorldBounds(true)
      .setSize(12, 8);
    this.physics.add.collider(this.dogPhysics, this.obstacles);

    this.dog = this.add.container(px, py, [shadow, g, ear, tail]).setDepth(py);

    // Tail Wag
    this.tweens.add({
      targets: tail,
      angle: { from: -15, to: 30 },
      yoyo: true,
      repeat: -1,
      duration: 200,
      ease: 'Sine.easeInOut',
    });

    // 6. Paws (Detailed & Layered)
    // Draw far paws first (darker/further back)
    g.fillStyle(C_DOG.contour);
    g.fillRect(-7, 6, 4, 3); // Back-left paw
    g.fillRect(5, 6, 4, 3);  // Front-left paw

  }

  private updateDog() {
    const body = this.dogPhysics.body as Phaser.Physics.Arcade.Body;
    const dx = this.playerPhysics.x - this.dogPhysics.x;
    const dy = this.playerPhysics.y - this.dogPhysics.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const followDistance = 44;
    const speed = 82;
    body.setVelocity(0);

    if (distance > followDistance) {
      const angle = Math.atan2(dy, dx);
      body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

      if (dx < -2) this.dog.setScale(-1, 1);
      else if (dx > 2) this.dog.setScale(1, 1);
    }

    // Keep sprite synced to physics body and depth-sort by y
    this.dog.x = this.dogPhysics.x;
    this.dog.y = this.dogPhysics.y;
    this.dog.setDepth(this.dog.y);
  }

  // ── LIGHTING ───────────────────────────────────────────────────────────────────
  private createLighting() {

    this.lighting = this.add.rectangle(
      0,
      0,
      this.scale.width,
      this.scale.height,
      0xffa84a,
      0
    )
    .setOrigin(0)
    .setScrollFactor(0)
    .setDepth(1000);
  }

  private updateLighting(delta: number) {

    this.timeOfDay += delta * 0.000015;

    if (this.timeOfDay > 1) {
      this.timeOfDay = 0;
    }

    const intensity = Phaser.Math.Clamp(this.timeOfDay, 0, 1);

    this.lighting.setAlpha(intensity * 0.55);
  }

}
