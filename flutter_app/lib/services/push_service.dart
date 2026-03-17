import 'dart:js_interop';
import 'package:web/web.dart' as web;
import 'supabase_service.dart';

const _vapidPublicKey =
    'BP1UhTY_5L4tAct4cVAD2hoI6JKOE8jA0Hfc_9fi9Zd8FcFvRlgD4k8h5zyimyF-mRBA2C8jNPPJFcBdg4Pvrdg';

class PushService {
  static bool get isSupported {
    try {
      return web.window.navigator.serviceWorker != null;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> isSubscribed() async {
    if (!isSupported) return false;
    try {
      final reg = await web.window.navigator.serviceWorker.ready.toDart;
      final sub = await reg.pushManager.getSubscription().toDart;
      return sub != null;
    } catch (_) {
      return false;
    }
  }

  static Future<String> requestPermission() async {
    final result = await web.Notification.requestPermission().toDart;
    return result.toDart;
  }

  static Future<bool> subscribe(String userId) async {
    if (!isSupported) return false;

    final permission = await requestPermission();
    if (permission != 'granted') return false;

    try {
      final reg = await web.window.navigator.serviceWorker.ready.toDart;
      final applicationServerKey = _urlBase64ToUint8Array(_vapidPublicKey);

      final options = web.PushSubscriptionOptionsInit(
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.toJS,
      );
      final sub = await reg.pushManager.subscribe(options).toDart;
      final json = sub.toJSON();

      final endpoint = sub.endpoint;
      final p256dh = (json as JSObject).getProperty('keys'.toJS) != null
          ? _getKey(json, 'p256dh')
          : '';
      final auth = (json as JSObject).getProperty('keys'.toJS) != null
          ? _getKey(json, 'auth')
          : '';

      await SupabaseService.client.from('push_subscriptions').insert({
        'user_id': userId,
        'endpoint': endpoint,
        'p256dh': p256dh,
        'auth': auth,
      });

      return true;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> unsubscribe(String userId) async {
    if (!isSupported) return false;
    try {
      final reg = await web.window.navigator.serviceWorker.ready.toDart;
      final sub = await reg.pushManager.getSubscription().toDart;
      if (sub != null) {
        final endpoint = sub.endpoint;
        await sub.unsubscribe().toDart;
        await SupabaseService.client
            .from('push_subscriptions')
            .delete()
            .eq('user_id', userId)
            .eq('endpoint', endpoint);
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  static String _getKey(JSAny json, String key) {
    try {
      final keys = (json as JSObject).getProperty('keys'.toJS) as JSObject;
      final value = keys.getProperty(key.toJS);
      return (value as JSString?)?.toDart ?? '';
    } catch (_) {
      return '';
    }
  }

  static List<int> _urlBase64ToUint8Array(String base64String) {
    final padding = '=' * ((4 - (base64String.length % 4)) % 4);
    final base64 =
        (base64String + padding).replaceAll('-', '+').replaceAll('_', '/');

    // Decode base64 using window.atob
    final rawData = web.window.atob(base64);
    final outputArray = <int>[];
    for (int i = 0; i < rawData.length; i++) {
      outputArray.add(rawData.codeUnitAt(i));
    }
    return outputArray;
  }
}
