import { useState } from 'react';
import type { Category } from '../types';

interface CategorySidebarProps {
  categories: Category[];
  selectedToolId: string | null;
  onSelectTool: (toolId: string) => void;
}

export default function CategorySidebar({ categories, selectedToolId, onSelectTool }: CategorySidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categories.map(cat => cat.id))
  );

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const filteredCategories = categories.map(cat => ({
    ...cat,
    tools: cat.tools.filter(tool =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(cat => cat.tools.length > 0);

  return (
    <div className="w-64 shrink-0 sticky top-0 h-screen bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <input
          type="text"
          placeholder="搜索工具..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field w-full"
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-1">
        {filteredCategories.map(category => (
          <div key={category.id}>
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full text-left px-3 py-1.5 rounded text-sm font-semibold text-gray-300 hover:bg-gray-800 flex items-center justify-between"
            >
              <span>{category.name}</span>
              <span className="text-xs text-gray-500">
                {expandedCategories.has(category.id) ? '▼' : '▶'}
              </span>
            </button>

            {expandedCategories.has(category.id) && (
              <div className="ml-2 mt-1 space-y-1">
                {category.tools.map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => onSelectTool(tool.id)}
                    className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors ${
                      selectedToolId === tool.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                    }`}
                  >
                    {tool.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-800 text-xs text-gray-500">
        <p>共 {categories.reduce((acc, cat) => acc + cat.tools.length, 0)} 个工具</p>
      </div>
    </div>
  );
}
