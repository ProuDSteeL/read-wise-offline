import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AdminCollectionsScreen extends ConsumerWidget {
  const AdminCollectionsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Админ: Коллекции')),
      body: const Center(
        child: Text('Коллекции — Фаза 6'),
      ),
    );
  }
}
