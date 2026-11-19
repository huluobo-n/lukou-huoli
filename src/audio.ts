import type { Platform } from "./platform";
import { loadMuted, saveMuted } from "./storage";

type SfxName = "shoot" | "hit" | "gate" | "red" | "weapon" | "win" | "fail";

export class AudioSys {
  muted: boolean;
  private ctx: AudioContext | null = null;
  private lastShoot = 0;
  private unlocked = false;

  constructor(private readonly platform: Platform) {
    this.muted = loadMuted(platform);
  }

  toggle(): void {
    this.muted = !this.muted;
    saveMuted(this.platform, this.muted);
    if (!this.muted) this.unlock();
  }

  unlock(): void {
    if (this.unlocked && this.ctx) return;
    try {
      if (!this.ctx) this.ctx = this.platform.tryAudioContext();
      if (this.ctx && this.ctx.state === "suspended") void this.ctx.resume();
      this.unlocked = true;
    } catch {
      this.ctx = null;
    }
  }

  play(name: SfxName): void {
    if (this.muted) return;
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    if (name === "shoot") {
      if (t - this.lastShoot < 0.045) return;
      this.lastShoot = t;
      this.blip(t, 880, 0.04, 0.03, "square");
      return;
    }
    if (name === "hit") {
      this.blip(t, 420, 0.06, 0.035, "square");
      return;
    }
    if (name === "gate") {
      this.blip(t, 524, 0.09, 0.05, "sine");
      this.blip(t + 0.07, 660, 0.1, 0.05, "sine");
      return;
    }
    if (name === "red") {
      this.blip(t, 196, 0.16, 0.06, "triangle");
      return;
    }
    if (name === "weapon") {
      this.blip(t, 392, 0.08, 0.05, "sine");
      this.blip(t + 0.08, 523, 0.1, 0.05, "sine");
      this.blip(t + 0.16, 784, 0.12, 0.06, "sine");
      return;
    }
    if (name === "win") {
      this.blip(t, 523, 0.12, 0.05, "sine");
      this.blip(t + 0.12, 659, 0.12, 0.05, "sine");
      this.blip(t + 0.24, 784, 0.2, 0.06, "sine");
      return;
    }
    this.blip(t, 180, 0.22, 0.07, "triangle");
  }

  private blip(when: number, freq: number, dur: number, gain: number, type: OscillatorType): void {
    const ctx = this.ctx;
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, when);
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(gain, when + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(when);
      osc.stop(when + dur + 0.02);
    } catch {
      /* 部分小游戏环境对自动化参数支持不完整 */
    }
  }
}
