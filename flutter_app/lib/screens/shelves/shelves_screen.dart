import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ShelvesScreen extends ConsumerWidget {
  const ShelvesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return const SafeArea(
      child: Center(
        child: Text('Полки — Фаза 2'),
      ),
    );
  }
}
