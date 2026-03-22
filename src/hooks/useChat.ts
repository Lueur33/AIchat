import { useState, useCallback, useRef, useEffect } from 'react';
import type { Message, Session } from '../types';

const STORAGE_KEY = 'ai-chat-sessions';
// 天气 API 响应类型
interface WeatherResponse {
  code: string;
  now: {
    temp: string;
    text: string;
    windDir: string;
    windScale: string;
    humidity: string;
  };
  location?: Array<{ name: string; adm: string; id: string }>;
}
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

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
const apiUrl = import.meta.env.VITE_OPENAI_API_URL;
const modelName = import.meta.env.VITE_MODEL || 'Qwen/Qwen2.5-7B-Instruct';
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
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey }`,
        },
        body: JSON.stringify({
          model: modelName || 'deepseek-chat', // 可配置
          messages: apiMessages,
          stream: false,
          tools: [
            {
              type: 'function',
              function: {
                name: 'get_weather',
                description: '获取指定城市的实时天气信息',
                parameters: {
                  type: 'object',
                  properties: {
                    city: {
                      type: 'string',
                      description: '城市名称，例如：北京、上海、深圳、广州',
                    },
                  },
                  required: ['city'],
                },
              },
            },
          ],
          tool_choice: 'auto',
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`请求失败: ${response.status} ${errorText}`);
      }
      if (!response.body) throw new Error('响应体为空');

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`请求失败: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices[0].message;

      // 检查是否有工具调用（天气查询）
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        const toolCall = assistantMessage.tool_calls[0];
        
        if (toolCall.function.name === 'get_weather') {
          const args = JSON.parse(toolCall.function.arguments);
          const city = args.city;
          
          // 调用天气 API
          const weatherInfo = await fetchWeather(city);
          
          // 将天气信息作为工具响应，再次调用 AI
          const secondMessages = [
            ...apiMessages,
            {
              role: 'assistant',
              content: null,
              tool_calls: assistantMessage.tool_calls,
            },
            {
              role: 'tool',
              tool_call_id: toolCall.id,
              content: weatherInfo,
            },
          ];
          
          const secondResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: modelName,
              messages: secondMessages,
              stream: false,
            }),
          });
          
          const finalData = await secondResponse.json();
          const finalContent = finalData.choices[0].message.content;
          
          // 更新会话中的 AI 消息
          setSessions(prev => prev.map(session => {
            if (session.id !== currentSessionId) return session;
            const lastMsg = session.messages[session.messages.length - 1];
            if (lastMsg?.id === assistantMessageId) {
              const newMessages = [...session.messages];
              newMessages[newMessages.length - 1] = {
                ...lastMsg,
                content: finalContent,
              };
              return { ...session, messages: newMessages, updatedAt: Date.now() };
            }
            return session;
          }));
          setIsLoading(false);
          return;
        }
      }

      // 普通回复（没有工具调用）
      const content = assistantMessage.content || '';
      setSessions(prev => prev.map(session => {
        if (session.id !== currentSessionId) return session;
        const lastMsg = session.messages[session.messages.length - 1];
        if (lastMsg?.id === assistantMessageId) {
          const newMessages = [...session.messages];
          newMessages[newMessages.length - 1] = {
            ...lastMsg,
            content: content,
          };
          return { ...session, messages: newMessages, updatedAt: Date.now() };
        }
        return session;
      }));
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
  
  // 查询天气的函数
  const fetchWeather = useCallback(async (city: string): Promise<string> => {
    try {
      const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
      if (!apiKey) {
        return '天气功能未配置，请在 .env 文件中添加 VITE_WEATHER_API_KEY';
      }
      
      // 第一步：获取城市 location ID
      const geoUrl = `https://geoapi.qweather.com/v2/city/lookup?location=${encodeURIComponent(city)}&key=${apiKey}`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();
      
      if (geoData.code !== '200' || !geoData.location?.length) {
        return `未找到城市 "${city}" 的天气信息，请检查城市名称是否正确（如：北京、上海、深圳）`;
      }
      
      const locationId = geoData.location[0].id;
      const locationName = geoData.location[0].name;
      const adm = geoData.location[0].adm;
      
      // 第二步：获取实时天气
      const weatherUrl = `https://devapi.qweather.com/v7/weather/now?location=${locationId}&key=${apiKey}`;
      const weatherRes = await fetch(weatherUrl);
      const weatherData = await weatherRes.json();
      
      if (weatherData.code !== '200') {
        return `获取天气信息失败，请稍后重试`;
      }
      
      const { temp, text, windDir, windScale, humidity } = weatherData.now;
      
      return `${locationName}（${adm}）当前天气：${text}，温度 ${temp}℃，${windDir} ${windScale}级，湿度 ${humidity}%`;
    } catch (error) {
      console.error('天气查询失败:', error);
      return '天气查询服务暂时不可用，请检查网络连接后重试';
    }
  }, []);
  
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