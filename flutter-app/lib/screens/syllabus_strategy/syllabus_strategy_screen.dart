import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_html/flutter_html.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/syllabus_strategy_provider.dart';
import '../../providers/pyq_provider.dart';
import '../../models/syllabus_strategy_model.dart';
import '../../widgets/top_header_actions.dart';
import '../../widgets/loading_shimmer.dart';

class SyllabusStrategyScreen extends ConsumerStatefulWidget {
  const SyllabusStrategyScreen({super.key});

  @override
  ConsumerState<SyllabusStrategyScreen> createState() => _SyllabusStrategyScreenState();
}

class _SyllabusStrategyScreenState extends ConsumerState<SyllabusStrategyScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _selectedExamId = 'all';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _openUrl(String url) async {
    if (url.trim().isEmpty) return;
    try {
      String fullUrl = url.trim();
      if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
        if (fullUrl.startsWith('/')) {
          fullUrl = 'https://finalattemptias.com$fullUrl';
        } else {
          fullUrl = 'https://$fullUrl';
        }
      }
      final uri = Uri.parse(fullUrl);
      if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
        await launchUrl(uri, mode: LaunchMode.platformDefault);
      }
    } catch (e) {
      debugPrint('Error launching URL: $e');
    }
  }

  void _showSyllabusDetailModal(BuildContext context, SyllabusItemModel item) {
    final textPrimary = AppTheme.textPrimaryOf(context);
    final cardBg = AppTheme.cardBgOf(context);
    final primaryCol = AppTheme.primaryOf(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: cardBg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return DraggableScrollableSheet(
          initialChildSize: 0.85,
          minChildSize: 0.5,
          maxChildSize: 0.95,
          expand: false,
          builder: (context, scrollController) {
            return Column(
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: 12, bottom: 8),
                  child: Center(
                    child: Container(
                      width: 44,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey.withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: primaryCol.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          item.stage,
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: primaryCol),
                        ),
                      ),
                      if (item.version != null) ...[
                        const SizedBox(width: 8),
                        Text('v${item.version}', style: TextStyle(fontSize: 11, color: AppTheme.textMutedOf(context))),
                      ],
                      const Spacer(),
                      IconButton(
                        icon: const Icon(Icons.close_rounded, size: 20),
                        onPressed: () => Navigator.pop(context),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      item.examName ?? 'Official Syllabus',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: textPrimary),
                    ),
                  ),
                ),
                const Divider(height: 20),
                Expanded(
                  child: SingleChildScrollView(
                    controller: scrollController,
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (item.description != null && item.description!.isNotEmpty)
                          Html(
                            data: item.description!,
                            style: {
                              "body": Style(
                                margin: Margins.zero,
                                padding: HtmlPaddings.zero,
                                fontSize: FontSize(14),
                                lineHeight: const LineHeight(1.5),
                                color: textPrimary,
                              ),
                              "p": Style(
                                margin: Margins.only(bottom: 10),
                                color: textPrimary,
                              ),
                              "h1": Style(
                                fontSize: FontSize(18),
                                fontWeight: FontWeight.bold,
                                margin: Margins.only(top: 14, bottom: 8),
                                color: textPrimary,
                              ),
                              "h2": Style(
                                fontSize: FontSize(16),
                                fontWeight: FontWeight.bold,
                                margin: Margins.only(top: 12, bottom: 6),
                                color: primaryCol,
                              ),
                              "h3": Style(
                                fontSize: FontSize(15),
                                fontWeight: FontWeight.w600,
                                margin: Margins.only(top: 10, bottom: 4),
                                color: textPrimary,
                              ),
                              "table": Style(
                                backgroundColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                                border: Border.all(color: AppTheme.borderOf(context)),
                                margin: Margins.symmetric(vertical: 8),
                              ),
                              "th": Style(
                                padding: HtmlPaddings.all(8),
                                backgroundColor: primaryCol.withValues(alpha: 0.1),
                                fontWeight: FontWeight.bold,
                                color: primaryCol,
                              ),
                              "td": Style(
                                padding: HtmlPaddings.all(8),
                                border: Border.all(color: AppTheme.borderOf(context).withValues(alpha: 0.5)),
                                color: textPrimary,
                              ),
                              "li": Style(
                                margin: Margins.only(bottom: 4),
                                color: textPrimary,
                              ),
                              "strong": Style(
                                fontWeight: FontWeight.bold,
                                color: textPrimary,
                              ),
                            },
                          ),
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ),
                if (item.fileUrl != null && item.fileUrl!.isNotEmpty)
                  Container(
                    padding: EdgeInsets.fromLTRB(20, 10, 20, MediaQuery.of(context).padding.bottom + 14),
                    decoration: BoxDecoration(
                      color: cardBg,
                      border: Border(top: BorderSide(color: AppTheme.borderOf(context))),
                    ),
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.pop(context);
                        _openUrl(item.fileUrl!);
                      },
                      icon: const Icon(Icons.picture_as_pdf_rounded, size: 18),
                      label: const Text('Download Official Syllabus PDF', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: primaryCol,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        minimumSize: const Size(double.infinity, 48),
                        elevation: 0,
                      ),
                    ),
                  ),
              ],
            );
          },
        );
      },
    );
  }

  void _showStrategyDetailModal(BuildContext context, StrategyBlockModel block) {
    final textPrimary = AppTheme.textPrimaryOf(context);
    final cardBg = AppTheme.cardBgOf(context);
    final primaryCol = AppTheme.primaryOf(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: cardBg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return DraggableScrollableSheet(
          initialChildSize: 0.85,
          minChildSize: 0.5,
          maxChildSize: 0.95,
          expand: false,
          builder: (context, scrollController) {
            return Column(
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: 12, bottom: 8),
                  child: Center(
                    child: Container(
                      width: 44,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey.withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  child: Row(
                    children: [
                      if (block.category != null && block.category!.isNotEmpty)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: primaryCol.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            block.category!.toUpperCase(),
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: primaryCol),
                          ),
                        ),
                      const Spacer(),
                      IconButton(
                        icon: const Icon(Icons.close_rounded, size: 20),
                        onPressed: () => Navigator.pop(context),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      block.title,
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: textPrimary),
                    ),
                  ),
                ),
                const Divider(height: 20),
                Expanded(
                  child: SingleChildScrollView(
                    controller: scrollController,
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (block.content != null && block.content!.isNotEmpty)
                          Html(
                            data: block.content!,
                            style: {
                              "body": Style(
                                margin: Margins.zero,
                                padding: HtmlPaddings.zero,
                                fontSize: FontSize(14),
                                lineHeight: const LineHeight(1.5),
                                color: textPrimary,
                              ),
                              "p": Style(
                                margin: Margins.only(bottom: 10),
                                color: textPrimary,
                              ),
                              "h1": Style(
                                fontSize: FontSize(18),
                                fontWeight: FontWeight.bold,
                                margin: Margins.only(top: 14, bottom: 8),
                                color: textPrimary,
                              ),
                              "h2": Style(
                                fontSize: FontSize(16),
                                fontWeight: FontWeight.bold,
                                margin: Margins.only(top: 12, bottom: 6),
                                color: primaryCol,
                              ),
                              "h3": Style(
                                fontSize: FontSize(15),
                                fontWeight: FontWeight.w600,
                                margin: Margins.only(top: 10, bottom: 4),
                                color: textPrimary,
                              ),
                              "table": Style(
                                backgroundColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                                border: Border.all(color: AppTheme.borderOf(context)),
                                margin: Margins.symmetric(vertical: 8),
                              ),
                              "th": Style(
                                padding: HtmlPaddings.all(8),
                                backgroundColor: primaryCol.withValues(alpha: 0.1),
                                fontWeight: FontWeight.bold,
                                color: primaryCol,
                              ),
                              "td": Style(
                                padding: HtmlPaddings.all(8),
                                border: Border.all(color: AppTheme.borderOf(context).withValues(alpha: 0.5)),
                                color: textPrimary,
                              ),
                              "li": Style(
                                margin: Margins.only(bottom: 4),
                                color: textPrimary,
                              ),
                              "strong": Style(
                                fontWeight: FontWeight.bold,
                                color: textPrimary,
                              ),
                            },
                          ),
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ),
                if (block.ctaText != null && block.ctaUrl != null)
                  Container(
                    padding: EdgeInsets.fromLTRB(20, 10, 20, MediaQuery.of(context).padding.bottom + 14),
                    decoration: BoxDecoration(
                      color: cardBg,
                      border: Border(top: BorderSide(color: AppTheme.borderOf(context))),
                    ),
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.pop(context);
                        _openUrl(block.ctaUrl!);
                      },
                      icon: const Icon(Icons.launch_rounded, size: 18),
                      label: Text(block.ctaText!, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: primaryCol,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        minimumSize: const Size(double.infinity, 48),
                        elevation: 0,
                      ),
                    ),
                  ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final bg = AppTheme.bgOf(context);
    final cardBg = AppTheme.cardBgOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);
    final primaryCol = AppTheme.primaryOf(context);

    final examsAsync = ref.watch(pyqExamsProvider);
    final syllabusAsync = ref.watch(syllabusListProvider);
    final strategyAsync = ref.watch(strategyListProvider);

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
          'Syllabus & Strategy',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: textPrimary,
          ),
        ),
        actions: const [
          TopHeaderActions(),
          SizedBox(width: 8),
        ],
        bottom: TabBar(
          controller: _tabController,
          labelColor: primaryCol,
          unselectedLabelColor: AppTheme.textMutedOf(context),
          indicatorColor: primaryCol,
          indicatorWeight: 3,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          tabs: const [
            Tab(text: 'Exam Syllabus'),
            Tab(text: 'Prep Strategy'),
          ],
        ),
      ),
      body: Column(
        children: [
          // Top Exam Filter Bar matching Website
          Container(
            padding: const EdgeInsets.symmetric(vertical: 10),
            color: cardBg,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  _FilterChipItem(
                    label: 'All Exams',
                    isSelected: _selectedExamId == 'all',
                    onTap: () => setState(() => _selectedExamId = 'all'),
                  ),
                  const SizedBox(width: 8),
                  ...examsAsync.maybeWhen(
                    data: (exams) => exams.map((exam) {
                      final isSelected = _selectedExamId.toLowerCase() == exam.id.toLowerCase() ||
                          _selectedExamId.toLowerCase() == exam.name.toLowerCase();
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: _FilterChipItem(
                          label: exam.name,
                          isSelected: isSelected,
                          onTap: () => setState(() => _selectedExamId = exam.id),
                        ),
                      );
                    }).toList(),
                    orElse: () => [
                      _FilterChipItem(
                        label: 'BPSC',
                        isSelected: _selectedExamId == 'bpsc',
                        onTap: () => setState(() => _selectedExamId = 'bpsc'),
                      ),
                      const SizedBox(width: 8),
                      _FilterChipItem(
                        label: 'APPSC',
                        isSelected: _selectedExamId == 'appsc',
                        onTap: () => setState(() => _selectedExamId = 'appsc'),
                      ),
                      const SizedBox(width: 8),
                      _FilterChipItem(
                        label: 'UPPSC',
                        isSelected: _selectedExamId == 'uppsc',
                        onTap: () => setState(() => _selectedExamId = 'uppsc'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const Divider(height: 1),

          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                // 1. Syllabus Tab
                syllabusAsync.when(
                  data: (items) {
                    final filtered = _selectedExamId == 'all'
                        ? items
                        : items.where((it) {
                            final eId = (it.examId ?? '').toLowerCase();
                            final eName = (it.examName ?? '').toLowerCase();
                            final target = _selectedExamId.toLowerCase();
                            return eId.contains(target) || eName.contains(target) || target.contains(eId);
                          }).toList();

                    if (filtered.isEmpty) {
                      return Center(
                        child: Text(
                          'No syllabus documents for this selection.',
                          style: TextStyle(color: AppTheme.textMutedOf(context)),
                        ),
                      );
                    }
                    return ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
                      itemCount: filtered.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 12),
                      itemBuilder: (context, i) => _SyllabusCard(
                        item: filtered[i],
                        onDownload: _openUrl,
                        onTap: () => _showSyllabusDetailModal(context, filtered[i]),
                      ),
                    );
                  },
                  loading: () => ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: 4,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (_, __) => const LoadingShimmer(height: 120),
                  ),
                  error: (e, _) => Center(
                    child: Text('Error: $e', style: const TextStyle(color: AppColors.error)),
                  ),
                ),

                // 2. Strategy Tab
                strategyAsync.when(
                  data: (items) {
                    final filtered = _selectedExamId == 'all'
                        ? items
                        : items.where((it) {
                            final target = _selectedExamId.toLowerCase();
                            final cat = (it.category ?? '').toLowerCase();
                            final title = it.title.toLowerCase();
                            return cat.contains(target) || title.contains(target);
                          }).toList();

                    if (filtered.isEmpty) {
                      return Center(
                        child: Text(
                          'No strategy guides for this selection.',
                          style: TextStyle(color: AppTheme.textMutedOf(context)),
                        ),
                      );
                    }
                    return ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
                      itemCount: filtered.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 12),
                      itemBuilder: (context, i) => _StrategyCard(
                        block: filtered[i],
                        onOpenCta: _openUrl,
                        onTap: () => _showStrategyDetailModal(context, filtered[i]),
                      ),
                    );
                  },
                  loading: () => ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: 4,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (_, __) => const LoadingShimmer(height: 120),
                  ),
                  error: (e, _) => Center(
                    child: Text('Error: $e', style: const TextStyle(color: AppColors.error)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterChipItem extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _FilterChipItem({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final primaryCol = AppTheme.primaryOf(context);
    final borderCol = AppTheme.borderOf(context);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? primaryCol : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? primaryCol : borderCol,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            color: isSelected ? Colors.white : AppTheme.textPrimaryOf(context),
          ),
        ),
      ),
    );
  }
}

String _stripHtml(String? htmlString) {
  if (htmlString == null || htmlString.isEmpty) return '';
  final regExp = RegExp(r'<[^>]*>', multiLine: true, caseSensitive: false);
  final clean = htmlString.replaceAll(regExp, ' ');
  return clean.replaceAll(RegExp(r'\s+'), ' ').trim();
}

class _SyllabusCard extends StatelessWidget {
  final SyllabusItemModel item;
  final Function(String) onDownload;
  final VoidCallback onTap;

  const _SyllabusCard({required this.item, required this.onDownload, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final cardBg = AppTheme.cardBgOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);
    final primaryCol = AppTheme.primaryOf(context);

    final cleanDesc = _stripHtml(item.description);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: cardBg,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.borderOf(context)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: primaryCol.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      item.stage,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: primaryCol,
                      ),
                    ),
                  ),
                  if (item.version != null) ...[
                    const SizedBox(width: 8),
                    Text(
                      'v${item.version}',
                      style: TextStyle(fontSize: 11, color: AppTheme.textMutedOf(context)),
                    ),
                  ],
                  const Spacer(),
                  Icon(Icons.arrow_forward_ios_rounded, size: 13, color: AppTheme.textMutedOf(context)),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                item.examName ?? 'Official Syllabus',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: textPrimary,
                ),
              ),
              if (cleanDesc.isNotEmpty) ...[
                const SizedBox(height: 6),
                Text(
                  cleanDesc,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 12,
                    color: AppTheme.textMutedOf(context),
                    height: 1.35,
                  ),
                ),
              ],
              if (item.fileUrl != null && item.fileUrl!.isNotEmpty) ...[
                const SizedBox(height: 12),
                ElevatedButton.icon(
                  onPressed: () => onDownload(item.fileUrl!),
                  icon: const Icon(Icons.picture_as_pdf_rounded, size: 16),
                  label: const Text('Download Official Syllabus PDF', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryCol,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    minimumSize: const Size(double.infinity, 38),
                    elevation: 0,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _StrategyCard extends StatelessWidget {
  final StrategyBlockModel block;
  final Function(String) onOpenCta;
  final VoidCallback onTap;

  const _StrategyCard({required this.block, required this.onOpenCta, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final cardBg = AppTheme.cardBgOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);
    final primaryCol = AppTheme.primaryOf(context);

    final cleanContent = _stripHtml(block.content);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: cardBg,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.borderOf(context)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  if (block.category != null && block.category!.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: primaryCol.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        block.category!.toUpperCase(),
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.6,
                          color: primaryCol,
                        ),
                      ),
                    ),
                  const Spacer(),
                  Icon(Icons.arrow_forward_ios_rounded, size: 13, color: AppTheme.textMutedOf(context)),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                block.title,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: textPrimary,
                ),
              ),
              if (cleanContent.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  cleanContent,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 12,
                    color: AppTheme.textMutedOf(context),
                    height: 1.35,
                  ),
                ),
              ],
              if (block.ctaText != null && block.ctaUrl != null) ...[
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: () => onOpenCta(block.ctaUrl!),
                  icon: const Icon(Icons.launch_rounded, size: 16),
                  label: Text(block.ctaText!, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: primaryCol,
                    side: BorderSide(color: primaryCol),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    minimumSize: const Size(double.infinity, 38),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
