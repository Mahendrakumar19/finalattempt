import 'dart:ui' as ui;
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../core/localization/app_localizations.dart';
import '../widgets/global_search_modal.dart';

class AppShell extends ConsumerWidget {
  final Widget child;
  const AppShell({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final loc = ref.watch(appLocalizationsProvider);
    final matchedLoc = GoRouterState.of(context).matchedLocation;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Active tab index matching
    int selectedIdx = 0;
    if (matchedLoc.startsWith('/test-series')) {
      selectedIdx = 1;
    } else if (matchedLoc.startsWith('/chat')) {
      selectedIdx = 2;
    } else if (matchedLoc.startsWith('/explore')) {
      selectedIdx = 3;
    } else {
      selectedIdx = 0;
    }

    final hideBottomNav = matchedLoc != '/' && 
                          matchedLoc != '/test-series' && 
                          matchedLoc != '/explore' &&
                          matchedLoc != '/chat';

    if (hideBottomNav) {
      return Scaffold(
        body: child,
      );
    }

    // Native system typography style for navigation items (~11px)
    const systemTextStyle = TextStyle(
      inherit: false,
      fontFamily: '',
      fontFamilyFallback: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Segoe UI', 'Roboto'],
      fontSize: 11,
      fontWeight: FontWeight.w500,
      letterSpacing: -0.1,
      height: 1.15,
      color: Colors.white, 
    );

    final viewInsetsBottom = MediaQuery.of(context).viewInsets.bottom;
    final isKeyboardOpen = viewInsetsBottom > 0;

    return Scaffold(
      extendBody: true,
      body: Stack(
        children: [
          Positioned.fill(
            child: child,
          ),
          if (!isKeyboardOpen)
            Positioned(
              left: 0,
              right: 0,
              bottom: 8,
              child: SafeArea(
                top: false,
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 440),
                    child: Container(
                      height: 58,
                      margin: const EdgeInsets.symmetric(horizontal: 18),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(29),
                        child: kIsWeb
                            ? Container(
                                decoration: BoxDecoration(
                                  color: isDark
                                      ? Colors.black.withValues(alpha: 0.15)
                                      : Colors.white.withValues(alpha: 0.20),
                                  borderRadius: BorderRadius.circular(29),
                                  border: Border.all(
                                    color: isDark 
                                        ? Colors.white.withValues(alpha: 0.12)
                                        : Colors.white.withValues(alpha: 0.25),
                                    width: 0.5,
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: isDark ? 0.08 : 0.02),
                                      blurRadius: 16,
                                      spreadRadius: -2,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: DefaultTextStyle(
                                  style: systemTextStyle,
                                  child: _buildDockContent(context, loc, selectedIdx, isDark),
                                ),
                              )
                            : BackdropFilter(
                                filter: ui.ImageFilter.blur(sigmaX: 20, sigmaY: 20),
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: isDark
                                        ? Colors.black.withValues(alpha: 0.03)
                                        : Colors.white.withValues(alpha: 0.05),
                                    borderRadius: BorderRadius.circular(29),
                                    border: Border.all(
                                      color: isDark 
                                          ? Colors.white.withValues(alpha: 0.10)
                                          : Colors.white.withValues(alpha: 0.25),
                                      width: 0.5,
                                    ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withValues(alpha: isDark ? 0.06 : 0.02),
                                        blurRadius: 16,
                                        spreadRadius: -2,
                                        offset: const Offset(0, 4),
                                      ),
                                    ],
                                  ),
                                  child: DefaultTextStyle(
                                    style: systemTextStyle,
                                    child: _buildDockContent(context, loc, selectedIdx, isDark),
                                  ),
                                ),
                              ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildDockContent(BuildContext context, AppLocalizations loc, int selectedIdx, bool isDark) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final itemWidth = constraints.maxWidth / 5;
        return Stack(
          children: [
            // Fluid Lens Selected Highlight
            AnimatedPositioned(
              duration: const Duration(milliseconds: 300),
              curve: Curves.fastOutSlowIn,
              left: selectedIdx * itemWidth,
              top: 4,
              bottom: 4,
              width: itemWidth,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                curve: Curves.fastOutSlowIn,
                margin: const EdgeInsets.symmetric(horizontal: 5),
                decoration: BoxDecoration(
                  color: isDark 
                      ? Colors.white.withValues(alpha: 0.08)
                      : Colors.black.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(25),
                  border: Border.all(
                    color: isDark
                        ? Colors.white.withValues(alpha: 0.10)
                        : Colors.white.withValues(alpha: 0.25),
                    width: 0.5,
                  ),
                ),
              ),
            ),
            // Nav Items
            Row(
              children: [
                _NavItem(
                  width: itemWidth,
                  icon: Icons.home_outlined,
                  activeIcon: Icons.home_rounded,
                  label: loc.tr('home'),
                  isSelected: selectedIdx == 0,
                  onTap: () => context.go('/'),
                ),
                _NavItem(
                  width: itemWidth,
                  icon: Icons.assignment_outlined,
                  activeIcon: Icons.assignment_rounded,
                  label: 'Tests',
                  isSelected: selectedIdx == 1,
                  onTap: () => context.go('/test-series'),
                ),
                _NavItem(
                  width: itemWidth,
                  icon: Icons.chat_bubble_outline_rounded,
                  activeIcon: Icons.chat_bubble_rounded,
                  label: 'Mentorship',
                  isSelected: selectedIdx == 2,
                  onTap: () => context.go('/chat'),
                ),
                _NavItem(
                  width: itemWidth,
                  icon: Icons.explore_outlined,
                  activeIcon: Icons.explore_rounded,
                  label: 'Explore',
                  isSelected: selectedIdx == 3,
                  onTap: () => context.go('/explore'),
                ),
                _NavItem(
                  width: itemWidth,
                  icon: Icons.search_outlined,
                  activeIcon: Icons.search_rounded,
                  label: 'Search',
                  isSelected: false,
                  onTap: () => GlobalSearchModal.show(context),
                ),
              ],
            ),
          ],
        );
      },
    );
  }
}

class _NavItem extends StatelessWidget {
  final double width;
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _NavItem({
    required this.width,
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final activeColor = isDark ? Colors.white : Colors.black87;
    final unselectedCol = isDark ? Colors.white54 : Colors.black54;
    final textColor = isSelected ? activeColor : unselectedCol;

    return SizedBox(
      width: width,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(28),
          splashColor: Colors.transparent,
          highlightColor: Colors.black.withValues(alpha: 0.05),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              AnimatedScale(
                duration: const Duration(milliseconds: 250),
                curve: Curves.fastOutSlowIn,
                scale: isSelected ? 1.02 : 1.0,
                child: Icon(
                  isSelected ? activeIcon : icon,
                  size: 21,
                  color: textColor,
                ),
              ),
              const SizedBox(height: 1),
              AnimatedDefaultTextStyle(
                duration: const Duration(milliseconds: 250),
                curve: Curves.fastOutSlowIn,
                style: DefaultTextStyle.of(context).style.copyWith(
                  color: textColor,
                  fontSize: 11,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                ),
                child: Text(label, maxLines: 1, overflow: TextOverflow.visible),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
