import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../core/theme/app_theme.dart';

/// Apple-style Frosted Translucent Navigation Bar with BackdropFilter blur
class AppleFrostedAppBar extends StatelessWidget implements PreferredSizeWidget {
  final Widget? leading;
  final Widget? title;
  final List<Widget>? actions;
  final double height;
  final double blurSigma;
  final bool showBottomBorder;

  const AppleFrostedAppBar({
    super.key,
    this.leading,
    this.title,
    this.actions,
    this.height = 56.0,
    this.blurSigma = 20.0,
    this.showBottomBorder = true,
  });

  @override
  Size get preferredSize => Size.fromHeight(height);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final borderCol = AppTheme.borderOf(context);

    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: blurSigma, sigmaY: blurSigma),
        child: Container(
          height: MediaQuery.of(context).padding.top + height,
          padding: EdgeInsets.only(top: MediaQuery.of(context).padding.top),
          decoration: BoxDecoration(
            color: isDark
                ? const Color(0xFF070B14).withValues(alpha: 0.75)
                : Colors.white.withValues(alpha: 0.82),
            border: showBottomBorder
                ? Border(bottom: BorderSide(color: borderCol.withValues(alpha: isDark ? 0.35 : 0.6), width: 0.5))
                : null,
          ),
          child: NavigationToolbar(
            leading: leading,
            middle: title,
            trailing: actions != null
                ? Row(
                    mainAxisSize: MainAxisSize.min,
                    children: actions!,
                  )
                : null,
            centerMiddle: false,
          ),
        ),
      ),
    );
  }
}

/// Apple-style Drag-to-Dismiss Bottom Sheet with physical spring gesture
class AppleSheet {
  static Future<T?> show<T>({
    required BuildContext context,
    required Widget Function(BuildContext) builder,
    double initialChildSize = 0.65,
    double minChildSize = 0.35,
    double maxChildSize = 0.92,
    bool enableHaptic = true,
  }) {
    if (enableHaptic) {
      HapticFeedback.lightImpact();
    }

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return showModalBottomSheet<T>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: isDark ? 0.65 : 0.4),
      builder: (sheetContext) {
        return DraggableScrollableSheet(
          initialChildSize: initialChildSize,
          minChildSize: minChildSize,
          maxChildSize: maxChildSize,
          expand: false,
          builder: (scrollContext, scrollController) {
            return ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 25, sigmaY: 25),
                child: Container(
                  decoration: BoxDecoration(
                    color: isDark
                        ? const Color(0xFF0F172A).withValues(alpha: 0.94)
                        : Colors.white.withValues(alpha: 0.96),
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
                    border: Border.all(
                      color: isDark
                          ? Colors.white.withValues(alpha: 0.12)
                          : Colors.black.withValues(alpha: 0.06),
                      width: 1,
                    ),
                  ),
                  child: Column(
                    children: [
                      // Apple Home Indicator grab bar
                      Center(
                        child: Container(
                          margin: const EdgeInsets.only(top: 10, bottom: 8),
                          width: 36,
                          height: 4.5,
                          decoration: BoxDecoration(
                            color: isDark
                                ? Colors.white.withValues(alpha: 0.28)
                                : Colors.black.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(3),
                          ),
                        ),
                      ),
                      Expanded(
                        child: SingleChildScrollView(
                          controller: scrollController,
                          physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
                          child: builder(scrollContext),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }
}
