import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/book.dart';
import '../models/key_idea.dart';
import '../models/summary.dart';
import '../models/collection.dart';
import '../services/book_service.dart';
import '../offline/offline_storage_service.dart';
import 'connectivity_provider.dart';

final publishedBooksProvider = FutureProvider<List<Book>>((ref) {
  return BookService.getPublishedBooks();
});

final popularBooksProvider = FutureProvider<List<Book>>((ref) {
  return BookService.getPopularBooks();
});

final newBooksProvider = FutureProvider<List<Book>>((ref) {
  return BookService.getNewBooks();
});

final bookProvider = FutureProvider.family<Book, String>((ref, id) {
  final isOnline = ref.watch(isOnlineProvider);
  if (!isOnline) {
    final offlineBook = OfflineStorageService.getBook(id);
    if (offlineBook != null) return offlineBook;
    throw Exception('Книга недоступна офлайн');
  }
  return BookService.getBook(id);
});

final keyIdeasProvider = FutureProvider.family<List<KeyIdea>, String>((ref, bookId) {
  final isOnline = ref.watch(isOnlineProvider);
  if (!isOnline) {
    return OfflineStorageService.getKeyIdeas(bookId);
  }
  return BookService.getKeyIdeas(bookId);
});

final summaryProvider = FutureProvider.family<Summary?, String>((ref, bookId) {
  final isOnline = ref.watch(isOnlineProvider);
  if (!isOnline) {
    return OfflineStorageService.getSummary(bookId);
  }
  return BookService.getSummary(bookId);
});

final featuredCollectionsProvider = FutureProvider<List<Collection>>((ref) {
  return BookService.getFeaturedCollections();
});

final searchQueryProvider = StateProvider<String>((ref) => '');
final selectedCategoryProvider = StateProvider<String?>((ref) => null);
final sortByProvider = StateProvider<String>((ref) => 'popular');

final searchResultsProvider = FutureProvider<List<Book>>((ref) {
  final query = ref.watch(searchQueryProvider);
  final category = ref.watch(selectedCategoryProvider);
  final sortBy = ref.watch(sortByProvider);

  return _filteredBooks(query, category, sortBy);
});

Future<List<Book>> _filteredBooks(String query, String? category, String sortBy) async {
  List<Book> books;
  if (query.isNotEmpty) {
    books = await BookService.searchBooks(query);
  } else {
    books = await BookService.getPublishedBooks();
  }

  if (category != null) {
    books = books.where((b) => b.categories?.contains(category) ?? false).toList();
  }

  switch (sortBy) {
    case 'popular':
      books.sort((a, b) => (b.viewsCount ?? 0).compareTo(a.viewsCount ?? 0));
      break;
    case 'new':
      books.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      break;
    case 'rating':
      books.sort((a, b) => (b.rating ?? 0).compareTo(a.rating ?? 0));
      break;
    case 'reading_time':
      books.sort((a, b) => (a.readTimeMin ?? 0).compareTo(b.readTimeMin ?? 0));
      break;
  }

  return books;
}
