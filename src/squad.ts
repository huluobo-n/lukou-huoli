import {
  HIT_IFRAMES,
  LANE_X,
  MAX_SQUAD,
  OVERFLOW_BONUS_DURATION,
  OVERFLOW_BONUS_MUL,
  TEAM_Z,
  WEAPONS,
  type WeaponId,
} from "./config";
import { clamp, expDamp } from "./utils";
import { Pool } from "./pool";

export interface Soldier {
  alive: boolean;
  slot: number;
  flash: number;
  bob: number;
}

function rowCountFor(n: number): number {
  if (n <= 2) return 1;
  if (n <= 8) return 2;
  if (n <= 15) return 3;
  return 4;
}

/** 3–4 排队形：4 人是 2×2，20 人是 5×4，始终从前排往中心排。 */
function layout(n: number): { x: number; z: number }[] {
  const count = Math.max(0, Math.min(MAX_SQUAD, n));
  if (count === 0) return [];
  const rows = rowCountFor(count);
  const base = Math.floor(count / rows);
  const extra = count % rows;
  const counts: number[] = [];
  for (let r = 0; r < rows; r++) counts.push(base + (r < extra ? 1 : 0));
  const spacingX = 0.7;
  const spacingZ = 0.72;
  const out: { x: number; z: number }[] = [];
  const zFront = ((rows - 1) * spacingZ) / 2;
  for (let r = 0; r < rows; r++) {
    const z = rows === 1 ? 0.15 : zFront - r * spacingZ;
    const c = counts[r];
    const start = -((c - 1) * spacingX) / 2;
    for (let i = 0; i < c; i++) out.push({ x: start + i * spacingX, z });
  }
  return out;
}

function resetS(s: Soldier): void {
  s.alive = false;
  s.flash = 0;
  s.bob = 0;
}

export class Squad {
  x = 0;
  z = TEAM_Z;
  count = 1;
  peak = 1;
  weapon: WeaponId = "pistol";
  weaponTime = 0;
  iframes = 0;
  fireBonus = 0;
  fireCd = 0;
  readonly pool = new Pool<Soldier>(MAX_SQUAD, () => ({
    alive: false,
    slot: 0,
    flash: 0,
    bob: 0,
  }), resetS);

  reset(): void {
    this.x = 0;
    this.z = TEAM_Z;
    this.count = 1;
    this.peak = 1;
    this.weapon = "pistol";
    this.weaponTime = 0;
    this.iframes = 0;
    this.fireBonus = 0;
    this.fireCd = 0;
    this.pool.clear();
    this.syncMembers();
  }

  get fireMul(): number {
    return this.fireBonus > 0 ? OVERFLOW_BONUS_MUL : 1;
  }

  get weaponDef() {
    return WEAPONS[this.weapon];
  }

  slotOf(index: number): { x: number; z: number } {
    const slots = layout(this.count);
    return slots[index] ?? slots[0] ?? { x: 0, z: 0 };
  }

  setCount(n: number): void {
    this.count = clamp(n, 0, MAX_SQUAD);
    if (this.count > this.peak) this.peak = this.count;
    this.syncMembers();
  }

  /** 加人 / 倍增，超出 20 的部分转为 3 秒射速加成 */
  grow(next: number): { applied: number; overflow: number } {
    const overflow = Math.max(0, next - MAX_SQUAD);
    const applied = Math.min(MAX_SQUAD, Math.max(0, next));
    this.setCount(applied);
    if (overflow > 0) this.fireBonus = OVERFLOW_BONUS_DURATION;
    return { applied, overflow };
  }

  add(n: number): { applied: number; overflow: number } {
    return this.grow(this.count + n);
  }

  mul(n: number): { applied: number; overflow: number } {
    return this.grow(this.count * n);
  }

  lose(n: number): void {
    this.setCount(Math.max(0, this.count - n));
    this.iframes = HIT_IFRAMES;
    for (const s of this.pool.active) s.flash = 0.22;
  }

  equip(id: WeaponId): void {
    this.weapon = id;
    this.weaponTime = WEAPONS[id].duration === Infinity ? 0 : WEAPONS[id].duration;
  }

  update(dt: number, targetX: number): void {
    this.x = expDamp(this.x, clamp(targetX, -LANE_X, LANE_X), 10, dt);
    if (this.iframes > 0) this.iframes = Math.max(0, this.iframes - dt);
    if (this.fireBonus > 0) this.fireBonus = Math.max(0, this.fireBonus - dt);
    if (this.weapon !== "pistol") {
      this.weaponTime -= dt;
      if (this.weaponTime <= 0) {
        this.weapon = "pistol";
        this.weaponTime = 0;
      }
    }
    const list = this.pool.active;
    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      s.bob += dt * 8;
      if (s.flash > 0) s.flash = Math.max(0, s.flash - dt);
    }
  }

  /** 每次齐射：每个小兵从自己的位置发出一发，互不重叠到同一条弹道 */
  tryFire(dt: number): { damage: number; x: number; z: number }[] {
    if (this.count <= 0) return [];
    const def = this.weaponDef;
    const rate = def.rate * this.fireMul;
    this.fireCd -= dt;
    if (this.fireCd > 0) return [];
    this.fireCd += 1 / Math.max(rate, 0.01);
    const shots: { damage: number; x: number; z: number }[] = [];
    for (let i = 0; i < this.count; i++) {
      const slot = this.slotOf(i);
      shots.push({
        damage: def.damage,
        x: this.x + slot.x,
        z: this.z + slot.z,
      });
    }
    return shots;
  }

  private syncMembers(): void {
    this.pool.clear();
    for (let i = 0; i < this.count; i++) {
      const s = this.pool.acquire();
      if (!s) break;
      s.alive = true;
      s.slot = i;
      s.flash = 0;
      s.bob = i * 0.4;
    }
  }
}
