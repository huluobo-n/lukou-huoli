import { CANVAS_W, LANE_X } from "./config";
import type { Platform, PointerSample } from "./platform";

export class Input {
  targetX = 0;
  dragging = false;
  swiped = false;
  private pointerId: number | null = null;
  private lastX = 0;
  private keys = new Set<string>();
  readonly clicks: { x: number; y: number }[] = [];

  constructor(private readonly platform: Platform) {
    platform.onPointerDown((p) => this.down(p));
    platform.onPointerMove((p) => this.move(p));
    platform.onPointerUp((p) => this.up(p));
    platform.onKeyDown((k) => this.keys.add(k));
    platform.onKeyUp((k) => this.keys.delete(k));
  }

  reset(): void {
    this.targetX = 0;
    this.dragging = false;
    this.swiped = false;
    this.pointerId = null;
    this.keys.clear();
    this.clicks.length = 0;
  }

  consumeClicks(): { x: number; y: number }[] {
    const list = this.clicks.slice();
    this.clicks.length = 0;
    return list;
  }

  update(dt: number, currentX: number): number {
    const left = this.keys.has("ArrowLeft") || this.keys.has("a") || this.keys.has("A");
    const right = this.keys.has("ArrowRight") || this.keys.has("d") || this.keys.has("D");
    if (left || right) this.swiped = true;
    if (left && !right) this.targetX = Math.max(-LANE_X, this.targetX - LANE_X * 2.4 * dt);
    if (right && !left) this.targetX = Math.min(LANE_X, this.targetX + LANE_X * 2.4 * dt);
    if (!this.dragging && !left && !right) {
      /* 停在当前位置，由小队平滑跟上 targetX；保持 target */
    }
    return this.targetX;
  }

  private down(p: PointerSample): void {
    this.pointerId = p.id;
    this.dragging = true;
    this.lastX = p.x;
    const logic = this.platform.toLogic(p.x, p.y);
    this.clicks.push(logic);
  }

  private move(p: PointerSample): void {
    if (!this.dragging || (this.pointerId !== null && p.id !== this.pointerId)) return;
    const dx = p.x - this.lastX;
    this.lastX = p.x;
    if (Math.abs(dx) > 0.4) this.swiped = true;
    const logicDx = (dx / this.platform.cssWidth) * CANVAS_W;
    // 拖过大半屏约等于换到对面车道
    this.targetX += (logicDx / (CANVAS_W * 0.42)) * (LANE_X * 2);
    if (this.targetX > LANE_X) this.targetX = LANE_X;
    if (this.targetX < -LANE_X) this.targetX = -LANE_X;
  }

  private up(p: PointerSample): void {
    if (this.pointerId !== null && p.id !== this.pointerId) return;
    this.dragging = false;
    this.pointerId = null;
  }
}
