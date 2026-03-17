import 'package:hive_flutter/hive_flutter.dart';

class HiveBoxes {
  static late Box<Map> books;
  static late Box<Map> summaries;
  static late Box<Map> keyIdeas;
  static late Box<Map> highlights;
  static late Box<Map> progress;
  static late Box<Map> downloadsMeta;
  static late Box<Map> pendingSync;

  static Future<void> openAll() async {
    books = await Hive.openBox<Map>('books');
    summaries = await Hive.openBox<Map>('summaries');
    keyIdeas = await Hive.openBox<Map>('key_ideas');
    highlights = await Hive.openBox<Map>('highlights');
    progress = await Hive.openBox<Map>('progress');
    downloadsMeta = await Hive.openBox<Map>('downloads_meta');
    pendingSync = await Hive.openBox<Map>('pending_sync');
  }
}
