import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Edit, Trash2, RotateCcw, Check, X } from 'lucide-react';
import 'highlight.js/styles/github-dark.css';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  messageId: string;
  sessionId: string;
  onEdit?: (sessionId: string, messageId: string, newContent: string) => void;
  onDelete?: (sessionId: string, messageId: string) => void;
  onRegenerate?: (sessionId: string, messageId: string) => void;
  isLoading?: boolean;
}

export const MessageBubble = ({
  role,
  content,
  messageId,
  sessionId,
  onEdit,
  onDelete,
  onRegenerate,
  isLoading = false,
}: MessageBubbleProps) => {
  const isUser = role === 'user';
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(content);

  const handleEditSave = () => {
    if (editValue.trim() && editValue !== content) {
      onEdit?.(sessionId, messageId, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditValue(content);
    setIsEditing(false);
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in group`}>
      <div
        className={`relative max-w-[80%] rounded-2xl px-5 py-3 shadow-lg ${
          isUser
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-none'
            : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-800 dark:text-gray-100 border border-gray-200/50 dark:border-gray-700/50 rounded-bl-none'
        }`}
      >
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={3}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={handleEditSave}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                title="保存"
              >
                <Check size={16} />
              </button>
              <button
                onClick={handleEditCancel}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                title="取消"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <>
            {isUser ? (
              <p className="whitespace-pre-wrap">{content}</p>
            ) : (
              <div className="prose dark:prose-invert max-w-none prose-sm">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                >
                  {content}
                </ReactMarkdown>
              </div>
            )}
          </>
        )}

        {/* 操作按钮 - 仅在非编辑状态且未加载时显示 */}
        {!isEditing && !isLoading && (
          <div className="absolute -top-2 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isUser && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                title="编辑"
              >
                <Edit size={12} />
              </button>
            )}
            <button
              onClick={() => onDelete?.(sessionId, messageId)}
              className="p-1 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
              title="删除"
            >
              <Trash2 size={12} />
            </button>
            {!isUser && (
              <button
                onClick={() => onRegenerate?.(sessionId, messageId)}
                className="p-1 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                title="重新生成"
              >
                <RotateCcw size={12} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};