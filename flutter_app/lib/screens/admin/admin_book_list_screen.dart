import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../../models/book.dart';
import '../../models/enums.dart';
import '../../providers/admin_provider.dart';
import '../../services/book_service.dart';
import '../../services/supabase_service.dart';

final _adminBooksProvider = FutureProvider<List<Book>>((ref) {
  return BookService.getAllBooks();
});

class AdminBookListScreen extends ConsumerStatefulWidget {
  const AdminBookListScreen({super.key});

  @override
  ConsumerState<AdminBookListScreen> createState() =>
      _AdminBookListScreenState();
}

class _AdminBookListScreenState extends ConsumerState<AdminBookListScreen> {
  String _statusFilter = 'all';

  @override
  Widget build(BuildContext context) {
    final isAdminAsync = ref.watch(isAdminProvider);

    return isAdminAsync.when(
      data: (isAdmin) {
        if (!isAdmin) {
          return Scaffold(
            appBar: AppBar(title: const Text('Доступ запрещён')),
            body: const Center(
              child: Text('У вас нет прав администратора'),
            ),
          );
        }
        return _buildAdminPage();
      },
      loading: () => Scaffold(
        appBar: AppBar(title: const Text('Загрузка...')),
        body: const Center(child: CircularProgressIndicator()),
      ),
      error: (e, _) => Scaffold(
        appBar: AppBar(title: const Text('Ошибка')),
        body: Center(child: Text('Ошибка: $e')),
      ),
    );
  }

  Widget _buildAdminPage() {
    final booksAsync = ref.watch(_adminBooksProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Управление книгами'),
        actions: [
          TextButton.icon(
            onPressed: () => context.push('/admin/collections'),
            icon: const Icon(Icons.collections_bookmark, size: 18),
            label: const Text('Коллекции'),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/admin/book/new'),
        icon: const Icon(Icons.add),
        label: const Text('Новая книга'),
      ),
      body: Column(
        children: [
          // Filter row
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: Row(
              children: [
                _FilterChip(
                  label: 'Все',
                  selected: _statusFilter == 'all',
                  onTap: () => setState(() => _statusFilter = 'all'),
                ),
                const SizedBox(width: 8),
                _FilterChip(
                  label: 'Опубликовано',
                  selected: _statusFilter == 'published',
                  onTap: () => setState(() => _statusFilter = 'published'),
                ),
                const SizedBox(width: 8),
                _FilterChip(
                  label: 'Черновик',
                  selected: _statusFilter == 'draft',
                  onTap: () => setState(() => _statusFilter = 'draft'),
                ),
              ],
            ),
          ),

          // Book list
          Expanded(
            child: booksAsync.when(
              data: (books) {
                final filtered = _statusFilter == 'all'
                    ? books
                    : books
                        .where((b) => b.status.name == _statusFilter)
                        .toList();

                if (filtered.isEmpty) {
                  return const Center(child: Text('Нет книг'));
                }

                return RefreshIndicator(
                  onRefresh: () async {
                    ref.invalidate(_adminBooksProvider);
                  },
                  child: ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 80),
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      return _BookCard(
                        book: filtered[index],
                        onToggleStatus: () =>
                            _toggleStatus(filtered[index]),
                        onEdit: () => context.push(
                            '/admin/book/${filtered[index].id}/edit'),
                        onDelete: () =>
                            _confirmDelete(filtered[index]),
                      );
                    },
                  ),
                );
              },
              loading: () =>
                  const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('Ошибка: $e')),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _toggleStatus(Book book) async {
    final newStatus = book.status == BookStatus.published
        ? BookStatus.draft
        : BookStatus.published;

    try {
      await SupabaseService.client
          .from('books')
          .update({'status': newStatus.toJson()}).eq('id', book.id);
      ref.invalidate(_adminBooksProvider);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Ошибка: $e')),
        );
      }
    }
  }

  Future<void> _confirmDelete(Book book) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Удалить книгу?'),
        content: Text(
            'Книга «${book.title}» и все связанные данные будут удалены навсегда.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Отмена'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Удалить'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      final client = SupabaseService.client;
      await client.from('key_ideas').delete().eq('book_id', book.id);
      await client.from('summaries').delete().eq('book_id', book.id);
      await client.from('books').delete().eq('id', book.id);
      ref.invalidate(_adminBooksProvider);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Книга удалена')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Ошибка удаления: $e')),
        );
      }
    }
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: selected ? colorScheme.primary : colorScheme.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected
                ? colorScheme.primary
                : colorScheme.outlineVariant,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color:
                selected ? colorScheme.onPrimary : colorScheme.onSurface,
          ),
        ),
      ),
    );
  }
}

class _BookCard extends StatelessWidget {
  final Book book;
  final VoidCallback onToggleStatus;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _BookCard({
    required this.book,
    required this.onToggleStatus,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isPublished = book.status == BookStatus.published;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            // Cover
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: SizedBox(
                width: 50,
                height: 70,
                child: book.coverUrl != null
                    ? CachedNetworkImage(
                        imageUrl: book.coverUrl!,
                        fit: BoxFit.cover,
                        errorWidget: (_, __, ___) => Container(
                          color: Colors.grey.shade200,
                          child: const Icon(Icons.book, size: 24),
                        ),
                      )
                    : Container(
                        color: Colors.grey.shade200,
                        child: const Icon(Icons.book, size: 24),
                      ),
              ),
            ),
            const SizedBox(width: 12),

            // Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    book.title,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    book.author,
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey.shade600,
                    ),
                  ),
                  const SizedBox(height: 6),
                  // Status badge
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: isPublished
                          ? Colors.green.shade50
                          : Colors.orange.shade50,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      isPublished ? 'Опубликовано' : book.status.name,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: isPublished
                            ? Colors.green.shade700
                            : Colors.orange.shade700,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Actions
            IconButton(
              onPressed: onToggleStatus,
              icon: Icon(
                isPublished ? Icons.visibility : Icons.visibility_off,
                size: 20,
                color: isPublished
                    ? Colors.green.shade600
                    : Colors.grey.shade500,
              ),
              tooltip: isPublished ? 'Снять с публикации' : 'Опубликовать',
            ),
            IconButton(
              onPressed: onEdit,
              icon: Icon(Icons.edit, size: 20, color: colorScheme.primary),
              tooltip: 'Редактировать',
            ),
            IconButton(
              onPressed: onDelete,
              icon: Icon(Icons.delete_outline,
                  size: 20, color: Colors.red.shade400),
              tooltip: 'Удалить',
            ),
          ],
        ),
      ),
    );
  }
}
