/* MCP 客户端：JSON-RPC over HTTP（Streamable HTTP / SSE 都试） */
const MCP = (() => {
  let seq = 100;

  function squeeze(txt) {
    // 从 SSE 或普通文本里抠出 JSON
    const out = [];
    for (const line of txt.split('\n')) {
      const t = line.trim();
      if (!t) continue;
      if (t.startsWith('data:')) {
        try { out.push(JSON.parse(t.slice(5).trim())); } catch (e) {}
      } else {
        try { out.push(JSON.parse(t)); } catch (e) {}
      }
    }
    return out;
  }

  async function rpc(srv, method, params, notify) {
    const id = notify ? undefined : (++seq);
    const body = { jsonrpc: '2.0', method, params: params || {} };
    if (!notify) body.id = id;
    const headers = { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' };
    if (srv.sid) headers['Mcp-Session-Id'] = srv.sid;
    let r;
    try {
      r = await fetch(srv.url, { method: 'POST', headers, body: JSON.stringify(body) });
    } catch (e) {
      return { ok: false, err: '连不上：' + e.message };
    }
    const sid = r.headers.get('Mcp-Session-Id') || r.headers.get('mcp-session-id');
    if (sid) srv.sid = sid;
    const txt = await r.text();
    if (notify) return { ok: r.ok, raw: txt };
    if (!r.ok) return { ok: false, err: 'HTTP ' + r.status + '：' + txt.slice(0, 200) };
    let data = null;
    try { data = JSON.parse(txt); } catch (e) {
      const arr = squeeze(txt);
      data = arr.find(x => x && x.id === id) || arr[arr.length - 1] || null;
    }
    if (!data) return { ok: false, err: '返回解析不了：' + txt.slice(0, 200) };
    if (data.error) return { ok: false, err: data.error.message || JSON.stringify(data.error) };
    return { ok: true, result: data.result || {} };
  }

  return {
    // 连上并拉工具清单
    async connect(srv) {
      srv.sid = '';
      const ini = await rpc(srv, 'initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'crew', version: '1.0' }
      });
      if (!ini.ok) return ini;
      await rpc(srv, 'notifications/initialized', {}, true).catch(() => {});
      const ls = await rpc(srv, 'tools/list', {});
      if (!ls.ok) return ls;
      const info = ini.result.serverInfo || {};
      srv.serverName = info.name || srv.name || '';
      srv.serverVersion = info.version || '';
      srv.tools = (ls.result.tools || []).map(t => ({
        name: t.name,
        desc: t.description || '',
        schema: t.inputSchema || { type: 'object', properties: {} }
      }));
      srv.at = Date.now();
      srv.err = '';
      return { ok: true, tools: srv.tools };
    },

    // 转成 OpenAI tool schema；名字加前缀防冲突
    schemas(servers) {
      const out = [];
      for (const s of servers) {
        for (const t of (s.tools || [])) {
          out.push({
            type: 'function',
            function: {
              name: 'mcp__' + s.id + '__' + t.name,
              description: (t.desc || t.name) + '（来自 ' + (s.name || s.url) + '）',
              parameters: t.schema && t.schema.properties ? t.schema : { type: 'object', properties: {} }
            }
          });
        }
      }
      return out;
    },

    find(servers, fname) {
      const m = /^mcp__([^_]+(?:_[^_]+)*)__(.+)$/.exec(fname);
      if (!m) return null;
      const srv = servers.find(s => s.id === m[1]);
      if (!srv) return null;
      return { srv, tool: m[2] };
    },

    async call(srv, tool, args) {
      const r = await rpc(srv, 'tools/call', { name: tool, arguments: args || {} });
      if (!r.ok) return '失败：' + r.err;
      const c = r.result && r.result.content;
      if (Array.isArray(c)) {
        const txt = c.filter(x => x && x.type === 'text').map(x => x.text).join('\n');
        if (txt) return txt;
        return JSON.stringify(c);
      }
      if (r.result && r.result.structuredContent) return JSON.stringify(r.result.structuredContent);
      return JSON.stringify(r.result);
    },

    /* 按工具全名直接调用：mcp__<服务器id>__<工具名> */
    async callByName(str, fname, args) {
      const hit = this.find((str.mcp || []), fname);
      if (!hit) return '没有这个工具：' + fname;
      return this.call(hit.srv, hit.tool, args);
    }
  };
})();
