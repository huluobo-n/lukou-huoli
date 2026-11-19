import { BASE_SPEED, DESPAWN_Z, LANE_HALF, LANE_X, SPAWN_Z, type GateKind, type WeaponId } from "./config";
import { Pool } from "./pool";

export interface Gate {
  alive: boolean;
  kind: GateKind;
  lane: "left" | "right";
  x: number;
  z: number;
  value: number;
  weapon: WeaponId | null;
  label: string;
  consumed: boolean;
  pairKey: number;
}

function resetG(g: Gate): void {
  g.alive = false;
  g.consumed = false;
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
  }), resetG);

  private pairSeq = 1;

  clear(): void {
    this.pool.clear();
    this.pairSeq = 1;
  }

  /** 同一时刻两道的门使用相同 pairKey，走过一道则另一道消失 */
  spawn(opts: {
    kind: GateKind;
    lane: "left" | "right";
    value?: number;
    weapon?: WeaponId;
    label: string;
    pairKey?: number;
  }): Gate | null {
    const g = this.pool.acquire();
    if (!g) return null;
    g.alive = true;
    g.kind = opts.kind;
    g.lane = opts.lane;
    g.x = opts.lane === "left" ? -LANE_X : LANE_X;
    g.z = SPAWN_Z;
    g.value = opts.value ?? 0;
    g.weapon = opts.weapon ?? null;
    g.label = opts.label;
    g.consumed = false;
    g.pairKey = opts.pairKey ?? 0;
    return g;
  }

  nextPairKey(): number {
    return this.pairSeq++;
  }

  update(dt: number): void {
    const list = this.pool.active;
    for (let i = list.length - 1; i >= 0; i--) {
      const g = list[i];
      g.z -= BASE_SPEED * dt;
      if (g.z < DESPAWN_Z || !g.alive) this.pool.releaseAt(i);
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
}
