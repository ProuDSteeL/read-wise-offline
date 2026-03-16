import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AdminBookFormScreen extends ConsumerWidget {
  final String? bookId;

  const AdminBookFormScreen({super.key, this.bookId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: Text(bookId != null ? 'Редактировать книгу' : 'Новая книга'),
      ),
      body: Center(
        child: Text(
          bookId != null
              ? 'Форма редактирования $bookId — Фаза 6'
              : 'Форма создания — Фаза 6',
        ),
      ),
    );
  }
}
