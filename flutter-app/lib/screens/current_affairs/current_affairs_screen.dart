import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/current_affairs_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/localization/app_localizations.dart';
import '../../widgets/loading_shimmer.dart';
import '../../widgets/top_header_actions.dart';

class CurrentAffairsScreen extends ConsumerWidget {
  const CurrentAffairsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final loc = ref.watch(appLocalizationsProvider);
    final editionsAsync = ref.watch(caEditionsProvider);
    final bg = AppTheme.bgOf(context);
    final cardBg = AppTheme.cardBgOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);

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
          loc.tr('daily_current_affairs'),
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: textPrimary,
          ),
        ),
        actions: const [
          TopHeaderActions(),
          SizedBox(width: 8),
        ],
      ),
      body: Stack(
        children: [
          Positioned(
            top: -50,
            right: -50,
            child: Container(
              width: 180,
              height: 180,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Color(0xFFE8F1FF),
              ),
            ),
          ),
          editionsAsync.when(
            data: (editions) {
              if (editions.isEmpty) {
                return const Center(
                  child: Text('No editions available', style: TextStyle(color: AppColors.textMuted)),
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
            error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppColors.error))),
          ),
        ],
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
    final cardBg = AppTheme.cardBgOf(context);
    final borderCol = AppTheme.borderOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);

    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(16),
      clipBehavior: Clip.antiAlias,
      child: Container(
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: borderCol),
        ),
        child: ExpansionTile(
          shape: const Border(),
          collapsedShape: const Border(),
          leading: Container(
            width: 44, height: 44,
            decoration: BoxDecoration(
              color: AppColors.primaryBlue.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.newspaper_rounded, color: AppColors.primaryBlue, size: 22),
          ),
          title: Text(
            edition.publishDate ?? '',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: textPrimary),
          ),
          subtitle: Text(
            '${articles.length} articles',
            style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
          ),
          iconColor: AppColors.primaryBlue,
          collapsedIconColor: AppColors.textSecondary,
          children: (articles as List).map<Widget>((article) => _ArticleTile(article: article)).toList(),
        ),
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
            : AppColors.primaryBlue;
    final textPrimary = AppTheme.textPrimaryOf(context);

    return Material(
      color: Colors.transparent,
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        title: Text(
          article.title ?? '',
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: textPrimary),
        ),
        subtitle: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(category, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: color)),
            ),
            const SizedBox(width: 6),
            Text(
              article.readingTime ?? '3 min read',
              style: const TextStyle(fontSize: 10, color: AppColors.textSecondary),
            ),
          ],
        ),
        trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 12, color: AppColors.textSecondary),
        onTap: () => context.push('/current-affairs/article/${article.slug}'),
      ),
    );
  }
}


