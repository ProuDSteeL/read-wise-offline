import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return const SafeArea(
      child: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Text(
                'Главная',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
            ),
          ),
          // TODO: Phase 2 — Continue reading, popular, new, collections
          SliverFillRemaining(
            hasScrollBody: false,
            child: Center(
              child: Text('Контент главной страницы — Фаза 2'),
            ),
          ),
        ],
      ),
    );
  }
}
