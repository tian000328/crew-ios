# crew iOS

把 crew 打包成真 App（.ipa），用 GitHub Actions 云端 macOS 编译。

## 结构

```
project.yml              XcodeGen 工程定义（仓库里不放 .xcodeproj）
Crew/Info.plist          App 配置（全屏、文件共享开启）
Crew/App.swift           SwiftUI + WKWebView 外壳
Crew/Bridge.swift        JS ↔ 原生桥（文件读写，沙盒 Documents/agents）
Crew/www/                前端（index.html + app.css + js/）
Crew/Assets.xcassets/    图标 + 启动底色
.github/workflows/build.yml   云编译 → Release
```

## 文件空间怎么落地

- 根目录：`Documents/agents/<角色代号>/`
- JS 调 `window.webkit.messageHandlers.crew.postMessage({id, cmd, args})`
- 原生回 `window.__crewBridge.resolve(id, payload)`
- `cmd`: `list` / `read` / `write` / `mkdir` / `rm`
- `args.path` 第一段是角色目录名，如 `阿快/笔记.md`
- 越界（`../`）返回 `{"ok":false,"err":"路径越界"}`
- `Info.plist` 开了 `UIFileSharingEnabled` + `LSSupportsOpeningDocumentsInPlace`，
  所以「文件」App → 我的 iPhone → crew 里能直接看到、直接改

## 出包流程

1. push 到 GitHub 的 `main`
2. Actions 跑 `build.yml`：`brew install xcodegen` → `xcodegen generate` → 无签名 archive → 打 Payload → zip 成 `.ipa`
3. 产物在 Release 的 `latest` 里，直链：

```
https://github.com/<user>/<repo>/releases/latest/download/crew-unsigned.ipa
```

4. iPhone 上用 Safari 下这个 ipa → 全能签导入 → 用自己的证书签名 → 安装

## 注意

- 产物是**未签名**的，必须自己签名才能装。iOS 18 不支持 TrollStore 免签。
- 免费 Apple ID 签名 7 天过期；企业/共享证书看全能签那边。
- 改完前端（`Crew/www/`）要重新 push 才会出新包。
