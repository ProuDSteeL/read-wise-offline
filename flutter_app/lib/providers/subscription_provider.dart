import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/profile.dart';
import '../services/supabase_service.dart';
import 'auth_provider.dart';

final profileProvider = FutureProvider<Profile?>((ref) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) return null;

  final data = await SupabaseService.client
      .from('profiles')
      .select()
      .eq('user_id', user.id)
      .maybeSingle();

  return data != null ? Profile.fromJson(data) : null;
});

final isProProvider = Provider<bool>((ref) {
  final profile = ref.watch(profileProvider).valueOrNull;
  return profile?.isPro ?? false;
});
