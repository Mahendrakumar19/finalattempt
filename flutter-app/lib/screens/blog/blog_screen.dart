import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../providers/content_providers.dart';
import '../../core/theme/app_theme.dart';
import '../../widgets/loading_shimmer.dart';
import '../../models/blog_model.dart';

class BlogScreen extends ConsumerWidget {
  const BlogScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final blogsAsync = ref.watch(blogsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Articles & Blogs')),
      body: blogsAsync.when(
        data: (blogs) {
          final published = blogs.where((b) => b.status != 'draft').toList();
          if (published.isEmpty) {
            return const Center(child: Text('No articles yet', style: TextStyle(color: AppTheme.textMuted)));
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
    );
  }
}

class _BlogCard extends StatelessWidget {
  final BlogModel blog;
  const _BlogCard({required this.blog});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/blog/${blog.id}'),
      child: Container(
        decoration: BoxDecoration(
          color: AppTheme.bgCard,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.borderColor),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            if (blog.displayImage.isNotEmpty)
              ClipRRect(
                borderRadius: const BorderRadius.horizontal(left: Radius.circular(16)),
                child: CachedNetworkImage(
                  imageUrl: blog.displayImage.startsWith('http')
                      ? blog.displayImage
                      : 'https://finalattemptias.com/${blog.displayImage}',
                  width: 100,
                  height: 110,
                  fit: BoxFit.cover,
                  errorWidget: (_, __, ___) => Container(
                    width: 100, height: 110,
                    color: AppTheme.bgCardLight,
                    child: const Icon(Icons.article_rounded, color: AppTheme.textMuted, size: 28),
                  ),
                ),
              ),

            // Content
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (blog.category != null)
                      Text(blog.category!.toUpperCase(),
                        style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: AppTheme.amber, letterSpacing: 0.8),
                      ),
                    const SizedBox(height: 4),
                    Text(blog.title,
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    Text(blog.preview,
                      style: const TextStyle(fontSize: 11, color: AppTheme.textMuted, height: 1.4),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Text(blog.displayAuthor,
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppTheme.textSecondary),
                        ),
                        if (blog.readTime != null) ...[
                          Text(' · ', style: TextStyle(color: AppTheme.textMuted.withOpacity(0.5))),
                          Text(blog.readTime!, style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
