import SwiftUI
import WebKit

@main
struct CrewApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
                .ignoresSafeArea()
                .preferredColorScheme(.light)
        }
    }
}

struct RootView: UIViewControllerRepresentable {
    /// 桥必须被强引用，WKUserContentController 只弱引用 handler
    func makeCoordinator() -> Bridge { Bridge() }

    func makeUIViewController(context: Context) -> UIViewController {
        let vc = UIViewController()
        vc.view.backgroundColor = UIColor(red: 0.949, green: 0.949, blue: 0.969, alpha: 1)
        let wv = makeWebView(bridge: context.coordinator)
        wv.translatesAutoresizingMaskIntoConstraints = false
        vc.view.addSubview(wv)
        NSLayoutConstraint.activate([
            wv.leadingAnchor.constraint(equalTo: vc.view.leadingAnchor),
            wv.trailingAnchor.constraint(equalTo: vc.view.trailingAnchor),
            wv.topAnchor.constraint(equalTo: vc.view.topAnchor),
            wv.bottomAnchor.constraint(equalTo: vc.view.bottomAnchor)
        ])
        return vc
    }

    func updateUIViewController(_ uiViewController: UIViewController, context: Context) {}

    private func makeWebView(bridge: Bridge) -> WKWebView {
        let cfg = WKWebViewConfiguration()
        cfg.allowsInlineMediaPlayback = true
        cfg.mediaTypesRequiringUserActionForPlayback = []
        // file:// 页面默认不能发跨域请求，模型 API 会全部失败
        // 用 responds(to:) 兜底：这个私有属性将来被移除时不至于直接崩
        let sel = NSSelectorFromString("setAllowUniversalAccessFromFileURLs:")
        if cfg.responds(to: sel) { cfg.setValue(true, forKey: "allowUniversalAccessFromFileURLs") }
        let prefSel = NSSelectorFromString("setAllowFileAccessFromFileURLs:")
        if cfg.preferences.responds(to: prefSel) { cfg.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs") }
        cfg.websiteDataStore = .default()
        cfg.userContentController.add(bridge, name: "crew")
        cfg.userContentController.addUserScript(WKUserScript(
            source: Bridge.bootstrapJS,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true))

        let wv = WKWebView(frame: .zero, configuration: cfg)
        wv.isOpaque = false
        wv.backgroundColor = .clear
        wv.scrollView.backgroundColor = UIColor(red: 0.949, green: 0.949, blue: 0.969, alpha: 1)
        wv.scrollView.bounces = false
        wv.scrollView.contentInsetAdjustmentBehavior = .never
        wv.allowsBackForwardNavigationGestures = false
        if #available(iOS 16.4, *) {
            wv.isInspectable = true
        }

        if let url = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "www") {
            wv.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        } else {
            wv.loadHTMLString("<h1 style='font:16px -apple-system;padding:40px'>资源没打进包：找不到 www/index.html</h1>",
                              baseURL: nil)
        }
        return wv
    }
}
