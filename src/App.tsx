import { useState } from 'react';
import ProfileBar from './components/ProfileBar';
import CategorySidebar from './components/CategorySidebar';
import ToolCard from './components/ToolCard';
import { categories, allTools } from './data/tools';

function App() {
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);

  const selectedTool = selectedToolId
    ? allTools.find((t) => t.id === selectedToolId)
    : null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gray-950 border-b border-gray-800 py-2.5 px-6 flex items-center gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <h1 className="text-xl font-bold text-gray-100">
            Hazama
          </h1>
          <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded">
            BETA
          </span>
        </div>
        <p className="text-xs text-gray-400 truncate">
          内网渗透命令生成器 - Impacket / bloodyAD / Certipy / NetExec / Kerberos / BloodHound
        </p>
        <p className="text-xs text-gray-600 ml-auto shrink-0 hidden lg:block">
          ⚠️ 仅用于授权渗透测试与安全教学
        </p>
      </header>

      {/* Profile Bar (含快捷操作) */}
      <ProfileBar onSelectTool={setSelectedToolId} />

      {/* Main Content */}
      <div className="flex-1 flex items-start">
        {/* Sidebar */}
        <CategorySidebar
          categories={categories}
          selectedToolId={selectedToolId}
          onSelectTool={setSelectedToolId}
        />

        {/* Main Area (随页面整体滚动) */}
        <main className="flex-1 min-w-0 p-5 bg-gray-950">
          {selectedTool ? (
            <ToolCard tool={selectedTool} />
          ) : (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔐</div>
              <h2 className="text-2xl font-bold text-gray-300 mb-2">
                选择一个工具开始
              </h2>
              <p className="text-gray-500">
                从左侧选择工具，填写上方凭据配置，命令将自动生成
              </p>
              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto text-left">
                {categories.map(cat => (
                  <div key={cat.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-200 mb-1">{cat.name}</h3>
                    <p className="text-xs text-gray-500">{cat.tools.length} 个工具</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-gray-800 py-1 px-6 text-center text-xs text-gray-700">
        <p>
          Hazama v0.2.0-beta | Vite + React + TypeScript + Tailwind |
          <a href="https://github.com/Skyarrow416/Hazama" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 ml-1">GitHub</a>
        </p>
      </footer>
    </div>
  );
}

export default App;
