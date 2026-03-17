import 'dart:js_interop';
import 'dart:js_interop_unsafe';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:markdown/markdown.dart' as md;
import 'package:go_router/go_router.dart';
import '../../models/enums.dart';
import '../../models/user_highlight.dart';
import '../../providers/auth_provider.dart';
import '../../providers/book_providers.dart';
import '../../providers/user_data_providers.dart';
import '../../providers/reader_settings_provider.dart';
import '../../services/progress_service.dart';
import '../../services/shelf_service.dart';
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
  bool _isFavorite = false;
  bool _restoredPosition = false;
  bool _hasSelection = false;
  String _selectedText = '';

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _checkFavorite();
  }

  @override
  void dispose() {
    _saveProgress();
    _scrollController.dispose();
    super.dispose();
  }

  void _checkFavorite() async {
    final user = ref.read(currentUserProvider);
    if (user == null) return;
    final result = await ShelfService.isOnShelf(
      userId: user.id,
      bookId: widget.bookId,
      shelf: ShelfType.favorite,
    );
    if (mounted) setState(() => _isFavorite = result);
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

  void _saveHighlight(String selectedText) async {
    final user = ref.read(currentUserProvider);
    if (user == null) return;

    final text = selectedText.trim();
    if (text.isEmpty) return;

    try {
      await HighlightService.createHighlight(
        userId: user.id,
        bookId: widget.bookId,
        text: text.length > 500 ? text.substring(0, 500) : text,
        color: defaultHighlightColor,
      );

      ref.invalidate(bookHighlightsProvider(widget.bookId));
      ref.invalidate(allHighlightsProvider);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Цитата сохранена'),
            duration: Duration(seconds: 1),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Ошибка сохранения: $e'),
            duration: const Duration(seconds: 3),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bookAsync = ref.watch(bookProvider(widget.bookId));
    final summaryAsync = ref.watch(summaryProvider(widget.bookId));
    final highlightsAsync = ref.watch(bookHighlightsProvider(widget.bookId));
    final settings = ref.watch(readerSettingsProvider);
    final progressAsync = ref.watch(bookProgressProvider(widget.bookId));

    final theme = settings.theme;

    // Restore scroll position once
    if (!_restoredPosition) {
      final lastPos = progressAsync.valueOrNull?.lastPosition;
      if (lastPos != null) {
        final offset = double.tryParse(lastPos);
        if (offset != null && offset > 0) {
          _restoredPosition = true;
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (_scrollController.hasClients &&
                _scrollController.offset == 0 &&
                offset <= _scrollController.position.maxScrollExtent) {
              _scrollController.jumpTo(offset);
            }
          });
        }
      }
    }

    return Scaffold(
      backgroundColor: theme.backgroundColor,
      body: GestureDetector(
        onTap: _toggleControls,
        child: Stack(
          children: [
            // Summary content with selection for quotes
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

                final cleanContent = summary.content!
                    .replaceAll('<mark>', '')
                    .replaceAll('</mark>', '');

                final highlights = highlightsAsync.valueOrNull ?? [];

                // Apply highlight markers to content
                final markedContent = _applyHighlightMarkers(
                  cleanContent,
                  highlights,
                );

                return SelectionArea(
                  onSelectionChanged: (value) {
                    final text = value?.plainText.trim() ?? '';
                    final hasText = text.isNotEmpty;
                    if (hasText) _selectedText = text;
                    if (hasText != _hasSelection) {
                      setState(() => _hasSelection = hasText);
                    }
                  },
                  child: ListView(
                    controller: _scrollController,
                    padding: EdgeInsets.fromLTRB(
                      24,
                      MediaQuery.of(context).padding.top + 64,
                      24,
                      MediaQuery.of(context).padding.bottom + 80,
                    ),
                    children: [
                      // Markdown summary with highlighted quotes
                      MarkdownBody(
                        data: markedContent,
                        styleSheet: _buildMarkdownStyle(settings, theme, context),
                        inlineSyntaxes: [_HighlightSyntax()],
                        builders: {
                          'highlighted': _HighlightBuilder(
                            _getHighlightBgColor(theme),
                          ),
                        },
                      ),

                      // Highlights section
                      if (highlights.isNotEmpty) ...[
                        const SizedBox(height: 32),
                        Divider(color: theme.secondaryTextColor.withOpacity(0.3)),
                        const SizedBox(height: 16),
                        Text(
                          'Мои выделения · ${highlights.length}',
                          style: TextStyle(
                            fontSize: settings.fontSize,
                            fontWeight: FontWeight.bold,
                            color: theme.textColor,
                          ),
                        ),
                        const SizedBox(height: 12),
                        ...highlights.map((h) => _buildHighlightCard(h, theme, settings)),
                      ],

                      const SizedBox(height: 40),
                    ],
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
                          IconButton(
                            onPressed: () => _showTableOfContents(context, theme),
                            icon: Icon(Icons.list, color: theme.textColor),
                            tooltip: 'Содержание',
                          ),
                          IconButton(
                            onPressed: _onToggleFavorite,
                            icon: Icon(
                              _isFavorite ? Icons.favorite : Icons.favorite_border,
                              color: _isFavorite ? Colors.red : theme.textColor,
                            ),
                            tooltip: 'В избранное',
                          ),
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

            // Floating quote button when text is selected
            if (_hasSelection)
              Positioned(
                bottom: _showControls ? 60 : 16,
                right: 16,
                child: FloatingActionButton.extended(
                  onPressed: () {
                    // Try stored text first, fallback to JS selection
                    var text = _selectedText;
                    if (text.isEmpty) {
                      final result = globalContext.callMethod(
                        'eval'.toJS,
                        'String(window.getSelection() || "")'.toJS,
                      );
                      text = result != null
                          ? (result as JSString).toDart
                          : '';
                    }
                    if (text.trim().isNotEmpty) {
                      _saveHighlight(text);
                    }
                    // Clear selection
                    globalContext.callMethod(
                      'eval'.toJS,
                      'window.getSelection().removeAllRanges()'.toJS,
                    );
                    setState(() {
                      _hasSelection = false;
                      _selectedText = '';
                    });
                  },
                  icon: const Icon(Icons.format_quote, size: 20),
                  label: const Text('Цитата'),
                  backgroundColor: Theme.of(context).colorScheme.primary,
                  foregroundColor: Colors.white,
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildHighlightCard(
    UserHighlight highlight,
    ReaderTheme theme,
    ReaderSettings settings,
  ) {
    final highlightColor = getHighlightColor(highlight.color);

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Color(highlightColor.bgHex),
          borderRadius: BorderRadius.circular(10),
          border: Border(
            left: BorderSide(
              color: Color(highlightColor.hex),
              width: 3,
            ),
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '«${highlight.text}»',
                    style: TextStyle(
                      fontSize: settings.fontSize - 2,
                      color: theme.textColor,
                      height: 1.5,
                    ),
                  ),
                  if (highlight.note != null && highlight.note!.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      highlight.note!,
                      style: TextStyle(
                        fontSize: settings.fontSize - 3,
                        color: theme.secondaryTextColor,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 8),
            IconButton(
              onPressed: () => _deleteHighlight(highlight.id),
              icon: Icon(
                Icons.delete_outline,
                size: 20,
                color: theme.secondaryTextColor,
              ),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
              tooltip: 'Удалить',
            ),
          ],
        ),
      ),
    );
  }

  void _deleteHighlight(String highlightId) async {
    await HighlightService.deleteHighlight(highlightId);
    ref.invalidate(bookHighlightsProvider(widget.bookId));
    ref.invalidate(allHighlightsProvider);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Цитата удалена'),
          duration: Duration(seconds: 1),
        ),
      );
    }
  }

  MarkdownStyleSheet _buildMarkdownStyle(
    ReaderSettings settings,
    ReaderTheme theme,
    BuildContext context,
  ) {
    final baseStyle = TextStyle(
      fontSize: settings.fontSize,
      color: theme.textColor,
      height: settings.lineHeight,
    );

    return MarkdownStyleSheet(
      p: baseStyle,
      h1: baseStyle.copyWith(
        fontSize: settings.fontSize + 8,
        fontWeight: FontWeight.bold,
        height: 1.3,
      ),
      h2: baseStyle.copyWith(
        fontSize: settings.fontSize + 4,
        fontWeight: FontWeight.bold,
        height: 1.3,
      ),
      h3: baseStyle.copyWith(
        fontSize: settings.fontSize + 2,
        fontWeight: FontWeight.w600,
        height: 1.3,
      ),
      h1Padding: const EdgeInsets.only(top: 24, bottom: 8),
      h2Padding: const EdgeInsets.only(top: 20, bottom: 8),
      h3Padding: const EdgeInsets.only(top: 16, bottom: 6),
      strong: TextStyle(
        fontWeight: FontWeight.bold,
        color: theme.textColor,
      ),
      em: TextStyle(
        fontStyle: FontStyle.italic,
        color: theme.textColor,
      ),
      blockquote: baseStyle.copyWith(
        color: theme.secondaryTextColor,
        fontStyle: FontStyle.italic,
      ),
      blockquoteDecoration: BoxDecoration(
        border: Border(
          left: BorderSide(
            color: theme.secondaryTextColor.withOpacity(0.4),
            width: 3,
          ),
        ),
      ),
      blockquotePadding: const EdgeInsets.fromLTRB(16, 8, 0, 8),
      listBullet: baseStyle.copyWith(fontSize: settings.fontSize - 2),
      horizontalRuleDecoration: BoxDecoration(
        border: Border(
          top: BorderSide(
            color: theme.secondaryTextColor.withOpacity(0.3),
          ),
        ),
      ),
      pPadding: const EdgeInsets.only(bottom: 12),
    );
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

  void _onToggleFavorite() async {
    final user = ref.read(currentUserProvider);
    if (user == null) return;

    await ShelfService.toggleShelf(
      userId: user.id,
      bookId: widget.bookId,
      shelf: ShelfType.favorite,
    );
    setState(() => _isFavorite = !_isFavorite);
    ref.invalidate(userShelvesProvider);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(_isFavorite ? 'Добавлено в избранное' : 'Удалено из избранного'),
          duration: const Duration(seconds: 1),
        ),
      );
    }
  }

  String _applyHighlightMarkers(
    String content,
    List<UserHighlight> highlights,
  ) {
    if (highlights.isEmpty) return content;
    var result = content;
    // Sort by length descending to avoid partial replacements
    final sorted = [...highlights]
      ..sort((a, b) => b.text.length.compareTo(a.text.length));
    for (final h in sorted) {
      final text = h.text.trim();
      if (text.isEmpty) continue;
      // Escape regex special chars in the highlight text
      final escaped = RegExp.escape(text);
      // Replace only first occurrence to avoid double-wrapping
      result = result.replaceFirst(
        RegExp(escaped),
        '==$text==',
      );
    }
    return result;
  }

  Color _getHighlightBgColor(ReaderTheme theme) {
    // Yellow highlight that works on all themes
    if (theme.backgroundColor.computeLuminance() > 0.5) {
      return const Color(0x40FFD54F); // light/sepia themes
    }
    return const Color(0x30FFD54F); // dark theme
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
                  Row(
                    children: [
                      Text('Размер шрифта',
                          style: TextStyle(color: settings.theme.textColor)),
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
                  Row(
                    children: [
                      Text('Межстрочный интервал',
                          style: TextStyle(color: settings.theme.textColor)),
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
                  Text('Тема',
                      style: TextStyle(color: settings.theme.textColor)),
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

/// Inline syntax that matches ==highlighted text==
class _HighlightSyntax extends md.InlineSyntax {
  _HighlightSyntax() : super(r'==(.*?)==');

  @override
  bool onMatch(md.InlineParser parser, Match match) {
    parser.addNode(md.Element.text('highlighted', match[1]!));
    return true;
  }
}

/// Builder that renders highlighted text with a background color
class _HighlightBuilder extends MarkdownElementBuilder {
  final Color bgColor;

  _HighlightBuilder(this.bgColor);

  @override
  Widget? visitElementAfter(md.Element element, TextStyle? preferredStyle) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 1),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(3),
      ),
      child: Text(
        element.textContent,
        style: preferredStyle,
      ),
    );
  }
}
