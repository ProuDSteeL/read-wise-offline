import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../models/enums.dart';
import '../../providers/user_data_providers.dart';
import '../../widgets/book_card.dart';

class ShelvesScreen extends ConsumerWidget {
  const ShelvesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DefaultTabController(
      length: 3,
      child: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: Row(
                children: [
                  const Text(
                    'Мои полки',
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                  ),
                  const Spacer(),
                  // Highlights button
                  IconButton(
                    onPressed: () => _showHighlights(context, ref),
                    icon: const Icon(Icons.format_quote),
                    tooltip: 'Мои цитаты',
                  ),
                ],
              ),
            ),
            const TabBar(
              tabs: [
                Tab(text: 'Избранное'),
                Tab(text: 'Прочитано'),
                Tab(text: 'Хочу прочитать'),
              ],
              labelPadding: EdgeInsets.symmetric(horizontal: 8),
            ),
            Expanded(
              child: TabBarView(
                children: [
                  _ShelfTab(shelf: ShelfType.favorite),
                  _ShelfTab(shelf: ShelfType.read),
                  _ShelfTab(shelf: ShelfType.wantToRead),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showHighlights(BuildContext context, WidgetRef ref) {
    final highlightsAsync = ref.read(allHighlightsProvider);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        maxChildSize: 0.9,
        minChildSize: 0.4,
        expand: false,
        builder: (context, scrollController) {
          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    const Text(
                      'Мои цитаты',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const Spacer(),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.close),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              Expanded(
                child: highlightsAsync.when(
                  data: (highlights) {
                    if (highlights.isEmpty) {
                      return Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.format_quote, size: 48, color: Colors.grey.shade400),
                            const SizedBox(height: 12),
                            Text(
                              'Пока нет цитат',
                              style: TextStyle(color: Colors.grey.shade600),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Выделяйте текст при чтении',
                              style: TextStyle(fontSize: 13, color: Colors.grey.shade500),
                            ),
                          ],
                        ),
                      );
                    }
                    return ListView.separated(
                      controller: scrollController,
                      padding: const EdgeInsets.all(16),
                      itemCount: highlights.length,
                      separatorBuilder: (_, __) => const Divider(height: 24),
                      itemBuilder: (context, index) {
                        final h = highlights[index];
                        return InkWell(
                          onTap: () {
                            Navigator.pop(context);
                            context.push('/book/${h.bookId}');
                          },
                          borderRadius: BorderRadius.circular(8),
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              border: Border(
                                left: BorderSide(
                                  color: _highlightColor(h.color),
                                  width: 3,
                                ),
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  h.text,
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontStyle: FontStyle.italic,
                                    height: 1.5,
                                  ),
                                ),
                                if (h.note != null && h.note!.isNotEmpty) ...[
                                  const SizedBox(height: 8),
                                  Text(
                                    h.note!,
                                    style: TextStyle(
                                      fontSize: 13,
                                      color: Colors.grey.shade600,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        );
                      },
                    );
                  },
                  loading: () => const Center(child: CircularProgressIndicator()),
                  error: (e, _) => Center(child: Text('Ошибка: $e')),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Color _highlightColor(String? key) {
    switch (key) {
      case 'yellow':
        return const Color(0xFFF59E0B);
      case 'green':
        return const Color(0xFF10B981);
      case 'blue':
        return const Color(0xFF3B82F6);
      case 'pink':
        return const Color(0xFFEC4899);
      case 'purple':
        return const Color(0xFF8B5CF6);
      default:
        return const Color(0xFFF59E0B);
    }
  }
}

class _ShelfTab extends ConsumerWidget {
  final ShelfType shelf;

  const _ShelfTab({required this.shelf});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final shelvesAsync = ref.watch(userShelvesProvider);

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(userShelvesProvider);
      },
      child: shelvesAsync.when(
        data: (allShelves) {
          final items = allShelves.where((s) => s.shelf == shelf).toList();
          if (items.isEmpty) {
            return ListView(
              children: [
                SizedBox(
                  height: MediaQuery.of(context).size.height * 0.4,
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(_shelfIcon(shelf), size: 48, color: Colors.grey.shade400),
                        const SizedBox(height: 12),
                        Text(
                          _emptyMessage(shelf),
                          style: TextStyle(
                            fontSize: 15,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            );
          }
          return GridView.builder(
            padding: const EdgeInsets.all(16),
            gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
              maxCrossAxisExtent: 180,
              childAspectRatio: 0.55,
              crossAxisSpacing: 12,
              mainAxisSpacing: 16,
            ),
            itemCount: items.length,
            itemBuilder: (context, index) {
              final book = items[index].book;
              if (book == null) return const SizedBox.shrink();
              return BookCard(book: book);
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Ошибка: $e')),
      ),
    );
  }

  IconData _shelfIcon(ShelfType shelf) {
    switch (shelf) {
      case ShelfType.favorite:
        return Icons.favorite_border;
      case ShelfType.read:
        return Icons.check_circle_outline;
      case ShelfType.wantToRead:
        return Icons.bookmark_border;
    }
  }

  String _emptyMessage(ShelfType shelf) {
    switch (shelf) {
      case ShelfType.favorite:
        return 'Нет избранных книг';
      case ShelfType.read:
        return 'Нет прочитанных книг';
      case ShelfType.wantToRead:
        return 'Список пуст';
    }
  }
}
