# GitHub Pages 部署指南

## 自动部署配置

本项目已经配置了 GitHub Actions 工作流，可以自动构建和部署 VitePress 站点到 GitHub Pages。

### 部署步骤

1. **推送代码到 main 分支**

   - 当你推送代码到 `main` 分支时，GitHub Actions 会自动触发构建和部署
   - 或者你可以在 GitHub 仓库的 Actions 页面手动触发部署

2. **启用 GitHub Pages**

   - 进入你的 GitHub 仓库设置
   - 找到 "Pages" 选项
   - 在 "Source" 部分选择 "GitHub Actions"

3. **等待部署完成**
   - 部署完成后，你的站点将可以通过 `https://你的用户名.github.io/project-vitepress/` 访问

### 手动部署

如果你想手动部署，可以运行以下命令：

```bash
# 安装依赖
pnpm install

# 构建项目
pnpm docs:build

# 预览构建结果
pnpm docs:preview
```

### 注意事项

- 确保你的仓库是公开的（或者你有 GitHub Pro 账户）
- 第一次部署可能需要几分钟时间
- 如果遇到问题，可以查看 GitHub Actions 的日志输出

### 自定义域名

如果你想使用自定义域名，可以在仓库设置中添加自定义域名，并在 VitePress 配置中更新相应的设置。
