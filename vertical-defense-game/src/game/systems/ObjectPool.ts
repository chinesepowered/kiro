export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;
  private maxSize: number;

  constructor(createFn: () => T, resetFn: (obj: T) => void, initialSize: number = 10, maxSize: number = 100) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;

    // Pre-populate the pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  get(): T {
    if (this.pool.length > 0) {
      const obj = this.pool.pop()!;
      this.resetFn(obj);
      return obj;
    }
    
    // Pool is empty, create new object
    return this.createFn();
  }

  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj);
    }
    // If pool is full, let the object be garbage collected
  }

  getPoolSize(): number {
    return this.pool.length;
  }

  clear(): void {
    this.pool = [];
  }
}

export class PoolManager {
  private static instance: PoolManager;
  private pools: Map<string, ObjectPool<unknown>> = new Map();

  static getInstance(): PoolManager {
    if (!PoolManager.instance) {
      PoolManager.instance = new PoolManager();
    }
    return PoolManager.instance;
  }

  createPool<T>(name: string, createFn: () => T, resetFn: (obj: T) => void, initialSize: number = 10, maxSize: number = 100): ObjectPool<T> {
    const pool = new ObjectPool(createFn, resetFn, initialSize, maxSize);
    this.pools.set(name, pool as ObjectPool<unknown>);
    return pool;
  }

  getPool<T>(name: string): ObjectPool<T> | undefined {
    return this.pools.get(name) as ObjectPool<T> | undefined;
  }

  clearAll(): void {
    for (const pool of this.pools.values()) {
      pool.clear();
    }
  }

  getStats(): { [key: string]: number } {
    const stats: { [key: string]: number } = {};
    for (const [name, pool] of this.pools) {
      stats[name] = pool.getPoolSize();
    }
    return stats;
  }
}