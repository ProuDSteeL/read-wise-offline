import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/push_service.dart';
import '../providers/auth_provider.dart';

class PushState {
  final bool isSupported;
  final bool isSubscribed;
  final bool loading;

  const PushState({
    this.isSupported = false,
    this.isSubscribed = false,
    this.loading = false,
  });

  PushState copyWith({bool? isSupported, bool? isSubscribed, bool? loading}) {
    return PushState(
      isSupported: isSupported ?? this.isSupported,
      isSubscribed: isSubscribed ?? this.isSubscribed,
      loading: loading ?? this.loading,
    );
  }
}

class PushNotifier extends StateNotifier<PushState> {
  final Ref ref;

  PushNotifier(this.ref) : super(const PushState()) {
    _init();
  }

  Future<void> _init() async {
    final supported = PushService.isSupported;
    if (!supported) {
      state = state.copyWith(isSupported: false);
      return;
    }
    final subscribed = await PushService.isSubscribed();
    state = state.copyWith(isSupported: true, isSubscribed: subscribed);
  }

  Future<bool> toggle() async {
    final user = ref.read(currentUserProvider);
    if (user == null) return false;

    state = state.copyWith(loading: true);
    try {
      if (state.isSubscribed) {
        final ok = await PushService.unsubscribe(user.id);
        if (ok) state = state.copyWith(isSubscribed: false);
        return ok;
      } else {
        final ok = await PushService.subscribe(user.id);
        if (ok) state = state.copyWith(isSubscribed: true);
        return ok;
      }
    } finally {
      state = state.copyWith(loading: false);
    }
  }
}

final pushProvider = StateNotifierProvider<PushNotifier, PushState>((ref) {
  return PushNotifier(ref);
});
