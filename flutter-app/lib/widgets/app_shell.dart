import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../core/theme/app_theme.dart';
import '../core/localization/app_localizations.dart';
import '../widgets/global_search_modal.dart';

class AppShell extends ConsumerWidget {
  final Widget child;
  const AppShell({super.key, required this.child});

  void _showQuickActionHub(BuildContext context, AppLocalizations loc) {
    final primaryCol = AppTheme.primaryOf(context);
    final cardBg = AppTheme.cardBgOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: cardBg,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
            border: Border.all(color: AppTheme.borderOf(context)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 38,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade400,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: primaryCol.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(Icons.flash_on_rounded, color: primaryCol, size: 20),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    'Quick Actions Hub',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: textPrimary),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                'Instant access to test series, PYQs, current affairs & doubts.',
                style: TextStyle(fontSize: 12, color: AppTheme.textMutedOf(context)),
              ),
              const SizedBox(height: 20),

              // Action Grid
              GridView.count(
                crossAxisCount: 3,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 1.0,
                children: [
                  _QuickHubTile(
                    icon: Icons.search_rounded,
                    title: 'Search All',
                    color: primaryCol,
                    onTap: () {
                      Navigator.pop(context);
                      GlobalSearchModal.show(context);
                    },
                  ),
                  _QuickHubTile(
                    icon: Icons.assignment_turned_in_rounded,
                    title: 'Test Series',
                    color: const Color(0xFF3B82F6),
                    onTap: () {
                      Navigator.pop(context);
                      context.go('/test-series');
                    },
                  ),
                  _QuickHubTile(
                    icon: Icons.newspaper_rounded,
                    title: 'Current Affairs',
                    color: const Color(0xFF10B981),
                    onTap: () {
                      Navigator.pop(context);
                      context.go('/current-affairs');
                    },
                  ),
                  _QuickHubTile(
                    icon: Icons.library_books_rounded,
                    title: 'PYQs',
                    color: const Color(0xFFF59E0B),
                    onTap: () {
                      Navigator.pop(context);
                      context.go('/pyq');
                    },
                  ),
                  _QuickHubTile(
                    icon: Icons.chat_bubble_outline_rounded,
                    title: 'Ask Doubt',
                    color: const Color(0xFF8B5CF6),
                    onTap: () {
                      Navigator.pop(context);
                      context.push('/chat');
                    },
                  ),
                  _QuickHubTile(
                    icon: Icons.school_rounded,
                    title: 'Courses',
                    color: const Color(0xFFEC4899),
                    onTap: () {
                      Navigator.pop(context);
                      context.go('/courses');
                    },
                  ),
                ],
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  void _showExploreMoreSheet(BuildContext context, AppLocalizations loc) {
    final primaryCol = AppTheme.primaryOf(context);
    final cardBg = AppTheme.cardBgOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: cardBg,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
            border: Border.all(color: AppTheme.borderOf(context)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 38,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade400,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Icon(Icons.explore_rounded, color: primaryCol, size: 22),
                  const SizedBox(width: 10),
                  Text(
                    'Explore All Modules',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: textPrimary),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                'Access study resources, blogs, faculty profiles & student tools.',
                style: TextStyle(fontSize: 12, color: AppTheme.textMutedOf(context)),
              ),
              const SizedBox(height: 18),

              // Categories Grid
              const _ExploreCategorySection(
                title: 'PREPARATION & COURSES',
                items: [
                  (icon: Icons.assignment_turned_in_rounded, title: 'Test Series Catalog', path: '/test-series', color: Color(0xFF3B82F6)),
                  (icon: Icons.school_rounded, title: 'Video Courses & Batches', path: '/courses', color: Color(0xFFEC4899)),
                  (icon: Icons.newspaper_rounded, title: 'Daily Current Affairs', path: '/current-affairs', color: Color(0xFF10B981)),
                  (icon: Icons.library_books_rounded, title: 'Official PYQ Papers', path: '/pyq', color: Color(0xFFF59E0B)),
                ],
              ),

              const SizedBox(height: 16),

              const _ExploreCategorySection(
                title: 'STUDENT COMMUNITY & UPDATES',
                items: [
                  (icon: Icons.chat_bubble_outline_rounded, title: 'Mentorship Chat', path: '/chat', color: Color(0xFF8B5CF6)),
                  (icon: Icons.article_rounded, title: 'BPSC Prep Blogs', path: '/blog', color: Color(0xFF06B6D4)),
                  (icon: Icons.people_rounded, title: 'Faculty & Mentors', path: '/faculty', color: Color(0xFF6366F1)),
                  (icon: Icons.emoji_events_rounded, title: 'Achievers Wall', path: '/achievers', color: Color(0xFFEAB308)),
                ],
              ),
              const SizedBox(height: 20),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final loc = ref.watch(appLocalizationsProvider);
    final matchedLoc = GoRouterState.of(context).matchedLocation;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryCol = AppTheme.primaryOf(context);
    final cardBg = AppTheme.cardBgOf(context);
    final borderCol = AppTheme.borderOf(context);

    // Active tab index matching
    int selectedIdx = 0;
    if (matchedLoc.startsWith('/test-series')) {
      selectedIdx = 1;
    } else if (matchedLoc.startsWith('/chat')) {
      selectedIdx = 2;
    } else if (matchedLoc.startsWith('/courses') || matchedLoc.startsWith('/current-affairs') || matchedLoc.startsWith('/pyq') || matchedLoc.startsWith('/blog') || matchedLoc.startsWith('/faculty') || matchedLoc.startsWith('/achievers')) {
      selectedIdx = 3;
    } else {
      selectedIdx = 0;
    }

    return Scaffold(
      body: child,
      extendBody: true,
      bottomNavigationBar: SafeArea(
        child: Container(
          margin: const EdgeInsets.fromLTRB(14, 0, 14, 10),
          height: 64,
          decoration: BoxDecoration(
            color: cardBg.withValues(alpha: isDark ? 0.92 : 0.96),
            borderRadius: BorderRadius.circular(32),
            border: Border.all(color: borderCol, width: 1.2),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.4 : 0.08),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              // 1. Home
              _NavItem(
                icon: Icons.home_rounded,
                label: loc.tr('home'),
                isSelected: selectedIdx == 0,
                onTap: () => context.go('/'),
              ),

              // 2. Test Series
              _NavItem(
                icon: Icons.assignment_turned_in_rounded,
                label: 'Test Series',
                isSelected: selectedIdx == 1,
                onTap: () => context.go('/test-series'),
              ),

              // 3. Center FAB / Quick Action Hub (+)
              GestureDetector(
                onTap: () => _showQuickActionHub(context, loc),
                child: Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      colors: [primaryCol, isDark ? const Color(0xFF3B82F6) : const Color(0xFF1D4ED8)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: primaryCol.withValues(alpha: 0.4),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Icon(
                    Icons.add_rounded,
                    color: isDark ? Colors.black : Colors.white,
                    size: 28,
                  ),
                ),
              ),

              // 4. Mentorship Chat
              _NavItem(
                icon: Icons.chat_bubble_outline_rounded,
                label: 'Mentorship',
                isSelected: selectedIdx == 2,
                onTap: () => context.push('/chat'),
              ),

              // 5. Explore / More
              _NavItem(
                icon: Icons.widgets_rounded,
                label: 'Explore',
                isSelected: selectedIdx == 3,
                onTap: () => _showExploreMoreSheet(context, loc),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _NavItem({
    required this.icon,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final primaryCol = AppTheme.primaryOf(context);
    final unselectedCol = AppTheme.textMutedOf(context);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 20,
              color: isSelected ? primaryCol : unselectedCol,
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                color: isSelected ? primaryCol : unselectedCol,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickHubTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final Color color;
  final VoidCallback onTap;

  const _QuickHubTile({
    required this.icon,
    required this.title,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withValues(alpha: 0.25)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.18),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(height: 6),
            Text(
              title,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color, height: 1.1),
            ),
          ],
        ),
      ),
    );
  }
}

class _ExploreCategorySection extends StatelessWidget {
  final String title;
  final List<({IconData icon, String title, String path, Color color})> items;

  const _ExploreCategorySection({
    required this.title,
    required this.items,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.8,
            color: AppTheme.textMutedOf(context),
          ),
        ),
        const SizedBox(height: 10),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: items.length,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 2.8,
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
          ),
          itemBuilder: (context, i) {
            final item = items[i];
            return InkWell(
              onTap: () {
                Navigator.pop(context);
                context.push(item.path);
              },
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                decoration: BoxDecoration(
                  color: AppTheme.cardBgOf(context),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.borderOf(context)),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: item.color.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(item.icon, color: item.color, size: 16),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        item.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimaryOf(context),
                          height: 1.15,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}
