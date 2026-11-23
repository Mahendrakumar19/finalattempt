import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../providers/pyq_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/localization/app_localizations.dart';
import '../../widgets/loading_shimmer.dart';
import '../../widgets/top_header_actions.dart';
import '../../widgets/apple_pressable.dart';
import '../../models/pyq_model.dart';

class PYQScreen extends ConsumerStatefulWidget {
  const PYQScreen({super.key});

  @override
  ConsumerState<PYQScreen> createState() => _PYQScreenState();
}

class _PYQScreenState extends ConsumerState<PYQScreen> {
  String _modalStageFilter = 'ALL';
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _openExamVault(BuildContext context, String examId, String examName) {
    setState(() {
      _modalStageFilter = 'ALL';
      _searchQuery = '';
      _searchController.clear();
    });
    _showExamVaultModal(context, examId, examName);
  }

  void _showExamVaultModal(BuildContext context, String examId, String examName) {
    final cardBg = AppTheme.cardBgOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);
    final borderCol = AppTheme.borderOf(context);
    final textMuted = AppTheme.textMutedOf(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (modalContext, setModalState) {
            final pyqAsync = ref.watch(pyqListProvider);

            return Container(
              height: MediaQuery.of(context).size.height * 0.88,
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                children: [
                  // Drag Handle
                  const SizedBox(height: 12),
                  Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Header
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: const Color(0xFFD97706).withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(Icons.folder_special_rounded, color: Color(0xFFD97706), size: 22),
                            ),
                            const SizedBox(width: 12),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  examName,
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w800,
                                    color: textPrimary,
                                  ),
                                ),
                                Text(
                                  'Solved Papers, Booklets & Solutions',
                                  style: TextStyle(fontSize: 11, color: textMuted),
                                ),
                              ],
                            ),
                          ],
                        ),
                        IconButton(
                          onPressed: () => Navigator.of(ctx).pop(),
                          icon: Icon(Icons.close_rounded, color: textMuted),
                        ),
                      ],
                    ),
                  ),
                  Divider(height: 20, color: borderCol),

                  // Search & Sub-filters inside modal
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Column(
                      children: [
                        // Search Box
                        Container(
                          height: 40,
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: borderCol),
                          ),
                          child: TextField(
                            controller: _searchController,
                            onChanged: (val) {
                              setModalState(() {
                                _searchQuery = val.trim().toLowerCase();
                              });
                            },
                            style: TextStyle(fontSize: 13, color: textPrimary),
                            decoration: InputDecoration(
                              hintText: 'Search $examName papers (e.g. Hindi, GS 1)...',
                              hintStyle: TextStyle(fontSize: 12, color: textMuted),
                              prefixIcon: Icon(Icons.search, size: 18, color: textMuted),
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(vertical: 8),
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),

                        // Stage Filter Chips (All, Prelims, Mains, Interview)
                        SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          physics: const BouncingScrollPhysics(),
                          child: Row(
                            children: ['ALL', 'PRELIMS', 'MAINS', 'INTERVIEW'].map((stage) {
                              final isSel = _modalStageFilter == stage;
                              return Padding(
                                padding: const EdgeInsets.only(right: 6),
                                child: InkWell(
                                  onTap: () {
                                    setModalState(() {
                                      _modalStageFilter = stage;
                                    });
                                  },
                                  borderRadius: BorderRadius.circular(16),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                                    decoration: BoxDecoration(
                                      color: isSel ? AppTheme.primaryBlue : (isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9)),
                                      borderRadius: BorderRadius.circular(16),
                                      border: Border.all(color: isSel ? AppTheme.primaryBlue : borderCol),
                                    ),
                                    child: Text(
                                      stage == 'ALL' ? 'All Stages' : stage,
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: isSel ? FontWeight.w800 : FontWeight.w600,
                                        color: isSel ? Colors.white : textPrimary,
                                      ),
                                    ),
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),
                  Divider(height: 1, color: borderCol),

                  // Papers List
                  Expanded(
                    child: pyqAsync.when(
                      loading: () => const Center(child: CircularProgressIndicator(color: AppTheme.primaryBlue)),
                      error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppTheme.error))),
                      data: (pyqs) {
                        // Filter papers by this examId
                        var examPapers = pyqs.where((p) => p.examId == examId || (p.exam?.id == examId)).toList();

                        // Filter by stage
                        if (_modalStageFilter != 'ALL') {
                          examPapers = examPapers.where((p) => p.stage.toUpperCase() == _modalStageFilter).toList();
                        }

                        // Filter by search query
                        if (_searchQuery.isNotEmpty) {
                          examPapers = examPapers.where((p) => p.paperName.toLowerCase().contains(_searchQuery)).toList();
                        }

                        if (examPapers.isEmpty) {
                          return Center(
                            child: Padding(
                              padding: const EdgeInsets.all(24),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.folder_open_rounded, size: 48, color: textMuted),
                                  const SizedBox(height: 10),
                                  Text('No Question Papers Found', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: textPrimary)),
                                  const SizedBox(height: 4),
                                  Text('Try clearing your search query or stage filter.', style: TextStyle(fontSize: 11, color: textMuted)),
                                ],
                              ),
                            ),
                          );
                        }

                        return ListView.builder(
                          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                          physics: const BouncingScrollPhysics(),
                          itemCount: examPapers.length,
                          itemBuilder: (context, idx) {
                            return _PYQCard(pyq: examPapers[idx]);
                          },
                        );
                      },
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final loc = ref.watch(appLocalizationsProvider);
    final examsAsync = ref.watch(pyqExamsProvider);
    final pyqAsync = ref.watch(pyqListProvider);
    final bg = AppTheme.bgOf(context);
    final cardBg = AppTheme.cardBgOf(context);
    final borderCol = AppTheme.borderOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);
    final textMuted = AppTheme.textMutedOf(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: bg,
      appBar: AppBar(
        backgroundColor: cardBg,
        elevation: 0.5,
        scrolledUnderElevation: 0.5,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new, size: 18, color: textPrimary),
          onPressed: () {
            if (Navigator.of(context).canPop()) {
              context.pop();
            } else {
              context.go('/');
            }
          },
        ),
        title: Text(
          loc.tr('previous_years_questions'),
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.3,
            color: textPrimary,
          ),
        ),
        actions: const [
          TopHeaderActions(),
          SizedBox(width: 8),
        ],
      ),
      body: pyqAsync.when(
        loading: () => ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: 4,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (_, __) => const LoadingShimmer(height: 110),
        ),
        error: (e, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Error: $e', style: const TextStyle(color: AppColors.error)),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () => ref.invalidate(pyqListProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (allPyqs) {
          return examsAsync.when(
            loading: () => const Center(child: CircularProgressIndicator(color: AppTheme.primaryBlue)),
            error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppColors.error))),
            data: (exams) {
              // Map exams with papers count, always prioritizing BPSC first
              final sortedExams = List<PyqExamModel>.from(exams);
              sortedExams.sort((a, b) {
                final isABpsc = a.name.toUpperCase().contains('BPSC') || (a.code ?? '').toUpperCase().contains('BPSC');
                final isBBpsc = b.name.toUpperCase().contains('BPSC') || (b.code ?? '').toUpperCase().contains('BPSC');
                if (isABpsc) return -1;
                if (isBBpsc) return 1;
                return a.name.compareTo(b.name);
              });

              return SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header Vault Banner
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: isDark
                              ? [const Color(0xFF1E293B), const Color(0xFF0F172A)]
                              : [const Color(0xFFFEF3C7), const Color(0xFFFDE68A)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: const Color(0xFFD97706).withValues(alpha: 0.25),
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: const Color(0xFFD97706).withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: const Icon(Icons.folder_copy_rounded, color: Color(0xFFD97706), size: 28),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Exam PYQ Vaults',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w900,
                                    color: isDark ? Colors.white : const Color(0xFF92400E),
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Select an exam folder below to explore official question booklets, answer keys, and detailed solutions.',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: isDark ? Colors.white70 : const Color(0xFFB45309),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Section Title
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Exam Folders (${sortedExams.length})',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: textPrimary,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryBlue.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            '${allPyqs.length} Total Papers',
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.primaryBlue),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // EXAM FOLDER CARDS (Matching website structure)
                    ...sortedExams.map((exam) {
                      final examPapers = allPyqs.where((p) => p.examId == exam.id || (p.exam?.id == exam.id)).toList();
                      final latestYear = examPapers.isNotEmpty
                          ? examPapers.map((p) => p.year).reduce((a, b) => a > b ? a : b)
                          : null;

                      // Distinguish Prelims and Mains papers count
                      final prelimsCount = examPapers.where((p) => p.stage.toUpperCase() == 'PRELIMS').length;
                      final mainsCount = examPapers.where((p) => p.stage.toUpperCase() == 'MAINS').length;

                      final isBpsc = exam.name.toUpperCase().contains('BPSC') || (exam.code ?? '').toUpperCase().contains('BPSC');
                      final folderAccent = isBpsc ? const Color(0xFFD97706) : AppTheme.primaryBlue;

                      return Container(
                        margin: const EdgeInsets.only(bottom: 14),
                        decoration: BoxDecoration(
                          color: cardBg,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: isBpsc
                                ? folderAccent.withValues(alpha: 0.35)
                                : borderCol,
                            width: isBpsc ? 1.5 : 1,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.03),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: ApplePressable(
                          scaleDown: 0.98,
                          onTap: () => _openExamVault(context, exam.id, exam.name),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    // Folder / Logo Box
                                    Container(
                                      width: 48,
                                      height: 48,
                                      decoration: BoxDecoration(
                                        color: folderAccent.withValues(alpha: 0.12),
                                        borderRadius: BorderRadius.circular(14),
                                        border: Border.all(color: folderAccent.withValues(alpha: 0.25)),
                                      ),
                                      child: Center(
                                        child: Icon(Icons.folder_rounded, color: folderAccent, size: 26),
                                      ),
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
                                                  exam.name,
                                                  style: TextStyle(
                                                    fontSize: 16,
                                                    fontWeight: FontWeight.w800,
                                                    color: textPrimary,
                                                  ),
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                ),
                                              ),
                                              if (isBpsc)
                                                Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                                  decoration: BoxDecoration(
                                                    color: folderAccent.withValues(alpha: 0.15),
                                                    borderRadius: BorderRadius.circular(6),
                                                  ),
                                                  child: Text(
                                                    'FEATURED',
                                                    style: TextStyle(
                                                      fontSize: 9,
                                                      fontWeight: FontWeight.w900,
                                                      color: folderAccent,
                                                      letterSpacing: 0.5,
                                                    ),
                                                  ),
                                                ),
                                            ],
                                          ),
                                          const SizedBox(height: 3),
                                          Text(
                                            '${examPapers.length} Question Papers Available',
                                            style: TextStyle(fontSize: 12, color: textMuted, fontWeight: FontWeight.w500),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Icon(Icons.arrow_forward_ios_rounded, size: 14, color: textMuted),
                                  ],
                                ),
                                const SizedBox(height: 14),
                                const Divider(height: 1),
                                const SizedBox(height: 10),

                                // Tags Row
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Row(
                                      children: [
                                        if (prelimsCount > 0)
                                          _VaultStageBadge(
                                            label: '$prelimsCount Prelims',
                                            color: const Color(0xFF2563EB),
                                          ),
                                        if (mainsCount > 0) ...[
                                          const SizedBox(width: 6),
                                          _VaultStageBadge(
                                            label: '$mainsCount Mains',
                                            color: const Color(0xFF7C3AED),
                                          ),
                                        ],
                                      ],
                                    ),
                                    Text(
                                      latestYear != null ? 'Latest: $latestYear' : 'Updated',
                                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textMuted),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class _VaultStageBadge extends StatelessWidget {
  final String label;
  final Color color;

  const _VaultStageBadge({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: color),
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
    final borderCol = AppTheme.borderOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final isMains = pyq.stage.toUpperCase() == 'MAINS';
    final stageColor = isMains ? const Color(0xFF7C3AED) : const Color(0xFF2563EB);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderCol),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.primaryBlue.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text('${pyq.year}', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.primaryBlue)),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: stageColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(pyq.stage, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: stageColor)),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            pyq.paperName,
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: textPrimary),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              if (pyq.questionPaperPath != null && pyq.questionPaperPath!.isNotEmpty)
                _ActionBtn(
                  label: 'View Paper',
                  icon: Icons.visibility_rounded,
                  color: AppColors.primaryBlue,
                  onTap: () => _openUrl(pyq.questionPaperPath!),
                ),
              const SizedBox(width: 8),
              if (pyq.answerKeyPath != null && pyq.answerKeyPath!.isNotEmpty)
                _ActionBtn(
                  label: 'Answer Key',
                  icon: Icons.key_rounded,
                  color: const Color(0xFF0D9488),
                  onTap: () => _openUrl(pyq.answerKeyPath!),
                ),
              const SizedBox(width: 8),
              if (pyq.solutionPath != null && pyq.solutionPath!.isNotEmpty)
                _ActionBtn(
                  label: 'Solution',
                  icon: Icons.check_circle_rounded,
                  color: AppColors.success,
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
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withValues(alpha: 0.3)),
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


