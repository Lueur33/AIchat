import { MessageSquare, Sparkles, Zap, Cloud, Mic, Edit3 } from 'lucide-react';

interface WelcomePageProps {
  onStart: () => void;
}

export const WelcomePage = ({ onStart }: WelcomePageProps) => {
  const features = [
    { icon: MessageSquare, title: '多会话管理', desc: '创建、切换、删除多个独立对话' },
    { icon: Sparkles, title: '流式响应', desc: '逐字输出，体验流畅自然' },
    { icon: Zap, title: '实时天气', desc: '查询城市实时天气信息' },
    { icon: Mic, title: '语音输入', desc: '支持中文语音转文字' },
    { icon: Edit3, title: '消息操作', desc: '编辑、删除、重新生成' },
    { icon: Cloud, title: 'Markdown渲染', desc: '代码高亮、表格、列表' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* 主卡片 */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 md:p-12 border border-gray-200/50 dark:border-gray-700/50">
          {/* Logo 和标题 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg mb-4">
              <MessageSquare className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              AI 智能对话助手
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              基于大语言模型的智能对话伙伴
            </p>
          </div>

          {/* 功能列表 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
              >
                <feature.icon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* 开始按钮 */}
          <button
            onClick={onStart}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            开始对话
            <MessageSquare className="w-5 h-5" />
          </button>

          {/* 提示文字 */}
          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
            支持语音输入 · 天气查询 · 多会话管理
          </p>
        </div>
      </div>
    </div>
  );
};