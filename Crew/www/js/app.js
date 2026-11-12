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
      body = `<div class="empty">
        <div class="big">${esc(w.icon || '💬')}</div>
        <b>${esc(w.name)} 还没有群</b>
        <p>点右下角开一个。开出来就是一个群，${s.agents.length} 个角色都在里面，你说一句他们都看得到。</p>
        <div class="chips" style="justify-content:center;flex-wrap:wrap;overflow:visible;margin-top:6px">
          ${s.agents.map(a => `<button class="chip" data-act="talkto" data-id="${a.id}">${esc(a.emoji || '🤖')} 找${esc(a.code)}</button>`).join('')}
        </div>
      </div>`;
    } else {
      for (const g of groups) {
        const sub = list.filter(x => timeGroup(x.updatedAt) === g);
        if (!sub.length) continue;
        body += `<div class="sgrp">${g}</div>`;
        body += `<div class="wrap"><div class="card">` + sub.map(x => {
          const ms = members(x);
          const ico = ms.length > 1 ? '👥' : (ms[0] ? esc(ms[0].emoji || '🤖') : ICON.chat);
          return `<div class="sess" data-act="open" data-id="${x.id}">
            <span class="sico">${ico}</span>
            <div class="stx">
              <div class="st">${esc(x.title || '未命名')}</div>
              <div class="ss">${esc(lastText(x))}</div>
            </div>
            <div class="stm">${fmtTime(x.updatedAt)}</div>
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
    if (ag.dir) {
      const ls = await F.list(ag.dir);
      const names = ls.ok ? (ls.entries || []).map(e => (e.dir ? '📁' : '📄') + e.name).slice(0, 60).join('、') : '';
      sys += `\n\n【你的文件空间】${ag.dir}/ 是你专属的文件夹。${names ? '现在有：' + names : '现在是空的'}。\n你可以用 fs_list / fs_read / fs_write 三个工具读写里面的文件。写东西就写进去，不要只在回答里贴。`;
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
    const fsTools = ag.dir ? F.tools(ag.dir) : [];
    const tools = (plugs.length || fsTools.length) ? [...plugs.map(T.schema), ...fsTools] : undefined;

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
            if (ag.dir && fname.indexOf('fs_') === 0) res = await F.run(ag.dir, fname, args);
            else {
              const out = plug ? await T.run(plug, args) : '没这个工具';
              res = typeof out === 'string' ? out : JSON.stringify(out);
            }
          } catch (e) { res = '参数解析失败：' + e.message; }
          const tname = ag.dir && fname.indexOf('fs_') === 0
            ? ({ fs_list: '看文件', fs_read: '读文件', fs_write: '写文件' }[fname] || fname)
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
    const ids = s.agents.map(a => a.id);
    if (!ids.length) { toast('先去「设置 → 灵魂」建一个角色'); return; }
    const id = S.uid('s_');
    S.set(x => {
      x.sessions.unshift({ id, wsId: ws().id, memberIds: ids.slice(), mode: 'all', title: '新对话', msgs: [], updatedAt: Date.now() });
      x.ui.sessionId = id;
    });
    go('chat');
  }

  // ============ 主渲染 ============
  function render() {
    const el = $('#screen');
    el.innerHTML = nav.view === 'list' ? screenList()
      : nav.view === 'chat' ? screenChat()
        : screenSettings();
    document.documentElement.style.setProperty('--fs', (st().ui.fontSize || 15) + 'px');
    drawDrawer();
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
      case 'files': return nav.settings[1] ? pageBrowser() : pageFiles();
      case 'tools': return pageTools();
      case 'threads': return pageThreads();
      case 'skills': return pageSkills();
      case 'agents': return p[1] ? pageAgentEdit(p[1]) : pageAgents();
      case 'memory': return p[1] ? pageMemoryEdit(p[1]) : pageMemory();
      case 'mcp': return pageMcp();
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
            ${row({ icon: ICON.folder, tint: 'green', title: '文件空间', sub: s.agents.filter(a => a.dir).length + ' 块已建 / ' + s.agents.length + ' 个角色', act: 'nav', id: 'files', chev: true })}
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
    return `${head('可用工具')}
      <div class="scroll">
        <div class="sec">
          <div class="card">
            ${(s.plugins || []).map(p => row({
              icon: p.icon ? '' : ICON.tool, tint: 'orange',
              title: (p.icon || '') + ' ' + p.name, sub: p.desc || p.method + ' ' + p.url,
              act: 'tedit', id: p.id, chev: true
            })).join('') || `<div class="row"><div class="rtxt"><div class="rs">还没有工具</div></div></div>`}
          </div>
          <div class="sec-f">工具就是一个 JSON：地址里用 {参数} 占位，模型自己填参数，你这个手机真去请求。</div>
        </div>
        <div class="card" style="margin-top:12px"><div class="row tap" data-act="tnew"><div class="rtxt"><div class="rt" style="color:#007aff">+ 添加工具</div></div></div></div>
      </div>`;
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
      <button class="btn" id="a-save">保存</button>
      ${id ? `<button class="btn danger" id="a-del">删除角色</button>` : ''}
    `, box => {
      box.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => {
        const k = b.dataset.tool;
        if (picked.has(k)) { picked.delete(k); b.classList.remove('on'); }
        else { picked.add(k); b.classList.add('on'); }
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
          tools: [...picked]
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
    const ready = s.agents.filter(a => a.dir).length;
    return `${head('文件空间')}
      <div class="scroll">
        <div class="sec">
          <div class="card">
            ${s.agents.map(a => row({
              title: (a.emoji || '🤖') + ' ' + a.code,
              sub: a.dir ? (a.dir + '/') : '还没建，点一下创建',
              act: a.dir ? 'fopen' : 'fcreate', id: a.id, chev: true
            })).join('') || `<div class="row"><div class="rtxt"><div class="rs">先加个角色</div></div></div>`}
          </div>
          <div class="sec-f">每个角色一块真文件夹，位置在 /var/minis/workspace/crew/agents/。建好之后他自己能往里写，你在终端里也能直接改，不是网页里的假存储。${ready ? `已建 ${ready} 块。` : ''}</div>
        </div>
      </div>`;
  }

  function pageBrowser() {
    const v = FSVIEW;
    const parts = v.path ? v.path.split('/') : [];
    const crumbs = [`<span class="crumb" data-act="fcroot">${esc(v.dir)}</span>`]
      .concat(parts.map((p, i) => `<span class="csep">/</span><span class="crumb" data-act="fcgo" data-id="${esc(parts.slice(0, i + 1).join('/'))}">${esc(p)}</span>`));
    const rows = v.entries.map(e => `<div class="row tap" data-act="${e.dir ? 'fenter' : 'fedit'}" data-id="${esc(e.name)}">
        <span class="fico">${e.dir ? '📁' : '📄'}</span>
        <div class="rtxt"><div class="rt">${esc(e.name)}</div>
          <div class="rs">${e.dir ? '文件夹' : (e.size || 0) + ' 字节'}</div></div>
        <button class="ic plain" data-act="fdel" data-id="${esc(e.name)}">${ICON.trash}</button>
      </div>`).join('');
    return `${head(v.dir + (v.path ? '/' + v.path : ''), `<button class="pill" data-act="fnew">新建</button>`)}
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
    const r = await F.read(FSVIEW.dir + '/' + p);
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
    return `${head('MCP 集成')}
      <div class="scroll">
        <div class="sec">
          <div class="card">
            ${row({ icon: ICON.mcp, tint: 'purple', title: '已连接的服务', sub: '0 个', right: '未开放' })}
          </div>
          <div class="sec-f">这一版还不接 MCP 服务器。现在要加外部能力，用「可用工具」里的 JSON 插件就行——一样是真发请求，区别只是插件是单个接口，MCP 是一整套。</div>
        </div>
      </div>`;
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
      case 'fcreate': {
        const a = agent(id);
        if (!a) return;
        const dir = dirOf(a);
        F.init(dir, a.code).then(r => {
          if (!r.ok) { toast('建不了：' + (r.err || '服务没起')); return; }
          S.set(x => { const t = x.agents.find(v => v.id === id); if (t) t.dir = dir; });
          toast('建好了 agents/' + dir + '/');
          render();
        });
        break;
      }
      case 'fopen': { const a = agent(id); if (a && a.dir) goFiles(a.dir, ''); break; }
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
  (function installTip() {
    const isApp = !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.crew);
    if (isApp) return;
    const standalone = window.navigator.standalone === true ||
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
    if (standalone) return;
    if (localStorage.getItem('crew.installTip') === 'off') return;
    const ua = navigator.userAgent;
    if (!/iPhone|iPad|iPod/.test(ua)) return;
    const bar = document.createElement('div');
    bar.id = 'install';
    bar.innerHTML = '<span class="ii"><img src="icon-180.png" alt=""></span>' +
      '<span class="it">装到桌面：点底部的 <b>分享</b> → <b>添加到主屏幕</b>，打开就是全屏 App</span>' +
      '<button id="instx">知道了</button>';
    const host = document.getElementById('app');
    host.insertBefore(bar, host.firstChild);
    bar.querySelector('#instx').onclick = () => {
      localStorage.setItem('crew.installTip', 'off');
      bar.remove();
    };
  })();

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
