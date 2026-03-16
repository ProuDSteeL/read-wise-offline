import '../models/user_highlight.dart';
import 'supabase_service.dart';

class HighlightService {
  static final _client = SupabaseService.client;

  static Future<List<UserHighlight>> getHighlights(
      String userId, String bookId) async {
    final data = await _client
        .from('user_highlights')
        .select()
        .eq('user_id', userId)
        .eq('book_id', bookId)
        .order('created_at', ascending: false);
    return (data as List).map((e) => UserHighlight.fromJson(e)).toList();
  }

  static Future<List<UserHighlight>> getAllHighlights(String userId) async {
    final data = await _client
        .from('user_highlights')
        .select()
        .eq('user_id', userId)
        .order('created_at', ascending: false);
    return (data as List).map((e) => UserHighlight.fromJson(e)).toList();
  }

  static Future<UserHighlight> createHighlight({
    required String userId,
    required String bookId,
    required String text,
    String? note,
    String? color,
  }) async {
    final data = await _client
        .from('user_highlights')
        .insert({
          'user_id': userId,
          'book_id': bookId,
          'text': text,
          'note': note,
          'color': color ?? 'yellow',
        })
        .select()
        .single();
    return UserHighlight.fromJson(data);
  }

  static Future<void> updateHighlight({
    required String id,
    String? note,
    String? color,
  }) async {
    await _client.from('user_highlights').update({
      if (note != null) 'note': note,
      if (color != null) 'color': color,
    }).eq('id', id);
  }

  static Future<void> deleteHighlight(String id) async {
    await _client.from('user_highlights').delete().eq('id', id);
  }

  static Future<int> getHighlightCount(
      String userId, String bookId) async {
    final data = await _client
        .from('user_highlights')
        .select('id')
        .eq('user_id', userId)
        .eq('book_id', bookId);
    return (data as List).length;
  }
}
