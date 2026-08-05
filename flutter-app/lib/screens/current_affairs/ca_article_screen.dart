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

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.pop(),
        ),
        title: const Text('Article'),
      ),
      body: articleAsync.when(
        data: (article) {
          if (article == null) {
            return const Center(child: Text('Article not found', style: TextStyle(color: AppTheme.textMuted)));
          }
          final category = article.category;
          final categoryColor = category == 'BIHAR'
              ? const Color(0xFF10B981)
              : category == 'INTERNATIONAL'
                  ? const Color(0xFF3B82F6)
                  : AppTheme.amber;

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
                        color: categoryColor.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: categoryColor.withOpacity(0.3)),
                      ),
                      child: Text(category,
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: categoryColor, letterSpacing: 0.5),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.bgCardLight,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        '${article.importance} importance',
                        style: const TextStyle(fontSize: 10, color: AppTheme.textMuted, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(article.title,
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.white, height: 1.3),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.schedule_rounded, size: 13, color: AppTheme.textMuted),
                    const SizedBox(width: 4),
                    Text(article.readingTime, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                    const SizedBox(width: 12),
                    const Icon(Icons.calendar_today_rounded, size: 13, color: AppTheme.textMuted),
                    const SizedBox(width: 4),
                    Text(article.publishedDate, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                  ],
                ),
                const Divider(height: 24),

                // Summary
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppTheme.bgCard,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.borderColor),
                  ),
                  child: Text(article.summary,
                    style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary, height: 1.6),
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
                        color: AppTheme.bgCard,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppTheme.borderColor),
                      ),
                      child: Text('#$t', style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary, fontWeight: FontWeight.w600)),
                    )).toList(),
                  ),
                ],
                const SizedBox(height: 32),
              ],
            ),
          );
        },
        loading: () => const LoadingShimmer(height: 500),
        error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppTheme.error))),
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Colors.white)),
        const SizedBox(height: 8),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: highlight ? AppTheme.amber.withOpacity(0.05) : AppTheme.bgCard,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: highlight ? AppTheme.amber.withOpacity(0.2) : AppTheme.borderColor),
          ),
          child: Html(
            data: content,
            style: {
              'body': Style(
                color: AppTheme.textSecondaryCol,
                fontSize: FontSize(13),
                lineHeight: const LineHeight(1.6),
                margin: Margins.zero,
                padding: HtmlPaddings.zero,
              ),
              'strong': Style(color: Colors.white, fontWeight: FontWeight.w700),
              'ul': Style(margin: Margins.only(left: 8)),
              'li': Style(color: AppTheme.textSecondaryCol, fontSize: FontSize(13)),
            },
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}
