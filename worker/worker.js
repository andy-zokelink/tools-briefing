// Cloudflare Worker — AI 聊天 API 代理
// 将前端请求转发到 SiliconFlow API (DeepSeek-R1-Qwen3-8B)

const SILICONFLOW_API = 'https://api.siliconflow.cn/v1/chat/completions';
const MODEL = 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B';

// 系统提示词
const SYSTEM_PROMPT = `你是「趁手工具推荐榜」的 AI 助理，帮助用户了解 AI 开发者工具、Agent Skills 生态和研究报告。

你的知识范围来自 tools-briefing 站点内容：
- 每周简报：AI 开发者工具、GitHub Trending、MCP/Skills 生态
- 研究报告：28份 AI 调研（Agent全谱系、大模型对比、金融工具、云厂商CLI、硬件等）
- 项目配置：Hermes Agent、定时任务、飞书集成

你的风格：简洁直接、中文回答、有具体建议。
如果用户问的问题超出知识范围，诚实说明并建议查阅站内最新内容。
不知道就说不知道，不要编造。`;

export default {
  async fetch(request, env) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    try {
      const body = await request.json();
      const userMessages = body.messages || [];
      
      // Build messages array: system prompt + user messages
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...userMessages.filter(m => m.role !== 'system')
      ];
      
      // Keep only last 12 messages
      const trimmed = messages.slice(0, 1).concat(messages.slice(-11));

      const response = await fetch(SILICONFLOW_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.SILICONFLOW_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: trimmed,
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('SiliconFlow API error:', response.status, errText);
        return new Response(JSON.stringify({ 
          reply: '抱歉，AI 服务暂时不可用，请稍后再试。',
          error: `API ${response.status}`
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || '抱歉，没有获取到回复。';

      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (err) {
      console.error('Worker error:', err.message);
      return new Response(JSON.stringify({ 
        reply: '抱歉，服务出现错误，请稍后重试。',
        error: err.message 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
