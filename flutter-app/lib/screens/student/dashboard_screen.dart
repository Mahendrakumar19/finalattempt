import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../providers/courses_provider.dart';
import '../../providers/student_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/services/storage_service.dart';
import '../../widgets/top_header_actions.dart';
import 'course_viewer_screen.dart';

class StudentDashboardScreen extends ConsumerWidget {
  const StudentDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final enrollmentsAsync = ref.watch(enrollmentsProvider);
    final coursesAsync = ref.watch(coursesProvider);
    final storage = ref.read(storageServiceProvider);
    
    // Fallback info if we don't have stats yet
    final enrolledCount = enrollmentsAsync.valueOrNull?.length ?? 0;
    
    // Calculate total progress across all courses
    int totalProgress = 0;
    if (enrollmentsAsync.valueOrNull != null && enrollmentsAsync.valueOrNull!.isNotEmpty) {
      final enrollments = enrollmentsAsync.valueOrNull!;
      int sum = 0;
      for (var e in enrollments) {
        sum += e.completionPercentage;
      }
      totalProgress = (sum / enrollments.length).round();
    }

    return Scaffold(
      backgroundColor: AppTheme.bgOf(context),
      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: AppTheme.bgOf(context),
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Hello, ${storage.getUserName() ?? 'Aspirant'} 👋',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: AppTheme.textPrimaryOf(context),
              ),
            ),
            const Text(
              'Ready to conquer today?',
              style: TextStyle(
                fontSize: 11,
                color: AppTheme.textMuted,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        actions: const [
          TopHeaderActions(),
          SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Stats Row
            Row(
              children: [
                _StatCard(icon: Icons.school_rounded, label: 'Enrolled', value: enrolledCount.toString(), color: const Color(0xFF3B82F6)),
                const SizedBox(width: 12),
                _StatCard(icon: Icons.check_circle_rounded, label: 'Progress', value: '$totalProgress%', color: AppTheme.success),
                const SizedBox(width: 12),
                _StatCard(icon: Icons.emoji_events_rounded, label: 'Quizzes', value: '—', color: AppTheme.warning),
              ],
            ),

            const SizedBox(height: 24),

            // Quick Actions
            Text(
              'Quick Actions',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: AppTheme.textPrimaryOf(context),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                _ActionTile(
                  icon: Icons.newspaper_rounded,
                  label: 'Current Affairs',
                  color: const Color(0xFF10B981),
                  onTap: () => context.go('/current-affairs'),
                ),
                const SizedBox(width: 10),
                _ActionTile(
                  icon: Icons.upload_file_rounded,
                  label: 'Upload Mains Copy',
                  color: const Color(0xFFF43F5E),
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Mains Answer Copy Evaluation portal ready! Select your test program to upload answer sheet.'),
                        duration: Duration(seconds: 2),
                      ),
                    );
                  },
                ),
                const SizedBox(width: 10),
                _ActionTile(
                  icon: Icons.article_rounded,
                  label: 'Blog & Notes',
                  color: const Color(0xFF8B5CF6),
                  onTap: () => context.go('/blog'),
                ),
              ],
            ),

            const SizedBox(height: 24),

            // My Courses (Enrollments)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'My Courses',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.textPrimaryOf(context),
                  ),
                ),
                if (enrolledCount > 0)
                  TextButton(
                    onPressed: () {
                      // context.push('/student/courses');
                    },
                    child: const Text(
                      'View All',
                      style: TextStyle(color: AppTheme.primaryBlue, fontSize: 12, fontWeight: FontWeight.w700),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 10),
            
            enrollmentsAsync.when(
              data: (enrollments) {
                if (enrollments.isEmpty) {
                  return Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
                    decoration: BoxDecoration(
                      color: AppTheme.cardBgOf(context),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppTheme.borderOf(context)),
                    ),
                    child: Column(
                      children: [
                        Icon(Icons.lock_outline_rounded, size: 40, color: AppTheme.textMutedOf(context)),
                        const SizedBox(height: 12),
                        Text(
                          'No Enrolled Courses',
                          style: TextStyle(fontWeight: FontWeight.w700, color: AppTheme.textPrimaryOf(context)),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Explore our programs to start your journey.',
                          style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
                        ),
                      ],
                    ),
                  );
                }
                
                return Column(
                  children: enrollments.take(3).map((e) => InkWell(
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => CourseViewerScreen(
                            courseId: e.courseId,
                            courseTitle: e.title,
                          ),
                        ),
                      );
                    },
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppTheme.cardBgOf(context),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppTheme.borderOf(context)),
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.primaryBlue.withValues(alpha: 0.05),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          )
                        ]
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF2563EB), Color(0xFF4F46E5)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Icon(Icons.menu_book_rounded, color: Colors.white, size: 24),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                e.title,
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.textPrimaryOf(context),
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${e.category} · Enrolled ${e.enrolledAt.length > 10 ? e.enrolledAt.substring(0, 10) : e.enrolledAt}', 
                                style: const TextStyle(fontSize: 11, color: AppTheme.textMuted, fontWeight: FontWeight.w500)
                              ),
                              const SizedBox(height: 10),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Progress', style: TextStyle(fontSize: 10, color: AppTheme.textMuted, fontWeight: FontWeight.w600)),
                                  Text('${e.completionPercentage}%', style: TextStyle(fontSize: 10, color: AppTheme.textPrimaryOf(context), fontWeight: FontWeight.w700)),
                                ],
                              ),
                              const SizedBox(height: 4),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(4),
                                child: LinearProgressIndicator(
                                  value: e.completionPercentage / 100,
                                  minHeight: 6,
                                  backgroundColor: AppTheme.borderOf(context),
                                  valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primaryBlue),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                )).toList(),
                );
              },
              loading: () => const Center(child: CircularProgressIndicator(color: AppTheme.primaryBlue)),
              error: (_, __) => const Text('Failed to load courses', style: TextStyle(color: AppTheme.error)),
            ),

            const SizedBox(height: 24),

            // Available Courses (if not many enrollments)
            if (enrolledCount < 2) ...[
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Available Programs',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.textPrimaryOf(context),
                    ),
                  ),
                  TextButton(
                    onPressed: () => context.go('/courses'),
                    child: const Text(
                      'Browse All',
                      style: TextStyle(color: AppTheme.primaryBlue, fontSize: 12, fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              coursesAsync.when(
                data: (courses) => Column(
                  children: courses.take(2).map((c) => Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.cardBgOf(context),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppTheme.borderOf(context)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: AppTheme.primaryBlue.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.school_rounded, color: AppTheme.primaryBlue, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                c.title,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.textPrimaryOf(context),
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              if (c.duration != null)
                                Text(c.duration!, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                            ],
                          ),
                        ),
                        Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppTheme.textMutedOf(context)),
                      ],
                    ),
                  )).toList(),
                ),
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
              ),
              const SizedBox(height: 24),
            ],

            // Logout
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () async {
                  await ref.read(authStateProvider.notifier).logout();
                  if (context.mounted) context.go('/');
                },
                icon: const Icon(Icons.logout_rounded, color: AppTheme.error, size: 16),
                label: const Text('Sign Out', style: TextStyle(color: AppTheme.error)),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppTheme.error, width: 0.5),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;
  const _StatCard({required this.icon, required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 6),
            Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: color)),
            Text(label, style: const TextStyle(fontSize: 9, color: AppTheme.textMuted, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _ActionTile({required this.icon, required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: color.withValues(alpha: 0.2)),
          ),
          child: Column(
            children: [
              Icon(icon, color: color, size: 24),
              const SizedBox(height: 6),
              Text(
                label,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: color, height: 1.2),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
