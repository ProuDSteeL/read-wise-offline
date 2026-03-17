import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/book.dart';
import '../services/supabase_service.dart';
import 'auth_provider.dart';

final recommendationsProvider = FutureProvider<List<Book>>((ref) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) return [];

  final client = SupabaseService.client;

  // Get user's shelved books to extract preferred categories
  final userShelves = await client
      .from('user_shelves')
      .select('books(categories)')
      .eq('user_id', user.id);

  final categoryCounts = <String, int>{};
  for (final s in userShelves) {
    final books = s['books'];
    if (books != null) {
      final cats = books['categories'];
      if (cats is List) {
        for (final cat in cats) {
          categoryCounts[cat as String] = (categoryCounts[cat] ?? 0) + 1;
        }
      }
    }
  }

  if (categoryCounts.isEmpty) return [];

  // Sort by frequency, take top 3
  final sortedCats = categoryCounts.entries.toList()
    ..sort((a, b) => b.value.compareTo(a.value));
  final topCategories = sortedCats.take(3).map((e) => e.key).toList();

  // Get already-seen book IDs
  final seenShelves = await client
      .from('user_shelves')
      .select('book_id')
      .eq('user_id', user.id);
  final seenProgress = await client
      .from('user_progress')
      .select('book_id')
      .eq('user_id', user.id);

  final seenIds = <String>{
    ...((seenShelves as List).map((s) => s['book_id'] as String)),
    ...((seenProgress as List).map((p) => p['book_id'] as String)),
  };

  // Fetch books overlapping with top categories
  final booksData = await client
      .from('books')
      .select()
      .eq('status', 'published')
      .overlaps('categories', topCategories)
      .order('rating', ascending: false)
      .limit(20);

  final books = (booksData as List).map((e) => Book.fromJson(e)).toList();

  // Filter out seen, return top 10
  return books.where((b) => !seenIds.contains(b.id)).take(10).toList();
});
