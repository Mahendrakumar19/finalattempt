import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/current_affairs_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../widgets/loading_shimmer.dart';

class CurrentAffairsScreen extends ConsumerWidget {
  const CurrentAffairsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final editionsAsync = ref.watch(caEditionsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Current Affairs')),
      body: editionsAsync.when(
        data: (editions) {
          if (editions.isEmpty) {
            return const Center(
              child: Text('No editions available', style: TextStyle(color: AppTheme.textMuted)),
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: editions.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (_, i) {
              final ed = editions[i];
              return _EditionCard(edition: ed);
            },
          );
        },
        loading: () => ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: 5,
          separatorBuilder: (_, __) => const SizedBox(height: 10),
          itemBuilder: (_, __) => const LoadingShimmer(height: 80),
        ),
        error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppTheme.error))),
      ),
    );
  }
}

class _EditionCard extends StatelessWidget {
  final dynamic edition;
  const _EditionCard({required this.edition});

  @override
  Widget build(BuildContext context) {
    final articles = edition.articles ?? [];
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderColor),
      ),
      child: ExpansionTile(
        leading: Container(
          width: 44, height: 44,
          decoration: BoxDecoration(
            color: AppTheme.amber.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Icon(Icons.newspaper_rounded, color: AppTheme.amber, size: 22),
        ),
        title: Text(
          edition.publishDate ?? '',
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Colors.white),
        ),
        subtitle: Text(
          '${articles.length} articles',
          style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
        ),
        iconColor: AppTheme.amber,
        collapsedIconColor: AppTheme.textMuted,
        children: (articles as List).map<Widget>((article) => _ArticleTile(article: article)).toList(),
      ),
    );
  }
}

class _ArticleTile extends StatelessWidget {
  final dynamic article;
  const _ArticleTile({required this.article});

  @override
  Widget build(BuildContext context) {
    final category = article.category ?? 'NATIONAL';
    final color = category == 'BIHAR'
        ? const Color(0xFF10B981)
        : category == 'INTERNATIONAL'
            ? const Color(0xFF3B82F6)
            : AppTheme.amber;

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      title: Text(article.title ?? '',
        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white),
      ),
      subtitle: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(category, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: color)),
          ),
          const SizedBox(width: 6),
          Text(article.readingTime ?? '3 min read',
            style: const TextStyle(fontSize: 10, color: AppTheme.textMuted),
          ),
        ],
      ),
      trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 12, color: AppTheme.textMuted),
      onTap: () => context.push('/current-affairs/article/${article.slug}'),
    );
  }
}
