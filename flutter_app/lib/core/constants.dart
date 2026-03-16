const String supabaseUrl = 'https://zouwipenozdyquvfyjzi.supabase.co';
const String supabaseAnonKey =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvdXdpcGVub3pkeXF1dmZ5anppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDYxMzAsImV4cCI6MjA4OTA4MjEzMH0.rNL_nH--2ZWnHfnZwPxds9ADjx54XzglP_1ka6F0Rjw';

const int freeReadsLimit = 5;
const int freeHighlightsLimit = 10;
const int defaultStorageLimitMb = 500;
const int minStorageLimitMb = 100;
const int maxStorageLimitMb = 2000;

const List<String> bookCategories = [
  'Бизнес',
  'Психология',
  'Продуктивность',
  'Здоровье',
  'Лидерство',
  'Финансы',
  'Наука',
  'Саморазвитие',
];

class HighlightColor {
  final String key;
  final int hex;
  final int bgHex;

  const HighlightColor({
    required this.key,
    required this.hex,
    required this.bgHex,
  });
}

const List<HighlightColor> highlightColors = [
  HighlightColor(key: 'yellow', hex: 0xFFF59E0B, bgHex: 0x26F59E0B),
  HighlightColor(key: 'green', hex: 0xFF10B981, bgHex: 0x2610B981),
  HighlightColor(key: 'blue', hex: 0xFF3B82F6, bgHex: 0x263B82F6),
  HighlightColor(key: 'pink', hex: 0xFFEC4899, bgHex: 0x26EC4899),
  HighlightColor(key: 'purple', hex: 0xFF8B5CF6, bgHex: 0x268B5CF6),
];

const String defaultHighlightColor = 'yellow';

HighlightColor getHighlightColor(String? key) {
  return highlightColors.firstWhere(
    (c) => c.key == key,
    orElse: () => highlightColors[0],
  );
}
