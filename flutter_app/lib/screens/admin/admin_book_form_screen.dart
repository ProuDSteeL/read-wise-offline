import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart' show FileOptions;
import 'package:go_router/go_router.dart';
import 'package:file_picker/file_picker.dart';
import 'package:uuid/uuid.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import '../../models/book.dart';
import '../../models/enums.dart';
import '../../models/key_idea.dart';
import '../../models/summary.dart';
import '../../providers/admin_provider.dart';
import '../../services/book_service.dart';
import '../../services/supabase_service.dart';
import '../../providers/categories_provider.dart';

const _uuid = Uuid();
const _maxAudioSizeMb = 100;

class AdminBookFormScreen extends ConsumerStatefulWidget {
  final String? bookId;

  const AdminBookFormScreen({super.key, this.bookId});

  @override
  ConsumerState<AdminBookFormScreen> createState() =>
      _AdminBookFormScreenState();
}

class _AdminBookFormScreenState extends ConsumerState<AdminBookFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _loading = false;
  bool _loadingData = false;
  String? _error;

  // Book fields
  final _titleCtrl = TextEditingController();
  final _authorCtrl = TextEditingController();
  final _descriptionCtrl = TextEditingController();
  final _aboutAuthorCtrl = TextEditingController();
  final _summaryCtrl = TextEditingController();
  BookStatus _status = BookStatus.draft;
  List<String> _selectedCategories = [];
  List<String> _whyReadPoints = [];
  List<_KeyIdeaEntry> _keyIdeas = [];

  // Files
  PlatformFile? _coverFile;
  PlatformFile? _audioFile;
  String? _existingCoverUrl;
  String? _existingAudioUrl;
  int? _existingAudioSize;

  // Summary preview
  bool _showPreview = false;

  bool get _isEdit => widget.bookId != null;

  @override
  void initState() {
    super.initState();
    if (_isEdit) _loadExistingData();
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _authorCtrl.dispose();
    _descriptionCtrl.dispose();
    _aboutAuthorCtrl.dispose();
    _summaryCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadExistingData() async {
    setState(() => _loadingData = true);
    try {
      final book = await BookService.getBook(widget.bookId!);
      _titleCtrl.text = book.title;
      _authorCtrl.text = book.author;
      _descriptionCtrl.text = book.description ?? '';
      _aboutAuthorCtrl.text = book.aboutAuthor ?? '';
      _status = book.status;
      _selectedCategories = List<String>.from(book.categories ?? []);
      _existingCoverUrl = book.coverUrl;

      if (book.whyRead != null && book.whyRead!['points'] is List) {
        _whyReadPoints = (book.whyRead!['points'] as List)
            .map((e) => e.toString())
            .toList();
      }

      final ideas = await BookService.getKeyIdeas(widget.bookId!);
      _keyIdeas = ideas
          .map((e) => _KeyIdeaEntry(
                titleCtrl: TextEditingController(text: e.title),
                contentCtrl: TextEditingController(text: e.content),
              ))
          .toList();

      final summary = await BookService.getSummary(widget.bookId!);
      if (summary != null) {
        _summaryCtrl.text = summary.content ?? '';
        _existingAudioUrl = summary.audioUrl;
        _existingAudioSize = summary.audioSizeBytes;
      }
    } catch (e) {
      _error = e.toString();
    }
    if (mounted) setState(() => _loadingData = false);
  }

  int _estimateReadTimeMin() {
    final words = _summaryCtrl.text.split(RegExp(r'\s+')).length;
    return (words / 200).ceil();
  }

  Future<void> _pickCover() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.image,
      withData: true,
    );
    if (result != null && result.files.isNotEmpty) {
      setState(() => _coverFile = result.files.first);
    }
  }

  Future<void> _pickAudio() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['mp3', 'wav', 'm4a', 'aac', 'ogg'],
      withData: true,
    );
    if (result != null && result.files.isNotEmpty) {
      final file = result.files.first;
      if (file.size > _maxAudioSizeMb * 1024 * 1024) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('Аудио файл не должен превышать 100 МБ')),
          );
        }
        return;
      }
      setState(() => _audioFile = file);
    }
  }

  Future<void> _importMarkdown() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['md', 'txt', 'markdown'],
      withData: true,
    );
    if (result != null && result.files.isNotEmpty) {
      final bytes = result.files.first.bytes;
      if (bytes != null) {
        final text = String.fromCharCodes(bytes);
        setState(() => _summaryCtrl.text = text);
      }
    }
  }

  Future<String?> _uploadFile(
    String bucket,
    String fileName,
    Uint8List bytes,
    String contentType,
  ) async {
    final storage = SupabaseService.client.storage;
    await storage.from(bucket).uploadBinary(fileName, bytes,
        fileOptions: FileOptions(contentType: contentType));
    final url = storage.from(bucket).getPublicUrl(fileName);
    return url;
  }

  Future<String?> _uploadWithRetry(
    String bucket,
    String fileName,
    Uint8List bytes,
    String contentType, {
    int maxAttempts = 3,
  }) async {
    for (int attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await _uploadFile(bucket, fileName, bytes, contentType);
      } catch (e) {
        if (attempt == maxAttempts) rethrow;
        await Future.delayed(Duration(milliseconds: 700 * attempt));
      }
    }
    return null;
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final client = SupabaseService.client;
      String? coverUrl = _existingCoverUrl;
      String? audioUrl = _existingAudioUrl;
      int? audioSize = _existingAudioSize;

      // Upload cover
      if (_coverFile != null && _coverFile!.bytes != null) {
        final ext = _coverFile!.extension ?? 'jpg';
        final path = '${_uuid.v4()}.$ext';
        coverUrl = await _uploadFile(
          'book-covers',
          path,
          _coverFile!.bytes!,
          _coverFile!.extension == 'png' ? 'image/png' : 'image/jpeg',
        );
      }

      // Upload audio
      if (_audioFile != null && _audioFile!.bytes != null) {
        final ext = _audioFile!.extension ?? 'mp3';
        final path = '${_uuid.v4()}.$ext';
        audioUrl = await _uploadWithRetry(
          'audio-files',
          path,
          _audioFile!.bytes!,
          'audio/mpeg',
        );
        audioSize = _audioFile!.size;
      }

      final readTime = _estimateReadTimeMin();

      final bookPayload = {
        'title': _titleCtrl.text.trim(),
        'author': _authorCtrl.text.trim(),
        'description': _descriptionCtrl.text.trim().isEmpty
            ? null
            : _descriptionCtrl.text.trim(),
        'about_author': _aboutAuthorCtrl.text.trim().isEmpty
            ? null
            : _aboutAuthorCtrl.text.trim(),
        'cover_url': coverUrl,
        'categories': _selectedCategories,
        'why_read': _whyReadPoints.isEmpty
            ? null
            : {'points': _whyReadPoints},
        'read_time_min': readTime > 0 ? readTime : null,
        'status': _status.toJson(),
      };

      String bookId;
      if (_isEdit) {
        bookId = widget.bookId!;
        await client.from('books').update(bookPayload).eq('id', bookId);
      } else {
        final res = await client
            .from('books')
            .insert(bookPayload)
            .select('id')
            .single();
        bookId = res['id'] as String;
      }

      // Key ideas
      if (_isEdit) {
        await client.from('key_ideas').delete().eq('book_id', bookId);
      }
      if (_keyIdeas.isNotEmpty) {
        final ideasPayload = _keyIdeas.asMap().entries.map((entry) {
          return {
            'book_id': bookId,
            'title': entry.value.titleCtrl.text.trim(),
            'content': entry.value.contentCtrl.text.trim(),
            'order_index': entry.key,
          };
        }).toList();
        await client.from('key_ideas').insert(ideasPayload);
      }

      // Summary
      final summaryContent = _summaryCtrl.text.trim();
      if (summaryContent.isNotEmpty || audioUrl != null) {
        final summaryPayload = {
          'book_id': bookId,
          'content': summaryContent.isEmpty ? null : summaryContent,
          'audio_url': audioUrl,
          'audio_size_bytes': audioSize,
        };

        if (_isEdit) {
          final existing = await client
              .from('summaries')
              .select('id')
              .eq('book_id', bookId)
              .maybeSingle();
          if (existing != null) {
            await client
                .from('summaries')
                .update(summaryPayload)
                .eq('book_id', bookId);
          } else {
            await client.from('summaries').insert(summaryPayload);
          }
        } else {
          await client.from('summaries').insert(summaryPayload);
        }
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content:
                Text(_isEdit ? 'Книга обновлена' : 'Книга создана'),
          ),
        );
        context.go('/admin/books');
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
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
        return _buildForm();
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

  Widget _buildForm() {
    if (_loadingData) {
      return Scaffold(
        appBar: AppBar(title: const Text('Загрузка...')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(_isEdit ? 'Редактировать книгу' : 'Новая книга'),
        actions: [
          if (_loading)
            const Padding(
              padding: EdgeInsets.all(16),
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            )
          else
            TextButton.icon(
              onPressed: _save,
              icon: const Icon(Icons.save),
              label: const Text('Сохранить'),
            ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (_error != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  _error!,
                  style: TextStyle(color: Colors.red.shade700, fontSize: 13),
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Title
            TextFormField(
              controller: _titleCtrl,
              decoration: const InputDecoration(labelText: 'Название *'),
              validator: (v) =>
                  v == null || v.trim().isEmpty ? 'Введите название' : null,
            ),
            const SizedBox(height: 12),

            // Author
            TextFormField(
              controller: _authorCtrl,
              decoration: const InputDecoration(labelText: 'Автор *'),
              validator: (v) =>
                  v == null || v.trim().isEmpty ? 'Введите автора' : null,
            ),
            const SizedBox(height: 12),

            // Description
            TextFormField(
              controller: _descriptionCtrl,
              decoration: const InputDecoration(labelText: 'Описание'),
              maxLines: 4,
            ),
            const SizedBox(height: 12),

            // About author
            TextFormField(
              controller: _aboutAuthorCtrl,
              decoration: const InputDecoration(labelText: 'Об авторе'),
              maxLines: 3,
            ),
            const SizedBox(height: 16),

            // Status
            _SectionTitle(title: 'Статус'),
            const SizedBox(height: 8),
            SegmentedButton<BookStatus>(
              segments: const [
                ButtonSegment(
                    value: BookStatus.draft, label: Text('Черновик')),
                ButtonSegment(
                    value: BookStatus.published,
                    label: Text('Опубликовано')),
                ButtonSegment(
                    value: BookStatus.archived, label: Text('Архив')),
              ],
              selected: {_status},
              onSelectionChanged: (s) =>
                  setState(() => _status = s.first),
            ),
            const SizedBox(height: 16),

            // Categories
            _SectionTitle(title: 'Категории'),
            const SizedBox(height: 8),
            ref.watch(categoriesProvider).when(
              data: (categories) => Wrap(
                spacing: 8,
                runSpacing: 6,
                children: categories.map((cat) {
                  final selected = _selectedCategories.contains(cat);
                  return FilterChip(
                    label: Text(cat),
                    selected: selected,
                    onSelected: (v) {
                      setState(() {
                        if (v) {
                          _selectedCategories.add(cat);
                        } else {
                          _selectedCategories.remove(cat);
                        }
                      });
                    },
                  );
                }).toList(),
              ),
              loading: () => const SizedBox(
                height: 32,
                child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
              ),
              error: (_, __) => const Text('Ошибка загрузки категорий'),
            ),
            const SizedBox(height: 16),

            // Cover image
            _SectionTitle(title: 'Обложка'),
            const SizedBox(height: 8),
            Row(
              children: [
                // Preview
                Container(
                  width: 80,
                  height: 110,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.grey.shade300),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: _coverFile?.bytes != null
                      ? Image.memory(_coverFile!.bytes!, fit: BoxFit.cover)
                      : _existingCoverUrl != null
                          ? Image.network(_existingCoverUrl!,
                              fit: BoxFit.cover)
                          : const Icon(Icons.image, color: Colors.grey),
                ),
                const SizedBox(width: 12),
                OutlinedButton.icon(
                  onPressed: _pickCover,
                  icon: const Icon(Icons.upload, size: 18),
                  label: Text(_coverFile != null || _existingCoverUrl != null
                      ? 'Заменить'
                      : 'Загрузить'),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Audio file
            _SectionTitle(title: 'Аудио файл'),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(
                  _audioFile != null || _existingAudioUrl != null
                      ? Icons.audiotrack
                      : Icons.audio_file,
                  color: _audioFile != null || _existingAudioUrl != null
                      ? Colors.green
                      : Colors.grey,
                ),
                const SizedBox(width: 8),
                if (_audioFile != null)
                  Expanded(
                    child: Text(
                      '${_audioFile!.name} (${(_audioFile!.size / 1024 / 1024).toStringAsFixed(1)} МБ)',
                      style: const TextStyle(fontSize: 13),
                      overflow: TextOverflow.ellipsis,
                    ),
                  )
                else if (_existingAudioUrl != null)
                  Expanded(
                    child: Text(
                      'Аудио загружено${_existingAudioSize != null ? ' (${(_existingAudioSize! / 1024 / 1024).toStringAsFixed(1)} МБ)' : ''}',
                      style: TextStyle(
                          fontSize: 13, color: Colors.green.shade700),
                    ),
                  )
                else
                  const Text('Нет аудио',
                      style: TextStyle(fontSize: 13, color: Colors.grey)),
                const SizedBox(width: 8),
                OutlinedButton.icon(
                  onPressed: _pickAudio,
                  icon: const Icon(Icons.upload, size: 18),
                  label: const Text('Выбрать'),
                ),
              ],
            ),
            Text(
              'Максимум $_maxAudioSizeMb МБ. Форматы: MP3, WAV, M4A, AAC, OGG',
              style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
            ),
            const SizedBox(height: 20),

            // Summary
            Row(
              children: [
                const _SectionTitle(title: 'Саммари (Markdown)'),
                const Spacer(),
                TextButton.icon(
                  onPressed: _importMarkdown,
                  icon: const Icon(Icons.file_open, size: 16),
                  label: const Text('Импорт .md'),
                ),
                const SizedBox(width: 4),
                TextButton.icon(
                  onPressed: () =>
                      setState(() => _showPreview = !_showPreview),
                  icon: Icon(
                    _showPreview ? Icons.edit : Icons.preview,
                    size: 16,
                  ),
                  label:
                      Text(_showPreview ? 'Редактор' : 'Предпросмотр'),
                ),
              ],
            ),
            const SizedBox(height: 8),
            if (_showPreview)
              Container(
                height: 300,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade300),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Markdown(
                  data: _summaryCtrl.text,
                  shrinkWrap: false,
                ),
              )
            else
              TextFormField(
                controller: _summaryCtrl,
                decoration: const InputDecoration(
                  hintText: 'Введите текст саммари в формате Markdown...',
                  alignLabelWithHint: true,
                ),
                maxLines: 12,
              ),
            if (_summaryCtrl.text.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  'Примерное время чтения: ${_estimateReadTimeMin()} мин.',
                  style:
                      TextStyle(fontSize: 12, color: Colors.grey.shade600),
                ),
              ),
            const SizedBox(height: 20),

            // Key Ideas
            Row(
              children: [
                const _SectionTitle(title: 'Ключевые идеи'),
                const Spacer(),
                IconButton(
                  onPressed: () {
                    setState(() {
                      _keyIdeas.add(_KeyIdeaEntry(
                        titleCtrl: TextEditingController(),
                        contentCtrl: TextEditingController(),
                      ));
                    });
                  },
                  icon: const Icon(Icons.add_circle_outline),
                  tooltip: 'Добавить идею',
                ),
              ],
            ),
            const SizedBox(height: 8),
            ...List.generate(_keyIdeas.length, (i) {
              final idea = _keyIdeas[i];
              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 14,
                            child: Text('${i + 1}',
                                style: const TextStyle(fontSize: 12)),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: TextFormField(
                              controller: idea.titleCtrl,
                              decoration: const InputDecoration(
                                labelText: 'Заголовок идеи',
                                isDense: true,
                              ),
                            ),
                          ),
                          // Reorder buttons
                          if (i > 0)
                            IconButton(
                              onPressed: () {
                                setState(() {
                                  final item = _keyIdeas.removeAt(i);
                                  _keyIdeas.insert(i - 1, item);
                                });
                              },
                              icon:
                                  const Icon(Icons.arrow_upward, size: 18),
                              tooltip: 'Вверх',
                            ),
                          if (i < _keyIdeas.length - 1)
                            IconButton(
                              onPressed: () {
                                setState(() {
                                  final item = _keyIdeas.removeAt(i);
                                  _keyIdeas.insert(i + 1, item);
                                });
                              },
                              icon: const Icon(Icons.arrow_downward,
                                  size: 18),
                              tooltip: 'Вниз',
                            ),
                          IconButton(
                            onPressed: () {
                              setState(() => _keyIdeas.removeAt(i));
                            },
                            icon: Icon(Icons.delete_outline,
                                size: 18, color: Colors.red.shade400),
                            tooltip: 'Удалить',
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: idea.contentCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Содержание',
                          isDense: true,
                        ),
                        maxLines: 3,
                      ),
                    ],
                  ),
                ),
              );
            }),
            const SizedBox(height: 20),

            // Why read
            Row(
              children: [
                const _SectionTitle(title: 'Зачем читать'),
                const Spacer(),
                IconButton(
                  onPressed: () {
                    setState(() => _whyReadPoints.add(''));
                  },
                  icon: const Icon(Icons.add_circle_outline),
                  tooltip: 'Добавить пункт',
                ),
              ],
            ),
            const SizedBox(height: 8),
            ...List.generate(_whyReadPoints.length, (i) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    Icon(Icons.check,
                        size: 18,
                        color: Theme.of(context).colorScheme.primary),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextFormField(
                        initialValue: _whyReadPoints[i],
                        decoration: InputDecoration(
                          hintText: 'Пункт ${i + 1}',
                          isDense: true,
                        ),
                        onChanged: (v) => _whyReadPoints[i] = v,
                      ),
                    ),
                    IconButton(
                      onPressed: () {
                        setState(() => _whyReadPoints.removeAt(i));
                      },
                      icon: Icon(Icons.close,
                          size: 18, color: Colors.red.shade400),
                    ),
                  ],
                ),
              );
            }),

            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;

  const _SectionTitle({required this.title});

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
    );
  }
}

class _KeyIdeaEntry {
  final TextEditingController titleCtrl;
  final TextEditingController contentCtrl;

  _KeyIdeaEntry({required this.titleCtrl, required this.contentCtrl});
}
