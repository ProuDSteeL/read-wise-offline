import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/book.dart';
import '../../models/collection.dart';
import '../../providers/admin_provider.dart';
import '../../services/book_service.dart';
import '../../services/supabase_service.dart';

final _collectionsProvider = FutureProvider<List<Collection>>((ref) async {
  final data = await SupabaseService.client
      .from('collections')
      .select()
      .order('order_index', ascending: true);
  if (data is! List) return [];
  return data
      .map((e) => Collection.fromJson(Map<String, dynamic>.from(e as Map)))
      .toList();
});

final _publishedBooksProvider = FutureProvider<List<Book>>((ref) {
  return BookService.getPublishedBooks();
});

class AdminCollectionsScreen extends ConsumerStatefulWidget {
  const AdminCollectionsScreen({super.key});

  @override
  ConsumerState<AdminCollectionsScreen> createState() =>
      _AdminCollectionsScreenState();
}

class _AdminCollectionsScreenState
    extends ConsumerState<AdminCollectionsScreen> {
  bool _editing = false;
  Collection? _editingCollection;

  // Form state
  final _titleCtrl = TextEditingController();
  final _descriptionCtrl = TextEditingController();
  bool _isFeatured = false;
  List<String> _selectedBookIds = [];

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descriptionCtrl.dispose();
    super.dispose();
  }

  void _startCreate() {
    _titleCtrl.clear();
    _descriptionCtrl.clear();
    _isFeatured = false;
    _selectedBookIds = [];
    _editingCollection = null;
    setState(() => _editing = true);
  }

  void _startEdit(Collection col) {
    _titleCtrl.text = col.title;
    _descriptionCtrl.text = col.description ?? '';
    _isFeatured = col.isFeatured ?? false;
    _selectedBookIds = List<String>.from(col.bookIds ?? []);
    _editingCollection = col;
    setState(() => _editing = true);
  }

  void _cancelEdit() {
    setState(() => _editing = false);
  }

  Future<void> _save() async {
    if (_titleCtrl.text.trim().isEmpty) return;

    final payload = {
      'title': _titleCtrl.text.trim(),
      'description': _descriptionCtrl.text.trim().isEmpty
          ? null
          : _descriptionCtrl.text.trim(),
      'book_ids': _selectedBookIds,
      'is_featured': _isFeatured,
    };

    try {
      final client = SupabaseService.client;
      if (_editingCollection != null) {
        await client
            .from('collections')
            .update(payload)
            .eq('id', _editingCollection!.id);
      } else {
        final count =
            ref.read(_collectionsProvider).valueOrNull?.length ?? 0;
        payload['order_index'] = count;
        await client.from('collections').insert(payload);
      }

      ref.invalidate(_collectionsProvider);
      setState(() => _editing = false);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_editingCollection != null
                ? 'Коллекция обновлена'
                : 'Коллекция создана'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Ошибка: $e')),
        );
      }
    }
  }

  Future<void> _confirmDelete(Collection col) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Удалить коллекцию?'),
        content:
            Text('Коллекция «${col.title}» будет удалена навсегда.'),
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
      await SupabaseService.client
          .from('collections')
          .delete()
          .eq('id', col.id);
      ref.invalidate(_collectionsProvider);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Ошибка: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isAdminAsync = ref.watch(isAdminProvider);

    return isAdminAsync.when(
      data: (isAdmin) {
        if (!isAdmin) {
          return Scaffold(
            appBar: AppBar(title: const Text('Доступ запрещён')),
            body:
                const Center(child: Text('У вас нет прав администратора')),
          );
        }
        return _editing ? _buildEditor() : _buildList();
      },
      loading: () => Scaffold(
        appBar: AppBar(),
        body: const Center(child: CircularProgressIndicator()),
      ),
      error: (e, _) => Scaffold(
        appBar: AppBar(),
        body: Center(child: Text('Ошибка: $e')),
      ),
    );
  }

  Widget _buildList() {
    final collectionsAsync = ref.watch(_collectionsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Коллекции')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _startCreate,
        icon: const Icon(Icons.add),
        label: const Text('Новая коллекция'),
      ),
      body: collectionsAsync.when(
        data: (collections) {
          if (collections.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.collections_bookmark,
                      size: 48, color: Colors.grey.shade400),
                  const SizedBox(height: 12),
                  const Text('Нет коллекций'),
                  const SizedBox(height: 8),
                  const Text(
                    'Создайте первую коллекцию',
                    style: TextStyle(color: Colors.grey),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async =>
                ref.invalidate(_collectionsProvider),
            child: ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
              itemCount: collections.length,
              itemBuilder: (context, index) {
                final col = collections[index];
                return _CollectionCard(
                  collection: col,
                  onEdit: () => _startEdit(col),
                  onDelete: () => _confirmDelete(col),
                );
              },
            ),
          );
        },
        loading: () =>
            const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Ошибка: $e')),
      ),
    );
  }

  Widget _buildEditor() {
    final booksAsync = ref.watch(_publishedBooksProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(_editingCollection != null
            ? 'Редактировать коллекцию'
            : 'Новая коллекция'),
        leading: IconButton(
          onPressed: _cancelEdit,
          icon: const Icon(Icons.close),
        ),
        actions: [
          TextButton.icon(
            onPressed:
                _titleCtrl.text.trim().isEmpty ? null : _save,
            icon: const Icon(Icons.save),
            label: const Text('Сохранить'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Title
          TextFormField(
            controller: _titleCtrl,
            decoration:
                const InputDecoration(labelText: 'Название *'),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 12),

          // Description
          TextFormField(
            controller: _descriptionCtrl,
            decoration:
                const InputDecoration(labelText: 'Описание'),
            maxLines: 3,
          ),
          const SizedBox(height: 16),

          // Featured
          SwitchListTile(
            title: const Text('Показывать на главной'),
            subtitle: const Text('Коллекция будет видна всем'),
            value: _isFeatured,
            onChanged: (v) => setState(() => _isFeatured = v),
            contentPadding: EdgeInsets.zero,
          ),
          const SizedBox(height: 16),

          // Book selection
          Text(
            'Книги (${_selectedBookIds.length})',
            style: const TextStyle(
                fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),

          booksAsync.when(
            data: (books) {
              if (books.isEmpty) {
                return const Text('Нет опубликованных книг');
              }
              return Column(
                children: books.map((book) {
                  final selected =
                      _selectedBookIds.contains(book.id);
                  return CheckboxListTile(
                    value: selected,
                    onChanged: (v) {
                      setState(() {
                        if (v == true) {
                          _selectedBookIds.add(book.id);
                        } else {
                          _selectedBookIds.remove(book.id);
                        }
                      });
                    },
                    title: Text(
                      book.title,
                      style: const TextStyle(fontSize: 14),
                    ),
                    subtitle: Text(
                      book.author,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade600,
                      ),
                    ),
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                    controlAffinity:
                        ListTileControlAffinity.leading,
                  );
                }).toList(),
              );
            },
            loading: () => const Padding(
              padding: EdgeInsets.all(16),
              child: Center(child: CircularProgressIndicator()),
            ),
            error: (e, _) => Text('Ошибка: $e'),
          ),
        ],
      ),
    );
  }
}

class _CollectionCard extends StatelessWidget {
  final Collection collection;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _CollectionCard({
    required this.collection,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final bookCount = collection.bookIds?.length ?? 0;
    final isFeatured = collection.isFeatured ?? false;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: isFeatured
              ? Theme.of(context).colorScheme.primary.withOpacity(0.1)
              : Colors.grey.shade100,
          child: Icon(
            isFeatured ? Icons.star : Icons.collections_bookmark,
            color: isFeatured
                ? Theme.of(context).colorScheme.primary
                : Colors.grey,
            size: 20,
          ),
        ),
        title: Text(
          collection.title,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Row(
          children: [
            Text('$bookCount книг'),
            if (isFeatured) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 6, vertical: 1),
                decoration: BoxDecoration(
                  color: Theme.of(context)
                      .colorScheme
                      .primary
                      .withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'На главной',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
              ),
            ],
          ],
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              onPressed: onEdit,
              icon: Icon(Icons.edit,
                  size: 20,
                  color: Theme.of(context).colorScheme.primary),
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
