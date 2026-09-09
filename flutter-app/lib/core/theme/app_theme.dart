import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Pure White & Royal Blue Brand Palette
  static const Color primaryBlue = Color(0xFF1E3A8A); // Deep Royal Blue
  static const Color secondaryBlue = Color(0xFF2563EB); // Vibrant Accent Blue
  static const Color lightBlueBg = Color(0xFFEFF6FF); // Soft Tint Blue
  static const Color pureWhite = Color(0xFFFFFFFF);
  static const Color surfaceWhite = Color(0xFFF8FAFC);

  // Text Colors
  static const Color textDarkPrimary = Color(0xFF0F172A); // Black / Dark Navy for Light theme
  static const Color textDarkSecondary = Color(0xFF334155);
  static const Color textLightPrimary = Color(0xFFFFFFFF); // White for Dark theme
  static const Color textLightSecondary = Color(0xFFCBD5E1);
  static const Color textMuted = Color(0xFF64748B);
  static const Color borderLight = Color(0xFFE2E8F0);
  static const Color borderDark = Color(0xFF334155);

  // System Status
  static const Color success = Color(0xFF10B981);
  static const Color error = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);

  // Static compatibility aliases
  static const Color amber = primaryBlue;
  static const Color darkBg = Color(0xFF0F172A);
  static const Color bgDark = Color(0xFF0F172A);
  static const Color bgCard = pureWhite;
  static const Color bgCardLight = lightBlueBg;
  static const Color textPrimaryCol = textDarkPrimary;
  static const Color textSecondary = textDarkSecondary;
  static const Color textSecondaryCol = textDarkSecondary;
  static const Color textMutedColor = textMuted;
  static const Color borderColor = borderLight;

  // Context-aware getters (black for light theme, white/sky blue for dark theme)
  static Color bgOf(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? darkBg : pureWhite;

  static Color cardBgOf(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E293B) : pureWhite;

  static Color cardBgLightOf(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E293B) : lightBlueBg;

  static Color textPrimaryOf(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? textLightPrimary : textDarkPrimary;

  static Color textSecondaryOf(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? textLightSecondary : textDarkSecondary;

  static Color textMutedOf(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? const Color(0xFF94A3B8) : textMuted;

  static Color primaryOf(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? const Color(0xFF60A5FA) : primaryBlue;

  static Color borderOf(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? borderDark : borderLight;

  // Global Pure White & Royal Blue Light Theme (Black Font Color)
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: pureWhite,
      colorScheme: const ColorScheme.light(
        primary: primaryBlue,
        secondary: secondaryBlue,
        surface: pureWhite,
        onSurface: textDarkPrimary,
        onPrimary: pureWhite,
        error: error,
      ),
      textTheme: GoogleFonts.outfitTextTheme(ThemeData.light().textTheme).copyWith(
        displayLarge: GoogleFonts.outfit(fontSize: 32, fontWeight: FontWeight.w900, color: textDarkPrimary),
        displayMedium: GoogleFonts.outfit(fontSize: 26, fontWeight: FontWeight.w800, color: textDarkPrimary),
        headlineLarge: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w800, color: textDarkPrimary),
        headlineMedium: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700, color: textDarkPrimary),
        titleLarge: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: textDarkPrimary),
        bodyLarge: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w400, color: textDarkPrimary),
        bodyMedium: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w400, color: textDarkSecondary),
        bodySmall: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w400, color: textMuted),
        labelLarge: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w700, color: primaryBlue, letterSpacing: 0.8),
      ),
      cardTheme: CardThemeData(
        color: pureWhite,
        elevation: 2,
        shadowColor: primaryBlue.withValues(alpha: 0.08),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: borderLight, width: 1),
        ),
        margin: EdgeInsets.zero,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: pureWhite,
        foregroundColor: primaryBlue,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w800, color: primaryBlue),
        toolbarHeight: 64,
        surfaceTintColor: Colors.transparent,
        iconTheme: const IconThemeData(color: primaryBlue),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: pureWhite,
        indicatorColor: primaryBlue.withValues(alpha: 0.1),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          return GoogleFonts.outfit(
            fontSize: 11,
            fontWeight: states.contains(WidgetState.selected) ? FontWeight.w700 : FontWeight.w500,
            color: states.contains(WidgetState.selected) ? primaryBlue : textMuted,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          return IconThemeData(
            color: states.contains(WidgetState.selected) ? primaryBlue : textMuted,
            size: 22,
          );
        }),
        height: 64,
        elevation: 2,
        surfaceTintColor: Colors.transparent,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceWhite,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: borderLight)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: borderLight)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: primaryBlue, width: 2)),
        errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: error)),
        hintStyle: GoogleFonts.outfit(fontSize: 13, color: textMuted),
        labelStyle: GoogleFonts.outfit(fontSize: 13, color: textDarkSecondary),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryBlue,
          foregroundColor: pureWhite,
          elevation: 2,
          shadowColor: primaryBlue.withValues(alpha: 0.3),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          textStyle: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w800),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: lightBlueBg,
        selectedColor: primaryBlue.withValues(alpha: 0.15),
        labelStyle: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w600, color: primaryBlue),
        side: const BorderSide(color: borderLight),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      ),
      dividerTheme: const DividerThemeData(color: borderLight, thickness: 1),
    );
  }

  // Dark Theme with White Font Colors & Luminous High Contrast Accents
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: darkBg,
      colorScheme: const ColorScheme.dark(
        primary: Color(0xFF60A5FA),
        secondary: Color(0xFF93C5FD),
        surface: Color(0xFF1E293B),
        onSurface: textLightPrimary,
        onPrimary: pureWhite,
        error: error,
      ),
      textTheme: GoogleFonts.outfitTextTheme(ThemeData.dark().textTheme).copyWith(
        displayLarge: GoogleFonts.outfit(fontSize: 32, fontWeight: FontWeight.w900, color: textLightPrimary),
        displayMedium: GoogleFonts.outfit(fontSize: 26, fontWeight: FontWeight.w800, color: textLightPrimary),
        headlineLarge: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w800, color: textLightPrimary),
        headlineMedium: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700, color: textLightPrimary),
        titleLarge: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w700, color: textLightPrimary),
        bodyLarge: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w400, color: textLightPrimary),
        bodyMedium: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w400, color: textLightSecondary),
        bodySmall: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w400, color: const Color(0xFF94A3B8)),
        labelLarge: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w700, color: const Color(0xFF60A5FA), letterSpacing: 0.8),
      ),
      cardTheme: CardThemeData(
        color: const Color(0xFF1E293B),
        elevation: 2,
        shadowColor: Colors.black.withValues(alpha: 0.3),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: borderDark, width: 1),
        ),
        margin: EdgeInsets.zero,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: darkBg,
        foregroundColor: pureWhite,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w800, color: pureWhite),
        toolbarHeight: 64,
        surfaceTintColor: Colors.transparent,
        iconTheme: const IconThemeData(color: pureWhite),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: const Color(0xFF1E293B),
        indicatorColor: const Color(0xFF60A5FA).withValues(alpha: 0.2),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          return GoogleFonts.outfit(
            fontSize: 11,
            fontWeight: states.contains(WidgetState.selected) ? FontWeight.w700 : FontWeight.w500,
            color: states.contains(WidgetState.selected) ? const Color(0xFF60A5FA) : const Color(0xFF94A3B8),
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          return IconThemeData(
            color: states.contains(WidgetState.selected) ? const Color(0xFF60A5FA) : const Color(0xFF94A3B8),
            size: 22,
          );
        }),
        height: 64,
        elevation: 2,
        surfaceTintColor: Colors.transparent,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFF1E293B),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: borderDark)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: borderDark)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFF60A5FA), width: 2)),
        errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: error)),
        hintStyle: GoogleFonts.outfit(fontSize: 13, color: const Color(0xFF94A3B8)),
        labelStyle: GoogleFonts.outfit(fontSize: 13, color: textLightSecondary),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF2563EB),
          foregroundColor: pureWhite,
          elevation: 2,
          shadowColor: const Color(0xFF2563EB).withValues(alpha: 0.3),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          textStyle: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w800),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: const Color(0xFF1E293B),
        selectedColor: const Color(0xFF60A5FA).withValues(alpha: 0.25),
        labelStyle: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w600, color: pureWhite),
        side: const BorderSide(color: borderDark),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      ),
      dividerTheme: const DividerThemeData(color: borderDark, thickness: 1),
    );
  }
}

class AppColors {
  static const Color primaryBlue = AppTheme.primaryBlue;
  static const Color secondaryBlue = AppTheme.secondaryBlue;
  static const Color lightBlueBackground = AppTheme.lightBlueBg;
  static const Color textPrimary = AppTheme.textDarkPrimary;
  static const Color textSecondary = AppTheme.textDarkSecondary;
  static const Color textMuted = AppTheme.textMuted;
  static const Color border = AppTheme.borderLight;
  static const Color success = AppTheme.success;
  static const Color error = AppTheme.error;

  static Color primaryOf(BuildContext context) => AppTheme.primaryOf(context);
  static Color textPrimaryOf(BuildContext context) => AppTheme.textPrimaryOf(context);
  static Color textSecondaryOf(BuildContext context) => AppTheme.textSecondaryOf(context);
  static Color textMutedOf(BuildContext context) => AppTheme.textMutedOf(context);
  static Color bgOf(BuildContext context) => AppTheme.bgOf(context);
  static Color cardBgOf(BuildContext context) => AppTheme.cardBgOf(context);
  static Color borderOf(BuildContext context) => AppTheme.borderOf(context);
}

