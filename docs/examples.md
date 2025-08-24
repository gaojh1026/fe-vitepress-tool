# 🛠️ 前端工具集文档

欢迎使用前端工具集！这里包含了我们精心开发的各种实用工具，旨在提升您的前端开发效率。

## 📋 工具概览

### 🚀 SSE 流式管理器

**Server-Sent Events 流式请求管理工具**

- **功能特性**：

  - 自动连接管理（连接、重连、断开）
  - 智能错误处理和重试机制
  - 消息过滤和事件分发
  - 连接状态监控
  - 内存泄漏防护

- **适用场景**：

  - 实时聊天应用
  - 数据流监控
  - 实时通知系统
  - 股票价格更新
  - 社交媒体动态

- **技术优势**：
  - 基于原生 EventSource
  - 支持自定义重连策略
  - 提供完整的生命周期钩子
  - TypeScript 类型支持

[查看详细文档 →](/SSE流式管理器/)

### 🔄 轮询管理器

**智能轮询请求管理工具**

- **功能特性**：

  - 支持 Vue3 和 React 框架
  - 防抖和节流控制
  - 条件轮询（基于状态、时间等）
  - 并发控制
  - 自动清理和内存管理

- **适用场景**：

  - 数据同步和更新
  - 状态监控
  - 定时任务
  - 进度查询
  - 实时数据刷新

- **技术优势**：
  - 框架原生集成
  - 智能的请求控制
  - 完整的生命周期管理
  - 高性能和低内存占用

[查看详细文档 →](/轮询管理器/)

## 🎯 核心设计理念

### 1. **零配置原则**

所有工具都遵循"开箱即用"的设计理念，提供合理的默认配置，让开发者能够快速上手。

### 2. **类型安全**

完整的 TypeScript 支持，提供详细的类型定义和智能提示，减少运行时错误。

### 3. **性能优先**

优化的算法实现，最小化内存占用，确保在高频使用场景下的稳定性。

### 4. **易扩展性**

模块化设计，提供丰富的配置选项和生命周期钩子，满足各种定制需求。

## 🚀 快速上手

### 安装依赖

```bash
npm install
# 或
pnpm install
```

### 启动开发服务器

```bash
npm run dev
# 或
pnpm dev
```

### 构建文档

```bash
npm run build
# 或
pnpm docs:build
```

## 📚 使用示例

### SSE 流式管理器基础使用

```typescript
import { SSEManager } from "@fe-tools/sse-manager";

const sse = new SSEManager({
  url: "https://api.example.com/events",
  onMessage: (event) => {
    console.log("收到消息:", event.data);
  },
  onError: (error) => {
    console.error("连接错误:", error);
  },
});

// 开始连接
sse.connect();

// 断开连接
sse.disconnect();
```

### 轮询管理器基础使用

```typescript
import { usePolling } from "@fe-tools/polling-manager";

// Vue3 Composition API
const { start, stop, isPolling } = usePolling({
  request: fetchData,
  interval: 5000,
  immediate: true,
});

// 开始轮询
start();

// 停止轮询
stop();
```

## 🔧 配置选项

### 通用配置

所有工具都支持以下通用配置：

- **调试模式**：开启详细的日志输出
- **错误处理**：自定义错误处理策略
- **性能监控**：内置性能指标收集
- **内存管理**：自动清理和垃圾回收

### 环境配置

- **开发环境**：详细的调试信息和错误提示
- **生产环境**：优化的性能和最小的包体积
- **测试环境**：完整的测试覆盖和模拟支持

## 📖 最佳实践

### 1. **错误处理**

```typescript
// 始终提供错误处理回调
const manager = new ToolManager({
  onError: (error) => {
    // 记录错误日志
    console.error("工具错误:", error);

    // 用户友好的错误提示
    showErrorMessage("操作失败，请稍后重试");

    // 错误上报
    reportError(error);
  },
});
```

### 2. **资源清理**

```typescript
// 在组件卸载时清理资源
onUnmounted(() => {
  manager.disconnect();
  manager.cleanup();
});
```

### 3. **性能优化**

```typescript
// 使用防抖和节流控制请求频率
const manager = new PollingManager({
  debounce: 300,
  throttle: 1000,
  maxConcurrent: 3,
});
```

## 🐛 常见问题

### Q: 如何处理网络断开重连？

A: 所有工具都内置了自动重连机制，您可以通过配置自定义重连策略。

### Q: 如何避免内存泄漏？

A: 工具会自动清理资源，但建议在组件卸载时手动调用清理方法。

### Q: 支持哪些浏览器？

A: 支持所有现代浏览器，包括 Chrome、Firefox、Safari、Edge 等。

## 🤝 获取帮助

如果您在使用过程中遇到问题，可以通过以下方式获取帮助：

- 📖 **文档**：仔细阅读相关工具的详细文档
- 🔍 **搜索**：使用页面右上角的搜索功能
- 💬 **社区**：在 GitHub Discussions 中提问
- 🐛 **问题反馈**：提交 GitHub Issue
- 📧 **邮件支持**：发送邮件到项目维护者

## 📈 更新日志

查看最新的功能更新和 bug 修复：[更新日志](https://github.com/gaojh1026/fe-vitepress-tool/releases)

---

感谢您使用前端工具集！如果您觉得这些工具有帮助，请给项目点个 ⭐️，您的支持是我们持续改进的动力。
