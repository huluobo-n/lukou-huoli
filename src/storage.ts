import { STORAGE_KEY } from "./config";
import type { Platform } from "./platform";

export interface BestRecord {
  kills: number;
  peakCount: number;
  time: number;
}

export const EMPTY_BEST: BestRecord = { kills: 0, peakCount: 0, time: 0 };

export function loadBest(platform: Platform): BestRecord {
  const raw = platform.getStorage(STORAGE_KEY);
  if (!raw) return { ...EMPTY_BEST };
  try {
    const parsed = JSON.parse(raw) as Partial<BestRecord>;
    return {
      kills: Number(parsed.kills) || 0,
      peakCount: Number(parsed.peakCount) || 0,
      time: Number(parsed.time) || 0,
    };
  } catch {
    return { ...EMPTY_BEST };
  }
}

export function saveBest(platform: Platform, current: { kills: number; peakCount: number; time: number }, prev: BestRecord): BestRecord {
  const next: BestRecord = {
    kills: Math.max(prev.kills, current.kills),
    peakCount: Math.max(prev.peakCount, current.peakCount),
    time: Math.max(prev.time, current.time),
  };
  platform.setStorage(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function loadMuted(platform: Platform): boolean {
  return platform.getStorage(STORAGE_KEY + "-muted") === "1";
}

export function saveMuted(platform: Platform, muted: boolean): void {
  platform.setStorage(STORAGE_KEY + "-muted", muted ? "1" : "0");
}
