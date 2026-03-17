import '../models/book.dart';
import '../models/key_idea.dart';
import '../models/summary.dart';
import '../models/collection.dart';
import 'supabase_service.dart';

class BookService {
  static get _client => SupabaseService.client;

  static List<T> _parseList<T>(dynamic data, T Function(Map<String, dynamic>) fromJson) {
    if (data is List) {
      return data
          .map((e) => fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
    }
    return [];
  }

  static Future<List<Book>> getPublishedBooks() async {
    final data = await _client
        .from('books')
        .select()
        .eq('status', 'published')
        .order('created_at', ascending: false);
    return _parseList(data, Book.fromJson);
  }

  static Future<List<Book>> getPopularBooks({int limit = 10}) async {
    final data = await _client
        .from('books')
        .select()
        .eq('status', 'published')
        .order('views_count', ascending: false)
        .limit(limit);
    return _parseList(data, Book.fromJson);
  }

  static Future<List<Book>> getNewBooks({int limit = 10}) async {
    final data = await _client
        .from('books')
        .select()
        .eq('status', 'published')
        .order('created_at', ascending: false)
        .limit(limit);
    return _parseList(data, Book.fromJson);
  }

  static Future<Book> getBook(String id) async {
    final data =
        await _client.from('books').select().eq('id', id).single();
    return Book.fromJson(Map<String, dynamic>.from(data as Map));
  }

  static Future<List<Book>> searchBooks(String query) async {
    final data = await _client
        .from('books')
        .select()
        .eq('status', 'published')
        .or('title.ilike.%$query%,author.ilike.%$query%')
        .limit(20);
    return _parseList(data, Book.fromJson);
  }

  static Future<List<Book>> getAllBooks() async {
    final data = await _client
        .from('books')
        .select()
        .order('created_at', ascending: false);
    return _parseList(data, Book.fromJson);
  }

  static Future<List<KeyIdea>> getKeyIdeas(String bookId) async {
    final data = await _client
        .from('key_ideas')
        .select()
        .eq('book_id', bookId)
        .order('order_index', ascending: true);
    return _parseList(data, KeyIdea.fromJson);
  }

  static Future<Summary?> getSummary(String bookId) async {
    final data = await _client
        .from('summaries')
        .select()
        .eq('book_id', bookId)
        .maybeSingle();
    if (data == null) return null;
    return Summary.fromJson(Map<String, dynamic>.from(data as Map));
  }

  static Future<List<Collection>> getFeaturedCollections() async {
    final data = await _client
        .from('collections')
        .select()
        .eq('is_featured', true)
        .order('order_index', ascending: true);
    return _parseList(data, Collection.fromJson);
  }

  static Future<void> incrementViews(String bookId) async {
    await _client.rpc('increment_views', params: {'book_id': bookId});
  }
}
