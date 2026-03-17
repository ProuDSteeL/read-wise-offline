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
  if (userShelves is List) {
    for (final s in userShelves) {
      final row = Map<String, dynamic>.from(s as Map);
      final books = row['books'];
      if (books is Map) {
        final cats = books['categories'];
        if (cats is List) {
          for (final cat in cats) {
            final catStr = cat.toString();
            categoryCounts[catStr] = (categoryCounts[catStr] ?? 0) + 1;
          }
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

  final seenIds = <String>{};
  if (seenShelves is List) {
    for (final s in seenShelves) {
      final row = Map<String, dynamic>.from(s as Map);
      seenIds.add(row['book_id'] as String);
    }
  }
  if (seenProgress is List) {
    for (final p in seenProgress) {
      final row = Map<String, dynamic>.from(p as Map);
      seenIds.add(row['book_id'] as String);
    }
  }

  // Fetch books overlapping with top categories
  final booksData = await client
      .from('books')
      .select()
      .eq('status', 'published')
      .overlaps('categories', topCategories)
      .order('rating', ascending: false)
      .limit(20);

  final books = <Book>[];
  if (booksData is List) {
    for (final e in booksData) {
      books.add(Book.fromJson(Map<String, dynamic>.from(e as Map)));
    }
  }

  // Filter out seen, return top 10
  return books.where((b) => !seenIds.contains(b.id)).take(10).toList();
});
