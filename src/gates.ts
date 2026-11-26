import {
  BASE_SPEED,
  DESPAWN_Z,
  GATE_CHARGE_CAP,
  LANE_HALF,
  LANE_X,
  SPAWN_Z,
  formatGateLabel,
  type GateKind,
  type WeaponId,
} from "./config";
import { Pool } from "./pool";

export interface Gate {
  alive: boolean;
  kind: GateKind;
  lane: "left" | "right" | "mid";
  x: number;
  z: number;
  value: number;
  weapon: WeaponId | null;
  label: string;
  consumed: boolean;
  pairKey: number;
  /** 金色增幅门停在中距，不随道路滑向小队 */
  stationary: boolean;
}

function resetG(g: Gate): void {
  g.alive = false;
  g.consumed = false;
  g.stationary = false;
}

export function gateSignedValue(g: { kind: GateKind; value: number }): number {
  if (g.kind === "red") return -g.value;
  return g.value;
}

/** 开枪给加减门充能：显示整数 +1，红门可翻成蓝门。已到上限则不变。 */
export function chargeGate(g: Gate, cap = GATE_CHARGE_CAP): boolean {
  if (g.kind !== "add" && g.kind !== "red") return false;
  const current = gateSignedValue(g);
  if (current >= cap) return false;
  const signed = current + 1;
  if (signed >= 0) {
    g.kind = "add";
    g.value = signed;
    g.label = formatGateLabel("add", signed);
  } else {
    g.kind = "red";
    g.value = -signed;
    g.label = formatGateLabel("red", signed);
  }
  return true;
}

export class Gates {
  readonly pool = new Pool<Gate>(12, () => ({
    alive: false,
    kind: "add",
    lane: "left",
    x: 0,
    z: SPAWN_Z,
    value: 0,
    weapon: null,
    label: "",
    consumed: false,
    pairKey: 0,
    stationary: false,
  }), resetG);

  private pairSeq = 1;

  clear(): void {
    this.pool.clear();
    this.pairSeq = 1;
  }

  /** 同一时刻两道的门使用相同 pairKey，走过一道则另一道消失 */
  spawn(opts: {
    kind: GateKind;
    lane: "left" | "right" | "mid";
    value?: number;
    weapon?: WeaponId;
    label: string;
    pairKey?: number;
    z?: number;
    stationary?: boolean;
  }): Gate | null {
    const g = this.pool.acquire();
    if (!g) return null;
    g.alive = true;
    g.kind = opts.kind;
    g.lane = opts.lane;
    g.x = opts.lane === "left" ? -LANE_X : opts.lane === "mid" ? 0 : LANE_X;
    g.z = opts.z ?? SPAWN_Z;
    g.value = opts.value ?? 0;
    g.weapon = opts.weapon ?? null;
    g.label = opts.label;
    g.consumed = false;
    g.pairKey = opts.pairKey ?? 0;
    g.stationary = !!opts.stationary;
    return g;
  }

  nextPairKey(): number {
    return this.pairSeq++;
  }

  update(dt: number): void {
    const list = this.pool.active;
    for (let i = list.length - 1; i >= 0; i--) {
      const g = list[i];
      if (!g.stationary) g.z -= BASE_SPEED * dt;
      if ((!g.stationary && g.z < DESPAWN_Z) || !g.alive) this.pool.releaseAt(i);
    }
  }

  removePair(pairKey: number): void {
    if (!pairKey) return;
    const list = this.pool.active;
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].pairKey === pairKey) this.pool.releaseAt(i);
    }
  }

  overlaps(gate: Gate, teamX: number): boolean {
    return Math.abs(gate.x - teamX) <= LANE_HALF;
  }

  ampGates(): Gate[] {
    return this.pool.active.filter((g) => g.kind === "amp" && g.alive);
  }
}
