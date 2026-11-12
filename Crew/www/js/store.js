/* crew app · 数据层 —— 全部存在本机，不上传任何地方 */
const S = (() => {
  const KEY = 'crew.v2';

  const DEMO = () => ({
    providers: [
      { id: 'p_demo', name: '本地回声', type: 'mock', baseUrl: '', apiKey: '', models: ['echo'] }
    ],
    // 模型分组：一组多模型，可以按顺序兜底，也可以按活的类型分派
    groups: [
      { id: 'g_main', name: '主力班', mode: 'fallback', memberIds: ['a_demo', 'a_demo2'], note: '一个不行换下一个' }
    ],
    agents: [
      {
        id: 'a_demo', code: '阿快', emoji: '⚡', providerId: 'p_demo', model: 'echo',
        temp: 0.7, maxTokens: 4096, tools: ['weather'], groupIds: [],
        soul: '你叫阿快，是个干活的搭子。说话直，不绕弯，先给结论再给依据。\n不确定就说不确定，不装懂。',
        duty: '我管：拆任务、写初稿、整理资料。\n我不接：长链推理和复杂代码，那些交给别人。',
        memory: ''
      },
      {
        id: 'a_demo2', code: '铁锤', emoji: '🔨', providerId: 'p_demo', model: 'echo',
        temp: 0.3, maxTokens: 8192, tools: [], groupIds: [],
        soul: '你叫铁锤，专啃硬骨头。宁可慢一点，也要把边界情况想全。',
        duty: '我管：复杂代码、跨文件重构、并发与状态机。\n我不接：小改小补，那是浪费。',
        memory: ''
      }
    ],
    workspaces: [{ id: 'w1', name: '默认分区', icon: '💬' }],
    sessions: [],
    plugins: [{
      id: 'weather', name: '查天气', icon: '🌤',
      desc: '查某个经纬度当前的温度（摄氏度）', method: 'GET',
      url: 'https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&current=temperature_2m',
      params: { latitude: { type: 'number', desc: '纬度，比如 31.2' }, longitude: { type: 'number', desc: '经度，比如 121.5' } },
      headers: {}
    }],
    threads: [],
    env: [],
    ui: { ws: 'w1', view: 'list', sessionId: null, settings: [], fontSize: 15, theme: 'light' }
  });

  const DEF = () => DEMO();

  let s = (() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return DEF();
      const got = JSON.parse(raw);
      const d = DEF();
      for (const k in d) if (!(k in got)) got[k] = d[k];
      return got;
    } catch (e) { return DEF(); }
  })();

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
      const got = JSON.parse(json);
      const d = DEF();
      for (const k in d) if (!(k in got)) got[k] = d[k];
      s = got; save(); return s;
    },
    find(arr, id) { return (s[arr] || []).find(x => x.id === id) || null; }
  };
})();
