# 🤖 AI 智能对话助手

📅 **最后更新：2026年3月22日**

</div>

一款基于大语言模型的多会话 AI 聊天应用，支持流式响应、Markdown 渲染、消息编辑/撤回、会话管理、语音输入、实时天气查询等丰富功能。

---

## ✨ 核心功能

| 功能 | 说明 |
|------|------|
| **💬 实时对话** | 与 AI 模型进行流式交互，逐字输出回复，体验流畅自然 |
| **📝 Markdown 渲染** | 支持代码高亮、表格、列表等丰富格式，提升回复可读性 |
| **🔄 多会话管理** | 创建、切换、删除多个独立对话，数据本地持久化存储 |
| **✏️ 消息操作** | 支持编辑用户消息、删除任意消息、重新生成 AI 回复 |
| **🎤 语音输入** | 集成 Web Speech API，支持中文语音转文字输入，点击麦克风按钮即可说话 |
| **🌤️ 天气查询** | 支持实时天气查询，通过 Function Calling 调用和风天气 API，返回温度、风力、湿度等详细信息 |
| **🎨 现代化 UI** | 毛玻璃效果、渐变气泡、动态光晕动画、响应式布局 |
| **🌙 暗色模式** | 自动跟随系统主题，夜间使用更舒适 |
| **📱 侧边栏折叠** | 可收起的侧边栏，提升主聊天区域空间利用率 |

---

## 🛠️ 技术栈

| 技术 | 说明 |
|------|------|
| **React 18** | 前端框架 |
| **TypeScript** | 类型安全 |
| **Vite** | 构建工具 |
| **Tailwind CSS** | 样式框架 |
| **React Markdown** | Markdown 渲染与代码高亮 |
| **Lucide React** | 图标库 |
| **Web Speech API** | 语音识别 |
| **和风天气 API** | 天气数据服务 |
| **OpenAI API / SiliconFlow** | AI 大模型接口 |

---

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/你的用户名/ai-chat-frontend.git
cd ai-chat-frontend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的 API 密钥

# 启动开发服务器
npm run dev
```
## 环境变量配置
### AI 模型配置
VITE_OPENAI_API_KEY=你的API密钥
VITE_OPENAI_API_URL=https://api.siliconflow.cn/v1/chat/completions
VITE_MODEL=Qwen/Qwen2.5-7B-Instruct

# 天气查询配置（可选，注册和风天气获取）
VITE_WEATHER_API_KEY=你的和风天气密钥
构建生产版本
bash
npm run build


## 📁 项目结构

```text
ai-chat-frontend/
├── src/
│   ├── components/          # UI 组件
│   │   ├── ChatContainer.tsx    # 消息列表容器
│   │   ├── InputArea.tsx        # 输入区域（含语音输入）
│   │   ├── MessageBubble.tsx    # 消息气泡
│   │   └── Sidebar.tsx          # 侧边栏
│   ├── hooks/
│   │   └── useChat.ts            # 聊天核心逻辑（含天气查询）
│   ├── types.ts                  # TypeScript 类型定义
│   ├── App.tsx                   # 主应用组件
│   ├── main.tsx                  # 入口文件
│   └── index.css                 # 全局样式
├── .env.example              # 环境变量示例
├── index.html
├── package.json
├── tailwind.config.js
└── tsconfig.json

``` 
## 🎯 使用示例

### 🌤️ 天气查询

输入城市名称即可获取实时天气：

"北京天气怎么样？"

"上海今天天气如何"

"查询深圳温度"

示例回复：

上海（上海）当前天气：多云，温度 18℃，东北风 3级，湿度 65%

### 🎤 语音输入

点击输入框旁的麦克风按钮 🎤

允许麦克风权限

对着麦克风说话，语音会自动转为文字填入输入框

点击发送或按回车即可

### 💬 消息操作

编辑：鼠标悬停在用户消息上，点击 ✏️ 图标可修改内容

删除：点击 🗑️ 图标删除消息及其后的所有对话

重新生成：鼠标悬停在 AI 消息上，点击 🔄 图标重新生成回复


## 🔧 核心实现亮点

### 🎤 语音输入

集成 Web Speech API，实现语音转文字功能：
```typescript
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'zh-CN';
recognition.onresult = (event) => {
  const text = event.results[0][0].transcript;
  setInput(text);
};
recognition.start();
```
### 🌤️ Function Calling 工具调用

集成和风天气 API，实现 AI 主动调用外部工具获取实时信息：
```typescript
const tools = [{
  type: 'function',
  function: {
    name: 'get_weather',
    description: '获取指定城市的实时天气信息',
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string', description: '城市名称，例如：北京、上海' }
      },
      required: ['city']
    }
  }
}];

// AI 自动识别天气查询意图并调用工具
if (assistantMessage.tool_calls) {
  const weatherInfo = await fetchWeather(city);
  // 将天气结果返回给 AI，生成自然语言回复
}
```

### 📡 流式响应处理
使用 fetch + ReadableStream 实现 AI 回复的逐字输出：

```typescript
const reader = response.body.getReader();
const decoder = new TextDecoder();
let accumulatedContent = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value);
  // 解析 SSE 格式数据，累积更新消息内容
}
```

### 🔧 自定义 Hook 封装
将聊天状态、会话管理、API 请求等复杂逻辑封装在 useChat Hook 中，保持组件代码简洁。

### 💾 多会话持久化
使用 localStorage 存储会话数据，支持创建、切换、删除会话，刷新页面不丢失。

### ✏️ 消息操作逻辑
编辑用户消息：自动删除该消息及之后所有消息，并重新发送

删除消息：移除指定消息及其后续消息，保持对话连贯

重新生成：删除最后一条 AI 回复，重新调用 API


## 👤 作者
Lueur33

GitHub: @Lueur33

## 🙏 致谢
SiliconFlow - 提供的免费 AI 模型 API

和风天气 - 免费天气 API 服务

Lucide - 图标库

Tailwind CSS - 样式框架

Web Speech API - 语音识别接口
