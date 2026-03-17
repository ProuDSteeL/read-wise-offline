import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user_progress.dart';
import '../models/user_shelf.dart';
import '../models/user_highlight.dart';
import '../models/enums.dart';
import '../services/progress_service.dart';
import '../services/shelf_service.dart';
import '../services/highlight_service.dart';
import '../offline/offline_storage_service.dart';
import 'auth_provider.dart';
import 'connectivity_provider.dart';

final userProgressProvider = FutureProvider<List<UserProgress>>((ref) {
  final user = ref.watch(currentUserProvider);
  if (user == null) return [];
  return ProgressService.getUserProgress(user.id);
});

final bookProgressProvider =
    FutureProvider.family<UserProgress?, String>((ref, bookId) {
  final user = ref.watch(currentUserProvider);
  final isOnline = ref.watch(isOnlineProvider);
  if (user == null) return null;
  if (!isOnline) {
    return OfflineStorageService.getProgress(bookId);
  }
  return ProgressService.getBookProgress(user.id, bookId);
});

final userShelvesProvider = FutureProvider<List<UserShelf>>((ref) {
  final user = ref.watch(currentUserProvider);
  if (user == null) return [];
  return ShelfService.getUserShelves(user.id);
});

final shelfCountsProvider = FutureProvider<Map<ShelfType, int>>((ref) {
  final user = ref.watch(currentUserProvider);
  if (user == null) {
    return {
      ShelfType.favorite: 0,
      ShelfType.read: 0,
      ShelfType.wantToRead: 0,
    };
  }
  return ShelfService.getShelfCounts(user.id);
});

final isOnShelfProvider =
    FutureProvider.family<bool, ({String bookId, ShelfType shelf})>((ref, params) {
  final user = ref.watch(currentUserProvider);
  if (user == null) return false;
  return ShelfService.isOnShelf(
    userId: user.id,
    bookId: params.bookId,
    shelf: params.shelf,
  );
});

final allHighlightsProvider = FutureProvider<List<UserHighlight>>((ref) {
  final user = ref.watch(currentUserProvider);
  if (user == null) return [];
  return HighlightService.getAllHighlights(user.id);
});

final bookHighlightsProvider =
    FutureProvider.family<List<UserHighlight>, String>((ref, bookId) {
  final user = ref.watch(currentUserProvider);
  final isOnline = ref.watch(isOnlineProvider);
  if (user == null) return [];
  if (!isOnline) {
    return OfflineStorageService.getHighlights(bookId);
  }
  return HighlightService.getHighlights(user.id, bookId);
});
