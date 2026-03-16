import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../services/auth_service.dart';

class AuthState {
  final User? user;
  final Session? session;
  final bool loading;

  const AuthState({
    this.user,
    this.session,
    this.loading = true,
  });

  AuthState copyWith({User? user, Session? session, bool? loading}) {
    return AuthState(
      user: user ?? this.user,
      session: session ?? this.session,
      loading: loading ?? this.loading,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  StreamSubscription<AuthState>? _subscription;

  AuthNotifier() : super(const AuthState()) {
    _init();
  }

  void _init() {
    // Listen to auth state changes
    _subscription = AuthService.onAuthStateChange.listen((authState) {
      state = AuthState(
        user: authState.session?.user,
        session: authState.session,
        loading: false,
      );
    });

    // Get initial session
    final session = AuthService.currentSession;
    state = AuthState(
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
      await AuthService.signUp(
        email: email,
        password: password,
        name: name,
      );
      return null;
    } on AuthException catch (e) {
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
      await AuthService.signIn(email: email, password: password);
      return null;
    } on AuthException catch (e) {
      return e.message;
    } catch (e) {
      return e.toString();
    }
  }

  Future<void> signOut() async {
    await AuthService.signOut();
  }

  Future<String?> resetPassword(String email) async {
    try {
      await AuthService.resetPassword(email);
      return null;
    } on AuthException catch (e) {
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

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});

// Convenience providers
final currentUserProvider = Provider<User?>((ref) {
  return ref.watch(authProvider).user;
});

final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(authProvider).user != null;
});
