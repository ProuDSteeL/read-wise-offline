import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'offline/hive_boxes.dart';
import 'services/supabase_service.dart';
import 'app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SupabaseService.initialize();
  await Hive.initFlutter();
  await HiveBoxes.openAll();
  runApp(const ProviderScope(child: ReadWiseApp()));
}
