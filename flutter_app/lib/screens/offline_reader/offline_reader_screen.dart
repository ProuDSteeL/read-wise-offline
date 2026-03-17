import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:markdown/markdown.dart' as md;
import 'package:uuid/uuid.dart';
import '../../models/book.dart';
import '../../models/summary.dart';
import '../../models/key_idea.dart';
import '../../models/user_highlight.dart';
import '../../providers/reader_settings_provider.dart';
import '../../providers/auth_provider.dart';
import '../../offline/offline_storage_service.dart';
import '../../core/theme.dart';
import '../../core/constants.dart';

class OfflineReaderScreen extends ConsumerStatefulWidget {
  final String bookId;

  const OfflineReaderScreen({super.key, required this.bookId});

  @override
  ConsumerState<OfflineReaderScreen> createState() =>
      _OfflineReaderScreenState();
}

class _OfflineReaderScreenState extends ConsumerState<OfflineReaderScreen> {
  final _scrollController = ScrollController();
  bool _showControls = true;
  double _scrollProgress = 0;
  bool _restoredPosition = false;
  bool _hasSelection = false;
  String _selectedText = '';

  Book? _book;
  Summary? _summary;
  List<KeyIdea> _keyIdeas = [];
  List<UserHighlight> _highlights = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _loadData();
  }

  @override
  void dispose() {
    _saveProgress();
    _scrollController.dispose();
    super.dispose();
  }

  void _loadData() {
    _book = OfflineStorageService.getBook(widget.bookId);
    _summary = OfflineStorageService.getSummary(widget.bookId);
    _keyIdeas = OfflineStorageService.getKeyIdeas(widget.bookId);
    _highlights = OfflineStorageService.getHighlights(widget.bookId);

    // Restore position
    final progress = OfflineStorageService.getProgress(widget.bookId);
    if (progress?.lastPosition != null) {
      final offset = double.tryParse(progress!.lastPosition!);
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

    if (progress?.progressPercent != null) {
      _scrollProgress = progress!.progressPercent!;
    }

    setState(() => _loading = false);
  }

  void _onScroll() {
    if (!_scrollController.hasClients) return;
    final maxExtent = _scrollController.position.maxScrollExtent;
    if (maxExtent <= 0) return;
    final progress =
        (_scrollController.offset / maxExtent * 100).clamp(0.0, 100.0);
    if ((progress - _scrollProgress).abs() > 2) {
      setState(() => _scrollProgress = progress);
    }
  }

  void _saveProgress() {
    final user = ref.read(currentUserProvider);
    OfflineStorageService.updateProgress(
      widget.bookId,
      userId: user?.id,
      progressPercent: _scrollProgress,
      lastPosition:
          '${_scrollController.hasClients ? _scrollController.offset : 0}',
    );
  }

  void _toggleControls() {
    setState(() => _showControls = !_showControls);
  }

  void _saveHighlight(String selectedText) {
    final user = ref.read(currentUserProvider);
    final text = selectedText.trim();
    if (text.isEmpty) return;

    final highlight = UserHighlight(
      id: const Uuid().v4(),
      userId: user?.id ?? '',
      bookId: widget.bookId,
      text: text.length > 500 ? text.substring(0, 500) : text,
      color: defaultHighlightColor,
      createdAt: DateTime.now(),
    );

    OfflineStorageService.addHighlight(highlight);
    setState(() {
      _highlights = OfflineStorageService.getHighlights(widget.bookId);
    });

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Цитата сохранена (офлайн)'),
          duration: Duration(seconds: 1),
        ),
      );
    }
  }

  void _deleteHighlight(String highlightId) {
    OfflineStorageService.deleteHighlight(widget.bookId, highlightId);
    setState(() {
      _highlights = OfflineStorageService.getHighlights(widget.bookId);
    });

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Цитата удалена'),
          duration: Duration(seconds: 1),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final settings = ref.watch(readerSettingsProvider);
    final theme = settings.theme;

    if (_loading) {
      return Scaffold(
        backgroundColor: theme.backgroundColor,
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_book == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Ошибка')),
        body: const Center(child: Text('Книга не найдена в офлайн-хранилище')),
      );
    }

    return Scaffold(
      backgroundColor: theme.backgroundColor,
      body: GestureDetector(
        onTap: _toggleControls,
        child: Stack(
          children: [
            // Content
            _buildContent(settings, theme),

            // Top bar
            if (_showControls) _buildTopBar(theme),

            // Bottom bar
            if (_showControls) _buildBottomBar(theme),

            // Floating quote button
            if (_hasSelection)
              Positioned(
                bottom: _showControls ? 60 : 16,
                right: 16,
                child: FloatingActionButton.extended(
                  onPressed: () {
                    if (_selectedText.trim().isNotEmpty) {
                      _saveHighlight(_selectedText);
                    }
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

  Widget _buildContent(ReaderSettings settings, ReaderTheme theme) {
    if (_summary?.content == null || _summary!.content!.isEmpty) {
      return Center(
        child: Text(
          'Саммари пока недоступно',
          style: TextStyle(color: theme.secondaryTextColor, fontSize: 16),
        ),
      );
    }

    final cleanContent = _summary!.content!
        .replaceAll('<mark>', '')
        .replaceAll('</mark>', '');

    final markedContent = _applyHighlightMarkers(cleanContent, _highlights);

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
          MarkdownBody(
            data: markedContent,
            styleSheet: _buildMarkdownStyle(settings, theme, context),
            inlineSyntaxes: [_HighlightSyntax()],
            builders: {
              'highlighted': _HighlightBuilder(_getHighlightBgColor(theme)),
            },
          ),

          // Highlights section
          if (_highlights.isNotEmpty) ...[
            const SizedBox(height: 32),
            Divider(color: theme.secondaryTextColor.withOpacity(0.3)),
            const SizedBox(height: 16),
            Text(
              'Мои выделения · ${_highlights.length}',
              style: TextStyle(
                fontSize: settings.fontSize,
                fontWeight: FontWeight.bold,
                color: theme.textColor,
              ),
            ),
            const SizedBox(height: 12),
            ..._highlights
                .map((h) => _buildHighlightCard(h, theme, settings)),
          ],

          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildTopBar(ReaderTheme theme) {
    return Positioned(
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
                    Navigator.of(context).pop();
                  },
                  icon: Icon(Icons.close, color: theme.textColor),
                ),
                Expanded(
                  child: Text(
                    _book?.title ?? '',
                    style: TextStyle(
                      color: theme.textColor,
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                  ),
                ),
                // Offline badge
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: Colors.orange.shade100,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.wifi_off,
                          size: 12, color: Colors.orange.shade800),
                      const SizedBox(width: 4),
                      Text(
                        'Офлайн',
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.orange.shade800,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => _showTableOfContents(context, theme),
                  icon: Icon(Icons.list, color: theme.textColor),
                  tooltip: 'Содержание',
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
    );
  }

  Widget _buildBottomBar(ReaderTheme theme) {
    return Positioned(
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
                  if (highlight.note != null &&
                      highlight.note!.isNotEmpty) ...[
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

  String _applyHighlightMarkers(
    String content,
    List<UserHighlight> highlights,
  ) {
    if (highlights.isEmpty) return content;
    var result = content;
    final sorted = [...highlights]
      ..sort((a, b) => b.text.length.compareTo(a.text.length));
    for (final h in sorted) {
      final text = h.text.trim();
      if (text.isEmpty) continue;
      final escaped = RegExp.escape(text);
      result = result.replaceFirst(RegExp(escaped), '==$text==');
    }
    return result;
  }

  Color _getHighlightBgColor(ReaderTheme theme) {
    if (theme.backgroundColor.computeLuminance() > 0.5) {
      return const Color(0x40FFD54F);
    }
    return const Color(0x30FFD54F);
  }

  void _showTableOfContents(BuildContext context, ReaderTheme theme) {
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
            Divider(
                height: 1,
                color: theme.secondaryTextColor.withOpacity(0.2)),
            Expanded(
              child: _keyIdeas.isEmpty
                  ? Center(
                      child: Text(
                        'Нет ключевых идей',
                        style:
                            TextStyle(color: theme.secondaryTextColor),
                      ),
                    )
                  : ListView.separated(
                      controller: scrollController,
                      padding: const EdgeInsets.all(16),
                      itemCount: _keyIdeas.length,
                      separatorBuilder: (_, __) => Divider(
                        height: 1,
                        color:
                            theme.secondaryTextColor.withOpacity(0.15),
                      ),
                      itemBuilder: (context, index) {
                        final idea = _keyIdeas[index];
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
                                color:
                                    Theme.of(context).colorScheme.primary,
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
                    ),
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
                  Row(
                    children: [
                      Text('Размер шрифта',
                          style:
                              TextStyle(color: settings.theme.textColor)),
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
                          style:
                              TextStyle(color: settings.theme.textColor)),
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
                      style:
                          TextStyle(color: settings.theme.textColor)),
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
                                    ? Theme.of(context)
                                        .colorScheme
                                        .primary
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
