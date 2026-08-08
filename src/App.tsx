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
      <header className="bg-gray-950 border-b border-gray-800 py-6 px-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-100">
            Hazama
          </h1>
          <span className="px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded">
            BETA
          </span>
        </div>
        <p className="text-base text-gray-300 mb-1">
          Internal Network Penetration Command Generator
        </p>
        <p className="text-sm text-gray-400">
          内网渗透命令生成器 - Impacket / Certipy / NetExec / Kerberos / BloodHound
        </p>
        <p className="text-xs text-gray-500 mt-2">
          ⚠️ 仅用于授权渗透测试、红队演练、CTF 竞赛与安全教学 | For authorized pentesting, red team, CTF & education only
        </p>
      </header>

      {/* Profile Bar */}
      <ProfileBar />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <CategorySidebar
          categories={categories}
          selectedToolId={selectedToolId}
          onSelectTool={setSelectedToolId}
        />

        {/* Main Area */}
        <main className="flex-1 overflow-y-auto p-8 bg-gray-950">
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
      <footer className="bg-gray-950 border-t border-gray-800 py-4 px-8 text-center text-xs text-gray-600">
        <p>
          Hazama v0.1.0-beta | Built with Vite + React + TypeScript + Tailwind CSS |
          <a href="https://github.com/yourusername/Hazama" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 ml-2">GitHub</a>
        </p>
      </footer>
    </div>
  );
}

export default App;
