import { createPlatform, type Platform } from "./platform";
import { Game } from "./game";

export interface LukouHooks {
  game: Game;
  start(): void;
  getState(): ReturnType<Game["getState"]>;
  step(dt: number): void;
  setTimeScale(n: number): void;
  setPaused(v: boolean): void;
  draw(): void;
}

declare global {
  // eslint-disable-next-line no-var
  var __LUKOU__: LukouHooks | undefined;
}

export function attachHooks(game: Game): LukouHooks {
  const hooks: LukouHooks = {
    game,
    start: () => game.beginRun(),
    getState: () => game.getState(),
    step: (dt: number) => game.step(dt),
    setTimeScale: (n: number) => {
      game.timeScale = n;
    },
    setPaused: (v: boolean) => {
      game.paused = v;
    },
    draw: () => game.drawFrame(),
  };
  (globalThis as unknown as { __LUKOU__: LukouHooks }).__LUKOU__ = hooks;
  return hooks;
}

export function boot(platform?: Platform): Game {
  const plat = platform ?? createPlatform();
  const game = new Game(plat);
  attachHooks(game);
  game.startLoop();
  return game;
}

function shouldAutoBoot(): boolean {
  if (typeof wx !== "undefined" && typeof wx.createCanvas === "function") return true;
  if (typeof document !== "undefined") return true;
  return false;
}

if (shouldAutoBoot()) {
  boot();
}

export { Game };
