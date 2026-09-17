import 'dart:ui' as ui;
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../core/localization/app_localizations.dart';
import '../widgets/global_search_modal.dart';

class AppShell extends ConsumerStatefulWidget {
  final Widget child;
  const AppShell({super.key, required this.child});

  @override
  ConsumerState<AppShell> createState() => _AppShellState();
}

class _AppShellState extends ConsumerState<AppShell> {
  final ValueNotifier<bool> _isCompactNotifier = ValueNotifier<bool>(false);

  @override
  void dispose() {
    _isCompactNotifier.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final loc = ref.watch(appLocalizationsProvider);
    final matchedLoc = GoRouterState.of(context).matchedLocation;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Active tab index matching
    int selectedIdx = 0;
    if (matchedLoc.startsWith('/test-series')) {
      selectedIdx = 1;
    } else if (matchedLoc.startsWith('/chat')) {
      selectedIdx = 2;
    } else if (matchedLoc.startsWith('/explore') || matchedLoc.startsWith('/current-affairs')) {
      selectedIdx = 3;
    } else {
      selectedIdx = 0;
    }

    final hideBottomNav = matchedLoc != '/' && 
                          !matchedLoc.startsWith('/test-series') && 
                          !matchedLoc.startsWith('/explore') &&
                          !matchedLoc.startsWith('/chat') &&
                          !matchedLoc.startsWith('/current-affairs');

    if (hideBottomNav) {
      return Scaffold(
        body: RepaintBoundary(
          child: widget.child,
        ),
      );
    }

    final viewInsetsBottom = MediaQuery.of(context).viewInsets.bottom;
    final isKeyboardOpen = viewInsetsBottom > 0;

    return Scaffold(
      extendBody: true,
      body: NotificationListener<ScrollNotification>(
        onNotification: (notification) {
          if (notification is ScrollUpdateNotification && notification.depth == 0) {
            final delta = notification.scrollDelta ?? 0;
            if (delta > 3 && !_isCompactNotifier.value && notification.metrics.pixels > 30) {
              _isCompactNotifier.value = true;
            } else if (delta < -3 && _isCompactNotifier.value) {
              _isCompactNotifier.value = false;
            } else if (notification.metrics.pixels <= 10 && _isCompactNotifier.value) {
              _isCompactNotifier.value = false;
            }
          }
          return false;
        },
        child: Stack(
          children: [
            // RepaintBoundary isolates child page from dock rebuilds & repaint flashes
            Positioned.fill(
              child: RepaintBoundary(
                child: widget.child,
              ),
            ),
            if (!isKeyboardOpen)
              Positioned(
                left: 0,
                right: 0,
                bottom: 8,
                child: SafeArea(
                  top: false,
                  child: Center(
                    child: RepaintBoundary(
                      child: ValueListenableBuilder<bool>(
                        valueListenable: _isCompactNotifier,
                        builder: (context, isCompact, _) {
                          return _LiquidGlassDock(
                            selectedIdx: selectedIdx,
                            isDark: isDark,
                            isCompact: isCompact,
                            loc: loc,
                          );
                        },
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _LiquidGlassDock extends StatelessWidget {
  final int selectedIdx;
  final bool isDark;
  final bool isCompact;
  final AppLocalizations loc;

  const _LiquidGlassDock({
    required this.selectedIdx,
    required this.isDark,
    required this.isCompact,
    required this.loc,
  });

  @override
  Widget build(BuildContext context) {
    const systemTextStyle = TextStyle(
      inherit: false,
      fontFamily: '',
      fontFamilyFallback: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Segoe UI', 'Roboto'],
      fontSize: 11.5,
      fontWeight: FontWeight.w600,
      letterSpacing: -0.15,
      height: 1.15,
      color: Colors.white,
    );

    final borderRadius = BorderRadius.circular(isCompact ? 26 : 30);

    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      curve: Curves.fastOutSlowIn,
      constraints: BoxConstraints(maxWidth: isCompact ? 390 : 440),
      height: isCompact ? 52 : 60,
      margin: EdgeInsets.symmetric(horizontal: isCompact ? 22 : 16),
      decoration: BoxDecoration(
        borderRadius: borderRadius,
        boxShadow: [
          // Ambient Separation Shadow (Liquid Glass Kit Depth Layer 1)
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.42 : 0.16),
            blurRadius: 32,
            spreadRadius: -2,
            offset: const Offset(0, 12),
          ),
          // Refraction Edge Glow Shadow (Liquid Glass Kit Depth Layer 2)
          BoxShadow(
            color: Colors.white.withValues(alpha: isDark ? 0.28 : 0.90),
            blurRadius: 5,
            spreadRadius: 0,
            offset: const Offset(-1, -1),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: borderRadius,
        child: BackdropFilter(
          filter: ui.ImageFilter.blur(sigmaX: 18, sigmaY: 18),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            curve: Curves.fastOutSlowIn,
            decoration: BoxDecoration(
              borderRadius: borderRadius,
              // Angled Specular Refraction Gradient (Almost Transparent Translucent Glass)
              gradient: LinearGradient(
                begin: const Alignment(-0.7, -1.0),
                end: const Alignment(0.7, 1.0),
                colors: isDark
                    ? [
                        Colors.white.withValues(alpha: 0.12), // Subtle specular top light
                        Colors.white.withValues(alpha: 0.04), // Clear body
                        Colors.black.withValues(alpha: 0.15), // Deep refraction center
                        Colors.white.withValues(alpha: 0.03), // Subtle bottom catch
                      ]
                    : [
                        Colors.white.withValues(alpha: 0.38), // Translucent specular top
                        Colors.white.withValues(alpha: 0.15), // Clear body
                        Colors.white.withValues(alpha: 0.10), // Refraction mid
                        Colors.white.withValues(alpha: 0.28), // Translucent bottom sheen
                      ],
                stops: const [0.0, 0.15, 0.82, 1.0],
              ),
              border: Border.all(
                color: isDark
                    ? Colors.white.withValues(alpha: 0.22)
                    : Colors.white.withValues(alpha: 0.75), // Crisp specular border outline
                width: 0.80,
              ),
            ),
            child: DefaultTextStyle(
              style: systemTextStyle,
              child: _buildDockContent(context),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDockContent(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final itemWidth = constraints.maxWidth / 5;
        return Stack(
          children: [
            // Translucent Angled Specular Lens Highlight Pill
            AnimatedPositioned(
              duration: const Duration(milliseconds: 300),
              curve: Curves.fastLinearToSlowEaseIn,
              left: selectedIdx * itemWidth,
              top: isCompact ? 3 : 4,
              bottom: isCompact ? 3 : 4,
              width: itemWidth,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                curve: Curves.fastLinearToSlowEaseIn,
                margin: const EdgeInsets.symmetric(horizontal: 4),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: const Alignment(-0.5, -1.0),
                    end: const Alignment(0.5, 1.0),
                    colors: isDark
                        ? [
                            Colors.white.withValues(alpha: 0.16),
                            Colors.white.withValues(alpha: 0.06),
                          ]
                        : [
                            Colors.white.withValues(alpha: 0.65),
                            Colors.white.withValues(alpha: 0.40),
                          ],
                  ),
                  borderRadius: BorderRadius.circular(isCompact ? 22 : 25),
                  border: Border.all(
                    color: isDark
                        ? Colors.white.withValues(alpha: 0.32)
                        : Colors.white.withValues(alpha: 0.85),
                    width: 0.75,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: isDark ? 0.10 : 0.04),
                      blurRadius: 6,
                      spreadRadius: 0,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
              ),
            ),
            // Nav Items Row
            Row(
              children: [
                _NavItem(
                  width: itemWidth,
                  icon: Icons.home_outlined,
                  activeIcon: Icons.home_rounded,
                  label: loc.tr('home'),
                  isSelected: selectedIdx == 0,
                  isCompact: isCompact,
                  onTap: () => context.go('/'),
                ),
                _NavItem(
                  width: itemWidth,
                  icon: Icons.assignment_outlined,
                  activeIcon: Icons.assignment_rounded,
                  label: 'Tests',
                  isSelected: selectedIdx == 1,
                  isCompact: isCompact,
                  onTap: () => context.go('/test-series'),
                ),
                _NavItem(
                  width: itemWidth,
                  icon: Icons.chat_bubble_outline_rounded,
                  activeIcon: Icons.chat_bubble_rounded,
                  label: 'Mentorship',
                  isSelected: selectedIdx == 2,
                  isCompact: isCompact,
                  onTap: () => context.go('/chat'),
                ),
                _NavItem(
                  width: itemWidth,
                  icon: Icons.explore_outlined,
                  activeIcon: Icons.explore_rounded,
                  label: 'Explore',
                  isSelected: selectedIdx == 3,
                  isCompact: isCompact,
                  onTap: () => context.go('/explore'),
                ),
                _NavItem(
                  width: itemWidth,
                  icon: Icons.search_outlined,
                  activeIcon: Icons.search_rounded,
                  label: 'Search',
                  isSelected: false,
                  isCompact: isCompact,
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
  final bool isCompact;
  final VoidCallback onTap;

  const _NavItem({
    required this.width,
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.isSelected,
    required this.isCompact,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    // High contrast text & icon colors for sharp readability
    final activeColor = isDark ? const Color(0xFFFFFFFF) : const Color(0xFF090D16);
    final unselectedCol = isDark ? const Color(0xFFE2E8F0) : const Color(0xFF334155);
    final textColor = isSelected ? activeColor : unselectedCol;

    return SizedBox(
      width: width,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(28),
          splashColor: Colors.transparent,
          highlightColor: Colors.white.withValues(alpha: 0.15),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              AnimatedScale(
                duration: const Duration(milliseconds: 250),
                curve: Curves.fastOutSlowIn,
                scale: isCompact ? 0.95 : (isSelected ? 1.08 : 1.0),
                child: Icon(
                  isSelected ? activeIcon : icon,
                  size: isCompact ? 19.5 : 21,
                  color: textColor,
                ),
              ),
              const SizedBox(height: 1),
              AnimatedDefaultTextStyle(
                duration: const Duration(milliseconds: 250),
                curve: Curves.fastOutSlowIn,
                style: DefaultTextStyle.of(context).style.copyWith(
                  color: textColor,
                  fontSize: isCompact ? 10.5 : 11.5,
                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                  letterSpacing: -0.15,
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


