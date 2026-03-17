import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../../models/book.dart';
import '../../providers/offline_providers.dart';
import '../../providers/connectivity_provider.dart';
import '../../offline/download_service.dart';
import '../../offline/offline_storage_service.dart';

class DownloadsScreen extends ConsumerWidget {
  const DownloadsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final books = ref.watch(downloadedBooksProvider);
    final isOnline = ref.watch(isOnlineProvider);
    final downloadProgress = ref.watch(downloadStateProvider);

    return SafeArea(
      child: Column(
        children: [
          // Offline banner
          if (!isOnline)
            Container(
              width: double.infinity,
              color: Colors.orange.shade100,
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
              child: Row(
                children: [
                  Icon(Icons.wifi_off, size: 18, color: Colors.orange.shade800),
                  const SizedBox(width: 8),
                  Text(
                    'Вы офлайн — доступны только скачанные книги',
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.orange.shade800,
                    ),
                  ),
                ],
              ),
            ),

          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Row(
              children: [
                const Text(
                  'Загрузки',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                ),
                const Spacer(),
                if (books.isNotEmpty)
                  Text(
                    '${books.length} книг',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey.shade600,
                    ),
                  ),
              ],
            ),
          ),

          // Content
          Expanded(
            child: books.isEmpty
                ? _buildEmptyState()
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: books.length,
                    itemBuilder: (context, index) {
                      final book = books[index];
                      final isDownloading =
                          downloadProgress.containsKey(book.id);
                      final progress = downloadProgress[book.id];
                      return _DownloadedBookTile(
                        book: book,
                        isDownloading: isDownloading,
                        progress: progress,
                        onTap: () =>
                            context.push('/offline/read/${book.id}'),
                        onDelete: () => _confirmDelete(context, ref, book),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.download_for_offline_outlined,
              size: 64,
              color: Colors.grey.shade400,
            ),
            const SizedBox(height: 16),
            const Text(
              'Нет скачанных книг',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            Text(
              'Скачивайте книги, чтобы читать без интернета.\nКнопка скачивания находится на странице книги.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade600,
                height: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _confirmDelete(BuildContext context, WidgetRef ref, Book book) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Удалить загрузку?'),
        content: Text('«${book.title}» будет удалена из офлайн-библиотеки.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Отмена'),
          ),
          TextButton(
            onPressed: () {
              DownloadService.removeDownload(book.id);
              ref.invalidate(downloadedBooksProvider);
              ref.invalidate(isBookDownloadedProvider(book.id));
              Navigator.pop(ctx);
            },
            child: const Text('Удалить'),
          ),
        ],
      ),
    );
  }
}

class _DownloadedBookTile extends StatelessWidget {
  final Book book;
  final bool isDownloading;
  final double? progress;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  const _DownloadedBookTile({
    required this.book,
    required this.isDownloading,
    required this.progress,
    required this.onTap,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final meta = OfflineStorageService.getDownloadMeta(book.id);

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
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
                      maxLines: 2,
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
                    if (meta != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        'Скачано ${_formatDate(meta.downloadedAt)}',
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.grey.shade500,
                        ),
                      ),
                    ],
                    if (isDownloading && progress != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: LinearProgressIndicator(
                          value: progress,
                          minHeight: 3,
                        ),
                      ),
                  ],
                ),
              ),

              // Actions
              if (!isDownloading)
                IconButton(
                  onPressed: onDelete,
                  icon: Icon(
                    Icons.delete_outline,
                    color: Colors.grey.shade500,
                  ),
                  tooltip: 'Удалить',
                ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}.${date.month.toString().padLeft(2, '0')}.${date.year}';
  }
}
