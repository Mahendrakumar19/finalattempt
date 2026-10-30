import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Apple SF Pro & Inter cross-platform typography system
  // On iOS/macOS: uses native SF Pro Display/Text via system-ui
  // On Android/Web: uses Inter (metrically identical to SF Pro) with Noto Sans Devanagari fallback
  static TextStyle fontApple({
    double? fontSize,
    FontWeight? fontWeight,
    Color? color,
    double? letterSpacing,
    double? height,
  }) {
    // Apple WWDC Typography rule: optical tracking (negative for large titles, positive for small captions)
    final autoTracking = letterSpacing ??
        (fontSize != null
            ? (fontSize >= 28
                ? -0.6
                : fontSize >= 20
                    ? -0.4
                    : fontSize >= 16
                        ? -0.2
                        : fontSize <= 11
                            ? 0.3
                            : 0.0)
            : 0.0);

    // Apple WWDC Typography rule: inverse leading (tight leading on large headings, comfortable on body)
    final autoHeight = height ??
        (fontSize != null
            ? (fontSize >= 24 ? 1.18 : (fontSize >= 16 ? 1.25 : 1.4))
            : null);

    if (kIsWeb) {
      return TextStyle(
        fontFamily: '-apple-system',
        fontFamilyFallback: const [
          'BlinkMacSystemFont',
          'SF Pro Display',
          'SF Pro Text',
          'Inter',
          'Segoe UI',
          'Roboto',
          'Noto Sans Devanagari',
          'sans-serif',
        ],
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: color,
        letterSpacing: autoTracking,
        height: autoHeight,
      );
    }

    return GoogleFonts.inter(
      fontSize: fontSize,
      fontWeight: fontWeight,
      color: color,
      letterSpacing: autoTracking,
      height: autoHeight,
    );
  }

  // Alias for backwards compatibility across existing widgets
  static TextStyle fontOutfit({
    double? fontSize,
    FontWeight? fontWeight,
    Color? color,
    double? letterSpacing,
    double? height,
  }) =>
      fontApple(
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: color,
        letterSpacing: letterSpacing,
        height: height,
      );

  static TextTheme _buildTextTheme(ThemeData base, Color primaryColor, Color secondaryColor, Color mutedColor) {
    if (kIsWeb) {
      return base.textTheme.apply(fontFamily: '-apple-system').copyWith(
        displayLarge: fontApple(fontSize: 32, fontWeight: FontWeight.w800, color: primaryColor),
        displayMedium: fontApple(fontSize: 26, fontWeight: FontWeight.w700, color: primaryColor),
        headlineLarge: fontApple(fontSize: 22, fontWeight: FontWeight.w700, color: primaryColor),
        headlineMedium: fontApple(fontSize: 18, fontWeight: FontWeight.w600, color: primaryColor),
        titleLarge: fontApple(fontSize: 16, fontWeight: FontWeight.w600, color: primaryColor),
        bodyLarge: fontApple(fontSize: 14, fontWeight: FontWeight.w400, color: primaryColor),
        bodyMedium: fontApple(fontSize: 13, fontWeight: FontWeight.w400, color: secondaryColor),
        bodySmall: fontApple(fontSize: 11, fontWeight: FontWeight.w400, color: mutedColor),
        labelLarge: fontApple(fontSize: 12, fontWeight: FontWeight.w600, color: primaryColor),
      );
    }
    return GoogleFonts.interTextTheme(base.textTheme).copyWith(
      displayLarge: fontApple(fontSize: 32, fontWeight: FontWeight.w800, color: primaryColor),
      displayMedium: fontApple(fontSize: 26, fontWeight: FontWeight.w700, color: primaryColor),
      headlineLarge: fontApple(fontSize: 22, fontWeight: FontWeight.w700, color: primaryColor),
      headlineMedium: fontApple(fontSize: 18, fontWeight: FontWeight.w600, color: primaryColor),
      titleLarge: fontApple(fontSize: 16, fontWeight: FontWeight.w600, color: primaryColor),
      bodyLarge: fontApple(fontSize: 14, fontWeight: FontWeight.w400, color: primaryColor),
      bodyMedium: fontApple(fontSize: 13, fontWeight: FontWeight.w400, color: secondaryColor),
      bodySmall: fontApple(fontSize: 11, fontWeight: FontWeight.w400, color: mutedColor),
      labelLarge: fontApple(fontSize: 12, fontWeight: FontWeight.w600, color: primaryColor),
    );
  }

  // Pure White & Royal Blue Brand Palette
  static const Color primaryBlue = Color(0xFF1E3A8A); // Deep Royal Blue
  static const Color secondaryBlue = Color(0xFF2563EB); // Vibrant Accent Blue
  static const Color lightBlueBg = Color(0xFFEFF6FF); // Soft Tint Blue
  static const Color pureWhite = Color(0xFFFFFFFF);
  static const Color surfaceWhite = Color(0xFFF8FAFC);

  // Text Colors
  static const Color textDarkPrimary = Color(0xFF0F172A); // Black / Dark Navy for Light theme
  static const Color textDarkSecondary = Color(0xFF334155);
  static const Color textLightPrimary = Color(0xFFF8FAFC); // High clarity crisp white
  static const Color textLightSecondary = Color(0xFF94A3B8); // High contrast secondary
  static const Color textMuted = Color(0xFF64748B);
  static const Color borderLight = Color(0xFFE2E8F0);
  static const Color borderDark = Color(0xFF1E293B); // Deep refined dark border

  // System Status
  static const Color success = Color(0xFF10B981);
  static const Color error = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);

  // Static compatibility aliases — Premium Deep Dark Palette (Pitch Black 0x050811 / Deep Obsidian 0x0B1120)
  static const Color amber = primaryBlue;
  static const Color darkBg = Color(0xFF030712); // True deep midnight black (Pitch OLED grade)
  static const Color bgDark = Color(0xFF030712);
  static const Color darkCardBg = Color(0xFF0B132B); // Obsidian slate elevated card surface
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
      Theme.of(context).brightness == Brightness.dark ? const Color(0xFF0B1120) : pureWhite;

  static Color cardBgLightOf(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? const Color(0xFF111827) : lightBlueBg;

  static Color textPrimaryOf(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? textLightPrimary : textDarkPrimary;

  static Color textSecondaryOf(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? textLightSecondary : textDarkSecondary;

  static Color textMutedOf(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? const Color(0xFF64748B) : textMuted;

  static Color primaryOf(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? const Color(0xFF38BDF8) : primaryBlue;

  static Color borderOf(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1E293B) : borderLight;

  // iOS Glass & Container Helper System
  static BoxDecoration glassDecoration(
    BuildContext context, {
    double radius = 24,
    bool isSelected = false,
    Color? customBorderColor,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return BoxDecoration(
      gradient: LinearGradient(
        colors: isDark
            ? [
                Colors.white.withValues(alpha: isSelected ? 0.25 : 0.10),
                Colors.white.withValues(alpha: isSelected ? 0.12 : 0.04),
              ]
            : [
                Colors.white.withValues(alpha: isSelected ? 0.95 : 0.65),
                Colors.white.withValues(alpha: isSelected ? 0.60 : 0.35),
              ],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      borderRadius: BorderRadius.circular(radius),
      border: Border.all(
        color: customBorderColor ??
            (isDark
                ? Colors.white.withValues(alpha: isSelected ? 0.40 : 0.18)
                : Colors.white.withValues(alpha: isSelected ? 0.85 : 0.60)),
        width: isSelected ? 1.2 : 1.0,
      ),
      boxShadow: [
        BoxShadow(
          color: const Color(0xFF2563EB).withValues(alpha: isDark ? 0.20 : 0.10),
          blurRadius: 16,
          spreadRadius: -2,
          offset: const Offset(0, 4),
        ),
      ],
    );
  }

  static BoxDecoration iOSCardDecoration(
    BuildContext context, {
    double radius = 20,
    bool showBorder = true,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return BoxDecoration(
      color: cardBgOf(context),
      borderRadius: BorderRadius.circular(radius),
      border: showBorder
          ? Border.all(
              color: isDark
                  ? Colors.white.withValues(alpha: 0.10)
                  : borderLight.withValues(alpha: 0.80),
              width: 1,
            )
          : null,
      boxShadow: [
        BoxShadow(
          color: Colors.black.withValues(alpha: isDark ? 0.30 : 0.04),
          blurRadius: 12,
          offset: const Offset(0, 3),
        ),
      ],
    );
  }

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
      textTheme: _buildTextTheme(ThemeData.light(), textDarkPrimary, textDarkSecondary, textMuted),
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
        titleTextStyle: fontOutfit(fontSize: 18, fontWeight: FontWeight.w800, color: primaryBlue),
        toolbarHeight: 64,
        surfaceTintColor: Colors.transparent,
        iconTheme: const IconThemeData(color: primaryBlue),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: pureWhite,
        indicatorColor: primaryBlue.withValues(alpha: 0.1),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          return fontOutfit(
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
        hintStyle: fontOutfit(fontSize: 13, color: textMuted),
        labelStyle: fontOutfit(fontSize: 13, color: textDarkSecondary),
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
          textStyle: fontOutfit(fontSize: 14, fontWeight: FontWeight.w800),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: lightBlueBg,
        selectedColor: primaryBlue.withValues(alpha: 0.15),
        labelStyle: fontOutfit(fontSize: 11, fontWeight: FontWeight.w600, color: primaryBlue),
        side: const BorderSide(color: borderLight),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      ),
      dividerTheme: const DividerThemeData(color: borderLight, thickness: 1),
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: CupertinoPageTransitionsBuilder(),
          TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
          TargetPlatform.windows: CupertinoPageTransitionsBuilder(),
          TargetPlatform.macOS: CupertinoPageTransitionsBuilder(),
          TargetPlatform.linux: CupertinoPageTransitionsBuilder(),
        },
      ),
    );
  }

  // Dark Theme with Deep Midnight Black, Obsidian Glass Cards & Luminous Accents
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: darkBg,
      colorScheme: const ColorScheme.dark(
        primary: Color(0xFF38BDF8),
        secondary: Color(0xFF60A5FA),
        surface: Color(0xFF0B1120),
        onSurface: textLightPrimary,
        onPrimary: Color(0xFF030712),
        error: error,
      ),
      textTheme: _buildTextTheme(ThemeData.dark(), textLightPrimary, textLightSecondary, const Color(0xFF64748B)),
      cardTheme: CardThemeData(
        color: const Color(0xFF0B1120),
        elevation: 0,
        shadowColor: Colors.black.withValues(alpha: 0.6),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Color(0xFF1E293B), width: 1),
        ),
        margin: EdgeInsets.zero,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: darkBg,
        foregroundColor: textLightPrimary,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: fontOutfit(fontSize: 18, fontWeight: FontWeight.w800, color: textLightPrimary),
        toolbarHeight: 64,
        surfaceTintColor: Colors.transparent,
        iconTheme: const IconThemeData(color: textLightPrimary),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: const Color(0xFF0B1120),
        indicatorColor: const Color(0xFF38BDF8).withValues(alpha: 0.16),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          return fontOutfit(
            fontSize: 11,
            fontWeight: states.contains(WidgetState.selected) ? FontWeight.w700 : FontWeight.w500,
            color: states.contains(WidgetState.selected) ? const Color(0xFF38BDF8) : const Color(0xFF64748B),
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          return IconThemeData(
            color: states.contains(WidgetState.selected) ? const Color(0xFF38BDF8) : const Color(0xFF64748B),
            size: 22,
          );
        }),
        height: 64,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFF0B1120),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFF1E293B))),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFF1E293B))),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFF38BDF8), width: 1.8)),
        errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: error)),
        hintStyle: fontOutfit(fontSize: 13, color: const Color(0xFF64748B)),
        labelStyle: fontOutfit(fontSize: 13, color: textLightSecondary),
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
          textStyle: fontOutfit(fontSize: 14, fontWeight: FontWeight.w800),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: const Color(0xFF1E293B),
        selectedColor: const Color(0xFF60A5FA).withValues(alpha: 0.25),
        labelStyle: fontOutfit(fontSize: 11, fontWeight: FontWeight.w600, color: pureWhite),
        side: const BorderSide(color: borderDark),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      ),
      dividerTheme: const DividerThemeData(color: borderDark, thickness: 1),
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: CupertinoPageTransitionsBuilder(),
          TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
          TargetPlatform.windows: CupertinoPageTransitionsBuilder(),
          TargetPlatform.macOS: CupertinoPageTransitionsBuilder(),
          TargetPlatform.linux: CupertinoPageTransitionsBuilder(),
        },
      ),
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

