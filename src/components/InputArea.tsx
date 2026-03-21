import { useState } from 'react';
import { Send, Square, Trash2 } from 'lucide-react';
import type { KeyboardEvent } from 'react';

interface InputAreaProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  onClear?: () => void;
  isLoading: boolean;
}

export const InputArea = ({
  onSend,
  onStop,
  onClear,
  isLoading,
}: InputAreaProps) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative z-10 border-t border-gray-200/50 dark:border-gray-700/50 p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md">
      <div className="max-w-4xl mx-auto flex gap-3 items-end">
        <textarea
          className="flex-1 resize-none rounded-2xl border border-gray-300/50 dark:border-gray-600/50 bg-white/90 dark:bg-gray-700/90 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          rows={1}
          placeholder="输入消息... (Enter发送，Shift+Enter换行)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <div className="flex gap-2">
          {isLoading ? (
            <button
              onClick={onStop}
              className="p-3 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 text-white hover:scale-105 transition-transform duration-200 shadow-lg"
              title="停止生成"
            >
              <Square size={20} />
            </button>
          ) : (
            <button
              onClick={handleSend}
              className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:hover:scale-100 shadow-lg"
              disabled={!input.trim()}
            >
              <Send size={20} />
            </button>
          )}
          {onClear && (
            <button
              onClick={onClear}
              className="p-3 rounded-2xl bg-gray-500/80 dark:bg-gray-600/80 text-white hover:bg-gray-600/80 transition-colors shadow-lg"
              title="清空对话"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};