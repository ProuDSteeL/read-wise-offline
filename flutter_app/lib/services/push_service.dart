import 'dart:js_interop';
import 'dart:js_interop_unsafe';
import 'dart:typed_data';
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
      final keyBytes = _urlBase64ToUint8Array(_vapidPublicKey);
      final jsKey = keyBytes.toJS;

      final options = web.PushSubscriptionOptionsInit(
        userVisibleOnly: true,
        applicationServerKey: jsKey,
      );
      final sub = await reg.pushManager.subscribe(options).toDart;
      final json = sub.toJSON();

      final endpoint = sub.endpoint;
      final p256dh = _getKey(json, 'p256dh');
      final auth = _getKey(json, 'auth');

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
      final jsObj = json as JSObject;
      final keys = jsObj['keys'] as JSObject?;
      if (keys == null) return '';
      final value = keys[key];
      return (value as JSString?)?.toDart ?? '';
    } catch (_) {
      return '';
    }
  }

  static Uint8List _urlBase64ToUint8Array(String base64String) {
    final padding = '=' * ((4 - (base64String.length % 4)) % 4);
    final base64 =
        (base64String + padding).replaceAll('-', '+').replaceAll('_', '/');

    final rawData = web.window.atob(base64);
    final outputArray = Uint8List(rawData.length);
    for (int i = 0; i < rawData.length; i++) {
      outputArray[i] = rawData.codeUnitAt(i);
    }
    return outputArray;
  }
}
