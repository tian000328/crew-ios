import Foundation
import WebKit

/// 前端 <-> 原生 的文件桥。
/// 路径约定（与网页版一致）：
///   "@阿快/笔记.md"  -> Documents/agents/阿快/笔记.md   （私有）
///   "资料/x.pdf"     -> Documents/files/x.pdf           （公共）
final class Bridge: NSObject, WKScriptMessageHandler {

    /// 页内注入：window.__crewBridge(cmd, args) -> Promise
    static let bootstrapJS = """
    (function () {
      var seq = 0, waiting = {};
      window.webkit.messageHandlers.crew.postMessage({ type: 'ready' });
      window.__crewNative = true;
      window.__crewBridge = function (cmd, args) {
        return new Promise(function (ok, no) {
          var id = 'c' + (++seq);
          waiting[id] = function (payload) {
            if (payload && payload.ok) ok(payload);
            else no(new Error((payload && payload.err) || '原生调用失败'));
          };
          try {
            window.webkit.messageHandlers.crew.postMessage({ id: id, cmd: cmd, args: args || {} });
          } catch (e) { delete waiting[id]; no(e); }
        });
      };
      window.__crewReply = function (id, payload) {
        var fn = waiting[id];
        if (fn) { delete waiting[id]; fn(payload); }
      };
    })();
    """

    private let fm = FileManager.default

    private var docs: URL {
        fm.urls(for: .documentDirectory, in: .userDomainMask)[0]
    }
    private var pubRoot: URL { docs.appendingPathComponent("files", isDirectory: true) }
    private var privRoot: URL { docs.appendingPathComponent("agents", isDirectory: true) }

    // MARK: - 消息入口

    func userContentController(_ uc: WKUserContentController,
                               didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any] else { return }
        if (body["type"] as? String) == "ready" { return }

        let id = body["id"] as? String ?? ""
        let cmd = body["cmd"] as? String ?? ""
        let args = body["args"] as? [String: Any] ?? [:]

        DispatchQueue.global(qos: .userInitiated).async {
            let payload = Bridge.run(cmd: cmd, args: args,
                                     pub: self.pubRoot, priv: self.privRoot, fm: self.fm)
            DispatchQueue.main.async {
                let js = "window.__crewReply(\(Bridge.jsStr(id)), \(Bridge.jsJSON(payload)));"
                message.webView?.evaluateJavaScript(js, completionHandler: nil)
            }
        }
    }

    // MARK: - 路径解析

    /// 返回 (根目录, 相对路径)；根目录是公共区或某个角色的私有区
    static func split(_ raw: String, pub: URL, priv: URL) -> (root: URL, rel: String)? {
        var s = raw.trimmingCharacters(in: CharacterSet(charactersIn: "/ "))
        s = s.replacingOccurrences(of: "\\", with: "/")
        if s.hasPrefix("@") {
            let parts = s.split(separator: "/", omittingEmptySubsequences: true).map(String.init)
            guard let head = parts.first else { return nil }
            let code = String(head.dropFirst())
            guard isSafeName(code) else { return nil }
            let rest = parts.dropFirst().joined(separator: "/")
            guard isSafeRel(rest) else { return nil }
            return (priv.appendingPathComponent(code, isDirectory: true), rest)
        }
        guard isSafeRel(s) else { return nil }
        return (pub, s)
    }

    static func isSafeName(_ n: String) -> Bool {
        if n.isEmpty || n == "." || n == ".." { return false }
        if n.contains("/") || n.contains("\\") { return false }
        return true
    }

    static func isSafeRel(_ p: String) -> Bool {
        if p.isEmpty { return true }
        for part in p.split(separator: "/", omittingEmptySubsequences: false) {
            if part == ".." { return false }
        }
        return true
    }

    static func url(_ root: URL, _ rel: String) -> URL {
        rel.isEmpty ? root : root.appendingPathComponent(rel)
    }

    // MARK: - 各命令

    static func run(cmd: String, args: [String: Any],
                    pub: URL, priv: URL, fm: FileManager) -> [String: Any] {
        let raw = args["path"] as? String ?? ""

        if cmd == "root" || cmd == "agents" {
            // 公共区顶层 + 已存在的私有目录
            try? fm.createDirectory(at: pub, withIntermediateDirectories: true)
            var entries: [[String: Any]] = []
            if let kids = try? fm.contentsOfDirectory(at: pub, includingPropertiesForKeys: [.isDirectoryKey, .fileSizeKey]) {
                for u in kids {
                    let d = (try? u.resourceValues(forKeys: [.isDirectoryKey]).isDirectory) ?? false
                    let sz = (try? u.resourceValues(forKeys: [.fileSizeKey]).fileSize) ?? 0
                    entries.append(["name": u.lastPathComponent, "dir": d, "size": sz, "path": u.lastPathComponent])
                }
            }
            entries.sort { ($0["dir"] as? Bool ?? false, $0["name"] as? String ?? "") > ($1["dir"] as? Bool ?? false, $1["name"] as? String ?? "") }
            return ["ok": true, "path": "", "entries": entries, "root": pub.path]
        }

        guard let (root, rel) = split(raw, pub: pub, priv: priv) else {
            return ["ok": false, "err": "路径不合法"]
        }
        let target = url(root, rel)
        // 二次校验：解析后必须仍在根目录内
        let realRoot = root.resolvingSymlinksInPath().standardizedFileURL.path
        let realTarget = target.resolvingSymlinksInPath().standardizedFileURL.path
        if !(realTarget == realRoot || realTarget.hasPrefix(realRoot + "/")) {
            return ["ok": false, "err": "路径越界"]
        }

        do {
            switch cmd {
            case "mkdir":
                try fm.createDirectory(at: target, withIntermediateDirectories: true)
                return ["ok": true, "path": raw, "size": 0]

            case "list":
                if !fm.fileExists(atPath: target.path) {
                    try? fm.createDirectory(at: target, withIntermediateDirectories: true)
                }
                let kids = try fm.contentsOfDirectory(at: target,
                                                      includingPropertiesForKeys: [.isDirectoryKey, .fileSizeKey])
                var out: [[String: Any]] = []
                for u in kids {
                    let d = (try? u.resourceValues(forKeys: [.isDirectoryKey]).isDirectory) ?? false
                    let sz = (try? u.resourceValues(forKeys: [.fileSizeKey]).fileSize) ?? 0
                    out.append(["name": u.lastPathComponent, "dir": d, "size": sz,
                                "path": rel.isEmpty ? u.lastPathComponent : rel + "/" + u.lastPathComponent])
                }
                out.sort { a, b in
                    let ad = a["dir"] as? Bool ?? false, bd = b["dir"] as? Bool ?? false
                    if ad != bd { return ad }
                    return (a["name"] as? String ?? "") < (b["name"] as? String ?? "")
                }
                return ["ok": true, "path": rel, "entries": out]

            case "read":
                let data = try Data(contentsOf: target)
                if data.count > 2_000_000 { return ["ok": false, "err": "文件太大（超过 2MB）"] }
                let text = String(data: data, encoding: .utf8)
                    ?? String(data: data, encoding: .isoLatin1) ?? ""
                return ["ok": true, "path": rel, "content": text, "size": data.count]

            case "write":
                let text = args["content"] as? String ?? ""
                try fm.createDirectory(at: target.deletingLastPathComponent(),
                                       withIntermediateDirectories: true)
                try text.write(to: target, atomically: true, encoding: .utf8)
                let n = (try? Data(contentsOf: target).count) ?? 0
                return ["ok": true, "path": rel, "size": n]

            case "rm":
                if fm.fileExists(atPath: target.path) {
                    try fm.removeItem(at: target)
                }
                return ["ok": true]

            default:
                return ["ok": false, "err": "未知命令：" + cmd]
            }
        } catch {
            return ["ok": false, "err": error.localizedDescription]
        }
    }

    // MARK: - JSON 工具

    static func jsStr(_ s: String) -> String {
        let d = (try? JSONSerialization.data(withJSONObject: [s], options: [])) ?? Data("[\"\"]".utf8)
        let arr = String(data: d, encoding: .utf8) ?? "[\"\"]"
        return String(arr.dropFirst().dropLast())
    }

    static func jsJSON(_ obj: [String: Any]) -> String {
        guard let d = try? JSONSerialization.data(withJSONObject: obj, options: []),
              let s = String(data: d, encoding: .utf8) else { return "{\"ok\":false,\"err\":\"序列化失败\"}" }
        return s
    }
}
