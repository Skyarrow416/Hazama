# Hazama

[![Version](https://img.shields.io/badge/version-0.2.0--beta-blue.svg)](https://github.com/Skyarrow416/Hazama)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Deploy](https://img.shields.io/badge/deploy-GitHub%20Pages-brightgreen.svg)](https://Skyarrow416.github.io/Hazama/)

**Hazama - Internal Network Penetration Command Generator**

一个**纯前端**的内网渗透命令生成器，支持 **Impacket (全 60 个命令)**、**bloodyAD**、**Certipy**、**NetExec**、**Evil-WinRM**、**Kerberos** 和 **BloodHound** 等常见内网渗透工具的命令自动生成。

用户只需填写一份共享的凭据配置（域名、用户名、密码/哈希/Kerberos票据等），所有命令将**实时生成**，支持一键复制。

🌐 **在线体验**: [https://Skyarrow416.github.io/Hazama/](https://Skyarrow416.github.io/Hazama/)

---

## ⚠️ 免责声明 | Disclaimer

**本工具仅用于授权渗透测试、红队演练、CTF 竞赛与网络安全教学。**  
**This tool is for authorized penetration testing, red team exercises, CTF competitions, and cybersecurity education ONLY.**

严禁用于任何非法用途。使用者需自行承担使用本工具产生的一切法律责任。

---

## ✨ 特性 | Features

- ✅ **纯前端** - Vite + React + TypeScript + Tailwind CSS，零后端依赖
- ✅ **多认证方式** - 支持密码 / NTLM Hash (Pass-the-Hash) / Kerberos / AES Key，一键切换
- ✅ **实时生成** - 修改凭据后所有命令自动更新
- ✅ **290+ 条命令** - 涵盖 100+ 常用内网渗透工具/子命令
- ✅ **用法详解** - 每条命令附带严格对照官方 argparse 定义的参数说明与填好值的真实样例
- ✅ **占位符高亮** - 未填字段以黄色高亮显示，快速定位缺失参数
- ✅ **一键复制** - 每条命令支持 Clipboard API 一键复制
- ✅ **本地持久化** - 配置保存到 localStorage，刷新不丢失
- ✅ **静态部署** - 可部署到 GitHub Pages / Vercel / Netlify 或离线使用

---

## 🎯 当前版本: v0.2.0-beta

### 已实现功能
- ✅ 6 大工具分类（Impacket, bloodyAD, Certipy, NetExec, Kerberos/BloodHound, 文件传输）
- ✅ 105+ 工具/子命令，290+ 条预定义命令
- ✅ Impacket 覆盖 Kali `impacket-scripts` 全部 60 个命令，参数与本机 v0.14.0.dev0 argparse 定义逐一核对
- ✅ bloodyAD v2.5.4 全类别（add/get/set/remove/msldap）命令生成器，内置 ACL 攻击面简介
- ✅ 每条命令附「用法详解/生成器指南」与真实样例（可折叠）
- ✅ 文件传输模块：HTTP/SMB/FTP/BITS/certutil/PowerShell 六类通道，CMD 与 PowerShell 双格式
- ✅ 4 种认证方式自动切换
- ✅ 实时命令生成与占位符高亮
- ✅ localStorage 持久化
- ✅ 响应式深色终端风格 UI

### 计划功能 (后续版本)
- [ ] 更多工具支持（Covenant, Cobalt Strike, PowerShell Empire）
- [ ] 命令历史记录
- [ ] 自定义命令模板
- [ ] 批量导出命令到脚本文件
- [ ] 多语言支持（English / 简体中文）

---

## 🛠️ 支持的工具 | Supported Tools

### 1. **Impacket** (60 个工具, 166 条命令 —— Kali `impacket-scripts` 全覆盖)
- **远程执行** - `impacket-psexec` / `wmiexec` / `smbexec` / `atexec` / `dcomexec`
- **凭据导出** - `impacket-secretsdump`(DCSync/VSS/离线解析) / `dpapi` / `mimikatz` / `GetLAPSPassword` / `Get-GPPPassword` / `changepasswd`
- **Kerberos** - `GetUserSPNs`(Kerberoasting) / `GetNPUsers`(AS-REP) / `getTGT` / `getST`(S4U 委派) / `ticketer`(黄金/白银票据) / `ticketConverter` / `describeTicket` / `getPac` / `goldenPac` / `keylistattack`
- **AD 权限攻击** - `dacledit` / `owneredit` / `rbcd` / `addcomputer` / `raiseChild`(子域到林根) / `ntlmrelayx`(NTLM 中继)
- **枚举** - `lookupsid` / `samrdump` / `rpcdump` / `rpcmap` / `GetADUsers` / `GetADComputers` / `findDelegation` / `netview` / `net` / `DumpNTLMInfo` / `getArch` / `machine_role` / `mssqlinstance`
- **SMB/文件/注册表** - `smbclient` / `smbserver` / `karmaSMB` / `services` / `reg` / `registry-read` / `ntfs-read` / `esentutl` / `split`
- **其他** - `mssqlclient` / `wmipersist` / `wmiquery` / `ping` / `ping6` / `rdp_check` / `mqtt_check` / `sniff` / `sniffer` / `sambaPipe` / `tstool` / `exchanger`

### 2. **bloodyAD (ACL/AD 操作)** (7 个工具组, 63 条命令, v2.5.4)
- **总览** - 全局参数详解 + ACL 攻击面简介（DACL/ACE、GenericAll/WriteDacl/WriteOwner、RBCD、Shadow Credentials）
- **add** - `computer` / `user` / `groupMember` / `genericAll` / `dcsync` / `rbcd` / `shadowCredentials` / `uac` / `dnsRecord` / `badSuccessor`
- **get** - `object` / `search` / `writable` / `membership` / `children` / `dnsDump` / `trusts` / `bloodhound`
- **set** - `object` / `owner` / `password` / `restore`
- **remove** - `genericAll` / `dcsync` / `rbcd` / `shadowCredentials` / `groupMember` / `object` / `uac` / `dnsRecord`
- **msldap** - 28 个精选子命令（`whoami` / `query` / `dump` / `getsd` / `setsd` / `laps` / `gmsa` / `shadowcred` / `changeuserpw` 等）

### 3. **Certipy (ADCS)** (11 个工具, 43 条命令, v5.0.4 / `certipy-ad`)
- `find` - 枚举 ADCS,识别 ESC1-ESC16 漏洞模板与错误配置
- `req` - 申请证书（ESC1/ESC9 利用、Web Enrollment、续期/归档）
- `auth` - PFX 换 TGT/NTLM 哈希、LDAPS shell、导出 kirbi
- `ca` - CA 备份（DPAPI 私钥）、审批挂起请求、管理 Officer/Manager 角色（ESC7）
- `forge` - 黄金证书（离线伪造任意身份，支持 SID/DNS SAN)
- `shadow` - Shadow Credentials 攻击（auto/add/remove/list）
- `account` - 创建/更新机器账户（RBCD 前置、改 dNSHostName）
- `template` - 模板配置写入/备份/恢复（ESC4)
- `relay` - NTLM Relay 到 Web Enrollment (ESC8) / RPC 接口 (ESC11)
- `cert` - PFX/PEM 格式互转
- `parse` - 离线解析注册表/BOF 数据评估模板漏洞

### 4. **NetExec / Evil-WinRM** (6 个工具, 31 条命令)
- `nxc smb` - SMB 枚举、共享、用户、组、密码策略、SAM/LSA/NTDS 导出
- `nxc winrm` / `nxc ldap` / `nxc mssql` - WinRM/LDAP/MSSQL 协议利用
- `nxc ldap --bloodhound` - BloodHound 数据采集
- `evil-winrm` - WinRM 交互式 Shell
- `smbclient` - SMB 客户端

### 5. **Kerberos / BloodHound** (5 个工具, 21 条命令)
- `bloodhound-python` / `SharpHound` - AD 图谱采集
- `kinit` / `klist` / `kdestroy` - Kerberos 票据管理
- `ldapsearch` - LDAP 查询（用户、组、SPN）
- `Rubeus` - Kerberoasting、AS-REP Roasting、Pass-the-Ticket
- **完整攻击流程** - Kerberoasting / AS-REP Roasting / Pass-the-Ticket 全流程命令串联

### 6. **文件传输 File Transfer** (6 个工具, 20+ 条命令)
- **攻击机托管** - `python3 -m http.server` / `impacket-smbserver` / `uploadserver`
- **HTTP (PowerShell)** - WebClient / Invoke-WebRequest 下载、无落地 IEX 执行、HTTP 上传
- **HTTP (CMD)** - `certutil -urlcache` / `bitsadmin` / `Start-BitsTransfer` / certutil Base64 编码
- **SMB 共享** - `copy` / `xcopy` / `Copy-Item` 双向传输
- **FTP** - `ftp -s` 脚本与 PowerShell WebClient 双向传输
- **执行器自带传输** - `impacket-psexec -c` 上传执行 / `impacket-smbclient` put

---

## 🚀 快速开始 | Quick Start

### 在线使用（推荐）
直接访问：[https://Skyarrow416.github.io/Hazama/](https://Skyarrow416.github.io/Hazama/)

### 本地运行

#### 环境要求
- Node.js 18+ / npm 8+

#### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/Skyarrow416/Hazama.git
cd Hazama

# 安装依赖
npm install

# 启动开发服务器
npm run dev
# 访问 http://localhost:5173

# 构建生产版本
npm run build
# 产物在 dist/ 目录

# 预览生产版本
npm run preview
```

---

## 📖 使用说明 | Usage

1. **填写凭据配置**（顶部表单）
   - 凭据：域名、用户名、密码、NTLM 哈希、AES Key、Kerberos ccache 路径
   - 目标：目标 IP/主机名、DC IP/FQDN、本地 IP/端口
   - 高级：SPN、证书模板、CA 名称、BloodHound 输出文件名

2. **选择认证方式**
   - 密码 / NTLM Hash / Kerberos / AES Key
   - 所有命令会根据选择的认证方式自动调整 flag

3. **左侧选择工具**
   - 支持搜索过滤

4. **主区域查看并复制命令**
   - 未填字段以 `<PLACEHOLDER>` 黄色高亮
   - 点击「复制」按钮一键复制

5. **配置自动保存**
   - localStorage 持久化，刷新页面不丢失
   - 点击「清空」按钮重置

---

## 📂 项目结构 | Project Structure

```
Hazama/
├── src/
│   ├── components/
│   │   ├── ProfileBar.tsx        # 凭据配置表单 + 认证方式切换
│   │   ├── CategorySidebar.tsx   # 分类导航 + 搜索
│   │   ├── ToolCard.tsx          # 工具卡片
│   │   └── CommandBlock.tsx      # 命令块 + 复制 + 高亮
│   ├── data/
│   │   ├── fields.ts             # 表单字段定义
│   │   └── tools/                # 6 个工具命令库
│   │       ├── impacket/         # impacket 全 60 命令(按主题 7 个数据文件)
│   │       ├── bloodyad.ts       # bloodyAD v2.5.4 (含 ACL 简介)
│   ├── lib/
│   │   ├── auth.ts               # 核心认证字符串构造
│   │   └── highlight.ts          # 占位符高亮
│   ├── types.ts
│   ├── store.ts                  # Zustand 状态管理
│   └── App.tsx
├── EXAMPLES.md                   # 7 个实战场景示例
├── README.md
└── LICENSE
```

---

## 🧩 技术栈 | Tech Stack

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **样式**: Tailwind CSS 3
- **状态管理**: Zustand (带 persist 中间件)
- **部署**: GitHub Pages

---

## 📦 部署 | Deployment

### GitHub Pages（已配置自动部署）

本项目已配置 GitHub Actions 自动部署到 GitHub Pages。

```bash
# 推送到 main 分支即可自动触发部署
git push origin main
```

手动部署：
```bash
npm run build
npm run deploy
```

### 其他平台

#### Vercel / Netlify
直接连接 GitHub 仓库，构建命令 `npm run build`，输出目录 `dist`。

#### 自托管静态服务器
```bash
npm run build
# 将 dist/ 目录上传到服务器
```

---

## 📚 使用示例 | Examples

详见 [EXAMPLES.md](EXAMPLES.md)，包含 7 个完整实战场景：
- DCSync 攻击
- Pass-the-Hash + PSExec
- Kerberoasting
- ADCS ESC1 利用
- BloodHound 数据采集
- Pass-the-Ticket
- NetExec 横向移动

---

## 🤝 贡献 | Contributing

欢迎提交 Issue 和 Pull Request！

### 添加新工具
1. 在 `src/data/tools/` 下新建 `<tool>.ts`
2. 定义 `Tool[]` 数组（参考 `impacket.ts`）
3. 在 `src/data/tools/index.ts` 中导入并添加到分类

---

## 📄 许可证 | License

MIT License - 详见 [LICENSE](LICENSE)

---

## 🙏 致谢 | Acknowledgments

- [Impacket](https://github.com/fortra/impacket) - SecureAuth Corporation
- [bloodyAD](https://github.com/CravateRouge/bloodyAD) - @CravateRouge
- [Certipy](https://github.com/ly4k/Certipy) - @ly4k
- [NetExec](https://github.com/Pennyw0rth/NetExec) - @Pennyw0rth
- [Evil-WinRM](https://github.com/Hackplayers/evil-winrm) - @Hackplayers
- [BloodHound](https://github.com/BloodHoundAD/BloodHound) - @BloodHoundAD
- [revshells.com](https://www.revshells.com/) - 设计灵感来源

---

## 📬 反馈 | Feedback

如有问题或建议，欢迎：
- 提交 [Issue](https://github.com/Skyarrow416/Hazama/issues)
- 发送 Pull Request
- 联系作者

**⚠️ 再次提醒：本工具仅用于合法授权的安全测试，禁止用于任何非法用途！**

---

Made with ❤️ for the cybersecurity community
