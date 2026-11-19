export class Pool<T> {
  private idle: T[] = [];
  private live: T[] = [];
  readonly max: number;

  constructor(
    max: number,
    private readonly factory: () => T,
    private readonly reset: (item: T) => void,
  ) {
    this.max = max;
    for (let i = 0; i < max; i++) this.idle.push(factory());
  }

  acquire(): T | null {
    if (this.live.length >= this.max) return null;
    const item = this.idle.pop() ?? this.factory();
    this.reset(item);
    this.live.push(item);
    return item;
  }

  release(item: T): void {
    const i = this.live.indexOf(item);
    if (i >= 0) this.live.splice(i, 1);
    this.reset(item);
    if (this.idle.length < this.max) this.idle.push(item);
  }

  releaseAt(index: number): void {
    const item = this.live[index];
    if (!item) return;
    this.live.splice(index, 1);
    this.reset(item);
    if (this.idle.length < this.max) this.idle.push(item);
  }

  clear(): void {
    while (this.live.length) this.releaseAt(0);
  }

  get active(): T[] {
    return this.live;
  }

  get size(): number {
    return this.live.length;
  }
}
