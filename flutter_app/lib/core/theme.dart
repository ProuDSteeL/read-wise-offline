import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  static ThemeData get light {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: ColorScheme.fromSeed(
        seedColor: const Color(0xFF6366F1), // Indigo
        brightness: Brightness.light,
      ),
      textTheme: GoogleFonts.interTextTheme(),
      appBarTheme: const AppBarTheme(
        centerTitle: true,
        elevation: 0,
        scrolledUnderElevation: 0.5,
      ),
      cardTheme: CardTheme(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: Colors.grey.shade200),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.grey.shade50,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF6366F1), width: 2),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        type: BottomNavigationBarType.fixed,
        showUnselectedLabels: true,
        selectedLabelStyle: TextStyle(fontSize: 12),
        unselectedLabelStyle: TextStyle(fontSize: 12),
      ),
    );
  }

  // Reader themes
  static const readerLight = ReaderTheme(
    name: 'Светлая',
    backgroundColor: Colors.white,
    textColor: Color(0xFF1A1A2E),
    secondaryTextColor: Color(0xFF6B7280),
  );

  static const readerDark = ReaderTheme(
    name: 'Тёмная',
    backgroundColor: Color(0xFF1A1A2E),
    textColor: Color(0xFFE5E7EB),
    secondaryTextColor: Color(0xFF9CA3AF),
  );

  static const readerSepia = ReaderTheme(
    name: 'Сепия',
    backgroundColor: Color(0xFFF4ECD8),
    textColor: Color(0xFF3E2723),
    secondaryTextColor: Color(0xFF795548),
  );

  static const List<ReaderTheme> readerThemes = [
    readerLight,
    readerDark,
    readerSepia,
  ];
}

class ReaderTheme {
  final String name;
  final Color backgroundColor;
  final Color textColor;
  final Color secondaryTextColor;

  const ReaderTheme({
    required this.name,
    required this.backgroundColor,
    required this.textColor,
    required this.secondaryTextColor,
  });
}
