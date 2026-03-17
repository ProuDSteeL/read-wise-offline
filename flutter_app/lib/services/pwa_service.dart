import 'dart:js_interop';
import 'package:web/web.dart' as web;

@JS('_pwaCanInstall')
external JSBoolean _pwaCanInstall();

@JS('_pwaInstallPrompt')
external JSBoolean _pwaInstallPrompt();

/// PWA install prompt service using JS interop.
/// The install prompt capture is done in index.html via beforeinstallprompt.
class PwaService {
  /// Whether an install prompt is available
  static bool get canInstall {
    try {
      return _pwaCanInstall().toDart;
    } catch (_) {
      return false;
    }
  }

  /// Show the native install prompt
  static bool promptInstall() {
    try {
      return _pwaInstallPrompt().toDart;
    } catch (_) {
      return false;
    }
  }

  /// Check if the app is running in standalone mode (already installed)
  static bool get isInstalled {
    try {
      final mq = web.window.matchMedia('(display-mode: standalone)');
      return mq.matches;
    } catch (_) {
      return false;
    }
  }
}
