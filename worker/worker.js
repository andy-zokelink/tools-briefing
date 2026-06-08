// Cloudflare Worker — AI 聊天 API 代理
// 将前端请求转发到 DeepSeek API

const DEEPSEEK_API = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-chat';

// 系统提示词
const SYSTEM_PROMPT = `你是「趁手工具推荐榜」的 AI 助理，帮助用户了解 AI 开发者工具和 Agent Skills 生态。

你的知识范围（第24期，2026.06.08）：
## 重点推荐
- sandboxd (tastyeffectco/sandboxd, 503⭐): AI agent 即时沙箱环境，npx sandboxd 一行命令启动隔离环境，带预览 URL。比 Docker 轻量，专为 coding agent 设计。
- Lexa (anvia-hq/lexa, 83⭐): Rust 写的代码智能引擎，把代码库静态分析为图结构（AST、调用关系、依赖图），给 AI agent 当"代码库眼睛"。

## GitHub Trending
- goose (b-nnett/goose, 2277⭐): Swift AI agent PoC
- JoyAI-Echo (jd-opensource, 922⭐): 京东长音频+视频生成模型
- TripoSplat (VAST-AI-Research, 540⭐): 单张2D图→3D高斯泼溅
- vimhjkl (410⭐): 终端间隔重复学Vim
- 9drive (426⭐): 多Google Drive统一网关

## MCP/Skills Watch
- Burrow (caezium, 186⭐): Mole CLI 的 macOS GUI，磁盘清理
- opendocswork-mcp (Aimino-Tech, 135⭐): Rust MCP server，Office文档处理，亚毫秒级
- nextdev-labs/mcp (57⭐): Agent Usability Index
- 50-essential-mcp-servers (Moh4696, 49⭐): 精选50个MCP server清单
- totem (briangaoo, 63⭐): Whoop健身手环MCP server

## 趋势洞察
1. Agent基础设施从推理转向执行环境 — MCP解决工具调用后，安全隔离执行成新瓶颈
2. MCP server从"能用"转向"好用" — Rust原生、硬件接入、GUI工具链

你的风格：简洁直接、中文回答、有具体建议。不知道就说不知道，建议查最新简报。`;

export default {
  async fetch(request, env) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    try {
      const body = await request.json();
      const userMessages = body.messages || [];
      
      // Build messages array: system prompt + user messages (excluding the original system prompt)
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...userMessages.filter(m => m.role !== 'system')
      ];
      
      // Keep only last 12 messages to manage tokens
      const trimmed = messages.slice(0, 1).concat(messages.slice(-11));

      const response = await fetch(DEEPSEEK_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: trimmed,
          max_tokens: 800,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('DeepSeek API error:', response.status, errText);
        return new Response(JSON.stringify({ 
          reply: '抱歉，AI 服务暂时不可用，请稍后再试。',
          error: `API ${response.status}`
        }), {
          status: 200, // Return 200 so frontend doesn't break
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
