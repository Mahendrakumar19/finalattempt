import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_html/flutter_html.dart';
import 'package:go_router/go_router.dart';
import '../../providers/current_affairs_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../widgets/loading_shimmer.dart';

class CAArticleScreen extends ConsumerWidget {
  final String slug;
  const CAArticleScreen({super.key, required this.slug});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final articleAsync = ref.watch(caArticleProvider(slug));
    final bg = AppTheme.bgOf(context);
    final cardBg = AppTheme.cardBgOf(context);
    final borderCol = AppTheme.borderOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);

    return Scaffold(
      backgroundColor: bg,
      appBar: AppBar(
        backgroundColor: cardBg,
        elevation: 0.5,
        scrolledUnderElevation: 0.5,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new, size: 18, color: textPrimary),
          onPressed: () => context.pop(),
        ),
        title: Text(
          'Article',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: textPrimary),
        ),
      ),
      body: articleAsync.when(
        data: (article) {
          if (article == null) {
            return const Center(child: Text('Article not found', style: TextStyle(color: AppColors.textMuted)));
          }
          final category = article.category;
          final categoryColor = category == 'BIHAR'
              ? const Color(0xFF10B981)
              : category == 'INTERNATIONAL'
                  ? const Color(0xFF3B82F6)
                  : AppColors.primaryBlue;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: categoryColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: categoryColor.withValues(alpha: 0.3)),
                      ),
                      child: Text(category,
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: categoryColor, letterSpacing: 0.5),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Theme.of(context).brightness == Brightness.dark
                            ? const Color(0xFF1E293B)
                            : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        '${article.importance} importance',
                        style: const TextStyle(fontSize: 10, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(article.title,
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: textPrimary, height: 1.3),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.schedule_rounded, size: 13, color: AppColors.textSecondary),
                    const SizedBox(width: 4),
                    Text(article.readingTime, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                    const SizedBox(width: 12),
                    const Icon(Icons.calendar_today_rounded, size: 13, color: AppColors.textSecondary),
                    const SizedBox(width: 4),
                    Text(article.publishedDate, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                  ],
                ),
                Divider(height: 24, color: borderCol),

                // Summary
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: cardBg,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: borderCol),
                  ),
                  child: Text(article.summary,
                    style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.6),
                  ),
                ),
                const SizedBox(height: 16),

                // Why in News
                if (article.whyInNews != null && article.whyInNews!.isNotEmpty)
                  _Section(title: '📢 Why in News', content: article.whyInNews!),

                // Key Highlights
                if (article.keyHighlights != null && article.keyHighlights!.isNotEmpty)
                  _Section(title: '🔑 Key Highlights', content: article.keyHighlights!),

                // Exam Relevance
                if (article.examRelevance != null && article.examRelevance!.isNotEmpty)
                  _Section(title: '📝 Exam Relevance', content: article.examRelevance!, highlight: true),

                // Tags
                if (article.tags.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: article.tags.map((t) => Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: cardBg,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: borderCol),
                      ),
                      child: Text('#$t', style: const TextStyle(fontSize: 10, color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
                    )).toList(),
                  ),
                ],
                const SizedBox(height: 32),
              ],
            ),
          );
        },
        loading: () => const LoadingShimmer(height: 500),
        error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppColors.error))),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  final String title;
  final String content;
  final bool highlight;
  const _Section({required this.title, required this.content, this.highlight = false});

  @override
  Widget build(BuildContext context) {
    final textPrimary = AppTheme.textPrimaryOf(context);
    final cardBg = AppTheme.cardBgOf(context);
    final borderCol = AppTheme.borderOf(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: textPrimary)),
        const SizedBox(height: 8),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: highlight ? AppColors.primaryBlue.withValues(alpha: 0.05) : cardBg,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: highlight ? AppColors.primaryBlue.withValues(alpha: 0.2) : borderCol),
          ),
          child: Html(
            data: content,
            style: {
              'body': Style(
                color: AppColors.textSecondary,
                fontSize: FontSize(13),
                lineHeight: const LineHeight(1.6),
                margin: Margins.zero,
                padding: HtmlPaddings.zero,
              ),
              'strong': Style(color: textPrimary, fontWeight: FontWeight.w700),
              'ul': Style(margin: Margins.only(left: 8)),
              'li': Style(color: AppColors.textSecondary, fontSize: FontSize(13)),
            },
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}

