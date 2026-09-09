import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/current_affairs_provider.dart';
import '../../providers/test_series_provider.dart';
import '../../providers/pyq_provider.dart';
import '../../providers/auth_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/localization/app_localizations.dart';
import '../../widgets/loading_shimmer.dart';
import '../../widgets/app_logo.dart';
import '../../widgets/top_header_actions.dart';
import '../../models/test_series_model.dart';
import '../../models/current_affair_model.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  String _getGreeting(AppLocalizations loc) {
    final hour = DateTime.now().hour;
    if (hour < 12) return loc.tr('good_morning');
    if (hour < 17) return loc.tr('good_afternoon');
    return loc.tr('good_evening');
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final loc = ref.watch(appLocalizationsProvider);
    final authState = ref.watch(authStateProvider);
    final testSeriesAsync = ref.watch(testSeriesListProvider);
    final caAsync = ref.watch(caEditionsProvider);
    final pyqsAsync = ref.watch(pyqListProvider);

    final userName = (authState.userName != null && authState.userName!.isNotEmpty)
        ? authState.userName!.split(' ').first
        : 'Aspirant';

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final screenSize = MediaQuery.of(context).size;
    final accentCircleRadius = screenSize.width * 0.75;

    return Scaffold(
      backgroundColor: AppTheme.bgOf(context),
      body: Stack(
        children: [
          // Top-right pale blue organic accent
          Positioned(
            top: -accentCircleRadius * 0.45,
            right: -accentCircleRadius * 0.35,
            child: Container(
              width: accentCircleRadius,
              height: accentCircleRadius,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE8F1FF),
              ),
            ),
          ),
          // Bottom-left pale blue organic accent
          Positioned(
            bottom: -accentCircleRadius * 0.45,
            left: -accentCircleRadius * 0.35,
            child: Container(
              width: accentCircleRadius,
              height: accentCircleRadius,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isDark ? const Color(0xFF1E293B) : const Color(0xFFEBF3FF),
              ),
            ),
          ),
          // Scroll Content
          SafeArea(
            child: RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(testSeriesListProvider);
                ref.invalidate(caEditionsProvider);
                ref.invalidate(pyqListProvider);
              },
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                slivers: [
                  // 1. Sleek Header & Greeting
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                    sliver: SliverToBoxAdapter(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Row(
                              children: [
                                const AppLogo(height: 32),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        '${_getGreeting(loc)}, $userName 👋',
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.bold,
                                          color: AppTheme.textPrimaryOf(context),
                                        ),
                                      ),
                                      Text(
                                        loc.tr('ready_prompt'),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          fontSize: 11,
                                          color: AppTheme.textMuted,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          const TopHeaderActions(),
                        ],
                      ),
                    ),
                  ),

                  SliverToBoxAdapter(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 8),

                        // 2. Actionable Dynamic Featured Test Pass Card
                        _buildContinueOrDiscoveryCard(context, ref, loc, testSeriesAsync),

                        const SizedBox(height: 24),

                        // 3. Quick Action Cards Grid
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _SectionTitle(loc.tr('quick_actions')),
                              const SizedBox(height: 12),
                              GridView.count(
                                crossAxisCount: 4,
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                mainAxisSpacing: 12,
                                crossAxisSpacing: 12,
                                childAspectRatio: 0.85,
                                children: [
                                  _QuickActionCard(
                                    icon: Icons.assignment_turned_in_rounded,
                                    label: loc.tr('test_series'),
                                    path: '/test-series',
                                    color: isDark ? const Color(0xFF60A5FA) : AppTheme.primaryBlue,
                                  ),
                                  _QuickActionCard(
                                    icon: Icons.newspaper_rounded,
                                    label: loc.tr('current_affairs'),
                                    path: '/current-affairs',
                                    color: isDark ? const Color(0xFF34D399) : const Color(0xFF10B981),
                                  ),
                                  _QuickActionCard(
                                    icon: Icons.library_books_rounded,
                                    label: loc.tr('pyqs'),
                                    path: '/pyq',
                                    color: isDark ? const Color(0xFFFBBF24) : const Color(0xFFF59E0B),
                                  ),
                                  _QuickActionCard(
                                    icon: Icons.school_rounded,
                                    label: loc.tr('courses'),
                                    path: '/courses',
                                    color: isDark ? const Color(0xFFA78BFA) : AppTheme.secondaryBlue,
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 28),

                        // 4. Test Series Section (Horizontally Scrollable)
                        _buildTestSeriesSection(context, ref, loc, testSeriesAsync),

                        const SizedBox(height: 28),

                        // 5. Current Affairs Latest Edition Card
                        _buildCurrentAffairsSection(context, ref, loc, caAsync),

                        const SizedBox(height: 28),

                        // 6. PYQ Practice Banner
                        _buildPYQSection(context, ref, loc, pyqsAsync),

                        const SizedBox(height: 36),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // 2. Actionable Dynamic Featured Test Pass Card
  Widget _buildContinueOrDiscoveryCard(BuildContext context, WidgetRef ref, AppLocalizations loc, AsyncValue<List<TestSeries>> testSeriesAsync) {
    return testSeriesAsync.when(
      loading: () => const Padding(
        padding: EdgeInsets.symmetric(horizontal: 16),
        child: LoadingShimmer(height: 140),
      ),
      error: (_, __) => const SizedBox.shrink(),
      data: (list) {
        if (list.isEmpty) return const SizedBox.shrink();

        final featured = list.first;

        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 16),
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppTheme.primaryBlue, Color(0xFF1D4ED8)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: AppTheme.primaryBlue.withValues(alpha: 0.18),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${loc.tr('featured_test')} • ${featured.examCategory.toUpperCase()}',
                      style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: 0.5),
                    ),
                  ),
                  const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white70, size: 14),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                featured.title,
                style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Colors.white, height: 1.25),
              ),
              const SizedBox(height: 4),
              Text(
                '${featured.totalTests} Tests • ${featured.freeTestsCount} Free Mocks • ${featured.language}',
                style: const TextStyle(fontSize: 12, color: Colors.white70),
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () {
                  context.push('/test-series/${featured.id}');
                },
                icon: const Icon(Icons.play_arrow_rounded, size: 18),
                label: Text(loc.tr('start_practice')),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: AppTheme.primaryBlue,
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // 4. Test Series Section
  Widget _buildTestSeriesSection(BuildContext context, WidgetRef ref, AppLocalizations loc, AsyncValue<List<TestSeries>> testSeriesAsync) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: _SectionTitle(
            loc.tr('test_series'),
            action: TextButton(
              onPressed: () => context.push('/test-series'),
              child: Text(loc.tr('see_all'), style: TextStyle(color: AppTheme.primaryOf(context), fontSize: 13, fontWeight: FontWeight.bold)),
            ),
          ),
        ),
        const SizedBox(height: 12),
        testSeriesAsync.when(
          loading: () => const LoadingShimmer(height: 160),
          error: (err, _) => Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.red.shade200),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Unable to load test series', style: TextStyle(color: Colors.red, fontSize: 12, fontWeight: FontWeight.w600)),
                  TextButton(
                    onPressed: () => ref.refresh(testSeriesListProvider),
                    child: const Text('Retry', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.red)),
                  ),
                ],
              ),
            ),
          ),
          data: (list) {
            if (list.isEmpty) {
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.cardBgOf(context),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.borderOf(context)),
                  ),
                  child: Text('No test series packages available.', style: TextStyle(fontSize: 12, color: AppTheme.textMutedOf(context))),
                ),
              );
            }
            return SizedBox(
              height: 165,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: list.length,
                itemBuilder: (context, i) {
                  final series = list[i];
                  return _TestSeriesHomeCard(series: series);
                },
              ),
            );
          },
        ),
      ],
    );
  }

  // 5. Current Affairs Section
  Widget _buildCurrentAffairsSection(BuildContext context, WidgetRef ref, AppLocalizations loc, AsyncValue<List<CurrentAffairEditionModel>> caAsync) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: _SectionTitle(
            loc.tr('daily_current_affairs'),
            action: TextButton(
              onPressed: () => context.push('/current-affairs'),
              child: Text(loc.tr('see_all'), style: TextStyle(color: AppTheme.primaryOf(context), fontSize: 13, fontWeight: FontWeight.bold)),
            ),
          ),
        ),
        const SizedBox(height: 12),
        caAsync.when(
          loading: () => const LoadingShimmer(height: 100),
          error: (err, _) => Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.red.shade200),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Unable to load current affairs', style: TextStyle(color: Colors.red, fontSize: 12, fontWeight: FontWeight.w600)),
                  TextButton(
                    onPressed: () => ref.refresh(caEditionsProvider),
                    child: const Text('Retry', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.red)),
                  ),
                ],
              ),
            ),
          ),
          data: (editions) {
            if (editions.isEmpty) {
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.cardBgOf(context),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.borderOf(context)),
                  ),
                  child: Text('No recent current affairs published yet.', style: TextStyle(fontSize: 12, color: AppTheme.textMutedOf(context))),
                ),
              );
            }

            final latest = editions.first;
            final primaryColor = AppTheme.primaryOf(context);

            return Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.cardBgOf(context),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppTheme.borderOf(context)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.03),
                    blurRadius: 6,
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: primaryColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(Icons.newspaper_rounded, color: primaryColor, size: 22),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${loc.tr('daily_current_affairs')} — ${latest.publishDate}',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textPrimaryOf(context)),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${latest.articles.length} exam-relevant articles available',
                          style: TextStyle(fontSize: 12, color: AppTheme.textMutedOf(context)),
                        ),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    onPressed: () => context.push('/current-affairs'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primaryColor.withValues(alpha: 0.15),
                      foregroundColor: primaryColor,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                    child: Text(loc.tr('read_now')),
                  ),
                ],
              ),
            );
          },
        ),
      ],
    );
  }

  // 6. PYQ Practice Section
  Widget _buildPYQSection(BuildContext context, WidgetRef ref, AppLocalizations loc, AsyncValue<dynamic> pyqsAsync) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? const Color(0xFF1E293B) : const Color(0xFFFFFBEB);
    final borderColor = isDark ? const Color(0xFF334155) : const Color(0xFFFDE68A);
    final titleColor = isDark ? const Color(0xFFFBBF24) : const Color(0xFF92400E);
    final subtitleColor = isDark ? const Color(0xFFFCD34D) : const Color(0xFFB45309);
    final iconColor = isDark ? const Color(0xFFFBBF24) : const Color(0xFFD97706);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: borderColor),
        ),
        child: Row(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(Icons.library_books_rounded, color: iconColor, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    loc.tr('practice_past_papers'),
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: titleColor),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    loc.tr('solve_pyqs_sub'),
                    style: TextStyle(fontSize: 11, color: subtitleColor),
                  ),
                ],
              ),
            ),
            ElevatedButton(
              onPressed: () => context.push('/pyq'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFF59E0B),
                foregroundColor: Colors.white,
                elevation: 0,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
              ),
              child: Text(loc.tr('practice_pyq')),
            ),
          ],
        ),
      ),
    );
  }
}

// Subcomponents
class _QuickActionCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String path;
  final Color color;

  const _QuickActionCard({
    required this.icon,
    required this.label,
    required this.path,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => context.go(path),
      borderRadius: BorderRadius.circular(14),
      child: Container(
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withValues(alpha: 0.12)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: 6),
            Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color, height: 1.1),
            ),
          ],
        ),
      ),
    );
  }
}

class _TestSeriesHomeCard extends StatelessWidget {
  final TestSeries series;

  const _TestSeriesHomeCard({required this.series});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryColor = AppTheme.primaryOf(context);

    return Container(
      width: 220,
      margin: const EdgeInsets.only(right: 12),
      child: Card(
        elevation: isDark ? 0 : 1,
        color: AppTheme.cardBgOf(context),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: AppTheme.borderOf(context)),
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () => context.push('/test-series/${series.id}'),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: primaryColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        series.examCategory.toUpperCase(),
                        style: TextStyle(color: primaryColor, fontSize: 9, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      series.title,
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, height: 1.2, color: AppTheme.textPrimaryOf(context)),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${series.totalTests} Mocks',
                      style: TextStyle(fontSize: 11, color: AppTheme.textMutedOf(context)),
                    ),
                    Text(
                      series.price > 0 ? '₹${series.price.toInt()}' : 'Free',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: primaryColor),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
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
        Text(
          title,
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimaryOf(context)),
        ),
        if (action != null) action!,
      ],
    );
  }
}
