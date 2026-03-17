import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/supabase_service.dart';
import '../core/constants.dart';

final categoriesProvider =
    AsyncNotifierProvider<CategoriesNotifier, List<String>>(
  CategoriesNotifier.new,
);

class CategoriesNotifier extends AsyncNotifier<List<String>> {
  @override
  Future<List<String>> build() => _fetch();

  Future<List<String>> _fetch() async {
    try {
      final data = await SupabaseService.client
          .from('categories')
          .select('name')
          .order('name');
      final names =
          (data as List).map((e) => e['name'] as String).toList();
      return names.isNotEmpty ? names : List.from(bookCategories);
    } catch (_) {
      return List.from(bookCategories);
    }
  }

  Future<void> addCategory(String name) async {
    await SupabaseService.client
        .from('categories')
        .insert({'name': name.trim()});
    ref.invalidateSelf();
  }

  Future<void> deleteCategory(String name) async {
    await SupabaseService.client
        .from('categories')
        .delete()
        .eq('name', name);
    ref.invalidateSelf();
  }

  Future<void> renameCategory(String oldName, String newName) async {
    await SupabaseService.client
        .from('categories')
        .update({'name': newName.trim()}).eq('name', oldName);
    ref.invalidateSelf();
  }
}
