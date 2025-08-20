# 开发说明/源码

> 基于基础类，`polling.ts`，衍生 vu3 、react 版本

## 基础类，`polling.ts`

```ts
/**
 * 轮询配置选项接口
 */
export interface IPollingOptions<T = unknown> {
  /** 轮询函数 */
  pollingFn: () => Promise<T>;
  /** 轮询间隔（毫秒），默认1000ms */
  interval?: number;
  /** 最大轮询次数，默认100次 */
  maxCount?: number;
  /** 是否立即执行，默认true */
  immediate?: boolean;
  /** 轮询条件，返回false时停止轮询 */
  condition?: () => boolean;
  /** 轮询成功回调 */
  onSuccess?: (data: T) => void;
  /** 轮询失败回调 */
  onError?: (error: unknown) => void;
  /** 轮询完成回调（达到最大次数或条件不满足时） */
  onComplete?: () => void;
  /** 轮询状态回调 */
  onStatus?: (status: IPollingStatus) => void;
}

/**
 * 轮询状态接口
 */
export interface IPollingState<T = unknown> {
  /** 是否正在轮询 */
  isPolling: boolean;
  /** 是否暂停 */
  isPaused: boolean;
  /** 轮询次数 */
  count: number;
  /** 轮询数据 */
  data: T | null;
  /** 轮询错误 */
  error: unknown;
}

/**
 * 轮询控制方法接口
 */
export interface IPollingControls {
  /** 开始轮询 */
  startPolling: () => void;
  /** 停止轮询 */
  stopPolling: () => void;
  /** 重置轮询 */
  resetPolling: () => void;
  /** 暂停轮询 */
  pausePolling: () => void;
  /** 恢复轮询 */
  resumePolling: () => void;
  /** 销毁轮询 */
  destroy: () => void;
}

const DEFAULT_OPTIONS: Required<IPollingOptions<unknown>> = {
  pollingFn: () => Promise.resolve(null),
  interval: 1000,
  maxCount: 100,
  immediate: true,
  condition: () => true,
  onSuccess: () => {},
  onError: () => {},
  onComplete: () => {},
  onStatus: () => {},
};

export enum IPollingStatus {
  START = "start",
  PAUSE = "pause",
  STOP = "stop",
  COMPLETE = "complete",
  TIMEOUT = "timeout",
}

// ========================轮询工具=======================

/**
 * 框架无关的轮询工具类
 */
export class PollingManager<T = unknown>
  implements IPollingState<T>, IPollingControls
{
  private _isPolling = false;
  private _isPaused = false;
  private _count = 0;
  private _timer: ReturnType<typeof setInterval> | null = null;
  private _data: T | null = null;
  private _error: unknown = null;
  private readonly options: Required<IPollingOptions<T>>;

  constructor(options: IPollingOptions<T>) {
    this.options = { ...DEFAULT_OPTIONS, ...options };

    if (this.options.immediate) {
      this.startPolling();
    }
  }

  // Getters
  get isPolling(): boolean {
    return this._isPolling;
  }
  get isPaused(): boolean {
    return this._isPaused;
  }
  get count(): number {
    return this._count;
  }
  get data(): T | null {
    return this._data;
  }
  get error(): unknown {
    return this._error;
  }

  /**
   * 执行轮询
   */
  private async polling(): Promise<void> {
    if (this._isPaused) return;

    // 检查轮询条件
    if (!this.options.condition()) {
      this.log("轮询条件不满足，结束轮询");
      this.stopPolling();
      this.options.onComplete();
      this.options.onStatus(IPollingStatus.COMPLETE);
      return;
    }

    // 检查最大轮询次数
    if (this._count >= this.options.maxCount) {
      this.log("达到最大轮询次数");
      this.stopPolling();
      this.options.onComplete();
      this.options.onStatus(IPollingStatus.TIMEOUT);
      return;
    }

    try {
      this._count++;
      this._data = await this.options.pollingFn();
      this._error = null;
      this.options.onSuccess(this._data);
      this.log(`轮询成功 #${this._count}`);
    } catch (err) {
      this._error = err;
      this.options.onError(err);
      this.log(`轮询失败 #${this._count}`, err);
    }
  }

  /**
   * 开始轮询
   */
  startPolling(): void {
    if (this._isPolling) {
      this.log("轮询已在运行中");
      return;
    }

    this.log("开始轮询");
    this._isPolling = true;
    this._isPaused = false;
    this._count = 0;
    this._error = null;

    // 清除之前的定时器
    if (this._timer) {
      clearInterval(this._timer);
    }

    this._timer = setInterval(() => {
      if (!this._isPolling || this._isPaused) return;
      this.polling();
    }, this.options.interval);

    this.options.onStatus(IPollingStatus.START);
  }

  /**
   * 停止轮询
   */
  stopPolling(): void {
    this.log("停止轮询");
    this._isPolling = false;
    this._isPaused = false;

    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }

    this.options.onStatus(IPollingStatus.STOP);
  }

  /**
   * 重置轮询
   */
  resetPolling(): void {
    this.log("重置轮询");
    this.stopPolling();
    this.startPolling();
  }

  /**
   * 暂停轮询
   */
  pausePolling(): void {
    if (!this._isPolling || this._isPaused) return;

    this.log("暂停轮询");
    this._isPaused = true;
    this.options.onStatus(IPollingStatus.PAUSE);
  }

  /**
   * 恢复轮询
   */
  resumePolling(): void {
    if (!this._isPolling || !this._isPaused) return;

    this.log("恢复轮询");
    this._isPaused = false;
    this.options.onStatus(IPollingStatus.START);
  }

  /**
   * 日志记录
   */
  private log(message: string, data?: unknown): void {
    const timestamp = new Date().toLocaleTimeString();
    const logData = data ? ` | ${JSON.stringify(data)}` : "";
    console.log(`[PollingManager ${timestamp}] ${message}${logData}`);
  }

  /**
   * 销毁轮询管理器
   */
  destroy(): void {
    this.log("销毁轮询管理器");
    this.stopPolling();
    this.options.onStatus(IPollingStatus.COMPLETE);
  }
}

/**
 * 创建轮询管理器的工厂函数
 */
export function createPolling<T = unknown>(
  options: IPollingOptions<T>
): PollingManager<T> {
  return new PollingManager(options);
}
```

## vue3 版本 hook，`usePollingVue3.ts`

```ts
import { onMounted, onUnmounted, ref, type Ref } from "vue";
import {
  createPolling,
  IPollingStatus,
  type IPollingOptions,
  type PollingManager,
} from "./polling";

/**
 * Vue3轮询Hook
 * @param options 轮询配置选项
 * @returns 轮询相关的状态和方法
 */
export function usePolling<T = unknown>(options: IPollingOptions<T>) {
  const pollingManager = ref<PollingManager<T> | null>(null); // 轮询管理器
  const isPolling = ref(false); // 是否正在轮询
  const isPaused = ref(false); // 是否暂停
  const count = ref(0); // 轮询次数
  const data = ref<T | null>(null); // 轮询数据
  const error = ref<unknown>(null); // 轮询错误

  // 创建轮询管理器
  const createManager = () => {
    // 先清理现有的管理器
    if (pollingManager.value) {
      pollingManager.value.destroy();
      pollingManager.value = null;
    }

    const manager = createPolling({
      ...options,
      onSuccess: (result: T) => {
        data.value = result;
        error.value = null;
        options.onSuccess?.(result);
      },
      onError: (err: unknown) => {
        error.value = err;
        options.onError?.(err);
      },
      onComplete: () => {
        options.onComplete?.();
      },
      onStatus: (status: IPollingStatus) => {
        options.onStatus?.(status);
      },
    });

    // 监听状态变化
    const updateState = () => {
      isPolling.value = manager.isPolling;
      isPaused.value = manager.isPaused;
      count.value = manager.count;
      data.value = manager.data;
      error.value = manager.error;
    };

    // 创建定时器来同步状态
    const syncTimer = setInterval(updateState, 100);

    // 保存引用
    pollingManager.value = manager;

    // 返回清理函数
    return () => {
      clearInterval(syncTimer);
      manager.destroy();
    };
  };

  // 控制方法
  const startPolling = () => {
    if (!pollingManager.value) {
      createManager();
    }
    pollingManager.value?.startPolling();
  };

  const stopPolling = () => {
    pollingManager.value?.stopPolling();
  };

  const resetPolling = () => {
    pollingManager.value?.resetPolling();
  };

  const pausePolling = () => {
    pollingManager.value?.pausePolling();
  };

  const resumePolling = () => {
    pollingManager.value?.resumePolling();
  };

  // 销毁轮询管理器
  const destroy = () => {
    if (pollingManager.value) {
      pollingManager.value.destroy();
      pollingManager.value = null;
    }
    // 重置状态
    isPolling.value = false;
    isPaused.value = false;
    count.value = 0;
    data.value = null;
    error.value = null;

    console.log("destroy---", pollingManager.value);
  };

  onMounted(() => {
    // 是否立即轮询
    if (options.immediate !== false) {
      createManager();
    }
  });

  // 组件卸载时清理
  onUnmounted(() => {
    destroy();
  });

  return {
    isPolling,
    isPaused,
    count,
    data,
    error,
    startPolling,
    stopPolling,
    resetPolling,
    pausePolling,
    resumePolling,
    destroy,
    // 手动创建管理器的方法（用于延迟创建）
    createManager,
  };
}
```
