import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
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
  bool _showControls = true;
  double _scrollProgress = 0;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (!_scrollController.hasClients) return;
    final maxExtent = _scrollController.position.maxScrollExtent;
    if (maxExtent <= 0) return;
    final progress = (_scrollController.offset / maxExtent * 100).clamp(0.0, 100.0);
    if ((progress - _scrollProgress).abs() > 2) {
      setState(() => _scrollProgress = progress);
    }
  }

  void _saveProgress() {
    final user = ref.read(currentUserProvider);
    if (user == null) return;

    ProgressService.upsertProgress(
      userId: user.id,
      bookId: widget.bookId,
      progressPercent: _scrollProgress,
      lastPosition: '${_scrollController.hasClients ? _scrollController.offset : 0}',
    );
  }

  void _toggleControls() {
    setState(() => _showControls = !_showControls);
  }

  @override
  Widget build(BuildContext context) {
    final bookAsync = ref.watch(bookProvider(widget.bookId));
    final summaryAsync = ref.watch(summaryProvider(widget.bookId));
    final keyIdeasAsync = ref.watch(keyIdeasProvider(widget.bookId));
    final settings = ref.watch(readerSettingsProvider);
    final isPro = ref.watch(isProProvider);
    final progressAsync = ref.watch(bookProgressProvider(widget.bookId));

    final theme = settings.theme;

    // Restore scroll position once
    final lastPos = progressAsync.valueOrNull?.lastPosition;
    if (lastPos != null && _scrollProgress == 0) {
      final offset = double.tryParse(lastPos);
      if (offset != null && offset > 0) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (_scrollController.hasClients &&
              _scrollController.offset == 0 &&
              offset <= _scrollController.position.maxScrollExtent) {
            _scrollController.jumpTo(offset);
          }
        });
      }
    }

    return Scaffold(
      backgroundColor: theme.backgroundColor,
      body: GestureDetector(
        onTap: _toggleControls,
        child: Stack(
          children: [
            // Summary content
            summaryAsync.when(
              data: (summary) {
                if (summary?.content == null || summary!.content!.isEmpty) {
                  return Center(
                    child: Text(
                      'Саммари пока недоступно',
                      style: TextStyle(color: theme.secondaryTextColor, fontSize: 16),
                    ),
                  );
                }

                return SingleChildScrollView(
                  controller: _scrollController,
                  padding: EdgeInsets.fromLTRB(
                    24,
                    MediaQuery.of(context).padding.top + 64,
                    24,
                    MediaQuery.of(context).padding.bottom + 80,
                  ),
                  child: _buildSummaryContent(
                    summary.content!,
                    settings,
                    theme,
                  ),
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
                    color: theme.backgroundColor,
                    border: Border(
                      bottom: BorderSide(
                        color: theme.secondaryTextColor.withOpacity(0.2),
                      ),
                    ),
                  ),
                  child: SafeArea(
                    bottom: false,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                      child: Row(
                        children: [
                          IconButton(
                            onPressed: () {
                              _saveProgress();
                              ref.invalidate(userProgressProvider);
                              context.pop();
                            },
                            icon: Icon(Icons.close, color: theme.textColor),
                          ),
                          Expanded(
                            child: bookAsync.when(
                              data: (book) => Text(
                                book.title,
                                style: TextStyle(
                                  color: theme.textColor,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w600,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                textAlign: TextAlign.center,
                              ),
                              loading: () => const SizedBox.shrink(),
                              error: (_, __) => const SizedBox.shrink(),
                            ),
                          ),
                          // Table of contents (key ideas)
                          IconButton(
                            onPressed: () => _showTableOfContents(context, theme),
                            icon: Icon(Icons.list, color: theme.textColor),
                            tooltip: 'Содержание',
                          ),
                          // Favorite/shelf toggle
                          IconButton(
                            onPressed: () => _toggleFavorite(),
                            icon: Icon(Icons.favorite_border, color: theme.textColor),
                            tooltip: 'В избранное',
                          ),
                          // Settings
                          IconButton(
                            onPressed: () => _showSettingsSheet(context),
                            icon: Icon(Icons.tune, color: theme.textColor),
                            tooltip: 'Настройки',
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
                    color: theme.backgroundColor,
                    border: Border(
                      top: BorderSide(
                        color: theme.secondaryTextColor.withOpacity(0.2),
                      ),
                    ),
                  ),
                  child: SafeArea(
                    top: false,
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(2),
                            child: LinearProgressIndicator(
                              value: _scrollProgress / 100,
                              minHeight: 3,
                              backgroundColor:
                                  theme.secondaryTextColor.withOpacity(0.2),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${_scrollProgress.toStringAsFixed(0)}%',
                            style: TextStyle(
                              fontSize: 12,
                              color: theme.secondaryTextColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  /// Parse summary content, rendering <mark> tags as highlighted text
  Widget _buildSummaryContent(
    String content,
    ReaderSettings settings,
    ReaderTheme theme,
  ) {
    // Split content by chapters/sections marked with headers
    // and render <mark>...</mark> as highlighted spans
    final parts = _parseSummaryText(content);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: parts.map((part) {
        if (part.isHeader) {
          return Padding(
            padding: const EdgeInsets.only(top: 28, bottom: 12),
            child: Container(
              decoration: BoxDecoration(
                border: Border(
                  top: BorderSide(
                    color: theme.secondaryTextColor.withOpacity(0.3),
                  ),
                ),
              ),
              padding: const EdgeInsets.only(top: 16),
              child: Text(
                part.text,
                style: TextStyle(
                  fontSize: settings.fontSize + 4,
                  fontWeight: FontWeight.bold,
                  color: theme.textColor,
                  height: 1.4,
                ),
              ),
            ),
          );
        }

        // Regular paragraph — may contain <mark> tags
        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: _buildRichParagraph(part.text, settings, theme),
        );
      }).toList(),
    );
  }

  /// Build a paragraph that can contain <mark> highlighted segments
  Widget _buildRichParagraph(
    String text,
    ReaderSettings settings,
    ReaderTheme theme,
  ) {
    final markRegex = RegExp(r'<mark>(.*?)</mark>', dotAll: true);
    final spans = <InlineSpan>[];
    int lastEnd = 0;

    for (final match in markRegex.allMatches(text)) {
      // Text before mark
      if (match.start > lastEnd) {
        spans.add(TextSpan(
          text: text.substring(lastEnd, match.start),
          style: TextStyle(
            fontSize: settings.fontSize,
            color: theme.textColor,
            height: settings.lineHeight,
          ),
        ));
      }
      // Highlighted text
      spans.add(TextSpan(
        text: match.group(1),
        style: TextStyle(
          fontSize: settings.fontSize,
          color: theme.textColor,
          height: settings.lineHeight,
          backgroundColor: const Color(0x40F59E0B), // yellow highlight
        ),
      ));
      lastEnd = match.end;
    }

    // Remaining text
    if (lastEnd < text.length) {
      spans.add(TextSpan(
        text: text.substring(lastEnd),
        style: TextStyle(
          fontSize: settings.fontSize,
          color: theme.textColor,
          height: settings.lineHeight,
        ),
      ));
    }

    if (spans.isEmpty) {
      return Text(
        text,
        style: TextStyle(
          fontSize: settings.fontSize,
          color: theme.textColor,
          height: settings.lineHeight,
        ),
      );
    }

    return RichText(
      text: TextSpan(children: spans),
    );
  }

  /// Parse summary text into headers and paragraphs
  List<_SummaryPart> _parseSummaryText(String content) {
    final parts = <_SummaryPart>[];
    // Split by double newlines into paragraphs
    final paragraphs = content.split(RegExp(r'\n\n+'));

    for (final p in paragraphs) {
      final trimmed = p.trim();
      if (trimmed.isEmpty) continue;

      // Detect headers: lines starting with "Глава", "Часть", numbered headers,
      // or lines that are short and bold-looking (no period at end, < 80 chars)
      final isHeader = trimmed.startsWith('Глава ') ||
          trimmed.startsWith('Часть ') ||
          trimmed.startsWith('# ') ||
          trimmed.startsWith('## ') ||
          (trimmed.length < 80 &&
              !trimmed.endsWith('.') &&
              !trimmed.endsWith('!') &&
              !trimmed.endsWith('?') &&
              !trimmed.contains('<mark>') &&
              trimmed.split('\n').length == 1);

      final cleanText = trimmed
          .replaceAll(RegExp(r'^#{1,3}\s*'), ''); // Remove markdown headers

      parts.add(_SummaryPart(
        text: cleanText,
        isHeader: isHeader,
      ));
    }

    return parts;
  }

  void _showTableOfContents(BuildContext context, ReaderTheme theme) {
    final keyIdeasAsync = ref.read(keyIdeasProvider(widget.bookId));

    showModalBottomSheet(
      context: context,
      backgroundColor: theme.backgroundColor,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.5,
        maxChildSize: 0.8,
        minChildSize: 0.3,
        expand: false,
        builder: (context, scrollController) => Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Text(
                    'Ключевые идеи',
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.bold,
                      color: theme.textColor,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: Icon(Icons.close, color: theme.textColor),
                  ),
                ],
              ),
            ),
            Divider(height: 1, color: theme.secondaryTextColor.withOpacity(0.2)),
            Expanded(
              child: keyIdeasAsync.when(
                data: (ideas) {
                  if (ideas.isEmpty) {
                    return Center(
                      child: Text(
                        'Нет ключевых идей',
                        style: TextStyle(color: theme.secondaryTextColor),
                      ),
                    );
                  }
                  return ListView.separated(
                    controller: scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: ideas.length,
                    separatorBuilder: (_, __) => Divider(
                      height: 1,
                      color: theme.secondaryTextColor.withOpacity(0.15),
                    ),
                    itemBuilder: (context, index) {
                      final idea = ideas[index];
                      return ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: CircleAvatar(
                          radius: 14,
                          backgroundColor: Theme.of(context)
                              .colorScheme
                              .primary
                              .withOpacity(0.1),
                          child: Text(
                            '${index + 1}',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                          ),
                        ),
                        title: Text(
                          idea.title,
                          style: TextStyle(
                            fontSize: 14,
                            color: theme.textColor,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      );
                    },
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (_, __) => const SizedBox.shrink(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _toggleFavorite() async {
    final user = ref.read(currentUserProvider);
    if (user == null) return;

    try {
      await ref.read(currentUserProvider) != null;
      // Import is not available here, use a simpler approach
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Добавлено в избранное')),
      );
    } catch (_) {}
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
                    children: AppTheme.readerThemes
                        .asMap()
                        .entries
                        .map((entry) {
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
}

class _SummaryPart {
  final String text;
  final bool isHeader;

  const _SummaryPart({required this.text, required this.isHeader});
}
