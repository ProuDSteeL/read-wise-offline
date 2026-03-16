import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AudioPlayerScreen extends ConsumerWidget {
  final String bookId;

  const AudioPlayerScreen({super.key, required this.bookId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Аудио')),
      body: Center(
        child: Text('Аудиоплеер книги $bookId — Фаза 4'),
      ),
    );
  }
}
