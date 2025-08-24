# 🚀 前端工具集 (fe-vitepress-tool)

> 专注于前端开发的实用工具集合，提升开发效率，让编码更简单

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![VitePress](https://img.shields.io/badge/VitePress-1.6.4+-brightgreen.svg)](https://vitepress.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

## ✨ 特性

- 🚀 **SSE流式管理器** - 高效的Server-Sent Events流式请求管理
- 🔄 **轮询管理器** - 智能的轮询请求管理，支持Vue3和React
- 📚 **完整文档** - 详细的API文档和使用示例
- 🛠️ **开箱即用** - 零配置，即插即用
- 🔧 **高度可定制** - 灵活的配置选项和生命周期钩子
- 📱 **多框架支持** - 原生支持Vue3、React等主流框架
- 🎯 **类型安全** - 完整的TypeScript支持

## 🎯 解决的问题

前端开发中经常遇到一些重复性的问题：

- **实时数据流处理**：需要处理SSE连接、重连、错误处理等
- **轮询请求管理**：需要控制请求频率、处理并发、管理生命周期等
- **状态管理**：需要统一管理异步操作的状态和错误

我们的工具集正是为了解决这些问题而生！

## 🚀 快速开始

### 安装依赖

```bash
# 使用 npm
npm install

# 使用 pnpm (推荐)
pnpm install

# 使用 yarn
yarn install
```

### 启动开发服务器

```bash
# 启动文档开发服务器
npm run dev
# 或
pnpm dev
# 或
yarn dev
```

### 构建文档

```bash
# 构建生产版本
npm run build
# 或
pnpm docs:build
# 或
yarn docs:build
```

### 预览构建结果

```bash
# 预览构建后的文档
npm run preview
# 或
pnpm docs:preview
# 或
yarn docs:preview
```

## 📖 文档导航

- **[首页](https://gaojh1026.github.io/fe-vitepress-tool/)** - 项目概览和快速开始
- **[工具文档](https://gaojh1026.github.io/fe-vitepress-tool/examples)** - 所有工具的详细说明
- **[SSE流式管理器](https://gaojh1026.github.io/fe-vitepress-tool/SSE流式管理器/)** - 流式请求管理工具
- **[轮询管理器](https://gaojh1026.github.io/fe-vitepress-tool/轮询管理器/)** - 智能轮询管理工具

## 🛠️ 工具介绍

### SSE流式管理器

高效的Server-Sent Events流式请求管理工具，支持：

- 自动连接管理（连接、重连、断开）
- 智能错误处理和重试机制
- 消息过滤和事件分发
- 连接状态监控
- 内存泄漏防护

**适用场景**：实时聊天、数据流监控、实时通知、股票价格更新等

### 轮询管理器

智能的轮询请求管理工具，支持Vue3和React，提供：

- 防抖和节流控制
- 条件轮询（基于状态、时间等）
- 并发控制
- 自动清理和内存管理

**适用场景**：数据同步、状态监控、定时任务、进度查询等

## 🔧 技术栈

- **文档框架**: [VitePress](https://vitepress.dev/) - 现代化的静态站点生成器
- **开发语言**: [TypeScript](https://www.typescriptlang.org/) - 类型安全的JavaScript超集
- **包管理器**: [pnpm](https://pnpm.io/) - 快速、节省磁盘空间的包管理器
- **构建工具**: [Vite](https://vitejs.dev/) - 下一代前端构建工具

## 📁 项目结构

```
fe-vitepress-tool/
├── docs/                          # 文档目录
│   ├── .vitepress/               # VitePress配置
│   ├── SSE流式管理器/            # SSE工具文档
│   ├── 轮询管理器/               # 轮询工具文档
│   ├── examples.md               # 工具文档概览
│   └── index.md                  # 首页
├── public/                       # 静态资源
│   └── icons/                    # 图标文件
├── package.json                  # 项目配置
├── pnpm-lock.yaml               # 依赖锁定文件
└── README.md                     # 项目说明
```

## 🎨 自定义配置

### VitePress配置

项目使用VitePress作为文档框架，主要配置在 `docs/.vitepress/config.mts` 中：

- 站点标题和描述
- 导航菜单
- 侧边栏配置
- 搜索功能
- 社交链接
- 页脚信息

### 侧边栏配置

使用 `vitepress-sidebar` 插件自动生成侧边栏，配置在 `docs/.vitepress/config.mts` 中：

- 自动扫描文档目录
- 支持文件夹排序
- 可自定义标题显示规则

## 🤝 贡献指南

我们欢迎所有形式的贡献！如果您想为项目做出贡献，请：

1. **Fork** 这个仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'feat: 添加一些惊人的特性'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 **Pull Request**

### 提交信息规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档改变
- `style`: 代码格式改变
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 增加测试
- `chore`: 构建过程或辅助工具的变动

## 📄 许可证

本项目基于 [ISC License](LICENSE) 开源协议。

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！

## 📞 联系我们

- 📧 **GitHub Issues**: [提交问题](https://github.com/gaojh1026/fe-vitepress-tool/issues)
- 💬 **微信**: 扫描文档页面右下角二维码
- 🌟 **GitHub**: [给项目点个Star](https://github.com/gaojh1026/fe-vitepress-tool)

---

如果这个项目对您有帮助，请给我们一个 ⭐️！您的支持是我们持续改进的动力。
