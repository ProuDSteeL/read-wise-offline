import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ReaderScreen extends ConsumerWidget {
  final String bookId;

  const ReaderScreen({super.key, required this.bookId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Чтение')),
      body: Center(
        child: Text('Ридер книги $bookId — Фаза 3'),
      ),
    );
  }
}
