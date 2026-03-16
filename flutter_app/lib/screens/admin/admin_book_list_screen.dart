import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AdminBookListScreen extends ConsumerWidget {
  const AdminBookListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Админ: Книги')),
      body: const Center(
        child: Text('Список книг — Фаза 6'),
      ),
    );
  }
}
