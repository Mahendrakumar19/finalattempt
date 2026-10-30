import 'dart:async';
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
import '../../providers/content_providers.dart';
import '../../models/site_settings_model.dart';
import '../../models/test_series_model.dart';
import '../../models/current_affair_model.dart';
import '../../models/course_model.dart';
import '../../models/blog_model.dart';
import '../../providers/courses_provider.dart';
import '../../widgets/apple_pressable.dart';

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
    final caAsync = ref.watch(caEditionsProvider(loc.langCode));
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
                ref.invalidate(caEditionsProvider(loc.langCode));
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

                        // 3. Quick Action Preparation Portal Grid (Matching Website Core Portal)
                        _buildPreparationPortalGrid(context, loc),

                        const SizedBox(height: 28),

                        // 4. Test Series Section (Horizontally Scrollable)
                        _buildTestSeriesSection(context, ref, loc, testSeriesAsync),

                        const SizedBox(height: 24),

                        // 4b. Daily Quiz & Practice Hub Banner
                        _buildDailyQuizSection(context, ref, loc),

                        const SizedBox(height: 28),

                        // 4c. Website Live Courses & Batches Section (Matching Website)
                        _buildCoursesSection(context, ref, loc),

                        const SizedBox(height: 28),

                        // 5. Current Affairs Latest Edition Card
                        _buildCurrentAffairsSection(context, ref, loc, caAsync),

                        const SizedBox(height: 28),

                        // 6. PYQ Practice Banner
                        _buildPYQSection(context, ref, loc, pyqsAsync),

                        const SizedBox(height: 28),

                        // 7. Why Final Attempt Stands Out (Pillars from Website)
                        _buildWhyFinalAttemptSection(context, loc),

                        const SizedBox(height: 28),

                        // 8. Latest Strategy Articles & Insights (From Website)
                        _buildLatestInsightsSection(context, ref, loc),

                        const SizedBox(height: 110),
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

  // 2. Actionable Dynamic Image Banner Carousel Slider (matching website main site hero slider)
  Widget _buildContinueOrDiscoveryCard(BuildContext context, WidgetRef ref, AppLocalizations loc, AsyncValue<List<TestSeries>> testSeriesAsync) {
    final settingsAsync = ref.watch(settingsProvider);
    final settings = settingsAsync.value;

    return testSeriesAsync.when(
      loading: () => const Padding(
        padding: EdgeInsets.symmetric(horizontal: 16),
        child: LoadingShimmer(height: 180),
      ),
      error: (_, __) => _HeroImageCarouselSlider(settings: settings, testSeriesList: const []),
      data: (list) {
        return _HeroImageCarouselSlider(settings: settings, testSeriesList: list);
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
              height: 280,
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

  // 4b. Daily Quiz Practice Hub Card
  Widget _buildDailyQuizSection(BuildContext context, WidgetRef ref, AppLocalizations loc) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryColor = AppTheme.primaryOf(context);
    final cardBg = isDark ? const Color(0xFF1E293B) : Colors.white;
    final borderCol = AppTheme.borderOf(context);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: ApplePressable(
        scaleDown: 0.98,
        enableHaptic: true,
        onTap: () => context.push('/test/daily-quiz-today/instructions'),
        child: Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: cardBg,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: borderCol),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.3)),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.bolt_rounded, size: 14, color: Color(0xFF10B981)),
                        SizedBox(width: 4),
                        Text(
                          'DAILY LIVE QUIZ',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF10B981),
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: primaryColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      'FREE PRACTICE',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: primaryColor,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                'Daily Current Affairs & Bihar GS Practice',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimaryOf(context),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '10 High-yield exam questions covering state economy, polity, history & international affairs.',
                style: TextStyle(
                  fontSize: 12,
                  color: AppTheme.textMutedOf(context),
                  height: 1.35,
                ),
              ),
              const SizedBox(height: 14),
              Wrap(
                spacing: 12,
                runSpacing: 10,
                alignment: WrapAlignment.spaceBetween,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.timer_outlined, size: 14, color: AppTheme.textMutedOf(context)),
                          const SizedBox(width: 4),
                          Text(
                            '10 Mins',
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textMutedOf(context)),
                          ),
                        ],
                      ),
                      const SizedBox(width: 14),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.help_outline_rounded, size: 14, color: AppTheme.textMutedOf(context)),
                          const SizedBox(width: 4),
                          Text(
                            '10 Questions',
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textMutedOf(context)),
                          ),
                        ],
                      ),
                    ],
                  ),
                  ElevatedButton.icon(
                    onPressed: () {
                      context.push('/test/daily-quiz-today/instructions');
                    },
                    icon: const Icon(Icons.play_arrow_rounded, size: 16),
                    label: const Text('Start Quiz'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primaryColor,
                      foregroundColor: isDark ? Colors.black : Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
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
                    onPressed: () => ref.refresh(caEditionsProvider(loc.langCode)),
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

  // 4c. Website Live Courses & Batches Section (Matching Website)
  Widget _buildCoursesSection(BuildContext context, WidgetRef ref, AppLocalizations loc) {
    final coursesAsync = ref.watch(coursesProvider);
    final primaryColor = AppTheme.primaryOf(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: _SectionTitle(
            'Target Batches & Courses',
            action: TextButton(
              onPressed: () => context.push('/courses'),
              child: Text(
                loc.tr('see_all'),
                style: TextStyle(color: primaryColor, fontSize: 13, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        coursesAsync.when(
          loading: () => const LoadingShimmer(height: 150),
          error: (_, __) => const SizedBox.shrink(),
          data: (courses) {
            if (courses.isEmpty) return const SizedBox.shrink();
            return SizedBox(
              height: 190,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: courses.length,
                itemBuilder: (context, i) {
                  final course = courses[i];
                  return _CourseHomeCard(course: course);
                },
              ),
            );
          },
        ),
      ],
    );
  }

  // 7. Core Preparation Portal 9-Grid (Matching Website Section 3.44)
  Widget _buildPreparationPortalGrid(BuildContext context, AppLocalizations loc) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? const Color(0xFF1E293B) : Colors.white;
    final borderCol = AppTheme.borderOf(context);

    final portalItems = [
      {
        'title': 'DAILY CURRENT AFFAIRS',
        'icon': Icons.newspaper_rounded,
        'color': const Color(0xFFEF4444),
        'path': '/current-affairs',
        'badge': null,
      },
      {
        'title': 'DAILY LIVE QUIZ',
        'icon': Icons.local_fire_department_rounded,
        'color': const Color(0xFFF59E0B),
        'path': '/test/daily-quiz-today/instructions',
        'badge': 'HOT',
      },
      {
        'title': 'OFFICIAL PYQ PAPERS',
        'icon': Icons.description_rounded,
        'color': const Color(0xFF3B82F6),
        'path': '/pyq',
        'badge': null,
      },
      {
        'title': 'NCERT TEXTBOOKS',
        'icon': Icons.menu_book_rounded,
        'color': const Color(0xFF10B981),
        'path': '/downloads/ncert',
        'badge': null,
      },
      {
        'title': 'USEFUL DOCUMENTS',
        'icon': Icons.bolt_rounded,
        'color': const Color(0xFFF59E0B),
        'path': '/downloads/useful-documents',
        'badge': null,
      },
      {
        'title': 'VALUE ADDED MAINS',
        'icon': Icons.lightbulb_rounded,
        'color': const Color(0xFFA855F7),
        'path': '/downloads/value-added-mains',
        'badge': null,
      },
      {
        'title': 'TOPPERS\' COPIES',
        'icon': Icons.fact_check_rounded,
        'color': const Color(0xFF14B8A6),
        'path': '/downloads/toppers-copies',
        'badge': null,
      },
      {
        'title': 'SYLLABUS & STRATEGY',
        'icon': Icons.explore_rounded,
        'color': const Color(0xFF6366F1),
        'path': '/syllabus-strategy',
        'badge': null,
      },
      {
        'title': 'FA PUBLICATIONS & BOOKS',
        'icon': Icons.menu_book_rounded,
        'assetImage': 'assets/images/favicon.png',
        'color': const Color(0xFFD97706),
        'path': '/downloads/fa-publication',
        'badge': 'NEW',
      },
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 4,
                height: 18,
                decoration: BoxDecoration(
                  color: const Color(0xFFF59E0B),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                'QUICK ACTIONS • PREPARATION PORTAL',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.5,
                  color: AppTheme.textPrimaryOf(context),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          LayoutBuilder(
            builder: (context, constraints) {
              final width = constraints.maxWidth;
              final crossAxisCount = width > 600 ? 4 : (width < 340 ? 2 : 3);
              final aspectRatio = width < 360 ? 0.95 : 0.88;

              return GridView.builder(
                itemCount: portalItems.length,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: crossAxisCount,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: aspectRatio,
                ),
                itemBuilder: (context, idx) {
                  final item = portalItems[idx];
                  final itemColor = item['color'] as Color;
                  final badge = item['badge'] as String?;

                  return ApplePressable(
                    onTap: () => context.push(item['path'] as String),
                    scaleDown: 0.94,
                    enableHaptic: true,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
                      decoration: BoxDecoration(
                        color: cardBg,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: borderCol),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Stack(
                        children: [
                          if (badge != null)
                            Positioned(
                              top: 0,
                              right: 0,
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    colors: [Color(0xFFDC2626), Color(0xFFF59E0B)],
                                  ),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  badge,
                                  style: const TextStyle(
                                    fontSize: 8,
                                    fontWeight: FontWeight.w900,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ),
                          Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(
                                  width: 38,
                                  height: 38,
                                  decoration: BoxDecoration(
                                    color: item['assetImage'] != null ? Colors.white : itemColor.withValues(alpha: 0.12),
                                    shape: BoxShape.circle,
                                    border: item['assetImage'] != null
                                        ? Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.35), width: 1.5)
                                        : null,
                                  ),
                                  child: item['assetImage'] != null
                                      ? ClipOval(
                                          child: Padding(
                                            padding: const EdgeInsets.all(5),
                                            child: Image.asset(
                                              item['assetImage'] as String,
                                              fit: BoxFit.contain,
                                            ),
                                          ),
                                        )
                                      : Icon(
                                          item['icon'] as IconData,
                                          color: itemColor,
                                          size: 20,
                                        ),
                                ),
                                const SizedBox(height: 6),
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 2),
                                  child: Text(
                                    item['title'] as String,
                                    textAlign: TextAlign.center,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(
                                      fontSize: 9.5,
                                      fontWeight: FontWeight.w800,
                                      color: AppTheme.textPrimaryOf(context),
                                      height: 1.15,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              );
            },
          ),
        ],
      ),
    );
  }

  // 8. Why Final Attempt Stands Out (Matching Website Section 3.4)
  Widget _buildWhyFinalAttemptSection(BuildContext context, AppLocalizations loc) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? const Color(0xFF1E293B) : Colors.white;
    final borderCol = AppTheme.borderOf(context);

    final pillars = [
      {
        'title': 'Personalized Mentorship',
        'desc': 'Direct 1-on-1 regular interaction, strategy guidance & answer writing feedback.',
        'icon': Icons.people_outline_rounded,
        'color': const Color(0xFF3B82F6),
      },
      {
        'title': 'Top Educator Faculty',
        'desc': 'Learn directly from seasoned mentors with proven civil services expertise.',
        'icon': Icons.school_outlined,
        'color': const Color(0xFFF59E0B),
      },
      {
        'title': 'Focused State PCS Syllabus',
        'desc': 'Complete coverage aligned with the latest evolving pattern of BPSC & State exams.',
        'icon': Icons.track_changes_rounded,
        'color': const Color(0xFFEF4444),
      },
      {
        'title': 'Rigorous Answer Evaluation',
        'desc': 'In-depth line-by-line Mains checking within 24-48 hours with model answers.',
        'icon': Icons.edit_note_rounded,
        'color': const Color(0xFFF97316),
      },
      {
        'title': 'Real-Time Rank & Analytics',
        'desc': 'Compare your preparation standing across thousands of serious state aspirants.',
        'icon': Icons.bar_chart_rounded,
        'color': const Color(0xFF14B8A6),
      },
      {
        'title': 'AI & Digital Smart Tools',
        'desc': 'Targeted practice papers, performance heatmaps & curated digital material.',
        'icon': Icons.rocket_launch_outlined,
        'color': const Color(0xFFA855F7),
      },
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 4,
                height: 18,
                decoration: BoxDecoration(
                  color: const Color(0xFF3B82F6),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                'WHY FINAL ATTEMPT STANDS OUT',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.5,
                  color: AppTheme.textPrimaryOf(context),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ListView.separated(
            itemCount: pillars.length,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, idx) {
              final p = pillars[idx];
              final pColor = p['color'] as Color;

              return Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: cardBg,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: borderCol),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: pColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(p['icon'] as IconData, color: pColor, size: 20),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            p['title'] as String,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.textPrimaryOf(context),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            p['desc'] as String,
                            style: TextStyle(
                              fontSize: 11,
                              color: AppTheme.textMutedOf(context),
                              height: 1.3,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  // 9. Latest Strategy Articles & Insights (Matching Website Section 3.48)
  Widget _buildLatestInsightsSection(BuildContext context, WidgetRef ref, AppLocalizations loc) {
    final blogsAsync = ref.watch(blogsProvider);
    final primaryColor = AppTheme.primaryOf(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: _SectionTitle(
            'Strategy Insights & Articles',
            action: TextButton(
              onPressed: () => context.push('/blog'),
              child: Text(
                loc.tr('see_all'),
                style: TextStyle(color: primaryColor, fontSize: 13, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        blogsAsync.when(
          loading: () => const LoadingShimmer(height: 120),
          error: (_, __) => const SizedBox.shrink(),
          data: (blogs) {
            if (blogs.isEmpty) return const SizedBox.shrink();
            final topBlogs = blogs.take(3).toList();

            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: ListView.separated(
                itemCount: topBlogs.length,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, idx) {
                  final b = topBlogs[idx];
                  return _BlogHomeCard(blog: b);
                },
              ),
            );
          },
        ),
      ],
    );
  }
}

// Course Home Card
class _CourseHomeCard extends StatelessWidget {
  final CourseModel course;

  const _CourseHomeCard({required this.course});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryColor = AppTheme.primaryOf(context);

    return Container(
      width: 240,
      margin: const EdgeInsets.only(right: 12),
      child: ApplePressable(
        scaleDown: 0.96,
        enableHaptic: true,
        onTap: () => context.push('/courses/${course.id}'),
        child: Card(
          elevation: isDark ? 0 : 1,
          color: AppTheme.cardBgOf(context),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
            side: BorderSide(color: AppTheme.borderOf(context)),
          ),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (course.thumbnail != null && course.thumbnail!.isNotEmpty)
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: AspectRatio(
                          aspectRatio: 16 / 9,
                          child: Image.network(
                            course.thumbnail!.startsWith('http')
                                ? course.thumbnail!
                                : 'https://finalattemptias.com${course.thumbnail}',
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                          ),
                        ),
                      )
                    else
                      Container(
                        height: 70,
                        decoration: BoxDecoration(
                          color: const Color(0xFF2563EB).withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Center(
                          child: Icon(Icons.school_rounded, color: Color(0xFF2563EB), size: 28),
                        ),
                      ),
                    const SizedBox(height: 8),
                    if (course.category != null)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: primaryColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          course.category!.toUpperCase(),
                          style: TextStyle(color: primaryColor, fontSize: 9, fontWeight: FontWeight.bold),
                        ),
                      ),
                    const SizedBox(height: 4),
                    Text(
                      course.title,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimaryOf(context),
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      course.duration ?? 'Batch Access',
                      style: TextStyle(fontSize: 11, color: AppTheme.textMutedOf(context)),
                    ),
                    Text(
                      course.fee != null ? '₹${course.fee}' : 'Enquire',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: primaryColor),
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

// Blog Home Card
class _BlogHomeCard extends StatelessWidget {
  final BlogModel blog;

  const _BlogHomeCard({required this.blog});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryColor = AppTheme.primaryOf(context);

    return ApplePressable(
      onTap: () => context.push('/blog/${blog.id}'),
      scaleDown: 0.98,
      enableHaptic: true,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppTheme.cardBgOf(context),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppTheme.borderOf(context)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            if (blog.imageUrl != null && blog.imageUrl!.isNotEmpty)
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: SizedBox(
                  width: 70,
                  height: 70,
                  child: Image.network(
                    blog.imageUrl!.startsWith('http')
                        ? blog.imageUrl!
                        : 'https://finalattemptias.com${blog.imageUrl}',
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      color: primaryColor.withValues(alpha: 0.1),
                      child: Icon(Icons.article_rounded, color: primaryColor, size: 24),
                    ),
                  ),
                ),
              )
            else
              Container(
                width: 70,
                height: 70,
                decoration: BoxDecoration(
                  color: primaryColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(Icons.article_rounded, color: primaryColor, size: 28),
              ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF59E0B).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      (blog.category ?? 'STRATEGY').toUpperCase(),
                      style: const TextStyle(
                        fontSize: 8.5,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFFD97706),
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    blog.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 12.5,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimaryOf(context),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    blog.author ?? 'Final Attempt',
                    style: TextStyle(
                      fontSize: 10.5,
                      color: AppTheme.textMutedOf(context),
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded, color: AppTheme.textMutedOf(context), size: 20),
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
      child: ApplePressable(
        scaleDown: 0.96,
        enableHaptic: true,
        onTap: () => context.push('/test-series/${series.id}'),
        child: Card(
          elevation: isDark ? 0 : 1,
          color: AppTheme.cardBgOf(context),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(color: AppTheme.borderOf(context)),
          ),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (series.thumbnailUrl != null || series.bannerUrl != null) ...[
                      Builder(
                        builder: (context) {
                          String imgUrl = series.thumbnailUrl ?? series.bannerUrl!;
                          if (imgUrl.isNotEmpty) {
                            if (!imgUrl.startsWith('http')) {
                              imgUrl = imgUrl.startsWith('/') ? 'https://finalattemptias.com$imgUrl' : 'https://finalattemptias.com/$imgUrl';
                            }
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 8),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: AspectRatio(
                                  aspectRatio: 16 / 9,
                                  child: Image.network(
                                    imgUrl,
                                    fit: BoxFit.cover,
                                    width: double.infinity,
                                    errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                                  ),
                                ),
                              ),
                            );
                          }
                          return const SizedBox.shrink();
                        },
                      ),
                    ],
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
                      (series.discountedPrice ?? series.price) > 0 
                          ? '₹${(series.discountedPrice ?? series.price).toInt()}' 
                          : 'Free',
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

class _HeroImageCarouselSlider extends StatefulWidget {
  final SiteSettingsModel? settings;
  final List<TestSeries> testSeriesList;

  const _HeroImageCarouselSlider({
    this.settings,
    required this.testSeriesList,
  });

  @override
  State<_HeroImageCarouselSlider> createState() => _HeroImageCarouselSliderState();
}

class _HeroImageCarouselSliderState extends State<_HeroImageCarouselSlider> {
  late final PageController _pageController;
  int _currentIndex = 0;
  Timer? _timer;

  List<String> _resolveImageUrls() {
    final rawUrls = widget.settings?.heroImageUrl;
    if (rawUrls != null && rawUrls.trim().isNotEmpty) {
      final split = rawUrls.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
      if (split.isNotEmpty) {
        return split.map((url) {
          if (url.startsWith('http://') || url.startsWith('https://')) return url;
          if (url.startsWith('/')) return 'https://finalattemptias.com$url';
          return 'https://finalattemptias.com/$url';
        }).toList();
      }
    }
    return [];
  }

  @override
  void initState() {
    super.initState();
    _pageController = PageController(initialPage: 0);
    _timer = Timer.periodic(const Duration(seconds: 4), (timer) {
      if (!mounted) return;
      if (_pageController.hasClients) {
        final urls = _resolveImageUrls();
        final itemCount = urls.isNotEmpty ? urls.length : 4;
        final nextPage = (_currentIndex + 1) % itemCount;
        _pageController.animateToPage(
          nextPage,
          duration: const Duration(milliseconds: 600),
          curve: Curves.fastOutSlowIn,
        );
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final imageUrls = _resolveImageUrls();
    final testSeriesList = widget.testSeriesList;
    final featuredSeries = testSeriesList.isNotEmpty ? testSeriesList.first : null;

    if (imageUrls.isNotEmpty) {
      // IMAGE SLIDER MODE (matching main website hero image carousel slider)
      return Column(
        children: [
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            width: double.infinity,
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.08),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: AspectRatio(
                aspectRatio: 3840 / 1326, // Exact banner aspect ratio from website
                child: PageView.builder(
                  controller: _pageController,
                  itemCount: imageUrls.length,
                  onPageChanged: (index) {
                    setState(() => _currentIndex = index);
                  },
                  itemBuilder: (context, index) {
                    final imgUrl = imageUrls[index];
                    return InkWell(
                      onTap: () {
                        if (featuredSeries != null) {
                          context.push('/test-series/${featuredSeries.id}');
                        } else {
                          context.push('/test-series');
                        }
                      },
                      child: Image.network(
                        imgUrl,
                        fit: BoxFit.cover,
                        width: double.infinity,
                        height: double.infinity,
                        gaplessPlayback: true,
                        filterQuality: FilterQuality.medium,
                        errorBuilder: (context, error, stackTrace) {
                          return _buildFallbackCard(context, index, isDark, featuredSeries);
                        },
                        loadingBuilder: (context, child, loadingProgress) {
                          if (loadingProgress == null) return child;
                          return AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
                            child: const Center(
                              child: SizedBox(
                                width: 24,
                                height: 24,
                                child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryBlue),
                              ),
                            ),
                          );
                        },
                      ),
                    );
                  },
                ),
              ),
            ),
          ),
          const SizedBox(height: 10),

          // Indicator Dots
          if (imageUrls.length > 1)
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                imageUrls.length,
                (index) => AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  width: _currentIndex == index ? 22 : 6,
                  height: 6,
                  decoration: BoxDecoration(
                    color: _currentIndex == index
                        ? AppTheme.primaryOf(context)
                        : AppTheme.textMutedOf(context).withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ),
        ],
      );
    }

    // FALLBACK CAROUSEL BANNER CARDS
    final fallbackSlides = [
      _SlideData(
        tag: 'FEATURED TEST • PRELIMS',
        title: featuredSeries?.title ?? 'BPSC Prelims PYQ Test Series 2026',
        subtitle: featuredSeries != null
            ? '${featuredSeries.totalTests} Tests • ${featuredSeries.freeTestsCount} Free Mocks • ${featuredSeries.language}'
            : '40 Tests • 1 Free Mock • Bilingual',
        buttonText: 'Start Practice Test',
        buttonIcon: Icons.play_arrow_rounded,
        gradient: isDark
            ? [const Color(0xFF1E3A8A), const Color(0xFF1D4ED8)]
            : [const Color(0xFF1E3A8A), const Color(0xFF2563EB)],
        onTap: () {
          if (featuredSeries != null) {
            context.push('/test-series/${featuredSeries.id}');
          } else {
            context.push('/test-series');
          }
        },
      ),
      _SlideData(
        tag: 'ADMISSIONS OPEN • BATCH 2026',
        title: '71st BPSC Foundation & Prelims Master Batch',
        subtitle: 'Live Classes • Daily Mains Copy Evaluation • Bilingual Study Notes',
        buttonText: 'Explore Course',
        buttonIcon: Icons.school_rounded,
        gradient: isDark
            ? [const Color(0xFF0F172A), const Color(0xFF334155)]
            : [const Color(0xFF0F172A), const Color(0xFF1E293B)],
        onTap: () => context.push('/courses'),
      ),
      _SlideData(
        tag: 'DAILY UPDATE • BILINGUAL',
        title: 'Daily Current Affairs & Editorial Analysis',
        subtitle: 'National, International & Bihar Special Mains Analysis with MCQs',
        buttonText: 'Read Today\'s CA',
        buttonIcon: Icons.newspaper_rounded,
        gradient: isDark
            ? [const Color(0xFF065F46), const Color(0xFF047857)]
            : [const Color(0xFF047857), const Color(0xFF10B981)],
        onTap: () => context.push('/current-affairs'),
      ),
      _SlideData(
        tag: 'FREE DOWNLOADS • PYQ BANK',
        title: 'Official 10+ Years PYQs & NCERT Study Notes',
        subtitle: 'Download Prelims & Mains Past Year Question Papers with Answer Keys',
        buttonText: 'Practice PYQs',
        buttonIcon: Icons.library_books_rounded,
        gradient: isDark
            ? [const Color(0xFF78350F), const Color(0xFFB45309)]
            : [const Color(0xFFB45309), const Color(0xFFF59E0B)],
        onTap: () => context.push('/pyq'),
      ),
    ];

    return Column(
      children: [
        SizedBox(
          height: 185,
          child: PageView.builder(
            controller: _pageController,
            itemCount: fallbackSlides.length,
            onPageChanged: (index) {
              setState(() => _currentIndex = index);
            },
            itemBuilder: (context, index) {
              final slide = fallbackSlides[index];
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: slide.gradient,
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: isDark ? 0.20 : 0.40),
                      width: 1.2,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: slide.gradient.last.withValues(alpha: 0.3),
                        blurRadius: 16,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.18),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              slide.tag,
                              style: const TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                                letterSpacing: 0.6,
                              ),
                            ),
                          ),
                          const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white70, size: 14),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            slide.title,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                              height: 1.2,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            slide.subtitle,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 12, color: Colors.white70),
                          ),
                        ],
                      ),
                      ElevatedButton.icon(
                        onPressed: slide.onTap,
                        icon: Icon(slide.buttonIcon, size: 18),
                        label: Text(slide.buttonText),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: slide.gradient.first,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                          textStyle: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 10),

        // Indicator Dots
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            fallbackSlides.length,
            (index) => AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: _currentIndex == index ? 22 : 6,
              height: 6,
              decoration: BoxDecoration(
                color: _currentIndex == index
                    ? AppTheme.primaryOf(context)
                    : AppTheme.textMutedOf(context).withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildFallbackCard(BuildContext context, int index, bool isDark, TestSeries? featuredSeries) {
    return Container(
      color: isDark ? const Color(0xFF1E293B) : const Color(0xFF2563EB),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            featuredSeries?.title ?? 'Final Attempt - IAS & BPSC Prep',
            style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          const Text(
            'Explore test series, daily current affairs, and mentorship.',
            style: TextStyle(color: Colors.white70, fontSize: 12),
          ),
        ],
      ),
    );
  }
}

class _SlideData {
  final String tag;
  final String title;
  final String subtitle;
  final String buttonText;
  final IconData buttonIcon;
  final List<Color> gradient;
  final VoidCallback onTap;

  _SlideData({
    required this.tag,
    required this.title,
    required this.subtitle,
    required this.buttonText,
    required this.buttonIcon,
    required this.gradient,
    required this.onTap,
  });
}
