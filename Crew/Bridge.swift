import Foundation
import WebKit

/// JS <-> 原生 的桥。前端调用：
///   window.webkit.messageHandlers.crew.postMessage({id, cmd, args})
/// 原生回调：
///   window.__crewBridge.resolve(id, {ok, data|err})
final class Bridge: NSObject, WKScriptMessageHandler {


    func userContentController(_ userContentController: WKUserContentController,
                               didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any],
              let id = body["id"] as? String,
              let cmd = body["cmd"] as? String else { return }
        let args = body["args"] as? [String: Any] ?? [:]
        let webView = message.webView

        DispatchQueue.global(qos: .userInitiated).async {
            let result = FSOps.run(cmd: cmd, args: args)
            let payload = FSOps.json(result)
            DispatchQueue.main.async {
                let js = "window.__crewBridge && window.__crewBridge.resolve(\(FSOps.quote(id)), \(payload));"
                webView?.evaluateJavaScript(js, completionHandler: nil)
            }
        }
    }
}

enum FSOps {

    /// 所有角色文件夹的根：Documents/agents
    static var root: URL {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        return docs.appendingPathComponent("agents", isDirectory: true)
    }

    static func quote(_ s: String) -> String {
        let data = try? JSONSerialization.data(withJSONObject: [s], options: [])
        guard let data = data, let str = String(data: data, encoding: .utf8) else { return "\"\"" }
        // ["x"] -> "x"
        return String(str.dropFirst().dropLast())
    }

    static func json(_ obj: [String: Any]) -> String {
        guard let data = try? JSONSerialization.data(withJSONObject: obj, options: []),
              let s = String(data: data, encoding: .utf8) else { return "{\"ok\":false,\"err\":\"序列化失败\"}" }
        return s
    }

    /// 把 agent + 相对路径解析成绝对路径，越界返回 nil
    static func resolve(agent: String, path: String) -> URL? {
        let cleanAgent = agent.replacingOccurrences(of: "/", with: "_")
        guard !cleanAgent.isEmpty, cleanAgent != ".", cleanAgent != ".." else { return nil }
        let base = root.appendingPathComponent(cleanAgent, isDirectory: true)
        let target = path.isEmpty ? base : base.appendingPathComponent(path)
        let canonical = target.standardizedFileURL.path
        let basePath = base.standardizedFileURL.path
        guard canonical == basePath || canonical.hasPrefix(basePath + "/") else { return nil }
        return target.standardizedFileURL
    }

    static func run(cmd: String, args: [String: Any]) -> [String: Any] {
        let fm = FileManager.default
        do {
            try fm.createDirectory(at: root, withIntermediateDirectories: true)
        } catch {
            return ["ok": false, "err": "建不了根目录：\(error.localizedDescription)"]
        }

        // 前端只传 path（形如 "阿快/笔记.md"），第一段是角色目录名
        let rawPath = (args["path"] as? String) ?? ""
        var segs = rawPath.split(separator: "/", omittingEmptySubsequences: true).map(String.init)
        let agent = segs.isEmpty ? "" : segs.removeFirst()
        let sub = segs.joined(separator: "/")

        switch cmd {

        case "root":
            return ["ok": true, "data": root.path]

        case "agents":
            let items = (try? fm.contentsOfDirectory(at: root,
                                                     includingPropertiesForKeys: [.isDirectoryKey],
                                                     options: [.skipsHiddenFiles])) ?? []
            let names = items.filter {
                (try? $0.resourceValues(forKeys: [.isDirectoryKey]).isDirectory) == true
            }.map { $0.lastPathComponent }.sorted()
            return ["ok": true, "data": names]

        case "mkdir":
            guard let dir = resolve(agent: agent, path: "") else {
                return ["ok": false, "err": "路径越界"]
            }
            try fm.createDirectory(at: dir, withIntermediateDirectories: true)
            let readme = dir.appendingPathComponent("README.md")
            if !fm.fileExists(atPath: readme.path) {
                let text = """
                # \(agent) 的工作目录

                这是「\(agent)」自己的文件夹，它可以在里面创建、修改、删除文件。
                你在「文件」App → 我的 iPhone → crew 里也能直接看到和编辑。

                路径：Documents/agents/\(agent)/
                """
                try text.write(to: readme, atomically: true, encoding: .utf8)
            }
            return ["ok": true, "path": agent + "/"]

        case "list":
            if agent.isEmpty {
                let items = (try? fm.contentsOfDirectory(at: root,
                                                         includingPropertiesForKeys: [.isDirectoryKey],
                                                         options: [.skipsHiddenFiles])) ?? []
                var roots: [[String: Any]] = []
                for it in items {
                    let isDir = (try? it.resourceValues(forKeys: [.isDirectoryKey]).isDirectory) ?? false
                    if isDir {
                        roots.append(["name": it.lastPathComponent, "dir": true, "size": 0,
                                      "path": it.lastPathComponent])
                    }
                }
                roots.sort { (($0["name"] as? String) ?? "") < (($1["name"] as? String) ?? "") }
                return ["ok": true, "path": "", "entries": roots]
            }
            let rel = sub
            guard let dir = resolve(agent: agent, path: rel) else {
                return ["ok": false, "err": "路径越界"]
            }
            guard fm.fileExists(atPath: dir.path) else {
                return ["ok": false, "err": "目录不存在"]
            }
            let items = (try? fm.contentsOfDirectory(at: dir,
                                                    includingPropertiesForKeys: [.isDirectoryKey, .fileSizeKey],
                                                    options: [.skipsHiddenFiles])) ?? []
            var out: [[String: Any]] = []
            for it in items {
                let vals = try? it.resourceValues(forKeys: [.isDirectoryKey, .fileSizeKey])
                let isDir = vals?.isDirectory ?? false
                out.append([
                    "name": it.lastPathComponent,
                    "dir": isDir,
                    "size": isDir ? 0 : (vals?.fileSize ?? 0),
                    "path": rel.isEmpty ? it.lastPathComponent : rel + "/" + it.lastPathComponent
                ])
            }
            out.sort { a, b in
                let ad = (a["dir"] as? Bool) ?? false, bd = (b["dir"] as? Bool) ?? false
                if ad != bd { return ad }
                return ((a["name"] as? String) ?? "") < ((b["name"] as? String) ?? "")
            }
            return ["ok": true, "path": rel, "entries": out]

        case "read":
            let rel = sub
            guard let url = resolve(agent: agent, path: rel) else {
                return ["ok": false, "err": "路径越界"]
            }
            let data = try Data(contentsOf: url)
            if data.count > 512 * 1024 {
                return ["ok": false, "err": "文件太大（超过 512KB），暂不支持预览"]
            }
            let text = String(data: data, encoding: .utf8) ?? "(二进制文件，无法以文本显示)"
            return ["ok": true, "path": rel, "content": text, "size": text.utf8.count]

        case "write":
            let rel = sub
            guard !rel.isEmpty, let url = resolve(agent: agent, path: rel) else {
                return ["ok": false, "err": "路径越界"]
            }
            try fm.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
            let text = (args["content"] as? String) ?? ""
            try text.write(to: url, atomically: true, encoding: .utf8)
            let size = (try? url.resourceValues(forKeys: [.fileSizeKey]).fileSize) ?? 0
            return ["ok": true, "path": rel, "size": size]

        case "rm":
            let rel = sub
            guard !rel.isEmpty, let url = resolve(agent: agent, path: rel) else {
                return ["ok": false, "err": "路径越界"]
            }
            try fm.removeItem(at: url)
            return ["ok": true]

        default:
            return ["ok": false, "err": "未知命令：\(cmd)"]
        }
    }
}
