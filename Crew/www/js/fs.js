/* 文件空间：一块公共区（所有角色共用）+ 每个角色一块私有区
   公共：crew/files/        路径写 'note.md'
   私有：crew/agents/<代号>/ 路径写 '@阿快/note.md' */
const F = (() => {
  const q = s => encodeURIComponent(s || '');

  /* ---- 打包成 App 时走原生桥，不依赖服务端 ---- */
  const NR = (typeof window !== 'undefined') && !!window.__crewBridge;

  function toNativePath(p) {
    const s = String(p || '').replace(/^\/+/, '');
    return s;
  }
  function ncall(cmd, args) {
    return window.__crewBridge(cmd, args).then(r => {
      if (cmd === 'read') return r.content;
      if (cmd === 'list' || cmd === 'root') return r.entries || [];
      return r;
    });
  }

  /* 原生模式下：'' = 公共根；'@代号' = 某人私有根 */
  function isRootPath(p) {
    const s = String(p || '');
    return s === '' || /^@[^/]+$/.test(s);
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

  const README = code => `# ${code} 的私有区

这块只有 ${code} 自己能看能改，别的角色看不到。

团队共用的东西放「公共区」（所有角色都能读写）。

- 私有路径：@${code}/xxx.md
- 公共路径：xxx.md
`;

  async function wrap(cmd, path, extra) {
    try {
      const r = await window.__crewBridge(cmd, Object.assign({ path: path }, extra || {}));
      return r;
    } catch (e) {
      return { ok: false, err: e.message || '原生调用失败' };
    }
  }

  return {
    list: p => NR ? wrap('list', p) : j('/api/fs?path=' + q(p)),
    read: p => NR ? wrap('read', p) : j('/api/file?path=' + q(p)),
    write: (p, c) => NR ? wrap('write', p, { content: c }) : post('/api/fs/write', { path: p, content: c }),
    mkdir: p => NR ? wrap('mkdir', p) : post('/api/fs/mkdir', { path: p }),
    rm: p => NR ? wrap('rm', p) : post('/api/fs/rm', { path: p }),
    rename: (a, b) => NR ? { ok: false, err: 'App 里暂不支持重命名' } : post('/api/fs/rename', { from: a, to: b }),

    // 建好某角色的私有区（幂等）；公共区启动时服务端已经建好
    async init(code) {
      const dir = '@' + code;
      const r = await this.mkdir(dir);
      if (r.ok) {
        const rd = await this.list(dir);
        if (rd.ok && !(rd.entries || []).some(e => e.name === 'README.md')) {
          await this.write(dir + '/README.md', README(code));
        }
      }
      return r;
    },

    // 给模型用的三个内置工具：private=true 走自己的私有区
    tools(code) {
      const P = { type: 'boolean', description: 'true = 你自己的私有区（@' + code + '/）；false 或省略 = 团队公共区' };
      return [
        {
          type: 'function',
          function: {
            name: 'fs_list',
            description: '列文件。默认看团队公共区，private=true 看你自己的私有区。path 留空是根。',
            parameters: { type: 'object', properties: { path: { type: 'string', description: '子目录，比如 notes' }, private: P }, required: [] }
          }
        },
        {
          type: 'function',
          function: {
            name: 'fs_read',
            description: '读一个文本文件。默认读公共区，private=true 读你自己的私有区。',
            parameters: { type: 'object', properties: { path: { type: 'string', description: '文件路径，比如 notes/idea.md' }, private: P }, required: ['path'] }
          }
        },
        {
          type: 'function',
          function: {
            name: 'fs_write',
            description: '新建或覆盖一个文本文件。要给别人看就写公共区，只给自己留就 private=true。',
            parameters: { type: 'object', properties: { path: { type: 'string', description: '文件路径，比如 notes/idea.md' }, content: { type: 'string', description: '文件全文' }, private: P }, required: ['path', 'content'] }
          }
        }
      ];
    },

    full(code, a) {
      const sub = (a.path || '').replace(/^\/+/, '');
      if (a.private) return '@' + code + (sub ? '/' + sub : '');
      return sub;
    },

    // 执行内置工具，返回字符串（喂回模型）
    async run(code, name, args) {
      const a = typeof args === 'string' ? (() => { try { return JSON.parse(args); } catch (e) { return {}; } })() : (args || {});
      const full = this.full(code, a);
      if (name === 'fs_list') {
        const r = await this.list(full);
        if (!r.ok) return '失败：' + r.err;
        if (!(r.entries || []).length) return '（空文件夹）';
        return r.entries.map(e => (e.dir ? '📁 ' : '📄 ') + e.name + (e.dir ? '' : ' (' + e.size + 'B)')).join('\n');
      }
      if (name === 'fs_read') {
        const r = await this.read(full);
        if (!r.ok) return '失败：' + r.err;
        return (r.content || '').slice(0, 8000);
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
