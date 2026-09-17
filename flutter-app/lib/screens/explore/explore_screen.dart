import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/top_header_actions.dart';

class ExploreScreen extends ConsumerWidget {
  const ExploreScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryCol = AppTheme.primaryOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);
    final textMuted = AppTheme.textMutedOf(context);
    final authState = ref.watch(authStateProvider);

    return Scaffold(
      backgroundColor: AppTheme.bgOf(context),
      appBar: AppBar(
        backgroundColor: AppTheme.cardBgOf(context),
        elevation: 0,
        scrolledUnderElevation: 0.5,
        title: Text(
          'Explore Modules',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w800,
            color: textPrimary,
          ),
        ),
        actions: const [
          TopHeaderActions(),
          SizedBox(width: 12),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(18, 16, 18, 110),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // User Brief Banner (Tappable to go to User Profile/Dashboard)
              GestureDetector(
                onTap: () {
                  context.push('/student/dashboard');
                },
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: AppTheme.iOSCardDecoration(context, radius: 20),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 24,
                        backgroundColor: primaryCol.withValues(alpha: 0.15),
                        child: Text(
                          (authState.userName != null && authState.userName!.isNotEmpty)
                              ? authState.userName![0].toUpperCase()
                              : 'F',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: primaryCol,
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              authState.userName ?? 'Aspirant',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: textPrimary,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Targeting BPSC & Competitive Exams',
                              style: TextStyle(fontSize: 12, color: textMuted),
                            ),
                          ],
                        ),
                      ),
                      Icon(Icons.arrow_forward_ios_rounded, size: 16, color: textMuted),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // Group 1: Exam Preparation
              _buildSectionTitle('ACADEMICS & PREPARATION', textMuted),
              const SizedBox(height: 10),
              Container(
                decoration: AppTheme.iOSCardDecoration(context, radius: 20),
                child: Column(
                  children: [
                    _ExploreListTile(
                      icon: Icons.assignment_turned_in_rounded,
                      iconColor: const Color(0xFF2563EB),
                      title: 'Test Series Catalog',
                      subtitle: 'Full-length prelims, mains & subject mocks',
                      onTap: () => context.go('/test-series'),
                    ),
                    _buildDivider(context),
                    _ExploreListTile(
                      icon: Icons.school_rounded,
                      iconColor: const Color(0xFFEC4899),
                      title: 'Video Courses & Batches',
                      subtitle: 'Targeted recorded & live prep modules',
                      onTap: () => context.push('/courses'),
                    ),
                    _buildDivider(context),
                    _ExploreListTile(
                      icon: Icons.newspaper_rounded,
                      iconColor: const Color(0xFF10B981),
                      title: 'Daily Current Affairs',
                      subtitle: 'Bilingual news analysis & quiz snippets',
                      onTap: () => context.push('/current-affairs'),
                    ),
                    _buildDivider(context),
                    _ExploreListTile(
                      icon: Icons.library_books_rounded,
                      iconColor: const Color(0xFFF59E0B),
                      title: 'Official PYQ Papers',
                      subtitle: 'Previous year question papers with key',
                      onTap: () => context.push('/pyq'),
                    ),
                    _buildDivider(context),
                    _ExploreListTile(
                      icon: Icons.menu_book_rounded,
                      iconColor: const Color(0xFF14B8A6),
                      title: 'Syllabus & Strategy',
                      subtitle: 'Exam pattern & subject breakdown',
                      onTap: () => context.push('/syllabus-strategy'),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Group 2: Community & Mentorship
              _buildSectionTitle('MENTORSHIP & COMMUNITY', textMuted),
              const SizedBox(height: 10),
              Container(
                decoration: AppTheme.iOSCardDecoration(context, radius: 20),
                child: Column(
                  children: [
                    _ExploreListTile(
                      icon: Icons.chat_bubble_outline_rounded,
                      iconColor: const Color(0xFF8B5CF6),
                      title: 'Mentorship Chat',
                      subtitle: 'Ask doubts directly to mentors & officers',
                      onTap: () => context.push('/chat'),
                    ),
                    _buildDivider(context),
                    _ExploreListTile(
                      icon: Icons.article_rounded,
                      iconColor: const Color(0xFF06B6D4),
                      title: 'BPSC Prep Blogs',
                      subtitle: 'Topper strategy, notes & guidance articles',
                      onTap: () => context.push('/blog'),
                    ),
                    _buildDivider(context),
                    _ExploreListTile(
                      icon: Icons.people_rounded,
                      iconColor: const Color(0xFF6366F1),
                      title: 'Faculty & Mentors',
                      subtitle: 'Learn about our subject matter experts',
                      onTap: () => context.push('/faculty'),
                    ),
                    _buildDivider(context),
                    _ExploreListTile(
                      icon: Icons.emoji_events_rounded,
                      iconColor: const Color(0xFFEAB308),
                      title: 'Achievers Wall',
                      subtitle: 'Our successful candidates in BPSC',
                      onTap: () => context.push('/achievers'),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Group 3: App Preferences & Profile
              _buildSectionTitle('PREFERENCES & ACCOUNT', textMuted),
              const SizedBox(height: 10),
              Container(
                decoration: AppTheme.iOSCardDecoration(context, radius: 20),
                child: Column(
                  children: [
                    _ExploreListTile(
                      icon: Icons.person_rounded,
                      iconColor: primaryCol,
                      title: 'Student Profile',
                      subtitle: 'Account details & target exam settings',
                      onTap: () => context.push('/student/profile'),
                    ),
                    _buildDivider(context),
                    _ExploreListTile(
                      icon: isDark ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
                      iconColor: isDark ? const Color(0xFFF59E0B) : primaryCol,
                      title: isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme',
                      subtitle: 'Appearance preference',
                      onTap: () {
                        ref.read(themeModeProvider.notifier).toggleTheme();
                      },
                    ),
                    _buildDivider(context),
                    _ExploreListTile(
                      icon: Icons.info_outline_rounded,
                      iconColor: const Color(0xFF64748B),
                      title: 'About Final Attempt',
                      subtitle: 'App version, vision & philosophy',
                      onTap: () => context.push('/about'),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title, Color textColor) {
    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.8,
          color: textColor,
        ),
      ),
    );
  }

  Widget _buildDivider(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Divider(
      height: 1,
      thickness: 0.8,
      indent: 56,
      color: isDark ? Colors.white.withValues(alpha: 0.08) : AppTheme.borderLight,
    );
  }
}

class _ExploreListTile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _ExploreListTile({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: iconColor, size: 20),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textPrimaryOf(context),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 11,
                      color: AppTheme.textMutedOf(context),
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.chevron_right_rounded,
              size: 20,
              color: AppTheme.textMutedOf(context),
            ),
          ],
        ),
      ),
    );
  }
}
