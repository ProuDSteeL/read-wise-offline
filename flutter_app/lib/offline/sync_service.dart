import '../services/progress_service.dart';
import '../services/highlight_service.dart';
import 'offline_storage_service.dart';

class SyncService {
  static Future<void> syncAll(String userId) async {
    final actions = OfflineStorageService.getAllPendingActions();
    for (final action in actions) {
      try {
        switch (action.type) {
          case 'upsert_progress':
            await ProgressService.upsertProgress(
              userId: userId,
              bookId: action.data['book_id'] as String,
              progressPercent: action.data['progress_percent'] as double?,
              audioPosition: action.data['audio_position'] as double?,
              lastPosition: action.data['last_position'] as String?,
            );
            break;
          case 'create_highlight':
            await HighlightService.createHighlight(
              userId: userId,
              bookId: action.data['book_id'] as String,
              text: action.data['text'] as String,
              note: action.data['note'] as String?,
              color: action.data['color'] as String?,
            );
            break;
          case 'delete_highlight':
            await HighlightService.deleteHighlight(
              action.data['id'] as String,
            );
            break;
        }
        OfflineStorageService.removePendingAction(action.id);
      } catch (_) {
        // Leave in queue for next sync attempt
      }
    }
  }
}
