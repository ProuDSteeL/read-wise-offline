import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/book.dart';
import '../offline/offline_storage_service.dart';

final isBookDownloadedProvider = Provider.family<bool, String>((ref, bookId) {
  return OfflineStorageService.isBookDownloaded(bookId);
});

final downloadedBooksProvider = Provider<List<Book>>((ref) {
  return OfflineStorageService.getAllDownloadedBooks();
});

// Tracks active download progress: bookId -> progress (0.0 to 1.0)
final downloadStateProvider =
    StateNotifierProvider<DownloadStateNotifier, Map<String, double>>((ref) {
  return DownloadStateNotifier();
});

class DownloadStateNotifier extends StateNotifier<Map<String, double>> {
  DownloadStateNotifier() : super({});

  void setProgress(String bookId, double progress) {
    state = {...state, bookId: progress};
  }

  void removeDownload(String bookId) {
    state = Map.from(state)..remove(bookId);
  }
}
