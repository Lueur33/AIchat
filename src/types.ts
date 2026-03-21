// 消息类型
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// 会话类型
export interface Session {
  id: string;
  title: string;           // 会话标题（取自第一条用户消息）
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

// 聊天状态（扩展）
export interface ChatState {
  sessions: Session[];
  currentSessionId: string | null;
  isLoading: boolean;
  error: string | null;
}