import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../providers/courses_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/services/storage_service.dart';

class StudentDashboardScreen extends ConsumerWidget {
  const StudentDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final coursesAsync = ref.watch(coursesProvider);
    final storage = ref.read(storageServiceProvider);

    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Hello, ${storage.getUserName() ?? 'Aspirant'} 👋',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
            const Text('Ready to conquer today?',
              style: TextStyle(fontSize: 11, color: AppTheme.textMuted, fontWeight: FontWeight.w500)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_rounded, color: AppTheme.amber),
            onPressed: () => context.push('/student/profile'),
          ),
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
                _StatCard(icon: Icons.school_rounded, label: 'Enrolled', value: '—', color: const Color(0xFF3B82F6)),
                const SizedBox(width: 12),
                _StatCard(icon: Icons.check_circle_rounded, label: 'Progress', value: '0%', color: AppTheme.success),
                const SizedBox(width: 12),
                _StatCard(icon: Icons.emoji_events_rounded, label: 'Quizzes', value: '0', color: AppTheme.amber),
              ],
            ),

            const SizedBox(height: 24),

            // Quick Actions
            const Text('Quick Actions', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Colors.white)),
            const SizedBox(height: 12),
            Row(
              children: [
                _ActionTile(icon: Icons.newspaper_rounded, label: 'Current Affairs', color: const Color(0xFF10B981),
                  onTap: () => context.go('/current-affairs')),
                const SizedBox(width: 12),
                _ActionTile(icon: Icons.library_books_rounded, label: 'PYQ Papers', color: AppTheme.amber,
                  onTap: () => context.go('/pyq')),
                const SizedBox(width: 12),
                _ActionTile(icon: Icons.article_rounded, label: 'Blog', color: const Color(0xFF8B5CF6),
                  onTap: () => context.go('/blog')),
              ],
            ),

            const SizedBox(height: 24),

            // Available Courses
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Available Courses', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Colors.white)),
                TextButton(
                  onPressed: () => context.go('/courses'),
                  child: const Text('All Courses', style: TextStyle(color: AppTheme.amber, fontSize: 12, fontWeight: FontWeight.w700)),
                ),
              ],
            ),
            const SizedBox(height: 10),
            coursesAsync.when(
              data: (courses) => Column(
                children: courses.take(4).map((c) => Container(
                  margin: const EdgeInsets.only(bottom: 10),
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
                        child: const Icon(Icons.school_rounded, color: AppTheme.amber, size: 22),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(c.title,
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white),
                              maxLines: 1, overflow: TextOverflow.ellipsis,
                            ),
                            if (c.duration != null)
                              Text(c.duration!, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                          ],
                        ),
                      ),
                      TextButton(
                        onPressed: () => context.push('/courses/${c.id}'),
                        child: const Text('View', style: TextStyle(color: AppTheme.amber, fontSize: 11, fontWeight: FontWeight.w700)),
                      ),
                    ],
                  ),
                )).toList(),
              ),
              loading: () => const CircularProgressIndicator(color: AppTheme.amber),
              error: (_, __) => const SizedBox.shrink(),
            ),

            const SizedBox(height: 24),

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
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withOpacity(0.2)),
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
            color: color.withOpacity(0.08),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: color.withOpacity(0.2)),
          ),
          child: Column(
            children: [
              Icon(icon, color: color, size: 24),
              const SizedBox(height: 6),
              Text(label, textAlign: TextAlign.center,
                style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: color, height: 1.2),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
