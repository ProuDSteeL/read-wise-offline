import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';
import '../providers/connectivity_provider.dart';
import 'sync_service.dart';

final connectivitySyncProvider = Provider<void>((ref) {
  ref.listen<AsyncValue<bool>>(connectivityProvider, (prev, next) {
    final wasOffline = prev?.valueOrNull == false;
    final isNowOnline = next.valueOrNull == true;
    if (wasOffline && isNowOnline) {
      final user = ref.read(currentUserProvider);
      if (user != null) {
        SyncService.syncAll(user.id);
      }
    }
  });
});
