# StreamFetchClient 使用文档

> 本文档提供了 StreamFetchClient(SSE 流式管理器)的完整使用指南，包括 API 参考、配置选项、使用示例和最佳实践等。

## 基础用法

### 1. 创建客户端实例

```typescript
import StreamFetchClient from "./stream-client";

const client = new StreamFetchClient({
  baseUrl: "https://api.example.com/stream",
});
```

### 2. 发送监听流式请求

```typescript
const handlers = {
  onMessage: (data, event) => {
    console.log("收到消息:", data);
  },
  onComplete: () => {
    console.log("请求完成");
  },
  onError: (error, retryCount) => {
    console.error("发生错误:", error.message, "重试次数:", retryCount);
  },
  onOpen: () => {
    console.log("连接已建立");
  },
};

const sendRequest = async () => {
  await client.sendRequest({ prompt: "你好，请介绍一下自己" }, handlers);
};
```

## 检查 SSE 是否连接

> 提供 `isConnected()` 方法判断是否连接，返回值为 `boolean`

```typescript
function isConnected() {
  return client.isConnected() || false;
}
```

## 获取 SSE 连接状态

> 提供 `getStatus()` 方法获取当前连接状态，返回值为 `RequestStatus`

```typescript
import RequestStatus from "./stream-client";

function getStatus(): RequestStatus {
  return client?.getStatus() || RequestStatus.IDLE;
}
```

## 取消当前 SSE 请求

> 提供 `disconnect()` 方法取消当前连接

```typescript
function cancelRequest(): void {
  if (client) {
    client.disconnect();
    client = null;
  }
}
```

## 切换`GET` 、`POST`请求

- **默认为 `POST` 请求**
- **会自行针对 `POST` 或者 `GET` 请求对请求参数进行转译，如果是 `GET` ，拼接到链接上，如果是 `POST` ，从 body 传入**

```typescript
const client = new StreamFetchClient({
  method: "GET",
  baseUrl: "https://api.example.com/stream",
  timeout: 30000,
  retry: {
    maxRetries: 3,
    retryDelay: 1000,
  },
});
```

## 自定义消息解析器 `messageParser`

> 提供 `messageParser` 配置，处理 sse 接口返回的信息给到 `onMessage()` 方法回调

```typescript
const client = new StreamFetchClient({
  baseUrl: "https://api.example.com/stream",
  timeout: 30000,
  retry: {
    maxRetries: 3,
    retryDelay: 1000,
  },
  messageParser: (event) => {
    console.log("event--", event);

    return {
      type: "content",
      data: {
        content: "好的我拦截了",
        sessionId: "session_1755591292050_3i8caw7ku",
        chartId: "mei9q5qo-5ggtwxqs2xx",
      },
      timestamp: "2025-08-19T08:14:52.369Z",
      id: "content_1",
    };
  },
});
```

## 自定义超时时间&自动重连次数

- `timeout` 定义超时时长，超时的话，`onError()` 会抛出超时异常
- `retry` 配置连接失败重新尝试连接的次数和时间间隔,其中 `maxRetries` 为最大允许重试次数，`retryDelay` 为每次重试间隔时间，其中支持指数退避，也就是
  1000ms、2000ms、4000ms、8000ms 这种时间间隔重试
- 也可以搭配 `backoffStrategy` 自定义重试策略

```typescript
const client = new StreamFetchClient({
  baseUrl: "https://api.example.com/stream",
  timeout: 30000,
  retry: {
    maxRetries: 3,
    retryDelay: 1000,
  },
});
```

## 自定义重试策略

> 支持配置 `backoffStrategy` 自定义重试策略，函数参数值 `retryCount` : 当前重试次数，配置了 `backoffStrategy` ，那么 `retry.retryDelay` 就失效了

默认使用指数退避算法：

- 第 1 次重试：1000ms
- 第 2 次重试：2000ms
- 第 3 次重试：4000ms
- 第 4 次重试：8000ms

可以通过 `backoffStrategy` 自定义重试间隔。

```typescript
const client = new StreamFetchClient({
  baseUrl: "https://api.example.com/stream",
  timeout: 30000,
  retry: {
    maxRetries: 3,
    retryDelay: 1000, // 失效了
  },
  backoffStrategy: (retryCount: number) => {
    const base = 10000; // 每10s重试一次，最大允许重试3次
    return base;
  },
});
```

## 自定义请求头 `headers`

> 可能在实际业务中需要配置一些自定义的 headers，那么这个时候就可以使用 `headers`

```typescript
const client = new StreamFetchClient({
  baseUrl: "https://api.example.com/stream",
  headers: {
    Authorization: "Bearer token123",
    "Custom-Header": "value",
    "X-Session-Id": "sse_test_id",
  },
});
```

## 自定义透传给 fetch 的额外配置

> `@microsoft/fetch-event-source` 还支持一些配置，可以改 fetch 请求，那这里我们也提供一个参数 `requestInit` 可以透传 options

例如如果我们不想我们的请求携带 cookie，可以这样配置

```typescript
const client = new StreamFetchClient({
  baseUrl: "https://api.example.com/stream",
  requestInit: {
    credentials: "omit", // 请求不携带cookie
  },
});
```

## 自定义 SSE 消息完成标记

> 默认大模型接口，openAI 的 SSE 消息完成标记是 '[DONE]'，那么我们也可以自定义自己的完成标记，当 SSE 接口返回的信息标志是 `doneTag` 的时候，我们认为
> 消息发送完成，就会发送完成信息，状态设置为完成

```typescript
const client = new StreamFetchClient({
  baseUrl: "https://api.example.com/stream",
  doneTag: "complete",
});
```

## 主动关闭底层连接&页面隐藏时保持连接

> `openWhenHidden` : 是否在页面隐藏时保持连接
> `closeOnDone` : 在匹配完成标记后，是否主动关闭底层连接

```typescript
const client = new StreamFetchClient({
  baseUrl: "https://api.example.com/stream",
  closeOnDone: false,
  openWhenHidden: false,
});
```

## 使用示例

### AI 聊天流式响应

```typescript
import StreamFetchClient from "./stream-client";

class ChatService {
  private client: StreamFetchClient;

  constructor() {
    this.client = new StreamFetchClient({
      baseUrl: "https://api.openai.com/v1/chat/completions",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 60000,
      retry: {
        maxRetries: 3,
        retryDelay: 1000,
      },
      doneTag: "[DONE]",
      closeOnDone: true,
    });
  }

  async sendMessage(message: string, onChunk: (chunk: string) => void) {
    const handlers = {
      onMessage: (data: any) => {
        if (data.choices?.[0]?.delta?.content) {
          onChunk(data.choices[0].delta.content);
        }
      },
      onComplete: () => {
        console.log("聊天完成");
      },
      onError: (error: any) => {
        console.error("聊天错误:", error.message);
      },
      onOpen: () => {
        console.log("开始聊天...");
      },
    };

    await this.client.sendRequest(
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }],
        stream: true,
      },
      handlers
    );
  }

  disconnect() {
    this.client.disconnect();
  }
}

// 使用示例
const chatService = new ChatService();

chatService.sendMessage("你好，请介绍一下自己", (chunk) => {
  console.log("收到:", chunk);
});
```

### 实时数据监控

```typescript
import StreamFetchClient from "./stream-client";

class DataMonitor {
  private client: StreamFetchClient;
  private isMonitoring = false;

  constructor() {
    this.client = new StreamFetchClient({
      baseUrl: "https://api.example.com/monitor/stream",
      timeout: 30000,
      openWhenHidden: false, // 页面隐藏时停止监控
      retry: {
        maxRetries: 5,
        retryDelay: 2000,
      },
    });
  }

  startMonitoring(onData: (data: any) => void) {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    const handlers = {
      onMessage: (data: any) => {
        onData(data);
      },
      onComplete: () => {
        this.isMonitoring = false;
        console.log("监控结束");
      },
      onError: (error: any) => {
        this.isMonitoring = false;
        console.error("监控错误:", error.message);
      },
      onOpen: () => {
        console.log("开始监控...");
      },
    };

    this.client.sendRequest({ action: "start" }, handlers);
  }

  stopMonitoring() {
    this.client.disconnect();
    this.isMonitoring = false;
  }
}
```

## 最佳实践

### 1. 资源管理

```typescript
class StreamManager {
  private clients: StreamFetchClient[] = [];

  addClient(client: StreamFetchClient) {
    this.clients.push(client);
  }

  disconnectAll() {
    this.clients.forEach((client) => client.disconnect());
    this.clients = [];
  }

  // 在组件卸载时调用
  cleanup() {
    this.disconnectAll();
  }
}
```

### 2. 错误恢复

```typescript
const handlers = {
  onError: async (error, retryCount) => {
    if (retryCount >= 3) {
      // 重试次数过多，显示用户友好的错误信息
      showErrorMessage("连接失败，请稍后重试");
      return;
    }

    // 可以在这里添加用户通知
    if (retryCount === 0) {
      showNotification("连接中断，正在重试...");
    }
  },
};
```

### 3. 性能优化

```typescript
// ❌避免频繁创建客户端实例
const globalClient = new StreamFetchClient({
  baseUrl: "https://api.example.com/stream",
  // 配置...
});

// ✅在需要时复用
export const useStreamClient = () => globalClient;
```

### 4.错误处理

#### 4.1 错误类型

所有错误都封装在 `StreamFetchError` 类中：

```typescript
export class StreamFetchError extends Error {
  constructor(
    message: string, // 错误消息
    status?: number, // HTTP 状态码
    retryCount: number = 0 // 当前重试次数
  );
}
```

#### 4.2 常见错误场景

1. **连接超时**: 请求在指定时间内未建立连接
2. **服务器错误**: HTTP 5xx 状态码
3. **客户端错误**: HTTP 4xx 状态码
4. **网络错误**: 网络连接问题
5. **请求中止**: 用户主动取消请求

#### 4.3 错误处理最佳实践

```typescript
const handlers = {
  onError: (error, retryCount) => {
    // 根据错误类型进行不同处理
    if (error.status >= 500) {
      console.error("服务器错误，将进行重试:", error.message);
    } else if (error.status === 429) {
      console.error("请求过于频繁，等待后重试:", error.message);
    } else if (error.status >= 400) {
      console.error("客户端错误，停止重试:", error.message);
      // 可以显示用户友好的错误信息
    } else {
      console.error("网络错误:", error.message);
    }

    // 记录重试次数
    if (retryCount > 0) {
      console.log(`第 ${retryCount} 次重试`);
    }
  },
};
```

### 5.注意事项

1. **内存管理**: 长时间连接时注意及时调用 `disconnect()` 方法
2. **错误处理**: 始终实现 `onError` 回调以处理异常情况
3. **重试策略**: 根据业务需求合理配置重试次数和间隔
4. **超时设置**: 根据网络环境调整超时时间
5. **页面可见性**: 考虑页面隐藏时的连接策略

## API 参考

### SSE 管理器支持配置 `StreamFetchClientOptions`

| 配置项          | 类型                                                  | 说明                               | 默认值                                |
| --------------- | ----------------------------------------------------- | ---------------------------------- | ------------------------------------- |
| baseUrl         | `string`                                              | 基础请求 URL                       | -（必填）                             |
| headers         | `Record<string, string>`                              | 请求头配置                         | `{}`                                  |
| timeout         | `number`                                              | 请求超时时间（毫秒）               | `30000`                               |
| method          | `'GET' \| 'POST' \| 'PUT' \| 'DELETE'`                | HTTP 请求方法                      | `'POST'`                              |
| openWhenHidden  | `boolean`                                             | 页面隐藏时是否保持连接             | `true`                                |
| retry           | `{ maxRetries: number; retryDelay: number }`          | 重试配置                           | `{ maxRetries: 3, retryDelay: 1000 }` |
| messageParser   | `(event: EventSourceMessage) => TMessage`             | 自定义消息解析器                   | `undefined`                           |
| backoffStrategy | `(retryCount: number) => number \| null \| undefined` | 自定义退避策略                     | `undefined`                           |
| doneTag         | `string`                                              | 自定义完成标记                     | `"[DONE]"`                            |
| closeOnDone     | `boolean`                                             | 匹配完成标记后是否主动关闭底层连接 | `true`                                |
| requestInit     | `RequestInit`                                         | 透传给 fetch 的额外配置            | `undefined`                           |

### SSE 管理器支持的回调方法 `StreamFetchClientHandlers`

| 回调方法名   | 类型说明                                                 | 触发时机       | 说明                 |
| ------------ | -------------------------------------------------------- | -------------- | -------------------- |
| `onMessage`  | `(data: TMessage, event: EventSourceMessage) => void`    | 收到消息时     | 处理服务端推送的数据 |
| `onComplete` | `() => void`                                             | 流式请求完成时 | 连接正常结束时触发   |
| `onError`    | `(error: StreamFetchError, retryCount?: number) => void` | 发生错误时     | 处理异常和重试逻辑   |
| `onOpen`     | `() => void`                                             | 连接建立成功时 | SSE 连接已建立时触发 |

### SSE 管理器公共方法

| 方法名          | 参数                                                                    | 返回值类型      | 说明         |
| --------------- | ----------------------------------------------------------------------- | --------------- | ------------ |
| `sendRequest`   | `params: TRequest`,<br/>`handlers: StreamFetchClientHandlers<TMessage>` | `Promise<void>` | 发送流式请求 |
| `isConnected`   | 无                                                                      | `boolean`       | 检查连接状态 |
| `getStatus`     | 无                                                                      | `RequestStatus` | 获取当前状态 |
| `getRetryCount` | 无                                                                      | `number`        | 获取重试次数 |
| `disconnect`    | 无                                                                      | `void`          | 主动断开连接 |

> **说明：**
>
> - `baseUrl` 为必填项，无默认值。
> - `headers`、`messageParser`、`backoffStrategy`、`requestInit` 默认未设置。
> - `retry` 默认 `{ maxRetries: 3, retryDelay: 1000 }`，可单独覆盖。

### SSE 管理器的状态 `RequestStatus` 枚举

| 枚举值         | 字符串值     | 说明         |
| -------------- | ------------ | ------------ |
| **IDLE**       | `idle`       | **空闲状态** |
| **CONNECTING** | `connecting` | **连接中**   |
| **CONNECTED**  | `connected`  | **已连接**   |
| **ERROR**      | `error`      | **错误状态** |
| **COMPLETED**  | `completed`  | **完成状态** |

### 仅参考，`fetchEventSource` 原参数值(可能有一些废弃了)

| 参数名         | 类型                                    | 说明                                                | 默认值  |
| -------------- | --------------------------------------- | --------------------------------------------------- | ------- |
| url            | `string`                                | 服务器端点 URL                                      | -       |
| options        | `object`                                | 配置选项                                            | -       |
| method         | `string`                                | HTTP 请求方法                                       | `'GET'` |
| headers        | `object`                                | 请求头                                              | -       |
| body           | `string \| FormData \| URLSearchParams` | 请求体                                              | -       |
| credentials    | `string`                                | 凭证模式，如 `'include'`, `'omit'`, `'same-origin'` | -       |
| signal         | `AbortSignal`                           | 用于中止请求的信号                                  | -       |
| openWhenHidden | `boolean`                               | 当页面不可见时是否保持连接                          | `true`  |
| fetch          | `function`                              | 自定义 fetch 实现                                   | -       |
| onopen         | `function`                              | 连接打开时的回调                                    | -       |
| onmessage      | `function`                              | 接收消息时的回调                                    | -       |
| onclose        | `function`                              | 连接关闭时的回调                                    | -       |
| onerror        | `function`                              | 发生错误时的回调                                    | -       |
| retry          | `object \| function`                    | 重试策略配置                                        | -       |
