import 'package:uuid/uuid.dart';
import '../models/enums.dart';
import '../models/user_download.dart';
import '../services/book_service.dart';
import '../services/highlight_service.dart';
import '../services/progress_service.dart';
import 'offline_storage_service.dart';

class DownloadService {
  static const _uuid = Uuid();

  static Future<void> downloadBook({
    required String userId,
    required String bookId,
    required DownloadContentType contentType,
    void Function(double progress)? onProgress,
  }) async {
    // 1. Fetch book metadata
    onProgress?.call(0.1);
    final book = await BookService.getBook(bookId);
    OfflineStorageService.saveBook(book);

    // 2. Fetch summary
    onProgress?.call(0.3);
    final summary = await BookService.getSummary(bookId);
    if (summary != null) {
      OfflineStorageService.saveSummary(bookId, summary);
    }

    // 3. Fetch key ideas
    onProgress?.call(0.5);
    final keyIdeas = await BookService.getKeyIdeas(bookId);
    OfflineStorageService.saveKeyIdeas(bookId, keyIdeas);

    // 4. Fetch existing highlights
    onProgress?.call(0.7);
    final highlights = await HighlightService.getHighlights(userId, bookId);
    OfflineStorageService.saveHighlights(bookId, highlights);

    // 5. Fetch existing progress
    onProgress?.call(0.8);
    final progress = await ProgressService.getBookProgress(userId, bookId);
    if (progress != null) {
      OfflineStorageService.saveProgress(bookId, progress);
    }

    // 6. Save download metadata
    onProgress?.call(0.9);
    final meta = UserDownload(
      id: _uuid.v4(),
      userId: userId,
      bookId: bookId,
      contentType: contentType,
      downloadedAt: DateTime.now(),
    );
    OfflineStorageService.saveDownloadMeta(bookId, meta);

    onProgress?.call(1.0);
  }

  static void removeDownload(String bookId) {
    OfflineStorageService.deleteBook(bookId);
  }
}
