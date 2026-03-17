import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../providers/book_providers.dart';
import '../../providers/user_data_providers.dart';
import '../../providers/recommendations_provider.dart';
import '../../providers/subscription_provider.dart';
import '../../providers/categories_provider.dart';
import '../../widgets/book_card.dart';
import '../../widgets/continue_card.dart';
import '../../widgets/section_header.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final progressAsync = ref.watch(userProgressProvider);
    final popularAsync = ref.watch(popularBooksProvider);
    final newBooksAsync = ref.watch(newBooksProvider);
    final collectionsAsync = ref.watch(featuredCollectionsProvider);
    final recsAsync = ref.watch(recommendationsProvider);
    final profile = ref.watch(profileProvider).valueOrNull;

    return SafeArea(
      child: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(popularBooksProvider);
          ref.invalidate(newBooksProvider);
          ref.invalidate(userProgressProvider);
          ref.invalidate(recommendationsProvider);
          ref.invalidate(featuredCollectionsProvider);
        },
        child: CustomScrollView(
          slivers: [
            // Header
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Привет, ${profile?.name ?? user?.userMetadata?['full_name'] ?? 'читатель'}!',
                          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Что почитаем сегодня?',
                          style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
                        ),
                      ],
                    ),
                    GestureDetector(
                      onTap: () => context.go('/profile'),
                      child: CircleAvatar(
                        radius: 20,
                        backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                        child: Text(
                          (profile?.name ?? user?.email ?? '?')[0].toUpperCase(),
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Continue Reading
            progressAsync.when(
              data: (progressList) {
                final active = progressList
                    .where((p) => p.book != null && (p.progressPercent ?? 0) > 0 && (p.progressPercent ?? 0) < 100)
                    .toList();
                if (active.isEmpty) return const SliverToBoxAdapter(child: SizedBox.shrink());
                return SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SectionHeader(title: 'Продолжить чтение'),
                      SizedBox(
                        height: 100,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: active.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 12),
                          itemBuilder: (_, i) => ContinueCard(progress: active[i]),
                        ),
                      ),
                      const SizedBox(height: 8),
                    ],
                  ),
                );
              },
              loading: () => const SliverToBoxAdapter(child: SizedBox.shrink()),
              error: (_, __) => const SliverToBoxAdapter(child: SizedBox.shrink()),
            ),

            // Categories
            SliverToBoxAdapter(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionHeader(title: 'Категории'),
                  SizedBox(
                    height: 36,
                    child: ref.watch(categoriesProvider).when(
                      data: (categories) => ListView.separated(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: categories.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 8),
                        itemBuilder: (_, i) {
                          return ActionChip(
                            label: Text(categories[i], style: const TextStyle(fontSize: 13)),
                            onPressed: () {
                              ref.read(selectedCategoryProvider.notifier).state = categories[i];
                              context.go('/search');
                            },
                          );
                        },
                      ),
                      loading: () => const Center(child: CircularProgressIndicator(strokeWidth: 2)),
                      error: (_, __) => const SizedBox.shrink(),
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
              ),
            ),

            // Popular
            popularAsync.when(
              data: (books) {
                if (books.isEmpty) return const SliverToBoxAdapter(child: SizedBox.shrink());
                return SliverToBoxAdapter(
                  child: Column(
                    children: [
                      SectionHeader(
                        title: 'Популярное',
                        onSeeAll: () {
                          ref.read(sortByProvider.notifier).state = 'popular';
                          context.go('/search');
                        },
                      ),
                      SizedBox(
                        height: 240,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: books.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 12),
                          itemBuilder: (_, i) => BookCard(book: books[i]),
                        ),
                      ),
                      const SizedBox(height: 8),
                    ],
                  ),
                );
              },
              loading: () => const SliverToBoxAdapter(
                child: Center(child: Padding(
                  padding: EdgeInsets.all(32),
                  child: CircularProgressIndicator(),
                )),
              ),
              error: (e, _) => SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text('Ошибка загрузки: $e', style: TextStyle(color: Colors.red.shade400)),
                ),
              ),
            ),

            // Recommendations
            recsAsync.when(
              data: (books) {
                if (books.isEmpty) return const SliverToBoxAdapter(child: SizedBox.shrink());
                return SliverToBoxAdapter(
                  child: Column(
                    children: [
                      const SectionHeader(title: 'Рекомендации для вас'),
                      SizedBox(
                        height: 240,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: books.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 12),
                          itemBuilder: (_, i) => BookCard(book: books[i]),
                        ),
                      ),
                      const SizedBox(height: 8),
                    ],
                  ),
                );
              },
              loading: () => const SliverToBoxAdapter(child: SizedBox.shrink()),
              error: (_, __) => const SliverToBoxAdapter(child: SizedBox.shrink()),
            ),

            // New books
            newBooksAsync.when(
              data: (books) {
                if (books.isEmpty) return const SliverToBoxAdapter(child: SizedBox.shrink());
                return SliverToBoxAdapter(
                  child: Column(
                    children: [
                      SectionHeader(
                        title: 'Новинки',
                        onSeeAll: () {
                          ref.read(sortByProvider.notifier).state = 'new';
                          context.go('/search');
                        },
                      ),
                      SizedBox(
                        height: 240,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: books.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 12),
                          itemBuilder: (_, i) => BookCard(book: books[i]),
                        ),
                      ),
                    ],
                  ),
                );
              },
              loading: () => const SliverToBoxAdapter(child: SizedBox.shrink()),
              error: (_, __) => const SliverToBoxAdapter(child: SizedBox.shrink()),
            ),

            // Collections
            collectionsAsync.when(
              data: (collections) {
                if (collections.isEmpty) return const SliverToBoxAdapter(child: SizedBox.shrink());
                return SliverToBoxAdapter(
                  child: Column(
                    children: [
                      const SectionHeader(title: 'Подборки'),
                      SizedBox(
                        height: 100,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: collections.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 12),
                          itemBuilder: (_, i) {
                            final c = collections[i];
                            return Container(
                              width: 200,
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    Theme.of(context).colorScheme.primaryContainer,
                                    Theme.of(context).colorScheme.secondaryContainer,
                                  ],
                                ),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  Text(
                                    c.title,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  if (c.description != null)
                                    Text(
                                      c.description!,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: Colors.grey.shade700,
                                      ),
                                    ),
                                ],
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                );
              },
              loading: () => const SliverToBoxAdapter(child: SizedBox.shrink()),
              error: (_, __) => const SliverToBoxAdapter(child: SizedBox.shrink()),
            ),

            // Bottom spacing
            const SliverToBoxAdapter(child: SizedBox(height: 24)),
          ],
        ),
      ),
    );
  }
}
