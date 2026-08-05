import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_html/flutter_html.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../providers/content_providers.dart';
import '../../core/theme/app_theme.dart';
import '../../widgets/loading_shimmer.dart';

class BlogDetailScreen extends ConsumerWidget {
  final String blogId;
  const BlogDetailScreen({super.key, required this.blogId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final blogsAsync = ref.watch(blogsProvider);

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.pop(),
        ),
        title: const Text('Article'),
      ),
      body: blogsAsync.when(
        data: (blogs) {
          final blog = blogs.firstWhere((b) => b.id == blogId, orElse: () => blogs.first);
          return SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Cover Image
                if (blog.displayImage.isNotEmpty)
                  CachedNetworkImage(
                    imageUrl: blog.displayImage.startsWith('http')
                        ? blog.displayImage
                        : 'https://finalattemptias.com/${blog.displayImage}',
                    width: double.infinity,
                    height: 220,
                    fit: BoxFit.cover,
                    errorWidget: (_, __, ___) => Container(
                      height: 220, color: AppTheme.bgCard,
                      child: const Icon(Icons.article_rounded, color: AppTheme.amber, size: 48),
                    ),
                  ),

                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (blog.category != null)
                        Text(blog.category!.toUpperCase(),
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppTheme.amber, letterSpacing: 0.8),
                        ),
                      const SizedBox(height: 8),
                      Text(blog.title,
                        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.white, height: 1.3),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 14,
                            backgroundColor: AppTheme.amber.withOpacity(0.2),
                            child: const Icon(Icons.person_rounded, size: 16, color: AppTheme.amber),
                          ),
                          const SizedBox(width: 8),
                          Text(blog.displayAuthor,
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.textSecondary),
                          ),
                          if (blog.readTime != null) ...[
                            const Text(' · ', style: TextStyle(color: AppTheme.textMuted)),
                            const Icon(Icons.schedule_rounded, size: 12, color: AppTheme.textMuted),
                            const SizedBox(width: 3),
                            Text(blog.readTime!, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                          ],
                        ],
                      ),
                      const Divider(height: 28),
                      Html(
                        data: blog.content,
                        style: {
                          'body': Style(
                            color: AppTheme.textSecondary,
                            fontSize: FontSize(14),
                            lineHeight: const LineHeight(1.7),
                            margin: Margins.zero,
                            padding: HtmlPaddings.zero,
                          ),
                          'h1': Style(color: Colors.white, fontWeight: FontWeight.w800, fontSize: FontSize(20)),
                          'h2': Style(color: Colors.white, fontWeight: FontWeight.w800, fontSize: FontSize(17)),
                          'h3': Style(color: Colors.white, fontWeight: FontWeight.w700, fontSize: FontSize(15)),
                          'strong': Style(color: Colors.white, fontWeight: FontWeight.w700),
                          'a': Style(color: AppTheme.amber, textDecoration: TextDecoration.none),
                          'blockquote': Style(
                            border: const Border(left: BorderSide(color: AppTheme.amber, width: 3)),
                            margin: Margins.only(left: 0, bottom: 8),
                            padding: HtmlPaddings.only(left: 14),
                            color: AppTheme.textMuted,
                            fontStyle: FontStyle.italic,
                          ),
                        },
                      ),
                      const SizedBox(height: 40),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
        loading: () => const LoadingShimmer(height: 600),
        error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppTheme.error))),
      ),
    );
  }
}
