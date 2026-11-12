/* crew app · 数据层 —— 全部存在本机，不上传任何地方 */
const S = (() => {
  const KEY = 'crew.v3';
  const OLD = 'crew.v2';

  /* 全新开局：不预置任何服务商、角色、插件、示例对话。
     第一次进来是空的，由用户自己配。 */
  const DEF = () => ({
    providers: [],
    groups: [],
    agents: [],
    workspaces: [{ id: 'w1', name: '默认', icon: '💬' }],
    sessions: [],
    plugins: [],
    mcp: [],
    mcps: [],
    threads: [],
    env: [],
    ui: { ws: 'w1', view: 'list', sessionId: null, settings: [], fontSize: 15, theme: 'light' }
  });

  /* 老版本里塞的演示数据，迁移时清掉 */
  const DEMO_IDS = ['a_demo', 'a_demo2', 'p_demo', 'g_main'];
  const DEMO_PLUGINS = ['weather'];

  function strip(o) {
    const d = DEF();
    for (const k in d) if (!(k in o)) o[k] = d[k];
    o.agents = (o.agents || []).filter(a => !DEMO_IDS.includes(a.id));
    o.providers = (o.providers || []).filter(p => !DEMO_IDS.includes(p.id));
    o.groups = (o.groups || []).filter(g => !DEMO_IDS.includes(g.id));
    o.plugins = (o.plugins || []).filter(p => !DEMO_PLUGINS.includes(p.id));
    o.sessions = (o.sessions || []).map(c => ({
      ...c,
      memberIds: (c.memberIds || (c.agentId ? [c.agentId] : [])).filter(id => !DEMO_IDS.includes(id))
    })).filter(c => c.memberIds.length > 0);
    o.workspaces = (o.workspaces || []).length ? o.workspaces : d.workspaces;
    return o;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return strip(JSON.parse(raw));
      const old = localStorage.getItem(OLD);
      if (old) return strip(JSON.parse(old));
    } catch (e) { console.error('读取失败', e); }
    return DEF();
  }

  let s = load();

  let saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify(s)); }
      catch (e) { console.error('保存失败', e); }
    }, 120);
  }

  return {
    get: () => s,
    save,
    uid: (p = '') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    set(fn) { fn(s); save(); return s; },
    reset() { s = DEF(); save(); return s; },
    export() { return JSON.stringify(s, null, 2); },
    import(json) {
      const got = strip(JSON.parse(json));
      s = got; save(); return s;
    },
    find(arr, id) { return (s[arr] || []).find(x => x.id === id) || null; }
  };
})();
