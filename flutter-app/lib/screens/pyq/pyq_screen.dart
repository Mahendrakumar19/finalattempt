import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/pyq_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../widgets/loading_shimmer.dart';
import '../../models/pyq_model.dart';
import 'package:url_launcher/url_launcher.dart';

class PYQScreen extends ConsumerStatefulWidget {
  const PYQScreen({super.key});

  @override
  ConsumerState<PYQScreen> createState() => _PYQScreenState();
}

class _PYQScreenState extends ConsumerState<PYQScreen> {
  @override
  Widget build(BuildContext context) {
    final examsAsync = ref.watch(pyqExamsProvider);
    final pyqAsync = ref.watch(pyqListProvider);
    final filter = ref.watch(pyqFilterProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Previous Year Questions')),
      body: Column(
        children: [
          // Filter Bar
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            decoration: const BoxDecoration(
              color: AppTheme.bgCard,
              border: Border(bottom: BorderSide(color: AppTheme.borderColor)),
            ),
            child: examsAsync.when(
              data: (exams) => SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _FilterChip(
                      label: 'All Exams',
                      selected: filter.examId == 'ALL',
                      onTap: () => ref.read(pyqFilterProvider.notifier).state =
                          filter.copyWith(examId: 'ALL'),
                    ),
                    ...exams.map((e) => _FilterChip(
                      label: e.name,
                      selected: filter.examId == e.id,
                      onTap: () => ref.read(pyqFilterProvider.notifier).state =
                          filter.copyWith(examId: e.id),
                    )),
                  ],
                ),
              ),
              loading: () => const SizedBox(height: 36, child: LoadingShimmer(height: 36)),
              error: (_, __) => const SizedBox.shrink(),
            ),
          ),

          // PYQ List
          Expanded(
            child: pyqAsync.when(
              data: (pyqs) {
                if (pyqs.isEmpty) {
                  return const Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.library_books_rounded, size: 48, color: AppTheme.textMuted),
                        SizedBox(height: 12),
                        Text('No question papers found', style: TextStyle(color: AppTheme.textMuted)),
                      ],
                    ),
                  );
                }
                // Group by exam
                final grouped = <String, List<PyqModel>>{};
                for (final p in pyqs) {
                  final examName = p.exam?.name ?? 'Other';
                  grouped.putIfAbsent(examName, () => []).add(p);
                }
                return ListView(
                  padding: const EdgeInsets.all(16),
                  children: grouped.entries.map((entry) => Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(bottom: 10, top: 4),
                        child: Text(entry.key.toString(),
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Colors.white),
                        ),
                      ),
                      ...entry.value.map((p) => _PYQCard(pyq: p)),
                      const SizedBox(height: 16),
                    ],
                  )).toList(),
                );
              },
              loading: () => ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: 6,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (_, __) => const LoadingShimmer(height: 90),
              ),
              error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppTheme.error))),
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _FilterChip({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? AppTheme.amber : AppTheme.bgCardLight,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: selected ? AppTheme.amber : AppTheme.borderColor),
        ),
        child: Text(label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: selected ? AppTheme.bgDark : AppTheme.textSecondaryCol,
          ),
        ),
      ),
    );
  }
}

class _PYQCard extends StatelessWidget {
  final PyqModel pyq;
  const _PYQCard({required this.pyq});

  Future<void> _openUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppTheme.amber.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text('${pyq.year}', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppTheme.amber)),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFF3B82F6).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(pyq.stage, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF3B82F6))),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(pyq.paperName,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              if (pyq.questionPaperPath != null && pyq.questionPaperPath!.isNotEmpty)
                _ActionBtn(
                  label: 'View Paper',
                  icon: Icons.visibility_rounded,
                  color: AppTheme.amber,
                  onTap: () => _openUrl(pyq.questionPaperPath!),
                ),
              const SizedBox(width: 8),
              if (pyq.answerKeyPath != null && pyq.answerKeyPath!.isNotEmpty)
                _ActionBtn(
                  label: 'Answer Key',
                  icon: Icons.key_rounded,
                  color: const Color(0xFF3B82F6),
                  onTap: () => _openUrl(pyq.answerKeyPath!),
                ),
              const SizedBox(width: 8),
              if (pyq.solutionPath != null && pyq.solutionPath!.isNotEmpty)
                _ActionBtn(
                  label: 'Solution',
                  icon: Icons.check_circle_rounded,
                  color: AppTheme.success,
                  onTap: () => _openUrl(pyq.solutionPath!),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ActionBtn extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  const _ActionBtn({required this.label, required this.icon, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 12, color: color),
            const SizedBox(width: 4),
            Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color)),
          ],
        ),
      ),
    );
  }
}
