import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/theme/app_theme.dart';
import '../../core/services/storage_service.dart';
import '../../models/course_model.dart';
import '../../models/test_series_model.dart';
import '../../providers/courses_provider.dart';
import '../../providers/student_provider.dart';
import '../../providers/test_series_provider.dart';
import '../../widgets/top_header_actions.dart';
import '../../widgets/apple_pressable.dart';
import 'course_viewer_screen.dart';
import 'upload_mains_modal.dart';

class StudentDashboardScreen extends ConsumerStatefulWidget {
  const StudentDashboardScreen({super.key});

  @override
  ConsumerState<StudentDashboardScreen> createState() => _StudentDashboardScreenState();
}

class _StudentDashboardScreenState extends ConsumerState<StudentDashboardScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final List<String> _tabs = [
    'Dashboard',
    'My Courses',
    'Prelims Mocks',
    'Mains Submissions',
    'Analytics',
    'Mentor Connect',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final storage = ref.read(storageServiceProvider);
    final userName = storage.getUserName() ?? 'Aspirant';
    final cardBg = AppTheme.cardBgOf(context);
    final borderCol = AppTheme.borderOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);
    final textMuted = AppTheme.textMutedOf(context);

    final enrollmentsAsync = ref.watch(enrollmentsProvider);
    final coursesAsync = ref.watch(coursesProvider);
    final testSeriesAsync = ref.watch(testSeriesListProvider);
    final attemptsAsync = ref.watch(studentQuizAttemptsProvider);
    final submissionsAsync = ref.watch(studentMainsSubmissionsProvider);
    final analyticsAsync = ref.watch(studentAnalyticsProvider);

    return Scaffold(
      backgroundColor: AppTheme.bgOf(context),
      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: cardBg,
        elevation: 0.5,
        scrolledUnderElevation: 0.5,
        title: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF2563EB), Color(0xFF4F46E5)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
              ),
              child: Center(
                child: Text(
                  userName.isNotEmpty ? userName[0].toUpperCase() : 'S',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Hello, $userName 👋',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    'Civil Services Student Portal',
                    style: TextStyle(fontSize: 10, color: textMuted, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'My Profile',
            onPressed: () => context.push('/student/profile'),
            icon: Icon(Icons.person_outline_rounded, color: textPrimary, size: 22),
          ),
          const TopHeaderActions(),
          const SizedBox(width: 8),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Container(
            color: cardBg,
            child: TabBar(
              controller: _tabController,
              isScrollable: true,
              tabAlignment: TabAlignment.start,
              physics: const BouncingScrollPhysics(),
              labelColor: AppTheme.primaryBlue,
              unselectedLabelColor: textMuted,
              labelStyle: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800),
              unselectedLabelStyle: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600),
              indicatorColor: AppTheme.primaryBlue,
              indicatorWeight: 3,
              indicatorSize: TabBarIndicatorSize.label,
              dividerColor: borderCol,
              tabs: _tabs.map((tab) => Tab(text: tab)).toList(),
            ),
          ),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // 1. Overview Dashboard
          _buildOverviewTab(
            context,
            userName,
            enrollmentsAsync,
            attemptsAsync,
            submissionsAsync,
            coursesAsync,
            testSeriesAsync,
          ),

          // 2. My Courses Tab
          _buildCoursesTab(context, enrollmentsAsync, coursesAsync),

          // 3. Prelims Tests & Attempts Tab
          _buildPrelimsTab(context, attemptsAsync, testSeriesAsync),

          // 4. Mains Submissions & Evaluations Tab
          _buildMainsTab(context, submissionsAsync),

          // 5. Performance Analytics Tab
          _buildAnalyticsTab(context, analyticsAsync, attemptsAsync, enrollmentsAsync),

          // 6. Mentor Connect Tab
          _buildMentorConnectTab(context),
        ],
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 1: OVERVIEW DASHBOARD
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildOverviewTab(
    BuildContext context,
    String userName,
    AsyncValue<List<Enrollment>> enrollmentsAsync,
    AsyncValue<List<dynamic>> attemptsAsync,
    AsyncValue<List<dynamic>> submissionsAsync,
    AsyncValue<List<CourseModel>> coursesAsync,
    AsyncValue<List<TestSeries>> testSeriesAsync,
  ) {
    final cardBg = AppTheme.cardBgOf(context);
    final borderCol = AppTheme.borderOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);
    final textMuted = AppTheme.textMutedOf(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final enrolledList = enrollmentsAsync.valueOrNull ?? [];
    final attemptsList = attemptsAsync.valueOrNull ?? [];
    final submissionsList = submissionsAsync.valueOrNull ?? [];

    int avgProgress = 0;
    if (enrolledList.isNotEmpty) {
      final sum = enrolledList.fold<int>(0, (prev, e) => prev + e.completionPercentage);
      avgProgress = (sum / enrolledList.length).round();
    }

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(enrollmentsProvider);
        ref.invalidate(studentQuizAttemptsProvider);
        ref.invalidate(studentMainsSubmissionsProvider);
        ref.invalidate(studentAnalyticsProvider);
      },
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // KPI Summary Cards
            Row(
              children: [
                _StatTile(
                  icon: Icons.menu_book_rounded,
                  label: 'Courses',
                  value: enrolledList.length.toString(),
                  color: const Color(0xFF2563EB),
                ),
                const SizedBox(width: 8),
                _StatTile(
                  icon: Icons.quiz_outlined,
                  label: 'Prelims Taken',
                  value: attemptsList.length.toString(),
                  color: const Color(0xFFD97706),
                ),
                const SizedBox(width: 8),
                _StatTile(
                  icon: Icons.assignment_turned_in_outlined,
                  label: 'Mains Copies',
                  value: submissionsList.length.toString(),
                  color: const Color(0xFFE11D48),
                ),
                const SizedBox(width: 8),
                _StatTile(
                  icon: Icons.trending_up_rounded,
                  label: 'Avg Progress',
                  value: '$avgProgress%',
                  color: const Color(0xFF10B981),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Quick Hub Actions
            Text(
              'QUICK SHORTCUTS',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: textMuted, letterSpacing: 0.6),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                _QuickActionPill(
                  icon: Icons.upload_file_rounded,
                  label: 'Upload Mains',
                  color: const Color(0xFFF43F5E),
                  onTap: () => UploadMainsModal.show(context),
                ),
                const SizedBox(width: 10),
                _QuickActionPill(
                  icon: Icons.quiz_rounded,
                  label: 'Daily Quiz',
                  color: const Color(0xFF10B981),
                  onTap: () => context.push('/test/daily-quiz-today/instructions'),
                ),
                const SizedBox(width: 10),
                _QuickActionPill(
                  icon: Icons.newspaper_rounded,
                  label: 'Current Affairs',
                  color: const Color(0xFF3B82F6),
                  onTap: () => context.push('/current-affairs'),
                ),
                const SizedBox(width: 10),
                _QuickActionPill(
                  icon: Icons.chat_bubble_outline_rounded,
                  label: 'Doubt Chat',
                  color: const Color(0xFF8B5CF6),
                  onTap: () => context.push('/chat'),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Recent Enrolled Courses
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Continue Learning',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: textPrimary),
                ),
                TextButton(
                  onPressed: () => _tabController.animateTo(1),
                  child: const Text('View All', style: TextStyle(color: AppTheme.primaryBlue, fontSize: 12, fontWeight: FontWeight.w700)),
                ),
              ],
            ),
            const SizedBox(height: 8),

            if (enrolledList.isEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: cardBg,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: borderCol),
                ),
                child: Column(
                  children: [
                    Icon(Icons.school_outlined, size: 40, color: textMuted),
                    const SizedBox(height: 10),
                    Text(
                      'No Enrolled Courses Yet',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: textPrimary),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Enroll in a course or test series to access lectures, tests & study materials.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 11, color: textMuted),
                    ),
                    const SizedBox(height: 14),
                    ElevatedButton.icon(
                      onPressed: () => context.push('/courses'),
                      icon: const Icon(Icons.explore_rounded, size: 16),
                      label: const Text('Browse Programs'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryBlue,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ],
                ),
              )
            else
              ...enrolledList.take(3).map((e) => _buildCourseCard(context, e)),

            const SizedBox(height: 24),

            // Mains Evaluation Callout Banner
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isDark
                      ? [const Color(0xFF1E1B4B), const Color(0xFF311042)]
                      : [const Color(0xFFEEF2FF), const Color(0xFFFDF2F8)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF6366F1).withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: const Color(0xFF6366F1).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.edit_note_rounded, color: Color(0xFF6366F1), size: 24),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Mains Answer Evaluation',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: textPrimary),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Upload your written answers to receive 1-on-1 feedback and line-by-line mark breakdown.',
                          style: TextStyle(fontSize: 11, color: textMuted),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: () => UploadMainsModal.show(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF6366F1),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: const Text('Upload', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 2: MY COURSES
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildCoursesTab(
    BuildContext context,
    AsyncValue<List<Enrollment>> enrollmentsAsync,
    AsyncValue<List<CourseModel>> coursesAsync,
  ) {
    final textPrimary = AppTheme.textPrimaryOf(context);
    final textMuted = AppTheme.textMutedOf(context);

    return enrollmentsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator(color: AppTheme.primaryBlue)),
      error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppTheme.error))),
      data: (enrollments) {
        if (enrollments.isEmpty) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.school_outlined, size: 54, color: textMuted),
                  const SizedBox(height: 12),
                  Text('No Courses Enrolled', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: textPrimary)),
                  const SizedBox(height: 4),
                  Text('Start your preparation with our GS foundation and optional programs.', textAlign: TextAlign.center, style: TextStyle(fontSize: 12, color: textMuted)),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => context.push('/courses'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryBlue,
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('Explore Courses'),
                  ),
                ],
              ),
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
          physics: const BouncingScrollPhysics(),
          itemCount: enrollments.length,
          itemBuilder: (context, i) => _buildCourseCard(context, enrollments[i]),
        );
      },
    );
  }

  Widget _buildCourseCard(BuildContext context, Enrollment e) {
    final cardBg = AppTheme.cardBgOf(context);
    final borderCol = AppTheme.borderOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);
    final textMuted = AppTheme.textMutedOf(context);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderCol),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => CourseViewerScreen(
                  courseId: e.courseId,
                  courseTitle: e.title,
                ),
              ),
            );
          },
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF2563EB), Color(0xFF4F46E5)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.play_circle_filled_rounded, color: Colors.white, size: 24),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            e.title,
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: textPrimary),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${e.category} • Enrolled on ${e.enrolledAt.length > 10 ? e.enrolledAt.substring(0, 10) : e.enrolledAt}',
                            style: TextStyle(fontSize: 11, color: textMuted),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Course Progress', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textMuted)),
                    Text('${e.completionPercentage}%', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppTheme.primaryBlue)),
                  ],
                ),
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: (e.completionPercentage / 100).clamp(0.0, 1.0),
                    minHeight: 6,
                    backgroundColor: borderCol,
                    valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primaryBlue),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 3: PRELIMS TESTS & QUIZZES
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildPrelimsTab(
    BuildContext context,
    AsyncValue<List<dynamic>> attemptsAsync,
    AsyncValue<List<TestSeries>> testSeriesAsync,
  ) {
    final cardBg = AppTheme.cardBgOf(context);
    final borderCol = AppTheme.borderOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);
    final textMuted = AppTheme.textMutedOf(context);

    return attemptsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator(color: AppTheme.primaryBlue)),
      error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppTheme.error))),
      data: (attempts) {
        return SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
          physics: const BouncingScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Prelims banner
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFD97706).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFD97706).withValues(alpha: 0.25)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.timer_outlined, color: Color(0xFFD97706), size: 28),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Prelims Test Attempts & Performance',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Color(0xFFD97706)),
                          ),
                          Text(
                            'Track your live speed, accuracy and rank progression across full mocks.',
                            style: TextStyle(fontSize: 11, color: textMuted),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Attempts History (${attempts.length})',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: textPrimary),
                  ),
                  TextButton.icon(
                    onPressed: () => context.push('/test-series'),
                    icon: const Icon(Icons.add, size: 16),
                    label: const Text('Take Test', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              if (attempts.isEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: cardBg,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: borderCol),
                  ),
                  child: Column(
                    children: [
                      Icon(Icons.quiz_outlined, size: 40, color: textMuted),
                      const SizedBox(height: 10),
                      Text('No Prelims Attempts Yet', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: textPrimary)),
                      const SizedBox(height: 4),
                      Text('Select any Test Series to practice full mocks, sectional & PYQ tests.', textAlign: TextAlign.center, style: TextStyle(fontSize: 11, color: textMuted)),
                      const SizedBox(height: 14),
                      ElevatedButton(
                        onPressed: () => context.push('/test-series'),
                        style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryBlue, foregroundColor: Colors.white),
                        child: const Text('Go to Test Series'),
                      ),
                    ],
                  ),
                )
              else
                ...attempts.map((att) {
                  final title = att['quizTitle'] ?? att['title'] ?? 'Mock Test';
                  final score = (att['score'] != null ? (att['score'] as num).toDouble() : 0.0);
                  final maxScore = (att['maxScore'] != null ? (att['maxScore'] as num).toDouble() : 150.0);
                  final timeSecs = (att['timeTakenSecs'] != null ? (att['timeTakenSecs'] as num).toInt() : 0);
                  final quizId = att['quizId']?.toString() ?? '';

                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: cardBg,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: borderCol),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: const Color(0xFFD97706).withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Center(
                            child: Text(
                              '${score.toStringAsFixed(1)}\npts',
                              textAlign: TextAlign.center,
                              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFFD97706)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(title, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: textPrimary), maxLines: 1, overflow: TextOverflow.ellipsis),
                              const SizedBox(height: 2),
                              Text(
                                'Score: ${score.toStringAsFixed(1)} / ${maxScore.toStringAsFixed(0)} • Time: ${(timeSecs / 60).toStringAsFixed(0)} mins',
                                style: TextStyle(fontSize: 11, color: textMuted),
                              ),
                            ],
                          ),
                        ),
                        if (quizId.isNotEmpty)
                          IconButton(
                            icon: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
                            onPressed: () => context.push('/test/$quizId/instructions'),
                          ),
                      ],
                    ),
                  );
                }),
            ],
          ),
        );
      },
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 4: MAINS SUBMISSIONS & EVALUATIONS
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildMainsTab(
    BuildContext context,
    AsyncValue<List<dynamic>> submissionsAsync,
  ) {
    final cardBg = AppTheme.cardBgOf(context);
    final borderCol = AppTheme.borderOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);
    final textMuted = AppTheme.textMutedOf(context);

    return submissionsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator(color: AppTheme.primaryBlue)),
      error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppTheme.error))),
      data: (subs) {
        return SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
          physics: const BouncingScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFE11D48).withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE11D48).withValues(alpha: 0.2)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.history_edu_rounded, color: Color(0xFFE11D48), size: 28),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Mains Answer Sheet Evaluations',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Color(0xFFE11D48)),
                          ),
                          Text(
                            'Uploaded copies are checked by faculty evaluators within 24-48 hours.',
                            style: TextStyle(fontSize: 11, color: textMuted),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 6),
                    ElevatedButton(
                      onPressed: () => UploadMainsModal.show(context),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFE11D48),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      child: const Text('Upload', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              Text(
                'My Submissions (${subs.length})',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: textPrimary),
              ),
              const SizedBox(height: 10),

              if (subs.isEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: cardBg,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: borderCol),
                  ),
                  child: Column(
                    children: [
                      Icon(Icons.assignment_outlined, size: 40, color: textMuted),
                      const SizedBox(height: 10),
                      Text('No Mains Copies Submitted', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: textPrimary)),
                      const SizedBox(height: 4),
                      Text('Upload handwritten answer copies in PDF format to receive marks and remarks.', textAlign: TextAlign.center, style: TextStyle(fontSize: 11, color: textMuted)),
                      const SizedBox(height: 14),
                      ElevatedButton.icon(
                        onPressed: () => UploadMainsModal.show(context),
                        icon: const Icon(Icons.upload_file_rounded, size: 16),
                        label: const Text('Upload Answer Copy'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFE11D48),
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ],
                  ),
                )
              else
                ...subs.map((s) {
                  final title = s['assignmentTitle'] ?? s['title'] ?? 'Mains Test';
                  final status = s['status']?.toString() ?? 'Submitted';
                  final isEvaluated = status.toLowerCase() == 'evaluated';
                  final grade = s['grade'];
                  final evalPdf = s['evaluatedCopyUrl']?.toString();
                  final feedback = s['feedback']?.toString();

                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: cardBg,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: isEvaluated ? const Color(0xFF10B981).withValues(alpha: 0.3) : borderCol),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                title,
                                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: textPrimary),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: isEvaluated
                                    ? const Color(0xFF10B981).withValues(alpha: 0.12)
                                    : const Color(0xFFD97706).withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                status.toUpperCase(),
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: isEvaluated ? const Color(0xFF10B981) : const Color(0xFFD97706),
                                ),
                              ),
                            ),
                          ],
                        ),
                        if (isEvaluated && grade != null) ...[
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Text(
                                'Score: ',
                                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: textMuted),
                              ),
                              Text(
                                '$grade Marks',
                                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Color(0xFF10B981)),
                              ),
                            ],
                          ),
                        ],
                        if (feedback != null && feedback.isNotEmpty) ...[
                          const SizedBox(height: 6),
                          Text(
                            'Evaluator Feedback: $feedback',
                            style: TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: textPrimary),
                          ),
                        ],
                        if (evalPdf != null && evalPdf.isNotEmpty) ...[
                          const SizedBox(height: 10),
                          InkWell(
                            onTap: () => launchUrl(Uri.parse(evalPdf), mode: LaunchMode.externalApplication),
                            child: const Row(
                              children: [
                                Icon(Icons.picture_as_pdf_rounded, color: AppTheme.primaryBlue, size: 16),
                                SizedBox(width: 6),
                                Text(
                                  'Download Evaluated Copy PDF',
                                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.primaryBlue),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  );
                }),
            ],
          ),
        );
      },
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 5: PERFORMANCE ANALYTICS
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildAnalyticsTab(
    BuildContext context,
    AsyncValue<Map<String, dynamic>?> analyticsAsync,
    AsyncValue<List<dynamic>> attemptsAsync,
    AsyncValue<List<Enrollment>> enrollmentsAsync,
  ) {
    final cardBg = AppTheme.cardBgOf(context);
    final borderCol = AppTheme.borderOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);
    final textMuted = AppTheme.textMutedOf(context);

    final attempts = attemptsAsync.valueOrNull ?? [];
    final enrollments = enrollmentsAsync.valueOrNull ?? [];

    double avgScore = 0;
    if (attempts.isNotEmpty) {
      final total = attempts.fold<double>(0, (prev, a) => prev + ((a['score'] as num?)?.toDouble() ?? 0.0));
      avgScore = total / attempts.length;
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
      physics: const BouncingScrollPhysics(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Performance Analytics & Rank Tracker',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: textPrimary),
          ),
          const SizedBox(height: 4),
          Text(
            'Aggregated insights from your test series and lectures',
            style: TextStyle(fontSize: 11, color: textMuted),
          ),
          const SizedBox(height: 16),

          // Cards Row
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFF2563EB).withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFF2563EB).withValues(alpha: 0.2)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('COURSES', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: Color(0xFF2563EB))),
                      const SizedBox(height: 4),
                      Text(enrollments.length.toString(), style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFF2563EB))),
                      Text('Active Subscriptions', style: TextStyle(fontSize: 10, color: textMuted)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.2)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('AVG SCORE', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: Color(0xFF10B981))),
                      const SizedBox(height: 4),
                      Text(avgScore.toStringAsFixed(1), style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFF10B981))),
                      Text('Across Mocks', style: TextStyle(fontSize: 10, color: textMuted)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Course Progress Breakdown
          Text(
            'Course Syllabi Coverage',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: textPrimary),
          ),
          const SizedBox(height: 10),
          if (enrollments.isEmpty)
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(color: cardBg, borderRadius: BorderRadius.circular(14), border: Border.all(color: borderCol)),
              child: Center(child: Text('Enroll in courses to see syllabus tracking', style: TextStyle(fontSize: 12, color: textMuted))),
            )
          else
            ...enrollments.map((e) => Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(color: cardBg, borderRadius: BorderRadius.circular(14), border: Border.all(color: borderCol)),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(e.title, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: textPrimary), maxLines: 1, overflow: TextOverflow.ellipsis),
                          ),
                          Text('${e.completionPercentage}%', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppTheme.primaryBlue)),
                        ],
                      ),
                      const SizedBox(height: 6),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: (e.completionPercentage / 100).clamp(0.0, 1.0),
                          minHeight: 6,
                          backgroundColor: borderCol,
                          valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primaryBlue),
                        ),
                      ),
                    ],
                  ),
                )),
        ],
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 6: MENTOR CONNECT
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildMentorConnectTab(BuildContext context) {
    final textPrimary = AppTheme.textPrimaryOf(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
      physics: const BouncingScrollPhysics(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF4F46E5).withValues(alpha: 0.25),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Text('1-ON-1 GUIDANCE', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                ),
                const SizedBox(height: 10),
                const Text(
                  'Connect with Top Mentors & Faculty',
                  style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Resolve your exam strategy doubts, request Mains copy feedback clarifications, and discuss optional subject preparation.',
                  style: TextStyle(color: Colors.white70, fontSize: 12, height: 1.4),
                ),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: () => context.push('/chat'),
                  icon: const Icon(Icons.chat_bubble_outline_rounded, size: 16),
                  label: const Text('Open Mentorship Chat'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: const Color(0xFF4F46E5),
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          Text('Mentorship Channels', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: textPrimary)),
          const SizedBox(height: 12),

          _buildMentorTile(
            context,
            icon: Icons.question_answer_outlined,
            title: 'Live Chat Support & Doubt Clearing',
            desc: 'Real-time response from Final Attempt IAS academic mentors.',
            badge: 'ONLINE',
            badgeColor: const Color(0xFF10B981),
            onTap: () => context.push('/chat'),
          ),
          _buildMentorTile(
            context,
            icon: Icons.edit_calendar_outlined,
            title: 'Mains Evaluation Follow-up',
            desc: 'Ask questions regarding marks awarded in your evaluated answer copy.',
            badge: 'MAINS PORTAL',
            badgeColor: const Color(0xFF6366F1),
            onTap: () => _tabController.animateTo(3),
          ),
          _buildMentorTile(
            context,
            icon: Icons.groups_outlined,
            title: 'Faculty Profiles & Strategies',
            desc: 'Explore insights and guidance lectures from our experienced educators.',
            badge: 'FACULTY',
            badgeColor: const Color(0xFFD97706),
            onTap: () => context.push('/faculty'),
          ),
        ],
      ),
    );
  }

  Widget _buildMentorTile(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String desc,
    required String badge,
    required Color badgeColor,
    required VoidCallback onTap,
  }) {
    final cardBg = AppTheme.cardBgOf(context);
    final borderCol = AppTheme.borderOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);
    final textMuted = AppTheme.textMutedOf(context);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderCol),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: badgeColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: badgeColor, size: 22),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              title,
                              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: textPrimary),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: badgeColor.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              badge,
                              style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: badgeColor),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 3),
                      Text(desc, style: TextStyle(fontSize: 11, color: textMuted)),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Icon(Icons.arrow_forward_ios_rounded, size: 14, color: textMuted),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
class _StatTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatTile({required this.icon, required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(height: 4),
            Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: color)),
            Text(label, textAlign: TextAlign.center, style: const TextStyle(fontSize: 9, color: AppTheme.textMuted, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}

class _QuickActionPill extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionPill({required this.icon, required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: ApplePressable(
        scaleDown: 0.96,
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 6),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: color.withValues(alpha: 0.2)),
          ),
          child: Column(
            children: [
              Icon(icon, color: color, size: 22),
              const SizedBox(height: 6),
              Text(
                label,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w800, color: color),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
