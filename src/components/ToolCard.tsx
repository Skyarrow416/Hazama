import type { Tool } from '../types';
import CommandBlock from './CommandBlock';
import { useProfileStore } from '../store';

interface ToolCardProps {
  tool: Tool;
}

export default function ToolCard({ tool }: ToolCardProps) {
  const profile = useProfileStore((state) => state.profile);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-100 mb-2">{tool.name}</h3>
          <p className="text-sm text-gray-400 mb-2">{tool.description}</p>
          {tool.homepage && (
            <a
              href={tool.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 underline"
            >
              官方文档 →
            </a>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {tool.commands.map((cmd) => {
          const commandString = cmd.build(profile);
          return (
            <CommandBlock
              key={cmd.id}
              command={commandString}
              title={cmd.title}
              description={cmd.description}
              note={cmd.note}
            />
          );
        })}
      </div>
    </div>
  );
}
