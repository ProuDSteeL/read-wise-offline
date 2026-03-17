import '../models/user_shelf.dart';
import '../models/enums.dart';
import 'supabase_service.dart';

class ShelfService {
  static get _client => SupabaseService.client;

  static Future<List<UserShelf>> getUserShelves(String userId) async {
    final data = await _client
        .from('user_shelves')
        .select('*, books(*)')
        .eq('user_id', userId);
    if (data is! List) return [];
    return data
        .map((e) => UserShelf.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }

  static Future<Map<ShelfType, int>> getShelfCounts(String userId) async {
    final data = await _client
        .from('user_shelves')
        .select('shelf')
        .eq('user_id', userId);
    final counts = <ShelfType, int>{
      ShelfType.favorite: 0,
      ShelfType.read: 0,
      ShelfType.wantToRead: 0,
    };
    if (data is! List) return counts;
    for (final row in data) {
      final m = Map<String, dynamic>.from(row as Map);
      final shelf = ShelfType.fromJson(m['shelf'] as String);
      counts[shelf] = (counts[shelf] ?? 0) + 1;
    }
    return counts;
  }

  static Future<void> toggleShelf({
    required String userId,
    required String bookId,
    required ShelfType shelf,
  }) async {
    // Check if already on this shelf
    final existing = await _client
        .from('user_shelves')
        .select('id')
        .eq('user_id', userId)
        .eq('book_id', bookId)
        .eq('shelf', shelf.toJson())
        .maybeSingle();

    if (existing != null) {
      // Remove from shelf
      await _client
          .from('user_shelves')
          .delete()
          .eq('id', existing['id'] as String);
    } else {
      // Add to shelf
      await _client.from('user_shelves').insert({
        'user_id': userId,
        'book_id': bookId,
        'shelf': shelf.toJson(),
      });
    }
  }

  static Future<bool> isOnShelf({
    required String userId,
    required String bookId,
    required ShelfType shelf,
  }) async {
    final data = await _client
        .from('user_shelves')
        .select('id')
        .eq('user_id', userId)
        .eq('book_id', bookId)
        .eq('shelf', shelf.toJson())
        .maybeSingle();
    return data != null;
  }
}
