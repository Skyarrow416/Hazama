# GitHub Pages 多项目共存方案

## 当前情况

- ✅ 已有个人博客: https://skyarrow416.github.io/
- 🎯 想部署 Hazama: 需要一个独立地址

## 推荐方案：作为项目页面部署

### 方案说明

GitHub Pages 支持：
- **用户/组织页面**: `username.github.io` 仓库 → `https://username.github.io/`
- **项目页面**: 任何其他仓库 → `https://username.github.io/repo-name/`

您的博客占用了用户页面，Hazama 可以作为项目页面部署。

---

## ✅ 解决方案：保持当前配置不变

### 当前 Hazama 配置已经是项目页面模式！

您的 Hazama 已经配置为项目页面：
- `vite.config.ts` 中 `base: '/Hazama/'` ✅
- GitHub Actions 部署配置 ✅
- 会部署到: `https://skyarrow416.github.io/Hazama/` ✅

### 这不会影响您的博客！

- 博客继续在: `https://skyarrow416.github.io/` (根路径)
- Hazama 将在: `https://skyarrow416.github.io/Hazama/` (子路径)
- 两者完全独立，互不干扰

---

## 🚀 操作步骤（无需修改任何配置）

### 步骤 1: 创建 Hazama 仓库

访问: https://github.com/new

填写:
- Repository name: `Hazama`
- Description: `Internal Network Penetration Command Generator`
- Public
- 不勾选 "Add a README file"

### 步骤 2: 推送代码

```bash
git remote add origin https://github.com/Skyarrow416/Hazama.git
git branch -M main
git push -u origin main
```

### 步骤 3: 启用 GitHub Pages (项目页面)

1. 访问: https://github.com/Skyarrow416/Hazama/settings/pages
2. Source 选择: **GitHub Actions**
3. 等待部署完成

### 步骤 4: 访问

- 您的博客: `https://skyarrow416.github.io/`
- Hazama: `https://skyarrow416.github.io/Hazama/`

---

## 🔍 验证配置

当前 vite.config.ts 配置:
```typescript
export default defineConfig({
  plugins: [react()],
  base: '/Hazama/',  // ← 这个确保部署到子路径
})
```

这个配置完美支持项目页面部署！

---

## 📋 多个项目示例

您可以继续部署更多项目，例如:

- `https://skyarrow416.github.io/` - 个人博客
- `https://skyarrow416.github.io/Hazama/` - 渗透测试工具
- `https://skyarrow416.github.io/project2/` - 其他项目
- `https://skyarrow416.github.io/project3/` - 更多项目

每个仓库独立部署，互不影响！

---

## ✅ 结论

**无需任何修改！** 现在的配置已经支持和博客共存。

直接执行推送命令即可:

```bash
git remote add origin https://github.com/Skyarrow416/Hazama.git
git branch -M main
git push -u origin main
```

Hazama 会自动部署到 `https://skyarrow416.github.io/Hazama/`，不会影响您的博客！
