/* crew app · 界面层 */
(() => {
  const $ = s => document.querySelector(s);
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nl = v => esc(v).replace(/\n/g, '<br>');

  // ---- 图标：统一线性描边，24 网格 ----
  const I = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const ICON = {
    gear: I('<path d="M12 3.6l1.5 1.2 1.9-.3.9 1.7 1.7.9-.3 1.9L19.9 10.5l-1.2 1.5.3 1.9-1.7.9-.9 1.7-1.9-.3L13 17.4l-1.5-1.2-1.9.3-.9-1.7-1.7-.9.3-1.9L6.1 10.5l1.2-1.5-.3-1.9 1.7-.9.9-1.7 1.9.3z"/><circle cx="12" cy="10.5" r="2.6"/>'),
    server: I('<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><circle cx="7" cy="7.5" r=".8"/><circle cx="7" cy="16.5" r=".8"/>'),
    layers: I('<path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="M3 13l9 5 9-5"/>'),
    chart: I('<path d="M4 19V10M10 19V5M16 19v-6M22 19H2"/>'),
    palette: I('<circle cx="12" cy="12" r="8"/><circle cx="9.5" cy="10" r=".9"/><circle cx="14" cy="9.5" r=".9"/><circle cx="15" cy="14" r=".9"/>'),
    tool: I('<path d="M14.5 6a3.5 3.5 0 0 0 4.6 4.6l-8.4 8.4-3.4.9.9-3.4 8.4-8.4Z"/>'),
    task: I('<path d="M9 5h10M9 12h10M9 19h7"/><circle cx="4.5" cy="5" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="19" r="1"/>'),
    skill: I('<path d="M12 3l2 5.5L20 10l-6 1.5L12 17l-2-5.5L4 10l6-1.5L12 3Z"/>'),
    soul: I('<circle cx="12" cy="8.5" r="3.2"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/>'),
    memory: I('<path d="M6 4h9l4 4v12H6z"/><path d="M9.5 9.5h5M9.5 13h5M9.5 16.5h3"/>'),
    mcp: I('<circle cx="6" cy="12" r="2.4"/><circle cx="18" cy="6.5" r="2.4"/><circle cx="18" cy="17.5" r="2.4"/><path d="M8.3 11.2l7.4-3.4M8.3 12.8l7.4 3.4"/>'),
    env: I('<path d="M4 7h16M4 12h16M4 17h9"/><circle cx="19" cy="17" r="1.6"/>'),
    plus: I('<path d="M12 5v14M5 12h14"/>'),
    search: I('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>'),
    back: I('<path d="M15 4.5L7.5 12l7.5 7.5"/>'),
    chev: I('<path d="M9 5l7 7-7 7"/>'),
    up: I('<path d="M12 19V6M6 12l6-6 6 6"/>'),
    dots: I('<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>'),
    menu: I('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    chat: I('<path d="M4 5h16v11H9l-5 4z"/>'),
    trash: I('<path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>'),
    close: I('<path d="M6 6l12 12M18 6L6 18"/>'),
    check: I('<path d="M5 12.5l4.5 4.5L19 7"/>'),
    copy: I('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>'),
    folder: I('<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>')
  };

  // ---- 主题色（设置项左侧圆底）----
  const TINT = {
    blue: '#007aff', purple: '#af52de', red: '#ff3b30', green: '#34c759',
    orange: '#ff9500', teal: '#30b0c7', pink: '#ff2d55', gray: '#8e8e93', indigo: '#5856d6'
  };

  // ---- 导航栈 ----
  let nav = { view: 'list', settings: [], drawer: false };

  const st = () => S.get();
  const ws = () => st().workspaces.find(w => w.id === st().ui.ws) || st().workspaces[0];
  const agent = id => st().agents.find(a => a.id === id) || null;
  const provider = id => st().providers.find(p => p.id === id) || null;
  const session = id => st().sessions.find(s => s.id === id) || null;

  function go(view, opts) {
    nav.view = view;
    if (opts && opts.settings) nav.settings = opts.settings;
    if (opts && opts.sessionId !== undefined) S.set(s => { s.ui.sessionId = opts.sessionId; });
    render();
  }
  function back() {
    if (nav.settings.length > 1) { nav.settings.pop(); render(); return; }
    nav.view = 'list'; nav.settings = []; render();
  }

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(t._tm);
    t._tm = setTimeout(() => t.classList.remove('on'), 1900);
  }

  // ---- 弹层 ----
  function sheet(title, bodyHTML, onMount) {
    const sh = $('#sheet'), box = $('#sheet .sheet-in');
    box.innerHTML = `<div class="sh-h"><b>${esc(title)}</b><button class="ic plain" data-close="1">${ICON.close}</button></div>
      <div class="sh-b">${bodyHTML}</div>`;
    sh.hidden = false;
    slideIn(box, box.offsetHeight || 320, 260);
    box.querySelector('[data-close]').onclick = closeSheet;
    sh.onclick = e => { if (e.target === sh) closeSheet(); };
    if (onMount) onMount(box);
    return box;
  }
  function closeSheet() {
    $('#sheet').hidden = true;
    $('#sheet .sheet-in').innerHTML = '';
  }

  // ---- 分组的通用渲染：iOS 设置风格 ----
  function group(title, rows, foot) {
    return `<div class="grp">
      ${title ? `<div class="grp-t">${esc(title)}</div>` : ''}
      <div class="card">${rows.join('')}</div>
      ${foot ? `<div class="grp-f">${foot}</div>` : ''}
    </div>`;
  }
  // 一行设置项：icon/tint/title/sub/right/act
  function row(o) {
    return `<div class="row ${o.act ? 'tap' : ''}" ${o.act ? `data-act="${esc(o.act)}"` : ''} ${o.id ? `data-id="${esc(o.id)}"` : ''}>
      ${o.icon ? `<span class="ric" style="background:${TINT[o.tint] || TINT.gray}">${o.icon}</span>` : ''}
      <div class="rtxt"><div class="rt">${esc(o.title)}</div>${o.sub ? `<div class="rs">${esc(o.sub)}</div>` : ''}</div>
      ${o.right ? `<div class="rr">${o.right}</div>` : ''}
      ${o.chev ? `<span class="rchev">${ICON.chev}</span>` : ''}
    </div>`;
  }

  // ---- 时间分组 ----
  function timeGroup(ts) {
    const d = new Date(ts), now = new Date();
    const day = 864e5;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    if (d.getTime() >= today) return '今天';
    if (d.getTime() >= today - day) return '昨天';
    if (d.getTime() >= today - 7 * day) return '本周';
    return '更早';
  }
  function fmtTime(ts) {
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, '0'), mm = String(d.getMinutes()).padStart(2, '0');
    return timeGroup(ts) === '今天' ? `${hh}:${mm}` : `${d.getMonth() + 1}/${d.getDate()}`;
  }

  // ---- 懒初始化字段 ----
  function arr(k) {
    const s = st();
    if (!Array.isArray(s[k])) S.set(x => { x[k] = []; });
    return st()[k];
  }
  const lastText = s => {
    for (let i = s.msgs.length - 1; i >= 0; i--) {
      const m = s.msgs[i];
      if (m.role === 'user' || m.role === 'assistant') return String(m.content || '').replace(/\s+/g, ' ').slice(0, 60);
    }
    return '还没有消息';
  };

  // ============ 屏 1：会话列表 ============
  function screenList() {
    const s = st();
    const w = ws();
    const list = s.sessions.filter(x => x.wsId === w.id).sort((a, b) => b.updatedAt - a.updatedAt);
    const groups = ['今天', '昨天', '本周', '更早'];
    let body = '';
    if (!list.length) {
      if (!s.providers.length) {
        body = `<div class="empty">
          <div class="big">🔑</div>
          <b>还没有模型服务商</b>
          <p>先加一个。服务商决定用哪家的模型，填上 API Key 才能真的说话。</p>
          <div style="margin-top:16px"><button class="btn" data-act="settings" data-path="providers">添加服务商</button></div>
        </div>`;
      } else if (!s.agents.length) {
        body = `<div class="empty">
          <div class="big">🤖</div>
          <b>还没有角色</b>
          <p>角色 = 灵魂 + 职责 + 绑定的模型。一个角色就是团队里的一个人。</p>
          <div style="margin-top:16px"><button class="btn" data-act="settings" data-path="agents">新建角色</button></div>
        </div>`;
      } else {
        body = `<div class="empty">
          <div class="big">${esc(w.icon || '💬')}</div>
          <b>${esc(w.name)} 还没有群</b>
          <p>点右下角开一个。建群时你自己挑谁进来，不是全员自动入群。</p>
        </div>`;
      }
    } else {
      for (const g of groups) {
        const sub = list.filter(x => timeGroup(x.updatedAt) === g);
        if (!sub.length) continue;
        body += `<div class="sgrp">${g}</div>`;
        body += `<div class="wrap"><div class="card">` + sub.map(x => {
          const ms = members(x);
          const ico = ms.length > 1 ? '👥' : (ms[0] ? esc(ms[0].emoji || '🤖') : ICON.chat);
          return `<div class="sw">
          <div class="sess" data-act="open" data-id="${x.id}">
            <span class="sico">${ico}</span>
            <div class="stx">
              <div class="st">${esc(x.title || '未命名')}</div>
              <div class="ss">${esc(lastText(x))}</div>
            </div>
            <div class="stm">${fmtTime(x.updatedAt)}</div>
          </div>
          <button class="sdel" data-act="delchat" data-id="${x.id}">删除</button>
          </div>`;
        }).join('') + `</div></div>`;
      }
    }
    return `
      <div class="nav">
        <div class="nav-l"><button class="ic" data-act="drawer">${ICON.menu}</button></div>
        <div class="nav-t"><b>${esc(w.name)}</b><span>${list.length} 个群 · ${s.agents.length} 个角色</span></div>
        <div class="nav-r"><button class="ic" data-act="settings" data-path="main">${ICON.gear}</button></div>
      </div>
      <div class="scroll">${body}</div>
      <div class="fabs">
        <button class="fab" data-act="search">${ICON.search}</button>
        <button class="fab" data-act="newchat">${ICON.plus}</button>
      </div>`;
  }

  // ============ 屏 2：群聊 ============
  function members(c) { return ((c && c.memberIds) || []).map(agent).filter(Boolean); }
  function modeLabel(c) {
    const ms = members(c);
    if (!ms.length) return '群里还没人';
    if (c.mode === 'host') return '只有 ' + ms[0].code + ' 接话';
    return ms.length > 1 ? '全员都会接' : ms[0].code + ' 接话';
  }

  function bubble(m, prev) {
    const mine = m.role === 'user';
    const ag = m.agentId ? agent(m.agentId) : null;
    const same = !mine && prev && prev.role === 'assistant' && prev.agentId === m.agentId && prev.agentId;
    const head = (!mine && !same && ag) ? `<div class="who">${esc(ag.code)}</div>` : '';
    const meta = (!mine && m.usage) ? `<div class="meta">${m.usage.input_tokens || 0}→${m.usage.output_tokens || 0} · ${m.ms || 0}ms</div>` : '';
    return `<div class="msg ${mine ? 'me' : ''} ${same ? 'same' : ''}">
      <span class="ava">${mine ? '🧑' : (same ? '' : (ag ? esc(ag.emoji || '🤖') : '🤖'))}</span>
      <div class="bd"><div class="bub">${head}${nl(m.content)}</div>${meta}</div>
    </div>`;
  }

  function screenChat() {
    const s = st();
    const cur = session(s.ui.sessionId);
    if (!cur) { nav.view = 'list'; return screenList(); }
    const ms = members(cur);

    let prev = null;
    const body = cur.msgs.length ? cur.msgs.map(m => {
      if (m.role === 'trace') {
        prev = m;
        return `<details class="trace"><summary>🔧 ${esc(m.title || '工具调用')}</summary><pre>${esc(m.content)}</pre></details>`;
      }
      if (m.role === 'sys') {
        prev = m;
        return `<div class="trace"><details><summary>⚠️ 出错了</summary><pre>${esc(m.content)}</pre></details></div>`;
      }
      const h = bubble(m, prev);
      prev = m;
      return h;
    }).join('') : `<div class="empty"><div class="big">👥</div>
        <b>群里 ${ms.length} 个人</b><p>直接说事，${ms.map(a => esc(a.code)).join('、')} 都会看到。<br>想只叫一个人，就打 <code>@${esc(ms[0] ? ms[0].code : '名字')}</code>。</p></div>`;

    return `
      <div class="nav">
        <div class="nav-l"><button class="ic" data-act="back">${ICON.back}</button></div>
        <div class="nav-t"><b>${esc(cur.title || '群聊')}</b><span>${ms.length} 人群 · ${esc(ws().name)}</span></div>
        <div class="nav-r"><button class="ic" data-act="chatmenu">${ICON.dots}</button></div>
      </div>
      <div class="members">
        ${ms.map(a => `<button class="mem" data-act="mat" data-id="${a.id}"><span class="mava">${esc(a.emoji || '🤖')}</span><span class="mnm">${esc(a.code)}</span></button>`).join('')}
        <span class="mmode">${esc(modeLabel(cur))}</span>
      </div>
      <div class="msgs" id="msgs">${body}<div id="end"></div></div>
      <div class="composer">
        <div class="cbox">
          <div class="field"><textarea id="in" rows="1" placeholder="在群里说点什么…（@名字 只叫他）"></textarea></div>
          <button class="send" data-act="send">${ICON.up}</button>
        </div>
      </div>`;
  }

  function toBottom() {
    const m = $('#msgs'); if (m) m.scrollTop = m.scrollHeight;
  }

  // ---- 组装 system ----
  function sysPrompt(ag, cur) {
    const parts = [];
    if (ag.soul) parts.push(ag.soul);
    if (ag.duty) parts.push('【职责】\n' + ag.duty);
    if (ag.memory) parts.push('【我记得的事】\n' + ag.memory);
    const ms = members(cur);
    const others = ms.filter(a => a.id !== ag.id).map(a => `${a.code}${a.duty ? '（' + a.duty.split('\n')[0].replace(/^我管：/, '') + '）' : ''}`);
    if (others.length) parts.push('【班组里还有】' + others.join('；') + '。不该你接的，直说该找谁。');
    parts.push('【这是群聊】用户说一句，群里 ' + ms.map(a => a.code).join('、') + ' 都看得到。你只回你自己那一份，别替别人发言，别复述别人刚说过的话。别人说的话前面会带【名字】。');
    parts.push('【当前分区】' + ws().name);
    return parts.join('\n\n');
  }

  // ---- 谁接话 ----
  function pickTargets(c, txt) {
    const ms = members(c);
    if (!ms.length) return [];
    const m = txt.match(/^@(\S+)\s*/);
    if (m) {
      const who = ms.find(a => a.code === m[1] || a.id === m[1]);
      if (who) return [who];
    }
    if (c.mode === 'host') return [ms[0]];
    return ms;
  }

  // ---- 发送 ----
  let busy = false;
  async function send() {
    if (busy) return;
    const ta = $('#in'), txt = (ta.value || '').trim();
    if (!txt) return;
    const s = st(), cur = session(s.ui.sessionId);
    if (!cur) return;
    const targets = pickTargets(cur, txt);
    if (!targets.length) { toast('这个群还没有角色，去 设置 → 灵魂 加一个'); return; }
    let body = txt;
    const m = txt.match(/^@(\S+)\s*/);
    if (m && targets.length === 1) body = txt.slice(m[0].length).trim() || txt;

    S.set(x => {
      const c = x.sessions.find(v => v.id === cur.id);
      c.msgs.push({ role: 'user', content: body, ts: Date.now() });
      if (!c.title || c.title === '新对话') c.title = body.slice(0, 18);
      c.updatedAt = Date.now();
    });
    ta.value = ''; ta.style.height = 'auto';
    busy = true;
    render(); toBottom();

    try {
      for (const t of targets) {
        const box = $('#msgs');
        if (box) box.insertAdjacentHTML('beforeend', `<div class="typing">${esc(t.code)} 正在输入…</div>`);
        toBottom();
        await turn(cur.id, t);
        render(); toBottom();
      }
    } catch (e) {
      pushSys(cur.id, String((e && e.message) || e));
      render();
    } finally {
      busy = false;
      render(); toBottom();
    }
  }

  function pushSys(sid, text) {
    S.set(x => { const c = x.sessions.find(v => v.id === sid); c.msgs.push({ role: 'sys', content: text, ts: Date.now() }); });
  }

  async function turn(sid, ag) {
    const prov = provider(ag.providerId);
    if (!prov) { pushSys(sid, `${ag.code} 还没绑 AI 服务商，去 设置 → 管理 AI 服务商 配一下`); return; }
    const sess = () => st().sessions.find(v => v.id === sid);
    const cur = sess();
    let sys = sysPrompt(ag, cur);
    {
      const pub = await F.list('');
      const mine = await F.list('@' + ag.code);
      const fmt = ls => ls.ok ? ((ls.entries || []).map(e => (e.dir ? '📁' : '📄') + e.name).slice(0, 40).join('、') || '空') : '读不到';
      sys += `\n\n【文件空间】你有一块团队公共区和一块自己的私有区。\n公共区（所有同事共用，路径直接写文件名）：${fmt(pub)}\n私有区（只有你能看，路径写 @${ag.code}/文件名）：${fmt(mine)}\n你手上有 fs_list / fs_read / fs_write 三个工具。写文件时 private=true 就写进你的私有区，省略就写进公共区。要让同事看到的东西放公共区。写进文件，不要只在回答里贴。`;
    }
    let msgs = [{ role: 'system', content: sys }];
    for (const mm of cur.msgs) {
      if (mm.role === 'user') msgs.push({ role: 'user', content: mm.content });
      else if (mm.role === 'assistant') {
        if (mm.agentId === ag.id) msgs.push({ role: 'assistant', content: mm.content });
        else {
          const who = agent(mm.agentId);
          msgs.push({ role: 'assistant', content: `【${who ? who.code : '同事'}】${mm.content}` });
        }
      }
    }
    const plugs = (ag.tools || []).map(id => (st().plugins || []).find(p => p.id === id)).filter(Boolean);
    const fsTools = F.tools(ag.code);
    const allMcp = (st().mcp || []).filter(m => m.enabled !== false);
    const mine = allMcp.filter(m => (ag.mcpIds || []).indexOf(m.id) >= 0);
    const mcpTools = MCP.schemas(mine);
    const allTools = [...plugs.map(T.schema), ...fsTools, ...mcpTools];
    const tools = allTools.length ? allTools : undefined;

    for (let round = 0; round < 4; round++) {
      let r;
      if (prov.type === 'mock') r = await A.mockTurn({ messages: msgs, tools: tools, t0: Date.now() });
      else r = await A.chat({ provider: prov, model: ag.model, messages: msgs, temperature: ag.temp, maxTokens: ag.maxTokens, tools });

      if (!r.ok) { pushSys(sid, `${ag.code}：${r.err || '调用失败'}`); return; }

      if (r.toolCalls && r.toolCalls.length) {
        msgs.push({ role: 'assistant', content: r.text || '', tool_calls: r.toolCalls });
        for (const tc of r.toolCalls) {
          const fname = tc.function.name;
          const plug = (st().plugins || []).find(p => p.id === fname);
          let res = '';
          try {
            const args = JSON.parse(tc.function.arguments || '{}');
            if (fname.indexOf('fs_') === 0) res = await F.run(ag.code, fname, args);
            else if (fname.indexOf('mcp__') === 0) res = await MCP.callByName(st(), fname, args);
            else {
              const out = plug ? await T.run(plug, args) : '没这个工具';
              res = typeof out === 'string' ? out : JSON.stringify(out);
            }
          } catch (e) { res = '参数解析失败：' + e.message; }
          const tname = fname.indexOf('fs_') === 0
            ? ({ fs_list: '看文件', fs_read: '读文件', fs_write: '写文件' }[fname] || fname)
            : fname.indexOf('mcp__') === 0
              ? 'MCP · ' + fname.split('__').slice(2).join('__')
              : (plug ? plug.name : fname);
          S.set(x => {
            const c = x.sessions.find(v => v.id === sid);
            c.msgs.push({ role: 'trace', title: tname + ' ' + (tc.function.arguments || ''), content: res, ts: Date.now() });
          });
          msgs.push({ role: 'tool', tool_call_id: tc.id, content: res });
        }
        S.set(x => { const c = x.sessions.find(v => v.id === sid); c.updatedAt = Date.now(); });
        continue;
      }

      S.set(x => {
        const c = x.sessions.find(v => v.id === sid);
        c.msgs.push({ role: 'assistant', content: r.text, agentId: ag.id, usage: r.usage, ms: r.ms, ts: Date.now() });
        c.updatedAt = Date.now();
      });
      return;
    }
    pushSys(sid, `${ag.code} 工具调了 4 轮还没收口，先停了`);
  }

  function newChat() {
    const s = st();
    if (!s.providers.length) { toast('先去「设置 → AI 服务商」加一个'); return; }
    if (!s.agents.length) { toast('先去「设置 → 灵魂」建一个角色'); return; }

    const rows = s.agents.map(a => {
      const p = s.providers.find(v => v.id === a.providerId);
      const noKey = !p || !p.apiKey;
      return `<div class="pick" data-id="${a.id}">
        <input type="checkbox">
        <span class="pm">${esc(a.emoji || '🤖')}</span>
        <span class="pt"><b>${esc(a.code)}</b><i>${esc(p ? p.name : '未绑服务商')} · ${esc(a.model || '未选模型')}${noKey ? ' · ⚠️ 没 Key' : ''}</i></span>
        <span class="pc">${ICON.check || '✓'}</span>
      </div>`;
    }).join('');

    const noKeyProv = s.providers.filter(p => !p.apiKey);
    const warn = noKeyProv.length
      ? `<div class="hint" style="color:#c0392b">这些服务商还没填 Key：${noKeyProv.map(p => esc(p.name)).join('、')}<br>没 Key 的角色发出去会失败。</div>`
      : '';

    sheet('新建群聊', `${warn}<div class="pickl">${rows}</div>
      <div class="sh-f"><button class="btn ghost" id="pick-new">＋ 新角色</button><button class="btn ghost" id="pick-none">清空</button><button class="btn" id="pick-ok">创建</button></div>`, box => {
      box.querySelector('#pick-new').onclick = () => { closeSheet(); setTimeout(() => agentSheet(null), 120); };
      box.querySelectorAll('.pick').forEach(l => {
        const cb = l.querySelector('input');
        l.onclick = () => { cb.checked = !cb.checked; l.classList.toggle('on', cb.checked); };
      });
      box.querySelector('#pick-none').onclick = () => {
        box.querySelectorAll('.pick').forEach(l => { l.querySelector('input').checked = false; l.classList.remove('on'); });
      };
      box.querySelector('#pick-ok').onclick = () => {
        const ids = [...box.querySelectorAll('.pick')].filter(l => l.querySelector('input').checked).map(l => l.dataset.id);
        if (!ids.length) { toast('至少选一个角色'); return; }
        const id = S.uid('s_');
        S.set(x => {
          x.sessions.unshift({ id, wsId: ws().id, memberIds: ids, mode: 'all', title: '新对话', msgs: [], updatedAt: Date.now() });
          x.ui.sessionId = id;
        });
        closeSheet();
        go('chat');
      };
    });
  }

  // ============ 主渲染 ============
  let openSwipe = null;
  function bindSwipe() {
    document.querySelectorAll('.sw').forEach(sw => {
      const row = sw.querySelector('.sess');
      if (!row) return;
      let x0 = 0, dx = 0, dragging = false;
      const shut = el => { const r = el.querySelector('.sess'); if (r) tweenX(r, -80, 0, 200); el.classList.remove('op'); };
      sw.addEventListener('touchstart', e => {
        if (openSwipe && openSwipe !== sw) { shut(openSwipe); openSwipe = null; }
        x0 = e.touches[0].clientX; dx = 0; dragging = true;
      }, { passive: true });
      sw.addEventListener('touchmove', e => {
        if (!dragging) return;
        dx = e.touches[0].clientX - x0;
        const base = sw.classList.contains('op') ? -80 : 0;
        row.style.transform = 'translateX(' + Math.min(0, Math.max(-96, base + dx)) + 'px)';
      }, { passive: true });
      sw.addEventListener('touchend', () => {
        if (!dragging) return;
        dragging = false;
        const base = sw.classList.contains('op') ? -80 : 0;
        const open = base + dx < -40;
        tweenX(row, base + dx, open ? -80 : 0, 200);
        sw.classList.toggle('op', open);
        openSwipe = open ? sw : (openSwipe === sw ? null : openSwipe);
      });
      row.addEventListener('click', e => {
        if (Math.abs(dx) > 10) { e.stopPropagation(); e.preventDefault(); }
      }, true);
    });
  }

  /* 横向补间：同样逐帧改 style，绕开 iOS WebView 里 CSS transition 卡首帧的问题 */
  function tweenX(el, from, to, dur) {
    if (!el) return;
    const t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      el.style.transform = 'translateX(' + (from + (to - from) * e).toFixed(2) + 'px)';
      if (k < 1) requestAnimationFrame(step);
      else el.style.transform = 'translateX(' + to + 'px)';
    };
    requestAnimationFrame(step);
    setTimeout(() => { el.style.transform = 'translateX(' + to + 'px)'; }, dur + 60);
  }

  /* 逐帧改 style，不用 CSS 动画和 WAAPI —— iOS WebView 里两者都会卡在首帧。
     只动 transform，不动 opacity，避免整块变透明。 */
  function slideIn(el, fromY, dur) {
    if (!el || !el.style) return;
    const t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      el.style.transform = 'translateY(' + (fromY * (1 - e)).toFixed(2) + 'px)';
      if (k < 1) requestAnimationFrame(step);
      else el.style.transform = '';
    };
    el.style.transform = 'translateY(' + fromY + 'px)';
    requestAnimationFrame(step);
    /* 兜底：rAF 在某些 WebView 状态下不触发，到点无条件复位，绝不让元素停在屏外 */
    setTimeout(() => { el.style.transform = ''; }, dur + 80);
  }

  function render() {
    const el = $('#screen');
    el.innerHTML = nav.view === 'list' ? screenList()
      : nav.view === 'chat' ? screenChat()
        : screenSettings();
    document.documentElement.style.setProperty('--fs', (st().ui.fontSize || 15) + 'px');
    slideIn(el, 10, 190);
    drawDrawer();
    if (nav.view === 'list') bindSwipe();
    const ta = $('#in');
    if (ta) { ta.oninput = () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 110) + 'px'; }; }
    if (nav.view === 'chat') setTimeout(toBottom, 30);
  }

  function drawDrawer() {
    const d = $('#drawer'), m = $('#mask');
    if (!nav.drawer) { d.hidden = true; m.hidden = true; return; }
    const s = st();
    d.innerHTML = `
      <div class="dr-h"><b>crew</b><span>多模型班组 · 本地存储</span></div>
      <div class="scroll" style="flex:1;padding-bottom:8px">
        <div class="dsep">分区</div>
        ${s.workspaces.map(w => `<div class="di ${w.id === s.ui.ws ? 'on' : ''}" data-act="ws" data-id="${w.id}">
          <span class="em">${esc(w.icon || '💬')}</span><span class="dn">${esc(w.name)}</span></div>`).join('')}
        <div class="di" data-act="addws"><span class="em">＋</span><span class="dn">新建分区</span></div>
        <div class="dsep">班组</div>
        ${s.agents.map(a => `<div class="di" data-act="talkto" data-id="${a.id}">
          <span class="em">${esc(a.emoji || '🤖')}</span><span class="dn">${esc(a.code)}</span>${ICON.chev}</div>`).join('')}
      </div>
      <div class="dr-b">
        <div class="di" data-act="settings" data-path="main"><span class="em">${ICON.gear}</span><span class="dn">设置</span></div>
      </div>`;
    d.hidden = false; m.hidden = false;
  }

  function closeDrawer() { nav.drawer = false; drawDrawer(); }

  // ============ 屏 3：设置 ============
  function head(title, right) {
    return `<div class="nav">
      <div class="nav-l"><button class="ic" data-act="sback">${ICON.back}</button></div>
      <div class="nav-t"><b>${esc(title)}</b></div>
      <div class="nav-r">${right || ''}</div>
    </div>`;
  }

  function screenSettings() {
    const p = nav.settings;
    if (!p.length) return settingsMain();
    switch (p[0]) {
      case 'providers': return p[1] ? pageProviderEdit(p[1]) : pageProviders();
      case 'groups': return pageGroups();
      case 'usage': return pageUsage();
      case 'appearance': return pageAppearance();
      case 'files': return nav.settings.length > 1 ? pageBrowser() : pageFiles();
      case 'tools':
        if (nav.settings[1] === 'plugins') return pagePlugins();
        if (nav.settings[1] === 'builtin') return pageBuiltin();
        return pageTools();
      case 'threads': return pageThreads();
      case 'skills': return pageSkills();
      case 'agents': return p[1] ? pageAgentEdit(p[1]) : pageAgents();
      case 'memory': return p[1] ? pageMemoryEdit(p[1]) : pageMemory();
      case 'mcp': return p[1] ? mcpView() : pageMcp();
      case 'env': return pageEnv();
      default: return settingsMain();
    }
  }

  function settingsMain() {
    const s = st();
    const tin = s.sessions.reduce((a, c) => a + (c.msgs || []).reduce((b, m) => b + ((m.usage && m.usage.input_tokens) || 0), 0), 0);
    return `
      ${head('设置', `<button class="pill" data-act="sdone">完成</button>`)}
      <div class="scroll">
        <div class="sec">
          <div class="sec-t">AI 服务商</div>
          <div class="card">
            ${row({ icon: ICON.server, tint: 'blue', title: '管理 AI 服务商', sub: s.providers.length + ' 个已配置', act: 'nav', id: 'providers', chev: true })}
            ${row({ icon: ICON.layers, tint: 'purple', title: '模型分组', sub: s.groups.length + ' 个班组', act: 'nav', id: 'groups', chev: true })}
            ${row({ icon: ICON.chart, tint: 'red', title: 'Token 用量', sub: tin ? tin.toLocaleString() + ' 输入 token' : '还没有用量', act: 'nav', id: 'usage', chev: true })}
          </div>
          <div class="sec-f">填好 Key 之后，对话就是真调模型了。所有 Key 只存在这台手机本地，不会发到别处。</div>
        </div>
        <div class="sec">
          <div class="sec-t">外观</div>
          <div class="card">
            ${row({ icon: ICON.palette, tint: 'teal', title: '外观', sub: '字号 ' + (s.ui.fontSize || 15) + 'px', act: 'nav', id: 'appearance', chev: true })}
          </div>
        </div>
        <div class="sec">
          <div class="sec-t">Agent 运行时</div>
          <div class="card">
            ${row({ icon: ICON.folder, tint: 'green', title: '文件空间', sub: '公共区 + ' + s.agents.length + ' 块私有区', act: 'nav', id: 'files', chev: true })}
            ${row({ icon: ICON.tool, tint: 'orange', title: '可用工具', sub: (s.plugins || []).length + ' 个插件', act: 'nav', id: 'tools', chev: true })}
            ${row({ icon: ICON.task, tint: 'indigo', title: '子代理任务', sub: '交接与验收记录', act: 'nav', id: 'threads', chev: true })}
            ${row({ icon: ICON.skill, tint: 'green', title: '技能', sub: (s.skills || []).length + ' 条提示词片段', act: 'nav', id: 'skills', chev: true })}
            ${row({ icon: ICON.soul, tint: 'pink', title: '灵魂', sub: s.agents.length + ' 个角色', act: 'nav', id: 'agents', chev: true })}
            ${row({ icon: ICON.memory, tint: 'blue', title: '记忆', sub: '每个角色私有的记忆', act: 'nav', id: 'memory', chev: true })}
            ${row({ icon: ICON.mcp, tint: 'purple', title: 'MCP 集成', sub: '外部工具服务', act: 'nav', id: 'mcp', chev: true })}
            ${row({ icon: ICON.env, tint: 'gray', title: '环境变量', sub: (s.env || []).length + ' 项', act: 'nav', id: 'env', chev: true })}
          </div>
          <div class="sec-f">角色之间不共享记忆，只共享当前对话。谁该接什么，写在各自的职责里。</div>
        </div>
        <div class="sec" style="padding-bottom:30px">
          <div class="card">
            ${row({ icon: ICON.folder, tint: 'gray', title: '导出备份', act: 'export', chev: true })}
            ${row({ icon: ICON.trash, tint: 'red', title: '清空全部数据', act: 'wipe' })}
          </div>
        </div>
      </div>`;
  }

  // ---- 服务商 ----
  function pageProviders() {
    const s = st();
    return `${head('AI 服务商')}
      <div class="scroll">
        <div class="sec">
          <div class="card">
            ${s.providers.map(p => row({
              icon: ICON.server, tint: p.type === 'mock' ? 'gray' : 'blue',
              title: p.name, sub: (p.type === 'mock' ? '本地回声（不联网）' : (p.baseUrl || '没填地址')) + ' · ' + (p.models || []).join(', '),
              act: 'pedit', id: p.id, chev: true
            })).join('') || `<div class="row"><div class="rtxt"><div class="rs">还没添加</div></div></div>`}
          </div>
          <div class="sec-f">DeepSeek：https://api.deepseek.com/v1 ｜ 通义：https://dashscope.aliyuncs.com/compatible-mode/v1</div>
        </div>
        <div class="card" style="margin-top:12px"><div class="row tap" data-act="pnew"><div class="rtxt"><div class="rt" style="color:#007aff">+ 添加服务商</div></div></div></div>
      </div>`;
  }

  function providerSheet(id) {
    const s = st();
    const p = id ? s.providers.find(x => x.id === id) : { name: '', type: 'openai', baseUrl: '', apiKey: '', models: [] };
    sheet(id ? '编辑服务商' : '添加服务商', `
      <div class="field-l">名字</div><input class="inp" id="p-name" value="${esc(p.name)}" placeholder="DeepSeek">
      <div class="field-l">类型</div>
      <select class="inp" id="p-type">
        <option value="openai" ${p.type !== 'mock' ? 'selected' : ''}>OpenAI 兼容</option>
        <option value="mock" ${p.type === 'mock' ? 'selected' : ''}>本地回声（测试用）</option>
      </select>
      <div class="field-l">Base URL</div><input class="inp" id="p-url" value="${esc(p.baseUrl)}" placeholder="https://api.deepseek.com/v1">
      <div class="field-l">API Key</div><input class="inp" id="p-key" type="password" value="${esc(p.apiKey)}" placeholder="sk-...">
      <div class="field-l">模型（逗号分隔）</div><input class="inp" id="p-models" value="${esc((p.models || []).join(', '))}" placeholder="deepseek-chat, deepseek-reasoner">
      <button class="btn" id="p-save">保存</button>
      ${id ? `<button class="btn danger" id="p-del">删除这个服务商</button>` : ''}
    `, box => {
      box.querySelector('#p-save').onclick = () => {
        const v = {
          name: box.querySelector('#p-name').value.trim() || '未命名',
          type: box.querySelector('#p-type').value,
          baseUrl: box.querySelector('#p-url').value.trim(),
          apiKey: box.querySelector('#p-key').value.trim(),
          models: box.querySelector('#p-models').value.split(/[,，\s]+/).filter(Boolean)
        };
        S.set(x => {
          if (id) Object.assign(x.providers.find(v2 => v2.id === id), v);
          else { v.id = S.uid('p_'); x.providers.push(v); }
        });
        closeSheet(); render(); toast('已保存');
      };
      const del = box.querySelector('#p-del');
      if (del) del.onclick = () => {
        S.set(x => { x.providers = x.providers.filter(v2 => v2.id !== id); });
        closeSheet(); render(); toast('删了');
      };
    });
  }

  // ---- 班组（模型分组）----
  function pageGroups() {
    const s = st();
    return `${head('模型分组')}
      <div class="scroll">
        <div class="sec">
          <div class="card">
            ${s.groups.map(g => {
              const mem = g.memberIds.map(i => s.agents.find(a => a.id === i)).filter(Boolean);
              return row({ icon: ICON.layers, tint: 'purple', title: g.name,
                sub: mem.map(a => a.code).join(' / ') || '还没有成员', act: 'gedit', id: g.id, chev: true });
            }).join('') || `<div class="row"><div class="rtxt"><div class="rs">还没有班组</div></div></div>`}
          </div>
          <div class="sec-f">一个班组就是一伙人。对话里可以在他们之间换人接话，上下文不断。</div>
        </div>
        <div class="card" style="margin-top:12px"><div class="row tap" data-act="gnew"><div class="rtxt"><div class="rt" style="color:#007aff">+ 新建班组</div></div></div></div>
      </div>`;
  }

  function groupSheet(id) {
    const s = st();
    const g = id ? s.groups.find(x => x.id === id) : { name: '', memberIds: [] };
    const picked = new Set(g.memberIds);
    sheet(id ? '编辑班组' : '新建班组', `
      <div class="field-l">名字</div><input class="inp" id="g-name" value="${esc(g.name)}" placeholder="主力班">
      <div class="field-l">成员</div>
      <div class="chips" id="g-mem" style="flex-wrap:wrap;overflow:visible">
        ${s.agents.map(a => `<button class="chip ${picked.has(a.id) ? 'on' : ''}" data-mem="${a.id}">${esc(a.emoji || '')} ${esc(a.code)}</button>`).join('')}
      </div>
      <button class="btn" id="g-save">保存</button>
      ${id ? `<button class="btn danger" id="g-del">删除</button>` : ''}
    `, box => {
      box.querySelectorAll('[data-mem]').forEach(b => b.onclick = () => {
        const id2 = b.dataset.mem;
        if (picked.has(id2)) { picked.delete(id2); b.classList.remove('on'); }
        else { picked.add(id2); b.classList.add('on'); }
      });
      box.querySelector('#g-save').onclick = () => {
        const name = box.querySelector('#g-name').value.trim() || '未命名班组';
        S.set(x => {
          if (id) { const o = x.groups.find(v => v.id === id); o.name = name; o.memberIds = [...picked]; }
          else x.groups.push({ id: S.uid('g_'), name, mode: 'fallback', memberIds: [...picked] });
        });
        closeSheet(); render(); toast('已保存');
      };
      const d = box.querySelector('#g-del');
      if (d) d.onclick = () => { S.set(x => { x.groups = x.groups.filter(v => v.id !== id); }); closeSheet(); render(); toast('删了'); };
    });
  }

  // ---- 用量 ----
  function pageUsage() {
    const s = st();
    const per = {};
    let ti = 0, to = 0, calls = 0;
    s.sessions.forEach(c => (c.msgs || []).forEach(m => {
      if (m.role !== 'assistant' || !m.usage) return;
      calls++;
      const a = agent(m.agentId);
      const k = a ? a.code : '未知';
      per[k] = per[k] || { i: 0, o: 0, n: 0 };
      per[k].i += m.usage.input_tokens || 0; per[k].o += m.usage.output_tokens || 0; per[k].n++;
      ti += m.usage.input_tokens || 0; to += m.usage.output_tokens || 0;
    }));
    const rows = Object.keys(per).map(k => row({
      icon: ICON.chat, tint: 'blue', title: k,
      sub: `${per[k].n} 次 · ${per[k].i.toLocaleString()} 输入 / ${per[k].o.toLocaleString()} 输出`
    }));
    return `${head('Token 用量')}
      <div class="scroll">
        <div class="sec">
          <div class="sec-t">合计</div>
          <div class="card">
            ${row({ icon: ICON.chart, tint: 'red', title: '输入 token', right: ti.toLocaleString() })}
            ${row({ icon: ICON.chart, tint: 'orange', title: '输出 token', right: to.toLocaleString() })}
            ${row({ icon: ICON.task, tint: 'indigo', title: '模型调用次数', right: String(calls) })}
          </div>
          <div class="sec-f">只统计本机记录到的调用。单价没接，不做金额估算。</div>
        </div>
        ${rows.length ? `<div class="sec"><div class="sec-t">按角色</div><div class="card">${rows.join('')}</div></div>` : ''}
      </div>`;
  }

  // ---- 外观 ----
  function pageAppearance() {
    const s = st();
    const sizes = [14, 15, 16, 17];
    return `${head('外观')}
      <div class="scroll">
        <div class="sec">
          <div class="sec-t">字号</div>
          <div class="card">
            ${sizes.map(v => `<div class="row tap" data-act="fs" data-id="${v}">
              <div class="rtxt"><div class="rt">${v}px <span style="color:#8a8a8f;font-size:12.5px">${v === 14 ? '小' : v === 15 ? '标准' : v === 16 ? '大' : '特大'}</span></div></div>
              ${(s.ui.fontSize || 15) === v ? `<span style="color:#007aff">${ICON.check}</span>` : ''}
            </div>`).join('')}
          </div>
        </div>
        <div class="sec"><div class="sec-f">深色模式还没做，现在是固定的浅色。iOS 上会沿用系统字体和圆角。</div></div>
      </div>`;
  }

  // ---- 工具 ----
  function pageTools() {
    const s = st();
    const plugs = s.plugins || [];
    const mcps = s.mcp || [];
    const mcpTools = mcps.reduce((n, m) => n + (m.tools || []).length, 0);
    const using = c => s.agents.filter(a => (a.tools || []).indexOf(c) >= 0).length;

    const builtin = [
      { id: 'fs_list', n: '看目录' },
      { id: 'fs_read', n: '读文件' },
      { id: 'fs_write', n: '写文件' }
    ];

    return `${head('可用工具')}
      <div class="scroll">
        <div class="sec">
          <div class="card">
            ${row({ icon: ICON.tool, tint: 'green', title: '内置工具', sub: '文件空间 · ' + builtin.length + ' 个 · 装了文件空间才生效', act: 'toolsbuiltin', chev: true })}
            ${row({ icon: ICON.tool, tint: 'orange', title: '插件', sub: plugs.length ? plugs.length + ' 个 · 自己填地址和参数' : '还没加，点进去加', act: 'toolsplugins', chev: true })}
            ${row({ icon: ICON.tool, tint: 'blue', title: 'MCP 服务器', sub: mcps.length ? mcps.length + ' 个服务器 · ' + mcpTools + ' 个工具' : '还没加，点进去加', act: 'tools-mcp', chev: true })}
          </div>
          <div class="sec-f">三条通道各管一批工具。角色在「灵魂」里勾了哪条，那条的工具才会出现在他的会话里。</div>
        </div>
        <div class="sec">
          <div class="sec-f" style="padding-left:0">各角色挂了什么</div>
          <div class="card">
            ${s.agents.map(a => row({
              icon: '', title: a.name,
              sub: (a.tools || []).length + ' 个插件 · ' + ((a.mcpIds || []).length) + ' 个 MCP · ' + (a.dir || a.privateOn ? '有文件空间' : '无文件空间'),
              act: 'aedit', id: a.id, chev: true
            })).join('') || `<div class="row"><div class="rtxt"><div class="rs">还没有角色</div></div></div>`}
          </div>
        </div>
      </div>`;
  }

  function pagePlugins() {
    const s = st();
    const plugs = s.plugins || [];
    return `${head('插件', `<button class="pill" data-act="pnew">添加</button>`)}
      <div class="scroll">
        <div class="sec">
          <div class="card">
            ${plugs.map(p => row({
              icon: p.icon || '', tint: 'orange',
              title: p.name, sub: (p.desc || (p.method || 'GET') + ' ' + p.url),
              act: 'popen', id: p.id, chev: true
            })).join('') || `<div class="row"><div class="rtxt"><div class="rs">还没有插件</div></div></div>`}
          </div>
          <div class="sec-f">插件 = 一个 HTTP 地址 + 参数定义。模型自己决定调不调、填什么参数，这台设备真去请求，结果回给它。</div>
        </div>
      </div>`;
  }

  function pageBuiltin() {
    const s = st();
    const items = [
      { id: 'fs_list', name: '看目录', desc: '列公共区 + 自己私有目录的文件' },
      { id: 'fs_read', name: '读文件', desc: '读一个文件的全文' },
      { id: 'fs_write', name: '写文件', desc: '新建或覆盖一个文件' }
    ];
    return `${head('内置工具')}
      <div class="scroll">
        <div class="sec">
          <div class="card">
            ${items.map(t => row({ title: t.name, sub: t.desc + '  ·  ' + t.id })).join('')}
          </div>
          <div class="sec-f">这三个不占插件名额，装了文件空间（设置 → 文件空间里点角色）就自动有。</div>
        </div>
        <div class="sec">
          <div class="sec-f" style="padding-left:0">谁在用</div>
          <div class="card">
            ${s.agents.map(a => row({
              title: a.name, sub: (a.dir || a.privateOn) ? '已启用文件空间' : '未启用',
              act: 'aedit', id: a.id, chev: true
            })).join('') || `<div class="row"><div class="rtxt"><div class="rs">还没有角色</div></div></div>`}
          </div>
        </div>
      </div>`;
  }

  /* 插件详情：改地址参数、真跑一次、删除 */
  function pluginSheet(id) {
    const s = st();
    const p = id ? (s.plugins || []).find(x => x.id === id) : null;
    if (!p) { toast('插件不存在'); return; }
    const paramLines = Object.keys(p.params || {}).map(k => {
      const v = p.params[k] || {};
      return `${k}|${v.type || 'string'}|${v.desc || ''}`;
    }).join('\n');

    sheet(p.name || '插件', `
      <div class="field-l">名字</div>
      <input class="inp" id="q-name" value="${esc(p.name || '')}">
      <div class="field-l">说明（模型靠它决定要不要调）</div>
      <input class="inp" id="q-desc" value="${esc(p.desc || '')}">
      <div class="row2">
        <div><div class="field-l">方法</div>
          <select class="inp" id="q-method">
            ${['GET', 'POST', 'PUT', 'DELETE'].map(m => `<option ${((p.method || 'GET').toUpperCase() === m) ? 'selected' : ''}>${m}</option>`).join('')}
          </select>
        </div>
        <div><div class="field-l">图标</div><input class="inp" id="q-icon" value="${esc(p.icon || '')}" placeholder="🔧"></div>
      </div>
      <div class="field-l">地址（参数用 {name} 占位，POST 会发 JSON body）</div>
      <input class="inp" id="q-url" value="${esc(p.url || '')}" placeholder="https://...">
      <div class="field-l">请求头（每行 Key: Value）</div>
      <textarea class="inp" id="q-hdr" style="min-height:60px">${esc(Object.entries(p.headers || {}).map(([k, v]) => k + ': ' + v).join('\n'))}</textarea>
      <div class="field-l">参数（每行 名字|类型|说明）</div>
      <textarea class="inp" id="q-params" style="min-height:90px">${esc(paramLines)}</textarea>
      <div class="field-l">试跑参数（JSON）</div>
      <textarea class="inp" id="q-test" style="min-height:60px">{}</textarea>
      <div class="note" id="q-out">点「试跑」会用上面的参数真发一次请求。</div>
      <div class="sh-f">
        <button class="btn ghost danger" id="q-del">删除</button>
        <button class="btn ghost" id="q-run">试跑</button>
        <button class="btn" id="q-save">保存</button>
      </div>
    `, box => {
      const collect = () => {
        const params = {};
        box.querySelector('#q-params').value.split('\n').forEach(line => {
          const [k, t, d] = line.split('|').map(x => (x || '').trim());
          if (!k) return;
          params[k] = { type: t || 'string', desc: d || '' };
        });
        const headers = {};
        box.querySelector('#q-hdr').value.split('\n').forEach(line => {
          const i = line.indexOf(':');
          if (i < 0) return;
          const k = line.slice(0, i).trim(), v = line.slice(i + 1).trim();
          if (k) headers[k] = v;
        });
        return {
          id: p.id,
          name: box.querySelector('#q-name').value.trim(),
          desc: box.querySelector('#q-desc').value.trim(),
          method: box.querySelector('#q-method').value,
          icon: box.querySelector('#q-icon').value.trim(),
          url: box.querySelector('#q-url').value.trim(),
          headers, params
        };
      };

      box.querySelector('#q-run').onclick = async () => {
        const c = collect();
        const err = T.check(c);
        if (err) { box.querySelector('#q-out').textContent = '还有问题：' + err; return; }
        let args = {};
        try { args = JSON.parse(box.querySelector('#q-test').value || '{}'); } catch (e) {
          box.querySelector('#q-out').textContent = '试跑参数不是合法 JSON'; return;
        }
        box.querySelector('#q-out').textContent = '请求中…';
        const out = await T.run(c, args);
        box.querySelector('#q-out').textContent = String(out).slice(0, 600);
      };

      box.querySelector('#q-save').onclick = () => {
        const c = collect();
        const err = T.check(c);
        if (err) { toast(err); return; }
        S.set(st => {
          const old = st.plugins.find(x => x.id === p.id);
          if (old) Object.assign(old, c); else st.plugins.push(Object.assign({ id: p.id }, c));
        });
        closeSheet(); render(); toast('已保存');
      };

      box.querySelector('#q-del').onclick = () => {
        S.set(st => {
          st.plugins = st.plugins.filter(x => x.id !== p.id);
          st.agents.forEach(a => { a.tools = (a.tools || []).filter(t => t !== p.id); });
        });
        closeSheet(); render(); toast('已删除');
      };
    });
  }

  /* 插件导入：三条通道 —— 粘贴 / 网址 / 文件 */
  function pluginImportSheet() {
    sheet('添加插件', `
      <div class="tabs" id="ptab">
        <button class="tab on" data-t="paste">粘贴 JSON</button>
        <button class="tab" data-t="url">从网址</button>
        <button class="tab" data-t="file">从文件</button>
      </div>
      <div id="ppane">
        <div class="field-l">JSON</div>
        <textarea class="inp" id="p-json" style="min-height:200px;font-family:ui-monospace,Menlo,monospace;font-size:13px">${esc(JSON.stringify(T.sample(), null, 2))}</textarea>
      </div>
      <div id="uhint" class="note">支持 OpenAI 风格的 function 定义，也支持简写：{"name","desc","url","method","params"}。</div>
      <button class="btn" id="p-ok">添加</button>
    `, box => {
      const pane = box.querySelector('#ppane');
      const heads = {
        paste: `<div class="field-l">JSON</div>
          <textarea class="inp" id="p-json" style="min-height:200px;font-family:ui-monospace,Menlo,monospace;font-size:13px">${esc(JSON.stringify(T.sample(), null, 2))}</textarea>`,
        url: `<div class="field-l">地址</div>
          <input class="inp" id="p-url" placeholder="https://example.com/plugins.json">
          <div class="note">拉回来可以是一个插件，也可以是一个插件数组。</div>`,
        file: `<div class="field-l">选择文件</div>
          <input class="inp" type="file" id="p-file" accept=".json,application/json">
          <div class="note">从「文件」App 里选一个 .json。</div>`
      };
      box.querySelectorAll('#ptab .tab').forEach(t => t.onclick = () => {
        box.querySelectorAll('#ptab .tab').forEach(x => x.classList.remove('on'));
        t.classList.add('on');
        pane.innerHTML = heads[t.dataset.t];
      });

      box.querySelector('#p-ok').onclick = async () => {
        const tab = box.querySelector('#ptab .tab.on').dataset.t;
        let raw = '';
        try {
          if (tab === 'paste') raw = box.querySelector('#p-json').value;
          else if (tab === 'url') {
            const u = box.querySelector('#p-url').value.trim();
            if (!u) { toast('地址没填'); return; }
            const r = await fetch(u);
            if (!r.ok) { toast('拉取失败 HTTP ' + r.status); return; }
            raw = await r.text();
          } else {
            const f = box.querySelector('#p-file').files[0];
            if (!f) { toast('没选文件'); return; }
            raw = await f.text();
          }
          const got = JSON.parse(raw);
          const list = Array.isArray(got) ? got : [got];
          let n = 0, bad = '';
          const skips = [];
          S.set(s => {
            list.forEach(o => {
              const c = T.normalize(o);
              const err = T.check(c);
              if (err) { bad = err; skips.push((c.name || c.id || '未命名') + '：' + err); return; }
              const id = c.id || S.uid('p_');
              const old = s.plugins.find(x => x.id === id);
              if (old) Object.assign(old, c, { id: old.id });
              else s.plugins.push(Object.assign({}, c, { id }));
              n++;
            });
          });
          if (!n) { toast('没加进去：' + (bad || '格式不对')); return; }
          closeSheet(); render();
          toast(skips.length ? `加了 ${n} 个，跳过 ${skips.length} 个（${skips[0]}）` : `加了 ${n} 个插件`);
        } catch (e) { toast('解析失败：' + e.message); }
      };
    });
  }

  function toolSheet(id) {
    const s = st();
    const p = id ? s.plugins.find(x => x.id === id) : null;
    sheet(id ? '编辑工具' : '添加工具', `
      <div class="field-l">JSON 定义</div>
      <textarea class="inp" id="t-json" style="min-height:240px;font-family:ui-monospace,Menlo,monospace;font-size:13px">${esc(JSON.stringify(p || T.sample(), null, 2))}</textarea>
      <button class="btn" id="t-save">保存</button>
      ${id ? `<button class="btn danger" id="t-del">删除</button>` : ''}
      <div class="note">字段：id 名字 / name 显示名 / desc 干什么用（模型靠这句话决定调不调） / method / url / params。</div>
    `, box => {
      box.querySelector('#t-save').onclick = () => {
        let o;
        try { o = JSON.parse(box.querySelector('#t-json').value); }
        catch (e) { toast('JSON 写错了：' + e.message); return; }
        const chkErr = T.check(o);
        if (chkErr) { toast(chkErr); return; }
        S.set(x => {
          const i = x.plugins.findIndex(v => v.id === o.id);
          if (i >= 0) x.plugins[i] = o; else x.plugins.push(o);
        });
        closeSheet(); render(); toast('已保存');
      };
      const d = box.querySelector('#t-del');
      if (d) d.onclick = () => { S.set(x => { x.plugins = x.plugins.filter(v => v.id !== id); }); closeSheet(); render(); toast('删了'); };
    });
  }

  // ---- 子代理任务 ----
  function pageThreads() {
    const list = arr('threads');
    return `${head('子代理任务')}
      <div class="scroll">
        <div class="sec">
          <div class="card">${list.length ? list.map(t => row({
            icon: ICON.task, tint: 'indigo', title: t.title || '任务',
            sub: (t.from || '') + ' → ' + (t.to || '') + ' · ' + (t.state || '')
          })).join('') : `<div class="row"><div class="rtxt"><div class="rs">还没有交接记录</div></div></div>`}</div>
          <div class="sec-f">交活的规矩：说清要什么、为什么、做到什么算过。接的人先复述再开工，不接受就明说。</div>
        </div>
      </div>`;
  }

  // ---- 技能 ----
  function pageSkills() {
    const list = arr('skills');
    return `${head('技能')}
      <div class="scroll">
        <div class="sec">
          <div class="card">${list.length ? list.map(k => row({
            icon: ICON.skill, tint: 'green', title: k.name, sub: (k.text || '').slice(0, 40),
            act: 'skedit', id: k.id, chev: true
          })).join('') : `<div class="row"><div class="rtxt"><div class="rs">还没有技能</div></div></div>`}</div>
          <div class="sec-f">技能是一段可以反复用的做法或提示词，角色用到时自动带进上下文。</div>
        </div>
        <div class="card" style="margin-top:12px"><div class="row tap" data-act="sknew"><div class="rtxt"><div class="rt" style="color:#007aff">+ 新建技能</div></div></div></div>
      </div>`;
  }

  function skillSheet(id) {
    const list = arr('skills');
    const k = id ? list.find(v => v.id === id) : { name: '', text: '' };
    sheet(id ? '编辑技能' : '新建技能', `
      <div class="field-l">名字</div><input class="inp" id="s-name" value="${esc(k.name)}" placeholder="写周报">
      <div class="field-l">内容</div><textarea class="inp" id="s-text" style="min-height:160px">${esc(k.text)}</textarea>
      <button class="btn" id="s-save">保存</button>
      ${id ? `<button class="btn danger" id="s-del">删除</button>` : ''}
    `, box => {
      box.querySelector('#s-save').onclick = () => {
        const name = box.querySelector('#s-name').value.trim() || '未命名';
        const text = box.querySelector('#s-text').value;
        S.set(x => {
          if (id) Object.assign(x.skills.find(v => v.id === id), { name, text });
          else x.skills.push({ id: S.uid('k_'), name, text });
        });
        closeSheet(); render(); toast('已保存');
      };
      const d = box.querySelector('#s-del');
      if (d) d.onclick = () => { S.set(x => { x.skills = x.skills.filter(v => v.id !== id); }); closeSheet(); render(); toast('删了'); };
    });
  }

  // ---- 灵魂（角色）----
  function pageAgents() {
    const s = st();
    return `${head('灵魂')}
      <div class="scroll">
        <div class="sec">
          <div class="card">
            ${s.agents.map(a => row({
              icon: '', tint: 'pink', title: (a.emoji || '🤖') + ' ' + a.code,
              sub: (provider(a.providerId) ? provider(a.providerId).name : '没绑服务商') + ' · ' + (a.model || '没选模型'),
              act: 'aedit', id: a.id, chev: true
            })).join('') || `<div class="row"><div class="rtxt"><div class="rs">还没有角色</div></div></div>`}
          </div>
          <div class="sec-f">灵魂决定「我是谁」，职责决定「我接什么」。这两样分开写，改分工不会把人格改坏。</div>
        </div>
        <div class="card" style="margin-top:12px"><div class="row tap" data-act="anew"><div class="rtxt"><div class="rt" style="color:#007aff">+ 添加角色</div></div></div></div>
      </div>`;
  }

  function agentSheet(id) {
    const s = st();
    const a = id ? s.agents.find(x => x.id === id) : {
      code: '', emoji: '🤖', providerId: (s.providers[0] || {}).id || '',
      model: '', temp: 0.7, maxTokens: 4096, tools: [], soul: '', duty: '', memory: ''
    };
    const prov = provider(a.providerId);
    const models = prov && (prov.models || []).length ? prov.models : ['echo'];
    const picked = new Set(a.tools || []);
    const mcpPick = new Set(a.mcpIds || []);
    sheet(id ? '编辑角色' : '添加角色', `
      <div class="btn-row">
        <div style="flex:0 0 64px"><div class="field-l">头像</div><input class="inp" id="a-emoji" value="${esc(a.emoji)}" style="text-align:center"></div>
        <div style="flex:1"><div class="field-l">代号</div><input class="inp" id="a-code" value="${esc(a.code)}" placeholder="铁锤"></div>
      </div>
      <div class="field-l">服务商</div>
      <select class="inp" id="a-prov">${s.providers.map(p => `<option value="${p.id}" ${p.id === a.providerId ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select>
      <div class="field-l">模型</div>
      <input class="inp" id="a-model" value="${esc(a.model)}" placeholder="${esc(models.join(' / '))}">
      <div class="field-l">温度 temp</div><input class="inp" id="a-temp" type="number" step="0.1" min="0" max="2" value="${a.temp}">
      <div class="field-l">灵魂（我是谁）</div>
      <textarea class="inp" id="a-soul" style="min-height:100px">${esc(a.soul)}</textarea>
      <div class="field-l">职责（我管什么／不接什么）</div>
      <textarea class="inp" id="a-duty" style="min-height:88px">${esc(a.duty)}</textarea>
      <div class="field-l">挂哪些工具</div>
      <div class="chips" style="flex-wrap:wrap;overflow:visible">
        ${(s.plugins || []).map(p => `<button class="chip ${picked.has(p.id) ? 'on' : ''}" data-tool="${p.id}">${esc(p.icon || '🔧')} ${esc(p.name)}</button>`).join('') || '<span class="note">还没有工具</span>'}
      </div>
      ${(s.mcp || []).length ? `
      <div class="field-l">接哪些 MCP 服务器</div>
      <div class="chips" style="flex-wrap:wrap;overflow:visible">
        ${s.mcp.map(m => `<button class="chip ${mcpPick.has(m.id) ? 'on' : ''}" data-mcp="${m.id}">${esc(m.name)}</button>`).join('')}
      </div>` : ''}
      <button class="btn" id="a-save">保存</button>
      ${id ? `<button class="btn danger" id="a-del">删除角色</button>` : ''}
    `, box => {
      box.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => {
        const k = b.dataset.tool;
        if (picked.has(k)) { picked.delete(k); b.classList.remove('on'); }
        else { picked.add(k); b.classList.add('on'); }
      });
      box.querySelectorAll('[data-mcp]').forEach(b => b.onclick = () => {
        const k = b.dataset.mcp;
        if (mcpPick.has(k)) { mcpPick.delete(k); b.classList.remove('on'); }
        else { mcpPick.add(k); b.classList.add('on'); }
      });
      box.querySelector('#a-save').onclick = () => {
        const v = {
          code: box.querySelector('#a-code').value.trim() || '新角色',
          emoji: box.querySelector('#a-emoji').value.trim() || '🤖',
          providerId: box.querySelector('#a-prov').value,
          model: box.querySelector('#a-model').value.trim(),
          temp: Number(box.querySelector('#a-temp').value) || 0.7,
          maxTokens: a.maxTokens || 4096,
          soul: box.querySelector('#a-soul').value,
          duty: box.querySelector('#a-duty').value,
          tools: [...picked],
          mcpIds: [...mcpPick]
        };
        S.set(x => {
          if (id) Object.assign(x.agents.find(v2 => v2.id === id), v);
          else { v.id = S.uid('a_'); v.groupIds = []; v.memory = ''; x.agents.push(v); }
        });
        closeSheet(); render(); toast('已保存');
      };
      const d = box.querySelector('#a-del');
      if (d) d.onclick = () => {
        S.set(x => { x.agents = x.agents.filter(v => v.id !== id); });
        closeSheet(); render(); toast('删了');
      };
    });
  }

  // ---- 记忆 ----
  function pageMemory() {
    const s = st();
    return `${head('记忆')}
      <div class="scroll">
        <div class="sec">
          <div class="card">
            ${s.agents.map(a => row({
              icon: '', tint: 'blue', title: (a.emoji || '🤖') + ' ' + a.code,
              sub: (a.memory || '').replace(/\s+/g, ' ').slice(0, 44) || '空的',
              act: 'medit', id: a.id, chev: true
            })).join('')}
          </div>
          <div class="sec-f">记忆是私有的：只有他本人在场时才会注入，别人看不到。所以同一个事实，需要别人也知道，就得说给他听。</div>
        </div>
      </div>`;
  }

  function memorySheet(id) {
    const a = agent(id);
    sheet(a.code + ' 的记忆', `
      <div class="field-l">只他能看到</div>
      <textarea class="inp" id="m-text" style="min-height:220px">${esc(a.memory || '')}</textarea>
      <button class="btn" id="m-save">保存</button>
    `, box => {
      box.querySelector('#m-save').onclick = () => {
        S.set(x => { x.agents.find(v => v.id === id).memory = box.querySelector('#m-text').value; });
        closeSheet(); render(); toast('已保存');
      };
    });
  }

  // ---- MCP ----
  let FSVIEW = { dir: '', path: '', entries: [], err: '' };

  function dirOf(a) {
    return String(a.code || 'agent').replace(/[\/\\:*?"<>|\s]+/g, '-');
  }

  function pageFiles() {
    const s = st();
    const pub = row({ icon: ICON.folder, tint: 'blue', title: '公共区', sub: '所有角色共用 · crew/files/', act: 'fopen', id: '@pub', chev: true });
    const priv = s.agents.map(a => row({
      icon: ICON.folder, tint: 'green',
      title: (a.emoji || '🤖') + ' ' + a.code,
      sub: '@' + a.code + '/', act: 'fopen', id: a.id, chev: true
    })).join('');
    return `${head('文件空间')}
      <div class="scroll">
        <div class="sec">
          <div class="grp-t">公共</div>
          <div class="card">${pub}</div>
          <div class="sec-f">谁都能读写。群里的对话会自动带上这里的文件清单，他们想看你放的资料，直接说文件名就行。</div>
        </div>
        <div class="sec">
          <div class="grp-t">私有</div>
          <div class="card">${priv || `<div class="row"><div class="rtxt"><div class="rs">先加个角色</div></div></div>`}</div>
          <div class="sec-f">每个角色一块，只有他自己看得到。位置在 crew/agents/&lt;代号&gt;/，你在终端里也能直接改。</div>
        </div>
      </div>`;
  }

  function pageBrowser() {
    const v = FSVIEW;
    const parts = v.path ? v.path.split('/') : [];
    const crumbs = [`<span class="crumb" data-act="fcroot">${esc(v.dir || '公共区')}</span>`]
      .concat(parts.map((p, i) => `<span class="csep">/</span><span class="crumb" data-act="fcgo" data-id="${esc(parts.slice(0, i + 1).join('/'))}">${esc(p)}</span>`));
    const rows = v.entries.map(e => `<div class="row tap" data-act="${e.dir ? 'fenter' : 'fedit'}" data-id="${esc(e.name)}">
        <span class="fico">${e.dir ? '📁' : '📄'}</span>
        <div class="rtxt"><div class="rt">${esc(e.name)}</div>
          <div class="rs">${e.dir ? '文件夹' : (e.size || 0) + ' 字节'}</div></div>
        <button class="ic plain" data-act="fdel" data-id="${esc(e.name)}">${ICON.trash}</button>
      </div>`).join('');
    return `${head((v.dir || '公共区') + (v.path ? '/' + v.path : ''), `<button class="pill" data-act="fnew">新建</button>`)}
      <div class="crumbs">${crumbs.join('')}<button class="ic plain" data-act="fsync" style="margin-left:auto">${ICON.refresh || '↻'}</button></div>
      <div class="scroll">
        <div class="card" style="margin-top:10px">
          ${rows || `<div class="row"><div class="rtxt"><div class="rs">${v.err ? esc(v.err) : '空文件夹'}</div></div></div>`}
        </div>
        <div class="sec-f">他用自己的文件工具读写这里。你在这也能改，保存后他下一轮就看得见。</div>
      </div>`;
  }

  async function goFiles(dir, path) {
    const full = dir + (path ? '/' + path : '');
    const r = await F.list(full);
    FSVIEW = { dir, path: path || '', entries: r.ok ? (r.entries || []) : [], err: r.ok ? '' : (r.err || '读不到') };
    nav.settings = ['files', dir, path || ''];
    render();
  }

  function filesNewSheet() {
    sheet('新建', `
      <div class="field"><div class="field-l">名字</div><input class="inp" id="fn" placeholder="例如 notes.md"></div>
      <div class="chips" style="margin:14px 0">
        <span class="chip on" data-act="fkind" data-k="file">文件</span>
        <span class="chip" data-act="fkind" data-k="dir">文件夹</span>
      </div>
      <div class="btn-row"><button class="btn" data-act="fndo">创建</button></div>`);
  }

  async function fileEditSheet(name) {
    const p = (FSVIEW.path ? FSVIEW.path + '/' : '') + name;
    const r = await F.read((FSVIEW.dir ? FSVIEW.dir + '/' : '') + p);
    sheet(name, `
      <textarea class="ta" id="fc" spellcheck="false">${esc(r.ok ? (r.content || '') : '')}</textarea>
      <div class="btn-row"><button class="btn" data-act="fsave" data-id="${esc(name)}">保存</button></div>
      ${r.ok ? '' : `<div class="sec-f">${esc(r.err || '读不到')}</div>`}`);
  }

  function delSheet(name, isDir) {
    sheet('删除', `
      <div class="hint" style="margin:8px 0 16px">删掉 ${esc(name)}${isDir ? ' 和里面的所有东西' : ''}？这个删了就没了，不进回收站。</div>
      <div class="btn-row"><button class="btn danger" data-act="fdeldo" data-id="${esc(name)}" data-dir="${isDir ? 1 : 0}">删除</button></div>`);
  }

  function pageMcp() {
    const s = st();
    const list = s.mcp || [];
    return `${head('MCP 集成', `<button class="pill" data-act="mcpadd">添加</button>`)}
      <div class="scroll">
        <div class="sec">
          <div class="card">
            ${list.map(m => row({
              icon: ICON.mcp, tint: 'purple', title: m.name || m.url,
              sub: (m.err ? '⚠️ ' + m.err : (m.tools || []).length + ' 个工具') + ' · ' + (m.enabled ? '已启用' : '已停用'),
              act: 'mcpopen', id: m.id, chev: true
            })).join('') || `<div class="row"><div class="rtxt"><div class="rs">还没加服务器，点右上角「添加」</div></div></div>`}
          </div>
          <div class="sec-f">MCP 服务器是走 JSON-RPC 的外部工具集合。填上地址就能拉到它的工具清单，角色勾了就能调。注意：网页版受浏览器跨域限制，有些服务器要在 App 里才能连上。</div>
        </div>
      </div>`;
  }

  function mcpView() {
    const s = st();
    const m = (s.mcp || []).find(v => v.id === (nav.settings[1] || ''));
    if (!m) { nav.settings = ['mcp']; render(); return; }
    const tools = (m.tools || []).map(t => `<div class="row"><div class="rtxt"><div class="rt">${esc(t.name)}</div><div class="rs">${esc(t.desc || '无描述')}</div></div></div>`).join('');
    return `${head(m.name || 'MCP', `<button class="pill" data-act="mcpsync" id="ms">重连</button>`)}
      <div class="scroll">
        <div class="sec">
          <div class="card">
            ${row({ title: '地址', right: `<span style="font-size:12px;color:var(--dim);max-width:180px;overflow:hidden;text-overflow:ellipsis">${esc(m.url)}</span>` })}
            ${row({ title: '状态', sub: m.err ? '⚠️ ' + m.err : '正常', right: m.enabled ? '已启用' : '已停用' })}
            ${row({ title: '启停', act: 'mcptoggle', id: m.id, right: m.enabled ? '点一下停用' : '点一下启用' })}
          </div>
        </div>
        <div class="sec">
          <div class="grp-t">工具 ${(m.tools || []).length}</div>
          <div class="card">${tools || `<div class="row"><div class="rtxt"><div class="rs">还没有工具，点「重连」拉一次</div></div></div>`}</div>
        </div>
        <div class="sec">
          <div class="card">${row({ title: '删除这个服务器', act: 'mcpdel', id: m.id, right: '' })}</div>
        </div>
      </div>`;
  }

  function mcpAddSheet() {
    sheet('添加 MCP 服务器', `<div class="sh-b">
      <label class="fl">名字<input id="m-name" placeholder="比如 filesystem"></label>
      <label class="fl">地址（http/https）<input id="m-url" placeholder="https://example.com/mcp" autocapitalize="off" autocorrect="off"></label>
      <div class="hint" id="m-hint"></div>
    </div>
    <div class="sh-f"><button class="btn ghost" data-close>取消</button><button class="btn" id="m-ok">连接</button></div>`, box => {
      const go = async () => {
        const name = box.querySelector('#m-name').value.trim();
        const url = box.querySelector('#m-url').value.trim();
        const hint = box.querySelector('#m-hint');
        if (!/^https?:\/\//.test(url)) { hint.textContent = '地址要以 http:// 或 https:// 开头'; return; }
        hint.textContent = '正在握手…';
        box.querySelector('#m-ok').disabled = true;
        const srv = { id: S.uid('mcp_'), name: name || url, url, enabled: true, tools: [], sid: '' };
        const r = await MCP.connect(srv);
        box.querySelector('#m-ok').disabled = false;
        if (!r.ok) { hint.textContent = '连不上：' + r.err; return; }
        S.set(x => { (x.mcp = x.mcp || []).push(srv); });
        closeSheet(); render();
        toast('连上了，' + srv.tools.length + ' 个工具');
      };
      box.querySelector('#m-ok').onclick = go;
    });
  }

  // ---- 环境变量 ----
  function pageEnv() {
    const s = st();
    const list = s.env || [];
    return `${head('环境变量')}
      <div class="scroll">
        <div class="sec">
          <div class="card">
            ${list.map(e => row({ icon: ICON.env, tint: 'gray', title: e.k, sub: '••••' + String(e.v || '').slice(-4), act: 'envedit', id: e.k })).join('')
        || `<div class="row"><div class="rtxt"><div class="rs">还没有变量</div></div></div>`}
          </div>
          <div class="sec-f">工具 URL 里写 $变量名，运行时会替换成这里的值。适合放不能写进插件的令牌。</div>
        </div>
        <div class="card" style="margin-top:12px"><div class="row tap" data-act="envnew"><div class="rtxt"><div class="rt" style="color:#007aff">+ 添加变量</div></div></div></div>
      </div>`;
  }

  function envSheet(k) {
    const list = st().env || [];
    const cur = k ? list.find(e => e.k === k) : { k: '', v: '' };
    sheet(k ? '编辑变量' : '添加变量', `
      <div class="field-l">名字</div><input class="inp" id="e-k" value="${esc(cur.k)}" placeholder="WEATHER_TOKEN">
      <div class="field-l">值</div><input class="inp" id="e-v" value="${esc(cur.v)}">
      <button class="btn" id="e-save">保存</button>
      ${k ? `<button class="btn danger" id="e-del">删除</button>` : ''}
    `, box => {
      box.querySelector('#e-save').onclick = () => {
        const nk = box.querySelector('#e-k').value.trim(), nv = box.querySelector('#e-v').value;
        if (!nk) { toast('名字不能空'); return; }
        S.set(x => {
          x.env = x.env || [];
          const i = x.env.findIndex(e => e.k === k);
          if (i >= 0) x.env[i] = { k: nk, v: nv }; else x.env.push({ k: nk, v: nv });
        });
        closeSheet(); render(); toast('已保存');
      };
      const d = box.querySelector('#e-del');
      if (d) d.onclick = () => { S.set(x => { x.env = x.env.filter(e => e.k !== k); }); closeSheet(); render(); toast('删了'); };
    });
  }

  // ============ 事件 ============
  document.addEventListener('click', ev => {
    const el = ev.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act, id = el.dataset.id;
    switch (act) {
      case 'drawer': nav.drawer = true; drawDrawer(); break;
      case 'ws':
        S.set(s => { s.ui.ws = id; s.ui.sessionId = null; });
        nav.drawer = false; nav.view = 'list'; render(); break;
      case 'addws':
        nav.drawer = false;
        sheet('新建分区', `<div class="field-l">分区名</div><input class="inp" id="w-name" placeholder="工作">
          <div class="field-l">图标（一个 emoji）</div><input class="inp" id="w-icon" value="💬">
          <button class="btn" id="w-save">建</button>`, box => {
          box.querySelector('#w-save').onclick = () => {
            const name = box.querySelector('#w-name').value.trim() || '新分区';
            const icon = box.querySelector('#w-icon').value.trim() || '💬';
            const nid = S.uid('w_');
            S.set(s => { s.workspaces.push({ id: nid, name, icon }); s.ui.ws = nid; });
            closeSheet(); nav.view = 'list'; render(); toast('建好了');
          };
        });
        break;
      case 'talkto': {
        const a = agent(id);
        if (!a) return;
        const sid = S.uid('s_');
        const ids = st().agents.map(v => v.id);
        S.set(s => {
          s.sessions.unshift({ id: sid, wsId: ws().id, memberIds: ids.slice(), mode: 'all', title: '新对话', msgs: [], updatedAt: Date.now() });
          s.ui.sessionId = sid;
        });
        nav.drawer = false; go('chat');
        setTimeout(() => {
          const ta = $('#in');
          if (ta) { ta.value = '@' + a.code + ' '; ta.focus(); }
        }, 60);
        break;
      }
      case 'mat': {
        const ta = $('#in'); const a = agent(id);
        if (!ta || !a) return;
        if (!ta.value.startsWith('@')) ta.value = '@' + a.code + ' ' + ta.value;
        ta.focus();
        break;
      }
      case 'open': S.set(s => { s.ui.sessionId = id; }); go('chat'); break;
      case 'delchat': {
        const ss = st().sessions.find(v => v.id === id);
        if (!ss) return;
        sheet('删除这个群？', `<div class="sh-b"><p class="del-q">「${esc(ss.title || '未命名')}」里的全部消息都会被删掉，删了找不回来。</p></div>
          <div class="sh-f"><button class="btn ghost" data-close>取消</button><button class="btn danger" id="dc-ok">删除</button></div>`,
          box => {
            box.querySelector('#dc-ok').onclick = () => {
              S.set(x => {
                x.sessions = x.sessions.filter(v => v.id !== id);
                if (x.ui.sessionId === id) x.ui.sessionId = null;
              });
              closeSheet(); render(); toast('已删除');
            };
          });
        break;
      }
      case 'newchat': newChat(); break;
      case 'back': nav.view = 'list'; render(); break;
      case 'send': send(); break;
      case 'chatmenu': chatMenu(); break;
      case 'search': searchSheet(); break;
      case 'settings': nav.settings = []; nav.drawer = false; go('settings'); break;
      case 'sback':
        if (nav.settings[0] === 'files' && nav.settings[1]) {
          if (nav.settings[2]) {
            const parts = String(nav.settings[2]).split('/');
            parts.pop();
            goFiles(nav.settings[1], parts.join('/'));
          } else { nav.settings = ['files']; render(); }
        } else back();
        break;
      case 'fopen': {
        if (id === '@pub') { goFiles('', ''); break; }
        const a = agent(id);
        if (!a) return;
        F.init(a.code).then(r => {
          if (!r.ok) { toast('建不了：' + (r.err || '服务没起')); return; }
          goFiles('@' + a.code, '');
        });
        break;
      }
      case 'fenter': {
        const base = FSVIEW.path ? FSVIEW.path + '/' : '';
        goFiles(FSVIEW.dir, base + id); break;
      }
      case 'fcroot': goFiles(FSVIEW.dir, ''); break;
      case 'fcgo': goFiles(FSVIEW.dir, id); break;
      case 'fsync': goFiles(FSVIEW.dir, FSVIEW.path); break;
      case 'fnew': filesNewSheet(); break;
      case 'fkind': {
        const k = el.dataset.k;
        document.querySelectorAll('[data-act="fkind"]').forEach(c => c.classList.toggle('on', c.dataset.k === k));
        break;
      }
      case 'fndo': {
        const nm = (($('#fn') || {}).value || '').trim();
        if (!nm) { toast('起个名字'); return; }
        const isDir = !![...document.querySelectorAll('[data-act="fkind"]')].find(c => c.classList.contains('on') && c.dataset.k === 'dir');
        const base = FSVIEW.dir + (FSVIEW.path ? '/' + FSVIEW.path : '');
        (isDir ? F.mkdir(base + '/' + nm) : F.write(base + '/' + nm, '')).then(r => {
          if (!r.ok) { toast(r.err || '建不了'); return; }
          closeSheet(); goFiles(FSVIEW.dir, FSVIEW.path);
        });
        break;
      }
      case 'fedit': fileEditSheet(id); break;
      case 'fsave': {
        const txt = ($('#fc') || {}).value || '';
        const base = FSVIEW.dir + (FSVIEW.path ? '/' + FSVIEW.path : '');
        F.write(base + '/' + id, txt).then(r => {
          if (!r.ok) { toast(r.err || '存不了'); return; }
          toast('已保存'); closeSheet(); goFiles(FSVIEW.dir, FSVIEW.path);
        });
        break;
      }
      case 'fdel': {
        const e = FSVIEW.entries.find(x => x.name === id);
        delSheet(id, !!(e && e.dir)); break;
      }
      case 'fdeldo': {
        const base = FSVIEW.dir + (FSVIEW.path ? '/' + FSVIEW.path : '');
        F.rm(base + '/' + id).then(r => {
          if (!r.ok) { toast(r.err || '删不了'); return; }
          closeSheet(); goFiles(FSVIEW.dir, FSVIEW.path);
        });
        break;
      }
      case 'sdone': nav.settings = []; nav.view = 'list'; render(); break;
      case 'nav': nav.settings = [id]; render(); break;
      case 'toolsplugins': nav.settings = ['tools', 'plugins']; render(); break;
      case 'toolsbuiltin': nav.settings = ['tools', 'builtin']; render(); break;
      case 'tools-mcp': nav.settings = ['mcp']; render(); break;
      case 'pnew': pluginImportSheet(); break;
      case 'popen': pluginSheet(id); break;
      case 'mcpadd': mcpAddSheet(); break;
      case 'mcpopen': nav.settings = ['mcp', id]; render(); break;
      case 'mcptoggle': S.set(x => { const m = (x.mcp || []).find(v => v.id === id); if (m) m.enabled = !m.enabled; }); render(); break;
      case 'mcpdel': S.set(x => { x.mcp = (x.mcp || []).filter(v => v.id !== id); }); nav.settings = ['mcp']; render(); break;
      case 'mcpsync': {
        const m0 = (st().mcp || []).find(v => v.id === id);
        if (!m0) return;
        const btn = $('#ms'); if (btn) { btn.textContent = '重连中'; btn.disabled = true; }
        MCP.connect(m0).then(r => {
          S.set(x => {
            const m = (x.mcp || []).find(v => v.id === id);
            if (m) { m.tools = m0.tools; m.err = m0.err || ''; m.sid = m0.sid || ''; }
          });
          render();
          toast(r.ok ? '工具 ' + m0.tools.length + ' 个' : '失败：' + r.err);
        });
        break;
      }
      case 'pnew': providerSheet(null); break;
      case 'pedit': providerSheet(id); break;
      case 'gnew': groupSheet(null); break;
      case 'gedit': groupSheet(id); break;
      case 'tnew': toolSheet(null); break;
      case 'tedit': toolSheet(id); break;
      case 'sknew': skillSheet(null); break;
      case 'skedit': skillSheet(id); break;
      case 'anew': agentSheet(null); break;
      case 'aedit': agentSheet(id); break;
      case 'medit': memorySheet(id); break;
      case 'envedit': envSheet(id); break;
      case 'envnew': envSheet(null); break;
      case 'fs': S.set(s => { s.ui.fontSize = Number(id); }); render(); break;
      case 'export': exportSheet(); break;
      case 'wipe':
        sheet('清空全部数据', `<div class="note">服务商、角色、对话、工具全部删掉，回到刚装好时的样子。这一步不能撤销。</div>
          <button class="btn danger" id="w-yes">确认清空</button>`, box => {
          box.querySelector('#w-yes').onclick = () => { S.reset(); closeSheet(); nav.view = 'list'; nav.settings = []; render(); toast('清空了'); };
        });
        break;
    }
  });

  document.addEventListener('click', ev => {
    if (ev.target.id === 'mask') closeDrawer();
  });

  function chatMenu() {
    const cur = session(st().ui.sessionId);
    if (!cur) return;
    const ms = members(cur);
    sheet('这个群', `
      <div class="card" style="margin:0">
        ${row({ icon: ICON.chat, tint: 'blue', title: '群聊模式', sub: modeLabel(cur), act: 'vmode' })}
        ${row({ icon: ICON.soul, tint: 'pink', title: '群成员', sub: ms.map(a => a.code).join('、') || '还没人', act: 'vmem' })}
        ${row({ icon: ICON.skill, tint: 'green', title: '看系统提示词', sub: '确认每个人收到了什么', act: 'vsp' })}
        ${row({ icon: ICON.chat, tint: 'gray', title: '改群名', act: 'vren' })}
        ${row({ icon: ICON.trash, tint: 'red', title: '删掉这个群', act: 'vdel' })}
      </div>`, box => {
      box.querySelector('[data-act="vmode"]').onclick = () => {
        const next = cur.mode === 'host' ? 'all' : 'host';
        S.set(s => { const c = s.sessions.find(v => v.id === cur.id); c.mode = next; });
        closeSheet(); render(); toast(next === 'all' ? '全员都会接话' : '只有第一个成员接话');
      };
      box.querySelector('[data-act="vmem"]').onclick = () => {
        const picked = new Set(cur.memberIds || []);
        sheet('群成员', `
          <div class="chips" style="flex-wrap:wrap;overflow:visible">
            ${st().agents.map(a => `<button class="chip ${picked.has(a.id) ? 'on' : ''}" data-a="${a.id}">${esc(a.emoji || '🤖')} ${esc(a.code)}</button>`).join('')}
          </div>
          <p class="hint" style="margin-top:10px">点一下加入或退出。至少要留一个人。</p>
          <button class="btn" id="m-save">保存</button>`, b2 => {
          b2.querySelectorAll('.chip').forEach(ch => ch.onclick = () => {
            const id = ch.dataset.a;
            if (picked.has(id)) { if (picked.size > 1) { picked.delete(id); ch.classList.remove('on'); } }
            else { picked.add(id); ch.classList.add('on'); }
          });
          b2.querySelector('#m-save').onclick = () => {
            S.set(s => { s.sessions.find(v => v.id === cur.id).memberIds = [...picked]; });
            closeSheet(); closeSheet(); render();
          };
        });
      };
      box.querySelector('[data-act="vsp"]').onclick = () => {
        const msx = members(cur);
        if (!msx.length) { sheet('系统提示词', '<p class="hint">这个群还没有成员。</p>'); return; }
        const first = msx[0];
        sheet('系统提示词 · ' + first.code, `
          <div class="chips" style="margin-bottom:10px">${msx.map((a, i) => `<button class="chip ${i === 0 ? 'on' : ''}" data-p="${a.id}">${esc(a.code)}</button>`).join('')}</div>
          <pre id="sp" style="white-space:pre-wrap;font-size:12.5px;line-height:1.6;background:#fff;padding:12px;border-radius:10px">${esc(sysPrompt(first, cur))}</pre>`, b2 => {
          b2.querySelectorAll('[data-p]').forEach(ch => ch.onclick = () => {
            const a = agent(ch.dataset.p);
            b2.querySelectorAll('[data-p]').forEach(x => x.classList.remove('on'));
            ch.classList.add('on');
            b2.querySelector('#sp').textContent = sysPrompt(a, cur);
          });
        });
      };
      box.querySelector('[data-act="vren"]').onclick = () => {
        sheet('改群名', `<input class="inp" id="r-t" value="${esc(cur.title)}"><button class="btn" id="r-s">保存</button>`, b2 => {
          b2.querySelector('#r-s').onclick = () => {
            const t = b2.querySelector('#r-t').value.trim() || '群聊';
            S.set(s => { s.sessions.find(v => v.id === cur.id).title = t; });
            closeSheet(); closeSheet(); render();
          };
        });
      };
      box.querySelector('[data-act="vdel"]').onclick = () => {
        S.set(s => { s.sessions = s.sessions.filter(v => v.id !== cur.id); s.ui.sessionId = null; });
        closeSheet(); nav.view = 'list'; render(); toast('删了');
      };
    });
  }

  function searchSheet() {
    const all = st().sessions.filter(x => x.wsId === ws().id);
    sheet('搜索对话', `<input class="inp" id="q" placeholder="输入关键字">
      <div id="qres" style="margin-top:10px"></div>`, box => {
      const out = box.querySelector('#qres');
      const draw = q => {
        const hit = all.filter(x => !q || (x.title + ' ' + lastText(x)).toLowerCase().includes(q.toLowerCase()));
        out.innerHTML = hit.length ? `<div class="card" style="margin:0">` + hit.map(x => `<div class="row tap" data-open="${x.id}">
          <div class="rtxt"><div class="rt">${esc(x.title)}</div><div class="rs">${esc(lastText(x))}</div></div></div>`).join('') + `</div>`
          : `<div class="note">没找到</div>`;
        out.querySelectorAll('[data-open]').forEach(r => r.onclick = () => {
          closeSheet(); S.set(s => { s.ui.sessionId = r.dataset.open; }); go('chat');
        });
      };
      draw('');
      box.querySelector('#q').oninput = e => draw(e.target.value);
    });
  }

  function exportSheet() {
    const json = S.export();
    sheet('导出备份', `<div class="note">全选复制下面这段，粘到别处存着。里面有 API Key，别外传。</div>
      <textarea class="inp" id="ex" style="min-height:220px;font-family:ui-monospace,Menlo,monospace;font-size:12px">${esc(json)}</textarea>
      <button class="btn" id="ex-copy">复制</button>
      <div class="field-l">或者粘一份备份进来恢复</div>
      <textarea class="inp" id="im" style="min-height:100px;font-size:12px"></textarea>
      <button class="btn ghost" id="im-go">用这段覆盖恢复</button>`, box => {
      box.querySelector('#ex-copy').onclick = () => {
        const ta = box.querySelector('#ex'); ta.select();
        try { document.execCommand('copy'); toast('复制了'); } catch (e) { toast('长按全选复制'); }
      };
      box.querySelector('#im-go').onclick = () => {
        const v = box.querySelector('#im').value.trim();
        if (!v) { toast('空的'); return; }
        try { S.import(v); closeSheet(); nav.view = 'list'; nav.settings = []; render(); toast('恢复了'); }
        catch (e) { toast('格式不对'); }
      };
    });
  }

  // 回车发送
  document.addEventListener('keydown', e => {
    if (e.target.id === 'in' && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });

  // 装到桌面提示：只在非独立模式显示，关过就不再烦

  // 旧数据迁移：一对一 -> 群聊
  S.set(x => {
    (x.sessions || []).forEach(c => {
      if (!Array.isArray(c.memberIds)) {
        c.memberIds = c.agentId ? [c.agentId] : (x.agents || []).map(a => a.id);
        delete c.agentId;
      }
      if (!c.mode) c.mode = c.memberIds.length > 1 ? 'all' : 'host';
    });
  });

  // 启动
  render();

  // 磁盘上已经存在的文件夹，回填到角色身上（换了浏览器/清了缓存也不丢）
  F.list('').then(r => {
    if (!r.ok) return;
    const dirs = (r.entries || []).filter(e => e.dir).map(e => e.name);
    let hit = false;
    S.set(x => x.agents.forEach(a => {
      if (!a.dir && dirs.indexOf(a.code) >= 0) { a.dir = a.code; hit = true; }
    }));
    if (hit && nav.settings[0] === 'files') render();
  });
})();
