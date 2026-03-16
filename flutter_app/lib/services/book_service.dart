import '../models/book.dart';
import '../models/key_idea.dart';
import '../models/summary.dart';
import '../models/collection.dart';
import 'supabase_service.dart';

class BookService {
  static final _client = SupabaseService.client;

  static Future<List<Book>> getPublishedBooks() async {
    final data = await _client
        .from('books')
        .select()
        .eq('status', 'published')
        .order('created_at', ascending: false);
    return (data as List).map((e) => Book.fromJson(e)).toList();
  }

  static Future<List<Book>> getPopularBooks({int limit = 10}) async {
    final data = await _client
        .from('books')
        .select()
        .eq('status', 'published')
        .order('views_count', ascending: false)
        .limit(limit);
    return (data as List).map((e) => Book.fromJson(e)).toList();
  }

  static Future<List<Book>> getNewBooks({int limit = 10}) async {
    final data = await _client
        .from('books')
        .select()
        .eq('status', 'published')
        .order('created_at', ascending: false)
        .limit(limit);
    return (data as List).map((e) => Book.fromJson(e)).toList();
  }

  static Future<Book> getBook(String id) async {
    final data =
        await _client.from('books').select().eq('id', id).single();
    return Book.fromJson(data);
  }

  static Future<List<Book>> searchBooks(String query) async {
    final data = await _client
        .from('books')
        .select()
        .eq('status', 'published')
        .or('title.ilike.%$query%,author.ilike.%$query%')
        .limit(20);
    return (data as List).map((e) => Book.fromJson(e)).toList();
  }

  static Future<List<Book>> getAllBooks() async {
    final data = await _client
        .from('books')
        .select()
        .order('created_at', ascending: false);
    return (data as List).map((e) => Book.fromJson(e)).toList();
  }

  static Future<List<KeyIdea>> getKeyIdeas(String bookId) async {
    final data = await _client
        .from('key_ideas')
        .select()
        .eq('book_id', bookId)
        .order('order_index', ascending: true);
    return (data as List).map((e) => KeyIdea.fromJson(e)).toList();
  }

  static Future<Summary?> getSummary(String bookId) async {
    final data = await _client
        .from('summaries')
        .select()
        .eq('book_id', bookId)
        .maybeSingle();
    return data != null ? Summary.fromJson(data) : null;
  }

  static Future<List<Collection>> getFeaturedCollections() async {
    final data = await _client
        .from('collections')
        .select()
        .eq('is_featured', true)
        .order('order_index', ascending: true);
    return (data as List).map((e) => Collection.fromJson(e)).toList();
  }

  static Future<void> incrementViews(String bookId) async {
    await _client.rpc('increment_views', params: {'book_id': bookId});
  }
}
