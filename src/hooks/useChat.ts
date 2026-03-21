import { useState, useCallback, useRef, useEffect } from 'react';
import type { Message, Session } from '../types';

const STORAGE_KEY = 'ai-chat-sessions';

export const useChat = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 获取当前会话的消息列表
  const currentMessages = sessions.find(s => s.id === currentSessionId)?.messages || [];

  // 加载本地存储的会话
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      setSessions(parsed);
      if (parsed.length > 0) {
        setCurrentSessionId(parsed[0].id);
      } else {
        createNewSession();
      }
    } else {
      createNewSession();
    }
  }, []);

  // 保存会话到本地存储
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  // 创建新会话
  const createNewSession = useCallback(() => {
    const newSession: Session = {
      id: Date.now().toString(),
      title: '新对话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setError(null);
  }, []);

  // 切换会话
  const switchSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
    setError(null);
  }, []);

  // 更新会话消息
  const updateSessionMessages = useCallback((sessionId: string, messages: Message[]) => {
    setSessions(prev => prev.map(session =>
      session.id === sessionId
        ? { ...session, messages, updatedAt: Date.now() }
        : session
    ));
  }, []);

  // 删除会话
  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      if (filtered.length === 0) {
        // 如果没有会话了，创建一个新的
        const newSession: Session = {
          id: Date.now().toString(),
          title: '新对话',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setCurrentSessionId(newSession.id);
        return [newSession];
      } else if (currentSessionId === sessionId) {
        // 删除当前会话，切换到第一个会话
        setCurrentSessionId(filtered[0].id);
      }
      return filtered;
    });
  }, [currentSessionId]);

  // 发送消息
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !currentSessionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
    };

    // 更新当前会话的消息列表（添加用户消息）
    const currentMsgs = sessions.find(s => s.id === currentSessionId)?.messages || [];
    const updatedMessages = [...currentMsgs, userMessage];
    updateSessionMessages(currentSessionId, updatedMessages);

    setIsLoading(true);
    setError(null);

    // 创建临时 AI 消息占位
    const assistantMessageId = (Date.now() + 1).toString();
    const tempAssistant: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
    };
    const withAssistant = [...updatedMessages, tempAssistant];
    updateSessionMessages(currentSessionId, withAssistant);

    // 构建 API 请求的消息列表（只取 role 和 content）
    const apiMessages = withAssistant
      .filter(m => m.id !== assistantMessageId) // 排除临时消息
      .map(({ role, content }) => ({ role, content }));

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(import.meta.env.VITE_OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: import.meta.env.VITE_MODEL || 'deepseek-chat', // 可配置
          messages: apiMessages,
          stream: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`请求失败: ${response.status} ${errorText}`);
      }
      if (!response.body) throw new Error('响应体为空');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
          const data = line.replace('data: ', '');
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices[0]?.delta?.content;
            if (delta) {
              accumulatedContent += delta;
              // 更新会话中的 AI 消息
              setSessions(prev => prev.map(session => {
                if (session.id !== currentSessionId) return session;
                const lastMsg = session.messages[session.messages.length - 1];
                if (lastMsg?.id === assistantMessageId) {
                  const newMessages = [...session.messages];
                  newMessages[newMessages.length - 1] = {
                    ...lastMsg,
                    content: accumulatedContent,
                  };
                  return { ...session, messages: newMessages, updatedAt: Date.now() };
                }
                return session;
              }));
            }
          } catch (err) {
            console.error('解析错误', err);
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message);
        // 移除临时 AI 消息
        setSessions(prev => prev.map(session => {
          if (session.id !== currentSessionId) return session;
          const filteredMessages = session.messages.filter(m => m.id !== assistantMessageId);
          return { ...session, messages: filteredMessages, updatedAt: Date.now() };
        }));
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [currentSessionId, sessions, updateSessionMessages]);

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const clearCurrentSession = useCallback(() => {
    if (currentSessionId) {
      updateSessionMessages(currentSessionId, []);
    }
  }, [currentSessionId, updateSessionMessages]);

  // 更新会话标题（取第一条用户消息的前30个字符）
  useEffect(() => {
    if (currentSessionId) {
      const session = sessions.find(s => s.id === currentSessionId);
      if (session && session.messages.length > 0 && session.title === '新对话') {
        const firstUserMsg = session.messages.find(m => m.role === 'user');
        if (firstUserMsg) {
          const newTitle = firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '');
          setSessions(prev => prev.map(s =>
            s.id === currentSessionId ? { ...s, title: newTitle } : s
          ));
        }
      }
    }
  }, [sessions, currentSessionId]);
  // 删除某条消息及其之后的所有消息
const deleteMessageAndAfter = useCallback((sessionId: string, messageId: string) => {
  setSessions(prev => prev.map(session => {
    if (session.id !== sessionId) return session;
    const index = session.messages.findIndex(m => m.id === messageId);
    if (index === -1) return session;
    const newMessages = session.messages.slice(0, index);
    return { ...session, messages: newMessages, updatedAt: Date.now() };
  }));
}, []);

// 编辑用户消息（修改内容，并删除该消息之后的所有消息，然后重新发送）
const editUserMessage = useCallback(async (sessionId: string, messageId: string, newContent: string) => {
  // 找到当前会话
  const session = sessions.find(s => s.id === sessionId);
  if (!session) return;
  const messageIndex = session.messages.findIndex(m => m.id === messageId);
  if (messageIndex === -1) return;
  const message = session.messages[messageIndex];
  if (message.role !== 'user') return;

  // 删除该消息及其之后的所有消息
  const newMessages = session.messages.slice(0, messageIndex);
  // 添加修改后的用户消息
  const editedUserMessage: Message = {
    ...message,
    content: newContent,
  };
  const updatedMessages = [...newMessages, editedUserMessage];
  updateSessionMessages(sessionId, updatedMessages);

  // 自动发送（触发 AI 回复）
  // 注意：sendMessage 内部会基于当前会话的消息列表发送，需要暂时切换到该会话
  // 但 sendMessage 依赖 currentSessionId，我们直接调用发送逻辑
  // 为了避免重复代码，可以复制发送逻辑，但这里简化：直接调用 sendMessage，但需要临时设置当前会话
  const originalCurrentSessionId = currentSessionId;
  setCurrentSessionId(sessionId);
  await sendMessage(newContent);
  setCurrentSessionId(originalCurrentSessionId);
}, [sessions, currentSessionId, sendMessage, updateSessionMessages]);

// 重新生成 AI 回复（删除最后一条 AI 消息及其之后的消息，然后重新发送对应的用户消息）
const regenerateMessage = useCallback(async (sessionId: string, messageId: string) => {
  const session = sessions.find(s => s.id === sessionId);
  if (!session) return;
  const index = session.messages.findIndex(m => m.id === messageId);
  if (index === -1) return;
  const message = session.messages[index];
  if (message.role !== 'assistant') return;

  // 找到该 AI 消息对应的用户消息（前一条消息）
  const userMessage = session.messages[index - 1];
  if (!userMessage || userMessage.role !== 'user') return;

  // 删除该 AI 消息及其之后的所有消息
  const newMessages = session.messages.slice(0, index);
  updateSessionMessages(sessionId, newMessages);

  // 重新发送用户消息
  const originalCurrentSessionId = currentSessionId;
  setCurrentSessionId(sessionId);
  await sendMessage(userMessage.content);
  setCurrentSessionId(originalCurrentSessionId);
}, [sessions, currentSessionId, sendMessage, updateSessionMessages]);
  return {
    sessions,
    currentSessionId,
    currentMessages,
    isLoading,
    error,
    sendMessage,
    stopGeneration,
    createNewSession,
    switchSession,
    deleteSession,
    clearCurrentSession,
    deleteMessageAndAfter,   // 添加
    editUserMessage,         // 添加
    regenerateMessage,       // 添加
  };
};