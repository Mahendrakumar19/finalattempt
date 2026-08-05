import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Brand Colors
  static const Color amber = Color(0xFFF59E0B);
  static const Color amberDark = Color(0xFFD97706);

  // Dark Theme Palette
  static const Color darkBg = Color(0xFF020617);
  static const Color darkCard = Color(0xFF0F172A);
  static const Color darkCardLight = Color(0xFF1E293B);
  static const Color darkTextPrimary = Color(0xFFFFFFFF);
  static const Color darkTextSecondary = Color(0xFF94A3B8);
  static const Color darkTextMuted = Color(0xFF64748B);
  static const Color darkBorder = Color(0xFF1E293B);

  // Legacy static aliases pointing to Dark values for static widget compatibility
  static const Color bgDark = darkBg;
  static const Color bgCard = darkCard;
  static const Color bgCardLight = darkCardLight;
  static const Color textPrimaryCol = darkTextPrimary;
  static const Color textSecondary = darkTextSecondary;
  static const Color textSecondaryCol = darkTextSecondary;
  static const Color textMuted = darkTextMuted;
  static const Color textMutedColor = darkTextMuted;
  static const Color borderColor = darkBorder;

  // Light Theme Palette
  static const Color lightBg = Color(0xFFF8FAFC);
  static const Color lightCard = Color(0xFFFFFFFF);
  static const Color lightCardLight = Color(0xFFF1F5F9);
  static const Color lightTextPrimary = Color(0xFF0F172A);
  static const Color lightTextSecondary = Color(0xFF475569);
  static const Color lightTextMuted = Color(0xFF64748B);
  static const Color lightBorder = Color(0xFFE2E8F0);

  static const Color success = Color(0xFF10B981);
  static const Color error = Color(0xFFEF4444);

  // Context-aware color dynamic getters based on theme mode
  static Color bgOf(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? darkBg : lightBg;

  static Color cardBgOf(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? darkCard : lightCard;

  static Color cardBgLightOf(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? darkCardLight : lightCardLight;

  static Color textPrimaryOf(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? darkTextPrimary : lightTextPrimary;

  static Color textSecondaryOf(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? darkTextSecondary : lightTextSecondary;

  static Color textMutedOf(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? darkTextMuted : lightTextMuted;

  static Color borderOf(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? darkBorder : lightBorder;

  // Dark Theme Definition
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: darkBg,
      colorScheme: const ColorScheme.dark(
        primary: amber,
        secondary: amberDark,
        surface: darkCard,
        onSurface: darkTextPrimary,
        onPrimary: darkBg,
        error: error,
      ),
      textTheme: GoogleFonts.outfitTextTheme(ThemeData.dark().textTheme).copyWith(
        displayLarge: GoogleFonts.outfit(fontSize: 32, fontWeight: FontWeight.w900, color: darkTextPrimary),
        displayMedium: GoogleFonts.outfit(fontSize: 26, fontWeight: FontWeight.w800, color: darkTextPrimary),
        headlineLarge: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w800, color: darkTextPrimary),
        headlineMedium: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700, color: darkTextPrimary),
        titleLarge: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: darkTextPrimary),
        bodyLarge: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w400, color: darkTextPrimary),
        bodyMedium: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w400, color: darkTextSecondary),
        bodySmall: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w400, color: darkTextMuted),
        labelLarge: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w700, color: amber, letterSpacing: 0.8),
      ),
      cardTheme: CardThemeData(
        color: darkCard,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: darkBorder, width: 1),
        ),
        margin: EdgeInsets.zero,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: darkBg,
        foregroundColor: darkTextPrimary,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w800, color: darkTextPrimary),
        toolbarHeight: 64,
        surfaceTintColor: Colors.transparent,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: darkCard,
        indicatorColor: amber.withOpacity(0.15),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          return GoogleFonts.outfit(
            fontSize: 11,
            fontWeight: states.contains(WidgetState.selected) ? FontWeight.w700 : FontWeight.w500,
            color: states.contains(WidgetState.selected) ? amber : darkTextMuted,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          return IconThemeData(
            color: states.contains(WidgetState.selected) ? amber : darkTextMuted,
            size: 22,
          );
        }),
        height: 64,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: darkCardLight,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: darkBorder)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: darkBorder)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: amber, width: 1.5)),
        errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: error)),
        hintStyle: GoogleFonts.outfit(fontSize: 13, color: darkTextMuted),
        labelStyle: GoogleFonts.outfit(fontSize: 13, color: darkTextSecondary),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: amber,
          foregroundColor: darkBg,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          textStyle: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w800),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: darkCardLight,
        selectedColor: amber.withOpacity(0.2),
        labelStyle: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w600),
        side: const BorderSide(color: darkBorder),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      ),
      dividerTheme: const DividerThemeData(color: darkBorder, thickness: 1),
    );
  }

  // Light Theme Definition
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: lightBg,
      colorScheme: const ColorScheme.light(
        primary: amberDark,
        secondary: amber,
        surface: lightCard,
        onSurface: lightTextPrimary,
        onPrimary: Colors.white,
        error: error,
      ),
      textTheme: GoogleFonts.outfitTextTheme(ThemeData.light().textTheme).copyWith(
        displayLarge: GoogleFonts.outfit(fontSize: 32, fontWeight: FontWeight.w900, color: lightTextPrimary),
        displayMedium: GoogleFonts.outfit(fontSize: 26, fontWeight: FontWeight.w800, color: lightTextPrimary),
        headlineLarge: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w800, color: lightTextPrimary),
        headlineMedium: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700, color: lightTextPrimary),
        titleLarge: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: lightTextPrimary),
        bodyLarge: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w400, color: lightTextPrimary),
        bodyMedium: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w400, color: lightTextSecondary),
        bodySmall: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w400, color: lightTextMuted),
        labelLarge: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w700, color: amberDark, letterSpacing: 0.8),
      ),
      cardTheme: CardThemeData(
        color: lightCard,
        elevation: 1,
        shadowColor: Colors.black.withOpacity(0.05),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: lightBorder, width: 1),
        ),
        margin: EdgeInsets.zero,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: lightBg,
        foregroundColor: lightTextPrimary,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w800, color: lightTextPrimary),
        toolbarHeight: 64,
        surfaceTintColor: Colors.transparent,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: lightCard,
        indicatorColor: amberDark.withOpacity(0.12),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          return GoogleFonts.outfit(
            fontSize: 11,
            fontWeight: states.contains(WidgetState.selected) ? FontWeight.w700 : FontWeight.w500,
            color: states.contains(WidgetState.selected) ? amberDark : lightTextMuted,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          return IconThemeData(
            color: states.contains(WidgetState.selected) ? amberDark : lightTextMuted,
            size: 22,
          );
        }),
        height: 64,
        elevation: 1,
        surfaceTintColor: Colors.transparent,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: lightCardLight,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: lightBorder)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: lightBorder)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: amberDark, width: 1.5)),
        errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: error)),
        hintStyle: GoogleFonts.outfit(fontSize: 13, color: lightTextMuted),
        labelStyle: GoogleFonts.outfit(fontSize: 13, color: lightTextSecondary),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: amberDark,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          textStyle: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w800),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: lightCardLight,
        selectedColor: amberDark.withOpacity(0.15),
        labelStyle: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w600),
        side: const BorderSide(color: lightBorder),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      ),
      dividerTheme: const DividerThemeData(color: lightBorder, thickness: 1),
    );
  }
}
