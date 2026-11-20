import {
  BARREL_AOE_DAMAGE,
  BARREL_AOE_RADIUS,
  BARREL_CONTACT_LOSS,
  CAGE_REWARD,
  ENDLESS_GATE_CYCLE,
  ENDLESS_GATE_PERIOD,
  ENDLESS_GATE_START,
  ENDLESS_MIX,
  ENDLESS_PROP_PERIOD,
  ENDLESS_PROP_START,
  ENEMY,
  GOLD_AMP_MUL,
  GOLD_GATE_AT,
  GOLD_GATE_Z,
  GOLD_NEAR_MUL,
  LANE_HALF,
  LANE_X,
  PROP_EVENTS,
  SCRIPT_ENEMY_END,
  TEAM_Z,
  TIMELINE,
  WARNING_DAMAGE,
  WARNING_FIRST,
  WARNING_TELEGRAPH,
  enemyHpMul,
  endlessHordeInterval,
  inLane,
  inRightLaneGap,
  laneCenterX,
  laneOfX,
  warningPeriod,
  type EnemyId,
  type TimelineEvent,
} from "./config";
import { ads } from "./ads";
import { AudioSys } from "./audio";
import { Bullets } from "./bullets";
import { Enemies, type Enemy } from "./enemies";
import { Gates, chargeGate, type Gate } from "./gates";
import { Input } from "./input";
import { Particles } from "./particles";
import { Props, type WorldProp } from "./props";
import { beginFrame, type Platform } from "./platform";
import {
  drawBullet,
  drawEnemy,
  drawGate,
  drawHud,
  drawLaneWarning,
  drawLegal,
  drawParticle,
  drawProp,
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
  enemies: { type: string; z: number; hp: number; airborne?: boolean }[];
  bullets: number;
  remain: number;
  warning: { lane: "left" | "right"; timeLeft: number } | null;
  props: { kind: string; lane: string; z: number; hp: number }[];
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
  readonly props = new Props();
  readonly particles = new Particles();
  readonly input: Input;
  readonly audio: AudioSys;
  private cursor = 0;
  private propCursor = 0;
  private pendingPairs = new Map<number, number>();
  private nextHordeAt = 0;
  private nextGateAt = 0;
  private endlessGateI = 0;
  private endlessMixI = 0;
  private nextPropAt = 0;
  private endlessPropI = 0;
  private hordeSkipUntil = 0;
  private goldSpawned = false;
  warningLane: "left" | "right" | null = null;
  warningImpactAt = 0;
  private nextWarningAt = 0;
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
        airborne: e.airborne,
      })),
      bullets: this.bullets.pool.size,
      remain: this.time,
      warning: this.warningLane
        ? { lane: this.warningLane, timeLeft: Math.max(0, this.warningImpactAt - this.time) }
        : null,
      props: this.props.pool.active.map((p) => ({
        kind: p.kind,
        lane: p.lane,
        z: p.z,
        hp: p.hp,
      })),
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
    this.propCursor = 0;
    this.pendingPairs.clear();
    this.nextHordeAt = SCRIPT_ENEMY_END + 0.28;
    this.nextGateAt = ENDLESS_GATE_START;
    this.endlessGateI = 0;
    this.endlessMixI = 0;
    this.nextPropAt = ENDLESS_PROP_START;
    this.endlessPropI = 0;
    this.hordeSkipUntil = 0;
    this.goldSpawned = false;
    this.warningLane = null;
    this.warningImpactAt = 0;
    this.nextWarningAt = WARNING_FIRST;
    this.spawned.length = 0;
    this.squad.reset();
    this.enemies.clear();
    this.bullets.clear();
    this.gates.clear();
    this.props.clear();
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
    this.spawnGoldGate();
    this.spawnPropsDue();
    this.updateWarning();
    this.gates.update(dt);
    this.props.update(dt);
    this.enemies.update(dt);
    this.shoot(dt);
    this.bullets.update(dt);
    this.collideBullets();
    this.collideGates();
    this.collideProps();
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
      if (t >= this.hordeSkipUntil && !inRightLaneGap(t)) {
        const a = ENDLESS_MIX[this.endlessMixI % ENDLESS_MIX.length];
        const b = ENDLESS_MIX[(this.endlessMixI + 1) % ENDLESS_MIX.length];
        this.spawnEnemy(a, "right");
        this.spawnEnemy(b, "right");
        this.endlessMixI += 2;
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

  private spawnEnemy(type: EnemyId, lane: "left" | "right", opts?: { x?: number; z?: number; isChild?: boolean }): Enemy | null {
    return this.enemies.spawn(type, lane, {
      ...opts,
      hpMul: enemyHpMul(this.time),
    });
  }

  private spawnGoldGate(): void {
    if (this.goldSpawned || this.time < GOLD_GATE_AT) return;
    this.goldSpawned = true;
    this.gates.spawn({
      kind: "amp",
      lane: "right",
      label: "×2",
      z: GOLD_GATE_Z,
      stationary: true,
    });
  }

  private spawnPropsDue(): void {
    while (this.propCursor < PROP_EVENTS.length && PROP_EVENTS[this.propCursor].time <= this.time) {
      const ev = PROP_EVENTS[this.propCursor++];
      this.props.spawn(ev.kind, ev.lane);
    }
    while (this.time >= this.nextPropAt) {
      const kind = this.endlessPropI % 2 === 0 ? "cage" : "barrel";
      const lane = kind === "cage" ? "left" : "right";
      this.props.spawn(kind, lane);
      this.endlessPropI += 1;
      this.nextPropAt += ENDLESS_PROP_PERIOD;
    }
  }

  private scheduleNextWarning(fromTime: number): void {
    let t = fromTime + warningPeriod(fromTime);
    // 避开成对红门让道窗口，避免和门叠在一起像卡住
    for (let i = 0; i < 4; i++) {
      const impact = t + WARNING_TELEGRAPH;
      if (inRightLaneGap(t) || inRightLaneGap(impact)) {
        t += 2;
        continue;
      }
      break;
    }
    this.nextWarningAt = t;
  }

  private updateWarning(): void {
    if (this.warningLane) {
      if (this.time >= this.warningImpactAt) {
        const lane = this.warningLane;
        this.warningLane = null;
        if (inLane(this.squad.x, lane) && this.squad.count > 0) {
          this.squad.lose(WARNING_DAMAGE);
          this.shake = 0.32;
          this.audio.play("red");
        }
        this.scheduleNextWarning(this.time);
      }
      return;
    }
    if (this.time >= this.nextWarningAt && this.squad.count > 0) {
      this.warningLane = laneOfX(this.squad.x);
      this.warningImpactAt = this.time + WARNING_TELEGRAPH;
    }
  }

  private applyEvent(ev: TimelineEvent): void {
    if (ev.kind === "enemy" && ev.enemy) {
      this.spawnEnemy(ev.enemy, ev.lane);
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

  private bulletCrosses(b: { x: number; z: number; pz: number }, z: number, x: number, half = LANE_HALF): boolean {
    if (Math.abs(b.x - x) > half) return false;
    if (b.pz <= z && b.z >= z) return true;
    return Math.abs(b.z - z) <= 0.8;
  }

  private collideBullets(): void {
    const bullets = this.bullets.pool.active.slice();
    for (const b of bullets) {
      if (!b.alive || !this.bullets.pool.active.includes(b)) continue;

      // 金色增幅门：子弹穿过后翻倍，不消耗
      for (const g of this.gates.ampGates()) {
        if (this.bulletCrosses(b, g.z, g.x)) b.amplified = true;
      }

      // 充能 / 武器 / 倍增门：子弹打中即消耗，不再继续打感染体
      let consumed = false;
      const gateList = this.gates.pool.active.slice();
      for (const g of gateList) {
        if (!g.alive || g.kind === "amp" || g.stationary) continue;
        if (!this.bulletCrosses(b, g.z, g.x)) continue;
        chargeGate(g);
        this.particles.sparks(g.x, 1.2, g.z);
        this.bullets.pool.release(b);
        consumed = true;
        break;
      }
      if (consumed) continue;

      // 人质笼 / 油桶
      const propList = this.props.pool.active.slice();
      for (const p of propList) {
        if (!p.alive) continue;
        if (Math.abs(p.x - b.x) > p.radius + 0.55) continue;
        if (!this.bulletCrosses(b, p.z, p.x, p.radius + 0.7)) continue;
        const broke = this.props.hurt(p, b.damage);
        this.particles.sparks(p.x, 0.7, p.z);
        this.audio.play("hit");
        this.bullets.pool.release(b);
        consumed = true;
        if (broke) this.onPropOpened(p);
        break;
      }
      if (consumed) continue;

      const enemies = this.enemies.pool.active;
      let hitIndex = -1;
      let bestZ = Infinity;
      for (let j = 0; j < enemies.length; j++) {
        const e = enemies[j];
        if (e.airborne) continue;
        if (Math.abs(e.x - b.x) <= e.radius + 0.55 && Math.abs(e.z - b.z) <= 1.4) {
          if (e.z < bestZ) {
            bestZ = e.z;
            hitIndex = j;
          }
        }
      }
      if (hitIndex >= 0) {
        const e = enemies[hitIndex];
        this.particles.sparks(e.x, 0.6 + e.y, e.z);
        this.audio.play("hit");
        const dead = this.enemies.hurt(e, this.damageVs(b, e));
        this.bullets.pool.release(b);
        if (dead) this.onEnemyKilled(e);
      }
    }
  }

  /** 已穿过金门的子弹 ×2；已走过金门、处在门与小队之间的敌人承伤 ×0.5 */
  damageVs(b: { damage: number; amplified: boolean; x: number }, e: { z: number; x: number }): number {
    let dmg = b.damage;
    if (b.amplified) dmg *= GOLD_AMP_MUL;
    for (const g of this.gates.ampGates()) {
      if (Math.abs(e.x - g.x) <= LANE_HALF + 1.2 && e.z < g.z) {
        dmg *= GOLD_NEAR_MUL;
        break;
      }
    }
    return dmg;
  }

  onEnemyKilled(e: Enemy): void {
    if (e.type === "splitter" && !e.isChild) {
      this.spawnSplitlings(e);
    }
    const color = enemyPuffColor(e.type);
    this.particles.puff(e.x, 0.4, e.z, color);
    this.kills += 1;
  }

  private spawnSplitlings(e: Enemy): void {
    const lane = e.x < 0 ? "left" : "right";
    const offsets = [-0.75, 0.75];
    for (const off of offsets) {
      this.spawnEnemy("splitling", lane, {
        x: e.x + off,
        z: e.z + 0.15,
        isChild: true,
      });
    }
  }

  private onPropOpened(p: WorldProp): void {
    if (p.kind === "cage") {
      this.squad.add(CAGE_REWARD);
      this.particles.puff(p.x, 0.6, p.z, "#E8D48A");
      this.audio.play("gate");
      this.props.pool.release(p);
      return;
    }
    this.explodeBarrel(p, false);
  }

  private explodeBarrel(p: WorldProp, onSquad: boolean): void {
    this.particles.burst(p.x, 0.6, p.z, "#E39A3A");
    this.audio.play("red");
    this.shake = Math.max(this.shake, 0.24);
    if (!onSquad) {
      const list = this.enemies.pool.active.slice();
      for (const e of list) {
        if (!e.alive) continue;
        const dx = e.x - p.x;
        const dz = e.z - p.z;
        if (dx * dx + dz * dz <= BARREL_AOE_RADIUS * BARREL_AOE_RADIUS) {
          const dead = this.enemies.hurt(e, BARREL_AOE_DAMAGE);
          if (dead) this.onEnemyKilled(e);
        }
      }
    }
    this.props.pool.release(p);
  }

  private collideGates(): void {
    // 先复制名单再处理：穿过成对门时会同时移除另一扇，直接按下标扫会读到 undefined 并卡死循环。
    const list = this.gates.pool.active.slice();
    for (const g of list) {
      if (!g || !this.gates.pool.active.includes(g)) continue;
      if (g.kind === "amp" || g.stationary) continue;
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

  private collideProps(): void {
    const list = this.props.pool.active.slice();
    for (const p of list) {
      if (!p || !this.props.pool.active.includes(p)) continue;
      if (p.z > TEAM_Z + 0.8) continue;
      const near = Math.abs(p.x - this.squad.x) <= LANE_HALF + 0.35;
      if (p.z <= TEAM_Z + 0.8 && p.z >= TEAM_Z - 1.4 && near) {
        if (p.kind === "barrel") {
          this.explodeBarrel(p, true);
          if (this.squad.iframes <= 0) {
            this.squad.lose(BARREL_CONTACT_LOSS);
            this.shake = 0.28;
          }
        } else {
          // 未打开的人质笼只是错过奖励，不清队
          this.particles.puff(p.x, 0.4, p.z, "#C9C0B0");
          this.props.pool.release(p);
        }
        if (this.squad.count <= 0) return;
      } else if (p.z <= TEAM_Z - 0.8) {
        this.props.pool.release(p);
      }
    }
  }

  private collideEnemies(): void {
    if (this.squad.count <= 0) return;
    const list = this.enemies.pool.active.slice();
    for (const e of list) {
      if (!e || !this.enemies.pool.active.includes(e)) continue;
      if (e.z > TEAM_Z + 1.1) continue;
      const dx = Math.abs(e.x - this.squad.x);
      if (dx > LANE_X * 0.85) {
        if (e.z < TEAM_Z - 0.6) {
          /* 走过未碰上，稍后由 Despawn 回收 */
        }
        continue;
      }
      if (e.z <= TEAM_Z + 1.1 && e.z >= TEAM_Z - 1.4) {
        const loss = ENEMY[e.type].contactLoss;
        const color = enemyPuffColor(e.type);
        if (this.squad.iframes > 0) {
          this.particles.puff(e.x, 0.4, e.z, color);
          this.enemies.pool.release(e);
          continue;
        }
        this.squad.lose(loss);
        this.shake = 0.28;
        this.particles.puff(e.x, 0.4, e.z, color);
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
    if (this.warningLane && this.state === "playing") {
      items.push({
        z: 28,
        draw: () => drawLaneWarning(ctx, this.warningLane!, camX, this.warningImpactAt - this.time),
      });
    }
    for (const g of this.gates.pool.active) {
      items.push({ z: g.z, draw: () => drawGate(ctx, g, camX) });
    }
    for (const p of this.props.pool.active) {
      items.push({ z: p.z, draw: () => drawProp(ctx, p, camX) });
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
        warning: this.warningLane
          ? { lane: this.warningLane, timeLeft: Math.max(0, this.warningImpactAt - this.time) }
          : null,
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

function enemyPuffColor(type: EnemyId): string {
  if (type === "sprinter" || type === "jumper") return "#7BA24A";
  if (type === "bomber") return "#E39A3A";
  if (type === "shield") return "#C4A574";
  if (type === "splitter" || type === "splitling") return "#8FBF88";
  return "#A8D9B8";
}
