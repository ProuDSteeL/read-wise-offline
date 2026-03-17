import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../models/enums.dart';
import '../../providers/auth_provider.dart';
import '../../providers/subscription_provider.dart';
import '../../providers/user_data_providers.dart';
import '../../providers/access_control_provider.dart';
import '../../providers/admin_provider.dart';
import '../../providers/push_provider.dart';
import '../../widgets/paywall_prompt.dart';
import '../../core/constants.dart';
import '../../services/toast_service.dart';
import '../../services/pwa_service.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final profileAsync = ref.watch(profileProvider);
    final shelfCountsAsync = ref.watch(shelfCountsProvider);
    final progressAsync = ref.watch(userProgressProvider);
    final highlightsAsync = ref.watch(allHighlightsProvider);
    final isPro = ref.watch(isProProvider);
    final freeReadsUsed = ref.watch(freeReadsUsedProvider).valueOrNull ?? 0;
    final pushState = ref.watch(pushProvider);

    final profile = profileAsync.valueOrNull;

    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const SizedBox(height: 16),
            // Avatar
            CircleAvatar(
              radius: 44,
              backgroundColor: Theme.of(context).colorScheme.primaryContainer,
              child: Text(
                (profile?.name ?? user?.email ?? '?')[0].toUpperCase(),
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).colorScheme.primary,
                ),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              profile?.name ??
                  user?.userMetadata?['full_name'] as String? ??
                  'Гость',
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            Text(
              user?.email ?? '',
              style: TextStyle(color: Colors.grey.shade600),
            ),

            // Subscription badge
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              decoration: BoxDecoration(
                color: isPro
                    ? Theme.of(context).colorScheme.primary.withOpacity(0.1)
                    : Colors.grey.shade200,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    isPro ? Icons.workspace_premium : Icons.person,
                    size: 18,
                    color: isPro
                        ? Theme.of(context).colorScheme.primary
                        : Colors.grey.shade600,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    isPro
                        ? (profile?.subscriptionType.label ?? 'Pro')
                        : 'Бесплатный план',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: isPro
                          ? Theme.of(context).colorScheme.primary
                          : Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
            ),

            // Subscription info for Pro
            if (isPro && profile?.subscriptionExpiresAt != null) ...[
              const SizedBox(height: 6),
              Text(
                'Действует до ${_formatDate(profile!.subscriptionExpiresAt!)}',
                style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
              ),
            ],

            // Free tier usage
            if (!isPro) ...[
              const SizedBox(height: 16),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surfaceContainerHighest.withOpacity(0.4),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Прочитано книг', style: TextStyle(fontSize: 14)),
                        Text(
                          '$freeReadsUsed / $freeReadsLimit',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: freeReadsUsed >= freeReadsLimit
                                ? Colors.red
                                : null,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: (freeReadsUsed / freeReadsLimit).clamp(0.0, 1.0),
                        minHeight: 6,
                        backgroundColor: Colors.grey.shade300,
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        onPressed: () => _showPaywall(context),
                        child: const Text('Перейти на Pro'),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            // Stats
            const SizedBox(height: 24),
            _buildStatsSection(context, ref, shelfCountsAsync, progressAsync, highlightsAsync),

            // Admin panel link (only for admins)
            ref.watch(isAdminProvider).when(
              data: (isAdmin) {
                if (!isAdmin) return const SizedBox.shrink();
                return Padding(
                  padding: const EdgeInsets.only(top: 24),
                  child: SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () => context.push('/admin/books'),
                      icon: const Icon(Icons.admin_panel_settings),
                      label: const Text('Админ-панель'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor:
                            Theme.of(context).colorScheme.primary,
                      ),
                    ),
                  ),
                );
              },
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
            ),

            // PWA install banner
            if (PwaService.canInstall && !PwaService.isInstalled)
              Padding(
                padding: const EdgeInsets.only(top: 24),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(colors: [
                      Theme.of(context).colorScheme.primaryContainer,
                      Theme.of(context).colorScheme.secondaryContainer,
                    ]),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.install_mobile, size: 32),
                      const SizedBox(height: 8),
                      const Text(
                        'Установить приложение',
                        style: TextStyle(
                            fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Быстрый доступ с главного экрана',
                        style: TextStyle(
                            fontSize: 13, color: Colors.grey.shade700),
                      ),
                      const SizedBox(height: 12),
                      FilledButton.icon(
                        onPressed: () {
                          PwaService.promptInstall();
                        },
                        icon: const Icon(Icons.download, size: 18),
                        label: const Text('Установить'),
                      ),
                    ],
                  ),
                ),
              ),

            // Settings
            const SizedBox(height: 24),
            const Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Настройки',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(height: 8),
            _SettingsTile(
              icon: Icons.notifications_outlined,
              title: 'Уведомления',
              subtitle: pushState.isSupported
                  ? (pushState.isSubscribed
                      ? 'Push-уведомления включены'
                      : 'Push-уведомления о новых книгах')
                  : 'Не поддерживается в этом браузере',
              trailing: pushState.loading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Switch(
                      value: pushState.isSubscribed,
                      onChanged: pushState.isSupported
                          ? (v) async {
                              final ok =
                                  await ref.read(pushProvider.notifier).toggle();
                              if (!ok && !pushState.isSubscribed) {
                                AppToast.error(
                                    'Разрешите уведомления в настройках браузера');
                              } else if (ok) {
                                AppToast.show(pushState.isSubscribed
                                    ? 'Уведомления отключены'
                                    : 'Уведомления включены');
                              }
                            }
                          : null,
                    ),
            ),
            _SettingsTile(
              icon: Icons.storage_outlined,
              title: 'Хранилище',
              subtitle: 'Лимит: $defaultStorageLimitMb МБ',
              onTap: () {
                // TODO: storage settings
              },
            ),

            // Logout
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () async {
                  await ref.read(authProvider.notifier).signOut();
                  if (context.mounted) context.go('/auth');
                },
                icon: const Icon(Icons.logout),
                label: const Text('Выйти'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.red,
                  side: const BorderSide(color: Colors.red),
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildStatsSection(
    BuildContext context,
    WidgetRef ref,
    AsyncValue<Map<ShelfType, int>> shelfCountsAsync,
    AsyncValue<dynamic> progressAsync,
    AsyncValue<dynamic> highlightsAsync,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Статистика',
          style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            _StatCard(
              icon: Icons.check_circle_outline,
              label: 'Прочитано',
              value: shelfCountsAsync.when(
                data: (c) => '${c[ShelfType.read] ?? 0}',
                loading: () => '...',
                error: (_, __) => '0',
              ),
            ),
            const SizedBox(width: 8),
            _StatCard(
              icon: Icons.favorite_border,
              label: 'Избранное',
              value: shelfCountsAsync.when(
                data: (c) => '${c[ShelfType.favorite] ?? 0}',
                loading: () => '...',
                error: (_, __) => '0',
              ),
            ),
            const SizedBox(width: 8),
            _StatCard(
              icon: Icons.format_quote,
              label: 'Цитаты',
              value: highlightsAsync.when(
                data: (h) => '${h.length}',
                loading: () => '...',
                error: (_, __) => '0',
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            _StatCard(
              icon: Icons.bookmark_border,
              label: 'Хочу прочитать',
              value: shelfCountsAsync.when(
                data: (c) => '${c[ShelfType.wantToRead] ?? 0}',
                loading: () => '...',
                error: (_, __) => '0',
              ),
            ),
            const SizedBox(width: 8),
            _StatCard(
              icon: Icons.auto_stories,
              label: 'В процессе',
              value: progressAsync.when(
                data: (list) {
                  final active = (list as List).where((p) =>
                      (p.progressPercent ?? 0) > 0 &&
                      (p.progressPercent ?? 0) < 100);
                  return '${active.length}';
                },
                loading: () => '...',
                error: (_, __) => '0',
              ),
            ),
            const SizedBox(width: 8),
            const Expanded(child: SizedBox()),
          ],
        ),
      ],
    );
  }

  void _showPaywall(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  IconButton(
                    onPressed: () => Navigator.pop(ctx),
                    icon: const Icon(Icons.close),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
              PaywallPrompt(
                message: 'Откройте полный доступ ко всем книгам и функциям',
                showBenefits: true,
                actionLabel: 'Оформить подписку',
                onAction: () {
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Оплата будет доступна в ближайшее время'),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}.${date.month.toString().padLeft(2, '0')}.${date.year}';
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceContainerHighest.withOpacity(0.4),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          children: [
            Icon(icon, size: 22, color: Theme.of(context).colorScheme.primary),
            const SizedBox(height: 6),
            Text(
              value,
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;

  const _SettingsTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.trailing,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon),
      title: Text(title, style: const TextStyle(fontSize: 15)),
      subtitle: Text(subtitle, style: const TextStyle(fontSize: 12)),
      trailing: trailing ?? const Icon(Icons.chevron_right),
      onTap: onTap,
      contentPadding: EdgeInsets.zero,
    );
  }
}
