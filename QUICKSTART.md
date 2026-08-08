# 🚀 快速推送到 GitHub

## 立即执行以下命令

### 方法 1: 使用 GitHub CLI (最快)

```bash
# 登录 GitHub (如果尚未登录)
gh auth login

# 创建仓库并推送
gh repo create Hazama --public --source=. --remote=origin --push

# 打开仓库查看
gh repo view --web
```

### 方法 2: 手动创建仓库

1. **在 GitHub 网站创建新仓库**
   - 访问: https://github.com/new
   - 仓库名: `Hazama`
   - 描述: `Internal Network Penetration Command Generator`
   - 公开 (Public)
   - **不要**勾选 "Add a README file"

2. **推送代码**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/Hazama.git
   git branch -M main
   git push -u origin main
   ```

## ⚙️ 启用 GitHub Pages

推送后立即配置：

1. 进入仓库页面
2. 点击 `Settings` → `Pages`
3. Source 选择: `GitHub Actions`
4. 等待 2-3 分钟，Actions 会自动部署
5. 访问: `https://YOUR_USERNAME.github.io/Hazama/`

## 📝 重要: 更新用户名

推送后，将 README.md 和 App.tsx 中的 `yourusername` 替换为您的实际 GitHub 用户名：

```bash
# Linux/Mac
sed -i 's/yourusername/YOUR_USERNAME/g' README.md
sed -i 's/yourusername/YOUR_USERNAME/g' src/App.tsx

# Windows (PowerShell)
(Get-Content README.md) -replace 'yourusername', 'YOUR_USERNAME' | Set-Content README.md
(Get-Content src/App.tsx) -replace 'yourusername', 'YOUR_USERNAME' | Set-Content src/App.tsx

# 提交更新
git add README.md src/App.tsx
git commit -m "Update GitHub username"
git push
```

## ✅ 完成！

部署完成后，您的 Hazama 将在以下地址可用：

🌐 **https://YOUR_USERNAME.github.io/Hazama/**

---

详细步骤和问题排查请查看 `DEPLOY.md`
