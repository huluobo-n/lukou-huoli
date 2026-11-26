import {
  ALLEY_BANNER,
  ALLEY_SIDE_X,
  ALLEY_SPAWN_Z,
  ALLEY_TELEGRAPH,
  BARREL_AOE_DAMAGE,
  BARREL_AOE_RADIUS,
  BARREL_CONTACT_LOSS,
  ENDLESS_GATE_PERIOD,
  ENDLESS_GATE_PERIOD_LATE,
  ENDLESS_GATE_START,
  ENDLESS_MIX,
  ENDLESS_PROP_PERIOD,
  ENDLESS_PROP_START,
  ENEMY,
  GOLD_AMP_MUL,
  GOLD_GATE_AT,
  GOLD_GATE_LIFE,
  GOLD_GATE_Z,
  GOLD_NEAR_MUL,
  EVENT_GAP,
  GOLD_CLOSE_BANNER,
  GOLD_WARN_SETTLE,
  GOLD_WINDOW_LIFE,
  GOLD_WINDOW_LULL,
  GOLD_WINDOW_Z,
  HOLD_DAMAGE,
  HOLD_DURATION,
  HOLD_MID,
  HOLD_TELEGRAPH,
  LATE_REFILL_LOW,
  LANE_HALF,
  LANE_X,
  MAX_SQUAD,
  MERCY_AT,
  MERCY_MAX_COUNT,
  MERCY_Z,
  NIGHT_HEAVY_LOCK,
  NIGHT_SHIELD_DURATION,
  OPENING_END,
  PINCER_BANNER,
  PINCER_TELEGRAPH,
  PROP_EVENTS,
  RUSH_BANNER,
  RUSH_FIRST,
  RUSH_QUIET,
  RUSH_SPAWN_Z,
  RUSH_TELEGRAPH,
  SCENE_BANNER,
  SCENE_SHIFT_AT,
  STORM_BANNER,
  STORM_DELAY,
  STORM_PERIOD,
  STORM_TELEGRAPH,
  SCRIPT_ENEMY_END,
  SHIELD_GATE_DURATION,
  TEAM_Z,
  TIMELINE,
  WARNING_DAMAGE,
  WARNING_FIRST,
  WARNING_TELEGRAPH,
  alleyBannerText,
  alleySide,
  alleyTime,
  cageRewardAt,
  enemyHpMul,
  endlessGateFor,
  endlessHordeInterval,
  goldWindowTime,
  holdTime,
  lateRefillAmount,
  inLane,
  inRightLaneGap,
  laneCenterX,
  laneOfX,
  pincerTime,
  rushPack,
  rushPeriod,
  softenGate,
  warningPeriod,
  type EnemyId,
  type SceneId,
  type TimelineEvent,
  type WeaponId,
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
  legalMaxScroll,
  resultHit,
  titleHit,
} from "./render";
import type { LegalPage } from "./legal";
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
  warning: { lane: "left" | "right"; timeLeft: number; text: string } | null;
  rush: { timeLeft: number; spawned: boolean } | null;
  banner: { text: string } | null;
  scene: SceneId;
  shieldTime: number;
  quiet: boolean;
  goldSafe: boolean;
  hold: boolean;
  legalPage: LegalPage;
  legalScroll: number;
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
  rushActive = false;
  rushSpawnAt = 0;
  rushUntil = 0;
  rushSpawned = false;
  private nextRushAt = 0;
  runSeed = 1;
  scene: SceneId = "day";
  bannerText: string | null = null;
  legalPage: LegalPage = "summary";
  legalScroll = 0;
  private firstRushDone = false;
  private quietUntil = 0;
  private mercySpawned = false;
  private goldExpiresAt = 0;
  private nextGoldWindowI = 0;
  private namedKind: "pincer" | "alley" | "gold" | "goldEnd" | "scene" | "hold" | "storm" | null = null;
  private namedSpawnAt = 0;
  private namedUntil = 0;
  private namedSpawned = false;
  private nextPincerI = 0;
  private nextAlleyI = 0;
  private nextPincerAt = 0;
  private nextAlleyAt = 0;
  private exclusiveUntil = 0;
  private goldSafeUntil = 0;
  private rightHoldUntil = 0;
  private goldWindowOpen = false;
  private holdStarted = false;
  private holdUntil = 0;
  private nextHoldAt = 0;
  private pendingNightBanner = false;
  private stormStarted = false;
  private nextStormAt = 0;
  private alleyFacing: "both" | "left" | "right" = "both";
  private pendingGoldClose = false;
  private lastRightWarnAt = 0;
  private lastWarnEndAt = 0;
  private lastWarnLane: "left" | "right" | null = null;
  private lastAlleyAt = 0;
  private nightHordeToggle = false;
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
        ? {
            lane: this.warningLane,
            timeLeft: Math.max(0, this.warningImpactAt - this.time),
            text: this.warningLane === "left" ? "躲开左道！" : "躲开右道！",
          }
        : null,
      rush: this.rushActive
        ? { timeLeft: Math.max(0, this.rushSpawnAt - this.time), spawned: this.rushSpawned }
        : null,
      banner: this.currentBanner() ? { text: this.currentBanner()! } : null,
      scene: this.scene,
      shieldTime: this.squad.shieldTime,
      quiet: this.time < this.quietUntil,
      goldSafe: this.isGoldWindowProtected(),
      hold: this.namedKind === "hold" || (this.holdStarted && this.time < this.holdUntil),
      legalPage: this.legalPage,
      legalScroll: this.legalScroll,
      props: this.props.pool.active.map((p) => ({
        kind: p.kind,
        lane: p.lane,
        z: p.z,
        hp: p.hp,
      })),
    };
  }

  beginRun(seed?: number): void {
    this.state = "playing";
    this.time = 0;
    this.runSeed = seed != null ? (seed >>> 0) || 1 : ((Math.random() * 0x7fffffff) | 0) + 1;
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
    this.rushActive = false;
    this.rushSpawnAt = 0;
    this.rushUntil = 0;
    this.rushSpawned = false;
    this.nextRushAt = RUSH_FIRST;
    this.scene = "day";
    this.bannerText = null;
    this.firstRushDone = false;
    this.quietUntil = 0;
    this.mercySpawned = false;
    this.goldExpiresAt = 0;
    this.nextGoldWindowI = 0;
    this.namedKind = null;
    this.namedSpawnAt = 0;
    this.namedUntil = 0;
    this.namedSpawned = false;
    this.nextPincerI = 0;
    this.nextAlleyI = 0;
    this.nextPincerAt = pincerTime(0, this.runSeed);
    this.nextAlleyAt = alleyTime(0, this.runSeed);
    this.exclusiveUntil = 0;
    this.goldSafeUntil = 0;
    this.rightHoldUntil = 0;
    this.goldWindowOpen = false;
    this.holdStarted = false;
    this.holdUntil = 0;
    this.nextHoldAt = holdTime(this.runSeed);
    this.pendingNightBanner = false;
    this.stormStarted = false;
    this.nextStormAt = 0;
    this.alleyFacing = "both";
    this.pendingGoldClose = false;
    this.lastRightWarnAt = 0;
    this.lastWarnEndAt = 0;
    this.lastWarnLane = null;
    this.lastAlleyAt = 0;
    this.nightHordeToggle = false;
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

    if (this.state === "legal") {
      this.legalScroll += this.input.consumeScroll(dt);
      const max = legalMaxScroll(this.legalPage);
      if (this.legalScroll > 0) this.legalScroll = 0;
      if (this.legalScroll < -max) this.legalScroll = -max;
    }

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
    this.spawnMercy();
    this.updateGold();
    this.spawnPropsDue();
    this.relabelActiveGates();
    this.updateScene();
    this.updateWarning();
    this.updateRush();
    this.updateNamed();
    this.updateAlleyDrift();
    this.updateHold();
    this.updateStorm();
    this.gates.update(dt);
    this.props.update(dt);
    const rightMul = this.time < this.rightHoldUntil ? 0 : 1;
    this.enemies.update(dt, rightMul);
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
    const quiet = this.time < this.quietUntil;
    const holdRight = this.time < this.hordeSkipUntil || this.time < this.rightHoldUntil;
    while (this.cursor < TIMELINE.length && TIMELINE[this.cursor].time <= this.time) {
      const ev = TIMELINE[this.cursor++];
      if (ev.kind === "enemy" && (quiet || (holdRight && ev.lane === "right"))) continue;
      // 入夜后脚本段右列减半，降低 1:10–1:45 墙
      if (
        ev.kind === "enemy" &&
        ev.lane === "right" &&
        this.time >= SCENE_SHIFT_AT &&
        this.time < 90
      ) {
        this.nightHordeToggle = !this.nightHordeToggle;
        if (this.nightHordeToggle) continue;
      }
      this.applyEvent(ev);
      this.spawned.push(ev);
    }
  }

  /** 脚本段结束后继续出怪和补门，直到人数归零 */
  private spawnEndless(): void {
    while (this.time >= this.nextHordeAt) {
      const t = this.nextHordeAt;
      if (t >= this.hordeSkipUntil && t >= this.quietUntil && !inRightLaneGap(t)) {
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
      const raw = endlessGateFor(this.endlessGateI, this.runSeed);
      const ev = softenGate(raw, t, this.squad.count, this.squad.peak);
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
      this.nextGateAt += t >= SCENE_SHIFT_AT ? ENDLESS_GATE_PERIOD_LATE : ENDLESS_GATE_PERIOD;
    }
  }

  private spawnEnemy(
    type: EnemyId,
    lane: "left" | "right" | "mid",
    opts?: { x?: number; z?: number; isChild?: boolean; driftX?: number },
  ): Enemy | null {
    return this.enemies.spawn(type, lane, {
      ...opts,
      hpMul: enemyHpMul(this.time),
    });
  }

  private spawnMercy(): void {
    if (this.mercySpawned || this.time < MERCY_AT) return;
    if (this.squad.count > MERCY_MAX_COUNT) {
      this.mercySpawned = true;
      return;
    }
    this.mercySpawned = true;
    const mid = Math.abs(this.squad.x) < 1.2;
    const lane = laneOfX(this.squad.x);
    if (mid) {
      const pair = this.gates.nextPairKey();
      this.gates.spawn({ kind: "add", lane: "left", value: 2, label: "+2", pairKey: pair, z: MERCY_Z });
      this.gates.spawn({ kind: "add", lane: "right", value: 2, label: "+2", pairKey: pair, z: MERCY_Z });
    } else {
      this.gates.spawn({ kind: "add", lane, value: 2, label: "+2", z: MERCY_Z });
    }
  }

  private updateGold(): void {
    if (!this.goldSpawned && this.time >= GOLD_GATE_AT) {
      this.goldSpawned = true;
      this.gates.spawn({
        kind: "amp",
        lane: "right",
        label: "×2",
        z: GOLD_GATE_Z,
        stationary: true,
      });
      this.goldExpiresAt = GOLD_GATE_AT + GOLD_GATE_LIFE;
    }
    if (this.goldExpiresAt > 0 && this.time >= this.goldExpiresAt) {
      const wasWindow = this.goldWindowOpen;
      this.clearAmpGates();
      this.goldExpiresAt = 0;
      this.goldWindowOpen = false;
      if (this.namedKind === "gold") {
        this.namedKind = null;
        this.bannerText = null;
      }
      if (wasWindow) {
        // 门精灵消失后仍要播完「金门关闭！」，躲开右道必须等横幅结束
        this.pendingGoldClose = true;
        this.goldSafeUntil = Math.max(this.goldSafeUntil, this.time + GOLD_CLOSE_BANNER + 1.0);
      }
    }
    if (this.pendingGoldClose && !this.warningLane && this.time >= this.exclusiveUntil) {
      this.showNamed("goldEnd", "金门关闭！", GOLD_CLOSE_BANNER, undefined, true);
      this.goldSafeUntil = Math.max(this.goldSafeUntil, this.namedUntil + 1.0);
      this.pendingGoldClose = false;
    }
    const due = goldWindowTime(this.nextGoldWindowI, this.runSeed);
    if (this.time >= due && this.time >= GOLD_GATE_AT + GOLD_GATE_LIFE) {
      if (this.time < this.exclusiveUntil) return;
      if (this.warningLane || this.rushActive || this.namedKind === "pincer" || this.namedKind === "alley" || this.namedKind === "hold") {
        return;
      }
      // 刚结束的「躲开右道」不要紧接着切到「右道×2！快切」
      if (this.lastRightWarnAt > 0 && this.time - this.lastRightWarnAt < GOLD_WARN_SETTLE) {
        return;
      }
      if (this.nextPincerAt - this.time < 4.2 && this.nextPincerAt >= this.time - 0.2) {
        return;
      }
      this.nextGoldWindowI += 1;
      this.clearAmpGates();
      this.gates.spawn({
        kind: "amp",
        lane: "right",
        label: "×2",
        z: GOLD_WINDOW_Z,
        stationary: true,
      });
      this.goldExpiresAt = this.time + GOLD_WINDOW_LIFE;
      this.goldWindowOpen = true;
      this.hordeSkipUntil = Math.max(this.hordeSkipUntil, this.time + GOLD_WINDOW_LULL);
      this.rightHoldUntil = Math.max(this.rightHoldUntil, this.time + GOLD_WINDOW_LULL);
      // 金门开着的整段，以及「金门关闭！」提示结束前，都不要出躲开右道
      this.goldSafeUntil = Math.max(this.goldSafeUntil, this.goldExpiresAt + GOLD_CLOSE_BANNER);
      this.thinRightColumn();
      this.showNamed("gold", "右道×2！快切", 2.8, undefined, true);
    }
  }

  private isGoldWindowProtected(): boolean {
    if (this.goldWindowOpen || this.pendingGoldClose) return true;
    if (this.namedKind === "goldEnd" && this.time < this.namedUntil) return true;
    return this.time < this.goldSafeUntil && this.goldSafeUntil > 0;
  }

  private goldDueSoon(window = 5): boolean {
    if (this.time < GOLD_GATE_AT + GOLD_GATE_LIFE) return false;
    const due = goldWindowTime(this.nextGoldWindowI, this.runSeed);
    return due - this.time <= window && due >= this.time - 0.25;
  }

  private nightHeavyLocked(): boolean {
    return (
      this.time >= SCENE_SHIFT_AT &&
      this.time < SCENE_SHIFT_AT + NIGHT_HEAVY_LOCK &&
      this.squad.weapon === "heavy" &&
      this.squad.weaponTime > 1
    );
  }

  private thinRightColumn(): void {
    const list = this.enemies.pool.active.slice();
    let kept = 0;
    for (const e of list) {
      if (!e.alive || e.x <= 0.15) continue;
      if (e.z < 18) continue;
      if (e.z <= 52 && kept >= 1) {
        this.particles.puff(e.x, 0.4, e.z, "#C9C0B0");
        this.enemies.pool.release(e);
        continue;
      }
      if (e.z <= 52) kept += 1;
    }
  }

  private clearAmpGates(): void {
    const list = this.gates.pool.active.slice();
    for (const g of list) {
      if (g.kind === "amp") this.gates.pool.release(g);
    }
  }

  private updateScene(): void {
    if (this.scene === "day" && this.time >= SCENE_SHIFT_AT) {
      this.scene = "night";
      this.grantNightStart();
      if (this.warningLane) {
        // 先让躲开提示走完，再独占入夜横幅，避免盖住「躲开左道！」
        this.pendingNightBanner = true;
        const until = Math.max(this.warningImpactAt, this.time) + SCENE_BANNER + 2.2;
        this.pushEventsPast(until);
      } else {
        this.showNightBanner();
      }
    }
    if (this.pendingNightBanner && !this.warningLane) this.showNightBanner();
  }

  private showNightBanner(): void {
    this.pendingNightBanner = false;
    this.showNamed("scene", "进入夜路口！", SCENE_BANNER, undefined, true);
    const settle = this.time + SCENE_BANNER + 6.0;
    this.pushEventsPast(settle);
    this.hordeSkipUntil = Math.max(this.hordeSkipUntil, settle);
  }

  private grantNightStart(): void {
    // 刷新重击并拉长到入夜硬段结束，避免约 1:15 就退回手枪
    this.squad.equip("heavy");
    this.squad.weaponTime = NIGHT_HEAVY_LOCK;
    this.squad.grantShield(NIGHT_SHIELD_DURATION);
  }

  private pushEventsPast(until: number): void {
    if (this.nextWarningAt < until) this.nextWarningAt = until + 0.4;
    if (this.nextRushAt < until) this.nextRushAt = until + 0.8;
    if (this.nextPincerAt < until) this.nextPincerAt = until + 1.2;
    if (this.nextAlleyAt < until) this.nextAlleyAt = until + 1.8;
    if (this.nextHoldAt < until + 4) this.nextHoldAt = until + 6;
  }

  private showNamed(
    kind: "pincer" | "alley" | "gold" | "goldEnd" | "scene" | "hold" | "storm",
    text: string,
    duration: number,
    spawnAt?: number,
    exclusive = false,
  ): void {
    this.namedKind = kind;
    this.bannerText = text;
    this.namedUntil = this.time + duration;
    this.namedSpawned = spawnAt == null;
    this.namedSpawnAt = spawnAt ?? this.time;
    if (exclusive) this.exclusiveUntil = Math.max(this.exclusiveUntil, this.namedUntil);
  }

  private currentBanner(): string | null {
    if (this.warningLane) return this.warningLane === "left" ? "躲开左道！" : "躲开右道！";
    const exclusiveNamed =
      this.namedKind === "scene" ||
      this.namedKind === "gold" ||
      this.namedKind === "goldEnd" ||
      this.namedKind === "hold" ||
      this.namedKind === "storm";
    if (exclusiveNamed && this.time < this.namedUntil && this.bannerText) return this.bannerText;
    if (this.rushActive) return "左道来袭！";
    if (this.namedKind && this.time < this.namedUntil && this.bannerText) return this.bannerText;
    return null;
  }

  private updateNamed(): void {
    if (this.namedKind && this.time >= this.namedUntil && this.namedSpawned) {
      if (this.namedKind === "pincer") {
        this.nextPincerI += 1;
        this.nextPincerAt = pincerTime(this.nextPincerI, this.runSeed);
      }
      if (this.namedKind === "alley") {
        this.nextAlleyI += 1;
        this.nextAlleyAt = alleyTime(this.nextAlleyI, this.runSeed);
      }
      this.namedKind = null;
      this.bannerText = null;
    }
    if (this.namedKind === "pincer" && !this.namedSpawned && this.time >= this.namedSpawnAt) {
      this.spawnPincerPack();
      this.namedSpawned = true;
    }
    if (this.namedKind === "alley" && !this.namedSpawned && this.time >= this.namedSpawnAt) {
      this.spawnAlleyPack();
      this.namedSpawned = true;
    }
    if (this.namedKind === "hold" && !this.namedSpawned && this.time >= this.namedSpawnAt) {
      this.namedSpawned = true;
    }
    if (this.namedKind || this.warningLane || this.rushActive || this.time < this.quietUntil) return;
    if (this.time < this.exclusiveUntil || this.isGoldWindowProtected()) return;
    if (this.pendingNightBanner) return;
    if (this.time >= this.nextPincerAt && this.squad.count > 0) {
      this.showNamed("pincer", "左右夹击！", PINCER_TELEGRAPH + PINCER_BANNER, this.time + PINCER_TELEGRAPH);
      return;
    }
    if (this.time >= this.nextAlleyAt && this.squad.count > 0 && this.scene !== "day") {
      // 刚躲开后先留空档；若巷口已经到期，由预警让路，避免双方互相推迟
      if (this.lastWarnEndAt > 0 && this.time - this.lastWarnEndAt < EVENT_GAP) {
        this.nextAlleyAt = Math.max(this.nextAlleyAt, this.lastWarnEndAt + EVENT_GAP);
        return;
      }
      let side = alleySide(this.nextAlleyI, this.runSeed);
      // 躲开后优先单侧，且不要立刻左右同时插进
      if (this.lastWarnLane && this.time - this.lastWarnEndAt < EVENT_GAP + 3) {
        side = this.lastWarnLane;
      } else if (side === "both" && this.time - this.lastWarnEndAt < EVENT_GAP + 5) {
        side = this.lastWarnLane === "right" ? "left" : "right";
      }
      this.alleyFacing = side;
      this.lastAlleyAt = this.time;
      this.showNamed("alley", alleyBannerText(this.alleyFacing), ALLEY_TELEGRAPH + ALLEY_BANNER, this.time + ALLEY_TELEGRAPH);
    }
  }

  private updateHold(): void {
    if (this.holdStarted) {
      if (this.time >= this.holdUntil) {
        this.holdStarted = false;
        if (Math.abs(this.squad.x) > HOLD_MID && this.squad.count > 0) {
          this.squad.lose(HOLD_DAMAGE);
          this.shake = 0.32;
          this.audio.play("red");
        }
        this.beginStormChapter();
      }
      return;
    }
    if (this.stormStarted || this.scene === "storm" || this.scene === "day") return;
    if (this.time < this.nextHoldAt || this.squad.count <= 0) return;
    if (this.warningLane || this.rushActive || this.namedKind === "pincer" || this.namedKind === "alley") return;
    if (this.isGoldWindowProtected()) return;
    this.scene = "fork";
    this.holdStarted = true;
    this.holdUntil = this.time + HOLD_TELEGRAPH + HOLD_DURATION;
    this.showNamed("hold", "守住中道！", HOLD_TELEGRAPH + HOLD_DURATION, this.time + HOLD_TELEGRAPH, true);
    this.pushEventsPast(this.holdUntil + STORM_DELAY + 2.5);
    this.hordeSkipUntil = Math.max(this.hordeSkipUntil, this.holdUntil + STORM_DELAY);
    this.quietUntil = Math.max(this.quietUntil, this.time + 4);
    this.squad.grantShield(NIGHT_SHIELD_DURATION);
    this.placeHoldMidReward();
  }

  private placeHoldMidReward(): void {
    const list = this.gates.pool.active.slice();
    for (const g of list) {
      if (!g.alive || g.kind === "amp" || g.kind === "red") continue;
      if (g.lane !== "mid" && g.z > 16) this.gates.pool.release(g);
    }
    const atCap = this.squad.count >= 20;
    if (atCap) {
      this.gates.spawn({ kind: "shield", lane: "mid", label: "护盾", z: 38 });
    } else {
      const v = Math.max(LATE_REFILL_LOW, lateRefillAmount(this.squad.count));
      this.gates.spawn({ kind: "add", lane: "mid", value: v, label: "+" + v, z: 38 });
    }
  }

  private beginStormChapter(): void {
    this.scene = "storm";
    this.stormStarted = true;
    this.nextStormAt = this.time + STORM_DELAY;
    this.hordeSkipUntil = Math.max(this.hordeSkipUntil, this.nextStormAt);
    this.quietUntil = Math.max(this.quietUntil, this.time + 6);
    this.squad.grantShield(NIGHT_SHIELD_DURATION);
    this.pushEventsPast(this.nextStormAt + 2);
    this.thinRightColumn();
  }

  private updateStorm(): void {
    if (this.namedKind === "storm" && !this.namedSpawned && this.time >= this.namedSpawnAt) {
      this.spawnStormPack();
      this.namedSpawned = true;
    }
    if (!this.stormStarted || this.scene !== "storm") return;
    if (this.namedKind || this.warningLane || this.rushActive) return;
    if (this.time < this.exclusiveUntil || this.isGoldWindowProtected()) return;
    if (this.time < this.nextStormAt || this.squad.count <= 0) return;
    this.showNamed("storm", "雨夜推进！", STORM_TELEGRAPH + STORM_BANNER, this.time + STORM_TELEGRAPH, true);
    this.nextStormAt = this.time + STORM_PERIOD;
  }

  private spawnStormPack(): void {
    const types: EnemyId[] = this.time >= 200
      ? ["bomber", "jumper", "shield", "splitter"]
      : ["jumper", "sprinter", "bomber", "walker"];
    for (let i = 0; i < types.length; i++) {
      const left = i % 2 === 0;
      const x = left ? -ALLEY_SIDE_X - 0.2 : ALLEY_SIDE_X + 0.2;
      this.spawnEnemy(types[i], "mid", {
        z: ALLEY_SPAWN_Z - i * 1.2,
        x,
        driftX: left ? LANE_X * 0.2 : -LANE_X * 0.2,
      });
    }
  }

  private spawnPincerPack(): void {
    const left = rushPack(this.time);
    const right = this.time >= 80 ? (["shield", "sprinter", "bomber"] as EnemyId[]) : (["walker", "sprinter", "jumper"] as EnemyId[]);
    for (let i = 0; i < left.length; i++) {
      this.spawnEnemy(left[i], "left", { z: RUSH_SPAWN_Z - i * 1.3, x: -LANE_X + (i - 1) * 0.5 });
    }
    for (let i = 0; i < right.length; i++) {
      this.spawnEnemy(right[i], "right", { z: RUSH_SPAWN_Z - i * 1.3, x: LANE_X + (i - 1) * 0.5 });
    }
  }

  private spawnAlleyPack(): void {
    const types: EnemyId[] = this.time >= 100 ? ["jumper", "bomber", "splitter"] : ["jumper", "walker", "sprinter"];
    const side = this.alleyFacing;
    for (let i = 0; i < types.length; i++) {
      let fromLeft = side === "left" || (side === "both" && i % 2 === 0);
      if (side === "right") fromLeft = false;
      const x = fromLeft ? -ALLEY_SIDE_X - i * 0.15 : ALLEY_SIDE_X + i * 0.15;
      this.spawnEnemy(types[i], "mid", {
        z: ALLEY_SPAWN_Z - i * 1.4,
        x,
        driftX: fromLeft ? LANE_X * 0.15 : -LANE_X * 0.15,
      });
    }
  }

  private updateAlleyDrift(): void {
    // 巷口体从路边插向路心，不再每帧追小队，贴边无法躲开
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
        this.lastWarnEndAt = this.time;
        this.lastWarnLane = lane;
        if (lane === "right") this.lastRightWarnAt = this.time;
        if (inLane(this.squad.x, lane) && this.squad.count > 0) {
          this.squad.lose(WARNING_DAMAGE);
          this.shake = 0.32;
          this.audio.play("red");
        }
        this.scheduleNextWarning(this.time);
      }
      return;
    }
    if (this.time >= this.nextWarningAt && this.squad.count > 0 && !this.rushActive && !this.namedKind && this.time >= this.quietUntil && this.time >= this.exclusiveUntil && !this.pendingNightBanner) {
      if (this.namedKind === "alley" || this.time - this.lastAlleyAt < EVENT_GAP) {
        this.nextWarningAt = Math.max(this.nextWarningAt, this.time + 0.8);
        return;
      }
      if (this.scene !== "day" && this.nextAlleyAt > 0 && this.nextAlleyAt - this.time <= EVENT_GAP) {
        this.nextWarningAt = Math.max(this.nextWarningAt, Math.max(this.time, this.nextAlleyAt) + EVENT_GAP);
        return;
      }
      const lane = laneOfX(this.squad.x);
      if (lane === "right" && (this.isGoldWindowProtected() || this.goldDueSoon(5) || this.pendingGoldClose)) {
        const until = Math.max(this.goldSafeUntil, this.time);
        this.nextWarningAt = until + (this.goldDueSoon(5) ? GOLD_WINDOW_LIFE + GOLD_CLOSE_BANNER + 1.0 : 0.6);
        return;
      }
      this.warningLane = lane;
      this.warningImpactAt = this.time + WARNING_TELEGRAPH;
    }
  }

  private scheduleNextRush(fromTime: number): void {
    let t = fromTime + rushPeriod(fromTime);
    for (let i = 0; i < 6; i++) {
      const spawnAt = t + RUSH_TELEGRAPH;
      const warnHit = this.nextWarningAt;
      const overlapsWarn =
        (warnHit > 0 && Math.abs(spawnAt - warnHit) < 2.4) ||
        (warnHit > 0 && Math.abs(t - warnHit) < 2.4) ||
        (this.warningImpactAt > 0 && Math.abs(t - (this.warningImpactAt - WARNING_TELEGRAPH)) < 2.4);
      if (inRightLaneGap(t) || inRightLaneGap(spawnAt) || overlapsWarn) {
        t += 2;
        continue;
      }
      break;
    }
    this.nextRushAt = t;
  }

  private updateRush(): void {
    if (this.rushActive) {
      if (!this.rushSpawned && this.time >= this.rushSpawnAt) {
        const pack = rushPack(this.time);
        for (let i = 0; i < pack.length; i++) {
          this.spawnEnemy(pack[i], "left", {
            z: RUSH_SPAWN_Z - i * 1.35,
            x: -LANE_X + (i - 1) * 0.55,
          });
        }
        this.rushSpawned = true;
      }
      if (this.time >= this.rushUntil) {
        this.rushActive = false;
        this.rushSpawned = false;
        if (!this.firstRushDone) {
          this.firstRushDone = true;
          this.quietUntil = this.time + RUSH_QUIET;
          this.hordeSkipUntil = Math.max(this.hordeSkipUntil, this.quietUntil);
          this.scheduleNextRush(this.quietUntil);
          if (this.nextWarningAt < this.quietUntil + 1.2) this.nextWarningAt = this.quietUntil + 1.6;
        } else {
          this.scheduleNextRush(this.time);
        }
      }
      return;
    }
    if (this.time >= this.nextRushAt && this.squad.count > 0 && !this.warningLane && !this.namedKind && this.time >= this.quietUntil && this.time >= this.exclusiveUntil) {
      // 避开即将打出的红预警，两种提示不要叠在一起
      if (this.nextWarningAt - this.time < RUSH_TELEGRAPH + 1.6) {
        this.nextRushAt = this.nextWarningAt + WARNING_TELEGRAPH + 1.2;
        return;
      }
      this.rushActive = true;
      this.rushSpawned = false;
      this.rushSpawnAt = this.time + RUSH_TELEGRAPH;
      this.rushUntil = this.time + RUSH_BANNER;
    }
  }

  private relabelActiveGates(): void {
    const list = this.gates.pool.active;
    for (const g of list) {
      if (!g.alive || g.kind === "amp" || g.kind === "red") continue;
      if (g.kind === "weapon") {
        if (this.nightHeavyLocked() && g.weapon && g.weapon !== "heavy") {
          g.kind = "shield";
          g.value = 0;
          g.weapon = null;
          g.label = "护盾";
        }
        continue;
      }
      if (this.squad.count >= 20) {
        if (g.kind === "add" || g.kind === "mul" || g.kind === "shield") {
          g.kind = "shield";
          g.value = 0;
          g.weapon = null;
          g.label = "护盾";
        }
        continue;
      }
      if (this.time >= OPENING_END && (g.kind === "add" || g.kind === "mul" || g.kind === "shield")) {
        const v = lateRefillAmount(this.squad.count);
        g.kind = "add";
        g.value = v;
        g.weapon = null;
        g.label = "+" + v;
      }
    }
  }

  private applyEvent(ev: TimelineEvent): void {
    if (ev.kind === "enemy" && ev.enemy) {
      this.spawnEnemy(ev.enemy, ev.lane);
      return;
    }
    if (ev.kind === "gate" && ev.gate) {
      const ev2 = softenGate(ev, this.time, this.squad.count, this.squad.peak);
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
        kind: ev2.gate!,
        lane: ev2.lane,
        value: ev2.value,
        weapon: ev2.weapon,
        label: ev2.label || "",
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
      if (this.bullets.spawn(src.x, src.z, damage, { heavy: this.squad.weapon === "heavy" })) any = true;
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
        chargeGate(g, this.time >= OPENING_END ? lateRefillAmount(this.squad.count) : undefined);
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
        const dead = this.enemies.hurt(e, this.damageVs(b, e), { pierce: b.heavy });
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
      this.squad.add(cageRewardAt(this.time, this.squad.peak));
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
      const id = g.weapon as WeaponId;
      if (this.nightHeavyLocked() && id !== "heavy") {
        this.squad.grantShield(SHIELD_GATE_DURATION);
        this.audio.play("gate");
      } else {
        this.squad.equip(id in { smg: 1, heavy: 1 } ? id : "pistol");
        this.audio.play("weapon");
      }
    } else if (g.kind === "shield") {
      this.squad.grantShield(SHIELD_GATE_DURATION);
      this.audio.play("gate");
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
      else if (hit === "legal") {
        this.legalPage = "summary";
        this.legalScroll = 0;
        this.state = "legal";
      }
      return;
    }
    if (this.state === "legal") {
      const hit = legalHit(x, y, this.legalPage);
      if (hit === "back") {
        if (this.legalPage === "summary") this.state = "title";
        else {
          this.legalPage = "summary";
          this.legalScroll = 0;
        }
      } else if (hit === "privacy" || hit === "age") {
        this.legalPage = hit;
        this.legalScroll = 0;
      }
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

    drawWorld(ctx, camX, this.animTime, sh, sv, this.scene, this.namedKind === "hold" || (this.holdStarted && this.time < this.holdUntil));

    type DrawItem = { z: number; draw: () => void };
    const items: DrawItem[] = [];
    if (this.warningLane && this.state === "playing") {
      items.push({
        z: 28,
        draw: () => drawLaneWarning(ctx, this.warningLane!, camX, this.warningImpactAt - this.time),
      });
    } else if (this.rushActive && this.state === "playing") {
      items.push({
        z: 28,
        draw: () => drawLaneWarning(ctx, "left", camX, this.rushSpawnAt - this.time, "rush"),
      });
    } else if (this.namedKind === "pincer" && this.state === "playing") {
      items.push({
        z: 28,
        draw: () => {
          drawLaneWarning(ctx, "left", camX, this.namedSpawnAt - this.time, "rush");
          drawLaneWarning(ctx, "right", camX, this.namedSpawnAt - this.time, "warn");
        },
      });
    } else if (this.namedKind === "alley" && this.state === "playing") {
      items.push({
        z: 28,
        draw: () => {
          const side = this.alleyFacing;
          if (side === "left" || side === "both") drawLaneWarning(ctx, "left", camX, this.namedSpawnAt - this.time, "alley");
          if (side === "right" || side === "both") drawLaneWarning(ctx, "right", camX, this.namedSpawnAt - this.time, "alley");
        },
      });
    } else if (this.namedKind === "hold" && this.state === "playing") {
      items.push({
        z: 26,
        draw: () => drawLaneWarning(ctx, "mid", camX, this.namedSpawnAt - this.time, "hold"),
      });
    } else if (this.namedKind === "storm" && this.state === "playing") {
      items.push({
        z: 28,
        draw: () => {
          drawLaneWarning(ctx, "left", camX, this.namedSpawnAt - this.time, "alley");
          drawLaneWarning(ctx, "right", camX, this.namedSpawnAt - this.time, "alley");
        },
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
        weapon: this.squad.weapon,
        weaponTime: this.squad.weaponTime,
        remain: this.time,
        fireBonus: this.squad.fireBonus,
        muted: this.audio.muted,
        hint: this.hint,
        kills: this.kills,
        shieldTime: this.squad.shieldTime,
        warning: this.warningLane
          ? { lane: this.warningLane, timeLeft: Math.max(0, this.warningImpactAt - this.time) }
          : null,
        rush: this.rushActive
          ? { timeLeft: Math.max(0, this.rushSpawnAt - this.time), spawned: this.rushSpawned }
          : null,
        banner: this.currentBanner(),
      });
    } else if (this.state === "title") {
      drawTitle(ctx, this.best, this.audio.muted);
    } else if (this.state === "legal") {
      drawLegal(ctx, this.legalPage, this.legalScroll);
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
