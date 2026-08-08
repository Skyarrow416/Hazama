# GitHub 部署指南 | GitHub Deployment Guide

## 📋 前置准备

1. 确保已安装 Git 和 GitHub CLI
2. 登录 GitHub 账户

---

## 🚀 快速部署步骤

### 方法 1: 使用 GitHub CLI (推荐)

```bash
# 1. 登录 GitHub (如果尚未登录)
gh auth login

# 2. 创建 GitHub 仓库并推送
gh repo create Hazama --public --source=. --remote=origin --push

# 3. 在浏览器中打开仓库
gh repo view --web
```

### 方法 2: 手动创建仓库

```bash
# 1. 在 GitHub 网站上创建新仓库
# - 仓库名: Hazama
# - 描述: Internal Network Penetration Command Generator
# - 公开/私有: 公开 (Public)
# - 不要勾选 "Initialize with README" (我们已有本地仓库)

# 2. 添加远程仓库并推送
git remote add origin https://github.com/YOUR_USERNAME/Hazama.git
git branch -M main
git push -u origin main
```

---

## ⚙️ 配置 GitHub Pages

### 自动部署 (已配置 GitHub Actions)

推送到 `main` 分支后，GitHub Actions 会自动构建并部署到 GitHub Pages。

### 手动启用 GitHub Pages

1. 进入仓库设置: `Settings` → `Pages`
2. Source 选择: `GitHub Actions`
3. 等待 Actions 完成部署 (查看 `Actions` 标签页)
4. 部署完成后访问: `https://YOUR_USERNAME.github.io/Hazama/`

---

## 🔧 配置步骤详解

### 1. 更新 README 中的链接

将 `README.md` 中的 `yourusername` 替换为您的 GitHub 用户名：

```bash
# 使用 sed (Linux/Mac) 或手动替换
sed -i 's/yourusername/YOUR_USERNAME/g' README.md

# Windows (PowerShell)
(Get-Content README.md) -replace 'yourusername', 'YOUR_USERNAME' | Set-Content README.md
```

### 2. 更新 App.tsx 中的链接

同样将 `src/App.tsx` 中的 GitHub 链接更新为实际地址。

### 3. 提交并推送更新

```bash
git add README.md src/App.tsx
git commit -m "Update GitHub username in links"
git push
```

---

## 📦 本地测试部署

在推送到 GitHub 之前，先在本地测试构建：

```bash
# 构建生产版本
npm run build

# 预览生产版本
npm run preview
# 访问 http://localhost:4173/Hazama/
```

确保在预览中 `/Hazama/` 路径下页面正常加载（因为 vite.config.ts 中 base 设置为 `/Hazama/`）。

---

## 🔍 验证部署

### 1. 检查 Actions 状态

访问 `https://github.com/YOUR_USERNAME/Hazama/actions`，确保部署工作流成功运行。

### 2. 访问部署站点

访问 `https://YOUR_USERNAME.github.io/Hazama/`，验证所有功能正常。

### 3. 测试核心功能

- ✅ 页面加载正常
- ✅ 填写凭据配置
- ✅ 切换认证方式
- ✅ 选择工具并查看命令
- ✅ 复制命令功能
- ✅ localStorage 持久化 (刷新页面测试)

---

## 🐛 常见问题排查

### 问题 1: GitHub Pages 404 错误

**原因**: `vite.config.ts` 中的 `base` 路径不匹配。

**解决**:
- 仓库名必须是 `Hazama` (与 base 路径一致)
- 或修改 `vite.config.ts` 中的 `base: '/YOUR_REPO_NAME/'`

### 问题 2: Actions 部署失败

**原因**: 未启用 GitHub Pages 或权限不足。

**解决**:
1. 仓库设置 → `Actions` → `General` → `Workflow permissions` 选择 "Read and write permissions"
2. 仓库设置 → `Pages` → Source 选择 "GitHub Actions"

### 问题 3: 资源加载失败 (CSS/JS 404)

**原因**: `base` 路径配置错误。

**解决**:
- 检查 `vite.config.ts` 中 `base: '/Hazama/'` 是否与仓库名一致
- 重新构建并推送

---

## 📝 后续更新流程

每次更新代码后：

```bash
# 1. 提交更改
git add .
git commit -m "Update: 描述更新内容"

# 2. 推送到 GitHub
git push

# 3. GitHub Actions 会自动重新部署
# 查看 Actions 页面监控部署进度
```

---

## 🌟 可选: 自定义域名

如果您有自定义域名：

1. 在仓库根目录创建 `public/CNAME` 文件：
   ```
   hazama.yourdomain.com
   ```

2. 在域名 DNS 设置中添加 CNAME 记录：
   ```
   hazama.yourdomain.com -> YOUR_USERNAME.github.io
   ```

3. 推送更新：
   ```bash
   git add public/CNAME
   git commit -m "Add custom domain"
   git push
   ```

4. 在仓库设置 → Pages → Custom domain 中输入域名并保存。

---

## ✅ 部署检查清单

部署前确认：

- [ ] `README.md` 中的 `yourusername` 已替换为实际用户名
- [ ] `src/App.tsx` 中的 GitHub 链接已更新
- [ ] `vite.config.ts` 中 `base` 路径与仓库名一致
- [ ] 本地 `npm run build && npm run preview` 测试通过
- [ ] Git 仓库已初始化并提交所有文件
- [ ] GitHub 仓库已创建
- [ ] 已推送到 `main` 分支
- [ ] GitHub Actions 工作流已启用
- [ ] GitHub Pages 已配置为使用 Actions

---

完成以上步骤后，您的 Hazama 项目将成功部署到 GitHub Pages！

🎉 访问 `https://YOUR_USERNAME.github.io/Hazama/` 查看您的在线应用！
