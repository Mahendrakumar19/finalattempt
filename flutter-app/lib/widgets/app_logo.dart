import 'package:flutter/material.dart';

/// Reusable AppLogo widget that renders the official Final Attempt logo
/// according to the theme mode (light vs dark background).
class AppLogo extends StatelessWidget {
  final double height;
  final BoxFit fit;
  final bool? isDark;

  const AppLogo({
    super.key,
    this.height = 76,
    this.fit = BoxFit.contain,
    this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final useDarkMode = isDark ?? (Theme.of(context).brightness == Brightness.dark);

    // Use logo_light.png for dark theme, and logo_dark.png for light theme
    final primaryPath = useDarkMode
        ? 'assets/images/logo_light.png'
        : 'assets/images/logo_dark.png';

    final fallbackPath = useDarkMode
        ? 'assets/images/darklogofull.png'
        : 'assets/images/auth_screen_logo.png';

    return Image.asset(
      primaryPath,
      height: height,
      fit: fit,
      errorBuilder: (context, error, stackTrace) {
        return Image.asset(
          fallbackPath,
          height: height,
          fit: fit,
          errorBuilder: (context, error, stackTrace) {
            return Image.asset(
              'assets/images/logo.png',
              height: height,
              fit: fit,
              errorBuilder: (context, error, stackTrace) {
                return Image.asset(
                  'assets/images/favicon.png',
                  height: height * 0.85,
                  fit: fit,
                );
              },
            );
          },
        );
      },
    );
  }
}
