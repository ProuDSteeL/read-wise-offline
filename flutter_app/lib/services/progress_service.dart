import '../models/user_progress.dart';
import 'supabase_service.dart';

class ProgressService {
  static get _client => SupabaseService.client;

  static Future<List<UserProgress>> getUserProgress(String userId) async {
    final data = await _client
        .from('user_progress')
        .select('*, books(*)')
        .eq('user_id', userId)
        .order('updated_at', ascending: false);
    if (data is! List) return [];
    return data
        .map((e) => UserProgress.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }

  static Future<UserProgress?> getBookProgress(
      String userId, String bookId) async {
    final data = await _client
        .from('user_progress')
        .select()
        .eq('user_id', userId)
        .eq('book_id', bookId)
        .maybeSingle();
    if (data == null) return null;
    return UserProgress.fromJson(Map<String, dynamic>.from(data as Map));
  }

  static Future<void> upsertProgress({
    required String userId,
    required String bookId,
    double? progressPercent,
    double? audioPosition,
    String? lastPosition,
  }) async {
    await _client.from('user_progress').upsert(
      {
        'user_id': userId,
        'book_id': bookId,
        if (progressPercent != null) 'progress_percent': progressPercent,
        if (audioPosition != null) 'audio_position': audioPosition,
        if (lastPosition != null) 'last_position': lastPosition,
      },
      onConflict: 'user_id,book_id',
    );
  }
}
