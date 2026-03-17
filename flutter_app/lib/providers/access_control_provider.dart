import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/constants.dart';
import '../services/supabase_service.dart';
import 'auth_provider.dart';
import 'subscription_provider.dart';

final freeReadsUsedProvider = FutureProvider<int>((ref) async {
  final user = ref.watch(currentUserProvider);
  final isPro = ref.watch(isProProvider);
  if (user == null || isPro) return 0;

  final data = await SupabaseService.client
      .from('user_progress')
      .select('book_id')
      .eq('user_id', user.id);
  return (data as List).length;
});

final accessControlProvider = Provider<AccessControl>((ref) {
  final isPro = ref.watch(isProProvider);
  final freeReadsUsed = ref.watch(freeReadsUsedProvider).valueOrNull ?? 0;

  return AccessControl(
    isPro: isPro,
    freeReadsUsed: freeReadsUsed,
  );
});

class AccessControl {
  final bool isPro;
  final int freeReadsUsed;

  const AccessControl({
    required this.isPro,
    required this.freeReadsUsed,
  });

  bool canReadFull(String bookId, List<String>? existingProgressBookIds) {
    if (isPro) return true;
    if (existingProgressBookIds?.contains(bookId) ?? false) return true;
    return freeReadsUsed < freeReadsLimit;
  }

  bool get canListenAudio => isPro;
  bool get canDownload => isPro;

  bool canHighlight(int currentCount) {
    if (isPro) return true;
    return currentCount < freeHighlightsLimit;
  }
}
