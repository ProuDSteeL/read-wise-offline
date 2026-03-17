import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/router.dart';
import 'core/theme.dart';
import 'offline/connectivity_sync_handler.dart';

class ReadWiseApp extends ConsumerWidget {
  const ReadWiseApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    ref.watch(connectivitySyncProvider);

    return MaterialApp.router(
      title: 'ReadWise Offline',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      routerConfig: router,
      locale: const Locale('ru', 'RU'),
    );
  }
}
