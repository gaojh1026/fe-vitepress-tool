# React 轮询 Hook 使用说明

## 源码

```ts
import { useRef, useEffect, useState, useCallback } from "react";

/**
 * 轮询 Hook 配置项接口
 */
interface UsePollingOptions<T = unknown> {
  /** 轮询函数，返回 Promise */
  pollingFn: () => Promise<T>;
  /** 轮询间隔（毫秒），默认 1000ms */
  interval?: number;
  /** 最大轮询次数，默认 100 次 */
  maxCount?: number;
  /** 是否组件挂载后立即执行，默认 true */
  immediate?: boolean;
  /** 轮询条件函数，返回 false 时停止轮询 */
  condition?: () => boolean;
  /** 轮询成功回调 */
  onSuccess?: (data: T) => void;
  /** 轮询失败回调 */
  onError?: (error: unknown) => void;
  /** 轮询完成回调（达到最大次数或条件不满足时） */
  onComplete?: () => void;
}

/**
 * 通用轮询 Hook（React 版）
 * @param options 轮询配置项
 * @returns 轮询相关状态和操作方法
 */
export function usePolling<T = unknown>(options: UsePollingOptions<T>) {
  const {
    pollingFn,
    interval = 1000,
    maxCount = 100,
    immediate = true,
    condition,
    onSuccess,
    onError,
    onComplete,
  } = options;

  // 是否正在轮询
  const [isPolling, setIsPolling] = useState(false);
  // 是否暂停轮询
  const [isPaused, setIsPaused] = useState(false);
  // 当前轮询次数（已移除 useState）
  // const [count, setCount] = useState(0);
  // 只用 countRef 追踪轮询次数
  const countRef = useRef(0);
  // 返回的数据
  const [data, setData] = useState<T | null>(null);
  // 轮询错误
  const [error, setError] = useState<unknown>(null);
  // 定时器引用
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 轮询主逻辑
   */
  const polling = async () => {
    // console.log("pollingFn22", isPaused, maxCount, countRef.current);

    // 如果已暂停则不执行
    if (isPaused) return;
    // 条件不满足时停止轮询
    if (condition && !condition()) {
      stopPolling();
      onComplete?.();
      return;
    }
    // 达到最大轮询次数时停止轮询
    if (countRef.current >= maxCount) {
      stopPolling();
      onComplete?.();
      return;
    }
    try {
      countRef.current += 1;
      const result = await pollingFn();
      setData(result);
      setError(null);
      onSuccess?.(result);
    } catch (err) {
      setError(err);
      onError?.(err);
    }
  };

  /**
   * 开始轮询
   */
  const startPolling = () => {
    console.log("startPolling", isPolling);
    if (isPolling) return;
    setIsPolling(true);
    setIsPaused(false);
    countRef.current = 0; // 重置 ref
    setError(null);
    // 定时执行 polling
    timerRef.current = setInterval(() => {
      polling();
    }, interval);
  };

  /**
   * 停止轮询
   */
  const stopPolling = useCallback(() => {
    setIsPolling(false);
    setIsPaused(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /**
   * 重置轮询（停止后重新开始）
   */
  const resetPolling = useCallback(() => {
    stopPolling();
    countRef.current = 0; // 重置 ref
    setData(null);
    setError(null);
    startPolling();
  }, [stopPolling, startPolling]);

  /**
   * 暂停轮询
   */
  const pausePolling = useCallback(() => {
    setIsPaused(true);
  }, []);

  /**
   * 恢复轮询
   */
  const resumePolling = useCallback(() => {
    setIsPaused(false);
  }, []);

  /**
   * 组件挂载时根据 immediate 自动开始轮询，卸载时自动清理
   */
  useEffect(() => {
    if (immediate) {
      startPolling();
    }
    return () => {
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 返回所有状态和操作方法，便于外部调用
  return {
    isPolling, // 是否正在轮询
    isPaused, // 是否暂停
    count: countRef.current, // 当前轮询次数（直接返回 ref 的值）
    data, // 轮询数据
    error, // 轮询错误
    startPolling, // 开始轮询
    stopPolling, // 停止轮询
    resetPolling, // 重置轮询
    pausePolling, // 暂停轮询
    resumePolling, // 恢复轮询
  };
}
```

## 使用

```ts
import { usePolling } from "./usePolling.ts";

// usePolling 初始化 immediate 固定为 false
const { startPolling } = usePolling({
  pollingFn: fetchBackends,
  interval: 1000,
  immediate: false, // 固定为 false
  maxCount: 100,
  condition: () => {
    return (
      backendsRef.current && backendsRef.current?.predict_all_task === true
    );
  },
  onComplete: () => {},
});

// 监听 backends 变化
useEffect(() => {
  if (backends?.predict_all_task) {
    startPolling();
  }
}, [backends, startPolling]);

const fetchBackends = useCallback(async () => {
  const models = await api.callApi("mlBackends", {
    params: {
      project: project.id,
      include_static: true,
    },
  });
  if (models) {
    setBackends(models[0]);
  }
}, [api, project]);
```

## vue3 同样版本的

```ts
import { useEffect, useRef, useState, useCallback } from "react";
import {
  createPolling,
  type IPollingOptions,
  type PollingManager,
} from "./polling";

/**
 * React轮询Hook
 * @param options 轮询配置选项
 * @returns 轮询相关的状态和方法
 */
export function usePolling<T = unknown>(options: IPollingOptions<T>) {
  const [isPolling, setIsPolling] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [count, setCount] = useState(0);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);

  const pollingManagerRef = useRef<PollingManager<T> | null>(null);
  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestOptionsRef = useRef(options);

  // 始终持有最新的回调与条件（避免闭包陈旧）
  useEffect(() => {
    latestOptionsRef.current = options;
  }, [
    options.pollingFn,
    options.condition,
    options.onSuccess,
    options.onError,
    options.onComplete,
    options.onStatus,
  ]);

  // 创建轮询管理器
  const createManager = useCallback(() => {
    const base = latestOptionsRef.current;
    const manager = createPolling<T>({
      interval: base.interval,
      maxCount: base.maxCount,
      immediate: base.immediate,
      pollingFn: async () => {
        return await latestOptionsRef.current.pollingFn();
      },
      condition: () => {
        return latestOptionsRef.current.condition?.() ?? true;
      },
      onSuccess: (result: T) => {
        setData(result);
        setError(null);
        latestOptionsRef.current.onSuccess?.(result);
      },
      onError: (err: unknown) => {
        setError(err);
        latestOptionsRef.current.onError?.(err);
      },
      onComplete: () => {
        latestOptionsRef.current.onComplete?.();
      },
      onStatus: (status) => {
        latestOptionsRef.current.onStatus?.(status);
      },
    });

    // 监听状态变化
    const updateState = () => {
      if (manager) {
        setIsPolling(manager.isPolling);
        setIsPaused(manager.isPaused);
        setCount(manager.count);
        setData(manager.data);
        setError(manager.error);
      }
    };

    // 创建定时器来同步状态
    syncTimerRef.current = setInterval(updateState, 100);

    // 保存引用
    pollingManagerRef.current = manager;

    return manager;
  }, []);

  // 控制方法
  const startPolling = useCallback(() => {
    if (!pollingManagerRef.current) {
      createManager();
    }
    pollingManagerRef.current?.startPolling();
  }, [createManager]);

  const stopPolling = useCallback(() => {
    pollingManagerRef.current?.stopPolling();
  }, []);

  const resetPolling = useCallback(() => {
    pollingManagerRef.current?.resetPolling();
  }, []);

  const pausePolling = useCallback(() => {
    pollingManagerRef.current?.pausePolling();
  }, []);

  const resumePolling = useCallback(() => {
    pollingManagerRef.current?.resumePolling();
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
      }
      if (pollingManagerRef.current) {
        pollingManagerRef.current.destroy();
        pollingManagerRef.current = null;
      }
    };
  }, []);

  // 配置变更时（interval/maxCount/immediate），若当前未在轮询，重建管理器以生效
  useEffect(() => {
    const manager = pollingManagerRef.current;
    if (!manager) return;
    if (manager.isPolling) return; // 运行中不热更新，避免状态跳变
    // 先清理
    if (syncTimerRef.current) {
      clearInterval(syncTimerRef.current);
      syncTimerRef.current = null;
    }
    manager.destroy();
    pollingManagerRef.current = null;
    createManager();
  }, [options.interval, options.maxCount, options.immediate, createManager]);

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
    // 手动创建管理器的方法（用于延迟创建）
    createManager,
  };
}
```
