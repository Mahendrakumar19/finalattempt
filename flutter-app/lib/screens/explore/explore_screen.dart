import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/top_header_actions.dart';
import '../../widgets/apple_pressable.dart';

class ExploreScreen extends ConsumerWidget {
  const ExploreScreen({super.key});

  Future<void> _openExternal(String url) async {
    try {
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    } catch (_) {}
  }

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
          'More & Explore',
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
          padding: const EdgeInsets.fromLTRB(18, 14, 18, 120),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // User Brief Banner (Tappable to go to User Profile/Dashboard)
              ApplePressable(
                onTap: () {
                  if (authState.isLoggedIn) {
                    context.push('/student/dashboard');
                  } else {
                    context.push('/login');
                  }
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
                              : 'U',
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
                              authState.userName ?? 'Welcome Aspirant',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: textPrimary,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              authState.isLoggedIn
                                  ? 'Targeting BPSC, UPSC & State PCS'
                                  : 'Tap to sign in and view your progress',
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

              // Group 1: Academics & Courses Hub (Matches Website Navbar)
              _buildSectionTitle('ACADEMICS & LEARNING', textMuted),
              const SizedBox(height: 10),
              Container(
                decoration: AppTheme.iOSCardDecoration(context, radius: 20),
                child: Column(
                  children: [
                    _ExploreListTile(
                      icon: Icons.school_rounded,
                      iconColor: const Color(0xFFEC4899),
                      title: 'Courses & Batches',
                      subtitle: 'BPSC Prelims, Mains sprint & APPSC foundation',
                      onTap: () => context.push('/courses'),
                    ),
                    _buildDivider(context),
                    _ExploreListTile(
                      icon: Icons.assignment_turned_in_rounded,
                      iconColor: const Color(0xFF2563EB),
                      title: 'Test Series Programs',
                      subtitle: 'MINI, HALF & FULL mock test series with rankings',
                      onTap: () => context.go('/test-series'),
                    ),
                    _buildDivider(context),
                    _ExploreListTile(
                      icon: Icons.dashboard_customize_rounded,
                      iconColor: const Color(0xFF0EA5E9),
                      title: 'Student Learning Portal',
                      subtitle: 'My enrolled courses, live progress & tests',
                      onTap: () => context.push('/student/dashboard'),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Group 2: Current Affairs & Editorial Hub
              _buildSectionTitle('CURRENT AFFAIRS & DAILY PRACTICE', textMuted),
              const SizedBox(height: 10),
              Container(
                decoration: AppTheme.iOSCardDecoration(context, radius: 20),
                child: Column(
                  children: [
                    _ExploreListTile(
                      icon: Icons.newspaper_rounded,
                      iconColor: const Color(0xFF10B981),
                      title: 'Daily Current Affairs & Analysis',
                      subtitle: 'National, International & Bihar Special news',
                      onTap: () => context.push('/current-affairs'),
                    ),
                    _buildDivider(context),
                    _ExploreListTile(
                      icon: Icons.translate_rounded,
                      iconColor: const Color(0xFFF59E0B),
                      title: 'हिन्दी समसामयिकी (Hindi CA)',
                      subtitle: 'दैनिक व मासिक हिन्दी समसामयिकी और सम्पादकीय',
                      onTap: () => context.push('/current-affairs'),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Group 3: Downloads, PYQs & Publications Hub (Matches Website Resources Mega Menu)
              _buildSectionTitle('RESOURCES & DOWNLOADS HUB', textMuted),
              const SizedBox(height: 10),
              Container(
                decoration: AppTheme.iOSCardDecoration(context, radius: 20),
                child: Column(
                  children: [
                    _ExploreListTile(
                      icon: Icons.library_books_rounded,
                      iconColor: const Color(0xFFF59E0B),
                      title: 'Official PYQ Papers',
                      subtitle: 'BPSC & State PCS past exam papers with answer keys',
                      onTap: () => context.push('/pyq'),
                    ),
                    _buildDivider(context),
                    _ExploreListTile(
                      icon: Icons.auto_stories_rounded,
                      iconColor: const Color(0xFF8B5CF6),
                      title: 'NCERTs & Study Materials',
                      subtitle: 'Free Class 6-12 NCERT textbooks & revision notes',
                      onTap: () => context.push('/pyq'),
                    ),
                    _buildDivider(context),
                    _ExploreListTile(
                      icon: Icons.menu_book_rounded,
                      iconColor: const Color(0xFF14B8A6),
                      title: 'Syllabus & Strategy Breakdown',
                      subtitle: 'Official BPSC pattern, marks distribution & plan',
                      onTap: () => context.push('/syllabus-strategy'),
                    ),
                    _buildDivider(context),
                    _ExploreListTile(
                      icon: Icons.book_outlined,
                      iconColor: const Color(0xFFD97706),
                      title: 'FA Publications & Books',
                      subtitle: 'Order official BPSC books, notes & publications',
                      onTap: () => _openExternal('https://finalattemptias.com/downloads/fa-publication'),
                    ),
                    _buildDivider(context),
                    _ExploreListTile(
                      icon: Icons.local_shipping_outlined,
                      iconColor: const Color(0xFF6366F1),
                      title: 'Track Book Order',
                      subtitle: 'Track your physical publication parcel delivery',
                      onTap: () => _openExternal('https://finalattemptias.com/track-order'),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Group 4: Mentorship & Community Hub (Matches Website Header & Footer)
              _buildSectionTitle('COMMUNITY & MENTORSHIP', textMuted),
              const SizedBox(height: 10),
              Container(
                decoration: AppTheme.iOSCardDecoration(context, radius: 20),
                child: Column(
                  children: [
                    _ExploreListTile(
                      icon: Icons.chat_bubble_outline_rounded,
                      iconColor: const Color(0xFF8B5CF6),
                      title: 'Mentorship Chat',
                      subtitle: '1-on-1 doubt clearing with mentors and faculty',
                      onTap: () => context.push('/chat'),
                    ),
                    _buildDivider(context),
                    _ExploreListTile(
                      icon: Icons.article_rounded,
                      iconColor: const Color(0xFF06B6D4),
                      title: 'Strategy Blogs & Insights',
                      subtitle: 'BPSC toppers articles, answer writing & notes',
                      onTap: () => context.push('/blog'),
                    ),
                    _buildDivider(context),
                    _ExploreListTile(
                      icon: Icons.people_rounded,
                      iconColor: const Color(0xFF6366F1),
                      title: 'Faculty & Mentors',
                      subtitle: 'Meet our experienced subject educators',
                      onTap: () => context.push('/faculty'),
                    ),
                    _buildDivider(context),
                    _ExploreListTile(
                      icon: Icons.emoji_events_rounded,
                      iconColor: const Color(0xFFEAB308),
                      title: 'Achievers Wall',
                      subtitle: 'Our successful candidates in 67th, 68th & 69th BPSC',
                      onTap: () => context.push('/achievers'),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Group 5: Preferences, Support & Legal
              _buildSectionTitle('SUPPORT & APP PREFERENCES', textMuted),
              const SizedBox(height: 10),
              Container(
                decoration: AppTheme.iOSCardDecoration(context, radius: 20),
                child: Column(
                  children: [
                    _ExploreListTile(
                      icon: Icons.person_rounded,
                      iconColor: primaryCol,
                      title: 'Student Profile',
                      subtitle: 'Target exam preferences and personal info',
                      onTap: () => context.push('/student/profile'),
                    ),
                    _buildDivider(context),
                    _ExploreListTile(
                      icon: isDark ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
                      iconColor: isDark ? const Color(0xFFF59E0B) : primaryCol,
                      title: isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme',
                      subtitle: isDark ? 'Current: Dark Mode' : 'Current: Light Mode',
                      onTap: () {
                        ref.read(themeModeProvider.notifier).toggleTheme();
                      },
                    ),
                    _buildDivider(context),
                    _ExploreListTile(
                      icon: Icons.info_outline_rounded,
                      iconColor: const Color(0xFF64748B),
                      title: 'About Final Attempt',
                      subtitle: 'Vision, Patna offline center & contact details',
                      onTap: () => context.push('/about'),
                    ),
                    _buildDivider(context),
                    _ExploreListTile(
                      icon: Icons.privacy_tip_outlined,
                      iconColor: const Color(0xFF475569),
                      title: 'Privacy Policy & Terms',
                      subtitle: 'Legal disclaimers, privacy & refund policies',
                      onTap: () => _openExternal('https://finalattemptias.com/privacy-policy'),
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
          fontWeight: FontWeight.w800,
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
    return ApplePressable(
      onTap: onTap,
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
