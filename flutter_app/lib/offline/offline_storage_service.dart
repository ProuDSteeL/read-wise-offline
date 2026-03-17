import 'package:uuid/uuid.dart';
import '../models/book.dart';
import '../models/summary.dart';
import '../models/key_idea.dart';
import '../models/user_highlight.dart';
import '../models/user_progress.dart';
import '../models/user_download.dart';
import 'hive_boxes.dart';
import 'sync_action.dart';

class OfflineStorageService {
  static const _uuid = Uuid();

  // ── Books ──

  static void saveBook(Book book) {
    HiveBoxes.books.put(book.id, book.toJson());
  }

  static Book? getBook(String bookId) {
    final data = HiveBoxes.books.get(bookId);
    if (data == null) return null;
    return Book.fromJson(Map<String, dynamic>.from(data));
  }

  static List<Book> getAllDownloadedBooks() {
    return HiveBoxes.downloadsMeta.keys
        .map((key) => getBook(key as String))
        .whereType<Book>()
        .toList();
  }

  static bool isBookDownloaded(String bookId) {
    return HiveBoxes.downloadsMeta.containsKey(bookId);
  }

  static void deleteBook(String bookId) {
    HiveBoxes.books.delete(bookId);
    HiveBoxes.summaries.delete(bookId);
    HiveBoxes.keyIdeas.delete(bookId);
    HiveBoxes.highlights.delete(bookId);
    HiveBoxes.progress.delete(bookId);
    HiveBoxes.downloadsMeta.delete(bookId);
  }

  // ── Summaries ──

  static void saveSummary(String bookId, Summary summary) {
    HiveBoxes.summaries.put(bookId, summary.toJson());
  }

  static Summary? getSummary(String bookId) {
    final data = HiveBoxes.summaries.get(bookId);
    if (data == null) return null;
    return Summary.fromJson(Map<String, dynamic>.from(data));
  }

  // ── Key Ideas ──

  static void saveKeyIdeas(String bookId, List<KeyIdea> ideas) {
    HiveBoxes.keyIdeas.put(bookId, {
      'items': ideas.map((e) => e.toJson()).toList(),
    });
  }

  static List<KeyIdea> getKeyIdeas(String bookId) {
    final data = HiveBoxes.keyIdeas.get(bookId);
    if (data == null) return [];
    final items = data['items'];
    if (items is! List) return [];
    return items
        .map((e) => KeyIdea.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }

  // ── Highlights ──

  static void saveHighlights(String bookId, List<UserHighlight> list) {
    HiveBoxes.highlights.put(bookId, {
      'items': list.map((e) => e.toJson()).toList(),
    });
  }

  static List<UserHighlight> getHighlights(String bookId) {
    final data = HiveBoxes.highlights.get(bookId);
    if (data == null) return [];
    final items = data['items'];
    if (items is! List) return [];
    return items
        .map((e) => UserHighlight.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }

  static void addHighlight(UserHighlight highlight) {
    final existing = getHighlights(highlight.bookId);
    existing.add(highlight);
    saveHighlights(highlight.bookId, existing);
    enqueueSyncAction(SyncAction(
      id: _uuid.v4(),
      type: 'create_highlight',
      data: highlight.toJson(),
      createdAt: DateTime.now(),
    ));
  }

  static void deleteHighlight(String bookId, String highlightId) {
    final existing = getHighlights(bookId);
    existing.removeWhere((h) => h.id == highlightId);
    saveHighlights(bookId, existing);
    enqueueSyncAction(SyncAction(
      id: _uuid.v4(),
      type: 'delete_highlight',
      data: {'id': highlightId},
      createdAt: DateTime.now(),
    ));
  }

  // ── Progress ──

  static void saveProgress(String bookId, UserProgress prog) {
    HiveBoxes.progress.put(bookId, prog.toJson());
  }

  static UserProgress? getProgress(String bookId) {
    final data = HiveBoxes.progress.get(bookId);
    if (data == null) return null;
    return UserProgress.fromJson(Map<String, dynamic>.from(data));
  }

  static void updateProgress(
    String bookId, {
    String? userId,
    double? progressPercent,
    double? audioPosition,
    String? lastPosition,
  }) {
    final existing = getProgress(bookId);
    final updated = UserProgress(
      id: existing?.id ?? _uuid.v4(),
      userId: userId ?? existing?.userId ?? '',
      bookId: bookId,
      progressPercent: progressPercent ?? existing?.progressPercent,
      audioPosition: audioPosition ?? existing?.audioPosition,
      lastPosition: lastPosition ?? existing?.lastPosition,
      updatedAt: DateTime.now(),
    );
    saveProgress(bookId, updated);
    enqueueSyncAction(SyncAction(
      id: _uuid.v4(),
      type: 'upsert_progress',
      data: {
        'book_id': bookId,
        'user_id': updated.userId,
        if (progressPercent != null) 'progress_percent': progressPercent,
        if (audioPosition != null) 'audio_position': audioPosition,
        if (lastPosition != null) 'last_position': lastPosition,
      },
      createdAt: DateTime.now(),
    ));
  }

  // ── Downloads Meta ──

  static void saveDownloadMeta(String bookId, UserDownload meta) {
    HiveBoxes.downloadsMeta.put(bookId, meta.toJson());
  }

  static UserDownload? getDownloadMeta(String bookId) {
    final data = HiveBoxes.downloadsMeta.get(bookId);
    if (data == null) return null;
    return UserDownload.fromJson(Map<String, dynamic>.from(data));
  }

  static List<UserDownload> getAllDownloadsMeta() {
    return HiveBoxes.downloadsMeta.values
        .map((e) => UserDownload.fromJson(Map<String, dynamic>.from(e)))
        .toList();
  }

  // ── Pending Sync Queue ──

  static void enqueueSyncAction(SyncAction action) {
    HiveBoxes.pendingSync.put(action.id, action.toJson());
  }

  static List<SyncAction> getAllPendingActions() {
    return HiveBoxes.pendingSync.values
        .map((e) => SyncAction.fromJson(Map<String, dynamic>.from(e)))
        .toList();
  }

  static void removePendingAction(String id) {
    HiveBoxes.pendingSync.delete(id);
  }
}
