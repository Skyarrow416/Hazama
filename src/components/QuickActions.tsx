import type { AuthMode } from '../types';
import { useProfileStore } from '../store';

interface QuickActionsProps {
  onSelectTool: (toolId: string) => void;
}

export default function QuickActions({ onSelectTool }: QuickActionsProps) {
  const updateProfile = useProfileStore((state) => state.updateProfile);

  const quickActions = [
    {
      id: 'pth',
      label: 'PTH (Pass-the-Hash)',
      toolId: 'psexec',
      authMode: 'hash' as AuthMode,
      description: '切换到哈希认证 + PSExec',
    },
    {
      id: 'dcsync',
      label: 'DCSync',
      toolId: 'secretsdump',
      authMode: null,
      description: '域控同步导出哈希',
    },
    {
      id: 'services',
      label: '开关服务与端口',
      toolId: 'nxc-smb',
      authMode: null,
      description: 'SMB 服务枚举',
    },
  ];

  const handleQuickAction = (action: typeof quickActions[0]) => {
    // 如果需要切换认证模式
    if (action.authMode) {
      updateProfile({ authMode: action.authMode });
    }
    // 跳转到对应工具
    onSelectTool(action.toolId);
  };

  return (
    <div className="bg-gray-900 border-b border-gray-800 px-6 py-3">
      <div className="flex items-center gap-3">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleQuickAction(action)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded transition-colors"
            title={action.description}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
