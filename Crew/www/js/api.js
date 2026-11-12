// 调用层：只管发请求，不管界面
const A = (() => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const cut = (s, n = 4000) => (s && s.length > n) ? s.slice(0, n) + '…(截断)' : s;

  const endpoint = p => (p.baseUrl || '').replace(/\/+$/, '') + '/chat/completions';

  function fmtErr(code, msg) {
    if (code === 401) return 'Key 不对或没权限（401）';
    if (code === 404) return '地址或模型名不对（404）· ' + msg;
    if (code === 429) return '限流、余额不足或频率超了（429）· ' + msg;
    return msg;
  }

  // 一次请求。有 tools 就带上，模型可能回 tool_calls
  async function chat({ provider, model, messages, temperature = 0.7, maxTokens = 4096, tools }) {
    const t0 = Date.now();
    if (provider.type === 'mock') return mockTurn({ messages, tools, t0 });
    if (!provider.apiKey) return { ok: false, err: '还没填 API Key', ms: 0 };

    const body = { model, messages, temperature, max_tokens: maxTokens };
    if (tools && tools.length) { body.tools = tools; body.tool_choice = 'auto'; }

    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 120000);
    try {
      const r = await fetch(endpoint(provider), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + provider.apiKey },
        body: JSON.stringify(body),
        signal: ctl.signal
      });
      const txt = await r.text();
      let j = null; try { j = JSON.parse(txt); } catch (e) {}
      if (!r.ok) {
        const m = (j && j.error && j.error.message) || (j && j.message) || txt.slice(0, 200) || ('HTTP ' + r.status);
        return { ok: false, err: fmtErr(r.status, m), ms: Date.now() - t0 };
      }
      const msg = j && j.choices && j.choices[0] && j.choices[0].message;
      const text = (msg && msg.content) || '';
      const toolCalls = (msg && msg.tool_calls) || [];
      if (!text && !toolCalls.length) return { ok: false, err: '返回是空的（可能被内容策略拦了）', ms: Date.now() - t0 };
      return { ok: true, text, toolCalls, usage: j.usage, ms: Date.now() - t0 };
    } catch (e) {
      const msg = e.name === 'AbortError' ? '超时（120 秒）' : ('网络失败：' + e.message);
      return { ok: false, err: msg, ms: Date.now() - t0 };
    } finally { clearTimeout(timer); }
  }

  // 本地回声：不联网，用来验证整条链路。有工具时会先调一次工具
  async function mockTurn({ messages, tools, t0 }) {
    await sleep(500);
    const last = messages[messages.length - 1];
    if (tools && tools.length && last.role !== 'tool') {
      const f = tools[0].function;
      const props = (f.parameters && f.parameters.properties) || {};
      const args = {};
      Object.keys(props).forEach(k => {
        const t = props[k].type;
        args[k] = t === 'number' || t === 'integer' ? 0 : (t === 'boolean' ? true : 'test');
      });
      return {
        ok: true, text: '',
        toolCalls: [{ id: 'call_mock', type: 'function', function: { name: f.name, arguments: JSON.stringify(args) } }],
        usage: { input_tokens: 0, output_tokens: 0 }, ms: Date.now() - t0
      };
    }
    const got = last.role === 'tool' ? ('工具返回：' + String(last.content || '').slice(0, 300)) : '';
    const said = [...messages].reverse().find(m => m.role === 'user');
    const text = got
      ? `我调了工具。${got}\n\n（这是本地回声，没走真模型）`
      : `收到：${(said && said.content) || ''}\n\n（本地回声：链路是通的，换真模型就会真回答）`;
    return { ok: true, text, usage: { input_tokens: 0, output_tokens: 0 }, ms: Date.now() - t0 };
  }

  // 测试连通：发一句最短的话
  async function ping(provider, model) {
    if (provider.type === 'mock') return { ok: true, text: '本地回声正常' };
    return chat({ provider, model, messages: [{ role: 'user', content: '说"通"' }], maxTokens: 8, temperature: 0 });
  }

  return { chat, ping, sleep, cut, mockTurn };
})();
