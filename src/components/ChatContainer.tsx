import { useRef, useEffect } from 'react';
import type { Message } from '../types';
import { MessageBubble } from './MessageBubble';

interface ChatContainerProps {
  messages: Message[];
  sessionId: string;
  onEditMessage?: (sessionId: string, messageId: string, newContent: string) => void;
  onDeleteMessage?: (sessionId: string, messageId: string) => void;
  onRegenerateMessage?: (sessionId: string, messageId: string) => void;
  isLoading?: boolean;
}

export const ChatContainer = ({ messages, sessionId, onEditMessage, onDeleteMessage, onRegenerateMessage, isLoading }: ChatContainerProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="mx-auto w-full max-w-4xl space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-lg">开始对话吧~</p>
            <p className="text-sm mt-2">试试问我：今天天气怎么样？</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              role={msg.role}
              content={msg.content}
              messageId={msg.id}
              sessionId={sessionId}
              onEdit={onEditMessage}
              onDelete={onDeleteMessage}
              onRegenerate={onRegenerateMessage}
              isLoading={isLoading}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};