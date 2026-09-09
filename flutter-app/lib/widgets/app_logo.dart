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

    final primaryPath = useDarkMode
        ? 'assets/images/Logo for dark bg.png'
        : 'assets/images/Logo for light bg.png';

    final secondaryPath = useDarkMode
        ? 'assets/images/logo.png'
        : 'assets/images/logo_light.png';

    return Image.asset(
      primaryPath,
      height: height,
      fit: fit,
      errorBuilder: (context, error, stackTrace) {
        return Image.asset(
          secondaryPath,
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
