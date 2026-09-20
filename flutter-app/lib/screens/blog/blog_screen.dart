import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../providers/content_providers.dart';
import '../../core/theme/app_theme.dart';
import '../../widgets/loading_shimmer.dart';
import '../../models/blog_model.dart';

class BlogScreen extends ConsumerStatefulWidget {
  const BlogScreen({super.key});

  @override
  ConsumerState<BlogScreen> createState() => _BlogScreenState();
}

class _BlogScreenState extends ConsumerState<BlogScreen> {
  String _targetLang = 'all'; // 'all', 'english', 'hindi'

  @override
  Widget build(BuildContext context) {
    final blogsAsync = ref.watch(blogsProvider);
    final cardBg = AppTheme.cardBgOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);

    return Scaffold(
      backgroundColor: AppTheme.bgOf(context),
      appBar: AppBar(
        backgroundColor: cardBg,
        elevation: 0.5,
        title: Text(
          'Articles & Strategy Guides',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: textPrimary),
        ),
      ),
      body: Column(
        children: [
          // Filter Tabs (All, English Medium, हिन्दी माध्यम)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: cardBg,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _LangChip(
                    label: 'All Articles',
                    selected: _targetLang == 'all',
                    onTap: () => setState(() => _targetLang = 'all'),
                  ),
                  const SizedBox(width: 8),
                  _LangChip(
                    label: 'English Medium',
                    selected: _targetLang == 'english',
                    onTap: () => setState(() => _targetLang = 'english'),
                  ),
                  const SizedBox(width: 8),
                  _LangChip(
                    label: '🇮🇳 हिन्दी माध्यम (Hindi)',
                    selected: _targetLang == 'hindi',
                    onTap: () => setState(() => _targetLang = 'hindi'),
                  ),
                ],
              ),
            ),
          ),
          const Divider(height: 1),

          Expanded(
            child: blogsAsync.when(
              data: (blogs) {
                var published = blogs.where((b) => b.status != 'draft').toList();
                if (_targetLang == 'english') {
                  published = published.where((b) => b.category?.toLowerCase() != 'hindi').toList();
                } else if (_targetLang == 'hindi') {
                  published = published.where((b) => b.category?.toLowerCase() == 'hindi' || b.title.contains(RegExp(r'[\u0900-\u097F]'))).toList();
                }

                if (published.isEmpty) {
                  return const Center(child: Text('No articles found in this section', style: TextStyle(color: AppTheme.textMuted)));
                }
                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: published.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (_, i) => _BlogCard(blog: published[i]),
                );
              },
              loading: () => ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: 5,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (_, __) => const LoadingShimmer(height: 120),
              ),
              error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppTheme.error))),
            ),
          ),
        ],
      ),
    );
  }
}

class _LangChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _LangChip({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: selected ? AppTheme.primaryBlue : AppTheme.cardBgOf(context),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: selected ? AppTheme.primaryBlue : AppTheme.borderOf(context)),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: selected ? Colors.white : AppTheme.textPrimaryOf(context),
          ),
        ),
      ),
    );
  }
}

class _BlogCard extends StatelessWidget {
  final BlogModel blog;
  const _BlogCard({required this.blog});

  String _resolveUrl(String url) {
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return 'https://finalattemptias.com/${url.replaceAll(RegExp(r'^/'), '')}';
  }

  @override
  Widget build(BuildContext context) {
    final cardBg = AppTheme.cardBgOf(context);
    final borderCol = AppTheme.borderOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);

    return GestureDetector(
      onTap: () => context.push('/blog/${blog.id}'),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: borderCol),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            if (blog.displayImage.isNotEmpty)
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: CachedNetworkImage(
                  imageUrl: _resolveUrl(blog.displayImage),
                  width: 95,
                  height: 95,
                  fit: BoxFit.cover,
                  errorWidget: (_, __, ___) => Container(
                    width: 95,
                    height: 95,
                    color: AppTheme.primaryBlue.withValues(alpha: 0.1),
                    child: const Icon(Icons.article_rounded, color: AppTheme.primaryBlue, size: 28),
                  ),
                ),
              ),

            const SizedBox(width: 12),

            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (blog.category != null)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF59E0B).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        blog.category!.toUpperCase(),
                        style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: Color(0xFFD97706)),
                      ),
                    ),
                  const SizedBox(height: 6),
                  Text(
                    blog.title,
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: textPrimary, height: 1.3),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  Text(
                    blog.preview,
                    style: TextStyle(fontSize: 11, color: AppTheme.textMutedOf(context), height: 1.4),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      // Author Photo Avatar
                      if (blog.displayAuthorImage.isNotEmpty)
                        ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: CachedNetworkImage(
                            imageUrl: _resolveUrl(blog.displayAuthorImage),
                            width: 16,
                            height: 16,
                            fit: BoxFit.cover,
                            errorWidget: (_, __, ___) => const Icon(Icons.person_rounded, size: 14, color: AppTheme.primaryBlue),
                          ),
                        )
                      else
                        const Icon(Icons.person_rounded, size: 14, color: AppTheme.primaryBlue),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          blog.displayAuthor,
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: textPrimary),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (blog.readTime != null) ...[
                        Text(' • ', style: TextStyle(color: AppTheme.textMutedOf(context))),
                        Text(blog.readTime!, style: TextStyle(fontSize: 10, color: AppTheme.textMutedOf(context))),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
