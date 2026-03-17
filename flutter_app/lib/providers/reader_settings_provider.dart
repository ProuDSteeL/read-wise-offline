import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/theme.dart';

class ReaderSettings {
  final int themeIndex;
  final double fontSize;
  final double lineHeight;

  const ReaderSettings({
    this.themeIndex = 0,
    this.fontSize = 16,
    this.lineHeight = 1.8,
  });

  ReaderTheme get theme => AppTheme.readerThemes[themeIndex];

  ReaderSettings copyWith({
    int? themeIndex,
    double? fontSize,
    double? lineHeight,
  }) {
    return ReaderSettings(
      themeIndex: themeIndex ?? this.themeIndex,
      fontSize: fontSize ?? this.fontSize,
      lineHeight: lineHeight ?? this.lineHeight,
    );
  }
}

class ReaderSettingsNotifier extends StateNotifier<ReaderSettings> {
  ReaderSettingsNotifier() : super(const ReaderSettings());

  void setTheme(int index) {
    state = state.copyWith(themeIndex: index);
  }

  void setFontSize(double size) {
    state = state.copyWith(fontSize: size.clamp(12, 28));
  }

  void increaseFontSize() {
    setFontSize(state.fontSize + 1);
  }

  void decreaseFontSize() {
    setFontSize(state.fontSize - 1);
  }

  void setLineHeight(double height) {
    state = state.copyWith(lineHeight: height.clamp(1.2, 2.5));
  }
}

final readerSettingsProvider =
    StateNotifierProvider<ReaderSettingsNotifier, ReaderSettings>((ref) {
  return ReaderSettingsNotifier();
});
