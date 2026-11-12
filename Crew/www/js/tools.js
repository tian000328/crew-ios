// 插件运行时：一个 JSON 就是一个工具
const T = (() => {
  // 插件 -> OpenAI function schema
  function schema(p) {
    const props = {}, req = [];
    Object.entries(p.params || {}).forEach(([k, v]) => {
      props[k] = { type: (v && v.type) || 'string', description: (v && v.desc) || k };
      if (!v || v.required !== false) req.push(k);
    });
    return {
      type: 'function',
      function: {
        name: validName(p.id),
        description: (p.desc || p.name || p.id).slice(0, 200),
        parameters: { type: 'object', properties: props, required: req }
      }
    };
  }

  // 模型给的名字必须是 [a-zA-Z0-9_-]{1,64}
  function validName(id) {
    return String(id || 'tool').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  }

  // 执行：URL 里 {name} 换成参数，GET 拼 query，POST 发 JSON
  async function run(plugin, args) {
    let a = {};
    try { a = typeof args === 'string' ? JSON.parse(args) : (args || {}); } catch (e) {}
    let url = String(plugin.url || '').replace(/\{\s*(\w+)\s*\}/g, (m, k) =>
      encodeURIComponent(a[k] === undefined || a[k] === null ? '' : a[k]));
    const headers = Object.assign({}, plugin.headers || {});
    const method = (plugin.method || 'GET').toUpperCase();
    const opt = { method, headers };
    if (method !== 'GET') {
      if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
      opt.body = JSON.stringify(a);
    }
    try {
      const r = await fetch(url, opt);
      const t = await r.text();
      return r.ok ? t.slice(0, 4000) : ('HTTP ' + r.status + '：' + t.slice(0, 300));
    } catch (e) {
      return '调用失败：' + e.message;
    }
  }

  // 校验一份插件 JSON
  function check(o) {
    if (!o || typeof o !== 'object') return '不是有效的 JSON 对象';
    if (!o.id) return '缺少 id';
    if (!o.url) return '缺少 url';
    if (!/^https?:\/\//.test(o.url)) return 'url 必须是 http(s) 开头';
    return null;
  }

  const SAMPLE = {
    id: 'get_time',
    name: '查时间',
    icon: '🕐',
    desc: '查询某个时区的当前时间',
    method: 'GET',
    url: 'https://worldtimeapi.org/api/timezone/{zone}',
    params: { zone: { type: 'string', desc: '时区，例如 Asia/Shanghai' } },
    headers: {}
  };


  function autoId(name) {
    const raw = String(name || '').trim();
    let id = raw.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_{2,}/g, '_').replace(/^_+|_+$/g, '').slice(0, 48);
    if (id.length < 2) {
      let h = 0;
      for (let i = 0; i < raw.length; i++) h = (h * 31 + raw.charCodeAt(i)) % 100000;
      id = 'tool_' + h;
    }
    return id;
  }

  function normalize(o) {
    if (!o) return {};
    if (o.type === 'function' && o.function) {
      const f = o.function;
      const c = Object.assign({}, f);
      c.name = f.name;
      c.desc = f.description || c.desc || '';
      c.id = f.name || autoId(f.description || 'tool');
      if (c.parameters) {
        c.params = {};
        const props = c.parameters.properties || {};
        const req = c.parameters.required || [];
        Object.keys(props).forEach(k => {
          const v = props[k] || {};
          c.params[k] = { type: v.type || 'string', desc: v.description || '', required: req.indexOf(k) >= 0, enum: v.enum };
        });
      }
      return c;
    }
    const c = Object.assign({}, o);
    if (!c.id) c.id = autoId(c.name || c.desc);
    return c;
  }

  return { schema, run, check, validName, normalize, sample: () => JSON.parse(JSON.stringify(SAMPLE)) };
})();
