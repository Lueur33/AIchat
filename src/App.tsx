import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { ChatContainer } from './components/ChatContainer';
import { InputArea } from './components/InputArea';
import { Sidebar } from './components/Sidebar';
import { useChat } from './hooks/useChat';
import './index.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const {
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
    deleteMessageAndAfter,
    editUserMessage,
    regenerateMessage,
  } = useChat();

  // 获取当前会话标题
  const currentSession = sessions.find(s => s.id === currentSessionId);
  const currentTitle = currentSession?.title || '新对话';

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
      {/* 侧边栏 - 根据状态控制宽度和可见性 */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
        }`}
      >
        <Sidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onNewSession={createNewSession}
          onSelectSession={switchSession}
          onDeleteSession={deleteSession}
        />
      </div>

      {/* 主聊天区域 */}
      <div className="flex-1 flex flex-col relative">
        {/* 顶部栏：汉堡菜单 + 居中标题 */}
        <header className="relative z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm p-4 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label={sidebarOpen ? '关闭侧边栏' : '打开侧边栏'}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent absolute left-1/2 transform -translate-x-1/2">
            {currentTitle}
          </h1>
          {/* 占位元素，保持布局对称 */}
          <div className="w-8"></div>
        </header>

        <ChatContainer
          messages={currentMessages}
          sessionId={currentSessionId || ''}
          onEditMessage={editUserMessage}
          onDeleteMessage={deleteMessageAndAfter}
          onRegenerateMessage={regenerateMessage}
          isLoading={isLoading}
        />

        {error && (
          <div className="relative z-10 mx-4 mb-2 p-3 bg-red-500/10 backdrop-blur-sm border border-red-200 text-red-700 rounded-xl text-sm">
            ❌ {error}
          </div>
        )}

        <InputArea
          onSend={sendMessage}
          onStop={stopGeneration}
          onClear={clearCurrentSession}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

export default App;