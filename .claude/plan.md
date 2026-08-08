# 界面重构计划 - 简化凭据输入区域

## 📋 目标

参考用户提供的界面设计，将臃肿的凭据配置区域重构为：
1. 紧凑的单行输入区域（核心字段）
2. 快捷操作按钮（PTH、DCSync、开关服务等）
3. 左侧紧凑的命令列表
4. 右侧命令预览 + 参数说明

## 🎯 关键改进点

### 1. ProfileBar 简化 (顶部)
**当前问题**：
- 5个分组（凭据、目标、域控、本地、高级）占用大量垂直空间
- 17个输入字段全部展开显示
- 用户需要滚动才能看到下方工具列表

**改进方案**：
- ✅ 第一行：域名、用户名、密码/NTLM哈希（3-4个字段）
- ✅ 第二行：目标IP、DC IP（2个字段）
- ✅ 认证方式按钮保持（PTH、密码、Kerberos、AES）
- ✅ 高级字段折叠到"更多选项"可展开区域
- ✅ 总高度控制在 150-200px 内

### 2. 添加快捷场景按钮
**新增功能**：
- PTH (Pass-the-Hash) - 自动切换到 hash 模式
- DCSync - 跳转到 secretsdump DCSync 命令
- 开关服务与端口 - 快速访问常用场景
- 横向移动 - 跳转到 psexec/wmiexec 等

### 3. 左侧命令列表优化
**当前**：
- CategorySidebar 分类展开，每个工具占据单独按钮
- 宽度 256px (w-64)

**优化**：
- 保持当前结构，但调整样式更紧凑
- 减少 padding，更小的字体
- 高亮当前选中工具

### 4. 右侧命令详情优化
**当前**：
- ToolCard 显示工具信息 + 命令列表
- CommandBlock 显示单条命令

**优化**：
- 顶部显示当前命令预览（大字号代码块）
- 底部显示参数说明（列表形式）
- 保持复制按钮

## 🏗️ 实现步骤

### Phase 1: 重构 ProfileBar
**文件**: `src/components/ProfileBar.tsx`

**修改点**：
1. 将 17 个字段分为"核心字段"和"高级字段"
2. 核心字段（5个）：
   - 域名 (domain)
   - 用户名 (username)
   - 密码/NT Hash (password/ntHash) - 根据认证模式切换
   - 目标IP (targetIP)
   - DC IP (dcIP)
3. 高级字段（12个）折叠到可展开面板
4. 布局改为 2 行网格
5. 添加"展开高级选项"按钮

**新状态**：
```typescript
const [showAdvanced, setShowAdvanced] = useState(false);
```

### Phase 2: 添加快捷按钮组件
**新文件**: `src/components/QuickActions.tsx`

**功能**：
- 按钮：PTH、DCSync、横向移动、服务端口
- 点击后自动：
  - 切换认证模式（如 PTH 切换到 hash）
  - 跳转到对应工具（如 DCSync 跳转到 secretsdump）

**接口**：
```typescript
interface QuickActionsProps {
  onSelectTool: (toolId: string) => void;
  onSwitchAuthMode: (mode: AuthMode) => void;
}
```

### Phase 3: 调整布局结构
**文件**: `src/App.tsx`

**修改点**：
1. ProfileBar 高度固定（约 180px）
2. QuickActions 集成到 ProfileBar 或独立一行
3. 调整 main content flex 布局确保不溢出

### Phase 4: 样式微调
**文件**: `src/index.css`, 各组件

**优化**：
- 减少 padding/margin
- 更紧凑的字体大小
- 优化响应式断点

## 📐 新布局结构

```
┌─────────────────────────────────────────────────────────────┐
│ Header (Hazama BETA)                                        │
├─────────────────────────────────────────────────────────────┤
│ ProfileBar (简化，2行输入 + 认证按钮 + 展开按钮) ~180px     │
├─────────────────────────────────────────────────────────────┤
│ QuickActions (PTH | DCSync | 横向移动 | 服务端口) ~50px   │
├───────────────┬─────────────────────────────────────────────┤
│               │                                             │
│ CategorySide  │  ToolCard (命令预览 + 参数说明)            │
│ bar (256px)   │                                             │
│               │                                             │
│  - Impacket   │  > secretsdump                             │
│    - secret   │                                             │
│    - psexec   │  [命令代码块，大字号]                       │
│  - Certipy    │                                             │
│  - NetExec    │  参数说明：                                 │
│               │  - [用户名] 域/用户名或用户名                │
│               │  - [目标IP] 目标IP                          │
│               │  ...                                        │
│               │                                             │
│               │  [复制命令] 按钮                             │
│               │                                             │
└───────────────┴─────────────────────────────────────────────┘
```

## 🔧 技术细节

### 核心字段定义
```typescript
const coreFields = ['domain', 'username', 'password', 'ntHash', 'targetIP', 'dcIP'];
const advancedFields = fieldDefinitions.filter(f => !coreFields.includes(f.key));
```

### 快捷操作配置
```typescript
const quickActions = [
  { id: 'pth', label: 'PTH (Pass-the-Hash)', toolId: 'psexec', authMode: 'hash' },
  { id: 'dcsync', label: 'DCSync', toolId: 'secretsdump', authMode: null },
  { id: 'lateral', label: '横向移动', toolId: 'psexec', authMode: null },
  { id: 'services', label: '服务与端口', toolId: 'nxc-smb', authMode: null },
];
```

## ✅ 验收标准

1. ProfileBar 高度 ≤ 200px（未展开高级选项时）
2. 核心 5 个字段清晰可见
3. 高级字段可折叠/展开
4. 快捷按钮可点击并自动跳转
5. 整体布局不再需要滚动即可看到工具列表
6. 保持现有功能完整性（所有字段仍可访问）

## 🚀 预期效果

- 首屏信息密度提升 60%
- 用户操作步骤减少（快捷按钮直达）
- 视觉层次更清晰
- 保持专业终端风格
