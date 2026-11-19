interface WxSystemInfo {
  windowWidth: number;
  windowHeight: number;
  pixelRatio: number;
  screenWidth: number;
  screenHeight: number;
}

interface WxTouch {
  clientX: number;
  clientY: number;
  identifier: number;
}

interface WxTouchEvent {
  touches: WxTouch[];
  changedTouches: WxTouch[];
}

interface WxAudioContext {
  currentTime: number;
  destination: AudioDestinationNode;
  state: string;
  createOscillator(): OscillatorNode;
  createGain(): GainNode;
  resume(): Promise<void>;
}

interface WxMiniProgram {
  createCanvas(): HTMLCanvasElement;
  getSystemInfoSync(): WxSystemInfo;
  onTouchStart(cb: (e: WxTouchEvent) => void): void;
  onTouchMove(cb: (e: WxTouchEvent) => void): void;
  onTouchEnd(cb: (e: WxTouchEvent) => void): void;
  onTouchCancel(cb: (e: WxTouchEvent) => void): void;
  setStorageSync(key: string, value: string): void;
  getStorageSync(key: string): string;
  createWebAudioContext?: () => WxAudioContext;
  onShow?(cb: () => void): void;
  onHide?(cb: () => void): void;
}

declare const wx: WxMiniProgram | undefined;
