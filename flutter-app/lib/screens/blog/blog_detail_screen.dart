import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_html/flutter_html.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/services.dart';
import '../../providers/content_providers.dart';
import '../../core/theme/app_theme.dart';
import '../../widgets/loading_shimmer.dart';
import '../../models/blog_model.dart';

class BlogDetailScreen extends ConsumerWidget {
  final String blogId;
  const BlogDetailScreen({super.key, required this.blogId});

  String _resolveUrl(String url) {
    if (url.isEmpty) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return 'https://finalattemptias.com/${url.replaceAll(RegExp(r'^/'), '')}';
  }

  void _shareBlog(BuildContext context, BlogModel blog) {
    final title = blog.title;
    final url = 'https://finalattemptias.com/blog/${blog.slug ?? blog.id}';
    Clipboard.setData(ClipboardData(text: '$title\n\nRead more at: $url'));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Article link copied to clipboard!'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final blogsAsync = ref.watch(blogsProvider);
    final cardBg = AppTheme.cardBgOf(context);
    final textPrimary = AppTheme.textPrimaryOf(context);
    final textSecondary = AppTheme.textSecondaryOf(context);
    final borderCol = AppTheme.borderOf(context);

    return Scaffold(
      backgroundColor: AppTheme.bgOf(context),
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
              context.go('/blog');
            }
          },
        ),
        title: Text(
          'Article',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: textPrimary),
        ),
        actions: [
          blogsAsync.maybeWhen(
            data: (blogs) {
              final blog = blogs.firstWhere(
                (b) => b.id == blogId || b.slug == blogId,
                orElse: () => blogs.isNotEmpty ? blogs.first : const BlogModel(id: '', title: '', content: ''),
              );
              if (blog.id.isEmpty) return const SizedBox.shrink();
              return IconButton(
                icon: const Icon(Icons.share_outlined, size: 20),
                tooltip: 'Share Article',
                color: textPrimary,
                onPressed: () => _shareBlog(context, blog),
              );
            },
            orElse: () => const SizedBox.shrink(),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: blogsAsync.when(
        data: (blogs) {
          final blog = blogs.firstWhere(
            (b) => b.id == blogId || b.slug == blogId,
            orElse: () => blogs.first,
          );

          final imageUrl = _resolveUrl(blog.displayImage);
          final category = (blog.category ?? 'POLITY & GOVERNANCE').toUpperCase();

          return SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. Featured Cover Image with responsive container (no cropping, full aspect preview)
                if (imageUrl.isNotEmpty)
                  Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Theme.of(context).brightness == Brightness.dark
                          ? const Color(0xFF0F172A)
                          : const Color(0xFFF1F5F9),
                      border: Border(bottom: BorderSide(color: borderCol, width: 0.5)),
                    ),
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(
                        minHeight: 180,
                        maxHeight: 280,
                      ),
                      child: CachedNetworkImage(
                        imageUrl: imageUrl,
                        width: double.infinity,
                        fit: BoxFit.contain, // Shows complete image without cropping header/footer/text
                        placeholder: (_, __) => Container(
                          height: 200,
                          color: borderCol.withValues(alpha: 0.1),
                          child: const Center(
                            child: SizedBox(
                              width: 28,
                              height: 28,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                          ),
                        ),
                        errorWidget: (_, __, ___) => Container(
                          height: 180,
                          color: borderCol.withValues(alpha: 0.1),
                          child: Center(
                            child: Icon(Icons.article_rounded, color: AppColors.primaryOf(context), size: 48),
                          ),
                        ),
                      ),
                    ),
                  ),

                // 2. Main Article Content Container
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Category Tag & Read time
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.primaryOf(context).withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: AppColors.primaryOf(context).withValues(alpha: 0.25)),
                            ),
                            child: Text(
                              category,
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                color: AppColors.primaryOf(context),
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                          if (blog.readTime != null)
                            Row(
                              children: [
                                const Icon(Icons.schedule_rounded, size: 12, color: AppTheme.textMuted),
                                const SizedBox(width: 4),
                                Text(
                                  blog.readTime!,
                                  style: const TextStyle(fontSize: 11, color: AppTheme.textMuted, fontWeight: FontWeight.w600),
                                ),
                              ],
                            ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Article Title (adaptive theme text)
                      Text(
                        blog.title,
                        style: TextStyle(
                          fontSize: 21,
                          fontWeight: FontWeight.w900,
                          color: textPrimary,
                          height: 1.35,
                          letterSpacing: -0.3,
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Author & Date Meta bar
                      Row(
                        children: [
                          if (blog.displayAuthorImage.isNotEmpty)
                            ClipRRect(
                              borderRadius: BorderRadius.circular(14),
                              child: CachedNetworkImage(
                                imageUrl: _resolveUrl(blog.displayAuthorImage),
                                width: 28,
                                height: 28,
                                fit: BoxFit.cover,
                                errorWidget: (_, __, ___) => CircleAvatar(
                                  radius: 14,
                                  backgroundColor: AppColors.primaryOf(context).withValues(alpha: 0.15),
                                  child: Icon(Icons.person_rounded, size: 16, color: AppColors.primaryOf(context)),
                                ),
                              ),
                            )
                          else
                            CircleAvatar(
                              radius: 14,
                              backgroundColor: AppColors.primaryOf(context).withValues(alpha: 0.15),
                              child: Icon(Icons.person_rounded, size: 16, color: AppColors.primaryOf(context)),
                            ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  blog.displayAuthor,
                                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: textPrimary),
                                ),
                                if (blog.publishDate != null && blog.publishDate!.isNotEmpty)
                                  Text(
                                    blog.publishDate!,
                                    style: const TextStyle(fontSize: 10.5, color: AppTheme.textMuted, fontWeight: FontWeight.w500),
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      Divider(height: 28, color: borderCol),

                      // Blurb / Executive Summary if present
                      if (blog.blurb != null && blog.blurb!.trim().isNotEmpty) ...[
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: Theme.of(context).brightness == Brightness.dark
                                ? const Color(0xFF1E293B)
                                : const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: borderCol),
                          ),
                          child: Text(
                            blog.blurb!,
                            style: TextStyle(
                              fontSize: 13,
                              color: textSecondary,
                              height: 1.6,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ),
                        const SizedBox(height: 18),
                      ],

                      // 3. Rich HTML Body with Full Responsive Styling & Embedded Images
                      Html(
                        data: blog.content,
                        extensions: [
                          TagExtension(
                            tagsToExtend: {'img'},
                            builder: (extensionContext) {
                              String? src = extensionContext.attributes['src'];
                              if (src == null || src.isEmpty || src.startsWith('data:image/')) {
                                src = extensionContext.attributes['data-src'] ?? 
                                      extensionContext.attributes['data-lazy-src'] ?? 
                                      extensionContext.attributes['data-orig-file'];
                              }
                              if (src == null || src.isEmpty) return const SizedBox.shrink();
                              String resolvedUrl = _resolveUrl(src.trim().replaceAll(r'\"', '').replaceAll(r'"', ''));
                              return Container(
                                width: double.infinity,
                                margin: const EdgeInsets.symmetric(vertical: 12),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(12),
                                  child: CachedNetworkImage(
                                    imageUrl: resolvedUrl,
                                    width: double.infinity,
                                    fit: BoxFit.contain,
                                    errorWidget: (_, __, ___) => const SizedBox.shrink(),
                                  ),
                                ),
                              );
                            },
                          ),
                        ],
                        style: {
                          'html': Style(
                            margin: Margins.zero,
                            padding: HtmlPaddings.zero,
                          ),
                          'body': Style(
                            color: textSecondary,
                            fontSize: FontSize(14.5),
                            lineHeight: const LineHeight(1.68),
                            margin: Margins.zero,
                            padding: HtmlPaddings.zero,
                          ),
                          'div': Style(
                            margin: Margins.zero,
                            padding: HtmlPaddings.zero,
                          ),
                          'p': Style(
                            color: textSecondary,
                            fontSize: FontSize(14.5),
                            lineHeight: const LineHeight(1.68),
                            margin: Margins.only(bottom: 12),
                          ),
                          'span': Style(
                            fontSize: FontSize(14.5),
                            lineHeight: const LineHeight(1.68),
                          ),
                          'h1': Style(
                            fontSize: FontSize(19),
                            fontWeight: FontWeight.w800,
                            color: textPrimary,
                            margin: Margins.only(top: 14, bottom: 8),
                            lineHeight: const LineHeight(1.3),
                          ),
                          'h2': Style(
                            fontSize: FontSize(17),
                            fontWeight: FontWeight.w800,
                            color: textPrimary,
                            margin: Margins.only(top: 14, bottom: 8),
                            lineHeight: const LineHeight(1.3),
                          ),
                          'h3': Style(
                            fontSize: FontSize(15.5),
                            fontWeight: FontWeight.w700,
                            color: textPrimary,
                            margin: Margins.only(top: 10, bottom: 6),
                          ),
                          'strong': Style(
                            color: textPrimary,
                            fontWeight: FontWeight.w700,
                          ),
                          'b': Style(
                            color: textPrimary,
                            fontWeight: FontWeight.w700,
                          ),
                          'a': Style(
                            color: AppColors.primaryOf(context),
                            textDecoration: TextDecoration.none,
                            fontWeight: FontWeight.w600,
                          ),
                          'blockquote': Style(
                            backgroundColor: Theme.of(context).brightness == Brightness.dark
                                ? const Color(0xFF1E293B)
                                : const Color(0xFFF8FAFC),
                            border: Border(left: BorderSide(color: AppColors.primaryOf(context), width: 3.5)),
                            margin: Margins.only(top: 8, bottom: 12),
                            padding: HtmlPaddings.symmetric(horizontal: 14, vertical: 10),
                            color: textSecondary,
                            fontStyle: FontStyle.italic,
                          ),
                          'ul': Style(
                            padding: HtmlPaddings.only(left: 18),
                            margin: Margins.only(bottom: 12),
                          ),
                          'ol': Style(
                            padding: HtmlPaddings.only(left: 18),
                            margin: Margins.only(bottom: 12),
                          ),
                          'li': Style(
                            color: textSecondary,
                            fontSize: FontSize(14),
                            lineHeight: const LineHeight(1.6),
                            margin: Margins.only(bottom: 5),
                          ),
                          'table': Style(
                            border: Border.all(color: borderCol, width: 1),
                            margin: Margins.only(top: 10, bottom: 12),
                          ),
                          'td': Style(
                            padding: HtmlPaddings.all(8),
                            border: Border.all(color: borderCol, width: 0.5),
                            fontSize: FontSize(12.5),
                            color: textSecondary,
                          ),
                          'th': Style(
                            padding: HtmlPaddings.all(8),
                            backgroundColor: borderCol.withValues(alpha: 0.35),
                            fontWeight: FontWeight.bold,
                            fontSize: FontSize(13),
                            color: textPrimary,
                          ),
                        },
                      ),

                      // 4. Tags Section
                      if (blog.tags.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: blog.tags.map((tag) => Container(
                            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                            decoration: BoxDecoration(
                              color: cardBg,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: borderCol),
                            ),
                            child: Text(
                              '#$tag',
                              style: TextStyle(
                                fontSize: 11,
                                color: AppTheme.textMutedOf(context),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          )).toList(),
                        ),
                      ],

                      // 5. Bottom Extra Spacing to clear navigation bar & dock
                      const SizedBox(height: 140),
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
