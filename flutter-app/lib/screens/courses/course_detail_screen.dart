import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/courses_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../widgets/loading_shimmer.dart';

class CourseDetailScreen extends ConsumerWidget {
  final String courseId;
  const CourseDetailScreen({super.key, required this.courseId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final courseAsync = ref.watch(courseDetailProvider(courseId));

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.pop(),
        ),
        title: const Text('Course Details'),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_rounded),
            onPressed: () {},
          ),
        ],
      ),
      body: courseAsync.when(
        data: (course) {
          if (course == null) {
            return const Center(child: Text('Course not found', style: TextStyle(color: AppTheme.textMuted)));
          }
          return SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (course.category != null)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.amber.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: AppTheme.amber.withOpacity(0.3)),
                          ),
                          child: Text(course.category!,
                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppTheme.amber, letterSpacing: 0.6),
                          ),
                        ),
                      const SizedBox(height: 12),
                      Text(course.title,
                        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.white),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          _InfoChip(icon: Icons.group_rounded, label: '${course.enrolledCount} enrolled'),
                          const SizedBox(width: 12),
                          if (course.duration != null)
                            _InfoChip(icon: Icons.schedule_rounded, label: course.duration!),
                        ],
                      ),
                      if (course.fee != null) ...[
                        const SizedBox(height: 16),
                        Text('₹${course.fee}',
                          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: AppTheme.amber),
                        ),
                      ],
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () => context.push('/login'),
                          child: const Text('Enroll Now'),
                        ),
                      ),
                    ],
                  ),
                ),

                // Description
                if (course.description != null && course.description!.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('About this Course',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Colors.white),
                        ),
                        const SizedBox(height: 8),
                        Text(course.description!,
                          style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary, height: 1.6),
                        ),
                      ],
                    ),
                  ),

                // Features
                if (course.features.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('What\'s Included',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Colors.white),
                        ),
                        const SizedBox(height: 10),
                        ...course.features.map((f) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Row(
                            children: [
                              const Icon(Icons.check_circle_rounded, color: AppTheme.success, size: 16),
                              const SizedBox(width: 8),
                              Expanded(child: Text(f, style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary))),
                            ],
                          ),
                        )),
                      ],
                    ),
                  ),

                // Syllabus
                if (course.syllabus.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Syllabus',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Colors.white),
                        ),
                        const SizedBox(height: 10),
                        ...course.syllabus.asMap().entries.map((e) => Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: AppTheme.bgCard,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: AppTheme.borderColor),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 24, height: 24,
                                decoration: BoxDecoration(
                                  color: AppTheme.amber.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Center(
                                  child: Text('${e.key + 1}',
                                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppTheme.amber),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(child: Text(e.value, style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary))),
                            ],
                          ),
                        )),
                      ],
                    ),
                  ),
              ],
            ),
          );
        },
        loading: () => const LoadingShimmer(height: 400),
        error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppTheme.error))),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _InfoChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: AppTheme.textMuted),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted, fontWeight: FontWeight.w500)),
      ],
    );
  }
}
