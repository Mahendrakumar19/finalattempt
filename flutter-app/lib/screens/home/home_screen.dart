import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/content_providers.dart';
import '../../providers/courses_provider.dart';
import '../../providers/current_affairs_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../widgets/course_card.dart';
import '../../widgets/loading_shimmer.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settingsAsync = ref.watch(settingsProvider);
    final coursesAsync = ref.watch(coursesProvider);
    final caAsync = ref.watch(caEditionsProvider);
    final authState = ref.watch(authStateProvider);

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // AppBar
          SliverAppBar(
            floating: true,
            snap: true,
            backgroundColor: AppTheme.bgDark,
            surfaceTintColor: Colors.transparent,
            title: Row(
              children: [
                Container(
                  width: 32, height: 32,
                  decoration: BoxDecoration(
                    color: AppTheme.amber,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Center(
                    child: Text('FA', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: AppTheme.bgDark)),
                  ),
                ),
                const SizedBox(width: 10),
                const Text('Final Attempt', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
              ],
            ),
            actions: [
              IconButton(
                icon: Icon(
                  Theme.of(context).brightness == Brightness.dark
                      ? Icons.light_mode_rounded
                      : Icons.dark_mode_rounded,
                  color: AppTheme.amber,
                  size: 20,
                ),
                onPressed: () => ref.read(themeModeProvider.notifier).toggleTheme(),
              ),
              if (authState.isLoggedIn)
                GestureDetector(
                  onTap: () => context.push('/student/dashboard'),
                  child: Container(
                    margin: const EdgeInsets.only(right: 16),
                    width: 36, height: 36,
                    decoration: BoxDecoration(
                      color: AppTheme.amber.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppTheme.amber.withOpacity(0.3)),
                    ),
                    child: const Icon(Icons.person_rounded, color: AppTheme.amber, size: 18),
                  ),
                )
              else
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: TextButton(
                    onPressed: () => context.push('/login'),
                    child: const Text('Login', style: TextStyle(color: AppTheme.amber, fontWeight: FontWeight.w700)),
                  ),
                ),
            ],
          ),

          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Hero Section
                settingsAsync.when(
                  data: (settings) => _HeroSection(settings: settings),
                  loading: () => const LoadingShimmer(height: 200),
                  error: (_, __) => const _HeroSection(settings: null),
                ),

                const SizedBox(height: 28),

                // Quick Action Tiles
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const _SectionTitle('Quick Access'),
                      const SizedBox(height: 12),
                      GridView.count(
                        crossAxisCount: 4,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        mainAxisSpacing: 10,
                        crossAxisSpacing: 10,
                        childAspectRatio: 0.85,
                        children: const [
                          _QuickTile(icon: Icons.school_rounded, label: 'Courses', path: '/courses', color: Color(0xFF3B82F6)),
                          _QuickTile(icon: Icons.newspaper_rounded, label: 'Current\nAffairs', path: '/current-affairs', color: Color(0xFF10B981)),
                          _QuickTile(icon: Icons.library_books_rounded, label: 'PYQs', path: '/pyq', color: Color(0xFFF59E0B)),
                          _QuickTile(icon: Icons.article_rounded, label: 'Blog', path: '/blog', color: Color(0xFF8B5CF6)),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 28),

                // Featured Courses
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: _SectionTitle(
                    'Featured Courses',
                    action: TextButton(
                      onPressed: () => context.push('/courses'),
                      child: const Text('View All', style: TextStyle(color: AppTheme.amber, fontSize: 12, fontWeight: FontWeight.w700)),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                coursesAsync.when(
                  data: (courses) => SizedBox(
                    height: 220,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: courses.take(6).length,
                      itemBuilder: (_, i) => CourseCard(
                        course: courses[i],
                        onTap: () => context.push('/courses/${courses[i].id}'),
                      ),
                    ),
                  ),
                  loading: () => const LoadingShimmer(height: 220),
                  error: (_, __) => const SizedBox.shrink(),
                ),

                const SizedBox(height: 28),

                // Latest Current Affairs
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: _SectionTitle(
                    'Latest Current Affairs',
                    action: TextButton(
                      onPressed: () => context.push('/current-affairs'),
                      child: const Text('See All', style: TextStyle(color: AppTheme.amber, fontSize: 12, fontWeight: FontWeight.w700)),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                caAsync.when(
                  data: (editions) {
                    if (editions.isEmpty) return const SizedBox.shrink();
                    final latest = editions.take(3).toList();
                    return Column(
                      children: latest.map((e) => _CAEditionTile(edition: e)).toList(),
                    );
                  },
                  loading: () => const LoadingShimmer(height: 150),
                  error: (_, __) => const SizedBox.shrink(),
                ),

                const SizedBox(height: 80),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _HeroSection extends StatelessWidget {
  final dynamic settings;
  const _HeroSection({this.settings});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: AppTheme.amber.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppTheme.amber.withOpacity(0.3)),
            ),
            child: const Text(
              '🏆 #1 BPSC Prep Platform',
              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.amber, letterSpacing: 0.5),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            settings?.heroTitle ?? 'Final Attempt — Your Path to Success',
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Colors.white, height: 1.25),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 8),
          Text(
            settings?.tagline ?? "Let's Make Your Attempt Final",
            style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.6), fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => GoRouter.of(context).push('/courses'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.amber,
              foregroundColor: AppTheme.bgDark,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Explore Courses', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
          ),
        ],
      ),
    );
  }
}

class _QuickTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String path;
  final Color color;
  const _QuickTile({required this.icon, required this.label, required this.path, required this.color});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.go(path),
      child: Container(
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 26),
            const SizedBox(height: 6),
            Text(label, textAlign: TextAlign.center,
              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: color, height: 1.2),
            ),
          ],
        ),
      ),
    );
  }
}

class _CAEditionTile extends StatelessWidget {
  final dynamic edition;
  const _CAEditionTile({required this.edition});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.borderColor),
      ),
      child: Row(
        children: [
          Container(
            width: 44, height: 44,
            decoration: BoxDecoration(
              color: AppTheme.amber.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.newspaper_rounded, color: AppTheme.amber, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Daily Edition — ${edition.publishDate}',
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white),
                ),
                Text(
                  '${edition.articles.length} articles',
                  style: TextStyle(fontSize: 11, color: Colors.white.withOpacity(0.5)),
                ),
              ],
            ),
          ),
          const Icon(Icons.arrow_forward_ios_rounded, color: AppTheme.textMuted, size: 14),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  final Widget? action;
  const _SectionTitle(this.title, {this.action});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Colors.white)),
        if (action != null) action!,
      ],
    );
  }
}
