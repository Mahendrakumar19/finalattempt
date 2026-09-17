import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/syllabus_strategy_provider.dart';
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
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bg = AppTheme.bgOf(context);
    final cardBg = AppTheme.cardBgOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);
    final primaryCol = AppTheme.primaryOf(context);

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
      body: TabBarView(
        controller: _tabController,
        children: [
          // 1. Syllabus Tab
          syllabusAsync.when(
            data: (items) {
              if (items.isEmpty) {
                return Center(
                  child: Text(
                    'No syllabus documents available.',
                    style: TextStyle(color: AppTheme.textMutedOf(context)),
                  ),
                );
              }
              return ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
                itemCount: items.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, i) => _SyllabusCard(item: items[i], onDownload: _openUrl),
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
              if (items.isEmpty) {
                return Center(
                  child: Text(
                    'No strategy guides uploaded yet.',
                    style: TextStyle(color: AppTheme.textMutedOf(context)),
                  ),
                );
              }
              return ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
                itemCount: items.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, i) => _StrategyCard(block: items[i], onOpenCta: _openUrl),
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
    );
  }
}

class _SyllabusCard extends StatelessWidget {
  final SyllabusItemModel item;
  final Function(String) onDownload;

  const _SyllabusCard({required this.item, required this.onDownload});

  @override
  Widget build(BuildContext context) {
    final cardBg = AppTheme.cardBgOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);
    final primaryCol = AppTheme.primaryOf(context);

    return Container(
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
            ],
          ),
          const SizedBox(height: 10),
          Text(
            item.examName ?? 'BPSC Official Syllabus',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: textPrimary,
            ),
          ),
          if (item.description != null && item.description!.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              item.description!,
              maxLines: 3,
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
              label: const Text('Download Official Syllabus PDF', style: TextStyle(fontSize: 12)),
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryCol,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                minimumSize: const Size(double.infinity, 38),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _StrategyCard extends StatelessWidget {
  final StrategyBlockModel block;
  final Function(String) onOpenCta;

  const _StrategyCard({required this.block, required this.onOpenCta});

  @override
  Widget build(BuildContext context) {
    final cardBg = AppTheme.cardBgOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);
    final primaryCol = AppTheme.primaryOf(context);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderOf(context)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (block.category != null && block.category!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 6),
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
          Text(
            block.title,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: textPrimary,
            ),
          ),
          if (block.content != null && block.content!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              block.content!,
              maxLines: 4,
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
              label: Text(block.ctaText!, style: const TextStyle(fontSize: 12)),
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
    );
  }
}
