import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../models/key_idea.dart';
import '../../providers/auth_provider.dart';
import '../../providers/book_providers.dart';
import '../../providers/user_data_providers.dart';
import '../../providers/access_control_provider.dart';
import '../../providers/subscription_provider.dart';
import '../../providers/reader_settings_provider.dart';
import '../../services/progress_service.dart';
import '../../services/highlight_service.dart';
import '../../core/theme.dart';
import '../../core/constants.dart';

class ReaderScreen extends ConsumerStatefulWidget {
  final String bookId;

  const ReaderScreen({super.key, required this.bookId});

  @override
  ConsumerState<ReaderScreen> createState() => _ReaderScreenState();
}

class _ReaderScreenState extends ConsumerState<ReaderScreen> {
  final _scrollController = ScrollController();
  final _pageController = PageController();
  int _currentIdeaIndex = 0;
  bool _showControls = true;

  @override
  void initState() {
    super.initState();
    _pageController.addListener(_onPageScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _pageController.dispose();
    super.dispose();
  }

  void _onPageScroll() {
    if (!_pageController.hasClients) return;
    final page = _pageController.page?.round() ?? 0;
    if (page != _currentIdeaIndex) {
      setState(() => _currentIdeaIndex = page);
      _saveProgress(page);
    }
  }

  void _saveProgress(int ideaIndex) {
    final user = ref.read(currentUserProvider);
    if (user == null) return;

    final ideasAsync = ref.read(keyIdeasProvider(widget.bookId));
    final totalIdeas = ideasAsync.valueOrNull?.length ?? 1;
    final percent = ((ideaIndex + 1) / totalIdeas * 100).clamp(0.0, 100.0);

    ProgressService.upsertProgress(
      userId: user.id,
      bookId: widget.bookId,
      progressPercent: percent,
      lastPosition: '$ideaIndex',
    );
  }

  void _toggleControls() {
    setState(() => _showControls = !_showControls);
  }

  @override
  Widget build(BuildContext context) {
    final bookAsync = ref.watch(bookProvider(widget.bookId));
    final ideasAsync = ref.watch(keyIdeasProvider(widget.bookId));
    final summaryAsync = ref.watch(summaryProvider(widget.bookId));
    final settings = ref.watch(readerSettingsProvider);
    final isPro = ref.watch(isProProvider);
    final progressAsync = ref.watch(bookProgressProvider(widget.bookId));

    // Restore last position
    final lastPos = progressAsync.valueOrNull?.lastPosition;
    if (lastPos != null && _currentIdeaIndex == 0) {
      final pos = int.tryParse(lastPos);
      if (pos != null && pos > 0 && _pageController.hasClients) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (_pageController.hasClients) {
            _pageController.jumpToPage(pos);
          }
        });
      }
    }

    final theme = settings.theme;

    return Scaffold(
      backgroundColor: theme.backgroundColor,
      body: GestureDetector(
        onTap: _toggleControls,
        child: Stack(
          children: [
            // Content
            ideasAsync.when(
              data: (ideas) {
                if (ideas.isEmpty) {
                  // Show summary if no key ideas
                  return summaryAsync.when(
                    data: (summary) => _buildSummaryView(
                      summary?.content ?? 'Контент недоступен',
                      settings,
                      theme,
                    ),
                    loading: () => const Center(child: CircularProgressIndicator()),
                    error: (e, _) => Center(child: Text('Ошибка: $e')),
                  );
                }

                // Determine accessible ideas
                final accessibleCount = isPro ? ideas.length : 2.clamp(0, ideas.length);

                return PageView.builder(
                  controller: _pageController,
                  itemCount: ideas.length,
                  itemBuilder: (context, index) {
                    if (index >= accessibleCount) {
                      return _buildLockedPage(theme);
                    }
                    return _buildIdeaPage(ideas[index], index, ideas.length, settings, theme);
                  },
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(
                child: Text('Ошибка: $e', style: TextStyle(color: theme.textColor)),
              ),
            ),

            // Top bar
            if (_showControls)
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        theme.backgroundColor,
                        theme.backgroundColor.withOpacity(0),
                      ],
                    ),
                  ),
                  child: SafeArea(
                    bottom: false,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      child: Row(
                        children: [
                          IconButton(
                            onPressed: () {
                              _saveProgress(_currentIdeaIndex);
                              ref.invalidate(userProgressProvider);
                              context.pop();
                            },
                            icon: Icon(Icons.arrow_back, color: theme.textColor),
                          ),
                          Expanded(
                            child: bookAsync.when(
                              data: (book) => Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    book.title,
                                    style: TextStyle(
                                      color: theme.textColor,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    textAlign: TextAlign.center,
                                  ),
                                  Text(
                                    book.author,
                                    style: TextStyle(
                                      color: theme.secondaryTextColor,
                                      fontSize: 12,
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                                ],
                              ),
                              loading: () => const SizedBox.shrink(),
                              error: (_, __) => const SizedBox.shrink(),
                            ),
                          ),
                          IconButton(
                            onPressed: () => _showSettingsSheet(context),
                            icon: Icon(Icons.text_fields, color: theme.textColor),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),

            // Bottom bar — progress
            if (_showControls)
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.bottomCenter,
                      end: Alignment.topCenter,
                      colors: [
                        theme.backgroundColor,
                        theme.backgroundColor.withOpacity(0),
                      ],
                    ),
                  ),
                  child: SafeArea(
                    top: false,
                    child: ideasAsync.when(
                      data: (ideas) => Padding(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // Progress bar
                            ClipRRect(
                              borderRadius: BorderRadius.circular(2),
                              child: LinearProgressIndicator(
                                value: ideas.isEmpty
                                    ? 0
                                    : (_currentIdeaIndex + 1) / ideas.length,
                                minHeight: 3,
                                backgroundColor:
                                    theme.secondaryTextColor.withOpacity(0.2),
                              ),
                            ),
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  ideas.isEmpty
                                      ? ''
                                      : 'Идея ${_currentIdeaIndex + 1} из ${ideas.length}',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: theme.secondaryTextColor,
                                  ),
                                ),
                                // Highlight button
                                IconButton(
                                  onPressed: ideas.isEmpty || _currentIdeaIndex >= ideas.length
                                      ? null
                                      : () => _showHighlightDialog(
                                            context,
                                            ideas[_currentIdeaIndex],
                                          ),
                                  icon: Icon(
                                    Icons.format_quote,
                                    color: theme.secondaryTextColor,
                                    size: 20,
                                  ),
                                  tooltip: 'Сохранить цитату',
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      loading: () => const SizedBox.shrink(),
                      error: (_, __) => const SizedBox.shrink(),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildIdeaPage(
    KeyIdea idea,
    int index,
    int total,
    ReaderSettings settings,
    ReaderTheme theme,
  ) {
    return SingleChildScrollView(
      controller: _scrollController,
      padding: EdgeInsets.fromLTRB(
        24,
        MediaQuery.of(context).padding.top + 60,
        24,
        MediaQuery.of(context).padding.bottom + 80,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Idea number
          Text(
            'Идея ${index + 1}',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Theme.of(context).colorScheme.primary,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 8),
          // Title
          Text(
            idea.title,
            style: TextStyle(
              fontSize: settings.fontSize + 4,
              fontWeight: FontWeight.bold,
              color: theme.textColor,
              height: 1.3,
            ),
          ),
          const SizedBox(height: 20),
          // Content
          Text(
            idea.content,
            style: TextStyle(
              fontSize: settings.fontSize,
              color: theme.textColor,
              height: settings.lineHeight,
            ),
          ),
          const SizedBox(height: 40),
          // Swipe hint on first page
          if (index == 0)
            Center(
              child: Text(
                'Свайпните влево для следующей идеи',
                style: TextStyle(
                  fontSize: 13,
                  color: theme.secondaryTextColor,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSummaryView(
    String content,
    ReaderSettings settings,
    ReaderTheme theme,
  ) {
    return SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(
        24,
        MediaQuery.of(context).padding.top + 60,
        24,
        MediaQuery.of(context).padding.bottom + 80,
      ),
      child: Text(
        content,
        style: TextStyle(
          fontSize: settings.fontSize,
          color: theme.textColor,
          height: settings.lineHeight,
        ),
      ),
    );
  }

  Widget _buildLockedPage(ReaderTheme theme) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.lock, size: 48, color: theme.secondaryTextColor),
            const SizedBox(height: 16),
            Text(
              'Эта идея доступна в Pro',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: theme.textColor,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Оформите подписку для доступа ко всем ключевым идеям',
              style: TextStyle(
                fontSize: 14,
                color: theme.secondaryTextColor,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: () {
                // TODO: navigate to subscription page
              },
              child: const Text('Перейти на Pro'),
            ),
          ],
        ),
      ),
    );
  }

  void _showSettingsSheet(BuildContext context) {
    final theme = ref.read(readerSettingsProvider).theme;

    showModalBottomSheet(
      context: context,
      backgroundColor: theme.backgroundColor,
      builder: (context) => Consumer(
        builder: (context, ref, _) {
          final settings = ref.watch(readerSettingsProvider);
          final notifier = ref.read(readerSettingsProvider.notifier);

          return SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Настройки чтения',
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.bold,
                      color: settings.theme.textColor,
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Font size
                  Row(
                    children: [
                      Text(
                        'Размер шрифта',
                        style: TextStyle(color: settings.theme.textColor),
                      ),
                      const Spacer(),
                      IconButton(
                        onPressed: () => notifier.decreaseFontSize(),
                        icon: Icon(Icons.text_decrease,
                            color: settings.theme.textColor),
                      ),
                      Text(
                        '${settings.fontSize.toInt()}',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          color: settings.theme.textColor,
                        ),
                      ),
                      IconButton(
                        onPressed: () => notifier.increaseFontSize(),
                        icon: Icon(Icons.text_increase,
                            color: settings.theme.textColor),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Line height
                  Row(
                    children: [
                      Text(
                        'Межстрочный интервал',
                        style: TextStyle(color: settings.theme.textColor),
                      ),
                      const Spacer(),
                      Text(
                        settings.lineHeight.toStringAsFixed(1),
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          color: settings.theme.textColor,
                        ),
                      ),
                    ],
                  ),
                  Slider(
                    value: settings.lineHeight,
                    min: 1.2,
                    max: 2.5,
                    divisions: 13,
                    onChanged: (v) => notifier.setLineHeight(v),
                  ),
                  const SizedBox(height: 12),

                  // Theme selection
                  Text(
                    'Тема',
                    style: TextStyle(color: settings.theme.textColor),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: AppTheme.readerThemes.asMap().entries.map((entry) {
                      final idx = entry.key;
                      final rt = entry.value;
                      final selected = settings.themeIndex == idx;
                      return Padding(
                        padding: const EdgeInsets.only(right: 12),
                        child: GestureDetector(
                          onTap: () => notifier.setTheme(idx),
                          child: Container(
                            width: 56,
                            height: 40,
                            decoration: BoxDecoration(
                              color: rt.backgroundColor,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: selected
                                    ? Theme.of(context).colorScheme.primary
                                    : Colors.grey.shade400,
                                width: selected ? 2 : 1,
                              ),
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              'Аа',
                              style: TextStyle(
                                color: rt.textColor,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 8),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  void _showHighlightDialog(BuildContext context, KeyIdea idea) {
    final user = ref.read(currentUserProvider);
    if (user == null) return;

    final accessControl = ref.read(accessControlProvider);
    final highlightCountAsync =
        ref.read(bookHighlightsProvider(widget.bookId));
    final currentCount = highlightCountAsync.valueOrNull?.length ?? 0;

    if (!accessControl.canHighlight(currentCount)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Лимит цитат исчерпан. Перейдите на Pro.'),
        ),
      );
      return;
    }

    String selectedColor = defaultHighlightColor;
    final noteController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Сохранить цитату'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Color(getHighlightColor(selectedColor).bgHex),
                  borderRadius: BorderRadius.circular(8),
                  border: Border(
                    left: BorderSide(
                      color: Color(getHighlightColor(selectedColor).hex),
                      width: 3,
                    ),
                  ),
                ),
                child: Text(
                  idea.content.length > 200
                      ? '${idea.content.substring(0, 200)}...'
                      : idea.content,
                  style: const TextStyle(
                    fontSize: 13,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              // Color picker
              Row(
                children: highlightColors.map((c) {
                  final isSelected = c.key == selectedColor;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: GestureDetector(
                      onTap: () =>
                          setDialogState(() => selectedColor = c.key),
                      child: Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          color: Color(c.hex),
                          shape: BoxShape.circle,
                          border: isSelected
                              ? Border.all(color: Colors.black, width: 2)
                              : null,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: noteController,
                decoration: const InputDecoration(
                  hintText: 'Заметка (необязательно)',
                  border: OutlineInputBorder(),
                  contentPadding:
                      EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                ),
                maxLines: 2,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Отмена'),
            ),
            FilledButton(
              onPressed: () async {
                await HighlightService.createHighlight(
                  userId: user.id,
                  bookId: widget.bookId,
                  text: idea.content.length > 500
                      ? idea.content.substring(0, 500)
                      : idea.content,
                  note: noteController.text.isNotEmpty
                      ? noteController.text
                      : null,
                  color: selectedColor,
                );
                ref.invalidate(bookHighlightsProvider(widget.bookId));
                ref.invalidate(allHighlightsProvider);
                if (ctx.mounted) Navigator.pop(ctx);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Цитата сохранена')),
                  );
                }
              },
              child: const Text('Сохранить'),
            ),
          ],
        ),
      ),
    );
  }
}
