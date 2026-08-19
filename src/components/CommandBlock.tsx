import { useState } from 'react';
import { highlightCommand, getMissingFields } from '../lib/highlight';

interface CommandBlockProps {
  command: string;
  title: string;
  description?: string;
  usage?: string;
  example?: string;
  note?: string;
}

export default function CommandBlock({ command, title, description, usage, example, note }: CommandBlockProps) {
  const [copied, setCopied] = useState(false);
  const segments = highlightCommand(command);
  const missingFields = getMissingFields(command);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="command-block space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-semibold text-gray-100 mb-1">{title}</h4>
          {description && (
            <p className="text-sm text-gray-400 mb-2">{description}</p>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="btn-secondary shrink-0 text-xs"
        >
          {copied ? '✓ 已复制' : '复制'}
        </button>
      </div>

      <div className="bg-gray-950 border border-gray-800 rounded p-3 overflow-x-auto">
        <pre className="text-sm text-gray-300 whitespace-pre-wrap break-all">
          {segments.map((seg, i) => (
            <span
              key={i}
              className={seg.isPlaceholder ? 'text-yellow-400 font-bold' : ''}
            >
              {seg.text}
            </span>
          ))}
        </pre>
      </div>

      {missingFields.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-yellow-500">
          <span>⚠</span>
          <span>缺失字段: {missingFields.join(', ')}</span>
        </div>
      )}

      {usage && (
        <details className="bg-gray-950 border border-gray-800 rounded">
          <summary className="cursor-pointer select-none px-4 py-2 text-xs font-semibold text-blue-400 hover:text-blue-300">
            📖 用法详解 / 生成器指南
          </summary>
          <pre className="px-4 pb-3 pt-1 text-xs text-gray-400 whitespace-pre-wrap break-all leading-relaxed border-t border-gray-800">
            {usage}
          </pre>
          {example && (
            <div className="px-4 pb-3">
              <div className="text-xs font-semibold text-green-400 mb-1">样例:</div>
              <pre className="text-xs text-gray-300 whitespace-pre-wrap break-all bg-gray-900 rounded p-2 border border-gray-800">
                {example}
              </pre>
            </div>
          )}
        </details>
      )}

      {note && (
        <div className="text-xs text-gray-500 italic">
          💡 {note}
        </div>
      )}
    </div>
  );
}
