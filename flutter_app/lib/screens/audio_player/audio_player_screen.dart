import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:just_audio/just_audio.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../providers/book_providers.dart';
import '../../providers/user_data_providers.dart';
import '../../providers/reader_settings_provider.dart';
import '../../services/progress_service.dart';
import '../../core/theme.dart';
import '../../core/extensions.dart';

class AudioPlayerScreen extends ConsumerStatefulWidget {
  final String bookId;

  const AudioPlayerScreen({super.key, required this.bookId});

  @override
  ConsumerState<AudioPlayerScreen> createState() => _AudioPlayerScreenState();
}

class _AudioPlayerScreenState extends ConsumerState<AudioPlayerScreen> {
  final _player = AudioPlayer();
  bool _isLoading = true;
  String? _error;
  bool _restoredPosition = false;

  // Sleep timer
  Timer? _sleepTimer;
  int? _sleepMinutes;
  int _sleepRemaining = 0;

  // Playback speed options
  static const _speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
  double _speed = 1.0;

  @override
  void initState() {
    super.initState();
    _initAudio();
  }

  @override
  void dispose() {
    _saveAudioProgress();
    _sleepTimer?.cancel();
    _player.dispose();
    super.dispose();
  }

  Future<void> _initAudio() async {
    final summary = await ref.read(summaryProvider(widget.bookId).future);
    if (summary?.audioUrl == null || summary!.audioUrl!.isEmpty) {
      setState(() {
        _isLoading = false;
        _error = 'Аудио недоступно для этой книги';
      });
      return;
    }

    try {
      await _player.setUrl(summary.audioUrl!);
      await _player.setSpeed(_speed);

      // Restore position
      final progress =
          await ref.read(bookProgressProvider(widget.bookId).future);
      if (progress?.audioPosition != null && progress!.audioPosition! > 0) {
        await _player.seek(Duration(seconds: progress.audioPosition!.toInt()));
        _restoredPosition = true;
      }

      setState(() => _isLoading = false);
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = 'Не удалось загрузить аудио: $e';
      });
    }
  }

  void _saveAudioProgress() {
    final user = ref.read(currentUserProvider);
    if (user == null) return;
    final pos = _player.position.inSeconds.toDouble();
    if (pos > 0) {
      ProgressService.upsertProgress(
        userId: user.id,
        bookId: widget.bookId,
        audioPosition: pos,
      );
    }
  }

  void _togglePlayPause() {
    if (_player.playing) {
      _player.pause();
      _saveAudioProgress();
    } else {
      _player.play();
    }
  }

  void _seekRelative(int seconds) {
    final newPos = _player.position + Duration(seconds: seconds);
    final duration = _player.duration ?? Duration.zero;
    if (newPos < Duration.zero) {
      _player.seek(Duration.zero);
    } else if (newPos > duration) {
      _player.seek(duration);
    } else {
      _player.seek(newPos);
    }
  }

  void _setSpeed(double speed) {
    setState(() => _speed = speed);
    _player.setSpeed(speed);
  }

  void _startSleepTimer(int minutes) {
    _sleepTimer?.cancel();
    setState(() {
      _sleepMinutes = minutes;
      _sleepRemaining = minutes * 60;
    });
    _sleepTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_sleepRemaining <= 1) {
        timer.cancel();
        _player.pause();
        _saveAudioProgress();
        setState(() {
          _sleepMinutes = null;
          _sleepRemaining = 0;
        });
      } else {
        setState(() => _sleepRemaining--);
      }
    });
  }

  void _cancelSleepTimer() {
    _sleepTimer?.cancel();
    setState(() {
      _sleepMinutes = null;
      _sleepRemaining = 0;
    });
  }

  @override
  Widget build(BuildContext context) {
    final bookAsync = ref.watch(bookProvider(widget.bookId));
    final settings = ref.watch(readerSettingsProvider);
    final theme = settings.theme;

    return Scaffold(
      backgroundColor: theme.backgroundColor,
      body: SafeArea(
        child: Column(
          children: [
            // Top bar
            _buildTopBar(theme),

            // Main content
            Expanded(
              child: _isLoading
                  ? Center(
                      child: CircularProgressIndicator(
                        color: theme.textColor,
                      ),
                    )
                  : _error != null
                      ? Center(
                          child: Padding(
                            padding: const EdgeInsets.all(32),
                            child: Text(
                              _error!,
                              style: TextStyle(
                                color: theme.secondaryTextColor,
                                fontSize: 16,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ),
                        )
                      : Column(
                          children: [
                            const Spacer(flex: 1),
                            // Book cover
                            _buildCover(bookAsync, theme),
                            const SizedBox(height: 24),
                            // Book title & author
                            _buildBookInfo(bookAsync, theme),
                            const Spacer(flex: 1),
                            // Progress slider
                            _buildProgressSlider(theme),
                            const SizedBox(height: 8),
                            // Controls
                            _buildControls(theme),
                            const SizedBox(height: 16),
                            // Speed & sleep timer
                            _buildBottomControls(theme),
                            const SizedBox(height: 16),
                          ],
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopBar(ReaderTheme theme) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
      child: Row(
        children: [
          IconButton(
            onPressed: () {
              _saveAudioProgress();
              ref.invalidate(userProgressProvider);
              context.pop();
            },
            icon: Icon(Icons.keyboard_arrow_down, color: theme.textColor, size: 28),
          ),
          const Spacer(),
          if (_sleepMinutes != null)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: Chip(
                label: Text(
                  '${(_sleepRemaining / 60).ceil()} мин',
                  style: TextStyle(
                    color: theme.textColor,
                    fontSize: 12,
                  ),
                ),
                deleteIcon: Icon(Icons.close, size: 16, color: theme.textColor),
                onDeleted: _cancelSleepTimer,
                backgroundColor: theme.secondaryTextColor.withOpacity(0.15),
                side: BorderSide.none,
              ),
            ),
          IconButton(
            onPressed: () => _showSettingsSheet(context, theme),
            icon: Icon(Icons.tune, color: theme.textColor),
          ),
        ],
      ),
    );
  }

  Widget _buildCover(AsyncValue bookAsync, ReaderTheme theme) {
    return bookAsync.when(
      data: (book) => Container(
        width: 220,
        height: 320,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.3),
              blurRadius: 24,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: book.coverUrl != null
              ? CachedNetworkImage(
                  imageUrl: book.coverUrl!,
                  fit: BoxFit.cover,
                  placeholder: (_, __) => Container(
                    color: theme.secondaryTextColor.withOpacity(0.1),
                    child: Icon(Icons.headphones, size: 64, color: theme.secondaryTextColor),
                  ),
                  errorWidget: (_, __, ___) => Container(
                    color: theme.secondaryTextColor.withOpacity(0.1),
                    child: Icon(Icons.headphones, size: 64, color: theme.secondaryTextColor),
                  ),
                )
              : Container(
                  color: theme.secondaryTextColor.withOpacity(0.1),
                  child: Icon(Icons.headphones, size: 64, color: theme.secondaryTextColor),
                ),
        ),
      ),
      loading: () => Container(
        width: 220,
        height: 320,
        decoration: BoxDecoration(
          color: theme.secondaryTextColor.withOpacity(0.1),
          borderRadius: BorderRadius.circular(16),
        ),
      ),
      error: (_, __) => const SizedBox.shrink(),
    );
  }

  Widget _buildBookInfo(AsyncValue bookAsync, ReaderTheme theme) {
    return bookAsync.when(
      data: (book) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          children: [
            Text(
              book.title,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: theme.textColor,
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 6),
            Text(
              book.author,
              style: TextStyle(
                fontSize: 15,
                color: theme.secondaryTextColor,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
    );
  }

  Widget _buildProgressSlider(ReaderTheme theme) {
    return StreamBuilder<Duration>(
      stream: _player.positionStream,
      builder: (context, snapshot) {
        final position = snapshot.data ?? Duration.zero;
        final duration = _player.duration ?? Duration.zero;
        final posSeconds = position.inSeconds.toDouble();
        final durSeconds = duration.inSeconds.toDouble().clamp(1, double.infinity);

        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            children: [
              SliderTheme(
                data: SliderThemeData(
                  trackHeight: 3,
                  thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
                  overlayShape: const RoundSliderOverlayShape(overlayRadius: 14),
                  activeTrackColor: Theme.of(context).colorScheme.primary,
                  inactiveTrackColor: theme.secondaryTextColor.withOpacity(0.2),
                  thumbColor: Theme.of(context).colorScheme.primary,
                ),
                child: Slider(
                  value: posSeconds.clamp(0, durSeconds),
                  max: durSeconds,
                  onChanged: (value) {
                    _player.seek(Duration(seconds: value.toInt()));
                  },
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      formatDuration(position),
                      style: TextStyle(
                        fontSize: 12,
                        color: theme.secondaryTextColor,
                      ),
                    ),
                    Text(
                      formatDuration(duration),
                      style: TextStyle(
                        fontSize: 12,
                        color: theme.secondaryTextColor,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildControls(ReaderTheme theme) {
    return StreamBuilder<PlayerState>(
      stream: _player.playerStateStream,
      builder: (context, snapshot) {
        final playerState = snapshot.data;
        final playing = playerState?.playing ?? false;
        final processingState = playerState?.processingState;

        return Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Rewind 15s
            IconButton(
              onPressed: () => _seekRelative(-15),
              icon: Icon(Icons.replay_10, color: theme.textColor, size: 32),
              tooltip: '−15 сек',
            ),
            const SizedBox(width: 16),
            // Play/Pause
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Theme.of(context).colorScheme.primary,
              ),
              child: processingState == ProcessingState.loading ||
                      processingState == ProcessingState.buffering
                  ? const Center(
                      child: SizedBox(
                        width: 32,
                        height: 32,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 3,
                        ),
                      ),
                    )
                  : IconButton(
                      onPressed: _togglePlayPause,
                      icon: Icon(
                        playing ? Icons.pause : Icons.play_arrow,
                        color: Colors.white,
                        size: 36,
                      ),
                    ),
            ),
            const SizedBox(width: 16),
            // Forward 15s
            IconButton(
              onPressed: () => _seekRelative(15),
              icon: Icon(Icons.forward_10, color: theme.textColor, size: 32),
              tooltip: '+15 сек',
            ),
          ],
        );
      },
    );
  }

  Widget _buildBottomControls(ReaderTheme theme) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          // Speed button
          TextButton(
            onPressed: () => _showSpeedSheet(context, theme),
            child: Text(
              '${_speed}x',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: theme.textColor,
              ),
            ),
          ),
          // Sleep timer button
          TextButton.icon(
            onPressed: () => _showSleepSheet(context, theme),
            icon: Icon(
              Icons.bedtime_outlined,
              size: 20,
              color: _sleepMinutes != null
                  ? Theme.of(context).colorScheme.primary
                  : theme.textColor,
            ),
            label: Text(
              'Таймер сна',
              style: TextStyle(
                fontSize: 14,
                color: _sleepMinutes != null
                    ? Theme.of(context).colorScheme.primary
                    : theme.textColor,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showSpeedSheet(BuildContext context, ReaderTheme theme) {
    showModalBottomSheet(
      context: context,
      backgroundColor: theme.backgroundColor,
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Скорость воспроизведения',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                  color: theme.textColor,
                ),
              ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _speeds.map((s) {
                  final isSelected = _speed == s;
                  return ChoiceChip(
                    label: Text('${s}x'),
                    selected: isSelected,
                    onSelected: (_) {
                      _setSpeed(s);
                      Navigator.pop(context);
                    },
                    selectedColor: Theme.of(context)
                        .colorScheme
                        .primary
                        .withOpacity(0.2),
                    labelStyle: TextStyle(
                      color: isSelected
                          ? Theme.of(context).colorScheme.primary
                          : theme.textColor,
                      fontWeight:
                          isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                    backgroundColor: theme.secondaryTextColor.withOpacity(0.1),
                    side: BorderSide(
                      color: isSelected
                          ? Theme.of(context).colorScheme.primary
                          : Colors.transparent,
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }

  void _showSleepSheet(BuildContext context, ReaderTheme theme) {
    final options = [5, 10, 15, 30, 45, 60];

    showModalBottomSheet(
      context: context,
      backgroundColor: theme.backgroundColor,
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Таймер сна',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                  color: theme.textColor,
                ),
              ),
              const SizedBox(height: 16),
              ...options.map((min) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(
                      '$min мин',
                      style: TextStyle(color: theme.textColor),
                    ),
                    trailing: _sleepMinutes == min
                        ? Icon(Icons.check,
                            color: Theme.of(context).colorScheme.primary)
                        : null,
                    onTap: () {
                      _startSleepTimer(min);
                      Navigator.pop(context);
                    },
                  )),
              if (_sleepMinutes != null)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(
                    'Отключить',
                    style: TextStyle(color: Colors.red.shade400),
                  ),
                  onTap: () {
                    _cancelSleepTimer();
                    Navigator.pop(context);
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }

  void _showSettingsSheet(BuildContext context, ReaderTheme theme) {
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
                    'Тема',
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.bold,
                      color: settings.theme.textColor,
                    ),
                  ),
                  const SizedBox(height: 12),
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
