import { Pool } from "./pool";

export type ParticleKind = "spark" | "puff";

export interface Particle {
  alive: boolean;
  kind: ParticleKind;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

function resetP(p: Particle): void {
  p.alive = false;
  p.life = 0;
}

export class Particles {
  readonly pool = new Pool<Particle>(80, () => ({
    alive: false,
    kind: "spark",
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    life: 0,
    maxLife: 1,
    size: 4,
    color: "#fff",
  }), resetP);

  clear(): void {
    this.pool.clear();
  }

  sparks(x: number, y: number, z: number): void {
    for (let i = 0; i < 6; i++) {
      const p = this.pool.acquire();
      if (!p) return;
      p.alive = true;
      p.kind = "spark";
      p.x = x;
      p.y = y + 0.4;
      p.z = z;
      const a = (i / 6) * Math.PI * 2;
      p.vx = Math.cos(a) * (2.2 + (i % 3) * 0.6);
      p.vy = 3 + (i % 2);
      p.vz = Math.sin(a) * 1.4;
      p.maxLife = p.life = 0.16;
      p.size = 5;
      p.color = i % 2 === 0 ? "#FFF4A3" : "#FFFFFF";
    }
  }

  puff(x: number, y: number, z: number, color: string): void {
    for (let i = 0; i < 10; i++) {
      const p = this.pool.acquire();
      if (!p) return;
      p.alive = true;
      p.kind = "puff";
      p.x = x + ((i % 5) - 2) * 0.12;
      p.y = y + 0.3;
      p.z = z;
      p.vx = ((i % 5) - 2) * 0.9;
      p.vy = 1.4 + (i % 3) * 0.7;
      p.vz = ((i % 3) - 1) * 0.8;
      p.maxLife = p.life = 0.28;
      p.size = i % 2 === 0 ? 10 : 7;
      p.color = i < 4 ? "#D9DEE8" : color;
    }
  }

  update(dt: number): void {
    const list = this.pool.active;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.vy -= 8 * dt;
      if (p.life <= 0) this.pool.releaseAt(i);
    }
  }
}
