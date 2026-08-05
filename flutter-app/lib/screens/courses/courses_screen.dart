import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/courses_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../widgets/course_card.dart';
import '../../widgets/loading_shimmer.dart';

class CoursesScreen extends ConsumerWidget {
  const CoursesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final coursesAsync = ref.watch(coursesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Courses')),
      body: coursesAsync.when(
        data: (courses) {
          if (courses.isEmpty) {
            return const Center(
              child: Text('No courses available', style: TextStyle(color: AppTheme.textMuted)),
            );
          }
          return GridView.builder(
            padding: const EdgeInsets.all(16),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 0.78,
            ),
            itemCount: courses.length,
            itemBuilder: (_, i) => CourseCard(
              course: courses[i],
              onTap: () => context.push('/courses/${courses[i].id}'),
            ),
          );
        },
        loading: () => const LoadingGrid(),
        error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppTheme.error))),
      ),
    );
  }
}
