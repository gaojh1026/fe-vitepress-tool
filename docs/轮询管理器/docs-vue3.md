# Vue3 轮询 Hook 使用说明

## 概述

这是一个专为 Vue3 设计的轮询功能 Hook，提供了完整的轮询状态管理、控制和生命周期管理功能。该 Hook 使用了 Vue3 的一些语法，因此仅适合 Vue3 项目

## 安装使用

### 本地引入

> 这种方式，可以把源码拷贝到本地，然后引入开发即可，也方便后期修改源码

### 安装包

> 这种方式，直接安装导入包即可

## 基础用法

```typescript
import { usePolling } from "./usePollingVue3";

const isSuccess = ref(false);

const { isPolling, count, data, error, startPolling, stopPolling } = usePolling(
  {
    pollingFn: async () => {
      const response = await fetch("/api/data");

      isSuccess.value = true;
      return response.json();
    }, // 轮询函数，业务逻辑
    interval: 2000, // 每隔2s轮询一次
    maxCount: 50, // 最大轮询50次
    condition: () => !isSuccess.value, // true表示满足轮询条件；false表示不满足轮询条件，停止轮询
    onSuccess: (result) => {
      console.log("轮询成功:", result);
    },
    onError: (err) => {
      console.error("轮询失败:", err);
    },
  }
);
```

## 配置轮询函数

> 正常的轮询，一般常见的是请求一个接口，不断请求，直至返回一个条件表示请求成功，然后停止轮询，那这个接口一般是属于我们的业务逻辑，所以，这个 hook 支持通过配置 `pollingFn` 函数，
> 来传入我们的业务逻辑。<br />值得注意的是， `pollingFn` 函数每次轮询的返回值，我们可以通过 `onSuccess(data)` 回调函数拿到，其中 `data` 就是我们 `pollingFn` 函数返回的值

```typescript
import { usePolling } from "./usePollingVue3";

const isSuccess = ref(false);
const { isPolling, count, data, error, startPolling, stopPolling } = usePolling(
  {
    // 轮询函数，业务逻辑
    pollingFn: async () => {
      const response = await fetch("/api/data");

      isSuccess.value = true;
      return response.json();
    },

    condition: () => !isSuccess.value, // true表示满足轮询条件；false表示不满足轮询条件，停止轮询
    onSuccess: (result) => {
      console.log("轮询成功:", result);
    },
  }
);
```

## 是否立即轮询

> 有些情况下，我们需要立即进行轮询，也就是页面加载后就自动进行轮询或者不想要自动进行轮询，那么就可以通过 `immediate` 控制
> 是否立即执行轮询

```typescript
const { startPolling, stopPolling } = usePolling({
  pollingFn: async () => await checkStatus(),
  condition: () => {
    // 当状态为 'pending' 时继续轮询
    return data.value?.status === "pending";
  },
  immediate:true
  onSuccess: (data) => {
    console.log(data);
  },
});
```

## 轮询最大次数/轮询间隔

> 有些情况下，如果出现问题，接口一直不返回，那么我们就得设置一个最大轮询时间，这时就可以通过轮询最大次数和
> 轮询间隔进行结合处理，通过 `maxCount` `interval` 来配置最大轮询次数和每次轮询间隔时间，默认为最多允许轮询
> 100 次，每次间隔 1s 轮询

```typescript
const { startPolling, stopPolling } = usePolling({
  pollingFn: async () => await checkStatus(),
  condition: () => {
    // 当状态为 'pending' 时继续轮询
    return data.value?.status === "pending";
  },
  immediate: true,
  interval: 1000,
  onSuccess: (data) => {
    console.log(data);
  },
});
```

## 配置轮询满足条件

> 正常情况下，轮询都是需要满足一个条件停止轮询，不满足条件就一直轮询，那么为了方便，提供一个配置 `condition` 来配置
> 是否可以轮询，这个配置是一个 `boolean` 值，为 `true` 表示满足轮询条件，会一直轮询，如果为 `false` ,那么就是不满足
> 轮询条件，开始停止轮询

```typescript
const { startPolling, stopPolling } = usePolling({
  pollingFn: async () => await checkStatus(),
  condition: () => {
    // 当状态为 'pending' 时继续轮询
    return data.value?.status === "pending";
  },
  onSuccess: (data) => {
    console.log(data);
  },
});
```

## 开始/停止轮询

> - `startPolling()` 表示开始轮询
> - `stopPolling()` 表示停止轮询

```typescript
import { usePolling } from "./usePollingVue3";

const isSuccess = ref(false);
const { isPolling, count, data, error, startPolling, stopPolling } = usePolling(
  {
    pollingFn: async () => {
      const response = await fetch("/api/data");

      isSuccess.value = true;
      return response.json();
    }, // 轮询函数，业务逻辑
    condition: () => !isSuccess.value, // true表示满足轮询条件；false表示不满足轮询条件，停止轮询
    onSuccess: (result) => {
      console.log("轮询成功:", result);
    },
  }
);

// 开始轮询
const handleStartPolling = () => {
  startPolling();
};

const handleStopPolling = () => {
  stopPolling();
};
```

## 暂停/恢复轮询

> - `pausePolling()` 表示暂停轮询
> - `resumePolling()` 表示恢复轮询

```typescript
import { usePolling } from "./usePollingVue3";

const isSuccess = ref(false);
const { isPolling, count, data, error, pausePolling, resumePolling } =
  usePolling({
    pollingFn: async () => {
      const response = await fetch("/api/data");

      isSuccess.value = true;
      return response.json();
    }, // 轮询函数，业务逻辑
    interval: 2000, // 每隔2s轮询一次
    maxCount: 50, // 最大轮询50次
    condition: () => !isSuccess.value, // true表示满足轮询条件；false表示不满足轮询条件，停止轮询
    onSuccess: (result) => {
      console.log("轮询成功:", result);
    },
    onError: (err) => {
      console.error("轮询失败:", err);
    },
  });

const handlePausePolling = () => {
  pausePolling();
};

const handleResumePolling = () => {
  resumePolling();
};
```

## 重置/销毁轮询

> - `resetPolling()` 表示暂停轮询
> - `destroy()` 表示销毁轮询管理器。管理器已经做了页面卸载自动销毁，因此这个仅用于需要手动销毁情况

```typescript
import { usePolling } from "./usePollingVue3";

const isSuccess = ref(false);
const { isPolling, count, data, error, resetPolling, destroy } = usePolling({
  pollingFn: async () => {
    const response = await fetch("/api/data");

    isSuccess.value = true;
    return response.json();
  }, // 轮询函数，业务逻辑
  interval: 2000, // 每隔2s轮询一次
  maxCount: 50, // 最大轮询50次
  condition: () => !isSuccess.value, // true表示满足轮询条件；false表示不满足轮询条件，停止轮询
  onSuccess: (result) => {
    console.log("轮询成功:", result);
  },
  onError: (err) => {
    console.error("轮询失败:", err);
  },
});

const handleResetPolling = () => {
  resetPolling();
};
```

## 轮询回调

> 轮询开始后，hook 提供多个回调函数，来处理轮询的返回
>
> - `onSuccess(data)` ：每次轮询成功回调
> - `onComplete()` ：轮询完成回调
> - `onStatus()` ：轮询状态回调
> - `onError()` : 轮询错误回调

```typescript
import { usePolling } from "./usePollingVue3";

// 使用轮询hook
const {
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
  createManager,
  destroy,
} = usePolling<{ data: string; id: string }>({
  pollingFn: mockApi,
  interval: config.value.interval,
  maxCount: config.value.maxCount,
  immediate: config.value.immediate,
  condition: () => {
    return pollingCount.value < 20;
  },
  onSuccess: (data) => {
    console.log("onSuccess---", data);
    pollingCount.value++;
  },
  onError: (error: any) => {
    console.log("onError---", error);
  },
  onComplete: () => {
    console.log("onComplete---");
  },
  onStatus: (status: IPollingStatus) => {
    console.log("onStatus---", status);
  },
});
```

## 注意事项

1. **状态同步**: Hook 内部使用 100ms 定时器同步状态，确保响应式数据及时更新
2. **资源清理**: 组件卸载时自动清理，但建议在需要时手动调用 `destroy()`
3. **错误边界**: 轮询函数中的错误会被捕获并传递给 `onError` 回调
4. **内存管理**: 避免在轮询函数中创建大量对象，防止内存泄漏

## API 参考

### 配置选项 `IPollingOptions`

| 配置项       | 类型                               | 说明                 | 默认值 |
| ------------ | ---------------------------------- | -------------------- | ------ |
| `pollingFn`  | `() => Promise<T>`                 | `轮询函数（必需）`   | `-`    |
| `interval`   | `number`                           | `轮询间隔，单位毫秒` | `1000` |
| `maxCount`   | `number`                           | `最大轮询次数`       | `100`  |
| `immediate`  | `boolean`                          | `是否立即执行`       | `true` |
| `condition`  | `() => boolean`                    | `轮询条件函数`       | `-`    |
| `onSuccess`  | `(data: T) => void`                | `成功回调`           | `-`    |
| `onError`    | `(error: unknown) => void`         | `错误回调`           | `-`    |
| `onComplete` | `() => void`                       | `完成回调`           | `-`    |
| `onStatus`   | `(status: IPollingStatus) => void` | `状态变化回调`       | `-`    |

### 响应式状态管理 `IPollingStatus`

支持下列的响应值

| 响应式状态  | 说明         |
| ----------- | ------------ |
| `isPolling` | 轮询运行状态 |
| `isPaused`  | 轮询暂停状态 |
| `count`     | 当前轮询次数 |
| `data`      | 最新轮询数据 |
| `error`     | 轮询错误信息 |

### 完整的控制方法 `IPollingControls`

支持下列的控制方法

| 方法名            | 说明                       |
| ----------------- | -------------------------- |
| `startPolling()`  | 开始轮询                   |
| `stopPolling()`   | 停止轮询                   |
| `pausePolling()`  | 暂停轮询                   |
| `resumePolling()` | 恢复轮询                   |
| `resetPolling()`  | 重置轮询                   |
| `destroy()`       | 销毁轮询管理器             |
| `createManager()` | 手动创建轮询管理器，非必要 |
