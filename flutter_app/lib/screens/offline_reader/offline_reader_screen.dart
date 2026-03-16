import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class OfflineReaderScreen extends ConsumerWidget {
  final String bookId;

  const OfflineReaderScreen({super.key, required this.bookId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Оффлайн чтение')),
      body: Center(
        child: Text('Оффлайн ридер книги $bookId — Фаза 5'),
      ),
    );
  }
}
