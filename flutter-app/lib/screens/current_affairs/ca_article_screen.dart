import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_html/flutter_html.dart';
import 'package:go_router/go_router.dart';
import '../../providers/current_affairs_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../widgets/loading_shimmer.dart';

class CAArticleScreen extends ConsumerStatefulWidget {
  final String slug;
  final String lang;

  const CAArticleScreen({super.key, required this.slug, this.lang = 'en'});

  @override
  ConsumerState<CAArticleScreen> createState() => _CAArticleScreenState();
}

class _CAArticleScreenState extends ConsumerState<CAArticleScreen> {
  late String _activeLang;

  @override
  void initState() {
    super.initState();
    _activeLang = widget.lang;
  }

  @override
  Widget build(BuildContext context) {
    final articleAsync = ref.watch(caArticleProvider((slug: widget.slug, lang: _activeLang)));
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
        actions: [
          // Language Switcher (ENG / हिंदी)
          Container(
            margin: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
            decoration: BoxDecoration(
              color: AppColors.primaryBlue.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.primaryBlue.withValues(alpha: 0.3)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildLangBtn('en', 'ENG'),
                _buildLangBtn('hi', 'हिंदी'),
              ],
            ),
          ),
        ],
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

                // Featured Cover Image (matching website article view)
                if (article.coverImageUrl != null && article.coverImageUrl!.isNotEmpty) ...[
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: AspectRatio(
                      aspectRatio: 16 / 9,
                      child: Image.network(
                        article.coverImageUrl!,
                        fit: BoxFit.cover,
                        width: double.infinity,
                        errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Summary / Context Box
                if (article.summary.isNotEmpty) ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: cardBg,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: borderCol),
                    ),
                    child: Text(
                      article.summary,
                      style: TextStyle(fontSize: 13, color: AppTheme.textSecondaryOf(context), height: 1.6),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Main Article HTML Content (Full rich content matching website)
                if (article.content != null && article.content!.trim().isNotEmpty)
                  _Section(
                    title: '📄 Detailed Analysis',
                    content: _stripDuplicateTitle(article.content!, article.title, 'Detailed Analysis', article.coverImageUrl),
                  ),

                // Why in News
                if (article.whyInNews != null && article.whyInNews!.trim().isNotEmpty)
                  _Section(
                    title: '📢 Why in News?',
                    content: _stripDuplicateTitle(article.whyInNews!, article.title, 'Why in News', article.coverImageUrl),
                  ),

                // Context
                if (article.context != null && article.context!.trim().isNotEmpty)
                  _Section(
                    title: '📌 Context & Background',
                    content: _stripDuplicateTitle(article.context!, article.title, 'Context', article.coverImageUrl),
                  ),

                // Key Highlights / Points
                if (article.keyHighlights != null && article.keyHighlights!.trim().isNotEmpty)
                  _Section(
                    title: '🔑 Key Points',
                    content: _stripDuplicateTitle(article.keyHighlights!, article.title, 'Key Highlights', article.coverImageUrl),
                  ),

                // Background
                if (article.background != null && article.background!.trim().isNotEmpty)
                  _Section(
                    title: '📖 Background',
                    content: _stripDuplicateTitle(article.background!, article.title, 'Background', article.coverImageUrl),
                  ),

                // Important Facts
                if (article.importantFacts != null && article.importantFacts!.trim().isNotEmpty)
                  _Section(
                    title: '💡 Important Facts for Prelims',
                    content: _stripDuplicateTitle(article.importantFacts!, article.title, 'Important Facts', article.coverImageUrl),
                  ),

                // Exam Relevance
                if (article.examRelevance != null && article.examRelevance!.trim().isNotEmpty)
                  _Section(
                    title: '📝 Exam Relevance (GS / Mains)',
                    content: _stripDuplicateTitle(article.examRelevance!, article.title, 'Exam Relevance', article.coverImageUrl),
                    highlight: true,
                  ),

                // Previous Context
                if (article.previousContext != null && article.previousContext!.trim().isNotEmpty)
                  _Section(
                    title: '⏳ Historical Context',
                    content: _stripDuplicateTitle(article.previousContext!, article.title, 'Historical Context', article.coverImageUrl),
                  ),

                // Way Forward
                if (article.wayForward != null && article.wayForward!.trim().isNotEmpty)
                  _Section(
                    title: '🚀 Way Forward',
                    content: _stripDuplicateTitle(article.wayForward!, article.title, 'Way Forward', article.coverImageUrl),
                  ),

                // Key Takeaways
                if (article.keyTakeaways != null && article.keyTakeaways!.trim().isNotEmpty)
                  _Section(
                    title: '🎯 Key Takeaways',
                    content: _stripDuplicateTitle(article.keyTakeaways!, article.title, 'Key Takeaways', article.coverImageUrl),
                  ),

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
                      child: Text('#$t', style: TextStyle(fontSize: 10, color: AppTheme.textSecondaryOf(context), fontWeight: FontWeight.w600)),
                    )).toList(),
                  ),
                ],
                const SizedBox(height: 100), // Extra padding to clear the bottom navigation dock
              ],
            ),
          );
        },
        loading: () => const LoadingShimmer(height: 500),
        error: (e, _) => Center(child: Text('Error: $e', style: const TextStyle(color: AppColors.error))),
      ),
    );
  }

  Widget _buildLangBtn(String code, String label) {
    final isSel = _activeLang == code;
    return GestureDetector(
      onTap: () => setState(() => _activeLang = code),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: isSel ? AppColors.primaryBlue : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w800,
            color: isSel ? Colors.white : AppColors.primaryBlue,
          ),
        ),
      ),
    );
  }

  String _stripDuplicateTitle(String htmlContent, String articleTitle, [String? sectionName, String? coverImageUrl]) {
    String text = htmlContent.trim();

    // 0. Sanitize single-letter vertical breaks & escapes
    text = text
        .replaceAll(r'\r\n', ' ')
        .replaceAll(r'\n', ' ')
        .replaceAll(r'\r', ' ')
        .replaceAll(r'\t', ' ')
        .replaceAll(r'\"', '"')
        .replaceAll(r"\'", "'")
        .replaceAll(r'\\', r'\');

    // Remove duplicate cover image from HTML
    if (coverImageUrl != null && coverImageUrl.isNotEmpty) {
      final uri = Uri.tryParse(coverImageUrl);
      if (uri != null && uri.pathSegments.isNotEmpty) {
        final filename = uri.pathSegments.last;
        // Strip any image tag that has the cover image filename in its src or data-src
        text = text.replaceAll(RegExp("<img[^>]+(src|data-src|data-lazy-src)=[\"'][^\"']*" + RegExp.escape(filename) + "[^\"']*[\"'][^>]*>", caseSensitive: false), '');
      }
    }

    text = text
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&quot;', '"')
        .replaceAll('&#39;', "'")
        .replaceAll('&amp;', '&')
        .replaceAll('&nbsp;', ' ');

    text = text.replaceAllMapped(
      RegExp(r'([A-Za-z0-9\u0900-\u097F])\s*<br\s*/?>\s*([A-Za-z0-9\u0900-\u097F])', caseSensitive: false),
      (m) => '${m.group(1)}${m.group(2)}',
    );

    text = text.replaceAllMapped(
      RegExp(r'<(p|div|span|h[1-6])[^>]*>\s*([A-Za-z0-9\u0900-\u097F])\s*</\1>', caseSensitive: false),
      (m) => m.group(2)!,
    );

    text = text.replaceAllMapped(
      RegExp(r'([A-Za-z0-9\u0900-\u097F])\s*[\r\n]+\s*([A-Za-z0-9\u0900-\u097F])'),
      (m) => '${m.group(1)}${m.group(2)}',
    );

    text = text.replaceAll(RegExp('style=["\'][^"\']*["\']', caseSensitive: false), '');

    text = text.replaceAll('\n', ' ').replaceAll('\r', ' ').replaceAll(RegExp(r' {2,}'), ' ').trim();

    String cleanTitle = articleTitle.trim().toLowerCase();
    String secName = (sectionName ?? '').replaceAll(RegExp(r'[^\w\s]'), '').trim().toLowerCase();

    bool isDuplicateHeader(String rawText) {
      String innerText = rawText.replaceAll(RegExp(r'<[^>]*>'), '').trim().toLowerCase();
      if (innerText.isEmpty) return false;

      if (innerText == cleanTitle ||
          innerText.contains(cleanTitle) ||
          (cleanTitle.length > 5 && innerText.contains(cleanTitle.substring(0, (cleanTitle.length * 0.6).round())))) {
        return true;
      }

      if (secName.isNotEmpty && (innerText.contains(secName) || secName.contains(innerText))) {
        return true;
      }

      const commonHeaders = [
        'why in news',
        'in news',
        'context',
        'background',
        'detailed analysis',
        'analysis',
        'key highlights',
        'key points',
        'important facts',
        'exam relevance',
        'way forward',
        'key takeaways',
        'खबरों में क्यों',
        'चर्चा में क्यों',
        'विस्तृत विश्लेषण',
        'विश्लेषण',
        'संदर्भ',
        'पृष्ठभूमि',
        'मुख्य बिंदु',
        'महत्वपूर्ण तथ्य',
        'आगे की राह',
      ];

      for (final h in commonHeaders) {
        if (innerText.contains(h)) {
          return true;
        }
      }
      return false;
    }

    // 1. Check leading <h1..6> tag
    RegExp hReg = RegExp(r'^\s*<h[1-6][^>]*>(.*?)</h[1-6]>', caseSensitive: false, dotAll: true);
    Match? hMatch = hReg.firstMatch(text);
    if (hMatch != null && isDuplicateHeader(hMatch.group(1)!)) {
      text = text.substring(hMatch.end).trim();
    }

    // 2. Check leading <p><strong>...</strong></p> or <p><b>...</b></p> tag
    RegExp pReg = RegExp(r'^\s*<p[^>]*>\s*<(strong|b)[^>]*>(.*?)</\1>\s*</p>', caseSensitive: false, dotAll: true);
    Match? pMatch = pReg.firstMatch(text);
    if (pMatch != null && isDuplicateHeader(pMatch.group(2)!)) {
      text = text.substring(pMatch.end).trim();
    }

    return text;
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
    final textSecondary = AppTheme.textSecondaryOf(context);
    final borderCol = AppTheme.borderOf(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (title.isNotEmpty) ...[
          Text(title, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: textPrimary)),
          const SizedBox(height: 8),
        ],
        Html(
          data: content,
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
                String resolvedUrl = src.trim().replaceAll(r'\"', '').replaceAll(r'"', '');
                if (!resolvedUrl.startsWith('http://') && !resolvedUrl.startsWith('https://')) {
                  if (resolvedUrl.startsWith('/')) {
                    resolvedUrl = 'https://finalattemptias.com$resolvedUrl';
                  } else {
                    resolvedUrl = 'https://finalattemptias.com/$resolvedUrl';
                  }
                }
                return Container(
                  width: double.infinity,
                  margin: const EdgeInsets.symmetric(vertical: 10),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.network(
                      resolvedUrl,
                      width: double.infinity,
                      fit: BoxFit.contain,
                      errorBuilder: (_, __, ___) => const SizedBox.shrink(),
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
              fontSize: FontSize(14),
              lineHeight: const LineHeight(1.6),
              margin: Margins.zero,
              padding: HtmlPaddings.zero,
            ),
            'div': Style(
              margin: Margins.zero,
              padding: HtmlPaddings.zero,
            ),
            'span': Style(
              fontSize: FontSize(14),
              lineHeight: const LineHeight(1.6),
            ),
            'p': Style(
              fontSize: FontSize(14),
              lineHeight: const LineHeight(1.6),
              color: textSecondary,
              margin: Margins.only(bottom: 10),
            ),
            'h1': Style(fontSize: FontSize(18), fontWeight: FontWeight.w800, color: textPrimary, margin: Margins.only(top: 8, bottom: 8)),
            'h2': Style(fontSize: FontSize(16), fontWeight: FontWeight.w800, color: textPrimary, margin: Margins.only(top: 8, bottom: 8)),
            'h3': Style(fontSize: FontSize(15), fontWeight: FontWeight.w700, color: textPrimary, margin: Margins.only(top: 6, bottom: 6)),
            'strong': Style(color: textPrimary, fontWeight: FontWeight.w700),
            'b': Style(color: textPrimary, fontWeight: FontWeight.w700),
            'ul': Style(padding: HtmlPaddings.only(left: 16), margin: Margins.only(bottom: 10)),
            'ol': Style(padding: HtmlPaddings.only(left: 16), margin: Margins.only(bottom: 10)),
            'li': Style(color: textSecondary, fontSize: FontSize(13.5), lineHeight: const LineHeight(1.5), margin: Margins.only(bottom: 4)),
            'table': Style(
              border: Border.all(color: borderCol, width: 1),
              margin: Margins.only(top: 8, bottom: 8),
            ),
            'td': Style(padding: HtmlPaddings.all(8), border: Border.all(color: borderCol, width: 0.5)),
            'th': Style(padding: HtmlPaddings.all(8), backgroundColor: borderCol.withValues(alpha: 0.3), fontWeight: FontWeight.bold),
          },
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}

