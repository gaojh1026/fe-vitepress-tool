# 开发说明/源码

## 导出资源

- **枚举**: `RequestStatus`（`idle` | `connecting` | `connected` | `error` | `completed`）
- **类型**:
  - `StreamFetchClientHandlers<TMessage>`：消息/完成/错误/打开回调
  - `StreamFetchClientOptions<TMessage>`：客户端配置
- **错误类**: `StreamFetchError`（`status?`、`retryCount`）
- **默认导出类**: `StreamFetchClient<TRequest, TMessage>`

## 支持的配置项（StreamFetchClientOptions）

- **baseUrl**: 请求基础 URL（必填）
- **headers?**: 额外请求头
- **timeout?**: 连接阶段超时（ms），默认 30000
- **method?**: `GET | POST | PUT | DELETE`，默认 `POST`
- **openWhenHidden?**: 页面隐藏时保持连接，默认 `true`
- **retry?**:
  - **maxRetries**: 最大重试次数，默认 `3`
  - **retryDelay**: 初始重试间隔（ms），默认 `1000`
- **messageParser?**: 自定义消息解析 `(event) => TMessage`
- **backoffStrategy?**: 自定义退避策略 `(retryCount) => number | null | undefined`（返回数字表示下次延时；返回 null/undefined 表示不再重试）
- **doneTag?**: 完成标记字符串，默认 `"[DONE]"`
- **closeOnDone?**: 收到完成标记后是否主动关闭连接，默认 `true`
- **requestInit?**: 透传给 `fetch` 的额外配置（如 credentials、mode 等）

默认常量：

- `METHOD=POST`、`TIMEOUT=30000`、`OPEN_WHEN_HIDDEN=true`
- `MAX_RETRIES=3`、`RETRY_DELAY=1000`
- `DONE_TAG="[DONE]"`、`CLOSE_ON_DONE=true`
- `ACCEPT_HEADER="text/event-stream"`、`CONTENT_TYPE="application/json"`

## 回调（StreamFetchClientHandlers）

- **onOpen**: 连接建立且状态码为 2xx 时触发
- **onMessage(data, event)**: 收到业务消息时触发（自动跳过完成标记）
- **onComplete**: 连接自然关闭或显式完成时触发（保证只触发一次）
- **onError(error, retryCount?)**: 出错时触发（包含超时、中止、网络/状态码错误等；附带已发生的重试次数）

错误模型：`StreamFetchError(message, status?, retryCount)`

- `status`: HTTP 状态码（可能无）
- `retryCount`: 触发错误时累计重试次数

## 公共方法（类：StreamFetchClient）

- `constructor(options: StreamFetchClientOptions<TMessage>)`: 构造函数，合并默认配置
- `sendRequest(params: TRequest, handlers: StreamFetchClientHandlers<TMessage>): Promise<void>`
  初始化状态、构建请求、发起 SSE，并接管事件/错误/重试
- `isConnected(): boolean`
  是否为 `connected` 状态
- `getStatus(): RequestStatus`
  获取当前请求状态
- `getRetryCount(): number`
  获取当前已发生的重试次数
- `disconnect(): void`
  主动断开并重置为初始状态（中止、清超时、清重试计数、清完成标记）

## 私有方法（简述）

- `resolveOptions(options)`: 合并用户配置与默认项，得到最终配置
- `updateStatus(newStatus, { clearTimeout, resetRetry, setCompletedByDoneTag, setHasCompleted, abort })`
  统一的状态变更与副作用执行（中止、清定时器、重置重试、标记完成等）
- `initData(handlers)`: 初始化连接期状态、创建 `AbortController`、设置连接超时触发 `onError`
- `clearConnectTimeout()`: 清除连接阶段超时定时器
- `startSseRequest(config, handlers)`: 调用 `fetchEventSource` 发起 SSE 并绑定 `onopen/onmessage/onclose/onerror`
- `handleConnectionOpen(response, handlers)`: 2xx 切换为已连接并触发 `onOpen`；否则触发错误
- `handleConnectionError(error, handlers)`: 标准化错误，触发 `onError`；根据策略返回下次重试延迟或抛出终止错误
- `handleSseMessage(event, handlers)`: 处理完成标记与消息解析（支持自定义解析器；默认 JSON 解析失败回退为字符串）
- `completeOnce(handlers)`: 只触发一次完成逻辑与 `onComplete`
- `buildRequestConfig(params)`: 依据 `method` 生成 URL/Query 或 Body，并设置必要请求头（含 SSE Accept）
- `serializeParams(input)`: 将对象/数组/基础类型序列化为查询参数字典
- `isPlainObject(val)`: 判断普通对象
- `shouldRetry()`: 计算下一次重试延迟（自定义策略优先；默认指数退避：`retryDelay * 2^retryCount`）

## 运转思路（工作流程）

1. **初始化与超时**
   `sendRequest` → `initData` 设置状态为 `connecting`、创建 `AbortController`、安装连接期超时定时器（超时触发 `onError` 并中止）。
2. **构建与发起请求**
   `buildRequestConfig` 依据 `method` 生成请求：
   - `GET`：`params` 序列化为 Query 附加到 URL；
   - 其他方法：`params` 序列化为 JSON Body。
     统一添加 `Accept: text/event-stream`，如有 Body 且未显式给出 `Content-Type` 则填充 `application/json`。
3. **连接建立**
   `onopen` 收到 2xx → 状态 `connected`、清连接超时、重置重试计数、触发 `onOpen`；非 2xx → 标准错误并 `onError`。
4. **消息处理**
   `onmessage`：若 `event.data === doneTag` → 标记完成、可选主动 `abort`（`closeOnDone`）；否则用 `messageParser` 或默认解析（JSON→ 字符串回退）并触发 `onMessage`。
5. **连接关闭与完成**
   `onclose` → 统一经 `completeOnce` 触发一次 `onComplete` 并置 `completed`。
6. **错误与重试**
   `onerror` → 标准化错误并 `onError`；若为中止：
   - 因完成标记触发的中止：视为正常完成（内部抛出特殊标识阻止后续处理）；
   - 其他中止：状态置 `idle` 并抛出中止错误。
     否则根据 `shouldRetry` 得到延时（数值）→ 交给底层自动重试；无延时则抛错终止。
7. **断开**
   `disconnect`：中止连接、状态重置为 `idle`，清空定时器/重试计数/完成标记。

## 退避与重试

- **内置策略**：指数退避 `retryDelay * 2^retryCount`（如 1000 → 2000 → 4000 ms）
- **上限**：`retry.maxRetries`
- **自定义策略**：`backoffStrategy(retryCount)` 返回数值表示重试延时；返回 `null/undefined` 表示不再重试（优先于内置策略）

## 消息解析

- **优先**：`messageParser(event)` 自定义解析
- **默认**：`JSON.parse(event.data)`；解析失败回退为原始字符串

## 典型用法示例

```ts
const client = new StreamFetchClient<{ prompt: string }, { text: string }>({
  baseUrl: "/api/chat/stream",
  method: "POST",
  doneTag: "[DONE]",
  retry: { maxRetries: 3, retryDelay: 1000 },
});

client.sendRequest(
  { prompt: "Hi" },
  {
    onOpen: () => console.log("opened"),
    onMessage: (msg) => console.log("msg:", msg),
    onComplete: () => console.log("complete"),
    onError: (err, count) =>
      console.log("error:", err.message, "retry:", count),
  }
);
```

- 如需在完成标记后不断开底层连接，可设置 `closeOnDone: false`。
- 如需页面隐藏时中断，可设置 `openWhenHidden: false`。

## 源码

```ts
import {
  fetchEventSource,
  type EventSourceMessage,
} from "@microsoft/fetch-event-source";

// ==================== 类型定义 ===================

/**
 * 请求状态枚举
 */
export enum RequestStatus {
  IDLE = "idle", // 空闲
  CONNECTING = "connecting", // 连接中
  CONNECTED = "connected", // 已连接
  ERROR = "error", // 错误
  COMPLETED = "completed", // 完成
}

/**
 * 流式请求支持的事件处理器
 */
export interface StreamFetchClientHandlers<TMessage = unknown> {
  /** 处理接收到的消息 */
  onMessage?: (data: TMessage, event: EventSourceMessage) => void;
  /** 请求完成回调 */
  onComplete?: () => void;
  /** 错误处理回调 */
  onError?: (error: StreamFetchError, retryCount?: number) => void;
  /** 连接建立回调 */
  onOpen?: () => void;
}

/**
 * 流式请求配置选项
 */
export interface StreamFetchClientOptions<TMessage = unknown> {
  /** 基础请求 URL */
  baseUrl: string;
  /** 请求头配置 */
  headers?: Record<string, string>;
  /** 请求超时时间（毫秒） */
  timeout?: number;
  /** HTTP 请求方法，默认为 POST */
  method?: "GET" | "POST" | "PUT" | "DELETE";
  /** 是否在页面隐藏时保持连接 */
  openWhenHidden?: boolean;
  /** 重试配置 */
  retry?: {
    /** 最大重试次数 */
    maxRetries: number;
    /** 初始重试间隔（毫秒） */
    retryDelay: number;
  };
  /** 自定义消息解析器 */
  messageParser?: (event: EventSourceMessage) => TMessage;
  /** 自定义退避策略 */
  backoffStrategy?: (retryCount: number) => number | null | undefined;
  /** 自定义完成标记 */
  doneTag?: string;
  /** 在匹配完成标记后，是否主动关闭底层连接 */
  closeOnDone?: boolean;
  /** 透传给 fetch 的额外配置 */
  requestInit?: RequestInit;
}

/**
 * 内部解析后的配置类型
 */
type ResolvedOptions<TMessage> = StreamFetchClientOptions<TMessage> &
  Required<
    Pick<
      StreamFetchClientOptions<TMessage>,
      "method" | "headers" | "timeout" | "openWhenHidden" | "retry"
    >
  >;

/**
 * 内部请求配置类型
 */
type InternalRequestConfig = {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers: Record<string, string>;
  body?: string;
};

/**
 * 自定义错误类型
 */
export class StreamFetchError extends Error {
  constructor(
    message: string,
    public status?: number,
    public retryCount: number = 0
  ) {
    super(message);
    this.name = "StreamFetchError";
  }
}

// ==================== 常量定义 ===================

/**
 * 默认配置常量
 */
const DEFAULT_CONFIG = {
  METHOD: "POST" as const,
  TIMEOUT: 30000,
  OPEN_WHEN_HIDDEN: true,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  DONE_TAG: "[DONE]",
  CLOSE_ON_DONE: true,
  ACCEPT_HEADER: "text/event-stream",
  CONTENT_TYPE: "application/json",
} as const;

/**
 * 内部完成标记
 */
const INTERNAL_DONE_MARKER = "__STREAM_DONE_INTERNAL__";

// ==================== SSE 流式请求管理器 ===================

/**
 * SSE 流式请求管理器
 *
 * 基于 @microsoft/fetch-event-source 的 SSE 流式请求管理器
 * - 支持 Server-Sent Events (SSE) 流式响应
 * - 自动重试与指数退避
 * - 请求超时与主动取消
 * - 统一错误封装与状态管理
 */
export default class StreamFetchClient<TRequest = unknown, TMessage = unknown> {
  // ==================== 私有属性 ===================

  /** 流式请求配置 */
  private readonly options: ResolvedOptions<TMessage>;
  /** 请求取消控制器 */
  private abortController: AbortController | null = null;
  /** 连接阶段超时定时器 */
  private connectTimeoutId: number | null = null;
  /** 重试次数 */
  private retryCount = 0;
  /** 请求状态 */
  private status: RequestStatus = RequestStatus.IDLE;
  /** 是否因完成标记而主动结束 */
  private completedByDoneTag = false;
  /** 确保 onComplete 只触发一次 */
  private hasCompleted = false;

  // ==================== 构造函数 ===================

  constructor(options: StreamFetchClientOptions<TMessage>) {
    this.options = this.resolveOptions(options);
  }

  // ==================== 公共方法 ===================

  /**
   * 发送流式请求
   * @param params - 请求参数
   * @param handlers - 事件处理器
   */
  public async sendRequest(
    params: TRequest,
    handlers: StreamFetchClientHandlers<TMessage>
  ): Promise<void> {
    this.initData(handlers);
    const requestConfig = this.buildRequestConfig(params);
    await this.startSseRequest(requestConfig, handlers);
  }

  /**
   * 是否处于已连接状态
   */
  public isConnected(): boolean {
    return this.status === RequestStatus.CONNECTED;
  }

  /**
   * 获取当前请求状态
   */
  public getStatus(): RequestStatus {
    return this.status;
  }

  /**
   * 获取当前已发生的重试次数
   */
  public getRetryCount(): number {
    return this.retryCount;
  }

  /**
   * 主动断开连接并重置内部状态为原始状态
   */
  public disconnect(): void {
    this.updateStatus(RequestStatus.IDLE, {
      abort: true,
      resetRetry: true,
      clearTimeout: true,
    });

    // 重置完成相关状态
    this.completedByDoneTag = false;
    this.hasCompleted = false;
  }

  // ==================== 私有方法 ===================

  /**
   * 解析配置选项，设置默认值
   */
  private resolveOptions(
    options: StreamFetchClientOptions<TMessage>
  ): ResolvedOptions<TMessage> {
    return {
      method: DEFAULT_CONFIG.METHOD,
      headers: {},
      timeout: DEFAULT_CONFIG.TIMEOUT,
      openWhenHidden: DEFAULT_CONFIG.OPEN_WHEN_HIDDEN,
      retry: {
        maxRetries: DEFAULT_CONFIG.MAX_RETRIES,
        retryDelay: DEFAULT_CONFIG.RETRY_DELAY,
      },
      doneTag: DEFAULT_CONFIG.DONE_TAG,
      closeOnDone: DEFAULT_CONFIG.CLOSE_ON_DONE,
      ...options,
    };
  }

  /**
   * 统一状态管理方法
   * @param newStatus - 新状态
   * @param options - 状态变更选项
   * @param options.clearTimeout - 是否清除连接超时定时器
   * @param options.resetRetry - 是否重置重试计数
   * @param options.setCompletedByDoneTag - 是否设置完成标记
   * @param options.setHasCompleted - 是否设置完成标记
   * @param options.abort - 是否中止当前连接
   */
  private updateStatus(
    newStatus: RequestStatus,
    options: {
      clearTimeout?: boolean;
      resetRetry?: boolean;
      setCompletedByDoneTag?: boolean;
      setHasCompleted?: boolean;
      abort?: boolean;
    } = {}
  ): void {
    const {
      clearTimeout = false,
      resetRetry = false,
      setCompletedByDoneTag = false,
      setHasCompleted = false,
      abort = false,
    } = options;

    this.status = newStatus;

    if (abort && this.abortController) {
      this.abortController.abort();
    }

    if (clearTimeout) {
      this.clearConnectTimeout();
    }

    if (resetRetry) {
      this.retryCount = 0;
    }

    if (setCompletedByDoneTag) {
      this.completedByDoneTag = true;
    }

    if (setHasCompleted) {
      this.hasCompleted = true;
    }
  }

  /**
   * 初始化数据
   */
  private initData(handlers: StreamFetchClientHandlers<TMessage>): void {
    this.updateStatus(RequestStatus.CONNECTING, {
      abort: true,
      resetRetry: false,
      clearTimeout: true,
    });

    // 重置完成相关状态
    this.completedByDoneTag = false;
    this.hasCompleted = false;

    this.abortController = new AbortController();

    if (this.options.timeout) {
      this.connectTimeoutId = setTimeout(() => {
        this.updateStatus(RequestStatus.ERROR, { abort: true });
        const timeoutError = new StreamFetchError(
          "请求超时",
          undefined,
          this.retryCount
        );
        handlers?.onError?.(timeoutError, this.retryCount);
      }, this.options.timeout);
    }
  }

  /**
   * 清除连接超时定时器
   */
  private clearConnectTimeout(): void {
    if (this.connectTimeoutId) {
      clearTimeout(this.connectTimeoutId);
      this.connectTimeoutId = null;
    }
  }

  /**
   * 启动 SSE 请求
   */
  private async startSseRequest(
    config: InternalRequestConfig,
    handlers: StreamFetchClientHandlers<TMessage>
  ): Promise<void> {
    const { url, method, headers, body } = config;

    try {
      await fetchEventSource(url, {
        ...(this.options.requestInit || {}),
        method,
        headers,
        body,
        signal: this.abortController!.signal,
        openWhenHidden: this.options.openWhenHidden,

        onopen: async (response) => {
          await this.handleConnectionOpen(response, handlers);
        },

        onmessage: (event: EventSourceMessage) => {
          this.handleSseMessage(event, handlers);
        },

        onclose: () => {
          this.completeOnce(handlers);
        },

        onerror: (error: any) => {
          return this.handleConnectionError(error, handlers);
        },
      });
    } catch (error) {
      if (
        error instanceof StreamFetchError &&
        error.message === INTERNAL_DONE_MARKER
      ) {
        return;
      }
      throw error;
    }
  }

  /**
   * 处理连接建立和错误
   */
  private async handleConnectionOpen(
    response: Response,
    handlers: StreamFetchClientHandlers<TMessage>
  ): Promise<void> {
    if (response.ok) {
      this.updateStatus(RequestStatus.CONNECTED, {
        clearTimeout: true,
        resetRetry: true,
      });
      handlers.onOpen?.();
      return;
    }

    const error = new StreamFetchError(
      "连接失败",
      response.status,
      this.retryCount
    );
    this.updateStatus(RequestStatus.ERROR);
    handlers?.onError?.(error, this.retryCount);
    throw error;
  }

  /**
   * 处理连接错误和重试逻辑
   */
  private handleConnectionError(
    error: any,
    handlers: StreamFetchClientHandlers<TMessage>
  ): number | undefined {
    // 检查是否为中止错误
    const aborted =
      error instanceof DOMException && error.name === "AbortError";

    if (aborted) {
      if (this.completedByDoneTag) {
        this.completeOnce(handlers);
        throw new StreamFetchError(
          INTERNAL_DONE_MARKER,
          undefined,
          this.retryCount
        );
      }

      const abortError = new StreamFetchError(
        "请求已中止",
        undefined,
        this.retryCount
      );
      this.updateStatus(RequestStatus.IDLE);
      handlers?.onError?.(abortError, this.retryCount);
      throw abortError;
    }

    // 标准化错误对象
    let streamError: StreamFetchError;
    if (error instanceof StreamFetchError) {
      streamError = error;
    } else if (typeof error?.status === "number") {
      const status = error.status as number;
      const message = status >= 500 ? "服务器内部错误" : "请求错误";
      streamError = new StreamFetchError(message, status, this.retryCount);
    } else {
      streamError = new StreamFetchError(
        "网络连接错误",
        undefined,
        this.retryCount
      );
    }

    this.updateStatus(RequestStatus.ERROR);
    handlers?.onError?.(streamError, this.retryCount);

    const nextDelay = this.shouldRetry();
    if (typeof nextDelay === "number") {
      this.retryCount += 1;
      return nextDelay;
    }

    throw streamError;
  }

  /**
   * 处理接收到的 SSE 消息
   */
  private handleSseMessage(
    event: EventSourceMessage,
    handlers: StreamFetchClientHandlers<TMessage>
  ): void {
    try {
      // 检查是否为完成消息
      if (this.options.doneTag && event.data === this.options.doneTag) {
        this.updateStatus(RequestStatus.COMPLETED, {
          setCompletedByDoneTag: true,
          setHasCompleted: true,
          clearTimeout: true,
        });

        if (this.options.closeOnDone && this.abortController) {
          this.abortController.abort();
        }
        return;
      }

      // 解析消息
      const parsed = this.options.messageParser
        ? this.options.messageParser(event)
        : ((() => {
            try {
              return JSON.parse(event.data);
            } catch {
              return event.data;
            }
          })() as unknown as TMessage);

      handlers?.onMessage?.(parsed, event);
    } catch (error) {
      console.warn("消息处理失败:", error);
    }
  }

  /**
   * 确保只调用一次完成回调
   */
  private completeOnce(handlers: StreamFetchClientHandlers<TMessage>): void {
    if (this.hasCompleted) return;

    this.updateStatus(RequestStatus.COMPLETED, {
      setHasCompleted: true,
      clearTimeout: true,
    });
    handlers?.onComplete?.();
  }

  /**
   * 构建请求配置
   */
  private buildRequestConfig(params: TRequest): InternalRequestConfig {
    const { method, baseUrl } = this.options;
    let url = baseUrl;
    let body: string | undefined;

    // 构建 URL 和请求体
    if (method === "GET") {
      const urlObj = new URL(baseUrl, window.location.origin);
      const searchRecord = this.serializeParams(params);

      if (searchRecord) {
        const query = new URLSearchParams(searchRecord);
        query.forEach((value, key) => {
          urlObj.searchParams.append(key, value);
        });
      }

      url = urlObj.toString();
    } else {
      body = JSON.stringify(params ?? {});
    }

    // 构建请求头
    const headers: Record<string, string> = {
      Accept: DEFAULT_CONFIG.ACCEPT_HEADER,
      ...this.options.headers,
    };

    if (body && !headers["Content-Type"]) {
      headers["Content-Type"] = DEFAULT_CONFIG.CONTENT_TYPE;
    }

    return { url, method, headers, body };
  }

  /**
   * 序列化参数
   */
  private serializeParams(input: unknown): Record<string, string> | undefined {
    if (input == null) return undefined;

    if (this.isPlainObject(input)) {
      const result: Record<string, string> = {};

      Object.entries(input).forEach(([key, value]) => {
        if (value == null) return;

        if (Array.isArray(value)) {
          result[key] = value.map((v) => String(v)).join(",");
        } else if (this.isPlainObject(value)) {
          result[key] = JSON.stringify(value);
        } else {
          result[key] = String(value);
        }
      });

      return result;
    }

    return {
      payload: typeof input === "string" ? input : JSON.stringify(input),
    };
  }

  /**
   * 判断是否为普通对象
   */
  private isPlainObject(val: unknown): val is Record<string, unknown> {
    return Object.prototype.toString.call(val) === "[object Object]";
  }

  /**
   * 判断是否应该重试
   */
  private shouldRetry(): number | undefined {
    if (this.retryCount >= this.options.retry.maxRetries) {
      return undefined;
    }

    const strategy = this.options.backoffStrategy;
    if (typeof strategy === "function") {
      const delay = strategy(this.retryCount);
      if (typeof delay === "number" && delay >= 0) {
        return delay;
      }
      return undefined;
    }

    // 默认指数退避：retryDelay * 2^retryCount 1000 2000 4000 ...这种重试时间间隔
    const base = this.options.retry.retryDelay;
    return base * Math.pow(2, this.retryCount);
  }
}
```
