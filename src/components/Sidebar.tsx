import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import type { Session } from '../types';

interface SidebarProps {
  sessions: Session[];
  currentSessionId: string | null;
  onNewSession: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
}

export const Sidebar = ({
  sessions,
  currentSessionId,
  onNewSession,
  onSelectSession,
  onDeleteSession,
}: SidebarProps) => {
  return (
    <div className="w-64 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-r border-gray-200/50 dark:border-gray-700/50 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:scale-105 transition-transform duration-200 shadow-md"
        >
          <Plus size={18} />
          <span>新对话</span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {sessions.map(session => (
          <div
            key={session.id}
            className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
              currentSessionId === session.id
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
            }`}
            onClick={() => onSelectSession(session.id)}
          >
            <div className="flex-1 truncate">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="flex-shrink-0" />
                <span className="text-sm truncate">{session.title}</span>
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {new Date(session.updatedAt).toLocaleDateString()}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSession(session.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
              title="删除对话"
            >
              <Trash2 size={14} className="text-red-500" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};