import {
  ENDLESS_GATE_CYCLE,
  ENDLESS_GATE_PERIOD,
  ENDLESS_GATE_START,
  LANE_X,
  SCRIPT_ENEMY_END,
  TEAM_Z,
  TIMELINE,
  endlessHordeInterval,
  type TimelineEvent,
} from "./config";
import { ads } from "./ads";
import { AudioSys } from "./audio";
import { Bullets } from "./bullets";
import { Enemies } from "./enemies";
import { Gates } from "./gates";
import { Input } from "./input";
import { Particles } from "./particles";
import { beginFrame, type Platform } from "./platform";
import {
  drawBullet,
  drawEnemy,
  drawGate,
  drawHud,
  drawLegal,
  drawParticle,
  drawResult,
  drawSquad,
  drawTitle,
  drawWorld,
  hitMute,
  legalHit,
  resultHit,
  titleHit,
} from "./render";
import { Squad } from "./squad";
import { loadBest, saveBest, type BestRecord } from "./storage";

export type GameState = "title" | "legal" | "playing" | "win" | "fail";

export interface PublicState {
  state: GameState;
  time: number;
  squadCount: number;
  weapon: string;
  weaponTime: number;
  kills: number;
  peak: number;
  fireBonus: number;
  iframes: number;
  hint: boolean;
  gates: { lane: string; kind: string; label: string; z: number; timeAppeared: number }[];
  enemies: { type: string; z: number; hp: number }[];
  bullets: number;
  remain: number;
}

export class Game {
  state: GameState = "title";
  time = 0;
  timeScale = 1;
  animTime = 0;
  kills = 0;
  best: BestRecord;
  hint = true;
  hintTimer = 0;
  shake = 0;
  readonly squad = new Squad();
  readonly enemies = new Enemies();
  readonly bullets = new Bullets();
  readonly gates = new Gates();
  readonly particles = new Particles();
  readonly input: Input;
  readonly audio: AudioSys;
  private cursor = 0;
  private pendingPairs = new Map<number, number>();
  private nextHordeAt = 0;
  private nextGateAt = 0;
  private endlessGateI = 0;
  private hordeSkipUntil = 0;
  paused = false;
  private running = false;
  private lastTs = 0;
  private rafId = 0;
  /** 记录各事件是否已生成，供测试查询 */
  readonly spawned: TimelineEvent[] = [];

  constructor(readonly platform: Platform) {
    this.input = new Input(platform);
    this.audio = new AudioSys(platform);
    this.best = loadBest(platform);
    this.squad.reset();
    platform.onResize(() => platform.layout());
  }

  startLoop(): void {
    if (this.running) return;
    this.running = true;
    this.lastTs = this.platform.now();
    const tick = () => {
      const now = this.platform.now();
      let dt = (now - this.lastTs) / 1000;
      this.lastTs = now;
      if (dt > 0.05) dt = 0.05;
      if (!this.paused) {
        const scaled = dt * this.timeScale;
        this.animTime += scaled;
        this.update(scaled);
      }
      this.draw();
      this.rafId = this.platform.raf(tick);
    };
    this.rafId = this.platform.raf(tick);
  }

  /** 供测试：推进逻辑而不依赖 rAF */
  step(dt: number): void {
    const slice = 1 / 60;
    let left = dt;
    while (left > 0) {
      const d = Math.min(slice, left);
      this.update(d * this.timeScale);
      left -= d;
    }
  }

  getState(): PublicState {
    return {
      state: this.state,
      time: this.time,
      squadCount: this.squad.count,
      weapon: this.squad.weapon,
      weaponTime: this.squad.weaponTime,
      kills: this.kills,
      peak: this.squad.peak,
      fireBonus: this.squad.fireBonus,
      iframes: this.squad.iframes,
      hint: this.hint,
      gates: this.gates.pool.active.map((g) => ({
        lane: g.lane,
        kind: g.kind,
        label: g.label,
        z: g.z,
        timeAppeared: 0,
      })),
      enemies: this.enemies.pool.active.map((e) => ({
        type: e.type,
        z: e.z,
        hp: e.hp,
      })),
      bullets: this.bullets.pool.size,
      remain: this.time,
    };
  }

  beginRun(): void {
    this.state = "playing";
    this.time = 0;
    this.kills = 0;
    this.hint = true;
    this.hintTimer = 0;
    this.shake = 0;
    this.cursor = 0;
    this.pendingPairs.clear();
    this.nextHordeAt = SCRIPT_ENEMY_END + 0.28;
    this.nextGateAt = ENDLESS_GATE_START;
    this.endlessGateI = 0;
    this.hordeSkipUntil = 0;
    this.spawned.length = 0;
    this.squad.reset();
    this.enemies.clear();
    this.bullets.clear();
    this.gates.clear();
    this.particles.clear();
    this.squad.x = LANE_X;
    this.input.targetX = LANE_X;
    this.input.swiped = false;
    ads.enabled = false;
  }

  private update(dt: number): void {
    const clicks = this.input.consumeClicks();
    for (const c of clicks) this.handleClick(c.x, c.y);

    if (this.state !== "playing") return;

    this.time += dt;
    this.hintTimer += dt;
    if (this.input.swiped || this.hintTimer >= 3) {
      if (this.input.swiped) this.hint = false;
      else if (this.hintTimer >= 3) this.hint = false;
    }

    const target = this.input.update(dt, this.squad.x);
    this.squad.update(dt, target);
    this.spawnDue();
    this.spawnEndless();
    this.gates.update(dt);
    this.enemies.update(dt);
    this.shoot(dt);
    this.bullets.update(dt);
    this.collideBullets();
    this.collideGates();
    this.collideEnemies();
    this.particles.update(dt);
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt);

    if (this.squad.count <= 0) {
      this.endRun();
      return;
    }
  }

  private spawnDue(): void {
    while (this.cursor < TIMELINE.length && TIMELINE[this.cursor].time <= this.time) {
      const ev = TIMELINE[this.cursor++];
      this.applyEvent(ev);
      this.spawned.push(ev);
    }
  }

  /** 脚本段结束后继续出怪和补门，直到人数归零 */
  private spawnEndless(): void {
    while (this.time >= this.nextHordeAt) {
      const t = this.nextHordeAt;
      if (t >= this.hordeSkipUntil) {
        this.enemies.spawn("walker", "right");
        this.enemies.spawn("sprinter", "right");
      }
      this.nextHordeAt += endlessHordeInterval(t);
    }
    while (this.time >= this.nextGateAt) {
      const t = this.nextGateAt;
      const ev = ENDLESS_GATE_CYCLE[this.endlessGateI % ENDLESS_GATE_CYCLE.length];
      const pair = this.endlessGateI % 4 === 3;
      const pairKey = pair ? this.gates.nextPairKey() : 0;
      this.gates.spawn({
        kind: ev.gate!,
        lane: ev.lane,
        value: ev.value,
        weapon: ev.weapon,
        label: ev.label || "",
        pairKey,
      });
      if (pair) {
        this.gates.spawn({
          kind: "red",
          lane: "right",
          value: 3,
          label: "-3",
          pairKey,
        });
        this.hordeSkipUntil = t + 1.3;
      }
      this.endlessGateI += 1;
      this.nextGateAt += ENDLESS_GATE_PERIOD;
    }
  }

  private applyEvent(ev: TimelineEvent): void {
    if (ev.kind === "enemy" && ev.enemy) {
      this.enemies.spawn(ev.enemy, ev.lane);
      return;
    }
    if (ev.kind === "gate" && ev.gate) {
      const tKey = Math.round(ev.time * 100);
      let pairKey = this.pendingPairs.get(tKey) ?? 0;
      const sameTimeOther = TIMELINE.some(
        (o, i) => i !== this.cursor - 1 && o.kind === "gate" && Math.abs(o.time - ev.time) < 0.001,
      );
      if (sameTimeOther) {
        if (!pairKey) {
          pairKey = this.gates.nextPairKey();
          this.pendingPairs.set(tKey, pairKey);
        }
      }
      this.gates.spawn({
        kind: ev.gate,
        lane: ev.lane,
        value: ev.value,
        weapon: ev.weapon,
        label: ev.label || "",
        pairKey,
      });
    }
  }

  private shoot(dt: number): void {
    const shots = this.squad.tryFire(dt);
    if (!shots.length) return;
    const room = Math.max(0, this.bullets.pool.max - this.bullets.pool.size);
    if (room <= 0) return;
    const n = Math.min(shots.length, room);
    const damage = shots[0].damage * (shots.length / n);
    let any = false;
    for (let i = 0; i < n; i++) {
      const src = shots[Math.floor((i * shots.length) / n)];
      if (this.bullets.spawn(src.x, src.z, damage)) any = true;
    }
    if (any) this.audio.play("shoot");
  }

  private collideBullets(): void {
    const bullets = this.bullets.pool.active;
    const enemies = this.enemies.pool.active;
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      let hitIndex = -1;
      let bestZ = Infinity;
      for (let j = 0; j < enemies.length; j++) {
        const e = enemies[j];
        if (Math.abs(e.x - b.x) <= e.radius + 0.55 && Math.abs(e.z - b.z) <= 1.4) {
          if (e.z < bestZ) {
            bestZ = e.z;
            hitIndex = j;
          }
        }
      }
      if (hitIndex >= 0) {
        const e = enemies[hitIndex];
        this.particles.sparks(e.x, 0.6, e.z);
        this.audio.play("hit");
        const dead = this.enemies.hurt(e, b.damage);
        this.bullets.pool.release(b);
        if (dead) {
          const color = e.type === "sprinter" ? "#7BA24A" : "#A8D9B8";
          this.particles.puff(e.x, 0.4, e.z, color);
          this.kills += 1;
        }
      }
    }
  }

  private collideGates(): void {
    // 先复制名单再处理：穿过成对门时会同时移除另一扇，直接按下标扫会读到 undefined 并卡死循环。
    const list = this.gates.pool.active.slice();
    for (const g of list) {
      if (!g || !this.gates.pool.active.includes(g)) continue;
      if (g.z > TEAM_Z + 0.6) continue;
      if (this.gates.overlaps(g, this.squad.x) && !g.consumed) {
        g.consumed = true;
        const pair = g.pairKey;
        this.applyGate(g);
        this.gates.pool.release(g);
        if (pair) this.gates.removePair(pair);
      } else if (g.z <= TEAM_Z - 0.8) {
        this.gates.pool.release(g);
      }
    }
  }

  private applyGate(g: { kind: string; value: number; weapon: string | null }): void {
    if (g.kind === "add") {
      this.squad.add(g.value);
      this.audio.play("gate");
    } else if (g.kind === "mul") {
      this.squad.mul(g.value);
      this.audio.play("gate");
    } else if (g.kind === "red") {
      this.squad.lose(g.value);
      this.shake = 0.22;
      this.audio.play("red");
    } else if (g.kind === "weapon" && g.weapon) {
      this.squad.equip(g.weapon === "smg" ? "smg" : "pistol");
      this.audio.play("weapon");
    }
  }

  private collideEnemies(): void {
    if (this.squad.count <= 0) return;
    const list = this.enemies.pool.active;
    for (let i = list.length - 1; i >= 0; i--) {
      const e = list[i];
      if (e.z > TEAM_Z + 1.1) continue;
      const dx = Math.abs(e.x - this.squad.x);
      if (dx > LANE_X * 0.85) {
        if (e.z < TEAM_Z - 0.6) {
          /* 走过未碰上，稍后由 Despawn 回收 */
        }
        continue;
      }
      if (e.z <= TEAM_Z + 1.1 && e.z >= TEAM_Z - 1.4) {
        if (this.squad.iframes > 0) {
          this.particles.puff(e.x, 0.4, e.z, e.type === "sprinter" ? "#7BA24A" : "#A8D9B8");
          this.enemies.pool.release(e);
          continue;
        }
        this.squad.lose(1);
        this.shake = 0.28;
        this.particles.puff(e.x, 0.4, e.z, e.type === "sprinter" ? "#7BA24A" : "#A8D9B8");
        this.audio.play("red");
        this.enemies.pool.release(e);
        if (this.squad.count <= 0) return;
      }
    }
  }

  private endRun(): void {
    this.state = "fail";
    this.best = saveBest(
      this.platform,
      { kills: this.kills, peakCount: this.squad.peak, time: this.time },
      this.best,
    );
    this.audio.play("fail");
  }

  private handleClick(x: number, y: number): void {
    this.audio.unlock();
    if (this.state === "playing") {
      if (hitMute(x, y)) this.audio.toggle();
      return;
    }
    if (this.state === "title") {
      if (hitMute(x, y)) {
        this.audio.toggle();
        return;
      }
      const hit = titleHit(x, y);
      if (hit === "start") this.beginRun();
      else if (hit === "legal") this.state = "legal";
      return;
    }
    if (this.state === "legal") {
      if (legalHit(x, y)) this.state = "title";
      return;
    }
    if (this.state === "win" || this.state === "fail") {
      if (resultHit(x, y)) this.beginRun();
    }
  }

  drawFrame(): void {
    this.draw();
  }

  private draw(): void {
    beginFrame(this.platform);
    const ctx = this.platform.ctx;
    const camX = this.squad.x * 0.32;
    const sh = this.shake > 0 ? (Math.random() * 2 - 1) * 10 * this.shake : 0;
    const sv = this.shake > 0 ? (Math.random() * 2 - 1) * 8 * this.shake : 0;

    drawWorld(ctx, camX, this.animTime, sh, sv);

    type DrawItem = { z: number; draw: () => void };
    const items: DrawItem[] = [];
    for (const g of this.gates.pool.active) {
      items.push({ z: g.z, draw: () => drawGate(ctx, g, camX) });
    }
    for (const e of this.enemies.pool.active) {
      items.push({ z: e.z, draw: () => drawEnemy(ctx, e, camX) });
    }
    for (const b of this.bullets.pool.active) {
      items.push({ z: b.z, draw: () => drawBullet(ctx, b, camX) });
    }
    for (const p of this.particles.pool.active) {
      items.push({ z: p.z, draw: () => drawParticle(ctx, p, camX) });
    }
    items.sort((a, b) => b.z - a.z);
    ctx.save();
    ctx.translate(sh, sv);
    for (const it of items) it.draw();
    drawSquad(ctx, this.squad, camX);
    ctx.restore();

    if (this.state === "playing") {
      drawHud(ctx, {
        count: this.squad.count,
        weapon: this.squad.weapon === "smg" ? "smg" : "pistol",
        weaponTime: this.squad.weaponTime,
        remain: this.time,
        fireBonus: this.squad.fireBonus,
        muted: this.audio.muted,
        hint: this.hint,
      });
    } else if (this.state === "title") {
      drawTitle(ctx, this.best, this.audio.muted);
    } else if (this.state === "legal") {
      drawLegal(ctx);
    } else {
      drawResult(ctx, this.kills, this.time, this.squad.peak, this.best);
    }
  }
}

