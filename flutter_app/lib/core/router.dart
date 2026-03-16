import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../providers/connectivity_provider.dart';
import '../widgets/layout/app_shell.dart';
import '../screens/home/home_screen.dart';
import '../screens/search/search_screen.dart';
import '../screens/shelves/shelves_screen.dart';
import '../screens/downloads/downloads_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../screens/book_detail/book_detail_screen.dart';
import '../screens/reader/reader_screen.dart';
import '../screens/audio_player/audio_player_screen.dart';
import '../screens/offline_reader/offline_reader_screen.dart';
import '../screens/auth/auth_screen.dart';
import '../screens/auth/reset_password_screen.dart';
import '../screens/admin/admin_book_list_screen.dart';
import '../screens/admin/admin_book_form_screen.dart';
import '../screens/admin/admin_collections_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

int _getNavIndex(String location) {
  if (location.startsWith('/search')) return 1;
  if (location.startsWith('/shelves')) return 2;
  if (location.startsWith('/downloads')) return 3;
  if (location.startsWith('/profile')) return 4;
  return 0;
}

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);
  final isOnline = ref.watch(isOnlineProvider);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/',
    redirect: (context, state) {
      final isAuthenticated = authState.user != null;
      final isAuthRoute = state.matchedLocation == '/auth' ||
          state.matchedLocation == '/reset-password';
      final isOfflineRoute =
          state.matchedLocation == '/downloads' ||
          state.matchedLocation.startsWith('/offline/read/');

      // If offline, only allow downloads and offline reader
      if (!isOnline && !isOfflineRoute) {
        return '/downloads';
      }

      // If loading auth, don't redirect yet
      if (authState.loading) return null;

      // If not authenticated and not on auth route, redirect to auth
      if (!isAuthenticated && !isAuthRoute) {
        return '/auth';
      }

      // If authenticated and on auth route, redirect to home
      if (isAuthenticated && isAuthRoute) {
        return '/';
      }

      return null;
    },
    routes: [
      // Shell route for pages with bottom navigation
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) {
          return AppShell(
            currentIndex: _getNavIndex(state.matchedLocation),
            child: child,
          );
        },
        routes: [
          GoRoute(
            path: '/',
            builder: (context, state) => const HomeScreen(),
          ),
          GoRoute(
            path: '/search',
            builder: (context, state) => const SearchScreen(),
          ),
          GoRoute(
            path: '/shelves',
            builder: (context, state) => const ShelvesScreen(),
          ),
          GoRoute(
            path: '/downloads',
            builder: (context, state) => const DownloadsScreen(),
          ),
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfileScreen(),
          ),
        ],
      ),
      // Standalone routes (no bottom nav)
      GoRoute(
        path: '/book/:id',
        builder: (context, state) => BookDetailScreen(
          bookId: state.pathParameters['id']!,
        ),
      ),
      GoRoute(
        path: '/book/:id/read',
        builder: (context, state) => ReaderScreen(
          bookId: state.pathParameters['id']!,
        ),
      ),
      GoRoute(
        path: '/book/:id/listen',
        builder: (context, state) => AudioPlayerScreen(
          bookId: state.pathParameters['id']!,
        ),
      ),
      GoRoute(
        path: '/offline/read/:id',
        builder: (context, state) => OfflineReaderScreen(
          bookId: state.pathParameters['id']!,
        ),
      ),
      // Auth
      GoRoute(
        path: '/auth',
        builder: (context, state) => const AuthScreen(),
      ),
      GoRoute(
        path: '/reset-password',
        builder: (context, state) => const ResetPasswordScreen(),
      ),
      // Admin
      GoRoute(
        path: '/admin/books',
        builder: (context, state) => const AdminBookListScreen(),
      ),
      GoRoute(
        path: '/admin/book/new',
        builder: (context, state) => const AdminBookFormScreen(),
      ),
      GoRoute(
        path: '/admin/book/:id/edit',
        builder: (context, state) => AdminBookFormScreen(
          bookId: state.pathParameters['id'],
        ),
      ),
      GoRoute(
        path: '/admin/collections',
        builder: (context, state) => const AdminCollectionsScreen(),
      ),
    ],
  );
});
