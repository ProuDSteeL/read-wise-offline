import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../../models/enums.dart';
import '../../providers/auth_provider.dart';
import '../../providers/book_providers.dart';
import '../../providers/user_data_providers.dart';
import '../../providers/subscription_provider.dart';
import '../../providers/access_control_provider.dart';
import '../../core/extensions.dart';
import '../../services/book_service.dart';
import '../../services/shelf_service.dart';
import '../../widgets/paywall_prompt.dart';
import '../../providers/offline_providers.dart';
import '../../offline/download_service.dart';

class BookDetailScreen extends ConsumerStatefulWidget {
  final String bookId;

  const BookDetailScreen({super.key, required this.bookId});

  @override
  ConsumerState<BookDetailScreen> createState() => _BookDetailScreenState();
}

class _BookDetailScreenState extends ConsumerState<BookDetailScreen> {
  @override
  void initState() {
    super.initState();
    BookService.incrementViews(widget.bookId);
  }

  @override
  Widget build(BuildContext context) {
    final bookAsync = ref.watch(bookProvider(widget.bookId));
    final keyIdeasAsync = ref.watch(keyIdeasProvider(widget.bookId));
    final progressAsync = ref.watch(bookProgressProvider(widget.bookId));
    final accessControl = ref.watch(accessControlProvider);
    final isPro = ref.watch(isProProvider);

    return bookAsync.when(
      data: (book) => Scaffold(
        body: CustomScrollView(
          slivers: [
            // App bar with cover
            SliverAppBar(
              expandedHeight: 280,
              pinned: true,
              flexibleSpace: FlexibleSpaceBar(
                background: Stack(
                  fit: StackFit.expand,
                  children: [
                    if (book.coverUrl != null)
                      CachedNetworkImage(
                        imageUrl: book.coverUrl!,
                        fit: BoxFit.cover,
                        errorWidget: (_, __, ___) =>
                            Container(color: Colors.grey.shade300),
                      )
                    else
                      Container(color: Colors.grey.shade300),
                    // Gradient overlay
                    Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.transparent,
                            Colors.black.withOpacity(0.7),
                          ],
                        ),
                      ),
                    ),
                    // Book info overlay
                    Positioned(
                      left: 16,
                      right: 16,
                      bottom: 16,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            book.title,
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            book.author,
                            style: TextStyle(
                              fontSize: 15,
                              color: Colors.white.withOpacity(0.9),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Meta info row
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                child: Row(
                  children: [
                    if (book.rating != null) ...[
                      Icon(Icons.star, size: 18, color: Colors.amber.shade600),
                      const SizedBox(width: 4),
                      Text(
                        book.rating!.toStringAsFixed(1),
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(width: 16),
                    ],
                    if (book.readTimeMin != null) ...[
                      Icon(Icons.schedule, size: 18, color: Colors.grey.shade600),
                      const SizedBox(width: 4),
                      Text(formatReadTime(book.readTimeMin)),
                      const SizedBox(width: 16),
                    ],
                    if (book.listenTimeMin != null) ...[
                      Icon(Icons.headphones, size: 18, color: Colors.grey.shade600),
                      const SizedBox(width: 4),
                      Text(formatReadTime(book.listenTimeMin)),
                    ],
                    if (book.viewsCount != null && book.viewsCount! > 0) ...[
                      const Spacer(),
                      Icon(Icons.visibility, size: 16, color: Colors.grey.shade500),
                      const SizedBox(width: 4),
                      Text(
                        '${book.viewsCount}',
                        style: TextStyle(fontSize: 13, color: Colors.grey.shade500),
                      ),
                    ],
                  ],
                ),
              ),
            ),

            // Categories
            if (book.categories != null && book.categories!.isNotEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                  child: Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: book.categories!.map((c) => Chip(
                      label: Text(c, style: const TextStyle(fontSize: 12)),
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      visualDensity: VisualDensity.compact,
                    )).toList(),
                  ),
                ),
              ),

            // Action buttons
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                child: Row(
                  children: [
                    // Read button
                    Expanded(
                      child: progressAsync.when(
                        data: (progress) {
                          final hasProgress = progress != null &&
                              (progress.progressPercent ?? 0) > 0;
                          return FilledButton.icon(
                            onPressed: () => _onRead(context, accessControl),
                            icon: Icon(hasProgress
                                ? Icons.play_arrow
                                : Icons.menu_book),
                            label: Text(hasProgress
                                ? 'Продолжить (${progress.progressPercent?.toStringAsFixed(0)}%)'
                                : 'Читать'),
                          );
                        },
                        loading: () => const FilledButton(
                          onPressed: null,
                          child: SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        ),
                        error: (_, __) => FilledButton.icon(
                          onPressed: () => _onRead(context, accessControl),
                          icon: const Icon(Icons.menu_book),
                          label: const Text('Читать'),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    // Listen button
                    if (book.listenTimeMin != null)
                      OutlinedButton.icon(
                        onPressed: () => _onListen(context, accessControl),
                        icon: const Icon(Icons.headphones),
                        label: const Text('Слушать'),
                      ),
                    const SizedBox(width: 8),
                    _DownloadButton(bookId: widget.bookId),
                  ],
                ),
              ),
            ),

            // Shelf buttons
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                child: Row(
                  children: [
                    _ShelfButton(
                      bookId: widget.bookId,
                      shelf: ShelfType.favorite,
                      icon: Icons.favorite_border,
                      activeIcon: Icons.favorite,
                      label: 'Избранное',
                    ),
                    const SizedBox(width: 8),
                    _ShelfButton(
                      bookId: widget.bookId,
                      shelf: ShelfType.wantToRead,
                      icon: Icons.bookmark_border,
                      activeIcon: Icons.bookmark,
                      label: 'Хочу прочитать',
                    ),
                    const SizedBox(width: 8),
                    _ShelfButton(
                      bookId: widget.bookId,
                      shelf: ShelfType.read,
                      icon: Icons.check_circle_outline,
                      activeIcon: Icons.check_circle,
                      label: 'Прочитано',
                    ),
                  ],
                ),
              ),
            ),

            // Description
            if (book.description != null && book.description!.isNotEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'О книге',
                        style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        book.description!,
                        style: const TextStyle(fontSize: 14, height: 1.6),
                      ),
                    ],
                  ),
                ),
              ),

            // Why read
            if (book.whyRead != null && book.whyRead!.isNotEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Зачем читать',
                        style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      ...((book.whyRead!['points'] as List?)?.map((p) => Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Icon(Icons.check, size: 18,
                                    color: Theme.of(context).colorScheme.primary),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    p.toString(),
                                    style: const TextStyle(fontSize: 14, height: 1.5),
                                  ),
                                ),
                              ],
                            ),
                          )) ??
                          []),
                    ],
                  ),
                ),
              ),

            // Key ideas
            keyIdeasAsync.when(
              data: (ideas) {
                if (ideas.isEmpty) {
                  return const SliverToBoxAdapter(child: SizedBox.shrink());
                }
                return SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Ключевые идеи (${ideas.length})',
                          style: const TextStyle(
                              fontSize: 17, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 12),
                        ...ideas.asMap().entries.map((entry) {
                          final idx = entry.key;
                          final idea = entry.value;
                          final isLocked = !isPro && idx >= 2;
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Theme.of(context)
                                    .colorScheme
                                    .surfaceContainerHighest
                                    .withOpacity(0.4),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: isLocked
                                  ? Row(
                                      children: [
                                        Icon(Icons.lock,
                                            size: 18, color: Colors.grey.shade500),
                                        const SizedBox(width: 8),
                                        Text(
                                          idea.title,
                                          style: TextStyle(
                                            fontWeight: FontWeight.w600,
                                            color: Colors.grey.shade500,
                                          ),
                                        ),
                                      ],
                                    )
                                  : Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          '${idx + 1}. ${idea.title}',
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w600,
                                            fontSize: 14,
                                          ),
                                        ),
                                        const SizedBox(height: 6),
                                        Text(
                                          idea.content,
                                          maxLines: 3,
                                          overflow: TextOverflow.ellipsis,
                                          style: TextStyle(
                                            fontSize: 13,
                                            height: 1.5,
                                            color: Colors.grey.shade700,
                                          ),
                                        ),
                                      ],
                                    ),
                            ),
                          );
                        }),
                        if (!isPro && ideas.length > 2)
                          const PaywallPrompt(
                            message: 'Все ключевые идеи доступны в Pro',
                          ),
                      ],
                    ),
                  ),
                );
              },
              loading: () => const SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Center(child: CircularProgressIndicator()),
                ),
              ),
              error: (_, __) => const SliverToBoxAdapter(child: SizedBox.shrink()),
            ),

            // About author
            if (book.aboutAuthor != null && book.aboutAuthor!.isNotEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Об авторе',
                        style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        book.aboutAuthor!,
                        style: const TextStyle(fontSize: 14, height: 1.6),
                      ),
                    ],
                  ),
                ),
              ),

            // Bottom spacing
            const SliverToBoxAdapter(child: SizedBox(height: 32)),
          ],
        ),
      ),
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

  void _onRead(BuildContext context, AccessControl ac) {
    final progressBookIds = ref
        .read(userProgressProvider)
        .valueOrNull
        ?.map((p) => p.bookId)
        .toList();

    if (!ac.canReadFull(widget.bookId, progressBookIds)) {
      showModalBottomSheet(
        context: context,
        builder: (_) => const Padding(
          padding: EdgeInsets.all(24),
          child: PaywallPrompt(
            message: 'Вы исчерпали бесплатные чтения. Перейдите на Pro для неограниченного доступа.',
          ),
        ),
      );
      return;
    }
    context.push('/book/${widget.bookId}/read');
  }

  void _onListen(BuildContext context, AccessControl ac) {
    if (!ac.canListenAudio) {
      showModalBottomSheet(
        context: context,
        builder: (_) => const Padding(
          padding: EdgeInsets.all(24),
          child: PaywallPrompt(
            message: 'Аудио доступно только в Pro подписке.',
          ),
        ),
      );
      return;
    }
    context.push('/book/${widget.bookId}/listen');
  }
}

class _DownloadButton extends ConsumerWidget {
  final String bookId;

  const _DownloadButton({required this.bookId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDownloaded = ref.watch(isBookDownloadedProvider(bookId));
    final downloadProgress = ref.watch(downloadStateProvider);
    final accessControl = ref.watch(accessControlProvider);
    final isDownloading = downloadProgress.containsKey(bookId);

    if (isDownloading) {
      final progress = downloadProgress[bookId] ?? 0;
      return SizedBox(
        width: 44,
        height: 44,
        child: Stack(
          alignment: Alignment.center,
          children: [
            CircularProgressIndicator(
              value: progress > 0 ? progress : null,
              strokeWidth: 2,
            ),
            Text(
              '${(progress * 100).toInt()}%',
              style: const TextStyle(fontSize: 9),
            ),
          ],
        ),
      );
    }

    if (isDownloaded) {
      return IconButton(
        onPressed: () => _confirmRemove(context, ref),
        icon: const Icon(Icons.download_done, color: Colors.green),
        tooltip: 'Скачано',
      );
    }

    if (!accessControl.canDownload) {
      return IconButton(
        onPressed: () {
          showModalBottomSheet(
            context: context,
            builder: (_) => const Padding(
              padding: EdgeInsets.all(24),
              child: PaywallPrompt(
                message: 'Скачивание доступно только в Pro подписке.',
              ),
            ),
          );
        },
        icon: Icon(Icons.download, color: Colors.grey.shade400),
        tooltip: 'Скачать (Pro)',
      );
    }

    return IconButton(
      onPressed: () => _startDownload(context, ref),
      icon: const Icon(Icons.download),
      tooltip: 'Скачать',
    );
  }

  void _startDownload(BuildContext context, WidgetRef ref) async {
    final user = ref.read(currentUserProvider);
    if (user == null) return;

    final notifier = ref.read(downloadStateProvider.notifier);
    notifier.setProgress(bookId, 0);

    try {
      await DownloadService.downloadBook(
        userId: user.id,
        bookId: bookId,
        contentType: DownloadContentType.text,
        onProgress: (p) => notifier.setProgress(bookId, p),
      );
      notifier.removeDownload(bookId);
      ref.invalidate(isBookDownloadedProvider(bookId));
      ref.invalidate(downloadedBooksProvider);
    } catch (e) {
      notifier.removeDownload(bookId);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Ошибка скачивания: $e')),
        );
      }
    }
  }

  void _confirmRemove(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Удалить загрузку?'),
        content: const Text('Книга будет удалена из офлайн-библиотеки.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Отмена'),
          ),
          TextButton(
            onPressed: () {
              DownloadService.removeDownload(bookId);
              ref.invalidate(isBookDownloadedProvider(bookId));
              ref.invalidate(downloadedBooksProvider);
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Загрузка удалена')),
              );
            },
            child: const Text('Удалить'),
          ),
        ],
      ),
    );
  }
}

class _ShelfButton extends ConsumerWidget {
  final String bookId;
  final ShelfType shelf;
  final IconData icon;
  final IconData activeIcon;
  final String label;

  const _ShelfButton({
    required this.bookId,
    required this.shelf,
    required this.icon,
    required this.activeIcon,
    required this.label,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isOnShelfAsync = ref.watch(
      isOnShelfProvider((bookId: bookId, shelf: shelf)),
    );

    return Expanded(
      child: isOnShelfAsync.when(
        data: (isOn) => OutlinedButton.icon(
          onPressed: () async {
            final user = ref.read(currentUserProvider);
            if (user == null) return;
            await ShelfService.toggleShelf(
              userId: user.id,
              bookId: bookId,
              shelf: shelf,
            );
            ref.invalidate(isOnShelfProvider((bookId: bookId, shelf: shelf)));
            ref.invalidate(userShelvesProvider);
          },
          icon: Icon(
            isOn ? activeIcon : icon,
            size: 18,
            color: isOn ? Theme.of(context).colorScheme.primary : null,
          ),
          label: Text(
            label,
            style: const TextStyle(fontSize: 11),
            overflow: TextOverflow.ellipsis,
          ),
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
            visualDensity: VisualDensity.compact,
          ),
        ),
        loading: () => const OutlinedButton(
          onPressed: null,
          child: SizedBox(
            height: 16,
            width: 16,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        ),
        error: (_, __) => OutlinedButton.icon(
          onPressed: null,
          icon: Icon(icon, size: 18),
          label: Text(label, style: const TextStyle(fontSize: 11)),
        ),
      ),
    );
  }
}
