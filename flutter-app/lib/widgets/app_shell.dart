import 'dart:ui' as ui;
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

    final isArticleOrSubDetail = matchedLoc.startsWith('/current-affairs/article/') || 
                                 matchedLoc.startsWith('/blog/') || 
                                 matchedLoc.startsWith('/downloads/');
    final hideBottomNav = isArticleOrSubDetail || (
                          matchedLoc != '/' && 
                          !matchedLoc.startsWith('/test-series') && 
                          !matchedLoc.startsWith('/explore') &&
                          !matchedLoc.startsWith('/chat') &&
                          !matchedLoc.startsWith('/current-affairs'));

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

    final borderRadius = BorderRadius.circular(isCompact ? 28 : 32);

    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      curve: Curves.fastOutSlowIn,
      constraints: BoxConstraints(maxWidth: isCompact ? 390 : 440),
      height: isCompact ? 54 : 62,
      margin: EdgeInsets.symmetric(horizontal: isCompact ? 20 : 16),
      decoration: BoxDecoration(
        borderRadius: borderRadius,
        boxShadow: [
          // 1. Primary ambient soft drop shadow (lifting dock above scrollable content)
          BoxShadow(
            color: isDark 
                ? Colors.black.withValues(alpha: 0.40)
                : const Color(0xFF0F172A).withValues(alpha: 0.12),
            blurRadius: 28,
            offset: const Offset(0, 10),
          ),
          // 2. Direct light grounding shadow
          BoxShadow(
            color: isDark
                ? Colors.black.withValues(alpha: 0.25)
                : const Color(0xFF0F172A).withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: borderRadius,
        child: BackdropFilter(
          // Optical glass refraction blur (Glisse fidelity)
          filter: ui.ImageFilter.blur(sigmaX: 24, sigmaY: 24),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            curve: Curves.easeOutCubic,
            decoration: BoxDecoration(
              borderRadius: borderRadius,
              // Vertical optical refractive gradient (thicker crystal glass feel)
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: isDark
                    ? [
                        const Color(0xFF1E293B).withValues(alpha: 0.72),
                        const Color(0xFF0A0F1D).withValues(alpha: 0.88),
                      ]
                    : [
                        Colors.white.withValues(alpha: 0.78),
                        const Color(0xFFF1F5F9).withValues(alpha: 0.60),
                      ],
              ),
              // Dual-tone edge: upper specular light highlight
              border: Border.all(
                color: isDark
                    ? Colors.white.withValues(alpha: 0.18)
                    : Colors.white.withValues(alpha: 0.85),
                width: 1.2,
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
            // Glisse Liquid Glass Active Selection Capsule (Physical Floating Lens)
            TweenAnimationBuilder<double>(
              tween: Tween<double>(end: selectedIdx.toDouble()),
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeOutCubic,
              builder: (context, animatedIdx, child) {
                return Positioned(
                  left: animatedIdx * itemWidth,
                  top: isCompact ? 3.5 : 4.5,
                  bottom: isCompact ? 3.5 : 4.5,
                  width: itemWidth,
                  child: child!,
                );
              },
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 4.5),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(isCompact ? 24.0 : 26.0),
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: isDark
                        ? [
                            Colors.white.withValues(alpha: 0.16),
                            Colors.white.withValues(alpha: 0.05),
                          ]
                        : [
                            Colors.white.withValues(alpha: 0.95),
                            Colors.white.withValues(alpha: 0.70),
                          ],
                  ),
                  border: Border.all(
                    color: isDark
                        ? Colors.white.withValues(alpha: 0.24)
                        : Colors.white.withValues(alpha: 0.95),
                    width: 1.1,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: isDark 
                          ? Colors.black.withValues(alpha: 0.35)
                          : const Color(0xFF0F172A).withValues(alpha: 0.06),
                      blurRadius: 8,
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
    
    // Unified high-contrast text & icon colors tailored for light and dark crystal backgrounds
    final activeColor = isDark ? const Color(0xFFFFFFFF) : const Color(0xFF0F172A);
    final unselectedColor = isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569);
    final textColor = isSelected ? activeColor : unselectedColor;

    return SizedBox(
      width: width,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(28),
          splashColor: Colors.transparent,
          highlightColor: isDark 
              ? Colors.white.withValues(alpha: 0.11)
              : Colors.black.withValues(alpha: 0.05),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              AnimatedScale(
                duration: const Duration(milliseconds: 250),
                curve: Curves.easeOutCubic,
                scale: isCompact ? 0.95 : (isSelected ? 1.06 : 1.0),
                child: Icon(
                  isSelected ? activeIcon : icon,
                  size: isCompact ? 19.5 : 21,
                  color: textColor,
                ),
              ),
              const SizedBox(height: 1),
              AnimatedDefaultTextStyle(
                duration: const Duration(milliseconds: 250),
                curve: Curves.easeOutCubic,
                style: DefaultTextStyle.of(context).style.copyWith(
                  color: textColor,
                  fontSize: isCompact ? 10.5 : 11.5,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500, // Reduced from w700 / w500
                  letterSpacing: -0.15,
                ),
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(
                    label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}


