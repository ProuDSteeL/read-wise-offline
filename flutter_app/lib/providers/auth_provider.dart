import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart' as supabase;
import '../services/supabase_service.dart';

class AppAuthState {
  final supabase.User? user;
  final supabase.Session? session;
  final bool loading;

  const AppAuthState({
    this.user,
    this.session,
    this.loading = true,
  });

  AppAuthState copyWith({supabase.User? user, supabase.Session? session, bool? loading}) {
    return AppAuthState(
      user: user ?? this.user,
      session: session ?? this.session,
      loading: loading ?? this.loading,
    );
  }
}

class AuthNotifier extends StateNotifier<AppAuthState> {
  StreamSubscription<supabase.AuthState>? _subscription;

  AuthNotifier() : super(const AppAuthState()) {
    _init();
  }

  void _init() {
    final client = SupabaseService.client;

    // Listen to auth state changes
    _subscription = client.auth.onAuthStateChange.listen((authState) {
      state = AppAuthState(
        user: authState.session?.user,
        session: authState.session,
        loading: false,
      );
    });

    // Get initial session
    final session = client.auth.currentSession;
    state = AppAuthState(
      user: session?.user,
      session: session,
      loading: false,
    );
  }

  Future<String?> signUp({
    required String email,
    required String password,
    String? name,
  }) async {
    try {
      final client = SupabaseService.client;
      await client.auth.signUp(
        email: email,
        password: password,
        data: name != null ? {'full_name': name} : null,
      );
      return null;
    } on supabase.AuthException catch (e) {
      return e.message;
    } catch (e) {
      return e.toString();
    }
  }

  Future<String?> signIn({
    required String email,
    required String password,
  }) async {
    try {
      final client = SupabaseService.client;
      await client.auth.signInWithPassword(email: email, password: password);
      return null;
    } on supabase.AuthException catch (e) {
      return e.message;
    } catch (e) {
      return e.toString();
    }
  }

  Future<void> signOut() async {
    await SupabaseService.client.auth.signOut();
  }

  Future<String?> resetPassword(String email) async {
    try {
      await SupabaseService.client.auth.resetPasswordForEmail(email);
      return null;
    } on supabase.AuthException catch (e) {
      return e.message;
    } catch (e) {
      return e.toString();
    }
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AppAuthState>((ref) {
  return AuthNotifier();
});

// Convenience providers
final currentUserProvider = Provider<supabase.User?>((ref) {
  return ref.watch(authProvider).user;
});

final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(authProvider).user != null;
});
