/* 文件空间：每个角色一块真文件夹，落在 /var/minis/workspace/crew/agents/<代号>/ */
const F = (() => {
  const q = s => encodeURIComponent(s || '');

  /* ---- 原生桥（打包成 App 时走这条，不依赖服务端）---- */
  const H = (typeof window !== 'undefined' && window.webkit && window.webkit.messageHandlers) || {};
  const native = !!H.crew;

  let seq = 0;
  const waiting = {};
  window.__crewBridge = {
    resolve(id, res) {
      const f = waiting[id];
      if (f) { delete waiting[id]; f(res); }
    }
  };
  function call(cmd, args) {
    return new Promise(res => {
      const id = 'c' + (++seq);
      waiting[id] = res;
      try {
        H.crew.postMessage({ id: id, cmd: cmd, args: args || {} });
      } catch (e) {
        delete waiting[id];
        res({ ok: false, err: '原生调用失败：' + e.message });
      }
    });
  }

  async function j(url, opt) {
    try {
      const r = await fetch(url, opt);
      const t = await r.text();
      try { return JSON.parse(t); }
      catch (e) { return { ok: false, err: '返回不是 JSON（服务端可能没起来）' }; }
    } catch (e) {
      return { ok: false, err: '连不上服务：' + e.message };
    }
  }

  const post = (u, d) => j(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });

  const README = code => `# ${code} 的文件空间\n\n这块归 ${code} 自己用。\n\n- 他可以在这里新建、修改、删除文件（通过 fs_list / fs_read / fs_write）。\n- 你也能在「设置 → 文件空间」里直接看和改。\n- 只属于他一个人，别的角色看不到。\n`;

  return {
    list: p => native ? call('list', { path: p }) : j('/api/fs?path=' + q(p)),
    read: p => native ? call('read', { path: p }) : j('/api/file?path=' + q(p)),
    write: (p, c) => native ? call('write', { path: p, content: c }) : post('/api/fs/write', { path: p, content: c }),
    mkdir: p => native ? call('mkdir', { path: p }) : post('/api/fs/mkdir', { path: p }),
    rm: p => native ? call('rm', { path: p }) : post('/api/fs/rm', { path: p }),
    rename: (a, b) => post('/api/fs/rename', { from: a, to: b }),
    isNative: native,

    async init(dir, code) {
      const r = await this.mkdir(dir);
      if (r.ok) {
        const rd = await this.list(dir);
        if (rd.ok && !(rd.entries || []).some(e => e.name === 'README.md')) {
          await this.write(dir + '/README.md', README(code));
        }
      }
      return r;
    },

    // 给模型用的三个内置工具
    tools(dir) {
      return [
        {
          type: 'function',
          function: {
            name: 'fs_list',
            description: '列出你专属文件夹里的文件。path 留空是根目录。',
            parameters: { type: 'object', properties: { path: { type: 'string', description: '子目录，相对你的文件夹，比如 notes' } }, required: [] }
          }
        },
        {
          type: 'function',
          function: {
            name: 'fs_read',
            description: '读你专属文件夹里的一个文本文件。',
            parameters: { type: 'object', properties: { path: { type: 'string', description: '相对你的文件夹的文件路径' } }, required: ['path'] }
          }
        },
        {
          type: 'function',
          function: {
            name: 'fs_write',
            description: '在你专属文件夹里新建或覆盖一个文本文件。',
            parameters: { type: 'object', properties: { path: { type: 'string', description: '相对你的文件夹的文件路径，比如 notes/idea.md' }, content: { type: 'string', description: '文件全文' } }, required: ['path', 'content'] }
          }
        }
      ];
    },

    // 执行内置工具，返回字符串（喂回模型）
    async run(dir, name, args) {
      const a = typeof args === 'string' ? (() => { try { return JSON.parse(args); } catch (e) { return {}; } })() : (args || {});
      const sub = (a.path || '').replace(/^\/+/, '');
      const full = sub ? dir + '/' + sub : dir;
      if (name === 'fs_list') {
        const r = await this.list(full);
        if (!r.ok) return '失败：' + r.err;
        if (!r.entries.length) return '（空文件夹）';
        return r.entries.map(e => (e.dir ? '📁 ' : '📄 ') + e.name + (e.dir ? '' : ' (' + e.size + 'B)')).join('\n');
      }
      if (name === 'fs_read') {
        const r = await this.read(full);
        if (!r.ok) return '失败：' + r.err;
        return r.content.slice(0, 8000);
      }
      if (name === 'fs_write') {
        if (!a.path) return '失败：没给路径';
        const r = await this.write(full, a.content || '');
        return r.ok ? '写好了：' + r.path + '（' + r.size + ' 字节）' : '失败：' + r.err;
      }
      return '没有这个工具';
    }
  };
})();
